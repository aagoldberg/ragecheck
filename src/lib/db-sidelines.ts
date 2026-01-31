/**
 * SideLines Database Tables
 *
 * Tables for storing political discourse dynamics data:
 * - sidelines_events: Event definitions with keywords and time windows
 * - sidelines_posts: Collected posts with arousal scores
 * - sidelines_users: Users within event subgraphs
 * - sidelines_interactions: Edges (reply, quote, repost) between users
 * - sidelines_daily_metrics: Computed daily metrics (JSONB)
 * - sidelines_cluster_assignments: Leiden community assignments per day
 * - sidelines_user_features: Per-user per-day feature vectors
 */

import { getDb, withRetry } from "./db";
import type {
  SidelinesEvent,
  SidelinesPost,
  SidelinesUser,
  SidelinesInteraction,
  EventStatus,
  InteractionType,
  ArousalBreakdown,
  DailyMetrics,
  ConfidenceLevel,
  ClusterAssignment,
  UserFeatures,
} from "./sidelines/types";

// =============================================================================
// INITIALIZATION
// =============================================================================

export async function initSidelinesTables() {
  await getDb()`
    CREATE TABLE IF NOT EXISTS sidelines_events (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      platform VARCHAR(20) NOT NULL DEFAULT 'bluesky',
      keywords TEXT[] NOT NULL DEFAULT '{}',
      seed_post_uris TEXT[] NOT NULL DEFAULT '{}',
      start_ts TIMESTAMPTZ NOT NULL,
      end_ts TIMESTAMPTZ NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await getDb()`
    CREATE TABLE IF NOT EXISTS sidelines_posts (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES sidelines_events(id) ON DELETE CASCADE,
      platform VARCHAR(20) NOT NULL DEFAULT 'bluesky',
      uri TEXT NOT NULL,
      author_did TEXT NOT NULL,
      author_handle TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      raw_json JSONB,
      arousal_score DECIMAL(5,4),
      arousal_breakdown JSONB,
      UNIQUE(event_id, uri)
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_sidelines_posts_event ON sidelines_posts(event_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_sidelines_posts_author ON sidelines_posts(event_id, author_did)`;

  await getDb()`
    CREATE TABLE IF NOT EXISTS sidelines_users (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES sidelines_events(id) ON DELETE CASCADE,
      platform VARCHAR(20) NOT NULL DEFAULT 'bluesky',
      did TEXT NOT NULL,
      handle TEXT NOT NULL DEFAULT '',
      display_name TEXT,
      follower_count INTEGER,
      UNIQUE(event_id, did)
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_sidelines_users_event ON sidelines_users(event_id)`;

  await getDb()`
    CREATE TABLE IF NOT EXISTS sidelines_interactions (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES sidelines_events(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL,
      src_user_id INTEGER NOT NULL REFERENCES sidelines_users(id) ON DELETE CASCADE,
      dst_user_id INTEGER NOT NULL REFERENCES sidelines_users(id) ON DELETE CASCADE,
      post_uri TEXT NOT NULL,
      parent_uri TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      weight DECIMAL(5,2) NOT NULL DEFAULT 1.0
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_sidelines_interactions_event ON sidelines_interactions(event_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_sidelines_interactions_src ON sidelines_interactions(src_user_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_sidelines_interactions_dst ON sidelines_interactions(dst_user_id)`;

  await getDb()`
    CREATE TABLE IF NOT EXISTS sidelines_daily_metrics (
      event_id INTEGER NOT NULL REFERENCES sidelines_events(id) ON DELETE CASCADE,
      day DATE NOT NULL,
      metrics_json JSONB NOT NULL,
      confidence VARCHAR(5) NOT NULL DEFAULT 'LOW',
      UNIQUE(event_id, day)
    )
  `;

  await getDb()`
    CREATE TABLE IF NOT EXISTS sidelines_cluster_assignments (
      event_id INTEGER NOT NULL REFERENCES sidelines_events(id) ON DELETE CASCADE,
      day DATE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES sidelines_users(id) ON DELETE CASCADE,
      cluster_id INTEGER NOT NULL,
      score DECIMAL(5,4) NOT NULL DEFAULT 0,
      UNIQUE(event_id, day, user_id)
    )
  `;

  await getDb()`
    CREATE TABLE IF NOT EXISTS sidelines_user_features (
      event_id INTEGER NOT NULL REFERENCES sidelines_events(id) ON DELETE CASCADE,
      day DATE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES sidelines_users(id) ON DELETE CASCADE,
      arousal_mean DECIMAL(5,4) NOT NULL DEFAULT 0,
      arousal_p95 DECIMAL(5,4) NOT NULL DEFAULT 0,
      post_count INTEGER NOT NULL DEFAULT 0,
      in_degree INTEGER NOT NULL DEFAULT 0,
      out_degree INTEGER NOT NULL DEFAULT 0,
      betweenness DECIMAL(10,6) NOT NULL DEFAULT 0,
      UNIQUE(event_id, day, user_id)
    )
  `;

  // Shared-follows table for co-follow community detection
  await getDb()`
    CREATE TABLE IF NOT EXISTS sidelines_user_follows (
      event_id INTEGER NOT NULL REFERENCES sidelines_events(id) ON DELETE CASCADE,
      user_did TEXT NOT NULL,
      follows_did TEXT NOT NULL,
      follows_handle TEXT DEFAULT '',
      UNIQUE(event_id, user_did, follows_did)
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_follows_event_user ON sidelines_user_follows(event_id, user_did)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_follows_event_target ON sidelines_user_follows(event_id, follows_did)`;

  // Add follows_fetched_at column to sidelines_users (safe to run multiple times)
  await getDb()`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sidelines_users' AND column_name = 'follows_fetched_at'
      ) THEN
        ALTER TABLE sidelines_users ADD COLUMN follows_fetched_at TIMESTAMPTZ;
      END IF;
    END $$
  `;

  // =========================================================================
  // GLOBAL BLUESKY COMMUNITY MAP TABLES
  // =========================================================================

  // Global follow relationships (not event-scoped — persists across events)
  await getDb()`
    CREATE TABLE IF NOT EXISTS bluesky_follows (
      user_did TEXT NOT NULL,
      follows_did TEXT NOT NULL,
      follows_handle TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_did, follows_did)
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_bf_user ON bluesky_follows(user_did)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_bf_target ON bluesky_follows(follows_did)`;

  // Track which users have had their follows backfilled
  await getDb()`
    CREATE TABLE IF NOT EXISTS bluesky_follows_fetched (
      user_did TEXT PRIMARY KEY,
      fetched_at TIMESTAMPTZ DEFAULT NOW(),
      follow_count INTEGER DEFAULT 0
    )
  `;

  // Tracked users (starter pack members, event participants, etc.)
  await getDb()`
    CREATE TABLE IF NOT EXISTS bluesky_tracked_users (
      did TEXT PRIMARY KEY,
      handle TEXT DEFAULT '',
      source TEXT NOT NULL DEFAULT 'event',
      added_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Global community definitions (from Leiden on full follow graph)
  await getDb()`
    CREATE TABLE IF NOT EXISTS bluesky_communities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      top_followed_handles TEXT[] DEFAULT '{}',
      member_count INTEGER DEFAULT 0,
      computed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Community membership (each user belongs to one community)
  await getDb()`
    CREATE TABLE IF NOT EXISTS bluesky_community_members (
      user_did TEXT NOT NULL,
      community_id INTEGER NOT NULL REFERENCES bluesky_communities(id) ON DELETE CASCADE,
      computed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_did)
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_bcm_community ON bluesky_community_members(community_id)`;

  // Global posts from tracked users (collected via Jetstream)
  await getDb()`
    CREATE TABLE IF NOT EXISTS bluesky_posts (
      id BIGSERIAL PRIMARY KEY,
      author_did TEXT NOT NULL,
      uri TEXT NOT NULL UNIQUE,
      text TEXT NOT NULL DEFAULT '',
      reply_parent_uri TEXT,
      reply_root_uri TEXT,
      quote_uri TEXT,
      langs TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL,
      indexed_at TIMESTAMPTZ DEFAULT NOW(),
      arousal_score REAL,
      arousal_breakdown JSONB
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_bp_author ON bluesky_posts(author_did)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_bp_created ON bluesky_posts(created_at)`;
}

// =============================================================================
// EVENTS
// =============================================================================

export async function createEvent(event: {
  name: string;
  description: string;
  platform: string;
  keywords: string[];
  seedPostUris: string[];
  startTs: Date;
  endTs: Date;
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO sidelines_events (
        name, description, platform, keywords, seed_post_uris, start_ts, end_ts
      ) VALUES (
        ${event.name},
        ${event.description},
        ${event.platform},
        ${event.keywords},
        ${event.seedPostUris},
        ${event.startTs.toISOString()},
        ${event.endTs.toISOString()}
      )
      RETURNING id
    `;
  });
  return row.id;
}

export async function getEvent(id: number): Promise<SidelinesEvent | null> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM sidelines_events WHERE id = ${id}
    `;
  });
  if (!row) return null;
  return mapEvent(row);
}

export async function listEvents(): Promise<
  (SidelinesEvent & { postCount: number; userCount: number; edgeCount: number })[]
> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT e.*,
        COALESCE(p.cnt, 0) as post_count,
        COALESCE(u.cnt, 0) as user_count,
        COALESCE(i.cnt, 0) as edge_count
      FROM sidelines_events e
      LEFT JOIN (SELECT event_id, COUNT(*) as cnt FROM sidelines_posts GROUP BY event_id) p ON p.event_id = e.id
      LEFT JOIN (SELECT event_id, COUNT(*) as cnt FROM sidelines_users GROUP BY event_id) u ON u.event_id = e.id
      LEFT JOIN (SELECT event_id, COUNT(*) as cnt FROM sidelines_interactions GROUP BY event_id) i ON i.event_id = e.id
      ORDER BY e.created_at DESC
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    ...mapEvent(row),
    postCount: parseInt(row.post_count) || 0,
    userCount: parseInt(row.user_count) || 0,
    edgeCount: parseInt(row.edge_count) || 0,
  }));
}

export async function updateEventStatus(
  id: number,
  status: EventStatus
): Promise<void> {
  await withRetry(async () => {
    await getDb()`
      UPDATE sidelines_events SET status = ${status} WHERE id = ${id}
    `;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(row: any): SidelinesEvent {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    platform: row.platform,
    keywords: row.keywords || [],
    seedPostUris: row.seed_post_uris || [],
    startTs: new Date(row.start_ts),
    endTs: new Date(row.end_ts),
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

// =============================================================================
// POSTS
// =============================================================================

export async function upsertPost(post: {
  eventId: number;
  platform: string;
  uri: string;
  authorDid: string;
  authorHandle: string;
  text: string;
  createdAt: Date;
  rawJson?: Record<string, unknown>;
  arousalScore?: number;
  arousalBreakdown?: ArousalBreakdown;
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO sidelines_posts (
        event_id, platform, uri, author_did, author_handle, text,
        created_at, raw_json, arousal_score, arousal_breakdown
      ) VALUES (
        ${post.eventId}, ${post.platform}, ${post.uri},
        ${post.authorDid}, ${post.authorHandle}, ${post.text},
        ${post.createdAt.toISOString()},
        ${post.rawJson ? JSON.stringify(post.rawJson) : null}::jsonb,
        ${post.arousalScore ?? null},
        ${post.arousalBreakdown ? JSON.stringify(post.arousalBreakdown) : null}::jsonb
      )
      ON CONFLICT (event_id, uri) DO UPDATE SET
        arousal_score = COALESCE(EXCLUDED.arousal_score, sidelines_posts.arousal_score),
        arousal_breakdown = COALESCE(EXCLUDED.arousal_breakdown, sidelines_posts.arousal_breakdown)
      RETURNING id
    `;
  });
  return row.id;
}

export async function getPostsByEvent(
  eventId: number,
  limit: number = 1000
): Promise<SidelinesPost[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM sidelines_posts
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  });
  return rows.map(mapPost);
}

export async function getTopPostsByArousal(
  eventId: number,
  limit: number = 50
): Promise<(SidelinesPost & { clusterId?: number })[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT p.*, ca.cluster_id
      FROM sidelines_posts p
      LEFT JOIN sidelines_users u ON u.event_id = p.event_id AND u.did = p.author_did
      LEFT JOIN sidelines_cluster_assignments ca ON ca.user_id = u.id AND ca.event_id = p.event_id
        AND ca.day = (SELECT MAX(day) FROM sidelines_cluster_assignments WHERE event_id = p.event_id)
      WHERE p.event_id = ${eventId} AND p.arousal_score IS NOT NULL
      ORDER BY p.arousal_score DESC
      LIMIT ${limit}
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    ...mapPost(row),
    clusterId: row.cluster_id != null ? parseInt(row.cluster_id) : undefined,
  }));
}

export async function getPostCount(eventId: number): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT COUNT(*) as cnt FROM sidelines_posts WHERE event_id = ${eventId}
    `;
  });
  return parseInt(row.cnt) || 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(row: any): SidelinesPost {
  return {
    id: row.id,
    eventId: row.event_id,
    platform: row.platform,
    uri: row.uri,
    authorDid: row.author_did,
    authorHandle: row.author_handle,
    text: row.text,
    createdAt: new Date(row.created_at),
    rawJson: row.raw_json,
    arousalScore: row.arousal_score ? parseFloat(row.arousal_score) : null,
    arousalBreakdown: row.arousal_breakdown,
  };
}

// =============================================================================
// USERS
// =============================================================================

export async function upsertUser(user: {
  eventId: number;
  platform: string;
  did: string;
  handle: string;
  displayName?: string;
  followerCount?: number;
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO sidelines_users (
        event_id, platform, did, handle, display_name, follower_count
      ) VALUES (
        ${user.eventId}, ${user.platform}, ${user.did},
        ${user.handle}, ${user.displayName || null}, ${user.followerCount ?? null}
      )
      ON CONFLICT (event_id, did) DO UPDATE SET
        handle = COALESCE(EXCLUDED.handle, sidelines_users.handle),
        display_name = COALESCE(EXCLUDED.display_name, sidelines_users.display_name),
        follower_count = COALESCE(EXCLUDED.follower_count, sidelines_users.follower_count)
      RETURNING id
    `;
  });
  return row.id;
}

export async function getUsersByEvent(
  eventId: number
): Promise<SidelinesUser[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM sidelines_users WHERE event_id = ${eventId}
      ORDER BY id
    `;
  });
  return rows.map(mapUser);
}

export async function getUsersByIds(
  eventId: number,
  userIds: number[]
): Promise<SidelinesUser[]> {
  if (userIds.length === 0) return [];
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM sidelines_users
      WHERE event_id = ${eventId} AND id = ANY(${userIds})
    `;
  });
  return rows.map(mapUser);
}

export async function getUserCount(eventId: number): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT COUNT(*) as cnt FROM sidelines_users WHERE event_id = ${eventId}
    `;
  });
  return parseInt(row.cnt) || 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(row: any): SidelinesUser {
  return {
    id: row.id,
    eventId: row.event_id,
    platform: row.platform,
    did: row.did,
    handle: row.handle,
    displayName: row.display_name,
    followerCount: row.follower_count,
  };
}

// =============================================================================
// INTERACTIONS
// =============================================================================

export async function createInteraction(interaction: {
  eventId: number;
  type: InteractionType;
  srcUserId: number;
  dstUserId: number;
  postUri: string;
  parentUri?: string;
  createdAt: Date;
  weight?: number;
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO sidelines_interactions (
        event_id, type, src_user_id, dst_user_id, post_uri,
        parent_uri, created_at, weight
      ) VALUES (
        ${interaction.eventId}, ${interaction.type},
        ${interaction.srcUserId}, ${interaction.dstUserId},
        ${interaction.postUri}, ${interaction.parentUri || null},
        ${interaction.createdAt.toISOString()},
        ${interaction.weight ?? 1.0}
      )
      RETURNING id
    `;
  });
  return row.id;
}

export async function getInteractionsByEvent(
  eventId: number
): Promise<SidelinesInteraction[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM sidelines_interactions WHERE event_id = ${eventId}
      ORDER BY created_at
    `;
  });
  return rows.map(mapInteraction);
}

export async function getEdgeCount(eventId: number): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT COUNT(*) as cnt FROM sidelines_interactions WHERE event_id = ${eventId}
    `;
  });
  return parseInt(row.cnt) || 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInteraction(row: any): SidelinesInteraction {
  return {
    id: row.id,
    eventId: row.event_id,
    type: row.type,
    srcUserId: row.src_user_id,
    dstUserId: row.dst_user_id,
    postUri: row.post_uri,
    parentUri: row.parent_uri,
    createdAt: new Date(row.created_at),
    weight: parseFloat(row.weight),
  };
}

// =============================================================================
// DAILY METRICS
// =============================================================================

export async function upsertDailyMetrics(payload: {
  eventId: number;
  day: string;
  metrics: DailyMetrics;
  confidence: ConfidenceLevel;
}): Promise<void> {
  await withRetry(async () => {
    await getDb()`
      INSERT INTO sidelines_daily_metrics (event_id, day, metrics_json, confidence)
      VALUES (
        ${payload.eventId},
        ${payload.day},
        ${JSON.stringify(payload.metrics)}::jsonb,
        ${payload.confidence}
      )
      ON CONFLICT (event_id, day) DO UPDATE SET
        metrics_json = EXCLUDED.metrics_json,
        confidence = EXCLUDED.confidence
    `;
  });
}

export async function getDailyMetrics(
  eventId: number,
  days: number = 30
): Promise<{ day: string; metrics: DailyMetrics; confidence: ConfidenceLevel }[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM sidelines_daily_metrics
      WHERE event_id = ${eventId}
      ORDER BY day DESC
      LIMIT ${days}
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    day: row.day instanceof Date ? row.day.toISOString().split("T")[0] : String(row.day),
    metrics: row.metrics_json,
    confidence: row.confidence,
  }));
}

export async function getLatestDailyMetrics(
  eventId: number
): Promise<{ day: string; metrics: DailyMetrics; confidence: ConfidenceLevel } | null> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM sidelines_daily_metrics
      WHERE event_id = ${eventId}
      ORDER BY day DESC
      LIMIT 1
    `;
  });
  if (!row) return null;
  return {
    day: row.day instanceof Date ? row.day.toISOString().split("T")[0] : String(row.day),
    metrics: row.metrics_json,
    confidence: row.confidence,
  };
}

// =============================================================================
// CLUSTER ASSIGNMENTS
// =============================================================================

export async function upsertClusterAssignments(
  assignments: ClusterAssignment[]
): Promise<void> {
  for (const a of assignments) {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO sidelines_cluster_assignments (event_id, day, user_id, cluster_id, score)
        VALUES (${a.eventId}, ${a.day}, ${a.userId}, ${a.clusterId}, ${a.score})
        ON CONFLICT (event_id, day, user_id) DO UPDATE SET
          cluster_id = EXCLUDED.cluster_id,
          score = EXCLUDED.score
      `;
    });
  }
}

export async function getClusterAssignments(
  eventId: number,
  day: string
): Promise<ClusterAssignment[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT ca.*, u.handle, u.display_name
      FROM sidelines_cluster_assignments ca
      JOIN sidelines_users u ON u.id = ca.user_id
      WHERE ca.event_id = ${eventId} AND ca.day = ${day}
      ORDER BY ca.cluster_id, ca.score DESC
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    eventId: row.event_id,
    day: row.day instanceof Date ? row.day.toISOString().split("T")[0] : String(row.day),
    userId: row.user_id,
    clusterId: row.cluster_id,
    score: parseFloat(row.score),
    handle: row.handle,
    displayName: row.display_name,
  }));
}

// =============================================================================
// USER FEATURES
// =============================================================================

export async function upsertUserFeatures(
  features: UserFeatures[]
): Promise<void> {
  for (const f of features) {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO sidelines_user_features (
          event_id, day, user_id, arousal_mean, arousal_p95,
          post_count, in_degree, out_degree, betweenness
        ) VALUES (
          ${f.eventId}, ${f.day}, ${f.userId},
          ${f.arousalMean}, ${f.arousalP95},
          ${f.postCount}, ${f.inDegree}, ${f.outDegree}, ${f.betweenness}
        )
        ON CONFLICT (event_id, day, user_id) DO UPDATE SET
          arousal_mean = EXCLUDED.arousal_mean,
          arousal_p95 = EXCLUDED.arousal_p95,
          post_count = EXCLUDED.post_count,
          in_degree = EXCLUDED.in_degree,
          out_degree = EXCLUDED.out_degree,
          betweenness = EXCLUDED.betweenness
      `;
    });
  }
}

export async function getUserFeatures(
  eventId: number,
  day: string
): Promise<UserFeatures[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM sidelines_user_features
      WHERE event_id = ${eventId} AND day = ${day}
      ORDER BY betweenness DESC
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    eventId: row.event_id,
    day: row.day instanceof Date ? row.day.toISOString().split("T")[0] : String(row.day),
    userId: row.user_id,
    arousalMean: parseFloat(row.arousal_mean),
    arousalP95: parseFloat(row.arousal_p95),
    postCount: row.post_count,
    inDegree: row.in_degree,
    outDegree: row.out_degree,
    betweenness: parseFloat(row.betweenness),
  }));
}

// =============================================================================
// USER FOLLOWS (Shared-follows community detection)
// =============================================================================

export async function bulkInsertFollows(
  eventId: number,
  rows: { userDid: string; followsDid: string; followsHandle: string }[]
): Promise<void> {
  if (rows.length === 0) return;
  // Insert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const values = batch.map(
      (r) => `(${eventId}, '${r.userDid.replace(/'/g, "''")}', '${r.followsDid.replace(/'/g, "''")}', '${r.followsHandle.replace(/'/g, "''")}')`
    );
    await withRetry(async () => {
      await getDb().unsafe(
        `INSERT INTO sidelines_user_follows (event_id, user_did, follows_did, follows_handle)
         VALUES ${values.join(",")}
         ON CONFLICT (event_id, user_did, follows_did) DO NOTHING`
      );
    });
  }
}

export async function markUserFollowsFetched(
  eventId: number,
  userDid: string
): Promise<void> {
  await withRetry(async () => {
    await getDb()`
      UPDATE sidelines_users
      SET follows_fetched_at = NOW()
      WHERE event_id = ${eventId} AND did = ${userDid}
    `;
  });
}

export async function getUsersWithoutFollows(
  eventId: number,
  limit: number
): Promise<{ did: string; handle: string }[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT did, handle FROM sidelines_users
      WHERE event_id = ${eventId} AND follows_fetched_at IS NULL
      ORDER BY id
      LIMIT ${limit}
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({ did: row.did, handle: row.handle }));
}

export async function getFollowsFetchProgress(
  eventId: number
): Promise<{ total: number; fetched: number }> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT
        COUNT(*) as total,
        COUNT(follows_fetched_at) as fetched
      FROM sidelines_users
      WHERE event_id = ${eventId}
    `;
  });
  return {
    total: parseInt(row.total) || 0,
    fetched: parseInt(row.fetched) || 0,
  };
}

// =============================================================================
// GLOBAL BLUESKY COMMUNITY MAP FUNCTIONS
// =============================================================================

export async function bulkInsertGlobalFollows(
  rows: { userDid: string; followsDid: string; followsHandle: string }[]
): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const values = batch.map(
      (r) =>
        `('${r.userDid.replace(/'/g, "''")}', '${r.followsDid.replace(/'/g, "''")}', '${r.followsHandle.replace(/'/g, "''")}')`
    );
    await withRetry(async () => {
      await getDb().unsafe(
        `INSERT INTO bluesky_follows (user_did, follows_did, follows_handle)
         VALUES ${values.join(",")}
         ON CONFLICT (user_did, follows_did) DO NOTHING`
      );
    });
  }
}

export async function markGlobalFollowsFetched(
  did: string,
  followCount: number
): Promise<void> {
  await withRetry(async () => {
    await getDb()`
      INSERT INTO bluesky_follows_fetched (user_did, fetched_at, follow_count)
      VALUES (${did}, NOW(), ${followCount})
      ON CONFLICT (user_did) DO UPDATE SET
        fetched_at = NOW(),
        follow_count = EXCLUDED.follow_count
    `;
  });
}

export async function getUnfetchedDids(
  dids: string[],
  limit: number
): Promise<string[]> {
  if (dids.length === 0) return [];
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT unnest(${dids}::text[]) AS did
      EXCEPT
      SELECT user_did FROM bluesky_follows_fetched
      LIMIT ${limit}
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => r.did);
}

export async function getGlobalFollowsFetchProgress(
  dids: string[]
): Promise<{ total: number; fetched: number }> {
  if (dids.length === 0) return { total: 0, fetched: 0 };
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT
        ${dids.length} as total,
        COUNT(*) as fetched
      FROM bluesky_follows_fetched
      WHERE user_did = ANY(${dids})
    `;
  });
  return {
    total: parseInt(row.total) || 0,
    fetched: parseInt(row.fetched) || 0,
  };
}

export async function getAllGlobalFollows(): Promise<
  { userDid: string; followsDid: string; followsHandle: string }[]
> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT user_did, follows_did, follows_handle
      FROM bluesky_follows
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({
    userDid: r.user_did,
    followsDid: r.follows_did,
    followsHandle: r.follows_handle,
  }));
}

export async function upsertCommunities(
  communities: {
    name: string;
    description: string;
    topFollowedHandles: string[];
    memberCount: number;
  }[]
): Promise<number[]> {
  const ids: number[] = [];
  // Clear old communities first (full recompute)
  await withRetry(async () => {
    await getDb()`DELETE FROM bluesky_community_members`;
    await getDb()`DELETE FROM bluesky_communities`;
  });
  for (const c of communities) {
    const [row] = await withRetry(async () => {
      return await getDb()`
        INSERT INTO bluesky_communities (name, description, top_followed_handles, member_count, computed_at)
        VALUES (${c.name}, ${c.description}, ${c.topFollowedHandles}, ${c.memberCount}, NOW())
        RETURNING id
      `;
    });
    ids.push(row.id);
  }
  return ids;
}

export async function upsertCommunityMembers(
  assignments: { userDid: string; communityId: number }[]
): Promise<void> {
  if (assignments.length === 0) return;
  for (let i = 0; i < assignments.length; i += 500) {
    const batch = assignments.slice(i, i + 500);
    const values = batch.map(
      (a) => `('${a.userDid.replace(/'/g, "''")}', ${a.communityId})`
    );
    await withRetry(async () => {
      await getDb().unsafe(
        `INSERT INTO bluesky_community_members (user_did, community_id, computed_at)
         VALUES ${values.join(",")}
         ON CONFLICT (user_did) DO UPDATE SET
           community_id = EXCLUDED.community_id,
           computed_at = NOW()`
      );
    });
  }
}

export async function getCommunityAssignmentsForDids(
  dids: string[]
): Promise<
  {
    userDid: string;
    communityId: number;
    communityName: string;
    communityDescription: string;
  }[]
> {
  if (dids.length === 0) return [];
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT
        m.user_did,
        m.community_id,
        c.name AS community_name,
        c.description AS community_description
      FROM bluesky_community_members m
      JOIN bluesky_communities c ON c.id = m.community_id
      WHERE m.user_did = ANY(${dids})
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({
    userDid: r.user_did,
    communityId: r.community_id,
    communityName: r.community_name,
    communityDescription: r.community_description,
  }));
}

export async function addTrackedUsers(
  users: { did: string; handle: string; source: string }[]
): Promise<void> {
  if (users.length === 0) return;
  for (let i = 0; i < users.length; i += 500) {
    const batch = users.slice(i, i + 500);
    const values = batch.map(
      (u) =>
        `('${u.did.replace(/'/g, "''")}', '${u.handle.replace(/'/g, "''")}', '${u.source.replace(/'/g, "''")}')`
    );
    await withRetry(async () => {
      await getDb().unsafe(
        `INSERT INTO bluesky_tracked_users (did, handle, source)
         VALUES ${values.join(",")}
         ON CONFLICT (did) DO NOTHING`
      );
    });
  }
}

export async function getTrackedUserDids(): Promise<string[]> {
  const rows = await withRetry(async () => {
    return await getDb()`SELECT did FROM bluesky_tracked_users`;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => r.did);
}

export async function getGlobalCommunities(): Promise<
  {
    id: number;
    name: string;
    description: string;
    topFollowedHandles: string[];
    memberCount: number;
  }[]
> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM bluesky_communities ORDER BY member_count DESC
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    topFollowedHandles: r.top_followed_handles,
    memberCount: r.member_count,
  }));
}

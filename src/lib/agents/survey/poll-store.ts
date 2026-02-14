// Persistent Poll Database
// Stores full cross-tab polling data in a dedicated Postgres table.
// Polls are reusable across stories and refreshes — a poll about ICE found
// today may be relevant to next week's DHS story.

import { getDb, withRetry } from "@/lib/db";
import { StoredPoll, PollQuestion, StoryContext } from "./types";

// ── Table Initialization ────────────────────────────────────

export async function initPollsTable(): Promise<void> {
  const db = getDb();

  await db`
    CREATE TABLE IF NOT EXISTS ragecheck_polls (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      organization TEXT NOT NULL,
      dates_conducted TEXT,
      poll_date DATE,
      sample_size INTEGER,
      margin_of_error TEXT,
      mode TEXT,
      topics TEXT[] NOT NULL DEFAULT '{}',
      entities TEXT[] NOT NULL DEFAULT '{}',
      categories TEXT[] NOT NULL DEFAULT '{}',
      questions JSONB NOT NULL DEFAULT '[]',
      page_text TEXT,
      page_fetched_at TIMESTAMPTZ,
      extraction_quality TEXT DEFAULT 'unknown',
      first_seen_in_story TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`CREATE INDEX IF NOT EXISTS idx_polls_date ON ragecheck_polls(poll_date DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_polls_topics ON ragecheck_polls USING GIN(topics)`;
  await db`CREATE INDEX IF NOT EXISTS idx_polls_entities ON ragecheck_polls USING GIN(entities)`;
  await db`CREATE INDEX IF NOT EXISTS idx_polls_categories ON ragecheck_polls USING GIN(categories)`;
  await db`CREATE INDEX IF NOT EXISTS idx_polls_org ON ragecheck_polls(organization)`;
}

// ── Upsert ──────────────────────────────────────────────────

interface UpsertPollInput {
  url: string;
  organization: string;
  datesConducted?: string | null;
  pollDate?: string | null; // ISO date string for the normalized date
  sampleSize?: number | null;
  marginOfError?: string | null;
  mode?: string | null;
  topics: string[];
  entities: string[];
  categories: string[];
  questions: PollQuestion[];
  pageText?: string | null;
  extractionQuality: "full" | "partial" | "snippet_only" | "unknown";
  firstSeenInStory?: string | null;
}

export async function upsertPoll(poll: UpsertPollInput): Promise<number> {
  const db = getDb();

  // ON CONFLICT: enrich topics/entities (union with existing), update questions if new extraction is better
  const result = await withRetry(async () => {
    const rows = await db`
      INSERT INTO ragecheck_polls (
        url, organization, dates_conducted, poll_date, sample_size,
        margin_of_error, mode, topics, entities, categories,
        questions, page_text, page_fetched_at, extraction_quality, first_seen_in_story
      ) VALUES (
        ${poll.url},
        ${poll.organization},
        ${poll.datesConducted || null},
        ${poll.pollDate || null},
        ${poll.sampleSize || null},
        ${poll.marginOfError || null},
        ${poll.mode || null},
        ${poll.topics},
        ${poll.entities},
        ${poll.categories},
        ${JSON.stringify(poll.questions)}::jsonb,
        ${poll.pageText || null},
        ${poll.pageText ? new Date().toISOString() : null},
        ${poll.extractionQuality},
        ${poll.firstSeenInStory || null}
      )
      ON CONFLICT (url) DO UPDATE SET
        topics = (
          SELECT ARRAY(SELECT DISTINCT unnest(ragecheck_polls.topics || EXCLUDED.topics))
        ),
        entities = (
          SELECT ARRAY(SELECT DISTINCT unnest(ragecheck_polls.entities || EXCLUDED.entities))
        ),
        categories = (
          SELECT ARRAY(SELECT DISTINCT unnest(ragecheck_polls.categories || EXCLUDED.categories))
        ),
        questions = CASE
          WHEN EXCLUDED.extraction_quality = 'full' AND ragecheck_polls.extraction_quality != 'full'
            THEN EXCLUDED.questions
          WHEN jsonb_array_length(EXCLUDED.questions) > jsonb_array_length(ragecheck_polls.questions)
            THEN EXCLUDED.questions
          ELSE ragecheck_polls.questions
        END,
        page_text = COALESCE(EXCLUDED.page_text, ragecheck_polls.page_text),
        page_fetched_at = COALESCE(EXCLUDED.page_fetched_at, ragecheck_polls.page_fetched_at),
        extraction_quality = CASE
          WHEN EXCLUDED.extraction_quality = 'full' THEN 'full'
          WHEN EXCLUDED.extraction_quality = 'partial' AND ragecheck_polls.extraction_quality NOT IN ('full')
            THEN 'partial'
          ELSE ragecheck_polls.extraction_quality
        END,
        updated_at = NOW()
      RETURNING id
    `;
    return rows;
  });

  return (result[0] as { id: number }).id;
}

// ── Deduplication ───────────────────────────────────────────

export async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();

  const db = getDb();
  const rows = await withRetry(async () => {
    return await db`
      SELECT url FROM ragecheck_polls WHERE url = ANY(${urls})
    `;
  });

  return new Set((rows as { url: string }[]).map(r => r.url));
}

// ── Querying ────────────────────────────────────────────────

function rowToStoredPoll(row: Record<string, unknown>): StoredPoll {
  return {
    id: row.id as number,
    url: row.url as string,
    organization: row.organization as string,
    datesConducted: row.dates_conducted as string | null,
    pollDate: row.poll_date ? new Date(row.poll_date as string) : null,
    sampleSize: row.sample_size as number | null,
    marginOfError: row.margin_of_error as string | null,
    mode: row.mode as string | null,
    topics: (row.topics as string[]) || [],
    entities: (row.entities as string[]) || [],
    categories: (row.categories as string[]) || [],
    questions: (row.questions as PollQuestion[]) || [],
    pageText: row.page_text as string | null,
    pageFetchedAt: row.page_fetched_at ? new Date(row.page_fetched_at as string) : null,
    extractionQuality: (row.extraction_quality as StoredPoll["extractionQuality"]) || "unknown",
    firstSeenInStory: row.first_seen_in_story as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Find relevant polls for a story using a 3-strategy approach:
 * 1. Exact entity match (most specific)
 * 2. Topic keyword match (broader)
 * 3. Full-text search on page_text (catches untagged matches)
 *
 * Returns up to `limit` polls, ranked by recency × specificity.
 */
export async function findRelevantPolls(
  story: StoryContext,
  limit = 8
): Promise<StoredPoll[]> {
  const db = getDb();

  // Normalize entities and build topic keywords from the story
  const storyEntities = story.entities.map(e => e.toLowerCase());
  const topicWords = story.topic
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5);

  // Strategy 1: Entity match (most specific, most valuable)
  const entityResults = await withRetry(async () => {
    if (storyEntities.length === 0) return [];
    // Use array overlap (&&) — find polls that share any entity with the story
    return await db`
      SELECT * FROM ragecheck_polls
      WHERE entities && ${storyEntities}
        AND (poll_date IS NULL OR poll_date > NOW() - INTERVAL '18 months')
      ORDER BY poll_date DESC NULLS LAST
      LIMIT ${limit}
    `;
  });

  if ((entityResults as unknown[]).length >= limit) {
    return (entityResults as Record<string, unknown>[]).map(rowToStoredPoll);
  }

  // Strategy 2: Topic keyword match
  const existingIds = (entityResults as Record<string, unknown>[]).map(r => r.id as number);
  const topicResults = await withRetry(async () => {
    if (topicWords.length === 0) return [];
    return await db`
      SELECT * FROM ragecheck_polls
      WHERE topics && ${topicWords}
        AND (poll_date IS NULL OR poll_date > NOW() - INTERVAL '18 months')
        ${existingIds.length > 0 ? db`AND id != ALL(${existingIds})` : db``}
      ORDER BY poll_date DESC NULLS LAST
      LIMIT ${limit - existingIds.length}
    `;
  });

  const combined = [
    ...(entityResults as Record<string, unknown>[]),
    ...(topicResults as Record<string, unknown>[]),
  ];

  if (combined.length >= limit) {
    return combined.slice(0, limit).map(rowToStoredPoll);
  }

  // Strategy 3: Full-text search on page_text (catches untagged matches)
  const allIds = combined.map(r => r.id as number);
  // Split multi-word entities into individual words, strip non-alphanumeric chars
  const searchTerms = [...storyEntities.slice(0, 3), ...topicWords.slice(0, 2)]
    .flatMap(t => t.split(/\s+/))
    .map(w => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(w => w.length > 2)
    .slice(0, 6)
    .join(" & ");

  if (!searchTerms) return combined.map(rowToStoredPoll);

  let ftsResults: unknown[] = [];
  try {
    ftsResults = await withRetry(async () => {
      return await db`
        SELECT * FROM ragecheck_polls
        WHERE page_text IS NOT NULL
          AND to_tsvector('english', page_text) @@ to_tsquery('english', ${searchTerms})
          AND (poll_date IS NULL OR poll_date > NOW() - INTERVAL '18 months')
          ${allIds.length > 0 ? db`AND id != ALL(${allIds})` : db``}
        ORDER BY poll_date DESC NULLS LAST
        LIMIT ${limit - allIds.length}
      `;
    });
  } catch (error) {
    // FTS can fail on malformed queries — degrade gracefully
    console.error(`Poll Store: FTS query failed (terms="${searchTerms}"):`, (error as Error).message);
  }

  return [
    ...combined,
    ...(ftsResults as Record<string, unknown>[]),
  ].slice(0, limit).map(rowToStoredPoll);
}

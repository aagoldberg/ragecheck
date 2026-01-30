/**
 * SideLines Bluesky Collector
 *
 * Collects posts from Bluesky public API for a given event's keywords
 * and time window. Extracts reply, quote, and repost edges.
 *
 * Rate limited to 120ms delay (~2500 req/5min).
 * Hard cap: 10K posts or 250s elapsed (Vercel 300s timeout).
 */

import { upsertPost, upsertUser, createInteraction } from "@/lib/db-sidelines";
import { computeArousal } from "./arousal";
import type { SidelinesEvent, InteractionType } from "./types";

const BSKY_API = "https://public.api.bsky.app/xrpc";
const RATE_LIMIT_MS = 120;
const MAX_POSTS = 10_000;
const MAX_ELAPSED_MS = 250_000;

interface BlueskyPost {
  uri: string;
  cid: string;
  author: {
    did: string;
    handle: string;
    displayName?: string;
  };
  record: {
    text: string;
    createdAt: string;
    reply?: {
      parent: { uri: string; cid: string };
      root: { uri: string; cid: string };
    };
    embed?: {
      $type: string;
      record?: { uri: string; cid: string };
    };
  };
  repostCount?: number;
  likeCount?: number;
  replyCount?: number;
  quoteCount?: number;
}

interface CollectionResult {
  postsCollected: number;
  usersFound: number;
  edgesCreated: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract DID from a Bluesky AT URI
 * at://did:plc:abc123/app.bsky.feed.post/xyz -> did:plc:abc123
 */
function didFromUri(uri: string): string | null {
  const match = uri.match(/^at:\/\/(did:[^/]+)\//);
  return match ? match[1] : null;
}

/**
 * Search Bluesky for posts matching keywords within a time window.
 */
async function searchPosts(
  query: string,
  since: string,
  until: string,
  cursor?: string
): Promise<{ posts: BlueskyPost[]; cursor?: string }> {
  const params = new URLSearchParams({
    q: query,
    since,
    until,
    limit: "100",
    sort: "latest",
  });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(
    `${BSKY_API}/app.bsky.feed.searchPosts?${params.toString()}`
  );
  if (!res.ok) {
    if (res.status === 429) {
      await sleep(5000);
      return { posts: [], cursor: undefined };
    }
    throw new Error(`Bluesky search failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    posts: data.posts || [],
    cursor: data.cursor,
  };
}

/**
 * Get a post thread to follow reply chains.
 */
async function getPostThread(
  uri: string
): Promise<BlueskyPost[]> {
  const params = new URLSearchParams({
    uri,
    depth: "6",
    parentHeight: "0",
  });
  const res = await fetch(
    `${BSKY_API}/app.bsky.feed.getPostThread?${params.toString()}`
  );
  if (!res.ok) return [];

  const data = await res.json();
  const posts: BlueskyPost[] = [];

  function extractFromThread(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thread: any
  ) {
    if (!thread || thread.$type === "app.bsky.feed.defs#blockedPost") return;
    if (thread.post) posts.push(thread.post);
    if (thread.replies) {
      for (const reply of thread.replies) {
        extractFromThread(reply);
      }
    }
  }

  extractFromThread(data.thread);
  return posts;
}

/**
 * Main collection function. Collects posts for an event, extracts edges,
 * scores arousal, and persists everything to the database.
 */
export async function collectEvent(
  event: SidelinesEvent
): Promise<CollectionResult> {
  const startTime = Date.now();
  const seenUris = new Set<string>();
  // Maps DID -> user DB id for this event
  const userIdMap = new Map<string, number>();
  let postsCollected = 0;
  let edgesCreated = 0;

  const since = event.startTs.toISOString();
  const until = event.endTs.toISOString();

  /**
   * Ensure a user exists in DB, return their ID.
   */
  async function ensureUser(
    did: string,
    handle: string,
    displayName?: string
  ): Promise<number> {
    const cached = userIdMap.get(did);
    if (cached) return cached;

    const userId = await upsertUser({
      eventId: event.id,
      platform: event.platform,
      did,
      handle,
      displayName,
    });
    userIdMap.set(did, userId);
    return userId;
  }

  /**
   * Process a single Bluesky post: persist it, extract edges.
   */
  async function processPost(post: BlueskyPost): Promise<void> {
    if (seenUris.has(post.uri)) return;
    if (postsCollected >= MAX_POSTS) return;
    if (Date.now() - startTime > MAX_ELAPSED_MS) return;

    seenUris.add(post.uri);

    // Score arousal
    const { score, breakdown } = computeArousal(post.record.text);

    // Ensure author exists
    const authorId = await ensureUser(
      post.author.did,
      post.author.handle,
      post.author.displayName
    );

    // Persist post
    await upsertPost({
      eventId: event.id,
      platform: event.platform,
      uri: post.uri,
      authorDid: post.author.did,
      authorHandle: post.author.handle,
      text: post.record.text,
      createdAt: new Date(post.record.createdAt),
      rawJson: post as unknown as Record<string, unknown>,
      arousalScore: score,
      arousalBreakdown: breakdown,
    });
    postsCollected++;

    // Extract reply edge
    if (post.record.reply?.parent?.uri) {
      const parentDid = didFromUri(post.record.reply.parent.uri);
      if (parentDid && parentDid !== post.author.did) {
        const parentUserId = await ensureUser(parentDid, "");
        await createEdge(
          "reply",
          authorId,
          parentUserId,
          post.uri,
          post.record.reply.parent.uri,
          post.record.createdAt
        );
      }
    }

    // Extract quote edge
    if (
      post.record.embed?.record?.uri &&
      post.record.embed.$type === "app.bsky.embed.record"
    ) {
      const quotedDid = didFromUri(post.record.embed.record.uri);
      if (quotedDid && quotedDid !== post.author.did) {
        const quotedUserId = await ensureUser(quotedDid, "");
        await createEdge(
          "quote",
          authorId,
          quotedUserId,
          post.uri,
          post.record.embed.record.uri,
          post.record.createdAt
        );
      }
    }
  }

  async function createEdge(
    type: InteractionType,
    srcUserId: number,
    dstUserId: number,
    postUri: string,
    parentUri: string,
    createdAt: string
  ): Promise<void> {
    try {
      await createInteraction({
        eventId: event.id,
        type,
        srcUserId,
        dstUserId,
        postUri,
        parentUri,
        createdAt: new Date(createdAt),
        weight: 1.0,
      });
      edgesCreated++;
    } catch {
      // Duplicate edges are fine
    }
  }

  // Phase 1: Search for posts matching keywords
  for (const keyword of event.keywords) {
    if (postsCollected >= MAX_POSTS) break;
    if (Date.now() - startTime > MAX_ELAPSED_MS) break;

    let cursor: string | undefined;
    let pages = 0;
    const maxPages = 20;

    while (pages < maxPages) {
      if (postsCollected >= MAX_POSTS) break;
      if (Date.now() - startTime > MAX_ELAPSED_MS) break;

      const result = await searchPosts(keyword, since, until, cursor);
      if (result.posts.length === 0) break;

      for (const post of result.posts) {
        await processPost(post);
      }

      if (!result.cursor) break;
      cursor = result.cursor;
      pages++;
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Phase 2: Follow seed post threads
  for (const seedUri of event.seedPostUris) {
    if (postsCollected >= MAX_POSTS) break;
    if (Date.now() - startTime > MAX_ELAPSED_MS) break;

    await sleep(RATE_LIMIT_MS);
    const threadPosts = await getPostThread(seedUri);
    for (const post of threadPosts) {
      await processPost(post);
    }
  }

  // Phase 3: Follow reply threads of collected posts with high arousal
  const highArousalUris = [...seenUris].slice(0, 50);
  for (const uri of highArousalUris) {
    if (postsCollected >= MAX_POSTS) break;
    if (Date.now() - startTime > MAX_ELAPSED_MS) break;

    await sleep(RATE_LIMIT_MS);
    const threadPosts = await getPostThread(uri);
    for (const post of threadPosts) {
      await processPost(post);
    }
  }

  return {
    postsCollected,
    usersFound: userIdMap.size,
    edgesCreated,
  };
}

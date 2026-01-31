/**
 * SideLines Follow Collector
 *
 * Fetches following lists from Bluesky public API (no auth needed).
 * Designed for batch processing: call fetchFollowsBatch repeatedly
 * until done === true.
 *
 * Rate limited to 120ms between requests.
 */

import {
  bulkInsertFollows,
  markUserFollowsFetched,
  getUsersWithoutFollows,
  getFollowsFetchProgress,
} from "@/lib/db-sidelines";

const BSKY_PUBLIC_API = "https://public.api.bsky.app/xrpc";
const RATE_LIMIT_MS = 120;
const FOLLOWS_PER_PAGE = 100;
const FLUSH_THRESHOLD = 500;

interface FollowRow {
  userDid: string;
  followsDid: string;
  followsHandle: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a single user's follows from the Bluesky public API.
 * Paginates through all follows up to MAX_FOLLOWS_PER_USER.
 * Returns null if the user's profile is private/deleted.
 */
async function fetchUserFollows(did: string): Promise<FollowRow[] | null> {
  const follows: FollowRow[] = [];
  let cursor: string | undefined;

  for (;;) {
    const url = new URL(`${BSKY_PUBLIC_API}/app.bsky.graph.getFollows`);
    url.searchParams.set("actor", did);
    url.searchParams.set("limit", String(FOLLOWS_PER_PAGE));
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString());

    if (!res.ok) {
      // User may be deleted, suspended, or private — skip
      if (res.status === 400 || res.status === 404) {
        return null;
      }
      // Rate limited — wait and retry once
      if (res.status === 429) {
        await sleep(2000);
        const retry = await fetch(url.toString());
        if (!retry.ok) return null;
        const retryData = await retry.json();
        for (const f of retryData.follows || []) {
          follows.push({
            userDid: did,
            followsDid: f.did,
            followsHandle: f.handle || "",
          });
        }
        cursor = retryData.cursor;
        if (!cursor || retryData.follows?.length === 0) break;
        await sleep(RATE_LIMIT_MS);
        continue;
      }
      // Other error — skip user
      return null;
    }

    const data = await res.json();
    for (const f of data.follows || []) {
      follows.push({
        userDid: did,
        followsDid: f.did,
        followsHandle: f.handle || "",
      });
    }

    cursor = data.cursor;
    if (!cursor || (data.follows?.length || 0) === 0) break;

    await sleep(RATE_LIMIT_MS);
  }

  return follows;
}

/**
 * Fetch follows for a batch of users who haven't been processed yet.
 *
 * @param eventId - The event to fetch follows for
 * @param batchSize - Number of users to process in this batch (default 200)
 * @returns Progress info: { processed, total, done }
 */
export async function fetchFollowsBatch(
  eventId: number,
  batchSize: number = 200
): Promise<{ processed: number; total: number; done: boolean }> {
  const users = await getUsersWithoutFollows(eventId, batchSize);
  const progress = await getFollowsFetchProgress(eventId);

  if (users.length === 0) {
    return { processed: progress.fetched, total: progress.total, done: true };
  }

  let buffer: FollowRow[] = [];

  for (const user of users) {
    const follows = await fetchUserFollows(user.did);

    if (follows && follows.length > 0) {
      buffer.push(...follows);
    }

    // Flush buffer when it exceeds threshold
    if (buffer.length >= FLUSH_THRESHOLD) {
      await bulkInsertFollows(eventId, buffer);
      buffer = [];
    }

    // Mark user as processed regardless of whether they had follows
    await markUserFollowsFetched(eventId, user.did);

    await sleep(RATE_LIMIT_MS);
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    await bulkInsertFollows(eventId, buffer);
  }

  const updatedProgress = await getFollowsFetchProgress(eventId);
  return {
    processed: updatedProgress.fetched,
    total: updatedProgress.total,
    done: updatedProgress.fetched >= updatedProgress.total,
  };
}

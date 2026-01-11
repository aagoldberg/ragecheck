import { NextResponse } from "next/server";
import Parser from "rss-parser";

// Revalidate every 2 hours (7200 seconds)
export const revalidate = 7200;

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; RageCheck/1.0)",
  },
});

interface FeedSource {
  name: string;
  lean: "Far Right" | "Right" | "Center" | "Left" | "Far Left";
  color: string;
  feedUrl: string;
}

// One source per political lean for the spectrum display
// Using feeds verified to return 200 status codes
const FEED_SOURCES: FeedSource[] = [
  {
    name: "Jacobin",
    lean: "Far Left",
    color: "#dc2626",
    feedUrl: "https://jacobin.com/feed",
  },
  {
    name: "NPR",
    lean: "Left",
    color: "#5a8dc5",
    feedUrl: "https://feeds.npr.org/1014/rss.xml", // NPR Politics
  },
  {
    name: "PBS",
    lean: "Center",
    color: "#1d4a8c",
    feedUrl: "https://www.pbs.org/newshour/feeds/rss/headlines",
  },
  {
    name: "Fox News",
    lean: "Right",
    color: "#003366",
    feedUrl: "https://moxie.foxnews.com/google-publisher/politics.xml",
  },
  {
    name: "Breitbart",
    lean: "Far Right",
    color: "#b91c1c",
    feedUrl: "https://feeds.feedburner.com/breitbart",
  },
];

// Political lean order for display (left to right)
const LEAN_ORDER: FeedSource["lean"][] = ["Far Left", "Left", "Center", "Right", "Far Right"];

interface HeadlineItem {
  source: string;
  lean: string;
  color: string;
  title: string;
  url: string;
  publishedAt: string;
}

// Simple in-memory cache (backup for same-instance requests)
let cachedHeadlines: HeadlineItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

async function fetchFeed(source: FeedSource): Promise<HeadlineItem[]> {
  try {
    const feed = await parser.parseURL(source.feedUrl);

    // Get top 3 items from each feed
    return feed.items.slice(0, 3).map((item) => ({
      source: source.name,
      lean: source.lean,
      color: source.color,
      title: item.title || "Untitled",
      url: item.link || "",
      publishedAt: item.pubDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error(`Failed to fetch ${source.name} feed:`, error);
    return [];
  }
}

async function fetchAllHeadlines(): Promise<HeadlineItem[]> {
  // Check cache
  if (cachedHeadlines && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedHeadlines;
  }

  // Fetch all feeds in parallel
  const results = await Promise.all(FEED_SOURCES.map(fetchFeed));

  // Build a map of lean -> headlines
  const byLean: Record<string, HeadlineItem[]> = {};
  FEED_SOURCES.forEach((source, index) => {
    byLean[source.lean] = results[index];
  });

  // Get exactly one headline per lean, in order from Far Left to Far Right
  const headlines: HeadlineItem[] = [];
  for (const lean of LEAN_ORDER) {
    const items = byLean[lean];
    if (items && items.length > 0) {
      // Take the most recent headline from this lean
      headlines.push(items[0]);
    }
  }

  // Cache the results
  cachedHeadlines = headlines;
  cacheTimestamp = Date.now();

  return headlines;
}

export async function GET() {
  try {
    const headlines = await fetchAllHeadlines();

    const response = NextResponse.json({
      success: true,
      headlines,
      cachedAt: new Date(cacheTimestamp).toISOString(),
      nextRefresh: new Date(cacheTimestamp + CACHE_DURATION).toISOString(),
    });

    // Set cache headers for CDN - 2 hours with stale-while-revalidate
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=7200, stale-while-revalidate=3600"
    );

    return response;
  } catch (error) {
    console.error("Headlines API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch headlines" },
      { status: 500 }
    );
  }
}

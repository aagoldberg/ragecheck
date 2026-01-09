import { NextResponse } from "next/server";
import Parser from "rss-parser";

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

const FEED_SOURCES: FeedSource[] = [
  {
    name: "Breitbart",
    lean: "Far Right",
    color: "#f97316",
    feedUrl: "https://feeds.feedburner.com/breitbart",
  },
  {
    name: "Fox News",
    lean: "Right",
    color: "#003366",
    feedUrl: "https://moxie.foxnews.com/google-publisher/politics.xml",
  },
  {
    name: "NPR",
    lean: "Center",
    color: "#5a5a5a",
    feedUrl: "https://feeds.npr.org/1001/rss.xml",
  },
  {
    name: "CNN",
    lean: "Left",
    color: "#cc0000",
    feedUrl: "https://rss.cnn.com/rss/cnn_topstories.rss",
  },
  {
    name: "AP News",
    lean: "Center",
    color: "#ff322e",
    feedUrl: "https://rsshub.app/apnews/topics/apf-topnews",
  },
];

interface HeadlineItem {
  source: string;
  lean: string;
  color: string;
  title: string;
  url: string;
  publishedAt: string;
}

// Simple in-memory cache
let cachedHeadlines: HeadlineItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

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

  // Group results by political lean category
  const byLean: Record<string, HeadlineItem[]> = {
    right: [],   // Far Right + Right
    center: [],  // Center
    left: [],    // Left + Far Left
  };

  FEED_SOURCES.forEach((source, index) => {
    const items = results[index];
    if (source.lean === "Far Right" || source.lean === "Right") {
      byLean.right.push(...items);
    } else if (source.lean === "Center") {
      byLean.center.push(...items);
    } else {
      byLean.left.push(...items);
    }
  });

  // Ensure at least 2 from each category, then fill remaining slots
  const headlines: HeadlineItem[] = [];
  const minPerCategory = 2;
  const maxTotal = 10;

  // Take minimum from each category first
  for (const category of ["right", "center", "left"]) {
    const items = byLean[category].slice(0, minPerCategory);
    headlines.push(...items);
  }

  // Fill remaining slots with whatever is available, rotating through categories
  const remaining = maxTotal - headlines.length;
  if (remaining > 0) {
    const extras: HeadlineItem[] = [];
    for (const category of ["right", "center", "left"]) {
      extras.push(...byLean[category].slice(minPerCategory));
    }
    // Sort extras by date and take what we need
    extras.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    headlines.push(...extras.slice(0, remaining));
  }

  // Sort final list by date, most recent first
  headlines.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Cache the results
  cachedHeadlines = headlines;
  cacheTimestamp = Date.now();

  return headlines;
}

export async function GET() {
  try {
    const headlines = await fetchAllHeadlines();

    return NextResponse.json({
      success: true,
      headlines,
      cachedAt: new Date(cacheTimestamp).toISOString(),
    });
  } catch (error) {
    console.error("Headlines API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch headlines" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { scoreHeadline } from "@/lib/llm";
import {
  getExistingHeadlineUrls,
  insertScoredHeadline,
  getRecentHighRageHeadlines,
  getHeadlineStats,
  clearAllHeadlines,
  ScoredHeadline,
} from "@/lib/db";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; RageCheck/1.0)",
  },
});

interface FeedSource {
  name: string;
  lean: "Far Left" | "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Far Right";
  feedUrl: string;
  fallbackUrls?: string[];
}

// Comprehensive feed sources across the political spectrum (50+ sources)
const FEED_SOURCES: FeedSource[] = [
  // ============ FAR LEFT ============
  {
    name: "Jacobin",
    lean: "Far Left",
    feedUrl: "https://jacobin.com/feed",
  },
  {
    name: "The Intercept",
    lean: "Far Left",
    feedUrl: "https://theintercept.com/feed/?rss",
  },
  {
    name: "Common Dreams",
    lean: "Far Left",
    feedUrl: "https://www.commondreams.org/rss.xml",
  },
  {
    name: "The Nation",
    lean: "Far Left",
    feedUrl: "https://www.thenation.com/feed/",
  },
  {
    name: "Democracy Now",
    lean: "Far Left",
    feedUrl: "https://www.democracynow.org/democracynow.rss",
  },

  // ============ LEFT ============
  {
    name: "The Guardian",
    lean: "Left",
    feedUrl: "https://www.theguardian.com/us-news/rss",
  },
  {
    name: "HuffPost",
    lean: "Left",
    feedUrl: "https://www.huffpost.com/section/politics/feed",
  },
  {
    name: "Vox",
    lean: "Left",
    feedUrl: "https://www.vox.com/rss/index.xml",
  },
  {
    name: "Mother Jones",
    lean: "Left",
    feedUrl: "https://www.motherjones.com/feed/",
  },
  {
    name: "Slate",
    lean: "Left",
    feedUrl: "https://slate.com/feeds/all.rss",
  },
  {
    name: "MSNBC",
    lean: "Left",
    feedUrl: "https://www.msnbc.com/feeds/latest",
  },
  {
    name: "The Daily Beast",
    lean: "Left",
    feedUrl: "https://feeds.thedailybeast.com/rss/articles",
  },
  {
    name: "Salon",
    lean: "Left",
    feedUrl: "https://www.salon.com/feed/",
  },

  // ============ CENTER-LEFT ============
  {
    name: "NPR",
    lean: "Center-Left",
    feedUrl: "https://feeds.npr.org/1001/rss.xml",
  },
  {
    name: "The Atlantic",
    lean: "Center-Left",
    feedUrl: "https://www.theatlantic.com/feed/all/",
  },
  {
    name: "CNN",
    lean: "Center-Left",
    feedUrl: "http://rss.cnn.com/rss/cnn_topstories.rss",
  },
  {
    name: "NBC News",
    lean: "Center-Left",
    feedUrl: "https://feeds.nbcnews.com/nbcnews/public/news",
  },
  {
    name: "CBS News",
    lean: "Center-Left",
    feedUrl: "https://www.cbsnews.com/latest/rss/main",
  },
  {
    name: "ABC News",
    lean: "Center-Left",
    feedUrl: "https://abcnews.go.com/abcnews/topstories",
  },
  {
    name: "New York Times",
    lean: "Center-Left",
    feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
  },
  {
    name: "Washington Post",
    lean: "Center-Left",
    feedUrl: "https://feeds.washingtonpost.com/rss/politics",
  },
  {
    name: "Politico",
    lean: "Center-Left",
    feedUrl: "https://www.politico.com/rss/politicopicks.xml",
  },

  // ============ CENTER ============
  {
    name: "PBS",
    lean: "Center",
    feedUrl: "https://www.pbs.org/newshour/feeds/rss/politics",
    fallbackUrls: ["https://www.pbs.org/newshour/feeds/rss/headlines"],
  },
  {
    name: "AP News",
    lean: "Center",
    feedUrl: "https://apnews.com/index.rss",
  },
  {
    name: "Reuters",
    lean: "Center",
    feedUrl: "https://www.reutersagency.com/feed/",
  },
  {
    name: "The Hill",
    lean: "Center",
    feedUrl: "https://thehill.com/feed/",
  },
  {
    name: "USA Today",
    lean: "Center",
    feedUrl: "https://www.usatoday.com/rss/",
  },
  {
    name: "BBC News",
    lean: "Center",
    feedUrl: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml",
  },
  {
    name: "Axios",
    lean: "Center",
    feedUrl: "https://api.axios.com/feed/",
  },
  {
    name: "Bloomberg",
    lean: "Center",
    feedUrl: "https://feeds.bloomberg.com/politics/news.rss",
  },
  {
    name: "Business Insider",
    lean: "Center",
    feedUrl: "https://www.businessinsider.com/rss",
  },

  // ============ CENTER-RIGHT ============
  {
    name: "Wall Street Journal",
    lean: "Center-Right",
    feedUrl: "https://feeds.a.dj.com/rss/RSSOpinion.xml",
  },
  {
    name: "The Economist",
    lean: "Center-Right",
    feedUrl: "https://www.economist.com/rss",
  },
  {
    name: "RealClearPolitics",
    lean: "Center-Right",
    feedUrl: "https://www.realclearpolitics.com/index.xml",
  },

  // ============ RIGHT ============
  {
    name: "Fox News",
    lean: "Right",
    feedUrl: "https://moxie.foxnews.com/google-publisher/politics.xml",
    fallbackUrls: ["https://moxie.foxnews.com/google-publisher/latest.xml"],
  },
  {
    name: "NY Post",
    lean: "Right",
    feedUrl: "https://nypost.com/feed/",
  },
  {
    name: "Washington Examiner",
    lean: "Right",
    feedUrl: "https://www.washingtonexaminer.com/feed",
  },
  {
    name: "Daily Wire",
    lean: "Right",
    feedUrl: "https://www.dailywire.com/feeds/rss.xml",
  },
  {
    name: "The Federalist",
    lean: "Right",
    feedUrl: "https://thefederalist.com/feed/",
  },
  {
    name: "Washington Times",
    lean: "Right",
    feedUrl: "https://www.washingtontimes.com/rss/headlines/news/",
  },
  {
    name: "The Blaze",
    lean: "Right",
    feedUrl: "https://www.theblaze.com/feeds/feed.rss",
  },
  {
    name: "American Conservative",
    lean: "Right",
    feedUrl: "https://www.theamericanconservative.com/feed/",
  },
  {
    name: "National Review",
    lean: "Right",
    feedUrl: "https://www.nationalreview.com/feed/",
  },

  // ============ FAR RIGHT ============
  {
    name: "Breitbart",
    lean: "Far Right",
    feedUrl: "https://feeds.feedburner.com/breitbart",
  },
  {
    name: "Newsmax",
    lean: "Far Right",
    feedUrl: "https://www.newsmax.com/rss/Newsfront/1/",
  },
  {
    name: "Daily Caller",
    lean: "Far Right",
    feedUrl: "https://dailycaller.com/feed/",
  },
  {
    name: "Gateway Pundit",
    lean: "Far Right",
    feedUrl: "https://www.thegatewaypundit.com/feed/",
  },
  {
    name: "Epoch Times",
    lean: "Far Right",
    feedUrl: "https://www.theepochtimes.com/c-us/feed",
  },
];

interface RSSItem {
  title: string;
  description: string;
  url: string;
  source: string;
  lean: string;
  publishedAt?: Date;
  author?: string;
  imageUrl?: string;
  categories?: string[];
  guid?: string;
}

// Strip HTML tags from description
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Decode HTML entities in titles
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

// Extract image URL from various RSS feed formats
function extractImageUrl(item: Record<string, unknown>): string | undefined {
  // Try enclosure (standard RSS)
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url && enclosure.type?.startsWith("image/")) {
    return enclosure.url;
  }

  // Try media:content or media:thumbnail (Media RSS)
  const mediaContent = item["media:content"] as { $?: { url?: string } } | undefined;
  if (mediaContent?.$?.url) {
    return mediaContent.$.url;
  }

  const mediaThumbnail = item["media:thumbnail"] as { $?: { url?: string } } | undefined;
  if (mediaThumbnail?.$?.url) {
    return mediaThumbnail.$.url;
  }

  // Try itunes:image
  const itunesImage = item["itunes:image"] as { $?: { href?: string } } | undefined;
  if (itunesImage?.$?.href) {
    return itunesImage.$.href;
  }

  // Try to extract from content HTML (many feeds embed images)
  const content = (item.content || item["content:encoded"]) as string | undefined;
  if (content) {
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) {
      return imgMatch[1];
    }
  }

  return undefined;
}

async function fetchFeed(source: FeedSource): Promise<RSSItem[]> {
  const urlsToTry = [source.feedUrl, ...(source.fallbackUrls || [])];

  for (const feedUrl of urlsToTry) {
    try {
      const feed = await parser.parseURL(feedUrl);

      // Get all items from feed (typically 20-50)
      const items = feed.items
        .filter((item) => item.title && item.link)
        .map((item) => {
          // Extract categories (can be string or array)
          let categories: string[] | undefined;
          if (item.categories && Array.isArray(item.categories)) {
            categories = item.categories.map((c: string | { _: string }) =>
              typeof c === "string" ? c : c._
            ).filter(Boolean);
          }

          return {
            title: decodeHtmlEntities(item.title || "Untitled"),
            description: stripHtml(item.contentSnippet || item.content || item.summary || ""),
            url: item.link || "",
            source: source.name,
            lean: source.lean,
            publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
            author: item.creator || item.author || item["dc:creator"] as string | undefined,
            imageUrl: extractImageUrl(item as Record<string, unknown>),
            categories: categories?.length ? categories : undefined,
            guid: item.guid || item.id as string | undefined,
          };
        });

      if (items.length > 0) {
        return items;
      }
    } catch (error) {
      console.error(`Failed to fetch ${source.name} from ${feedUrl}:`, error);
    }
  }

  return [];
}

async function fetchAllFeeds(): Promise<RSSItem[]> {
  console.log(`Fetching from ${FEED_SOURCES.length} RSS sources...`);

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchFeed));

  const allItems: RSSItem[] = [];
  let successCount = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allItems.push(...result.value);
      successCount++;
    } else if (result.status === "rejected") {
      console.error(`Feed ${FEED_SOURCES[index].name} failed:`, result.reason);
    }
  });

  console.log(`Successfully fetched ${allItems.length} items from ${successCount}/${FEED_SOURCES.length} feeds`);
  return allItems;
}

// Words to filter from displayed headlines
const PROFANITY_FILTER = /\b(fuck|fucking|f\*\*k|f\*\*\*|shit|s\*\*t|bitch|b\*\*ch|ass\b|a\*\*)\b/i;

// Sources to hide from front page (still collected for Clearview)
const HIDDEN_SOURCES = ["Common Dreams", "Gateway Pundit"];

// GET: Return current top scored headlines
export async function GET() {
  try {
    // Fetch more than needed to account for filtered items
    const allHeadlines = await getRecentHighRageHeadlines(48, 60);
    const stats = await getHeadlineStats();

    // Filter out profanity and hidden sources
    const headlines = allHeadlines
      .filter((h) => !PROFANITY_FILTER.test(h.title))
      .filter((h) => !HIDDEN_SOURCES.includes(h.source))
      .slice(0, 30);

    return NextResponse.json({
      success: true,
      headlines,
      stats,
    });
  } catch (error) {
    console.error("Failed to get scored headlines:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get headlines" },
      { status: 500 }
    );
  }
}

// POST: Refresh headlines - fetch new items and score them
export async function POST(request: Request) {
  try {
    // Check for admin key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const adminKey = process.env.ADMIN_KEY || "ragecheck-admin-2024";

    if (key !== adminKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if we should clear existing data first
    const shouldClear = searchParams.get("clear") === "true";
    if (shouldClear) {
      await clearAllHeadlines();
      console.log("Cleared all existing headlines");
    }

    // Fetch all RSS feeds
    const allItems = await fetchAllFeeds();

    if (allItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No items fetched from feeds",
        newItems: 0,
        scored: 0,
      });
    }

    // Get existing URLs to deduplicate
    const allUrls = allItems.map((item) => item.url);
    const existingUrls = await getExistingHeadlineUrls(allUrls);

    // Filter to only new items
    const newItems = allItems.filter((item) => !existingUrls.has(item.url));
    console.log(`Found ${newItems.length} new items out of ${allItems.length} total`);

    if (newItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new items to score",
        newItems: 0,
        scored: 0,
        totalFetched: allItems.length,
        alreadyScored: existingUrls.size,
      });
    }

    // Score new items with Sonnet
    let scoredCount = 0;
    const scoredHeadlines: ScoredHeadline[] = [];

    for (const item of newItems) {
      try {
        const result = await scoreHeadline(item.title, item.description, item.source);

        const headline: ScoredHeadline = {
          url: item.url,
          title: item.title,
          description: item.description,
          source: item.source,
          lean: item.lean,
          score: result?.score,
          summary: result?.summary,
          analysis: result?.analysis,
          topic: result?.topic,
          category: result?.category,
          signalBreakdown: result?.signalBreakdown,
          author: item.author,
          imageUrl: item.imageUrl,
          rssCategories: item.categories,
          guid: item.guid,
          publishedAt: item.publishedAt,
        };

        await insertScoredHeadline(headline);
        scoredHeadlines.push(headline);
        scoredCount++;

        // Log progress every 10 items
        if (scoredCount % 10 === 0) {
          console.log(`Scored ${scoredCount}/${newItems.length} headlines...`);
        }

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to score headline: ${item.title}`, error);
      }
    }

    console.log(`Finished scoring ${scoredCount} new headlines`);

    // Return stats
    const stats = await getHeadlineStats();

    return NextResponse.json({
      success: true,
      newItems: newItems.length,
      scored: scoredCount,
      totalFetched: allItems.length,
      stats,
      // Return top 10 highest scored from this batch
      topNew: scoredHeadlines
        .filter((h) => h.score !== undefined)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10),
    });
  } catch (error) {
    console.error("Failed to refresh headlines:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh headlines" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { saveClearviewData, initClearviewTable, isDBAvailable, ClearviewStory } from "@/lib/db";
import { extractContent } from "@/lib/extract";

// This endpoint is called by Vercel Cron to refresh Clearview data
// It bypasses the cache and always generates fresh content

// Extend function timeout for tiered analysis (Pro plan: up to 300s)
export const maxDuration = 300;

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; RageCheck/1.0)",
  },
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface FeedSource {
  name: string;
  lean: "Far Left" | "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Far Right";
  feedUrl: string;
}

// Expanded sources across the political spectrum (48 total)
const FEED_SOURCES: FeedSource[] = [
  // Far Left (6)
  { name: "Jacobin", lean: "Far Left", feedUrl: "https://jacobin.com/feed" },
  { name: "Democracy Now", lean: "Far Left", feedUrl: "https://www.democracynow.org/democracynow.rss" },
  { name: "The Intercept", lean: "Far Left", feedUrl: "https://theintercept.com/feed/?rss" },
  { name: "Current Affairs", lean: "Far Left", feedUrl: "https://www.currentaffairs.org/feed" },
  { name: "Common Dreams", lean: "Far Left", feedUrl: "https://www.commondreams.org/rss.xml" },
  { name: "Truthout", lean: "Far Left", feedUrl: "https://truthout.org/feed/" },

  // Left (8)
  { name: "NPR", lean: "Left", feedUrl: "https://feeds.npr.org/1001/rss.xml" },
  { name: "The Guardian", lean: "Left", feedUrl: "https://www.theguardian.com/us-news/rss" },
  { name: "Vox", lean: "Left", feedUrl: "https://www.vox.com/rss/index.xml" },
  { name: "MSNBC", lean: "Left", feedUrl: "https://www.msnbc.com/feeds/latest" },
  { name: "HuffPost", lean: "Left", feedUrl: "https://www.huffpost.com/section/politics/feed" },
  { name: "Slate", lean: "Left", feedUrl: "https://slate.com/feeds/all.rss" },
  { name: "The Atlantic", lean: "Left", feedUrl: "https://www.theatlantic.com/feed/all/" },
  { name: "New Yorker", lean: "Left", feedUrl: "https://www.newyorker.com/feed/news" },

  // Center-Left (6)
  { name: "Washington Post", lean: "Center-Left", feedUrl: "https://feeds.washingtonpost.com/rss/politics" },
  { name: "New York Times", lean: "Center-Left", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml" },
  { name: "CNN", lean: "Center-Left", feedUrl: "http://rss.cnn.com/rss/cnn_allpolitics.rss" },
  { name: "Politico", lean: "Center-Left", feedUrl: "https://www.politico.com/rss/politics.xml" },
  { name: "NBC News", lean: "Center-Left", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/politics" },
  { name: "ABC News", lean: "Center-Left", feedUrl: "https://abcnews.go.com/abcnews/politicsheadlines" },

  // Center (6)
  { name: "PBS", lean: "Center", feedUrl: "https://www.pbs.org/newshour/feeds/rss/headlines" },
  { name: "AP News", lean: "Center", feedUrl: "https://feedx.net/rss/ap.xml" },
  { name: "Reuters", lean: "Center", feedUrl: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best" },
  { name: "BBC", lean: "Center", feedUrl: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml" },
  { name: "The Hill", lean: "Center", feedUrl: "https://thehill.com/feed/" },
  { name: "RealClearPolitics", lean: "Center", feedUrl: "https://www.realclearpolitics.com/index.xml" },

  // Center-Right (6)
  { name: "Wall Street Journal", lean: "Center-Right", feedUrl: "https://feeds.a.dj.com/rss/RSSOpinion.xml" },
  { name: "The Economist", lean: "Center-Right", feedUrl: "https://www.economist.com/united-states/rss.xml" },
  { name: "Reason", lean: "Center-Right", feedUrl: "https://reason.com/feed/" },
  { name: "The Dispatch", lean: "Center-Right", feedUrl: "https://thedispatch.com/feed/" },
  { name: "National Journal", lean: "Center-Right", feedUrl: "https://www.nationaljournal.com/feeds/all" },
  { name: "Washington Examiner", lean: "Center-Right", feedUrl: "https://www.washingtonexaminer.com/section/news/feed" },

  // Right (8)
  { name: "Fox News", lean: "Right", feedUrl: "https://moxie.foxnews.com/google-publisher/politics.xml" },
  { name: "National Review", lean: "Right", feedUrl: "https://www.nationalreview.com/feed/" },
  { name: "New York Post", lean: "Right", feedUrl: "https://nypost.com/news/feed/" },
  { name: "Washington Times", lean: "Right", feedUrl: "https://www.washingtontimes.com/rss/headlines/news/politics/" },
  { name: "Townhall", lean: "Right", feedUrl: "https://townhall.com/rss/political-cartoons/" },
  { name: "The Federalist", lean: "Right", feedUrl: "https://thefederalist.com/feed/" },
  { name: "American Spectator", lean: "Right", feedUrl: "https://spectator.org/feed/" },
  { name: "RedState", lean: "Right", feedUrl: "https://redstate.com/feed" },

  // Far Right (8)
  { name: "Breitbart", lean: "Far Right", feedUrl: "https://feeds.feedburner.com/breitbart" },
  { name: "Daily Wire", lean: "Far Right", feedUrl: "https://www.dailywire.com/feeds/rss.xml" },
  { name: "Gateway Pundit", lean: "Far Right", feedUrl: "https://www.thegatewaypundit.com/feed/" },
  { name: "Newsmax", lean: "Far Right", feedUrl: "https://www.newsmax.com/rss/Politics/1/" },
  { name: "One America News", lean: "Far Right", feedUrl: "https://www.oann.com/feed/" },
  { name: "The Blaze", lean: "Far Right", feedUrl: "https://www.theblaze.com/feeds/feed.rss" },
  { name: "PJ Media", lean: "Far Right", feedUrl: "https://pjmedia.com/feed" },
  { name: "Western Journal", lean: "Far Right", feedUrl: "https://www.westernjournal.com/feed/" },
];

interface RawHeadline {
  source: string;
  lean: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt: string;
}

interface HeadlineCluster {
  topic: string;
  headlineIndices: number[];
  sourceCount: number;
  spectrumSpread: number;
  category: "politics" | "economy" | "international" | "tech" | "culture" | "other";
}

interface TieredClusters {
  deepDive: HeadlineCluster[];
  quickTake: HeadlineCluster[];
}

async function fetchAllHeadlines(): Promise<RawHeadline[]> {
  const headlines: RawHeadline[] = [];

  const results = await Promise.allSettled(
    FEED_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.feedUrl);
        return feed.items.slice(0, 5).map((item) => ({
          source: source.name,
          lean: source.lean,
          title: item.title || "Untitled",
          url: item.link || "",
          snippet: item.contentSnippet || item.content || "",
          publishedAt: item.pubDate || new Date().toISOString(),
        }));
      } catch (error) {
        console.error(`Failed to fetch ${source.name}:`, error);
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      headlines.push(...result.value);
    }
  }

  return headlines;
}

// Phase 1: Cluster headlines and determine metrics
async function clusterHeadlines(headlines: RawHeadline[]): Promise<HeadlineCluster[]> {
  if (!client) {
    throw new Error("LLM not available");
  }

  const headlinesSummary = headlines
    .map((h, i) => `[${i}] ${h.source} (${h.lean}): "${h.title}"`)
    .join("\n");

  const prompt = `Analyze these news headlines and cluster them into stories.

Headlines:
${headlinesSummary}

For each story cluster, identify:
1. The topic (brief name)
2. Which headline indices belong to this story
3. Category: politics, economy, international, tech, culture, or other

Return JSON:
{
  "clusters": [
    {
      "topic": "Brief topic name",
      "headlineIndices": [0, 5, 12],
      "category": "politics"
    }
  ]
}

Rules:
- Only include stories with 2+ headlines from different sources
- Group headlines about the same underlying story
- Be specific about topic names`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse clustering response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const rawClusters = parsed.clusters || [];

  const leanOrder = ["Far Left", "Left", "Center-Left", "Center", "Center-Right", "Right", "Far Right"];

  return rawClusters.map((cluster: { topic: string; headlineIndices: number[]; category: string }) => {
    const clusterHeadlines = cluster.headlineIndices.map((i: number) => headlines[i]).filter(Boolean);
    const uniqueSources = new Set(clusterHeadlines.map((h: RawHeadline) => h.source));
    const leans = new Set(clusterHeadlines.map((h: RawHeadline) => h.lean));

    const leanIndices = Array.from(leans).map(l => leanOrder.indexOf(l as string)).filter(i => i >= 0);
    const spectrumSpread = leanIndices.length > 0
      ? Math.max(...leanIndices) - Math.min(...leanIndices) + 1
      : 1;

    return {
      topic: cluster.topic,
      headlineIndices: cluster.headlineIndices,
      sourceCount: uniqueSources.size,
      spectrumSpread,
      category: cluster.category as HeadlineCluster["category"],
    };
  });
}

// Phase 2: Select tiers
function selectTiers(clusters: HeadlineCluster[]): TieredClusters {
  const deepDive: HeadlineCluster[] = [];
  const quickTake: HeadlineCluster[] = [];

  const sorted = [...clusters].sort((a, b) =>
    (b.sourceCount * b.spectrumSpread) - (a.sourceCount * a.spectrumSpread)
  );

  for (const cluster of sorted) {
    if (cluster.sourceCount >= 4 && cluster.spectrumSpread >= 3) {
      deepDive.push(cluster);
    } else {
      quickTake.push(cluster);
    }
  }

  const keyCategories = ["politics", "economy", "international"];
  for (const category of keyCategories) {
    const hasDeepDive = deepDive.some(c => c.category === category);
    if (!hasDeepDive) {
      const candidateIndex = quickTake.findIndex(c => c.category === category);
      if (candidateIndex >= 0) {
        const promoted = quickTake.splice(candidateIndex, 1)[0];
        deepDive.push(promoted);
      }
    }
  }

  const maxDeepDives = 8;
  if (deepDive.length > maxDeepDives) {
    const demoted = deepDive.splice(maxDeepDives);
    quickTake.unshift(...demoted);
  }

  return { deepDive, quickTake };
}

// Phase 3: Extract articles for Deep Dives
async function extractArticlesForClusters(
  clusters: HeadlineCluster[],
  headlines: RawHeadline[]
): Promise<Map<string, string>> {
  const articleContent = new Map<string, string>();
  const urlsToExtract: string[] = [];

  for (const cluster of clusters) {
    for (const idx of cluster.headlineIndices) {
      const headline = headlines[idx];
      if (headline?.url) {
        urlsToExtract.push(headline.url);
      }
    }
  }

  const concurrency = 5;
  for (let i = 0; i < urlsToExtract.length; i += concurrency) {
    const batch = urlsToExtract.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (url) => {
        const result = await extractContent(url);
        return { url, result };
      })
    );

    for (const { url, result } of results) {
      if (result.success && result.text) {
        articleContent.set(url, result.text.slice(0, 3000));
      }
    }
  }

  console.log(`Cron: Extracted ${articleContent.size}/${urlsToExtract.length} articles`);
  return articleContent;
}

// Phase 4a: Deep Dive analysis
async function analyzeDeepDive(
  clusters: HeadlineCluster[],
  headlines: RawHeadline[],
  articleContent: Map<string, string>
): Promise<ClearviewStory[]> {
  if (!client || clusters.length === 0) return [];

  const clusterData = clusters.map((cluster, idx) => {
    const clusterHeadlines = cluster.headlineIndices
      .map(i => headlines[i])
      .filter(Boolean);

    const headlinesWithContent = clusterHeadlines.map(h => {
      const content = articleContent.get(h.url);
      return {
        source: h.source,
        lean: h.lean,
        title: h.title,
        url: h.url,
        articleExcerpt: content || h.snippet || "[No content available]",
      };
    });

    return {
      id: `story-${idx + 1}`,
      topic: cluster.topic,
      category: cluster.category,
      headlines: headlinesWithContent,
    };
  });

  const prompt = `You are analyzing news stories with FULL ARTICLE CONTENT for deep analysis.

Stories to analyze:
${JSON.stringify(clusterData, null, 2)}

For each story, provide comprehensive analysis:

{
  "stories": [
    {
      "id": "story-1",
      "topic": "Topic name",
      "tier": "deep-dive",
      "category": "politics",
      "summary": "2-3 sentence neutral summary of what happened",
      "whatHappened": "Detailed explanation of actual events, stripped of spin",
      "sources": [
        {
          "name": "Source Name",
          "lean": "Political lean",
          "title": "Their headline",
          "url": "article url",
          "framing": "How they're framing/spinning this story",
          "manipulationTechniques": ["technique1", "technique2"]
        }
      ],
      "perspectives": [
        { "lean": "Left", "viewpoint": "How the left sees this and why" },
        { "lean": "Right", "viewpoint": "How the right sees this and why" }
      ],
      "keyTakeaway": "One sentence helping reader understand without spin",
      "expertConsensus": {
        "type": "scientific|legal|historical|economic|intelligence|statistical|professional|international|none",
        "exists": true,
        "statement": "What expert consensus says",
        "confidenceLevel": "high|moderate|low|contested",
        "sources": ["CDC", "Supreme Court", etc.],
        "dissent": "Notable minority view if relevant"
      },
      "debateType": "factual|policy|values|mixed",
      "debateQuestion": "The actual question being debated",
      "commonGround": ["Facts both sides agree on"],
      "factualDisputes": [
        {
          "claim": "The disputed claim",
          "leftPosition": "What left claims",
          "rightPosition": "What right claims",
          "evidenceStatus": "supported|mixed|unsupported|misleading"
        }
      ],
      "whyItMatters": {
        "left": {
          "coreValue": "equality, fairness, protection, etc.",
          "motivation": "Plain-language explanation",
          "stance": "offensive|defensive|mobilizing",
          "emotionalAppeal": "fear, hope, anger, etc."
        },
        "right": {
          "coreValue": "liberty, tradition, security, etc.",
          "motivation": "Plain-language explanation",
          "stance": "offensive|defensive|mobilizing",
          "emotionalAppeal": "What emotion this activates"
        },
        "bottomLine": "One sentence on what this fight is really about"
      },
      "deeperAnalysis": {
        "unstatedConcerns": {
          "left": ["Concerns driving the left not openly discussed"],
          "right": ["Concerns driving the right not openly discussed"]
        },
        "economicDimension": "Economic anxieties and interests at play",
        "culturalDimension": "Cultural/identity concerns beneath the surface",
        "politicalGame": "How politicians/media exploit this for tribal gain",
        "whatGetsIgnored": "Nuances or solutions ignored because they don't fit the narrative"
      }
    }
  ]
}

CRITICAL GUIDELINES:
- Use the FULL ARTICLE CONTENT to understand the complete story
- Be genuinely neutral in summaries
- Identify manipulation techniques: loaded language, fear-mongering, omission of context, false equivalence, appeal to emotion
- REQUIRED: Every story MUST include expertConsensus, whyItMatters, and deeperAnalysis
- Be empathetic to both sides - help readers understand WHY reasonable people disagree`;

  let fullText = "";
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
    }
  }

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse deep dive analysis");
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    const fixedJson = jsonMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, ' ');
    parsed = JSON.parse(fixedJson);
  }

  return (parsed.stories || []).map((s: ClearviewStory) => ({
    ...s,
    tier: "deep-dive" as const,
  }));
}

// Phase 4b: Quick Take analysis
async function analyzeQuickTake(
  clusters: HeadlineCluster[],
  headlines: RawHeadline[]
): Promise<ClearviewStory[]> {
  if (!client || clusters.length === 0) return [];

  const clusterData = clusters.map((cluster, idx) => {
    const clusterHeadlines = cluster.headlineIndices
      .map(i => headlines[i])
      .filter(Boolean);

    return {
      id: `quick-${idx + 1}`,
      topic: cluster.topic,
      category: cluster.category,
      headlines: clusterHeadlines.map(h => ({
        source: h.source,
        lean: h.lean,
        title: h.title,
        url: h.url,
      })),
    };
  });

  const prompt = `Provide BRIEF analysis of these stories based on headlines only.

Stories:
${JSON.stringify(clusterData, null, 2)}

Return concise Quick Take analysis:

{
  "stories": [
    {
      "id": "quick-1",
      "topic": "Topic name",
      "tier": "quick-take",
      "category": "politics",
      "summary": "1-2 sentence neutral summary",
      "sources": [
        {
          "name": "Source Name",
          "lean": "Political lean",
          "title": "Their headline",
          "url": "article url",
          "framing": "Brief note on framing"
        }
      ],
      "perspectives": [
        { "lean": "Left", "viewpoint": "Brief left perspective" },
        { "lean": "Right", "viewpoint": "Brief right perspective" }
      ],
      "keyTakeaway": "One sentence takeaway"
    }
  ]
}

Keep it brief - these are quick summaries, not deep analysis.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse quick take analysis");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return (parsed.stories || []).map((s: ClearviewStory) => ({
    ...s,
    tier: "quick-take" as const,
  }));
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request or admin request
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.ADMIN_KEY;

  const providedToken = authHeader?.replace("Bearer ", "");
  const isAuthorized =
    (cronSecret && providedToken === cronSecret) ||
    (adminKey && providedToken === adminKey);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Cron: Starting Clearview refresh with tiered system...");

    if (!client) {
      return NextResponse.json(
        { success: false, error: "LLM not available" },
        { status: 503 }
      );
    }

    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 503 }
      );
    }

    await initClearviewTable();

    // Phase 1: Fetch and cluster headlines
    const headlines = await fetchAllHeadlines();
    console.log(`Cron: Fetched ${headlines.length} headlines from ${FEED_SOURCES.length} sources`);

    if (headlines.length < 10) {
      return NextResponse.json(
        { success: false, error: "Not enough headlines" },
        { status: 503 }
      );
    }

    const clusters = await clusterHeadlines(headlines);
    console.log(`Cron: Identified ${clusters.length} story clusters`);

    // Phase 2: Select tiers
    const { deepDive, quickTake } = selectTiers(clusters);
    console.log(`Cron: Tiers: ${deepDive.length} Deep Dive, ${quickTake.length} Quick Take`);

    // Phase 3: Extract articles for Deep Dives
    const articleContent = await extractArticlesForClusters(deepDive, headlines);

    // Phase 4: Analyze both tiers in parallel
    const [deepDiveStories, quickTakeStories] = await Promise.all([
      analyzeDeepDive(deepDive, headlines, articleContent),
      analyzeQuickTake(quickTake, headlines),
    ]);

    // Combine stories
    const allStories: ClearviewStory[] = [...deepDiveStories, ...quickTakeStories];
    console.log(`Cron: Generated ${deepDiveStories.length} Deep Dive + ${quickTakeStories.length} Quick Take stories`);

    // Save to database
    await saveClearviewData(allStories);
    console.log("Cron: Saved to database");

    return NextResponse.json({
      success: true,
      message: "Clearview data refreshed with tiered analysis",
      deepDiveCount: deepDiveStories.length,
      quickTakeCount: quickTakeStories.length,
      totalStories: allStories.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron: Clearview refresh failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Refresh failed",
      },
      { status: 500 }
    );
  }
}

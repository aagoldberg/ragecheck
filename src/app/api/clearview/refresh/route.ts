import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { saveClearviewData, initClearviewTable, isDBAvailable, ClearviewStory } from "@/lib/db";
import { extractContent } from "@/lib/extract";

// This endpoint is called by Vercel Cron to refresh Clearview data
// It bypasses the cache and always generates fresh content

// Robust JSON extraction from LLM text output
function extractJSON(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const raw = jsonMatch[0];

  // Try direct parse first
  try { return JSON.parse(raw); } catch { /* continue */ }

  // Use jsonrepair for malformed LLM output
  try {
    const repaired = jsonrepair(raw);
    return JSON.parse(repaired);
  } catch { /* continue */ }

  throw new Error("Failed to parse JSON from LLM response");
}

// Extend function timeout for tiered analysis (Pro plan: up to 300s)
export const maxDuration = 300;

const parser = new Parser({
  timeout: 10000, // Reduced from 15s
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
  newestHeadlineAge?: number; // hours since newest headline
  score?: number; // computed ranking score
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
- Be specific about topic names
- IMPORTANT: Return ONLY valid JSON. No markdown, no code fences.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: '{"clusters":[' },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const parsed = extractJSON('{"clusters":[' + content.text) as { clusters?: Array<{ topic: string; headlineIndices: number[]; category: string }> };
  const rawClusters = parsed.clusters || [];

  const leanOrder = ["Far Left", "Left", "Center-Left", "Center", "Center-Right", "Right", "Far Right"];

  const now = Date.now();

  return rawClusters.map((cluster: { topic: string; headlineIndices: number[]; category: string }) => {
    const clusterHeadlines = cluster.headlineIndices.map((i: number) => headlines[i]).filter(Boolean);
    const uniqueSources = new Set(clusterHeadlines.map((h: RawHeadline) => h.source));
    const leans = new Set(clusterHeadlines.map((h: RawHeadline) => h.lean));

    const leanIndices = Array.from(leans).map(l => leanOrder.indexOf(l as string)).filter(i => i >= 0);
    const spectrumSpread = leanIndices.length > 0
      ? Math.max(...leanIndices) - Math.min(...leanIndices) + 1
      : 1;

    // Calculate age of newest headline in hours
    const headlineTimes = clusterHeadlines
      .map((h: RawHeadline) => new Date(h.publishedAt).getTime())
      .filter((t: number) => !isNaN(t));
    const newestTime = headlineTimes.length > 0 ? Math.max(...headlineTimes) : now;
    const newestHeadlineAge = (now - newestTime) / (1000 * 60 * 60); // hours

    return {
      topic: cluster.topic,
      headlineIndices: cluster.headlineIndices,
      sourceCount: uniqueSources.size,
      spectrumSpread,
      category: cluster.category as HeadlineCluster["category"],
      newestHeadlineAge,
    };
  });
}

// Calculate story score for ranking
function calculateScore(cluster: HeadlineCluster): number {
  const sourceCount = cluster.sourceCount;

  // Normalize spectrum spread to 1.0-3.0 range
  // spectrumSpread of 1 = single lean (1.0), 7 = full spectrum (3.0)
  const spectrumFactor = 1.0 + (Math.min(cluster.spectrumSpread, 7) - 1) * (2.0 / 6);

  // Recency factor: 1.0 if <6hrs, 0.8 if 6-24hrs, 0.5 if 24-48hrs, 0.3 if >48hrs
  const ageHours = cluster.newestHeadlineAge || 0;
  let recencyFactor = 1.0;
  if (ageHours > 48) recencyFactor = 0.3;
  else if (ageHours > 24) recencyFactor = 0.5;
  else if (ageHours > 6) recencyFactor = 0.8;

  return sourceCount * spectrumFactor * recencyFactor;
}

// Phase 2: Select tiers based on scoring
function selectTiers(clusters: HeadlineCluster[]): TieredClusters {
  const deepDive: HeadlineCluster[] = [];
  const quickTake: HeadlineCluster[] = [];

  // Calculate and attach scores
  const scored = clusters.map(c => ({ ...c, score: calculateScore(c) }));

  // Sort by score descending
  const sorted = scored.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Log top scores for debugging
  console.log("Cluster scores:", sorted.slice(0, 10).map(c =>
    `${c.topic}: ${c.score?.toFixed(1)} (${c.sourceCount} src, ${c.spectrumSpread} spread, ${c.newestHeadlineAge?.toFixed(1)}h old)`
  ));

  // Deep Dive threshold: score >= 8 OR (sourceCount >= 4 AND spectrumSpread >= 3)
  for (const cluster of sorted) {
    const meetsScoreThreshold = (cluster.score || 0) >= 8;
    const meetsCoverageThreshold = cluster.sourceCount >= 4 && cluster.spectrumSpread >= 3;

    if (meetsScoreThreshold || meetsCoverageThreshold) {
      deepDive.push(cluster);
    } else {
      quickTake.push(cluster);
    }
  }

  // Ensure key categories have Deep Dive coverage
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

  // Cap Deep Dives at 5 to stay within timeout limits
  const maxDeepDives = 5;
  if (deepDive.length > maxDeepDives) {
    const demoted = deepDive.splice(maxDeepDives);
    quickTake.unshift(...demoted);
  }

  return { deepDive, quickTake };
}

// Phase 3: Extract articles for Deep Dives (limit per cluster for speed)
async function extractArticlesForClusters(
  clusters: HeadlineCluster[],
  headlines: RawHeadline[]
): Promise<Map<string, string>> {
  const articleContent = new Map<string, string>();
  const urlsToExtract: string[] = [];

  // Limit to 3 articles per cluster to stay within timeout
  const maxArticlesPerCluster = 3;
  for (const cluster of clusters) {
    const clusterUrls: string[] = [];
    for (const idx of cluster.headlineIndices) {
      const headline = headlines[idx];
      if (headline?.url && clusterUrls.length < maxArticlesPerCluster) {
        clusterUrls.push(headline.url);
      }
    }
    urlsToExtract.push(...clusterUrls);
  }

  const concurrency = 8; // Increased from 5
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
        // Reduced from 3000 to 2000 chars for speed
        articleContent.set(url, result.text.slice(0, 2000));
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
      "whatHappened": "3-4 clear factual sentences. Each sentence should be a distinct fact. Start each with a concrete detail (who/what/when/where). No spin or interpretation.",
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
        { "lean": "Left", "viewpoint": "2 sentences max. First sentence is bold thesis, second adds context." },
        { "lean": "Right", "viewpoint": "2 sentences max. First sentence is bold thesis, second adds context." }
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
- Be empathetic to both sides - help readers understand WHY reasonable people disagree
- IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no commentary. Escape all special characters in strings.`;

  let fullText = "";
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 10000,
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: '{"stories":[' },
    ],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
    }
  }

  // Prepend the prefill since the model continues from it
  const parsed = extractJSON('{"stories":[' + fullText) as { stories?: ClearviewStory[] };

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

Keep it brief - these are quick summaries, not deep analysis.
IMPORTANT: Return ONLY valid JSON. No markdown, no code fences.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: '{"stories":[' },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const parsed = extractJSON('{"stories":[' + content.text) as { stories?: ClearviewStory[] };

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
    const startTime = Date.now();

    // Phase 1: Fetch headlines
    console.log(`Cron: [${Date.now() - startTime}ms] Starting Phase 1: Fetch headlines`);
    const headlines = await fetchAllHeadlines();
    console.log(`Cron: [${Date.now() - startTime}ms] Phase 1 complete: ${headlines.length} headlines from ${FEED_SOURCES.length} sources`);

    if (headlines.length < 10) {
      return NextResponse.json(
        { success: false, error: "Not enough headlines" },
        { status: 503 }
      );
    }

    // Phase 2: Cluster headlines
    console.log(`Cron: [${Date.now() - startTime}ms] Starting Phase 2: Cluster headlines`);
    const clusters = await clusterHeadlines(headlines);
    console.log(`Cron: [${Date.now() - startTime}ms] Phase 2 complete: ${clusters.length} clusters`);

    // Phase 3: Select tiers
    const { deepDive, quickTake } = selectTiers(clusters);
    console.log(`Cron: [${Date.now() - startTime}ms] Phase 3: ${deepDive.length} Deep Dive, ${quickTake.length} Quick Take`);

    // Phase 4: Extract articles for Deep Dives
    console.log(`Cron: [${Date.now() - startTime}ms] Starting Phase 4: Extract articles`);
    const articleContent = await extractArticlesForClusters(deepDive, headlines);
    console.log(`Cron: [${Date.now() - startTime}ms] Phase 4 complete: ${articleContent.size} articles extracted`);

    // Phase 5: Analyze both tiers in parallel
    console.log(`Cron: [${Date.now() - startTime}ms] Starting Phase 5: LLM analysis`);
    const [deepDiveStories, quickTakeStories] = await Promise.all([
      analyzeDeepDive(deepDive, headlines, articleContent),
      analyzeQuickTake(quickTake, headlines),
    ]);
    console.log(`Cron: [${Date.now() - startTime}ms] Phase 5 complete`);

    // Combine stories
    const allStories: ClearviewStory[] = [...deepDiveStories, ...quickTakeStories];
    console.log(`Cron: [${Date.now() - startTime}ms] Generated ${deepDiveStories.length} Deep Dive + ${quickTakeStories.length} Quick Take`);

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

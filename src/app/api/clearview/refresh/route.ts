import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { saveClearviewData, initClearviewTable, isDBAvailable, ClearviewStory } from "@/lib/db";
import { extractContent } from "@/lib/extract";
import { researchSurveyData, formatSurveyContext } from "@/lib/agents/survey";
import type { StoryContext } from "@/lib/agents/survey";

// This endpoint is called by Vercel Cron to refresh Clearview data
// It bypasses the cache and always generates fresh content

// Robust JSON extraction from LLM text output
function extractJSON(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const raw = jsonMatch[0];

  // Try direct parse first
  try { return JSON.parse(raw); } catch (e) {
    console.error("Direct JSON parse failed:", (e as Error).message);
  }

  // Use jsonrepair for malformed LLM output
  try {
    const repaired = jsonrepair(raw);
    return JSON.parse(repaired);
  } catch (e) {
    console.error("jsonrepair failed:", (e as Error).message);
    console.error("Raw text (first 500 chars):", raw.slice(0, 500));
    console.error("Raw text (last 500 chars):", raw.slice(-500));
  }

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

  const prompt = `Analyze these news headlines and cluster them into distinct stories.

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

CRITICAL CLUSTERING RULES:
- Only include stories with 2+ headlines from different sources
- A headline can only belong to ONE cluster. Never assign the same headline index to multiple clusters.
- MERGE related sub-stories into ONE cluster. If a specific event (e.g., a shooting) and the broader political response (e.g., protests, policy debate, political fallout) are about the same underlying situation, they are ONE story, not separate stories. For example: "Alex Pretti shooting", "ICE raids backlash", "DHS turmoil after shooting", and "calls to defund ICE" are all ONE story about the immigration enforcement crisis.
- Aim for 10-20 clusters total, not 50+. Prefer fewer, broader clusters over many narrow ones.
- Do NOT create clusters for general ongoing themes (e.g., "Trump administration policies") — only cluster around specific events or developments.

TOPIC NAMING RULES (the topic is the headline readers see — it must make them want to read):
- Describe what HAPPENED, not the subject area.
  BAD: "Government Shutdown and Funding Standoff"
  GOOD: "Partial Shutdown Drags On as Democrats Demand ICE Reforms"
  BAD: "Grammy Awards 2026 and ICE Protests"
  GOOD: "Bad Bunny Makes Grammy History as Artists Protest ICE"
  BAD: "Trump Administration Policy Actions and Analysis"
  GOOD: "Trump Moves to Replace Fed Chair with Kevin Warsh"
- No editorial or loaded words: crisis, chaos, bombshell, slams, standoff, fallout, rips, blasts, fury, firestorm
- Include at least one concrete detail: a person, place, number, or specific action
- 6-14 words. Never use the "[Noun] and [Noun]" compound format.
- Neutral but vivid — factual language that conveys what is new today

- IMPORTANT: Return ONLY valid JSON. No markdown, no code fences.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const parsed = extractJSON(content.text) as { clusters?: Array<{ topic: string; headlineIndices: number[]; category: string }> };
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

// Extract key entities from topic and headlines for survey research queries
// Common title-case words that aren't meaningful entities
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "into", "over", "after", "before", "between",
  "new", "old", "big", "small", "first", "last", "next", "more", "most",
  "how", "why", "what", "when", "where", "who", "which",
  "says", "said", "say", "show", "shows", "finds", "found",
  "could", "would", "should", "may", "might", "will", "can",
  "amid", "amid", "over", "spark", "sparks", "faces", "face",
  "leads", "lead", "ends", "moves", "calls", "push", "pulls",
  "national", "political", "federal", "major", "growing", "latest",
  "report", "reports", "investigation", "operations", "operation",
  "backlash", "standoff", "crisis", "debate", "fight", "battle",
]);

function extractEntities(topic: string, headlines: string[]): string[] {
  const combined = [topic, ...headlines].join(" ");

  // Extract acronyms FIRST — ICE, FBI, NATO, EPA, TSA are almost always
  // the most important and specific entities for search queries
  const acronyms = (combined.match(/\b[A-Z]{2,6}\b/g) || [])
    .filter(a => !["US", "AM", "PM"].includes(a));

  // Extract proper nouns (multi-word capitalized phrases)
  const properNouns = (combined.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [])
    .filter(p => {
      // Filter out title-case noise — at least one word must not be a stopword
      const words = p.toLowerCase().split(/\s+/);
      return words.some(w => !STOPWORDS.has(w));
    });

  // Extract quoted terms
  const quoted = (combined.match(/"([^"]+)"/g) || []).map(q => q.replace(/"/g, ""));

  // Extract single capitalized words that might be names (not at sentence start)
  const singleNames = (combined.match(/(?<=\s)[A-Z][a-z]{2,}\b/g) || [])
    .filter(n => !STOPWORDS.has(n.toLowerCase()) && n.length > 3);

  const seen = new Set<string>();
  const entities: string[] = [];

  // Priority order: acronyms → quoted → proper nouns → single names
  for (const term of [...acronyms, ...quoted, ...properNouns, ...singleNames]) {
    const normalized = term.trim();
    if (normalized.length > 1 && !seen.has(normalized.toLowerCase())) {
      seen.add(normalized.toLowerCase());
      entities.push(normalized);
    }
  }

  return entities.slice(0, 10);
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

  // Cap Deep Dives at 3 to stay within timeout limits
  const maxDeepDives = 3;
  if (deepDive.length > maxDeepDives) {
    const demoted = deepDive.splice(maxDeepDives);
    quickTake.unshift(...demoted);
  }

  // Cap Quick Takes at 8
  if (quickTake.length > 8) {
    quickTake.splice(8);
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
  articleContent: Map<string, string>,
  pollingContext?: string
): Promise<ClearviewStory[]> {
  if (!client || clusters.length === 0) return [];

  const clusterData = clusters.map((cluster, idx) => {
    const clusterHeadlines = cluster.headlineIndices
      .map(i => headlines[i])
      .filter(Boolean);

    // Pick diverse headlines: up to 2 per lean category, max 12 total
    const seenLeans = new Map<string, number>();
    const selectedHeadlines = clusterHeadlines.filter(h => {
      const count = seenLeans.get(h.lean) || 0;
      if (count >= 2) return false;
      seenLeans.set(h.lean, count + 1);
      return true;
    }).slice(0, 12);

    const headlinesWithContent = selectedHeadlines.map(h => {
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
          "manipulationTechniques": ["technique1", "technique2"],
          "emotionalTechniques": [
            { "type": "contempt|disgust|dehumanization|fear|schadenfreude|epistemic_arrogance|cynicism_induction|self_serving_outrage|anger", "label": "Brief description of technique", "severity": "low|moderate|high", "evidence": "brief quote or pattern" }
          ]
        }
      ],
      "perspectives": [
        {
          "lean": "Left",
          "viewpoint": "2 sentences max. First sentence is bold thesis, second adds context.",
          "moralFoundations": [
            { "foundation": "care", "label": "Protecting vulnerable communities", "strength": "primary" }
          ]
        },
        {
          "lean": "Right",
          "viewpoint": "2 sentences max. First sentence is bold thesis, second adds context.",
          "moralFoundations": [
            { "foundation": "liberty", "label": "Preserving individual choice", "strength": "primary" }
          ]
        }
      ],
      "keyTakeaway": "One sentence helping reader understand without spin",
      "expertConsensus": {
        "type": "scientific|legal|historical|economic|intelligence|statistical|professional|international|none",
        "exists": true,
        "statement": "What expert consensus says",
        "confidenceLevel": "high|moderate|low|contested",
        "sources": [{ "name": "CDC", "articleUrl": "url of the article that cites this", "articleName": "NPR" }],
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
      },
      "perceptionGap": {
        "claim": "What the public actually agrees on",
        "actualAgreement": "Specific polling data with source, date, and percentages",
        "mediaPortrayal": "How media frames it differently from reality",
        "pollSource": "Pew Research Center",
        "pollDate": "March 2024",
        "crossPartisanBreakdown": "Democrats: 85%, Independents: 67%, Republicans: 54%"
      },
      "sharedValues": ["Specific values both sides genuinely share on this story"],
      "moralFoundationsInPlay": ["care", "fairness", "loyalty", "authority", "sanctity", "liberty"]
    }
  ]
}

${pollingContext || ""}

CRITICAL GUIDELINES:
- Use the FULL ARTICLE CONTENT to understand the complete story
- Be genuinely neutral in summaries
- Identify manipulation techniques: loaded language, fear-mongering, omission of context, false equivalence, appeal to emotion
- REQUIRED: Every story MUST include expertConsensus, whyItMatters, and deeperAnalysis
- Be empathetic to both sides - help readers understand WHY reasonable people disagree
- expertConsensus.sources: ONLY cite expert/institutional positions that are directly quoted or referenced in the provided article content. Each source must include the articleUrl and articleName of the article where the reference appears. If no article references expert consensus, set type to "none".

MORAL FOUNDATIONS ANALYSIS (Haidt's framework):
- For each perspective, identify which moral foundations drive the viewpoint:
  - care: concern about harm to vulnerable people
  - fairness: concern about equality, proportionality, or justice
  - loyalty: concern about group bonds, patriotism, or betrayal
  - authority: concern about order, tradition, or legitimate institutions
  - sanctity: concern about purity, degradation, or sacred values
  - liberty: concern about autonomy, oppression, or government overreach
- Most perspectives activate 1-2 primary and 0-2 secondary foundations
- Don't force-fit — only tag foundations genuinely present

EMOTIONAL MANIPULATION TECHNIQUES (per source):
- Beyond existing manipulationTechniques, identify specific emotional techniques:
  - contempt: sneering, mocking, treating opponents as beneath consideration
  - disgust: contamination language, portraying opponents as pollutants
  - dehumanization: denying opponents' full humanity, animal/disease metaphors
  - fear: existential threat framing, catastrophizing, mortality salience
  - schadenfreude: celebrating opponents' suffering or losses
  - epistemic_arrogance: "everyone knows", "only an idiot would think"
  - cynicism_induction: "nothing matters", "they're all corrupt", "the system is rigged"
  - self_serving_outrage: performative outrage that serves identity rather than justice
  - anger: direct rage mobilization
- Rate severity: low (subtle), moderate (clear pattern), high (dominant technique)
- Include specific evidence (brief quote or pattern)
- If no emotional techniques are present, use an empty array

PERCEPTION GAP (if applicable):
- Where media framing suggests deeper division than public opinion data supports
- CRITICAL: If GROUNDED SURVEY RESEARCH DATA is provided above for this story's topic, you MUST use THOSE exact numbers, sources, and dates. Do NOT substitute with your own knowledge. The grounded data was found via real web search and is more accurate and timely than your training data.
- If no grounded data is provided, you may use your knowledge of major polling organizations, but ONLY if you can cite a specific poll with real numbers: organization name, date, and percentages.
- Include actual percentages with source and date: e.g., "65% say ICE has gone too far (NPR/PBS News/Marist, January 2026)"
- If you cannot cite a specific poll with real numbers on this topic, OMIT the perceptionGap field entirely. Do NOT include vague claims without data.

SHARED VALUES:
- Identify 1-3 values or goals that both perspectives genuinely share
- These should be specific to this story, not generic platitudes
- If no genuine shared values exist, use an empty array

- IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no commentary. Escape all special characters in strings.`;

  let fullText = "";
  const stream = await client.messages.stream({
    model: "claude-opus-4-5-20251101",
    max_tokens: 10000,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
    }
  }

  const parsed = extractJSON(fullText) as { stories?: ClearviewStory[] };

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
      .filter(Boolean)
      .slice(0, 8); // Cap headlines sent to analysis

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
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const parsed = extractJSON(content.text) as { stories?: ClearviewStory[] };

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
    const debugMode = request.nextUrl.searchParams.get("debug");

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

    // Debug mode: return clustering data without running analysis
    if (debugMode === "clusters") {
      const clusterDetails = [...deepDive, ...quickTake].map(c => ({
        topic: c.topic,
        tier: deepDive.includes(c) ? "deep-dive" : "quick-take",
        category: c.category,
        sourceCount: c.sourceCount,
        spectrumSpread: c.spectrumSpread,
        score: c.score,
        headlines: c.headlineIndices.map(i => headlines[i]).filter(Boolean).map(h => ({
          source: h.source,
          lean: h.lean,
          title: h.title,
        })),
      }));
      return NextResponse.json({
        debug: true,
        totalHeadlines: headlines.length,
        totalClusters: clusters.length,
        deepDiveCount: deepDive.length,
        quickTakeCount: quickTake.length,
        clusters: clusterDetails,
      });
    }

    // Phase 4: Extract articles + survey research pipeline in parallel
    console.log(`Cron: [${Date.now() - startTime}ms] Starting Phase 4: Extract articles + survey research`);
    const surveyStories: StoryContext[] = deepDive.map(c => {
      const clusterHeadlines = c.headlineIndices.map(i => headlines[i]?.title || "").filter(Boolean);
      return {
        topic: c.topic,
        category: c.category,
        entities: extractEntities(c.topic, clusterHeadlines),
        angle: clusterHeadlines.slice(0, 3).join(" | "),
        summary: clusterHeadlines[0] || c.topic,
      };
    });
    const [articleContent, surveyData] = await Promise.all([
      extractArticlesForClusters(deepDive, headlines),
      researchSurveyData(surveyStories),
    ]);
    const pollingContext = formatSurveyContext(surveyData);
    // Log what the survey pipeline found for debugging
    for (const [topic, result] of surveyData) {
      console.log(`Cron: Survey data for "${topic}": ${result.rawPolls.length} polls, headline="${result.analysis.headlineInsight?.slice(0, 80) || 'none'}"`);
      for (const poll of result.rawPolls) {
        console.log(`  - ${poll.organization} (${poll.datesConducted}): ${poll.questions.length} questions`);
      }
    }
    if (pollingContext) {
      console.log(`Cron: Polling context length: ${pollingContext.length} chars`);
    }
    console.log(`Cron: [${Date.now() - startTime}ms] Phase 4 complete: ${articleContent.size} articles extracted, ${surveyData.size} topics with survey data`);

    // Phase 5: Analyze both tiers in parallel
    console.log(`Cron: [${Date.now() - startTime}ms] Starting Phase 5: LLM analysis`);
    const [deepDiveStories, quickTakeStories] = await Promise.all([
      analyzeDeepDive(deepDive, headlines, articleContent, pollingContext),
      analyzeQuickTake(quickTake, headlines),
    ]);
    console.log(`Cron: [${Date.now() - startTime}ms] Phase 5 complete`);

    // Attach survey research data to stories (before saving)
    for (const story of deepDiveStories) {
      const survey = surveyData.get(story.topic);
      if (survey) {
        story.surveyResearch = {
          analysis: survey.analysis,
          vizSpecs: survey.vizSpecs,
          rawPolls: survey.rawPolls,
        };
        // Override perceptionGap with grounded data from survey pipeline
        if (survey.analysis?.headlineInsight) {
          // Find the first key finding with valid numeric cross-partisan data
          const cpFinding = survey.analysis.keyFindings.find(f =>
            f.crossPartisan &&
            typeof f.crossPartisan === "object" &&
            typeof f.crossPartisan.dem === "number" &&
            typeof f.crossPartisan.ind === "number" &&
            typeof f.crossPartisan.rep === "number" &&
            !isNaN(f.crossPartisan.dem) &&
            !isNaN(f.crossPartisan.ind) &&
            !isNaN(f.crossPartisan.rep)
          );
          const cp = cpFinding?.crossPartisan;

          story.perceptionGap = {
            claim: survey.analysis.perceptionGap?.claim || survey.analysis.headlineInsight,
            actualAgreement: survey.analysis.keyFindings[0]?.finding || "",
            mediaPortrayal: survey.analysis.perceptionGap?.mediaFraming || "",
            pollSource: survey.rawPolls[0]?.organization || "",
            pollDate: survey.rawPolls[0]?.datesConducted || "",
            crossPartisanBreakdown: cp
              ? `Dem: ${cp.dem}%, Ind: ${cp.ind}%, Rep: ${cp.rep}%`
              : undefined,
          };
        }
        console.log(`Cron: Attached survey research to "${story.topic}" (${survey.vizSpecs.length} charts, ${survey.rawPolls.length} polls)`);
      }
    }

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

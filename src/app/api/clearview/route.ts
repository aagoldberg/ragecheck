import { NextResponse } from "next/server";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { getClearviewData, saveClearviewData, initClearviewTable, isDBAvailable } from "@/lib/db";

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
  lean: "Far Left" | "Left" | "Center" | "Right" | "Far Right";
  feedUrl: string;
}

// Sources across the political spectrum
const FEED_SOURCES: FeedSource[] = [
  {
    name: "Jacobin",
    lean: "Far Left",
    feedUrl: "https://jacobin.com/feed",
  },
  {
    name: "NPR",
    lean: "Left",
    feedUrl: "https://feeds.npr.org/1001/rss.xml", // NPR News
  },
  {
    name: "PBS",
    lean: "Center",
    feedUrl: "https://www.pbs.org/newshour/feeds/rss/headlines",
  },
  {
    name: "Fox News",
    lean: "Right",
    feedUrl: "https://moxie.foxnews.com/google-publisher/politics.xml",
  },
  {
    name: "Breitbart",
    lean: "Far Right",
    feedUrl: "https://feeds.feedburner.com/breitbart",
  },
];

interface RawHeadline {
  source: string;
  lean: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt: string;
}

interface StoryCluster {
  id: string;
  topic: string;
  summary: string;
  whatHappened: string;
  sources: {
    name: string;
    lean: string;
    title: string;
    url: string;
    framing: string;
    manipulationTechniques: string[];
  }[];
  perspectives: {
    lean: string;
    viewpoint: string;
  }[];
  keyTakeaway: string;
  // Expert consensus across domains
  expertConsensus?: {
    type: "scientific" | "legal" | "historical" | "economic" | "intelligence" | "statistical" | "professional" | "international" | "none";
    exists: boolean;
    statement?: string;
    confidenceLevel: "high" | "moderate" | "low" | "contested";
    sources?: string[];
    dissent?: string; // Notable dissenting views if any
  };
  debateType: "factual" | "policy" | "values" | "mixed";
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: {
    claim: string;
    leftPosition: string;
    rightPosition: string;
    evidenceStatus: "supported" | "mixed" | "unsupported" | "misleading";
  }[];
}

interface ClearviewResponse {
  success: boolean;
  stories: StoryCluster[];
  generatedAt: string;
  error?: string;
}

// Cache duration in hours
const CACHE_HOURS = 4;

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

async function clusterAndAnalyze(headlines: RawHeadline[]): Promise<StoryCluster[]> {
  if (!client) {
    throw new Error("LLM not available");
  }

  // Create a summary of all headlines for Claude to cluster and analyze
  const headlinesSummary = headlines
    .map((h, i) => `[${i}] ${h.source} (${h.lean}): "${h.title}"`)
    .join("\n");

  const prompt = `You are analyzing today's news headlines from sources across the political spectrum to help readers understand what's actually happening vs how stories are being framed.

Here are today's headlines:

${headlinesSummary}

Your task:
1. Identify the TOP 3-5 major news stories that multiple sources are covering (group related headlines)
2. For each story, provide:
   - A neutral, factual summary of what actually happened
   - How each source is framing/spinning the story
   - What manipulation techniques (if any) each source is using
   - The key perspectives from different political viewpoints
   - CRITICAL: Identify if there's scientific/expert consensus on the underlying facts
   - Distinguish between factual disputes vs policy/values debates

Respond with this exact JSON structure:
{
  "stories": [
    {
      "id": "story-1",
      "topic": "Brief topic name (e.g., 'Immigration Policy Changes')",
      "summary": "2-3 sentence neutral summary of what actually happened, just the facts",
      "whatHappened": "Detailed explanation of the actual events, stripped of spin",
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
        {
          "lean": "Left",
          "viewpoint": "How the left generally sees this issue and why"
        },
        {
          "lean": "Right",
          "viewpoint": "How the right generally sees this issue and why"
        }
      ],
      "keyTakeaway": "One sentence helping the reader understand the story without the spin",
      "expertConsensus": {
        "type": "scientific|legal|historical|economic|intelligence|statistical|professional|international|none",
        "exists": true/false,
        "statement": "What expert consensus says (if applicable)",
        "confidenceLevel": "high|moderate|low|contested",
        "sources": ["CDC", "Supreme Court", "Bureau of Labor Statistics", "FBI/CIA", "historians", etc.],
        "dissent": "Notable minority expert view if relevant"
      },
      "debateType": "factual|policy|values|mixed",
      "debateQuestion": "The actual question being debated (e.g., 'Should vaccines be mandated?' not 'Are vaccines safe?')",
      "commonGround": ["Facts both sides agree on"],
      "factualDisputes": [
        {
          "claim": "The disputed claim",
          "leftPosition": "What left-leaning sources claim",
          "rightPosition": "What right-leaning sources claim",
          "evidenceStatus": "supported|mixed|unsupported|misleading"
        }
      ]
    }
  ]
}

CRITICAL GUIDELINES:
- Only include stories covered by 2+ sources
- Be genuinely neutral in your summaries
- Identify manipulation techniques like: loaded language, fear-mongering, omission of context, false equivalence, appeal to emotion, etc.
- Include the actual URLs from the headlines data
- If a story only has one source, skip it

EXPERT CONSENSUS RULES:
- Identify the most relevant type of expert consensus for each story:
  - "scientific": Medical, climate, physics, biology (sources: CDC, WHO, peer-reviewed journals)
  - "legal": Constitutional law, court rulings (sources: Supreme Court, legal scholars, bar associations)
  - "historical": What historians document happened (sources: historians, archives, documentation)
  - "economic": Economic effects, trade, fiscal policy (sources: CBO, economists, Federal Reserve)
  - "intelligence": National security, foreign interference (sources: FBI, CIA, DNI assessments)
  - "statistical": Crime rates, demographics, measurable data (sources: BLS, Census, FBI UCR)
  - "professional": Industry standards, best practices (sources: professional associations)
  - "international": International law, treaties (sources: UN, ICC, international courts)
  - "none": No clear expert domain applies or genuinely contested among experts
- If experts broadly agree, set exists to true and state the consensus clearly
- Include "dissent" only if there's a notable minority expert view worth mentioning
- debateType should be:
  - "factual" if the debate is about what happened/is true
  - "policy" if the facts are agreed but the debate is about what to do
  - "values" if it's about competing moral/ethical priorities
  - "mixed" if it involves multiple types
- For factualDisputes, honestly assess whether claims are supported by evidence
- evidenceStatus "misleading" means the claim contains some truth but is framed deceptively
- Don't create false balance: if one side's claims contradict expert consensus, say so`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  // Parse JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse analysis");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.stories || [];
}

export async function GET() {
  try {
    // Check database cache first
    const dbAvailable = await isDBAvailable();

    if (dbAvailable) {
      await initClearviewTable();
      const cached = await getClearviewData(CACHE_HOURS);

      if (cached && cached.stories.length > 0) {
        console.log("Returning cached Clearview data from DB");
        return NextResponse.json({
          success: true,
          stories: cached.stories,
          generatedAt: cached.generatedAt,
          cached: true,
        });
      }
    }

    // No cache - need to generate fresh content
    if (!client) {
      return NextResponse.json(
        { success: false, error: "Analysis service unavailable" },
        { status: 503 }
      );
    }

    console.log("Generating fresh Clearview analysis...");

    // Fetch all headlines
    const headlines = await fetchAllHeadlines();

    if (headlines.length < 5) {
      return NextResponse.json(
        { success: false, error: "Not enough headlines available" },
        { status: 503 }
      );
    }

    // Cluster and analyze with AI
    const stories = await clusterAndAnalyze(headlines);

    const response: ClearviewResponse = {
      success: true,
      stories,
      generatedAt: new Date().toISOString(),
    };

    // Save to database for persistence
    if (dbAvailable) {
      await saveClearviewData(stories);
      console.log("Saved Clearview data to DB");
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Clearview API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed"
      },
      { status: 500 }
    );
  }
}

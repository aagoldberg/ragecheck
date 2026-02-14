// Poll Collector Agent (replaces poll-finder.ts)
//
// Two-step process:
// 1. Discovery: LLM + web search finds poll report URLs (not data from snippets)
// 2. Fetch + Extract: For each new URL, fetch the actual page and extract full cross-tab data
//
// Key improvement over poll-finder: We fetch the actual poll report pages and extract
// ALL cross-tab data (partisan breakdowns, demographics, trend data) instead of relying
// on web search snippets which consistently return 0% values.

import Anthropic from "@anthropic-ai/sdk";
import { extractContent } from "@/lib/extract";
import { StoryContext, PollQuestion, DiscoveredPoll, DiscoveryResult } from "./types";
import { upsertPoll, getExistingUrls } from "./poll-store";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ── Step 1: Discovery ───────────────────────────────────────

const DISCOVERY_PROMPT = `You are a specialized polling data URL FINDER. Your ONLY job is to search the web and find URLs to actual poll report pages for a news story.

CRITICAL: You are finding URLS to primary poll reports, NOT extracting data from news article snippets. When a news article says "a new Marist poll found...", your job is to find the URL to the actual Marist poll report page.

SEARCH STRATEGY:

STEP 1: SPECIFIC ENTITY SEARCH (first 3-4 searches)
Use the EXACT key entities from the story.
- Story about ICE operations → search "ICE poll 2026 marist" and "ICE actions survey results"
- Story about tariffs → search "tariffs poll 2026 results" and "Trump tariffs public opinion data"
- NEVER start generic — always use the specific entity first

STEP 2: ORGANIZATION-SPECIFIC SEARCH (next 2-3 searches)
Search specific polling organizations likely to have polled on this topic:
- Immigration/ICE → "marist poll ICE 2026", "pew immigration enforcement survey"
- Healthcare → "kff health poll 2026", "gallup healthcare survey"
- Economy → "gallup economy 2026", "ap-norc economic survey"
- Government → "pew trust government 2026"

STEP 3: AGGREGATOR SEARCH (1-2 searches)
Search FiveThirtyEight, RealClearPolling to catch polls from smaller firms.

STEP 4: BROADER SEARCH (remaining, only if needed)
Search the broader policy area or cross-partisan data.

TRUSTED POLLING SOURCES (prioritize finding URLs from these):
Tier 1: pewresearch.org, gallup.com, apnorc.org, kff.org, prri.org, ipsos.com, moreincommon.com
Tier 2: maristpoll.marist.edu, poll.qu.edu, monmouth.edu, emersoncollegepolling.com, marquette.edu
Tier 3: morningconsult.com, today.yougov.com, theharrispoll.com, surveyusa.com, ssrs.com, civiqs.com
Tier 4: brookings.edu, rand.org, aei.org, cato.org
Tier 5: fivethirtyeight.com, realclearpolling.com, ballotpedia.org

RECENCY IS CRITICAL:
- Current date is February 2026
- A poll from January 2026 >> one from 2024
- Include "2025" or "2026" in search queries

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "discoveredPolls": [
    {
      "url": "https://maristpoll.marist.edu/polls/the-actions-of-ice-february-2026/",
      "organization": "NPR/PBS News/Marist Poll",
      "approximateDate": "January 2026"
    }
  ]
}

RULES:
- Find URLs to ACTUAL POLL REPORT PAGES, not news articles about polls
- If a news article references a poll, find the primary source URL
- If you can only find the news article URL (not the primary source), include it but note the organization
- Return 3-8 URLs per story
- Return ONLY valid JSON, no markdown or code fences`;

export async function discoverPolls(story: StoryContext): Promise<DiscoveryResult> {
  if (!client) return { topic: story.topic, discoveredPolls: [], searchFailed: true };

  const primaryEntity = story.entities[0] || story.topic.split(" ").slice(0, 3).join(" ");
  const suggestedSearches = [
    `${primaryEntity} poll 2026`,
    `${primaryEntity} survey results 2025 2026`,
    `${story.entities.slice(0, 2).join(" ")} polling data`,
  ].filter(Boolean);

  console.log(`Poll Collector: Discovering polls for "${story.topic}" with entities=[${story.entities.join(", ")}]`);

  const userPrompt = `Find URLs to actual poll report pages for this news story:

TOPIC: ${story.topic}
CATEGORY: ${story.category}
KEY ENTITIES: ${story.entities.join(", ")}
SPECIFIC ANGLE: ${story.angle}
${story.summary ? `SUMMARY: ${story.summary}` : ""}

YOUR FIRST SEARCHES MUST BE:
${suggestedSearches.map((s, i) => `  ${i + 1}. "${s}"`).join("\n")}

Find 3-8 URLs to actual poll report pages (not news articles about polls).`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 10,
        },
      ],
      system: DISCOVERY_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const fullText = textBlocks.map(b => b.text).join("");

    if (!fullText) {
      console.log(`Poll Collector: No text response for "${story.topic}"`);
      return { topic: story.topic, discoveredPolls: [], searchFailed: true };
    }

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`Poll Collector: No JSON in response for "${story.topic}"`);
      return { topic: story.topic, discoveredPolls: [], searchFailed: true };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.log(`Poll Collector: JSON parse failed for discovery of "${story.topic}"`);
      return { topic: story.topic, discoveredPolls: [], searchFailed: true };
    }
    const discoveredPolls: DiscoveredPoll[] = (parsed.discoveredPolls || [])
      .filter((p: Record<string, unknown>) => p.url && typeof p.url === "string")
      .map((p: Record<string, unknown>) => ({
        url: p.url as string,
        organization: (p.organization as string) || "Unknown",
        approximateDate: (p.approximateDate as string) || "",
      }));

    console.log(`Poll Collector: Discovered ${discoveredPolls.length} poll URLs for "${story.topic}"`);
    return { topic: story.topic, discoveredPolls };
  } catch (error) {
    console.error(`Poll Collector discovery failed for "${story.topic}":`, error);
    return { topic: story.topic, discoveredPolls: [], searchFailed: true };
  }
}

// ── Step 2: Fetch + Extract ─────────────────────────────────

const EXTRACTION_PROMPT = `You are a specialized polling data EXTRACTOR. You receive the full text of a poll report page. Your job is to extract EVERY piece of quantitative data on the page.

Extract ALL of the following:

1. ORGANIZATION: Full name including partners (e.g., "NPR/PBS News/Marist Poll")
2. DATES CONDUCTED: Specific dates (e.g., "January 27-30, 2026")
3. SAMPLE SIZE: The number (e.g., 1462)
4. MARGIN OF ERROR: (e.g., "±2.9 percentage points")
5. MODE: How the poll was conducted (phone, online, text, mixed)
6. POLL DATE: The latest date of the field period as ISO date (e.g., "2026-01-30")
7. TOPICS: Array of lowercase topic keywords (e.g., ["immigration", "ice", "enforcement"])
8. ENTITIES: Array of key entities mentioned (e.g., ["ICE", "Trump", "DHS"])
9. QUESTIONS: For EACH question on the page:
   a. EXACT question wording — copy verbatim, do not paraphrase
   b. ALL response options with overall percentages
   c. PARTISAN BREAKDOWN: Democrat, Independent, Republican percentages for each option
   d. DEMOGRAPHIC BREAKDOWNS if available (age, race, education, gender, income, region)
   e. TREND DATA: If previous wave results are shown, include them with dates

Return ONLY valid JSON:
{
  "organization": "NPR/PBS News/Marist Poll",
  "datesConducted": "January 27-30, 2026",
  "sampleSize": 1462,
  "marginOfError": "±2.9 percentage points",
  "mode": "phone, text, online",
  "pollDate": "2026-01-30",
  "topics": ["immigration", "ice", "enforcement", "deportation"],
  "entities": ["ICE", "Trump", "DHS"],
  "extractionQuality": "full",
  "questions": [
    {
      "questionWording": "How would you describe the actions of Immigration and Customs Enforcement, also known as ICE?",
      "responses": [
        {
          "option": "Gone too far",
          "overall": 65,
          "byParty": { "dem": 93, "ind": 71, "rep": 27 },
          "byDemographic": { "18-29": 72, "30-44": 68, "45-59": 63, "60+": 58 }
        }
      ],
      "trendData": [
        {
          "date": "June 2025",
          "values": { "Gone too far": 54, "About right": 26, "Not gone far enough": 18 }
        }
      ]
    }
  ]
}

RULES:
- Transcribe EVERY data cell. Do not summarize.
- Do NOT paraphrase question wording. Copy exactly.
- Include ALL response options, not just notable ones.
- Set extractionQuality to "full" if you found partisan breakdowns and demographics, "partial" if only overall numbers, "snippet_only" if very limited data.
- Return ONLY valid JSON, no markdown or code fences.
- Every number must come from the page text. Do NOT invent data.`;

interface ExtractedPollData {
  organization: string;
  datesConducted: string | null;
  sampleSize: number | null;
  marginOfError: string | null;
  mode: string | null;
  pollDate: string | null;
  topics: string[];
  entities: string[];
  extractionQuality: "full" | "partial" | "snippet_only";
  questions: PollQuestion[];
}

async function extractPollData(
  pageText: string,
  url: string,
  fallbackOrg: string
): Promise<ExtractedPollData | null> {
  if (!client) return null;

  // Truncate very long pages to stay within context limits
  const truncated = pageText.slice(0, 30000);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      system: EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract ALL polling data from this page:\n\nURL: ${url}\n\nPAGE TEXT:\n${truncated}`,
        },
      ],
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const fullText = textBlocks.map(b => b.text).join("");

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`Poll Collector: No JSON in extraction for ${url}`);
      return null;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // LLM sometimes produces malformed JSON for long pages — try to salvage
      console.log(`Poll Collector: JSON parse failed for ${url}, attempting cleanup`);
      try {
        // Common issue: trailing content after the JSON object
        const cleaned = jsonMatch[0].replace(/,\s*\]/g, "]").replace(/,\s*\}/g, "}");
        parsed = JSON.parse(cleaned);
      } catch {
        console.log(`Poll Collector: JSON cleanup also failed for ${url}`);
        return null;
      }
    }

    const questions: PollQuestion[] = (parsed.questions || [])
      .map((q: Record<string, unknown>) => ({
        questionWording: (q.questionWording as string) || "",
        responses: ((q.responses as Record<string, unknown>[]) || []).map(
          (r: Record<string, unknown>) => ({
            option: (r.option as string) || "",
            overall: typeof r.overall === "number" ? r.overall : 0,
            byParty: r.byParty as { dem: number; ind: number; rep: number } | undefined,
            byDemographic: r.byDemographic as Record<string, number> | undefined,
          })
        ),
        trendData: ((q.trendData as Record<string, unknown>[]) || [])
          .map((t: Record<string, unknown>) => ({
            date: (t.date as string) || "",
            values: (t.values as Record<string, number>) || {},
          }))
          .filter(
            (t: { date: string; values: Record<string, number> }) =>
              t.date && Object.keys(t.values).length > 0
          ),
      }))
      .filter(
        (q: PollQuestion) => q.questionWording && q.responses.length > 0
      );

    return {
      organization: (parsed.organization as string) || fallbackOrg,
      datesConducted: (parsed.datesConducted as string) || null,
      sampleSize: typeof parsed.sampleSize === "number" ? parsed.sampleSize : null,
      marginOfError: (parsed.marginOfError as string) || null,
      mode: (parsed.mode as string) || null,
      pollDate: (parsed.pollDate as string) || null,
      topics: (parsed.topics as string[]) || [],
      entities: (parsed.entities as string[]) || [],
      extractionQuality:
        (["full", "partial", "snippet_only"].includes(parsed.extractionQuality as string)
          ? parsed.extractionQuality
          : "partial") as "full" | "partial" | "snippet_only",
      questions,
    };
  } catch (error) {
    console.error(`Poll Collector: Extraction failed for ${url}:`, error);
    return null;
  }
}

// ── Main Collection Flow ────────────────────────────────────

/**
 * Collect polls for a single story:
 * 1. Discover poll URLs via web search
 * 2. Dedup against existing DB entries
 * 3. Fetch + extract new poll pages
 * 4. Store in DB
 */
export async function collectPollsForStory(
  story: StoryContext
): Promise<{ discovered: number; newlyStored: number; skippedExisting: number }> {
  const stats = { discovered: 0, newlyStored: 0, skippedExisting: 0 };

  // Step 1: Discover URLs
  const discovery = await discoverPolls(story);
  if (discovery.searchFailed || discovery.discoveredPolls.length === 0) {
    console.log(`Poll Collector: No polls discovered for "${story.topic}"`);
    return stats;
  }
  stats.discovered = discovery.discoveredPolls.length;

  // Step 2: Dedup
  const urls = discovery.discoveredPolls.map(p => p.url);
  const existing = await getExistingUrls(urls);
  const newPolls = discovery.discoveredPolls.filter(p => !existing.has(p.url));
  stats.skippedExisting = existing.size;

  if (newPolls.length === 0) {
    console.log(`Poll Collector: All ${stats.discovered} polls already in DB for "${story.topic}"`);
    return stats;
  }

  console.log(`Poll Collector: ${newPolls.length} new URLs to fetch for "${story.topic}" (${existing.size} already in DB)`);

  // Step 3: Fetch + Extract (with rate limiting)
  const maxNewFetches = 5; // Cap per story per refresh
  for (let i = 0; i < Math.min(newPolls.length, maxNewFetches); i++) {
    const poll = newPolls[i];

    // Rate limit: 1s between fetches
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      console.log(`Poll Collector: Fetching ${poll.url}`);
      const extracted = await extractContent(poll.url);

      if (!extracted.success || !extracted.text || extracted.text.length < 100) {
        console.log(`Poll Collector: Page fetch failed/empty for ${poll.url}, storing with snippet_only quality`);
        // Store what we know from discovery even if page fetch fails
        await upsertPoll({
          url: poll.url,
          organization: poll.organization,
          datesConducted: null,
          pollDate: null,
          sampleSize: null,
          marginOfError: null,
          mode: null,
          topics: story.topic.toLowerCase().split(/\s+/).filter(w => w.length > 3),
          entities: story.entities.map(e => e.toLowerCase()),
          categories: [story.category],
          questions: [],
          pageText: null,
          extractionQuality: "snippet_only",
          firstSeenInStory: story.topic,
        });
        stats.newlyStored++;
        continue;
      }

      // Step 4: Extract structured data from page text
      const pollData = await extractPollData(extracted.text, poll.url, poll.organization);

      if (!pollData || pollData.questions.length === 0) {
        console.log(`Poll Collector: Extraction yielded no questions for ${poll.url}, storing page for future re-extraction`);
        await upsertPoll({
          url: poll.url,
          organization: poll.organization,
          topics: story.topic.toLowerCase().split(/\s+/).filter(w => w.length > 3),
          entities: story.entities.map(e => e.toLowerCase()),
          categories: [story.category],
          questions: [],
          pageText: extracted.text,
          extractionQuality: "snippet_only",
          firstSeenInStory: story.topic,
        });
        stats.newlyStored++;
        continue;
      }

      // Merge story context into topics/entities
      const mergedTopics = [
        ...new Set([
          ...pollData.topics,
          ...story.topic.toLowerCase().split(/\s+/).filter(w => w.length > 3),
        ]),
      ];
      const mergedEntities = [
        ...new Set([
          ...pollData.entities.map(e => e.toLowerCase()),
          ...story.entities.map(e => e.toLowerCase()),
        ]),
      ];

      await upsertPoll({
        url: poll.url,
        organization: pollData.organization,
        datesConducted: pollData.datesConducted,
        pollDate: pollData.pollDate,
        sampleSize: pollData.sampleSize,
        marginOfError: pollData.marginOfError,
        mode: pollData.mode,
        topics: mergedTopics,
        entities: mergedEntities,
        categories: [story.category],
        questions: pollData.questions,
        pageText: extracted.text,
        extractionQuality: pollData.extractionQuality,
        firstSeenInStory: story.topic,
      });
      stats.newlyStored++;

      console.log(
        `Poll Collector: Stored ${poll.organization} (${pollData.questions.length} questions, quality=${pollData.extractionQuality}) for "${story.topic}"`
      );
    } catch (error) {
      console.error(`Poll Collector: Failed to process ${poll.url}:`, error);
    }
  }

  return stats;
}

/**
 * Collect polls for multiple stories with concurrency limit.
 */
export async function collectPollsForStories(
  stories: StoryContext[],
  concurrency = 2
): Promise<void> {
  for (let i = 0; i < stories.length; i += concurrency) {
    const batch = stories.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(s => collectPollsForStory(s)));

    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      console.log(
        `Poll Collector: "${batch[j].topic}" — discovered=${r.discovered}, newlyStored=${r.newlyStored}, skippedExisting=${r.skippedExisting}`
      );
    }
  }
}

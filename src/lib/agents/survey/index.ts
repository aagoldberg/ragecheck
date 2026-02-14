// Survey Research Pipeline — Orchestrator
// New flow: Poll Collector (discover + fetch + store in DB) → Poll Analyst (query DB) → Viz Spec Generator
// Single entry point for the refresh pipeline.

import { collectPollsForStories } from "./poll-collector";
import { analyzePolls } from "./poll-analyst";
import { generateVizSpecs } from "./viz-spec";
import { initPollsTable, findRelevantPolls } from "./poll-store";
import { StoryContext, SurveyResearchResult, StoredPoll, RawPollData, PollAnalysis } from "./types";

export type { StoryContext, SurveyResearchResult, VizSpec, PollAnalysis, RawPollData } from "./types";

// Ensure the polls table exists (called once per process)
let tableInitialized = false;
async function ensureTable() {
  if (tableInitialized) return;
  try {
    await initPollsTable();
    tableInitialized = true;
  } catch (error) {
    console.error("Survey pipeline: Failed to initialize polls table:", error);
    // Don't set flag — retry next time
  }
}

// Convert StoredPoll to RawPollData for backwards compatibility
function storedPollToRawPoll(poll: StoredPoll): RawPollData {
  return {
    organization: poll.organization,
    datesConducted: poll.datesConducted || "Unknown",
    sampleSize: poll.sampleSize || undefined,
    marginOfError: poll.marginOfError || undefined,
    mode: poll.mode || undefined,
    url: poll.url,
    questions: poll.questions,
  };
}

// Main entry point — collect polls, then analyze per story
export async function collectAndAnalyzePolls(
  stories: StoryContext[],
  concurrency = 2
): Promise<Map<string, SurveyResearchResult>> {
  const results = new Map<string, SurveyResearchResult>();
  const startTime = Date.now();

  // Ensure DB table exists
  await ensureTable();

  // Step 1: Discover + fetch + store new polls for all stories
  console.log(`Survey pipeline: Starting collection for ${stories.length} stories`);
  await collectPollsForStories(stories, concurrency);
  console.log(`Survey pipeline: Collection complete (${Date.now() - startTime}ms)`);

  // Step 2: For each story, query DB and analyze
  for (const story of stories) {
    try {
      const polls = await findRelevantPolls(story);
      console.log(`Survey pipeline [${story.topic}]: Found ${polls.length} relevant polls in DB`);

      if (polls.length === 0) continue;

      // Analyze
      const analysis = await analyzePolls(story, polls);
      if (!analysis) {
        console.log(`Survey pipeline [${story.topic}]: Analysis failed, generating charts from raw data`);
        const fallbackAnalysis: PollAnalysis = {
          headlineInsight: "",
          perceptionGap: { claim: "", mediaFraming: "", gapMagnitude: "" },
          keyFindings: [],
          dataQuality: "limited",
          sourceCount: polls.length,
        };
        // Still generate viz specs from raw poll data even without analyst output
        const vizSpecs = generateVizSpecs(fallbackAnalysis, polls);
        console.log(`Survey pipeline [${story.topic}]: Generated ${vizSpecs.length} charts from raw data`);
        results.set(story.topic, {
          topic: story.topic,
          analysis: fallbackAnalysis,
          vizSpecs,
          rawPolls: polls.map(storedPollToRawPoll),
        });
        continue;
      }

      // Generate viz specs
      const vizSpecs = generateVizSpecs(analysis, polls);
      console.log(`Survey pipeline [${story.topic}]: Complete — ${vizSpecs.length} charts`);

      results.set(story.topic, {
        topic: story.topic,
        analysis,
        vizSpecs,
        rawPolls: polls.map(storedPollToRawPoll),
      });
    } catch (error) {
      console.error(`Survey pipeline failed for "${story.topic}":`, error);
    }
  }

  console.log(`Survey pipeline: All done (${Date.now() - startTime}ms) — ${results.size}/${stories.length} stories with data`);
  return results;
}

// Backwards-compatible alias
export const researchSurveyData = collectAndAnalyzePolls;

// Format survey data as text context for the deep dive prompt
// (backwards-compatible with the old formatPollingContext)
export function formatSurveyContext(
  surveyData: Map<string, SurveyResearchResult>
): string {
  if (surveyData.size === 0) return "";

  const sections: string[] = [];
  for (const [topic, result] of surveyData) {
    if (!result.analysis.headlineInsight && result.rawPolls.length === 0) continue;

    let section = `TOPIC: "${topic}"`;

    // Include headline insight if analyst produced one
    if (result.analysis.headlineInsight) {
      section += `\nHEADLINE INSIGHT: ${result.analysis.headlineInsight}`;
    }

    // Include raw poll data for the deep dive prompt to reference
    for (const poll of result.rawPolls) {
      section += `\n\nPoll: ${poll.organization} (${poll.datesConducted})`;
      if (poll.sampleSize) section += ` | n=${poll.sampleSize}`;
      if (poll.marginOfError) section += ` | ${poll.marginOfError}`;

      for (const q of poll.questions) {
        section += `\n  Q: "${q.questionWording}"`;
        for (const r of q.responses) {
          let line = `    ${r.option}: ${r.overall}%`;
          if (r.byParty) {
            line += ` (Dem: ${r.byParty.dem}%, Ind: ${r.byParty.ind}%, Rep: ${r.byParty.rep}%)`;
          }
          section += `\n${line}`;
        }
        if (q.trendData && q.trendData.length > 0) {
          for (const t of q.trendData) {
            const vals = Object.entries(t.values).map(([k, v]) => `${k}: ${v}%`).join(", ");
            section += `\n    Previous (${t.date}): ${vals}`;
          }
        }
      }
    }

    // Include perception gap analysis
    if (result.analysis.perceptionGap.claim) {
      section += `\n\nPerception gap:`;
      section += `\n  What data shows: ${result.analysis.perceptionGap.claim}`;
      section += `\n  Media framing: ${result.analysis.perceptionGap.mediaFraming}`;
      section += `\n  Gap magnitude: ${result.analysis.perceptionGap.gapMagnitude}`;
    }

    sections.push(section);
  }

  if (sections.length === 0) return "";

  return `\n\nGROUNDED SURVEY RESEARCH DATA (from web search — use these EXACT numbers, do not modify):
${"=".repeat(60)}
${sections.join("\n\n" + "─".repeat(40) + "\n\n")}
${"=".repeat(60)}

IMPORTANT: For the perceptionGap field in your response, use the survey data above verbatim.
- Include the poll source name, date, and specific percentages
- Use the headline insight as guidance for what's most newsworthy
- Include cross-partisan breakdowns and trend data when available
- Do NOT invent or modify these numbers
- If vizSpecs are provided for this story, the frontend will render charts — focus on providing accurate data`;
}

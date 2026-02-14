// Agent 2: Poll Analyst
// Takes stored poll data from the DB and produces the insight layer.
// Identifies headline surprises, perception gaps, trends, and cross-partisan agreement.
// This is where the analytical "skill" lives.
//
// Two-stage context management:
// - If >8 polls: Stage 1 (Sonnet) selects the 3-5 most relevant, Stage 2 (Opus) analyzes
// - If ≤8 polls: skip Stage 1, send all to Opus directly

import Anthropic from "@anthropic-ai/sdk";
import { StoryContext, StoredPoll, PollAnalysis } from "./types";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const POLL_ANALYST_PROMPT = `You are a specialized polling data ANALYST. You receive raw polling data that has already been found and verified by a search agent. Your job is to synthesize this data into sharp, insightful analysis.

You are NOT searching for data. You are ANALYZING data that has been given to you. Every number you cite must come from the raw data provided below.

YOUR ANALYTICAL TASKS:

1. HEADLINE INSIGHT — Find the most surprising or newsworthy finding.
   BAD: "Americans are divided on immigration" (this is conventional wisdom, not insight)
   GOOD: "65% say ICE has gone too far — including 27% of Republicans, up 7 points since June"
   The headline should be the thing that would make someone say "I didn't know that."

2. PERCEPTION GAP — Where does the data contradict media framing?
   - What does the public ACTUALLY think? (cite specific numbers)
   - What does coverage SUGGEST they think?
   - How big is the gap between perception and reality?
   - Where do partisans agree more than coverage suggests?

3. TREND DETECTION — Movement is often more newsworthy than position.
   - If the same question was asked before, what changed and by how much?
   - Is the shift happening across parties or only in one?
   - A 7-point swing in 8 months is a story. A stable 65% is less so.

4. CROSS-TRIANGULATION — Multiple data points telling the same story.
   - When multiple questions or multiple polls corroborate a finding, say so.
   - "Not only do 65% say ICE has gone too far, but 62% also say ICE is making Americans less safe — these findings reinforce each other."

5. SURPRISING CROSS-PARTISAN AGREEMENT
   - Where do Democrats and Republicans agree more than expected?
   - Where do Independents break strongly toward one side?
   - "71% of Independents agree with Democrats" is a different story than "it splits on party lines."

6. DATA QUALITY ASSESSMENT
   - "strong": Multiple recent polls from reputable organizations with consistent findings
   - "moderate": One solid poll, or multiple polls with some disagreement
   - "limited": Only tangentially relevant data, or old data

KEY FINDINGS FORMAT:
For each key finding, include:
- The specific finding with exact numbers
- Source and date
- The exact question wording (for transparency — readers should know what was actually asked)
- Cross-partisan breakdown if available
- Trend direction and magnitude if available

Return your analysis as JSON:
{
  "headlineInsight": "65% of Americans say ICE has gone too far — up 11 points since June 2025, with the sharpest swing among Independents (+12 pts)",
  "perceptionGap": {
    "claim": "A strong majority of Americans, including most Independents, believe ICE enforcement has gone too far",
    "mediaFraming": "Coverage often frames ICE enforcement as a partisan issue with roughly equal support and opposition",
    "gapMagnitude": "The actual margin is nearly 3-to-1 (65% too far vs 12% not far enough), far from the even split coverage implies"
  },
  "keyFindings": [
    {
      "finding": "65% of Americans say ICE's actions have 'gone too far', up from 54% in June 2025",
      "source": "NPR/PBS News/Marist, January 2026",
      "questionWording": "How would you describe the actions of Immigration and Customs Enforcement, also known as ICE?",
      "crossPartisan": { "dem": 93, "ind": 71, "rep": 27 },
      "trend": { "direction": "up", "from": 54, "to": 65, "period": "June 2025 → January 2026" }
    }
  ],
  "dataQuality": "strong",
  "sourceCount": 3
}

IMPORTANT:
- Return ONLY valid JSON. No markdown, no code fences.
- Every number MUST come from the raw data provided. Do NOT invent statistics.
- Do NOT water down insights. Be specific and precise.
- The headline should be surprising, not confirming what everyone already assumes.`;

// Format a StoredPoll into readable text for the analyst
function formatStoredPoll(poll: StoredPoll, index: number): string {
  const questionsText = poll.questions.map((q, qi) => {
    const responsesText = q.responses.map(r => {
      let line = `      "${r.option}": ${r.overall}%`;
      if (r.byParty) {
        line += ` (Dem: ${r.byParty.dem}%, Ind: ${r.byParty.ind}%, Rep: ${r.byParty.rep}%)`;
      }
      if (r.byDemographic) {
        const demos = Object.entries(r.byDemographic).map(([k, v]) => `${k}: ${v}%`).join(", ");
        line += ` [${demos}]`;
      }
      return line;
    }).join("\n");

    let qText = `    Question ${qi + 1}: "${q.questionWording}"\n    Responses:\n${responsesText}`;
    if (q.trendData && q.trendData.length > 0) {
      const trends = q.trendData.map(t => {
        const vals = Object.entries(t.values).map(([k, v]) => `"${k}": ${v}%`).join(", ");
        return `      ${t.date}: ${vals}`;
      }).join("\n");
      qText += `\n    Previous results:\n${trends}`;
    }
    return qText;
  }).join("\n\n");

  let header = `  Poll ${index + 1}: ${poll.organization}`;
  if (poll.datesConducted) header += ` (${poll.datesConducted})`;
  if (poll.sampleSize) header += ` | n=${poll.sampleSize}`;
  if (poll.marginOfError) header += ` | ${poll.marginOfError}`;
  if (poll.mode) header += ` | Mode: ${poll.mode}`;
  header += `\n  URL: ${poll.url}`;
  header += `\n  Data quality: ${poll.extractionQuality}`;

  return `${header}\n\n${questionsText}`;
}

// Stage 1: Selection (for >8 polls) — use Sonnet to pick the most relevant
async function selectRelevantPolls(
  story: StoryContext,
  polls: StoredPoll[]
): Promise<StoredPoll[]> {
  if (!client) return polls.slice(0, 5);

  const summaries = polls.map((poll, i) => {
    const qSummary = poll.questions.map(q => `"${q.questionWording}"`).join("; ");
    return `${i + 1}. ${poll.organization} (${poll.datesConducted || "unknown date"}) — ${poll.questions.length} questions: ${qSummary}`;
  }).join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Given this news story about "${story.topic}" (angle: ${story.angle}), select the 3-5 MOST RELEVANT polls from the list below. Return ONLY a JSON array of poll numbers (1-indexed).\n\nPolls:\n${summaries}\n\nReturn: [1, 3, 5] (just the numbers of the most relevant polls)`,
      }],
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const text = textBlocks.map(b => b.text).join("");
    const match = text.match(/\[[\d,\s]+\]/);
    if (!match) return polls.slice(0, 5);

    const indices: number[] = JSON.parse(match[0]);
    return indices
      .filter(i => i >= 1 && i <= polls.length)
      .map(i => polls[i - 1]);
  } catch {
    return polls.slice(0, 5);
  }
}

export async function analyzePolls(
  story: StoryContext,
  polls: StoredPoll[]
): Promise<PollAnalysis | null> {
  if (!client) return null;
  if (polls.length === 0) return null;

  // Filter out polls with no questions (snippet_only entries with no data)
  const pollsWithData = polls.filter(p => p.questions.length > 0);
  if (pollsWithData.length === 0) {
    console.log(`Poll Analyst: All ${polls.length} polls have no question data for "${story.topic}"`);
    return null;
  }

  // Two-stage context management
  let selectedPolls = pollsWithData;
  if (pollsWithData.length > 8) {
    console.log(`Poll Analyst: ${pollsWithData.length} polls found, using Stage 1 selection for "${story.topic}"`);
    selectedPolls = await selectRelevantPolls(story, pollsWithData);
    console.log(`Poll Analyst: Stage 1 selected ${selectedPolls.length} polls for "${story.topic}"`);
  }

  // Format for the analyst
  const rawDataText = selectedPolls.map((poll, i) => formatStoredPoll(poll, i))
    .join("\n\n" + "─".repeat(60) + "\n\n");

  const userPrompt = `Analyze the following polling data for this story:

STORY TOPIC: ${story.topic}
STORY ANGLE: ${story.angle}
KEY ENTITIES: ${story.entities.join(", ")}

RAW POLLING DATA (${selectedPolls.length} polls from database):
${"═".repeat(60)}

${rawDataText}

${"═".repeat(60)}

Produce your analysis. Remember:
- The headline insight should be the SURPRISING finding, not conventional wisdom
- Identify the perception gap between data and media framing
- Flag trend movements — they're often more newsworthy than absolute numbers
- Note cross-partisan agreement where it exists
- Assess data quality (strong/moderate/limited)
- Every number you cite must come from the data above`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 3000,
      system: POLL_ANALYST_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const fullText = textBlocks.map(b => b.text).join("");

    if (!fullText) {
      console.log(`Poll Analyst: No response for "${story.topic}"`);
      return null;
    }

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`Poll Analyst: No JSON in response for "${story.topic}"`);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const analysis: PollAnalysis = {
      headlineInsight: parsed.headlineInsight || "",
      perceptionGap: {
        claim: parsed.perceptionGap?.claim || "",
        mediaFraming: parsed.perceptionGap?.mediaFraming || "",
        gapMagnitude: parsed.perceptionGap?.gapMagnitude || "",
      },
      keyFindings: (parsed.keyFindings || []).map((f: Record<string, unknown>) => ({
        finding: (f.finding as string) || "",
        source: (f.source as string) || "",
        questionWording: f.questionWording as string | undefined,
        crossPartisan: f.crossPartisan as { dem: number; ind: number; rep: number } | undefined,
        trend: f.trend as { direction: "up" | "down" | "stable"; from: number; to: number; period: string } | undefined,
      })),
      dataQuality: (["strong", "moderate", "limited"].includes(parsed.dataQuality as string)
        ? parsed.dataQuality
        : "limited") as "strong" | "moderate" | "limited",
      sourceCount: typeof parsed.sourceCount === "number" ? parsed.sourceCount : selectedPolls.length,
    };

    console.log(`Poll Analyst: ${analysis.keyFindings.length} key findings, quality=${analysis.dataQuality} for "${story.topic}"`);

    return analysis;
  } catch (error) {
    console.error(`Poll Analyst failed for "${story.topic}":`, error);
    return null;
  }
}

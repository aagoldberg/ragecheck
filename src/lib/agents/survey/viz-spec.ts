// Agent 3: Viz Spec Generator
// Takes PollAnalysis from Agent 2 and produces React-renderable chart specifications.
//
// Research basis:
// - PMC study (2024): Full-range bar charts reduce perceived polarization 12-24%
// - More in Common: "estimated vs actual" paired bars make perception gaps visible
// - Truncated axes INCREASE misperceptions — all charts start at 0
// - Icon arrays and full distributions show overlap between groups

import { PollAnalysis, StoredPoll, VizSpec, TrendDataPoint } from "./types";

// Partisan colors aligned with ClearView's existing design system
const PARTISAN_COLORS = {
  dem: "#3b82f6",   // blue-500
  ind: "#6b7280",   // gray-500
  rep: "#f43f5e",   // rose-500
};

const RESPONSE_COLORS = [
  "#8b5cf6",  // violet-500 (primary response)
  "#6366f1",  // indigo-500
  "#0ea5e9",  // sky-500
  "#10b981",  // emerald-500
  "#f59e0b",  // amber-500
  "#ef4444",  // red-500
];

// Type guards — the analyst sometimes returns strings instead of structured objects
function isValidCrossPartisan(cp: unknown): cp is { dem: number; ind: number; rep: number } {
  return (
    cp != null &&
    typeof cp === "object" &&
    typeof (cp as Record<string, unknown>).dem === "number" &&
    typeof (cp as Record<string, unknown>).ind === "number" &&
    typeof (cp as Record<string, unknown>).rep === "number" &&
    !isNaN((cp as Record<string, number>).dem) &&
    !isNaN((cp as Record<string, number>).ind) &&
    !isNaN((cp as Record<string, number>).rep)
  );
}

function isValidTrend(t: unknown): t is { direction: "up" | "down" | "stable"; from: number; to: number; period: string } {
  return (
    t != null &&
    typeof t === "object" &&
    typeof (t as Record<string, unknown>).from === "number" &&
    typeof (t as Record<string, unknown>).to === "number"
  );
}

export function generateVizSpecs(
  analysis: PollAnalysis,
  polls: StoredPoll[]
): VizSpec[] {
  const specs: VizSpec[] = [];
  const primaryPoll = polls[0];

  // 1. Generate partisan breakdown bars from analyst key findings (if structured)
  for (const finding of analysis.keyFindings) {
    if (isValidCrossPartisan(finding.crossPartisan)) {
      specs.push(buildPartisanBars(finding, primaryPoll));
    }
  }

  // 2. If no partisan bars from analyst, build them directly from raw poll data
  //    The analyst often returns crossPartisan as strings; the raw polls have real byParty numbers
  if (specs.filter(s => s.chartType === "partisan-bars").length === 0) {
    const pollCharts = buildPartisanBarsFromPolls(polls);
    specs.push(...pollCharts);
  }

  // 3. Generate distribution chart for the most relevant poll question with actual values
  const distQuestion = findBestDistributionQuestion(polls);
  if (distQuestion) {
    specs.push(buildDistributionChart(distQuestion.question, distQuestion.poll));
  }

  // 4. Generate trend chart if valid trend data exists
  const findingWithTrend = analysis.keyFindings.find(f => isValidTrend(f.trend));
  if (findingWithTrend && isValidTrend(findingWithTrend.trend)) {
    const trendQuestion = findTrendQuestion(polls);
    if (trendQuestion) {
      specs.push(buildTrendChart(findingWithTrend, trendQuestion, primaryPoll));
    }
  }

  // 5. Generate perception gap visualization if gap is meaningful
  if (analysis.perceptionGap.claim && analysis.perceptionGap.gapMagnitude) {
    const gapSpec = buildPerceptionGapChart(analysis, polls);
    if (gapSpec) specs.push(gapSpec);
  }

  return specs;
}

// ── Build partisan bars directly from raw StoredPoll byParty data ──

function buildPartisanBarsFromPolls(polls: StoredPoll[]): VizSpec[] {
  const charts: VizSpec[] = [];
  const seen = new Set<string>(); // deduplicate by question wording

  for (const poll of polls) {
    for (const q of poll.questions) {
      // Find the response with the most interesting partisan split
      const responsesWithParty = q.responses.filter(
        r => r.byParty &&
          typeof r.byParty.dem === "number" &&
          typeof r.byParty.ind === "number" &&
          typeof r.byParty.rep === "number" &&
          (r.byParty.dem > 0 || r.byParty.rep > 0)
      );

      if (responsesWithParty.length === 0) continue;

      // Pick the response with the widest partisan gap (most interesting to visualize)
      const best = responsesWithParty.reduce((a, b) => {
        const gapA = Math.abs((a.byParty?.dem || 0) - (a.byParty?.rep || 0));
        const gapB = Math.abs((b.byParty?.dem || 0) - (b.byParty?.rep || 0));
        return gapB > gapA ? b : a;
      });

      const key = q.questionWording.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);

      const cp = best.byParty!;
      charts.push({
        chartType: "partisan-bars",
        title: `"${best.option}": ${best.overall}% overall`,
        subtitle: `${poll.organization}${poll.datesConducted ? ` | ${poll.datesConducted}` : ""}`,
        data: [
          { label: "Democrats", value: cp.dem, color: PARTISAN_COLORS.dem },
          { label: "Independents", value: cp.ind, color: PARTISAN_COLORS.ind },
          { label: "Republicans", value: cp.rep, color: PARTISAN_COLORS.rep },
        ],
        sourceAttribution: buildAttribution(poll),
        questionWording: q.questionWording,
      });

      // Cap at 3 charts from raw data to avoid overwhelming the UI
      if (charts.length >= 3) return charts;
    }
  }

  return charts;
}

// ── Find the best distribution question (3+ responses with real values) ──

function findBestDistributionQuestion(polls: StoredPoll[]): { question: StoredPoll["questions"][0]; poll: StoredPoll } | null {
  for (const poll of polls) {
    for (const q of poll.questions) {
      if (q.responses.length >= 3 && q.responses.some(r => typeof r.overall === "number" && r.overall > 0)) {
        return { question: q, poll };
      }
    }
  }
  return null;
}

function buildPartisanBars(
  finding: PollAnalysis["keyFindings"][0],
  poll?: StoredPoll
): VizSpec {
  const cp = finding.crossPartisan!;

  return {
    chartType: "partisan-bars",
    title: finding.finding,
    subtitle: `${finding.source}${poll?.sampleSize ? ` | n=${poll.sampleSize.toLocaleString()}` : ""}${poll?.marginOfError ? ` | ${poll.marginOfError}` : ""}`,
    data: [
      { label: "Democrats", value: cp.dem, color: PARTISAN_COLORS.dem },
      { label: "Independents", value: cp.ind, color: PARTISAN_COLORS.ind },
      { label: "Republicans", value: cp.rep, color: PARTISAN_COLORS.rep },
    ],
    sourceAttribution: buildAttribution(poll),
    questionWording: finding.questionWording,
  };
}

function buildDistributionChart(question: StoredPoll["questions"][0], poll: StoredPoll): VizSpec {
  return {
    chartType: "distribution",
    title: question.questionWording,
    subtitle: `${poll.organization}${poll.datesConducted ? ` | ${poll.datesConducted}` : ""}`,
    data: question.responses.map((r, i) => ({
      label: r.option,
      value: r.overall,
      color: RESPONSE_COLORS[i % RESPONSE_COLORS.length],
    })),
    sourceAttribution: buildAttribution(poll),
    questionWording: question.questionWording,
  };
}

function buildTrendChart(
  finding: PollAnalysis["keyFindings"][0],
  trendQuestion: { question: StoredPoll["questions"][0]; poll: StoredPoll },
  poll?: StoredPoll
): VizSpec {
  const trend = finding.trend as { direction: string; from: number; to: number; period: string };
  const q = trendQuestion.question;

  // Build trend data points from historical + current
  const trendPoints: TrendDataPoint[] = [];

  // Add historical points
  if (q.trendData) {
    for (const t of q.trendData) {
      // Find the value for the primary response option
      const primaryOption = q.responses[0]?.option;
      if (primaryOption && t.values[primaryOption] !== undefined) {
        trendPoints.push({
          date: t.date,
          value: t.values[primaryOption],
          label: `${t.values[primaryOption]}%`,
        });
      }
    }
  }

  // Add current point
  trendPoints.push({
    date: (poll || trendQuestion.poll).datesConducted || "Current",
    value: trend.to,
    label: `${trend.to}%`,
  });

  const direction = trend.direction === "up" ? "+" : trend.direction === "down" ? "" : "±";
  const delta = trend.to - trend.from;

  return {
    chartType: "trend",
    title: `${finding.finding}`,
    subtitle: `${direction}${delta} points | ${trend.period}`,
    data: [
      { label: "Previous", value: trend.from },
      { label: "Current", value: trend.to },
    ],
    trendData: trendPoints,
    annotations: [`${direction}${delta} pts since ${trendPoints[0]?.date || "previous survey"}`],
    sourceAttribution: buildAttribution(poll),
    questionWording: finding.questionWording,
  };
}

function buildPerceptionGapChart(analysis: PollAnalysis, polls: StoredPoll[]): VizSpec | null {
  // First try: analyst key findings with structured crossPartisan
  const finding = analysis.keyFindings.find(f => isValidCrossPartisan(f.crossPartisan));
  if (finding && isValidCrossPartisan(finding.crossPartisan)) {
    const cp = finding.crossPartisan;
    const min = Math.min(cp.dem, cp.ind, cp.rep);
    const max = Math.max(cp.dem, cp.ind, cp.rep);
    const range = max - min;

    return {
      chartType: "perception-gap",
      title: analysis.perceptionGap.claim,
      subtitle: analysis.perceptionGap.gapMagnitude,
      data: [
        { label: "Democrats", value: cp.dem, color: PARTISAN_COLORS.dem },
        { label: "Independents", value: cp.ind, color: PARTISAN_COLORS.ind },
        { label: "Republicans", value: cp.rep, color: PARTISAN_COLORS.rep },
      ],
      annotations: [
        analysis.perceptionGap.mediaFraming,
        `Actual partisan range: ${range} points (${min}%–${max}%)`,
      ],
      sourceAttribution: finding.source,
      questionWording: finding.questionWording,
    };
  }

  // Fallback: build from raw poll data with the widest partisan gap
  for (const poll of polls) {
    for (const q of poll.questions) {
      for (const r of q.responses) {
        if (r.byParty &&
          typeof r.byParty.dem === "number" &&
          typeof r.byParty.ind === "number" &&
          typeof r.byParty.rep === "number" &&
          (r.byParty.dem > 0 || r.byParty.rep > 0)) {
          const cp = r.byParty;
          const min = Math.min(cp.dem, cp.ind, cp.rep);
          const max = Math.max(cp.dem, cp.ind, cp.rep);
          const range = max - min;

          if (range >= 30) { // Only show perception gap if there's a meaningful gap
            return {
              chartType: "perception-gap",
              title: analysis.perceptionGap.claim || `"${r.option}": ${r.overall}% overall`,
              subtitle: analysis.perceptionGap.gapMagnitude || `${range}-point partisan gap`,
              data: [
                { label: "Democrats", value: cp.dem, color: PARTISAN_COLORS.dem },
                { label: "Independents", value: cp.ind, color: PARTISAN_COLORS.ind },
                { label: "Republicans", value: cp.rep, color: PARTISAN_COLORS.rep },
              ],
              annotations: [
                analysis.perceptionGap.mediaFraming || "",
                `Actual partisan range: ${range} points (${min}%–${max}%)`,
              ].filter(Boolean),
              sourceAttribution: buildAttribution(poll),
              questionWording: q.questionWording,
            };
          }
        }
      }
    }
  }

  return null;
}

// Helpers

function findTrendQuestion(polls: StoredPoll[]) {
  for (const poll of polls) {
    for (const q of poll.questions) {
      if (q.trendData && q.trendData.length > 0) {
        return { question: q, poll };
      }
    }
  }
  return null;
}

function buildAttribution(poll?: StoredPoll): string {
  if (!poll) return "";
  const parts = [poll.organization];
  if (poll.datesConducted) parts.push(poll.datesConducted);
  if (poll.sampleSize) parts.push(`n=${poll.sampleSize.toLocaleString()}`);
  if (poll.marginOfError) parts.push(poll.marginOfError);
  if (poll.mode) parts.push(poll.mode);
  return parts.join(" | ");
}

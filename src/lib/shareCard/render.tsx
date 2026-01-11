/**
 * Share card renderer using @vercel/og (Satori)
 * Renders React components to PNG images
 */

import { ImageResponse } from "@vercel/og";
import {
  getVerdict,
  getTopDrivers,
  getDeterministicHookLine,
  getScoreColor,
} from "./text";

export interface Analysis {
  sourceDomain: string;
  title: string;
  baitScore: number;
  bars: Record<string, number> | { key: string; label: string; value: number }[];
  canonicalUrl?: string;
}

export type CardSize = "x" | "bsky";

const SIZE_CONFIG: Record<CardSize, { width: number; height: number }> = {
  x: { width: 1200, height: 675 },
  bsky: { width: 1200, height: 630 },
};

// Signal bar labels (short versions)
const SIGNAL_LABELS: Record<string, string> = {
  arousal: "Emotional Arousal",
  enemy_construction: "Enemy Framing",
  moral_condemnation: "Moral Outrage",
  simplification: "Oversimplification",
  call_to_conflict: "Call to Conflict",
};

// Get bar color based on value
function getBarColor(value: number): string {
  if (value >= 60) return "#ef4444"; // red
  if (value >= 30) return "#f59e0b"; // amber
  return "#22c55e"; // green
}

// Generate analysis insights based on the data
function getAnalysisInsights(baitScore: number, bars: { key: string; value: number }[]): string[] {
  const insights: string[] = [];
  const sorted = [...bars].sort((a, b) => b.value - a.value);

  // HIGH SCORE (70+): Focus on what's wrong
  if (baitScore >= 70) {
    insights.push("High manipulation potential - approach with skepticism");

    for (const bar of sorted) {
      if (bar.value >= 40 && insights.length < 5) {
        switch (bar.key) {
          case "arousal":
            insights.push("Heavy use of emotionally charged language");
            break;
          case "enemy_construction":
            insights.push("Strong us-vs-them framing detected");
            break;
          case "moral_condemnation":
            insights.push("Appeals to moral outrage over facts");
            break;
          case "simplification":
            insights.push("Complex issues reduced to simple narratives");
            break;
          case "call_to_conflict":
            insights.push("Encourages confrontation or action");
            break;
        }
      }
    }
  }
  // MEDIUM SCORE (40-69): Mixed
  else if (baitScore >= 40) {
    insights.push("Some emotional framing detected");

    for (const bar of sorted) {
      if (bar.value >= 30 && insights.length < 5) {
        switch (bar.key) {
          case "arousal":
            insights.push("Contains emotionally charged language");
            break;
          case "enemy_construction":
            insights.push("Some group-based framing present");
            break;
          case "moral_condemnation":
            insights.push("Moral framing used in places");
            break;
          case "simplification":
            insights.push("Some nuance may be missing");
            break;
          case "call_to_conflict":
            insights.push("Subtle push toward taking sides");
            break;
        }
      }
    }
  }
  // LOW SCORE (<40): Focus on what's good/absent
  else {
    if (baitScore < 20) {
      insights.push("Low manipulation - relatively balanced");
    } else {
      insights.push("Minimal emotional manipulation detected");
    }

    // Add positive observations based on what's LOW
    const arousal = bars.find(b => b.key === "arousal")?.value || 0;
    const enemy = bars.find(b => b.key === "enemy_construction")?.value || 0;
    const moral = bars.find(b => b.key === "moral_condemnation")?.value || 0;
    const simple = bars.find(b => b.key === "simplification")?.value || 0;
    const conflict = bars.find(b => b.key === "call_to_conflict")?.value || 0;

    if (arousal < 20) {
      insights.push("Uses measured, factual language");
    }
    if (enemy < 20) {
      insights.push("Avoids villainizing groups or individuals");
    }
    if (moral < 20 && insights.length < 5) {
      insights.push("Presents information without moral judgment");
    }
    if (simple < 20 && insights.length < 5) {
      insights.push("Acknowledges complexity of the issue");
    }
    if (conflict < 20 && insights.length < 5) {
      insights.push("Doesn't push reader toward confrontation");
    }
  }

  return insights.slice(0, 5);
}

/**
 * Render share card as PNG ImageResponse
 */
export function renderShareCard(
  analysis: Analysis,
  size: CardSize = "x"
): ImageResponse {
  const { width, height } = SIZE_CONFIG[size];
  const scoreColor = getScoreColor(analysis.baitScore);

  // Truncate title if too long
  const maxTitleLength = 90;
  const displayTitle = analysis.title.length > maxTitleLength
    ? analysis.title.slice(0, maxTitleLength - 3) + "..."
    : analysis.title;

  // Normalize bars to array format
  const barsArray = Array.isArray(analysis.bars)
    ? analysis.bars
    : Object.entries(analysis.bars).map(([key, value]) => ({
        key,
        label: SIGNAL_LABELS[key] || key,
        value: value as number,
      }));

  // Get analysis insights
  const insights = getAnalysisInsights(analysis.baitScore, barsArray);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "40px 48px",
          backgroundColor: "#ffffff",
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "#18181b",
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#18181b",
              }}
            >
              RageCheck
            </span>
          </div>
          <span
            style={{
              fontSize: "16px",
              color: "#71717a",
              fontWeight: 500,
            }}
          >
            {analysis.sourceDomain}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "#18181b",
            lineHeight: 1.3,
            marginBottom: "24px",
          }}
        >
          {displayTitle}
        </div>

        {/* Main Content Row */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "40px",
          }}
        >
          {/* Left Column: Score + Analysis */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "320px",
              gap: "20px",
            }}
          >
            {/* Score Section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "16px 20px",
                backgroundColor: "#f4f4f5",
                borderRadius: "12px",
              }}
            >
              {/* Mini Gauge */}
              <div
                style={{
                  position: "relative",
                  width: "80px",
                  height: "50px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="80"
                  height="50"
                  viewBox="0 0 80 50"
                  style={{ position: "absolute", top: 0, left: 0 }}
                >
                  <path
                    d="M 8 46 A 32 32 0 0 1 72 46"
                    fill="none"
                    stroke="#e4e4e7"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 8 46 A 32 32 0 0 1 72 46"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(analysis.baitScore / 100) * 100} 100`}
                  />
                </svg>
              </div>

              {/* Score Number */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "42px",
                    fontWeight: 900,
                    color: scoreColor,
                    lineHeight: 1,
                  }}
                >
                  {analysis.baitScore}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#71717a",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Bait Score
                </span>
              </div>
            </div>

            {/* Analysis Insights */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Analysis
              </span>
              {insights.map((insight, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: scoreColor, fontSize: "13px" }}>•</span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#3f3f46",
                      lineHeight: 1.3,
                    }}
                  >
                    {insight.length > 55 ? insight.slice(0, 52) + "..." : insight}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Signal Bars */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#71717a",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              Signal Breakdown
            </span>
            {barsArray.map((bar) => (
              <div
                key={bar.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#52525b",
                    width: "130px",
                    flexShrink: 0,
                  }}
                >
                  {bar.label}
                </span>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    height: "10px",
                    backgroundColor: "#e4e4e7",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${bar.value}%`,
                      height: "100%",
                      backgroundColor: getBarColor(bar.value),
                      borderRadius: "5px",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#18181b",
                    width: "36px",
                    textAlign: "right",
                  }}
                >
                  {bar.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #e4e4e7",
          }}
        >
          <span style={{ fontSize: "12px", color: "#a1a1aa" }}>
            ragecheck.app
          </span>
          <span style={{ fontSize: "12px", color: "#a1a1aa" }}>
            AI-powered emotional manipulation analysis
          </span>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}

/**
 * Get share card data for client-side use
 */
export function getShareCardData(analysis: Analysis) {
  const topDrivers = getTopDrivers(analysis.bars);
  const verdict = getVerdict(analysis.baitScore);
  const hookLine = getDeterministicHookLine(analysis.baitScore, topDrivers);

  return {
    hookLine,
    verdict,
    topDrivers,
    scoreColor: getScoreColor(analysis.baitScore),
  };
}

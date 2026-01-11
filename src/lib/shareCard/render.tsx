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
  const top = sorted[0];
  const second = sorted[1];

  if (baitScore >= 70) {
    if (top.key === "arousal" && top.value >= 50) {
      insights.push("Uses emotionally charged language to provoke reaction");
    } else if (top.key === "enemy_construction" && top.value >= 50) {
      insights.push("Frames groups as threats or enemies");
    } else if (top.key === "moral_condemnation" && top.value >= 50) {
      insights.push("Appeals to moral outrage over factual analysis");
    } else {
      insights.push("Multiple manipulation patterns detected");
    }
  } else if (baitScore >= 40) {
    insights.push("Some emotional framing present");
  } else {
    insights.push("Relatively balanced presentation");
  }

  if (second && second.value >= 30 && insights.length < 2) {
    const secondLabel = SIGNAL_LABELS[second.key] || second.key;
    insights.push(`Notable ${secondLabel.toLowerCase()} detected`);
  }

  return insights.slice(0, 2);
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
  const topDrivers = getTopDrivers(analysis.bars);

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
                gap: "10px",
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
                    gap: "8px",
                  }}
                >
                  <span style={{ color: scoreColor, fontSize: "14px" }}>•</span>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#3f3f46",
                      lineHeight: 1.4,
                    }}
                  >
                    {insight}
                  </span>
                </div>
              ))}
            </div>

            {/* Top Drivers */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {topDrivers.slice(0, 2).map((driver) => (
                <div
                  key={driver.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    backgroundColor: `${scoreColor}15`,
                    border: `1px solid ${scoreColor}40`,
                    borderRadius: "6px",
                  }}
                >
                  <span
                    style={{
                      color: scoreColor,
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {driver.label.replace("Emotional ", "")}
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

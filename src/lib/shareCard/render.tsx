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

// Signal bar labels
const SIGNAL_LABELS: Record<string, string> = {
  arousal: "Emotional Arousal",
  enemy_construction: "Enemy Construction",
  moral_condemnation: "Moral Condemnation",
  simplification: "Oversimplification",
  call_to_conflict: "Call-to-Conflict",
};

// Get bar color based on value
function getBarColor(value: number): string {
  if (value >= 60) return "#ef4444"; // red
  if (value >= 30) return "#f59e0b"; // amber
  return "#22c55e"; // green
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
  const maxTitleLength = 80;
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

  // Calculate speedometer angle (0 = -135deg, 100 = 135deg, so 270deg range)
  const speedometerAngle = -135 + (analysis.baitScore / 100) * 270;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "48px",
          backgroundColor: "#fafafa",
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#18181b",
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#18181b",
                letterSpacing: "-0.02em",
              }}
            >
              RageCheck
            </span>
          </div>
          <span
            style={{
              fontSize: "18px",
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
            fontSize: "32px",
            fontWeight: 700,
            color: "#18181b",
            lineHeight: 1.2,
            marginBottom: "32px",
            maxWidth: "100%",
          }}
        >
          {displayTitle}
        </div>

        {/* Main Content: Speedometer + Bars */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "48px",
          }}
        >
          {/* Left: Speedometer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "280px",
            }}
          >
            {/* Speedometer Arc */}
            <div
              style={{
                position: "relative",
                width: "220px",
                height: "140px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              {/* Background arc */}
              <svg
                width="220"
                height="140"
                viewBox="0 0 220 140"
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                {/* Gray background arc */}
                <path
                  d="M 20 130 A 90 90 0 0 1 200 130"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Colored progress arc */}
                <path
                  d="M 20 130 A 90 90 0 0 1 200 130"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${(analysis.baitScore / 100) * 283} 283`}
                />
              </svg>

              {/* Needle */}
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "50%",
                  width: "4px",
                  height: "70px",
                  backgroundColor: "#18181b",
                  borderRadius: "2px",
                  transformOrigin: "bottom center",
                  transform: `translateX(-50%) rotate(${speedometerAngle}deg)`,
                }}
              />

              {/* Center dot */}
              <div
                style={{
                  position: "absolute",
                  bottom: "2px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "16px",
                  height: "16px",
                  backgroundColor: "#18181b",
                  borderRadius: "50%",
                }}
              />
            </div>

            {/* Score Number */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "64px",
                  fontWeight: 900,
                  color: scoreColor,
                  lineHeight: 1,
                }}
              >
                {analysis.baitScore}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: "4px",
                }}
              >
                Bait Score
              </span>
            </div>
          </div>

          {/* Right: Signal Bars */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              gap: "16px",
            }}
          >
            {barsArray.map((bar) => (
              <div
                key={bar.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#3f3f46",
                    }}
                  >
                    {bar.label}
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#18181b",
                    }}
                  >
                    {bar.value}%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "12px",
                    backgroundColor: "#e4e4e7",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${bar.value}%`,
                      height: "100%",
                      backgroundColor: getBarColor(bar.value),
                      borderRadius: "6px",
                    }}
                  />
                </div>
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
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e4e4e7",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              color: "#a1a1aa",
            }}
          >
            ragecheck.app
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "#a1a1aa",
            }}
          >
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

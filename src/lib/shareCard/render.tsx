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
  getAccentColor,
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

/**
 * Render share card as PNG ImageResponse
 */
export function renderShareCard(
  analysis: Analysis,
  size: CardSize = "x"
): ImageResponse {
  const { width, height } = SIZE_CONFIG[size];
  const topDrivers = getTopDrivers(analysis.bars);
  const hookLine = getDeterministicHookLine(analysis.baitScore, topDrivers);
  const scoreColor = getScoreColor(analysis.baitScore);
  const accentColor = getAccentColor(analysis.baitScore);

  // Truncate title if too long
  const maxTitleLength = 100;
  const displayTitle = analysis.title.length > maxTitleLength
    ? analysis.title.slice(0, maxTitleLength - 3) + "..."
    : analysis.title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px",
          backgroundColor: "#09090b", // Matte black
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          position: "relative",
        }}
      >
        {/* Header: Mono details */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "48px",
            fontFamily: "monospace", // Tech/Analytic feel
            color: "#71717a",
            fontSize: "20px",
            letterSpacing: "0.05em",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
             <span style={{ color: "#e4e4e7", fontWeight: 700 }}>RAGECHECK</span>
             <span>/</span>
             <span>EMOTIONAL ANALYSIS</span>
          </div>
          <span>{analysis.sourceDomain.toUpperCase()}</span>
        </div>

        {/* Main: Massive Hook (Sentence Case) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            marginBottom: "auto", // Push footer down
          }}
        >
          <h1
            style={{
              fontSize: "92px",
              fontWeight: 800, // Slightly lighter than 900
              color: "#fafafa",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              margin: 0,
              // Removed textTransform: uppercase
            }}
          >
            {hookLine}
          </h1>
          
          {/* Article Title - Subordinate but clear */}
          <div
            style={{
              fontSize: "32px",
              color: "#a1a1aa",
              lineHeight: 1.3,
              maxWidth: "90%",
              fontWeight: 500,
              marginTop: "8px",
            }}
          >
            &quot;{displayTitle}&quot;
          </div>
        </div>

        {/* Footer: Sticker & Tags */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* Left: The "Data" Score (Upright) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: scoreColor,
              padding: "16px 24px",
              // Removed transform rotation
              border: "4px solid white",
              boxShadow: "0px 4px 24px rgba(0,0,0,0.5)", // Soft shadow instead of hard drop
              borderRadius: "4px", // Slight rounding
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#000",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0px",
              }}
            >
              BAIT SCORE
            </span>
            <span
              style={{
                fontSize: "80px",
                fontWeight: 900,
                color: "#000",
                lineHeight: 0.9,
              }}
            >
              {analysis.baitScore}
            </span>
          </div>

          {/* Right: Driver Tags (Neutral Data Pills) */}
          <div
            style={{
              display: "flex",
              gap: "16px",
            }}
          >
            {topDrivers.map((driver) => (
              <div
                key={driver.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 24px",
                  backgroundColor: "rgba(255,255,255,0.05)", // Transparent/Subtle
                  border: `2px solid ${accentColor}`, // Colored border
                  borderRadius: "100px",
                }}
              >
                <span
                  style={{
                    color: accentColor,
                    fontSize: "24px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {driver.label.replace("Emotional ", "")}
                </span>
              </div>
            ))}
          </div>
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
    accentColor: getAccentColor(analysis.baitScore),
  };
}

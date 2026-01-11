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
  type Driver,
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
  const verdict = getVerdict(analysis.baitScore);
  const hookLine = getDeterministicHookLine(analysis.baitScore, topDrivers);
  const scoreColor = getScoreColor(analysis.baitScore);
  const accentColor = getAccentColor(analysis.baitScore);

  // Truncate title if too long
  const maxTitleLength = 120;
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
          padding: "56px",
          background: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top row: Source + Hook line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          {/* Source pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              background: "rgba(39, 39, 42, 0.9)",
              borderRadius: "8px",
              border: "1px solid rgba(63, 63, 70, 0.5)",
            }}
          >
            <span
              style={{
                color: "#a1a1aa",
                fontSize: "16px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {analysis.sourceDomain.toUpperCase().slice(0, 25)}
            </span>
          </div>

          {/* Hook line */}
          <span
            style={{
              color: accentColor,
              fontSize: "32px",
              fontWeight: 700,
            }}
          >
            {hookLine}
          </span>
        </div>

        {/* Main content: Two columns */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "48px",
          }}
        >
          {/* Left column: Score gauge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "280px",
            }}
          >
            {/* Score circle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "200px",
                height: "200px",
                borderRadius: "100px",
                border: `8px solid ${scoreColor}`,
                background: `radial-gradient(circle, ${scoreColor}15 0%, transparent 70%)`,
                position: "relative",
              }}
            >
              <span
                style={{
                  color: "#fafafa",
                  fontSize: "96px",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {analysis.baitScore}
              </span>
              <span
                style={{
                  color: "#a1a1aa",
                  fontSize: "16px",
                  fontWeight: 600,
                  marginTop: "4px",
                  letterSpacing: "1px",
                }}
              >
                BAIT SCORE
              </span>
            </div>

            {/* Verdict */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "24px",
              }}
            >
              <span
                style={{
                  color: scoreColor,
                  fontSize: "24px",
                  fontWeight: 700,
                }}
              >
                {verdict.label}
              </span>
              <span
                style={{
                  color: "#71717a",
                  fontSize: "16px",
                  marginTop: "4px",
                }}
              >
                {verdict.sub}
              </span>
            </div>
          </div>

          {/* Right column: Title + Drivers */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {/* Title */}
            <div
              style={{
                color: "#fafafa",
                fontSize: "40px",
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: "40px",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {displayTitle}
            </div>

            {/* Drivers */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {topDrivers.map((driver, i) => (
                <DriverRow
                  key={driver.key}
                  driver={driver}
                  isPrimary={i === 0}
                  accentColor={accentColor}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: "24px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "#fafafa",
                borderRadius: "6px",
              }}
            />
            <span
              style={{
                color: "#fafafa",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              RageCheck
            </span>
          </div>

          {/* URL */}
          <span
            style={{
              color: "#71717a",
              fontSize: "18px",
            }}
          >
            ragecheck.app
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
 * Driver row component
 */
function DriverRow({
  driver,
  isPrimary,
  accentColor,
}: {
  driver: Driver;
  isPrimary: boolean;
  accentColor: string;
}) {
  const barColor = isPrimary ? accentColor : "#71717a";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
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
            color: isPrimary ? "#e4e4e7" : "#a1a1aa",
            fontSize: "18px",
            fontWeight: isPrimary ? 600 : 500,
          }}
        >
          {isPrimary ? "Primary: " : "Secondary: "}
          {driver.label}
        </span>
        <span
          style={{
            color: "#71717a",
            fontSize: "16px",
          }}
        >
          {driver.value}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "8px",
          background: "#3f3f46",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${driver.value}%`,
            height: "100%",
            background: barColor,
            borderRadius: "4px",
          }}
        />
      </div>
    </div>
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

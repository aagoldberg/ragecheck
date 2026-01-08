import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = parseInt(searchParams.get("score") || "0");
  const domain = searchParams.get("domain") || "Unknown source";
  const title = searchParams.get("title") || "Content Analysis";

  // Color based on score
  const getColors = (s: number) => {
    if (s <= 33) return { main: "#10b981", bg: "#ecfdf5", text: "#065f46" }; // emerald
    if (s <= 66) return { main: "#f59e0b", bg: "#fffbeb", text: "#92400e" }; // amber
    return { main: "#ef4444", bg: "#fef2f2", text: "#991b1b" }; // red
  };

  const getLabel = (s: number) => {
    if (s <= 33) return "LOW RISK";
    if (s <= 66) return "MEDIUM RISK";
    return "HIGH RISK";
  };

  const colors = getColors(score);
  const label = getLabel(score);

  // Truncate title
  const displayTitle = title.length > 80 ? title.substring(0, 77) + "..." : title;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fafafa",
          position: "relative",
        }}
      >
        {/* Gradient accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: `linear-gradient(90deg, ${colors.main}, ${colors.main}88)`,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            height: "100%",
            padding: "60px",
            gap: "60px",
          }}
        >
          {/* Left side - Score */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "380px",
              flexShrink: 0,
            }}
          >
            {/* Score circle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "280px",
                height: "280px",
                borderRadius: "140px",
                backgroundColor: colors.bg,
                border: `6px solid ${colors.main}`,
                boxShadow: `0 0 0 20px ${colors.main}15`,
              }}
            >
              <span
                style={{
                  fontSize: "120px",
                  fontWeight: "800",
                  color: colors.main,
                  lineHeight: 1,
                  letterSpacing: "-4px",
                }}
              >
                {score}
              </span>
              <span
                style={{
                  fontSize: "24px",
                  color: colors.text,
                  fontWeight: "600",
                  marginTop: "8px",
                }}
              >
                out of 100
              </span>
            </div>

            {/* Label badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "24px",
                padding: "12px 32px",
                backgroundColor: colors.main,
                borderRadius: "50px",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "white",
                  letterSpacing: "2px",
                }}
              >
                {label}
              </span>
            </div>
          </div>

          {/* Right side - Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              gap: "24px",
            }}
          >
            {/* Branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#18181b",
                  borderRadius: "10px",
                }}
              />
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "#18181b",
                  letterSpacing: "-1px",
                }}
              >
                RageCheck
              </span>
            </div>

            {/* Title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "42px",
                  fontWeight: "700",
                  color: "#18181b",
                  lineHeight: 1.2,
                  letterSpacing: "-1px",
                }}
              >
                {displayTitle}
              </span>
              <span
                style={{
                  fontSize: "24px",
                  color: "#71717a",
                  fontWeight: "500",
                }}
              >
                {domain}
              </span>
            </div>

            {/* Description */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "16px",
                padding: "16px 24px",
                backgroundColor: "#f4f4f5",
                borderRadius: "12px",
                borderLeft: `4px solid ${colors.main}`,
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  color: "#52525b",
                  lineHeight: 1.4,
                }}
              >
                {score > 66
                  ? "High density of manipulative language patterns detected"
                  : score > 33
                  ? "Some concerning manipulation patterns found"
                  : "Minimal manipulative framing detected"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "60px",
            right: "60px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              color: "#a1a1aa",
            }}
          >
            Analyze content at ragecheck.com
          </span>
          <span
            style={{
              fontSize: "18px",
              color: "#a1a1aa",
            }}
          >
            Outrage Bait Detection Tool
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

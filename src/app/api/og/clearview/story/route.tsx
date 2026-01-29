import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const topic = searchParams.get("topic") || "Today's Top Story";
  const debateType = searchParams.get("debateType") || "mixed";
  const sourceCount = searchParams.get("sourceCount") || "0";
  const leftView = searchParams.get("leftView") || "";
  const rightView = searchParams.get("rightView") || "";

  const debateLabel: Record<string, string> = {
    factual: "Factual Dispute",
    policy: "Policy Debate",
    values: "Values Clash",
    mixed: "Multi-Dimensional",
  };

  const response = new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fafafa",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Indigo accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #6366f1, #a855f7)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "56px 64px 48px",
            height: "100%",
          }}
        >
          {/* Header row: branding + debate badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "32px",
            }}
          >
            {/* Logo and title */}
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#18181b",
                  letterSpacing: "-0.5px",
                }}
              >
                ClearView by RageCheck
              </span>
            </div>

            {/* Debate type badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 20px",
                backgroundColor: "#e0e7ff",
                borderRadius: "50px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#4338ca",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                {debateLabel[debateType] || debateType}
              </span>
            </div>
          </div>

          {/* Topic headline */}
          <div
            style={{
              fontSize: "48px",
              fontWeight: "800",
              color: "#18181b",
              lineHeight: 1.1,
              letterSpacing: "-1px",
              marginBottom: "32px",
              maxHeight: "120px",
              overflow: "hidden",
            }}
          >
            {topic.length > 80 ? topic.substring(0, 77) + "..." : topic}
          </div>

          {/* Left / Right perspectives */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              flex: 1,
            }}
          >
            {/* Left view */}
            {leftView && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: "4px solid #3b82f6",
                  paddingLeft: "20px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#3b82f6",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Left View
                </span>
                <span
                  style={{
                    fontSize: "22px",
                    color: "#1e3a5f",
                    lineHeight: 1.4,
                    maxHeight: "130px",
                    overflow: "hidden",
                  }}
                >
                  {leftView}
                </span>
              </div>
            )}

            {/* Right view */}
            {rightView && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: "4px solid #ef4444",
                  paddingLeft: "20px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#ef4444",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Right View
                </span>
                <span
                  style={{
                    fontSize: "22px",
                    color: "#5f1e1e",
                    lineHeight: 1.4,
                    maxHeight: "130px",
                    overflow: "hidden",
                  }}
                >
                  {rightView}
                </span>
              </div>
            )}
          </div>

          {/* Footer: source count + spectrum bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "auto",
              paddingTop: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#a1a1aa",
                }}
              >
                {sourceCount} sources analyzed
              </span>
            </div>

            {/* Spectrum bar */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "8px",
                  background: "#3b82f6",
                  borderRadius: "4px",
                }}
              />
              <div
                style={{
                  width: "48px",
                  height: "8px",
                  background: "#94a3b8",
                  borderRadius: "4px",
                }}
              />
              <div
                style={{
                  width: "48px",
                  height: "8px",
                  background: "#ef4444",
                  borderRadius: "4px",
                }}
              />
            </div>

            <span
              style={{
                fontSize: "16px",
                color: "#a1a1aa",
              }}
            >
              ragecheck.com/clearview
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  response.headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
  );
  return response;
}

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
          backgroundColor: "#0c0c12",
          position: "relative",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
          }}
        />

        {/* Subtle background glow */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            left: "-100px",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "48px 64px 40px",
            height: "100%",
          }}
        >
          {/* Header row: branding + debate badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "28px",
            }}
          >
            {/* Brand */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#a1a1aa",
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                }}
              >
                ClearView
              </span>
            </div>

            {/* Debate type badge */}
            <div
              style={{
                display: "flex",
                padding: "6px 18px",
                backgroundColor: "rgba(99,102,241,0.15)",
                borderRadius: "50px",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#a5b4fc",
                  letterSpacing: "1.5px",
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
              fontSize: "46px",
              fontWeight: "800",
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              marginBottom: "28px",
              maxHeight: "115px",
              overflow: "hidden",
            }}
          >
            {topic.length > 80 ? topic.substring(0, 77) + "..." : topic}
          </div>

          {/* Left / Right perspectives */}
          <div
            style={{
              display: "flex",
              gap: "20px",
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
                  backgroundColor: "rgba(59,130,246,0.08)",
                  borderLeft: "4px solid #3b82f6",
                  borderRadius: "0 12px 12px 0",
                  padding: "20px 24px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#3b82f6",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Left Perspective
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    color: "#93c5fd",
                    lineHeight: 1.4,
                    maxHeight: "120px",
                    overflow: "hidden",
                  }}
                >
                  &ldquo;{leftView}&rdquo;
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
                  backgroundColor: "rgba(239,68,68,0.08)",
                  borderLeft: "4px solid #ef4444",
                  borderRadius: "0 12px 12px 0",
                  padding: "20px 24px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#ef4444",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Right Perspective
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    color: "#fca5a5",
                    lineHeight: 1.4,
                    maxHeight: "120px",
                    overflow: "hidden",
                  }}
                >
                  &ldquo;{rightView}&rdquo;
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
              paddingTop: "20px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#52525b",
              }}
            >
              {sourceCount} sources analyzed
            </span>

            {/* Spectrum bar */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              <div style={{ width: "40px", height: "4px", background: "#3b82f6", borderRadius: "2px" }} />
              <div style={{ width: "40px", height: "4px", background: "#52525b", borderRadius: "2px" }} />
              <div style={{ width: "40px", height: "4px", background: "#ef4444", borderRadius: "2px" }} />
            </div>
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

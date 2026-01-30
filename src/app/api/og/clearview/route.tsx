import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
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
            top: "-200px",
            right: "-100px",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "56px 72px",
            height: "100%",
          }}
        >
          {/* Header: brand + badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "48px",
            }}
          >
            {/* Brand */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              {/* Eye icon */}
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="24"
                  height="24"
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
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#e4e4e7",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                ClearView
              </span>
            </div>

            {/* Badge */}
            <div
              style={{
                display: "flex",
                padding: "8px 20px",
                backgroundColor: "rgba(99,102,241,0.15)",
                borderRadius: "50px",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#a5b4fc",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                Daily Briefing
              </span>
            </div>
          </div>

          {/* Main headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              gap: "28px",
            }}
          >
            <span
              style={{
                fontSize: "64px",
                fontWeight: "800",
                color: "#ffffff",
                lineHeight: 1.05,
                letterSpacing: "-2px",
                maxWidth: "900px",
              }}
            >
              Today&apos;s news.{"\n"}Every angle. No spin.
            </span>
            <span
              style={{
                fontSize: "24px",
                color: "#71717a",
                lineHeight: 1.5,
                maxWidth: "700px",
              }}
            >
              Stories analyzed from across the political spectrum. See the core facts and how outlets frame the narrative.
            </span>
          </div>

          {/* Footer: spectrum bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              marginTop: "auto",
              paddingTop: "32px",
            }}
          >
            {/* Left */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "4px", background: "#3b82f6", borderRadius: "2px" }} />
              <span style={{ fontSize: "13px", color: "#3b82f6", fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase" }}>Left</span>
            </div>

            <div style={{ width: "1px", height: "16px", background: "#27272a" }} />

            {/* Center */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "4px", background: "#71717a", borderRadius: "2px" }} />
              <span style={{ fontSize: "13px", color: "#71717a", fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase" }}>Center</span>
            </div>

            <div style={{ width: "1px", height: "16px", background: "#27272a" }} />

            {/* Right */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "4px", background: "#ef4444", borderRadius: "2px" }} />
              <span style={{ fontSize: "13px", color: "#ef4444", fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase" }}>Right</span>
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

  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
  return response;
}

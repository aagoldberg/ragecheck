import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
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
            background: "linear-gradient(90deg, #ec4899, #f59e0b, #10b981)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "60px",
            gap: "32px",
          }}
        >
          {/* Logo and title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#18181b",
                borderRadius: "16px",
              }}
            />
            <span
              style={{
                fontSize: "72px",
                fontWeight: "800",
                color: "#18181b",
                letterSpacing: "-2px",
              }}
            >
              RageCheck
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontSize: "36px",
                fontWeight: "600",
                color: "#52525b",
                textAlign: "center",
              }}
            >
              Detect Outrage Bait Patterns
            </span>
            <span
              style={{
                fontSize: "24px",
                color: "#71717a",
                textAlign: "center",
                maxWidth: "800px",
              }}
            >
              Analyze articles and social posts for manipulative language,
              fear-mongering, and engagement bait
            </span>
          </div>

          {/* Signal indicators */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "24px",
            }}
          >
            {[
              { label: "Loaded Language", color: "#ef4444" },
              { label: "Us-vs-Them", color: "#3b82f6" },
              { label: "Fear Tactics", color: "#f97316" },
              { label: "Engagement Bait", color: "#f59e0b" },
            ].map((signal) => (
              <div
                key={signal.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  backgroundColor: "#f4f4f5",
                  borderRadius: "50px",
                  borderLeft: `4px solid ${signal.color}`,
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    color: "#52525b",
                    fontWeight: "500",
                  }}
                >
                  {signal.label}
                </span>
              </div>
            ))}
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
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              color: "#a1a1aa",
            }}
          >
            ragecheck.com
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

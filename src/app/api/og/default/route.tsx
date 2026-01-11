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
          backgroundColor: "#fafafa", // zinc-50
          padding: "60px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Main Bento Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "32px",
            border: "2px solid #e4e4e7", // zinc-200
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)",
            padding: "48px",
            justifyContent: "space-between",
          }}
        >
          {/* Header: Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", backgroundColor: "#18181b", borderRadius: "12px" }} />
            <span style={{ fontSize: "36px", fontWeight: "700", color: "#18181b", letterSpacing: "-0.02em" }}>
              RageCheck
            </span>
          </div>

          {/* Body: Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <span style={{
              fontSize: "72px",
              fontWeight: "800",
              color: "#18181b",
              lineHeight: "1.05",
              letterSpacing: "-0.03em"
            }}>
              Is that post designed to make you angry?
            </span>
            <span style={{
              fontSize: "28px",
              fontWeight: "500",
              color: "#71717a",
              lineHeight: "1.4"
            }}>
              Detect outrage bait, fear-mongering, and manipulation patterns in news and social media.
            </span>
          </div>

          {/* Footer: Signal Pills */}
          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            paddingTop: "32px",
            borderTop: "2px solid #f4f4f5"
          }}>
            {[
              { label: "Emotional Arousal", color: "#f43f5e" },
              { label: "Enemy Framing", color: "#8b5cf6" },
              { label: "Moral Outrage", color: "#f59e0b" },
              { label: "Oversimplification", color: "#3b82f6" },
              { label: "Call to Conflict", color: "#10b981" },
            ].map((signal) => (
              <div
                key={signal.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "#f4f4f5",
                  borderRadius: "100px",
                }}
              >
                <div style={{ width: "10px", height: "10px", backgroundColor: signal.color, borderRadius: "50%" }} />
                <span style={{ fontSize: "18px", color: "#52525b", fontWeight: "600" }}>
                  {signal.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

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
            padding: "56px",
            justifyContent: "space-between",
          }}
        >
          {/* Header: Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#18181b", borderRadius: "10px" }} />
            <span style={{ fontSize: "32px", fontWeight: "700", color: "#18181b", letterSpacing: "-0.02em" }}>
              RageCheck
            </span>
          </div>

          {/* Body: Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "20px" }}>
            <span style={{
              fontSize: "76px",
              fontWeight: "900",
              color: "#18181b",
              lineHeight: "1.05",
              letterSpacing: "-0.04em"
            }}>
              Is that post designed to make you angry?
            </span>
            <span style={{
              fontSize: "32px",
              fontWeight: "500",
              color: "#52525b",
              lineHeight: "1.4",
              maxWidth: "900px"
            }}>
              The linguistic pattern detector for manipulative framing in news and social media.
            </span>
          </div>

          {/* Footer: Signal Pills matching CATEGORY_COLORS from app */}
          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            paddingTop: "40px",
            borderTop: "2px solid #f4f4f5"
          }}>
            {[
              { label: "Emotional Heat", color: "#f43f5e", bg: "#fff1f2" }, // rose
              { label: "Us vs Them", color: "#6366f1", bg: "#eef2ff" }, // indigo
              { label: "Moral Outrage", color: "#f97316", bg: "#fff7ed" }, // orange/amber
              { label: "Black & White Thinking", color: "#3b82f6", bg: "#eff6ff" }, // blue
              { label: "Fight-Picking", color: "#f59e0b", bg: "#fffbeb" }, // amber
            ].map((signal) => (
              <div
                key={signal.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 24px",
                  backgroundColor: signal.bg,
                  borderRadius: "100px",
                  border: `1px solid ${signal.color}20`
                }}
              >
                <div style={{ width: "12px", height: "12px", backgroundColor: signal.color, borderRadius: "50%" }} />
                <span style={{ fontSize: "20px", color: signal.color, fontWeight: "700", letterSpacing: "-0.01em" }}>
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

  // Short cache to allow updates to propagate faster
  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
  return response;
}
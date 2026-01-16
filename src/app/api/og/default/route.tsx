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
          backgroundColor: "#fafafa",
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
            border: "2px solid #e4e4e7",
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

          {/* Body: Headline with gradient word */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", flex: 1, justifyContent: "center" }}>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: "72px",
              fontWeight: "900",
              lineHeight: "1.1",
              letterSpacing: "-0.03em"
            }}>
              <span style={{ color: "#18181b" }}>Is that post </span>
              <span style={{
                backgroundImage: "linear-gradient(90deg, #f43f5e, #6366f1)",
                backgroundClip: "text",
                color: "transparent",
              }}>designed</span>
              <span style={{ color: "#18181b" }}> to make you angry?</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{
                fontSize: "32px",
                fontWeight: "500",
                color: "#52525b",
                lineHeight: "1.4",
              }}>
                See through the outrage.
              </span>
              <span style={{
                fontSize: "32px",
                fontWeight: "500",
                color: "#52525b",
                lineHeight: "1.4",
              }}>
                Understand the tactics.
              </span>
            </div>
          </div>

          {/* Footer: URL */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "32px",
            borderTop: "2px solid #f4f4f5"
          }}>
            <span style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#a1a1aa",
              letterSpacing: "0.02em"
            }}>
              ragecheck.com
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

  // Short cache to allow updates to propagate faster
  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
  return response;
}
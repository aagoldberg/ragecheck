import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = parseInt(searchParams.get("score") || "0");
  const domain = searchParams.get("domain") || "Unknown source";
  const title = searchParams.get("title") || "Content Analysis";

  // Scientific Color Palette
  const getColors = (s: number) => {
    if (s <= 33) return { main: "#10b981", text: "#047857" }; // Emerald
    if (s <= 66) return { main: "#f59e0b", text: "#b45309" }; // Amber
    return { main: "#ef4444", text: "#b91c1c" }; // Red
  };

  const colors = getColors(score);
  
  const getRiskLabel = (s: number) => {
    if (s <= 33) return "LOW_RISK_DETECTED";
    if (s <= 66) return "MEDIUM_RISK_DETECTED";
    return "HIGH_RISK_DETECTED";
  };

  const riskLabel = getRiskLabel(score);
  const date = new Date().toISOString().split("T")[0];
  const reportId = Math.random().toString(36).substring(7).toUpperCase();

  // Truncate title for clean display
  const displayTitle = title.length > 100 ? title.substring(0, 97) + "..." : title;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          fontFamily: "monospace", // Default fallback
          padding: "60px",
          justifyContent: "space-between",
          border: "24px solid #18181b", // Thick dark frame
        }}
      >
        {/* Scientific Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            borderBottom: "2px solid #e4e4e7",
            paddingBottom: "24px",
            fontSize: "24px",
            color: "#71717a",
            fontFamily: "monospace",
          }}
        >
          <span>RAGECHECK_ANALYSIS_V1</span>
          <span>ID: {reportId}</span>
          <span>DATE: {date}</span>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          {/* Source Tag */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#f4f4f5",
              padding: "8px 16px",
              borderRadius: "4px",
              alignSelf: "flex-start",
            }}
          >
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#52525b" }}>
              SOURCE: {domain.toUpperCase()}
            </span>
          </div>

          {/* Title */}
          <span
            style={{
              fontSize: "56px",
              fontWeight: "900",
              color: "#18181b",
              lineHeight: 1.1,
              fontFamily: "sans-serif", // Keep title readable/standard
            }}
          >
            {displayTitle}
          </span>
        </div>

        {/* Data Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #e4e4e7",
            paddingTop: "32px",
          }}
        >
          {/* Score Block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "20px", color: "#71717a", marginBottom: "8px" }}>
              MANIPULATION_INDEX
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontSize: "96px", fontWeight: "900", color: colors.text, lineHeight: 0.8 }}>
                {score}
              </span>
              <span style={{ fontSize: "32px", fontWeight: "600", color: "#a1a1aa" }}>
                / 100
              </span>
            </div>
          </div>

          {/* Risk Classification */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
             <span style={{ fontSize: "20px", color: "#71717a", marginBottom: "12px" }}>
              CLASSIFICATION
            </span>
            <div
              style={{
                backgroundColor: colors.main,
                color: "white",
                padding: "16px 32px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "32px", fontWeight: "bold", letterSpacing: "2px", fontFamily: "monospace" }}>
                {riskLabel}
              </span>
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
}
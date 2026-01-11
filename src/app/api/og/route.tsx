import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = parseInt(searchParams.get("score") || "0");
  const domain = searchParams.get("domain") || "Unknown source";
  const title = searchParams.get("title") || "Content Analysis";

  // Landing Page Palette (Zinc/Emerald/Amber/Rose)
  const getColors = (s: number) => {
    if (s <= 33) return { main: "#10b981", bg: "#ecfdf5", text: "#065f46" }; // emerald
    if (s <= 66) return { main: "#f59e0b", bg: "#fffbeb", text: "#92400e" }; // amber
    return { main: "#f43f5e", bg: "#fff1f2", text: "#9f1239" }; // rose-500
  };

  const colors = getColors(score);
  
  // Truncate title
  const displayTitle = title.length > 85 ? title.substring(0, 82) + "..." : title;

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
            padding: "48px",
            justifyContent: "space-between",
          }}
        >
          {/* Header: Brand & Domain */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", backgroundColor: "#18181b", borderRadius: "8px" }} />
              <span style={{ fontSize: "28px", fontWeight: "700", color: "#18181b", letterSpacing: "-0.02em" }}>
                RageCheck
              </span>
            </div>
            
            <div style={{ 
              backgroundColor: "#f4f4f5", // zinc-100
              padding: "8px 20px", 
              borderRadius: "100px",
              fontSize: "20px",
              fontWeight: "600",
              color: "#52525b" // zinc-600
            }}>
              {domain}
            </div>
          </div>

          {/* Body: Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "20px" }}>
            <span style={{ 
              fontSize: "56px", 
              fontWeight: "800", 
              color: "#18181b", // zinc-900
              lineHeight: "1.1",
              letterSpacing: "-0.03em"
            }}>
              {displayTitle}
            </span>
          </div>

          {/* Footer: Score & Label */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "40px",
            borderTop: "2px solid #f4f4f5" 
          }}>
            {/* Score */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
               {/* Mini Gauge Visual */}
               <div style={{ 
                 width: "80px", 
                 height: "80px", 
                 borderRadius: "50%", 
                 border: `8px solid ${colors.bg}`,
                 borderTop: `8px solid ${colors.main}`,
                 borderRight: `8px solid ${colors.main}`,
                 transform: "rotate(-45deg)",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center"
               }}>
                 <span style={{ 
                   transform: "rotate(45deg)", 
                   fontSize: "28px", 
                   fontWeight: "800", 
                   color: colors.main 
                 }}>{score}</span>
               </div>

               <div style={{ display: "flex", flexDirection: "column" }}>
                 <span style={{ fontSize: "16px", fontWeight: "600", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bait Score</span>
                 <span style={{ fontSize: "32px", fontWeight: "700", color: "#18181b" }}>{score} / 100</span>
               </div>
            </div>

            {/* Verdict Badge */}
            <div style={{ 
              backgroundColor: colors.bg,
              color: colors.text,
              padding: "16px 32px",
              borderRadius: "16px",
              fontSize: "24px",
              fontWeight: "700",
              letterSpacing: "-0.01em"
            }}>
              {score > 66 ? "High Risk" : score > 33 ? "Medium Risk" : "Low Risk"}
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

  // Short cache to allow updates to propagate faster
  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
  return response;
}
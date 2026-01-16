import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
  // Fetch Inter font (WOFF format works with Vercel OG - OTF doesn't)
  const [interMedium, interBold, interBlack] = await Promise.all([
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff").then((res) => res.arrayBuffer()),
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff").then((res) => res.arrayBuffer()),
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYAZ9hjp-Ek-_EeA.woff").then((res) => res.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          backgroundColor: "#f4f4f5", // zinc-100
          fontFamily: '"Inter"',
        }}
      >
        {/* Left Side: The "Bait" (Mock Tweet) */}
        <div style={{
          flex: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          backgroundColor: "#ffffff",
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: "500px",
            backgroundColor: "#ffffff",
            gap: "24px",
          }}>
            {/* Tweet Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ 
                width: "56px", 
                height: "56px", 
                borderRadius: "50%", 
                backgroundColor: "#e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px"
              }}>
                🇺🇸
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "20px", fontWeight: "700", color: "#18181b" }}>True Patriot</span>
                <span style={{ fontSize: "18px", fontWeight: "500", color: "#71717a" }}>@truth_seeker_99</span>
              </div>
            </div>

            {/* Tweet Body */}
            <div style={{
              fontSize: "42px",
              fontWeight: "500",
              color: "#18181b",
              lineHeight: "1.2",
              letterSpacing: "-0.01em",
            }}>
              “This should make every decent person furious.”
            </div>

            {/* Tweet Footer/Stats */}
            <div style={{ 
              display: "flex", 
              gap: "24px", 
              paddingTop: "24px",
              borderTop: "1px solid #f4f4f5",
              color: "#71717a",
              fontSize: "18px",
              fontWeight: "500"
            }}>
              <span>2:14 PM · Jan 15, 2026</span>
              <span>·</span>
              <span style={{ color: "#18181b", fontWeight: "700" }}>12K</span>
              <span>Views</span>
            </div>
          </div>
        </div>

        {/* Right Side: The "Check" (Analysis Overlay) */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          backgroundColor: "#18181b", // zinc-950
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: "absolute",
            top: "-20%",
            right: "-20%",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, rgba(0,0,0,0) 70%)", // Rose glow
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "40px", position: "relative", zIndex: 10 }}>
            {/* Logo/Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
               <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "#ffffff" }} />
               <span style={{ fontSize: "20px", fontWeight: "600", color: "#e4e4e7" }}>RageCheck</span>
            </div>

            {/* Score Badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              backgroundColor: "rgba(244, 63, 94, 0.15)", // Red/Rose tint
              border: "1px solid rgba(244, 63, 94, 0.5)",
              borderRadius: "100px",
              padding: "12px 24px",
              alignSelf: "flex-start",
            }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#f43f5e" }} />
              <span style={{ fontSize: "20px", fontWeight: "700", color: "#fca5a5", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                Emotional Intensity - High
              </span>
            </div>

            {/* Main Statement */}
            <div style={{
              fontSize: "56px",
              fontWeight: "900",
              lineHeight: "1.1",
              letterSpacing: "-0.03em",
              backgroundImage: "linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}>
              This post is optimized for anger
            </div>

            {/* Analysis Points */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f43f5e" }} />
                <span style={{ fontSize: "24px", fontWeight: "500", color: "#e4e4e7" }}>orders an emotional reaction</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f43f5e" }} />
                <span style={{ fontSize: "24px", fontWeight: "500", color: "#e4e4e7" }}>implies “good people” must agree</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f43f5e" }} />
                <span style={{ fontSize: "24px", fontWeight: "500", color: "#e4e4e7" }}>pressures you to take a side</span>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
              <span style={{ fontSize: "24px", fontWeight: "500", color: "#a1a1aa" }}>
                See through it at
              </span>
              <span style={{ fontSize: "24px", fontWeight: "700", color: "#ffffff", borderBottom: "2px solid #f43f5e" }}>
                ragecheck.com
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interMedium,
          style: 'normal',
          weight: 500,
        },
        {
          name: 'Inter',
          data: interBold,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'Inter',
          data: interBlack,
          style: 'normal',
          weight: 900,
        },
      ],
    }
  );
}

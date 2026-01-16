import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
  const [montserratMedium, montserratBold, montserratBlack] = await Promise.all([
    fetch(new URL("https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Hw5aX8.ttf", import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL("https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aX8.ttf", import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL("https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCvC73w5aX8.ttf", import.meta.url)).then((res) => res.arrayBuffer()),
  ]);

  const response = new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          backgroundColor: "#f4f4f5", // zinc-100
          padding: "48px",
          fontFamily: '"Montserrat"',
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row", // Side by side
            height: "100%",
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "48px",
            border: "2px solid #e4e4e7", // zinc-200
            boxShadow: "0 24px 60px -12px rgba(0,0,0,0.08)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Left Side: Content */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            flex: "1", 
            padding: "64px", 
            justifyContent: "space-between",
            zIndex: 10,
          }}>
            {/* Header: Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", backgroundColor: "#18181b", borderRadius: "8px" }} />
              <span style={{ fontSize: "24px", fontWeight: "700", color: "#18181b", letterSpacing: "-0.02em" }}>
                RageCheck
              </span>
            </div>

            {/* Main Headline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                fontSize: "64px",
                fontWeight: "800",
                lineHeight: "1.05",
                letterSpacing: "-0.04em",
                color: "#18181b",
              }}>
                <span>Is that post </span>
                <span style={{
                  marginLeft: "12px",
                  backgroundImage: "linear-gradient(90deg, #f43f5e, #6366f1)",
                  backgroundClip: "text",
                  color: "transparent",
                }}>designed</span>
                <span> to make you angry?</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "28px", fontWeight: "500", color: "#52525b" }}>
                  See through the outrage.
                </span>
                <span style={{ fontSize: "28px", fontWeight: "500", color: "#52525b" }}>
                  Understand the tactics.
                </span>
              </div>
            </div>

            {/* CTA / URL */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px", fontWeight: "600", color: "#3f3f46" }}>
                Analyze any text at
              </span>
              <span style={{ fontSize: "20px", fontWeight: "700", color: "#6366f1" }}>
                ragecheck.com
              </span>
            </div>
          </div>

          {/* Right Side: Visuals */}
          <div style={{ 
            display: "flex", 
            flex: "0.8", 
            backgroundColor: "#fafafa", // zinc-50
            borderLeft: "2px solid #f4f4f5",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
             {/* Decorative Background Blob */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "400px",
              height: "400px",
              backgroundImage: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(255,255,255,0) 70%)",
              zIndex: 0,
            }} />

            {/* Card Mockup */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              width: "380px",
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "0 20px 40px -4px rgba(0,0,0,0.08), 0 8px 16px -4px rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.05)",
              zIndex: 10,
              gap: "24px",
            }}>
              {/* Card Header: User */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid #f4f4f5" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>😠</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                   <div style={{ width: "120px", height: "12px", backgroundColor: "#e4e4e7", borderRadius: "6px" }} />
                   <div style={{ width: "80px", height: "8px", backgroundColor: "#f4f4f5", borderRadius: "4px", marginTop: "6px" }} />
                </div>
              </div>

              {/* Card Content: Gauge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <svg width="200" height="110" viewBox="0 0 100 55">
                     <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f4f4f5" strokeWidth="8" strokeLinecap="round" />
                     {/* 84% score */}
                     <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" strokeDasharray="125.6" strokeDashoffset={125.6 - (84/100) * 125.6} />
                  </svg>
                  <div style={{ position: "absolute", bottom: "0", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "48px", fontWeight: "900", color: "#f43f5e", lineHeight: "1" }}>84</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#a1a1aa", marginTop: "4px" }}>Bait Score</span>
                  </div>
                </div>
              </div>

              {/* Card Content: Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Bar 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", color: "#52525b" }}>
                      <span>Us vs Them</span>
                      <span>85%</span>
                   </div>
                   <div style={{ width: "100%", height: "8px", backgroundColor: "#f4f4f5", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "85%", height: "100%", backgroundColor: "#6366f1", borderRadius: "4px" }} />
                   </div>
                </div>
                {/* Bar 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", color: "#52525b" }}>
                      <span>Emotional Heat</span>
                      <span>72%</span>
                   </div>
                   <div style={{ width: "100%", height: "8px", backgroundColor: "#f4f4f5", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "72%", height: "100%", backgroundColor: "#f43f5e", borderRadius: "4px" }} />
                   </div>
                </div>
              </div>

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
          name: 'Montserrat',
          data: montserratMedium,
          style: 'normal',
          weight: 500,
        },
        {
          name: 'Montserrat',
          data: montserratBold,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'Montserrat',
          data: montserratBlack,
          style: 'normal',
          weight: 900,
        },
      ],
    }
  );

  // Cache for 1 hour, stale-while-revalidate for 24 hours
  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
  return response;
}

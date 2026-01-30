import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const CATEGORY_LABELS: Record<string, string> = {
  DENIAL_MINIMIZATION: "Denial / Minimization",
  DEFLECTION_WHATABOUTISM: "Deflection / Whataboutism",
  RATIONALIZATION: "Rationalization",
  PROJECTION: "Projection",
  BLAME_SHIFTING: "Blame Shifting",
  VICTIMHOOD_REVERSAL: "Victimhood Reversal",
  GASLIGHTING_MARKERS: "Gaslighting Markers",
  STONEWALLING_DISMISSAL: "Stonewalling / Dismissal",
};

function getScoreColor(score: number): string {
  if (score <= 25) return "#2dd4bf";
  if (score <= 50) return "#14b8a6";
  if (score <= 75) return "#f59e0b";
  return "#ef4444";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const score = searchParams.get("score");
  const label = searchParams.get("label") || "Defensive Rhetoric Analysis";
  const cat1 = searchParams.get("cat1");
  const sev1 = searchParams.get("sev1");
  const cat2 = searchParams.get("cat2");
  const sev2 = searchParams.get("sev2");
  const cat3 = searchParams.get("cat3");
  const sev3 = searchParams.get("sev3");

  const hasScore = score !== null;
  const scoreNum = hasScore ? parseInt(score, 10) : 0;

  const categories = [
    { cat: cat1, sev: sev1 },
    { cat: cat2, sev: sev2 },
    { cat: cat3, sev: sev3 },
  ].filter((c) => c.cat && c.sev);

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
        {/* Teal gradient accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, #14b8a6, #2dd4bf, #5eead4)",
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
            background:
              "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)",
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
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "linear-gradient(135deg, #14b8a6, #0d9488)",
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
                DefenseCheck
              </span>
            </div>

            {hasScore && (
              <div
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  backgroundColor: "rgba(20,184,166,0.15)",
                  borderRadius: "50px",
                  border: "1px solid rgba(20,184,166,0.3)",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#5eead4",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </span>
              </div>
            )}
          </div>

          {/* Content area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              gap: "28px",
            }}
          >
            {hasScore ? (
              <>
                {/* Score display */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "96px",
                      fontWeight: "800",
                      color: getScoreColor(scoreNum),
                      lineHeight: 1,
                    }}
                  >
                    {score}
                  </span>
                  <span
                    style={{
                      fontSize: "28px",
                      fontWeight: "600",
                      color: "#52525b",
                    }}
                  >
                    / 100
                  </span>
                </div>

                {/* Category bars */}
                {categories.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      marginTop: "8px",
                    }}
                  >
                    {categories.map((c, i) => {
                      const sevNum = parseInt(c.sev!, 10);
                      const catLabel =
                        CATEGORY_LABELS[c.cat!] || c.cat;
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "16px",
                              color: "#a1a1aa",
                              width: "260px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {catLabel}
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: "10px",
                              backgroundColor: "#27272a",
                              borderRadius: "5px",
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                width: `${(sevNum / 10) * 100}%`,
                                height: "100%",
                                backgroundColor: "#14b8a6",
                                borderRadius: "5px",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#71717a",
                              width: "32px",
                              textAlign: "right",
                            }}
                          >
                            {c.sev}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
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
                  Analyze defensive{"\n"}rhetoric patterns.
                </span>
                <span
                  style={{
                    fontSize: "24px",
                    color: "#71717a",
                    lineHeight: 1.5,
                    maxWidth: "700px",
                  }}
                >
                  Paste any text and identify denial, deflection, projection,
                  rationalization, and more. One plausible reading, not a
                  diagnosis.
                </span>
              </>
            )}
          </div>

          {/* Footer tagline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              marginTop: "auto",
              paddingTop: "24px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#52525b",
              }}
            >
              Analyze any text for defensive rhetoric
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

  response.headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
  );
  return response;
}

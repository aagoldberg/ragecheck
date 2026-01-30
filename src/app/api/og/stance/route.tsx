import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const POSTURE_COLORS: Record<string, string> = {
  RAGE: "#ef4444",
  DEFENSE: "#14b8a6",
  PERSUASION: "#8b5cf6",
  SIGNALING: "#3b82f6",
  STATUS: "#f59e0b",
  COALITION: "#22c55e",
  INQUIRY: "#06b6d4",
  CYNICISM: "#64748b",
  FEAR: "#f97316",
  HUMOR: "#ec4899",
};

const POSTURE_LABELS: Record<string, string> = {
  RAGE: "Rage",
  DEFENSE: "Defense",
  PERSUASION: "Persuasion",
  SIGNALING: "Signaling",
  STATUS: "Status",
  COALITION: "Coalition",
  INQUIRY: "Inquiry",
  CYNICISM: "Cynicism",
  FEAR: "Fear",
  HUMOR: "Humor",
};

function getDefenseColor(score: number): string {
  if (score <= 25) return "#22c55e";
  if (score <= 50) return "#8b5cf6";
  if (score <= 75) return "#f59e0b";
  return "#ef4444";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const posture = searchParams.get("posture");
  const defense = searchParams.get("defense");
  const mode = searchParams.get("mode");
  const esc = searchParams.get("esc");
  const pol = searchParams.get("pol");

  const hasData = posture !== null;
  const postureLabel = posture ? POSTURE_LABELS[posture] || posture : "";
  const postureColor = posture ? POSTURE_COLORS[posture] || "#8b5cf6" : "#8b5cf6";
  const defenseNum = defense ? parseInt(defense, 10) : 0;
  const escNum = esc ? parseInt(esc, 10) : 0;
  const polNum = pol ? parseInt(pol, 10) : 0;

  const response = new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a10",
          position: "relative",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Violet gradient accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, #8b5cf6, #a78bfa, #c4b5fd)",
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
              "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
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
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
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
                Stance
              </span>
            </div>

            {hasData && mode && (
              <div
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  backgroundColor: "rgba(139,92,246,0.15)",
                  borderRadius: "50px",
                  border: "1px solid rgba(139,92,246,0.3)",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#c4b5fd",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                >
                  {mode}
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
            {hasData ? (
              <>
                {/* Posture badge + defense score */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "32px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 24px",
                      borderRadius: "50px",
                      border: `2px solid ${postureColor}`,
                      backgroundColor: `${postureColor}15`,
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        backgroundColor: postureColor,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "28px",
                        fontWeight: "800",
                        color: postureColor,
                      }}
                    >
                      {postureLabel}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span
                      style={{
                        fontSize: "48px",
                        fontWeight: "800",
                        color: getDefenseColor(defenseNum),
                        lineHeight: 1,
                      }}
                    >
                      {defense}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#52525b",
                      }}
                    >
                      defense score
                    </span>
                  </div>
                </div>

                {/* Effect gauges */}
                {(escNum > 0 || polNum > 0) && (
                  <div
                    style={{
                      display: "flex",
                      gap: "24px",
                      marginTop: "8px",
                    }}
                  >
                    {escNum > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", color: "#71717a" }}>Escalation</span>
                        <div
                          style={{
                            width: "120px",
                            height: "8px",
                            backgroundColor: "#27272a",
                            borderRadius: "4px",
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              width: `${escNum}%`,
                              height: "100%",
                              backgroundColor: escNum > 60 ? "#ef4444" : escNum > 30 ? "#f59e0b" : "#22c55e",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", color: "#52525b" }}>{esc}</span>
                      </div>
                    )}
                    {polNum > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", color: "#71717a" }}>Polarization</span>
                        <div
                          style={{
                            width: "120px",
                            height: "8px",
                            backgroundColor: "#27272a",
                            borderRadius: "4px",
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              width: `${polNum}%`,
                              height: "100%",
                              backgroundColor: polNum > 60 ? "#ef4444" : polNum > 30 ? "#f59e0b" : "#22c55e",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", color: "#52525b" }}>{pol}</span>
                      </div>
                    )}
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
                  Full rhetorical{"\n"}analysis.
                </span>
                <span
                  style={{
                    fontSize: "24px",
                    color: "#71717a",
                    lineHeight: 1.5,
                    maxWidth: "700px",
                  }}
                >
                  8-stage analysis: posture, defense patterns, persuasion techniques,
                  predicted effects, and reader interventions.
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
              Stance by RageCheck — Full rhetorical analysis
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

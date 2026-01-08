import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = parseInt(searchParams.get("score") || "0");
  const domain = searchParams.get("domain") || "Unknown";
  const title = searchParams.get("title") || "Content Analysis";

  const getColor = (s: number) => {
    if (s <= 33) return "#10b981"; // emerald
    if (s <= 66) return "#f59e0b"; // amber
    return "#f43f5e"; // rose
  };

  const getLabel = (s: number) => {
    if (s <= 33) return "Low Risk";
    if (s <= 66) return "Medium Risk";
    return "High Risk";
  };

  const color = getColor(score);
  const label = getLabel(score);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          padding: "40px 60px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#fafafa",
              borderRadius: "6px",
            }}
          />
          <span
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#fafafa",
              letterSpacing: "-0.02em",
            }}
          >
            RageCheck
          </span>
        </div>

        {/* Score Circle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "100px",
              border: `8px solid ${color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#18181b",
            }}
          >
            <span
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: color,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: "18px",
                color: "#a1a1aa",
                marginTop: "4px",
              }}
            >
              /100
            </span>
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: "600",
              color: color,
              marginTop: "20px",
            }}
          >
            {label}
          </span>
        </div>

        {/* Title & Domain */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "900px",
          }}
        >
          <span
            style={{
              fontSize: "24px",
              color: "#fafafa",
              fontWeight: "600",
              marginBottom: "12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {title.length > 60 ? title.substring(0, 60) + "..." : title}
          </span>
          <span
            style={{
              fontSize: "18px",
              color: "#71717a",
            }}
          >
            {domain}
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              color: "#52525b",
            }}
          >
            Analyze content for manipulative patterns at ragecheck.com
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

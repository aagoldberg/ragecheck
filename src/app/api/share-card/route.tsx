import { NextRequest } from "next/server";
import { renderShareCard, type CardSize } from "@/lib/shareCard";

export const runtime = "edge";

// Cache for 1 hour on CDN, 24 hours on edge
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get parameters
  const score = searchParams.get("score");
  const title = searchParams.get("title");
  const domain = searchParams.get("domain");
  const size = (searchParams.get("size") || "x") as CardSize;

  // Get signal breakdown from query params
  const arousal = searchParams.get("arousal");
  const enemy = searchParams.get("enemy");
  const moral = searchParams.get("moral");
  const simplification = searchParams.get("simplification");
  const conflict = searchParams.get("conflict");

  // Validate required params
  if (!score || !title || !domain) {
    return new Response(
      JSON.stringify({
        error: "Missing required parameters: score, title, domain",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const baitScore = parseInt(score, 10);
  if (isNaN(baitScore) || baitScore < 0 || baitScore > 100) {
    return new Response(
      JSON.stringify({ error: "Invalid score: must be 0-100" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Build bars object
  const bars: Record<string, number> = {
    arousal: arousal ? parseInt(arousal, 10) : 0,
    enemy_construction: enemy ? parseInt(enemy, 10) : 0,
    moral_condemnation: moral ? parseInt(moral, 10) : 0,
    simplification: simplification ? parseInt(simplification, 10) : 0,
    call_to_conflict: conflict ? parseInt(conflict, 10) : 0,
  };

  try {
    // Return the ImageResponse directly - it already has correct headers
    // Don't wrap in new Response as it can cause body streaming issues
    return renderShareCard(
      {
        sourceDomain: domain,
        title, // Already decoded by searchParams.get()
        baitScore,
        bars,
      },
      size
    );
  } catch (error) {
    console.error("Share card generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate share card" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

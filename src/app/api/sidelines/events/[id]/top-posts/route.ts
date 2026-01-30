import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import { initSidelinesTables, getTopPostsByArousal } from "@/lib/db-sidelines";
import type { ArousalBreakdown } from "@/lib/sidelines/types";

const AROUSAL_LABELS: Record<keyof ArousalBreakdown, string> = {
  emotionAngerFearDisgust: "Emotion",
  urgency: "Urgency",
  intensifiers: "Intensifiers",
  moralJudgment: "Moral Judgment",
  purityContamination: "Purity",
  dehumanization: "Dehumanization",
  absolutist: "Absolutist",
};

function getDominantArousalType(breakdown: ArousalBreakdown | null): string | null {
  if (!breakdown) return null;
  let maxKey: string | null = null;
  let maxVal = -1;
  for (const [key, val] of Object.entries(breakdown)) {
    if (typeof val === "number" && val > maxVal) {
      maxVal = val;
      maxKey = key;
    }
  }
  return maxKey ? AROUSAL_LABELS[maxKey as keyof ArousalBreakdown] || maxKey : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    await initSidelinesTables();
    const { id } = await params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const posts = await getTopPostsByArousal(eventId, Math.min(limit, 200));

    const enrichedPosts = posts.map((post) => ({
      ...post,
      dominantArousalType: getDominantArousalType(post.arousalBreakdown),
    }));

    return NextResponse.json({ success: true, posts: enrichedPosts });
  } catch (error) {
    console.error("SideLines top-posts error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get top posts" },
      { status: 500 }
    );
  }
}

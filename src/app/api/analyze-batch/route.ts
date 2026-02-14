import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/score";

// CORS headers for browser extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

interface BatchItem {
  id: string;
  text: string;
}

interface BatchResult {
  id: string;
  score: number;
  label: "Low" | "Medium" | "High";
  bars: {
    arousal: number;
    enemy_construction: number;
    moral_condemnation: number;
    simplification: number;
    call_to_conflict: number;
  };
}

/**
 * Batch rule-engine-only scoring for auto-dots
 * No LLM calls — pure lexical analysis, <10ms per post
 * Accepts up to 25 posts per request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: BatchItem[] = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (items.length > 25) {
      return NextResponse.json(
        { error: "Maximum 25 items per batch" },
        { status: 400, headers: corsHeaders }
      );
    }

    const results: BatchResult[] = items.map((item) => {
      if (!item.id || !item.text) {
        return { id: item.id || "unknown", score: 0, label: "Low" as const, bars: { arousal: 0, enemy_construction: 0, moral_condemnation: 0, simplification: 0, call_to_conflict: 0 } };
      }

      const analysis = analyzeText(item.text.slice(0, 2000));
      return {
        id: item.id,
        score: analysis.score,
        label: analysis.label,
        bars: analysis.signalBreakdown,
      };
    });

    return NextResponse.json({ results }, { headers: corsHeaders });
  } catch (error) {
    console.error("Batch analyze error:", error);
    return NextResponse.json(
      { error: "Batch analysis failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}

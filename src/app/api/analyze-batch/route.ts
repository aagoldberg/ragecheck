import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/score";
import Anthropic from "@anthropic-ai/sdk";

// Extend timeout for Haiku batch calls
export const maxDuration = 30;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

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
}

const BATCH_SYSTEM = `You are a ragebait detector. Score text 0-100 for emotional manipulation. Consider: loaded language, us-vs-them framing, fear-mongering, absolutist thinking, engagement bait. Reporting/quoting outrage scores LOW. Respond with ONLY a JSON array of objects with "id" and "score" fields.`;

function getLabel(score: number): "Low" | "Medium" | "High" {
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

/**
 * Batch scoring for auto-dots using Haiku
 * Sends all texts to Haiku in a single prompt for efficiency
 * Falls back to rule engine if LLM unavailable
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

    // Try Haiku batch scoring
    if (client) {
      try {
        // Build a single prompt with all texts
        const textsBlock = items
          .map((item) => `[${item.id}]: ${item.text.slice(0, 500)}`)
          .join("\n\n");

        const userPrompt = `Score each of these posts for ragebait (0-100):\n\n${textsBlock}\n\nRespond with a JSON array: [{"id":"...","score":N}, ...]`;

        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: BATCH_SYSTEM,
          messages: [{ role: "user", content: userPrompt }],
        });

        const content = response.content[0];
        if (content.type === "text") {
          const jsonMatch = content.text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const results: BatchResult[] = parsed.map((r: { id: string; score: number }) => ({
              id: r.id,
              score: Math.min(100, Math.max(0, r.score)),
              label: getLabel(r.score),
            }));
            return NextResponse.json({ results }, { headers: corsHeaders });
          }
        }
      } catch (e) {
        console.warn("Haiku batch scoring failed, falling back to rule engine:", e);
      }
    }

    // Fallback: rule engine
    const results: BatchResult[] = items.map((item) => {
      if (!item.id || !item.text) {
        return { id: item.id || "unknown", score: 0, label: "Low" as const };
      }
      const analysis = analyzeText(item.text.slice(0, 2000));
      return { id: item.id, score: analysis.score, label: analysis.label };
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

import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/lib/extract";
import { analyzeText, SignalBreakdown, Highlight } from "@/lib/score";
import { enhanceWithLLM, isLLMAvailable } from "@/lib/llm";

export interface AnalyzeResponse {
  success: boolean;
  error?: string;
  score?: number;
  label?: "Low" | "Medium" | "High";
  reasons?: string[];
  highlights?: Highlight[];
  signalBreakdown?: SignalBreakdown;
  title?: string;
  sourceDomain?: string;
  textPreview?: string;
  llmEnhanced?: boolean;
  contextNotes?: string;
}

function getLabel(score: number): "Low" | "Medium" | "High" {
  if (score <= 33) return "Low";
  if (score <= 66) return "Medium";
  return "High";
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Extract content from URL
    const extracted = await extractContent(url);

    if (!extracted.success) {
      return NextResponse.json(
        {
          success: false,
          error: extracted.error || "Failed to extract content",
          sourceDomain: extracted.sourceDomain,
        },
        { status: 422 }
      );
    }

    // Analyze the text with rules
    const ruleAnalysis = analyzeText(extracted.text);

    // Create a preview of the text (limit to 5000 chars to avoid payload issues)
    const textPreview = extracted.text.length > 5000
      ? extracted.text.substring(0, 5000) + "..."
      : extracted.text;

    // Try to enhance with LLM if available
    let finalScore = ruleAnalysis.score;
    let finalReasons = ruleAnalysis.reasons;
    let llmEnhanced = false;
    let contextNotes: string | undefined;

    if (isLLMAvailable()) {
      const llmResult = await enhanceWithLLM({
        text: extracted.text,
        title: extracted.title,
        ruleBasedScore: ruleAnalysis.score,
        signalBreakdown: ruleAnalysis.signalBreakdown,
        highlights: ruleAnalysis.highlights,
      });

      if (llmResult) {
        finalScore = llmResult.adjustedScore;
        finalReasons = llmResult.reasons;
        contextNotes = llmResult.contextNotes;
        llmEnhanced = true;
      }
    }

    return NextResponse.json({
      success: true,
      score: finalScore,
      label: getLabel(finalScore),
      reasons: finalReasons,
      highlights: ruleAnalysis.highlights,
      signalBreakdown: ruleAnalysis.signalBreakdown,
      title: extracted.title,
      sourceDomain: extracted.sourceDomain,
      textPreview,
      llmEnhanced,
      contextNotes,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

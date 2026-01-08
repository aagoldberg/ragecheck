import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/lib/extract";
import { analyzeText, SignalBreakdown, Highlight } from "@/lib/score";

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

    // Analyze the text
    const analysis = analyzeText(extracted.text);

    // Create a preview of the text (first 500 chars)
    const textPreview = extracted.text.length > 500
      ? extracted.text.substring(0, 500) + "..."
      : extracted.text;

    return NextResponse.json({
      success: true,
      score: analysis.score,
      label: analysis.label,
      reasons: analysis.reasons,
      highlights: analysis.highlights,
      signalBreakdown: analysis.signalBreakdown,
      title: extracted.title,
      sourceDomain: extracted.sourceDomain,
      textPreview,
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

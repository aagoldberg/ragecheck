import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/model/scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: "Text exceeds maximum length of 10,000 characters" },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text cannot be empty" },
        { status: 400 }
      );
    }

    // Run analysis
    const result = analyze(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Model analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}

// Also support GET for simple testing
export async function GET() {
  return NextResponse.json({
    message: "POST { text: string } to analyze text for ragebait patterns",
    version: "1.0",
    bars: [
      "arousal",
      "enemy_construction",
      "moral_condemnation",
      "simplification",
      "call_to_conflict",
    ],
    modifiers: [
      "reporting_analysis_discount",
      "information_density",
    ],
  });
}

import { NextRequest, NextResponse } from "next/server";
import { markAnalysisAbandoned } from "@/lib/db";

// CORS headers for beacon requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Beacon sends data as text/plain, so we need to handle both JSON and text
    const contentType = request.headers.get("content-type") || "";
    let sessionId: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      sessionId = body.sessionId;
    } else {
      // Beacon with text/plain
      const text = await request.text();
      try {
        const body = JSON.parse(text);
        sessionId = body.sessionId;
      } catch {
        // If not JSON, treat the whole text as sessionId
        sessionId = text;
      }
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "sessionId is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Mark the analysis as abandoned
    await markAnalysisAbandoned(sessionId);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Track abandon error:", error);
    // Return success anyway - tracking shouldn't fail
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  }
}

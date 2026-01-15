import { NextRequest, NextResponse } from "next/server";
import { logAnalysisStart } from "@/lib/db";

// CORS headers for browser extension and cross-origin requests
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
    const body = await request.json();
    const { sessionId, analysisType, url } = body;

    if (!sessionId || !analysisType) {
      return NextResponse.json(
        { success: false, error: "sessionId and analysisType are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate analysisType
    if (analysisType !== "url" && analysisType !== "image") {
      return NextResponse.json(
        { success: false, error: "analysisType must be 'url' or 'image'" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Capture visitor info from headers
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || null;
    const userAgent = request.headers.get("user-agent") || null;
    const country = request.headers.get("x-vercel-ip-country") || null;

    // Log the analysis start (fire and forget, but await to ensure it completes)
    await logAnalysisStart({
      sessionId,
      analysisType,
      url: url || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      country: country || undefined,
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Track start error:", error);
    // Return success anyway - tracking shouldn't fail the user experience
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  }
}

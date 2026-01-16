import { NextRequest, NextResponse } from "next/server";
import { markAnalysisAbandoned, AbandonmentData } from "@/lib/db";

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

interface AbandonRequestBody {
  sessionId?: string;
  reason?: 'timeout' | 'error' | 'user_close' | 'page_leave';
  timeToAbandonMs?: number;
  connectionType?: string;
  effectiveConnectionType?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Beacon sends data as text/plain, so we need to handle both JSON and text
    const contentType = request.headers.get("content-type") || "";
    let body: AbandonRequestBody = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      // Beacon with text/plain
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        // If not JSON, treat the whole text as sessionId
        body = { sessionId: text };
      }
    }

    if (!body.sessionId) {
      return NextResponse.json(
        { success: false, error: "sessionId is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Mark the analysis as abandoned with enriched data
    const abandonmentData: AbandonmentData = {
      sessionId: body.sessionId,
      reason: body.reason,
      timeToAbandonMs: body.timeToAbandonMs,
      connectionType: body.connectionType,
      effectiveConnectionType: body.effectiveConnectionType,
    };

    await markAnalysisAbandoned(abandonmentData);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Track abandon error:", error);
    // Return success anyway - tracking shouldn't fail
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  }
}

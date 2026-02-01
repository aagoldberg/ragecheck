import { NextRequest, NextResponse } from "next/server";
import { updateVisitorDuration } from "@/lib/db";

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

interface LeaveRequestBody {
  visitorId?: number;
  duration?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Beacon sends data as text/plain, so we need to handle both JSON and text
    const contentType = request.headers.get("content-type") || "";
    let body: LeaveRequestBody = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      // Beacon with text/plain
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        // Invalid payload
        return NextResponse.json({ success: true }, { headers: corsHeaders });
      }
    }

    if (body.visitorId && body.duration && body.duration > 0) {
      await updateVisitorDuration(body.visitorId, body.duration);
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Visit leave error:", error);
    // Always return success — tracking shouldn't block the user
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  }
}

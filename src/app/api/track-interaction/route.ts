import { NextRequest, NextResponse } from "next/server";
import { logInteraction, isDBAvailable } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ success: false, reason: "db_unavailable" });
    }

    const body = await request.json();
    const { category, action, label, value, metadata } = body;

    if (!category || !action) {
      return NextResponse.json({ success: false, reason: "missing_fields" });
    }

    // Get visitor info from headers
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";

    await logInteraction({
      category,
      action,
      label,
      value,
      metadata,
      ip,
      userAgent,
      referer,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track interaction error:", error);
    return NextResponse.json({ success: false, reason: "error" });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { logShare, isDBAvailable } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ success: false });
    }

    const body = await request.json();
    const { url, shareType } = body;

    if (!url || !shareType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    await logShare({
      url,
      shareType,
      ipAddress: ipAddress || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share tracking error:", error);
    return NextResponse.json({ success: false });
  }
}

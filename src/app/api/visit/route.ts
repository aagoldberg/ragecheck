import { NextRequest, NextResponse } from "next/server";
import { initDB, logVisitor, isDBAvailable } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ success: false });
    }

    await initDB();

    // Get referrer from request body (sent by frontend with document.referrer)
    let referrer: string | null = null;
    try {
      const body = await request.json();
      if (body.referrer && typeof body.referrer === "string") {
        // Only store external referrers (filter out own domain)
        const refUrl = new URL(body.referrer);
        if (!refUrl.hostname.includes("ragecheck")) {
          referrer = body.referrer;
        }
      }
    } catch {
      // No body or invalid JSON - that's fine
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;
    const country = request.headers.get("x-vercel-ip-country") || null;

    await logVisitor({
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      country: country || undefined,
      referrer: referrer || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Visit tracking error:", error);
    return NextResponse.json({ success: false });
  }
}

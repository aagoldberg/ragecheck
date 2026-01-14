import { NextRequest, NextResponse } from "next/server";
import { initDB, logVisitor, isDBAvailable } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ success: false });
    }

    await initDB();

    // Get referrer, page path, and UTM params from request body
    let referrer: string | null = null;
    let pagePath: string | null = null;
    let utmSource: string | null = null;
    let utmMedium: string | null = null;
    let utmCampaign: string | null = null;
    let utmContent: string | null = null;
    let utmTerm: string | null = null;

    try {
      const body = await request.json();
      if (body.referrer && typeof body.referrer === "string") {
        // Only store external referrers (filter out own domain)
        try {
          const refUrl = new URL(body.referrer);
          if (!refUrl.hostname.includes("ragecheck")) {
            referrer = body.referrer;
          }
        } catch {
          // Invalid URL, skip
        }
      }
      if (body.pagePath && typeof body.pagePath === "string") {
        pagePath = body.pagePath;
      }
      // Extract UTM parameters
      if (body.utmSource && typeof body.utmSource === "string") {
        utmSource = body.utmSource;
      }
      if (body.utmMedium && typeof body.utmMedium === "string") {
        utmMedium = body.utmMedium;
      }
      if (body.utmCampaign && typeof body.utmCampaign === "string") {
        utmCampaign = body.utmCampaign;
      }
      if (body.utmContent && typeof body.utmContent === "string") {
        utmContent = body.utmContent;
      }
      if (body.utmTerm && typeof body.utmTerm === "string") {
        utmTerm = body.utmTerm;
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
      pagePath: pagePath || undefined,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      utmContent: utmContent || undefined,
      utmTerm: utmTerm || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Visit tracking error:", error);
    return NextResponse.json({ success: false });
  }
}

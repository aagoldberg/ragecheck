import { NextRequest, NextResponse } from "next/server";
import { logFeedback, isDBAvailable, initFeedbackTable } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ success: false, error: "Database not available" });
    }

    // Ensure table exists
    await initFeedbackTable();

    const body = await request.json();
    const { url, rating, comment, score, title, sourceDomain, signalBreakdown } = body;

    if (!url || !rating || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const country = request.headers.get("x-vercel-ip-country") || null;
    const referrer = request.headers.get("referer") || null;

    // Truncate comment to 500 chars max
    const truncatedComment = comment ? comment.slice(0, 500) : null;

    await logFeedback({
      url,
      rating,
      comment: truncatedComment,
      score,
      title: title || "",
      sourceDomain: sourceDomain || "",
      signalBreakdown: signalBreakdown || {},
      ipAddress: ipAddress || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      country: country || undefined,
      referrer: referrer || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

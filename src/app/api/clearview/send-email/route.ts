import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getClearviewData, getActiveSubscribers } from "@/lib/db";
import DailyBriefingEmail from "@/emails/daily-briefing";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// POST: Send daily briefing to all active subscribers
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY;

  const isAuthorized = adminKey && authHeader?.replace("Bearer ", "") === adminKey;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json(
      { error: "Resend not configured. Add RESEND_API_KEY to env." },
      { status: 503 }
    );
  }

  const fromEmail = process.env.CLEARVIEW_FROM_EMAIL || "onboarding@resend.dev";

  try {
    // Get ClearView data
    const data = await getClearviewData();

    if (!data || !data.stories || data.stories.length === 0) {
      return NextResponse.json(
        { error: "No ClearView data available" },
        { status: 404 }
      );
    }

    // Get all active subscribers (optionally filter by source)
    const body = await request.json().catch(() => ({}));
    const source = body.source || "clearview"; // Default to clearview subscribers
    const subscribers = await getActiveSubscribers(source === "all" ? undefined : source);

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers found", source },
        { status: 404 }
      );
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const topStories = data.stories.slice(0, 2).map((s: { topic: string }) => s.topic).join(", ");
    const subject = `ClearView Daily: ${topStories}`;

    // Send emails in batches (Resend recommends max 100 per batch)
    const batchSize = 100;
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      // Create individual sends for each subscriber (for unsubscribe tracking)
      const sendPromises = batch.map(async (subscriber) => {
        try {
          // Generate unique unsubscribe URL for this subscriber
          const unsubscribeToken = Buffer.from(subscriber.email).toString("base64");
          const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://ragecheck.com"}/api/clearview/unsubscribe?token=${unsubscribeToken}`;

          const { error } = await resend.emails.send({
            from: fromEmail,
            to: subscriber.email,
            subject,
            react: DailyBriefingEmail({
              stories: data.stories,
              date: today,
            }),
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          });

          if (error) {
            results.failed++;
            results.errors.push(`${subscriber.email}: ${error.message}`);
          } else {
            results.sent++;
          }
        } catch (err) {
          results.failed++;
          results.errors.push(`${subscriber.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      });

      await Promise.all(sendPromises);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Email send complete: ${results.sent} sent, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      totalSubscribers: subscribers.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Only return first 10 errors
    });
  } catch (error) {
    console.error("Send email failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Send failed" },
      { status: 500 }
    );
  }
}

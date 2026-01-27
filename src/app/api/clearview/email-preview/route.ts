import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { getClearviewData } from "@/lib/db";
import DailyBriefingEmail from "@/emails/daily-briefing";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// GET: Render email HTML for preview in browser
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY;

  // Allow preview without auth in development, require auth in production
  const isDev = process.env.NODE_ENV === "development";
  const isAuthorized = isDev || (adminKey && authHeader?.replace("Bearer ", "") === adminKey);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getClearviewData();

    if (!data || !data.stories || data.stories.length === 0) {
      return new NextResponse(
        "<html><body><h1>No ClearView data available</h1><p>Run the refresh endpoint first.</p></body></html>",
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = await render(
      DailyBriefingEmail({
        stories: data.stories,
        date: today,
      })
    );

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Email preview failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview failed" },
      { status: 500 }
    );
  }
}

// POST: Send test email to CLEARVIEW_TEST_EMAIL
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

  const testEmail = process.env.CLEARVIEW_TEST_EMAIL;
  const fromEmail = process.env.CLEARVIEW_FROM_EMAIL || "onboarding@resend.dev";

  if (!testEmail) {
    return NextResponse.json(
      { error: "CLEARVIEW_TEST_EMAIL not configured" },
      { status: 503 }
    );
  }

  try {
    const data = await getClearviewData();

    if (!data || !data.stories || data.stories.length === 0) {
      return NextResponse.json(
        { error: "No ClearView data available" },
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

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: `[TEST] ClearView Daily: ${topStories}`,
      react: DailyBriefingEmail({
        stories: data.stories,
        date: today,
      }),
    });

    if (error) {
      console.error("Test email failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error("Test email failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Send failed" },
      { status: 500 }
    );
  }
}

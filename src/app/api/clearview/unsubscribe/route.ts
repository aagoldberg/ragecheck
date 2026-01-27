import { NextRequest, NextResponse } from "next/server";
import { unsubscribeEmail } from "@/lib/db";

// GET: Handle unsubscribe link clicks
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(
      renderUnsubscribePage("Invalid unsubscribe link", false),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    // Decode email from token
    const email = Buffer.from(token, "base64").toString("utf-8");

    if (!email || !email.includes("@")) {
      return new NextResponse(
        renderUnsubscribePage("Invalid unsubscribe link", false),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const result = await unsubscribeEmail(email);

    if (result.success) {
      return new NextResponse(
        renderUnsubscribePage(`You've been unsubscribed from ClearView Daily.`, true),
        { headers: { "Content-Type": "text/html" } }
      );
    } else {
      return new NextResponse(
        renderUnsubscribePage(result.error || "Unsubscribe failed", false),
        { headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (error) {
    console.error("Unsubscribe failed:", error);
    return new NextResponse(
      renderUnsubscribePage("Something went wrong. Please try again.", false),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

function renderUnsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? "Unsubscribed" : "Error"} - ClearView</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f6f9fc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 48px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin-bottom: 12px;
    }
    p {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    a {
      color: #7c3aed;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? "✅" : "⚠️"}</div>
    <h1>${success ? "Unsubscribed" : "Oops"}</h1>
    <p>${message}</p>
    <a href="https://ragecheck.com/clearview">← Back to ClearView</a>
  </div>
</body>
</html>`;
}

import { NextRequest, NextResponse } from "next/server";

const rawWorkerUrl =
  process.env.SIDELINES_WORKER_URL || "http://localhost:8000";
const WORKER_URL = rawWorkerUrl.startsWith("http")
  ? rawWorkerUrl
  : `https://${rawWorkerUrl}`;

export async function GET(request: NextRequest) {
  try {
    const communityId = request.nextUrl.searchParams.get("id");
    if (!communityId) {
      return NextResponse.json(
        { success: false, error: "Missing community id" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${WORKER_URL}/pulse/community/${communityId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { success: false, error: `Worker error: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("SideLines pulse community error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch community data",
      },
      { status: 500 }
    );
  }
}

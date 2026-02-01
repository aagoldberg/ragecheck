import { NextResponse } from "next/server";

const rawWorkerUrl =
  process.env.SIDELINES_WORKER_URL || "http://localhost:8000";
const WORKER_URL = rawWorkerUrl.startsWith("http")
  ? rawWorkerUrl
  : `https://${rawWorkerUrl}`;

export async function GET() {
  try {
    const res = await fetch(`${WORKER_URL}/pulse/network`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { success: false, error: `Worker error: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("SideLines network graph error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch network data",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import { initSidelinesTables, getGlobalCommunities } from "@/lib/db-sidelines";

const rawWorkerUrl =
  process.env.SIDELINES_WORKER_URL || "http://localhost:8000";
const WORKER_URL = rawWorkerUrl.startsWith("http")
  ? rawWorkerUrl
  : `https://${rawWorkerUrl}`;

export async function GET() {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    await initSidelinesTables();
    const communities = await getGlobalCommunities();

    return NextResponse.json({ success: true, communities });
  } catch (error) {
    console.error("SideLines communities error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch communities",
      },
      { status: 500 }
    );
  }
}

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    await initSidelinesTables();

    const body = await request.json().catch(() => ({}));
    const action = body.action || "compute";

    if (action === "crawl-starter-packs") {
      const res = await fetch(`${WORKER_URL}/crawl-starter-packs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: body.queries || null,
          max_packs: body.maxPacks || 100,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { success: false, error: `Worker error: ${errorText}` },
          { status: res.status }
        );
      }
      return NextResponse.json({ success: true, ...(await res.json()) });
    }

    if (action === "backfill-follows") {
      const res = await fetch(`${WORKER_URL}/backfill-follows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: body.batchSize || 200 }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { success: false, error: `Worker error: ${errorText}` },
          { status: res.status }
        );
      }
      return NextResponse.json({ success: true, ...(await res.json()) });
    }

    if (action === "compute") {
      const res = await fetch(`${WORKER_URL}/compute-communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_shared: body.minShared || 3,
          min_community_size: body.minCommunitySize || 5,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { success: false, error: `Worker error: ${errorText}` },
          { status: res.status }
        );
      }
      return NextResponse.json({ success: true, ...(await res.json()) });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("SideLines communities POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Community operation failed",
      },
      { status: 500 }
    );
  }
}

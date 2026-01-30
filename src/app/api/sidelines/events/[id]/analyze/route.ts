import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import {
  initSidelinesTables,
  getEvent,
  updateEventStatus,
  getFollowsFetchProgress,
} from "@/lib/db-sidelines";

export const maxDuration = 300;

const rawWorkerUrl = process.env.SIDELINES_WORKER_URL || "http://localhost:8000";
const WORKER_URL = rawWorkerUrl.startsWith("http") ? rawWorkerUrl : `https://${rawWorkerUrl}`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    await initSidelinesTables();
    const { id } = await params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const event = await getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const day = body.day || new Date().toISOString().split("T")[0];

    await updateEventStatus(eventId, "analyzing");

    try {
      const workerRes = await fetch(`${WORKER_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, day }),
      });

      if (!workerRes.ok) {
        const errorText = await workerRes.text();
        await updateEventStatus(eventId, "error");
        return NextResponse.json(
          { success: false, error: `Worker error: ${errorText}` },
          { status: workerRes.status }
        );
      }

      const result = await workerRes.json();

      // If follows data exists, also run co-follow analysis
      try {
        const followsProgress = await getFollowsFetchProgress(eventId);
        if (followsProgress.fetched > 0) {
          const followsRes = await fetch(`${WORKER_URL}/analyze-follows`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: eventId, day }),
          });
          if (followsRes.ok) {
            const followsResult = await followsRes.json();
            result.cofollowCommunities = followsResult.communities;
          }
        }
      } catch (followsError) {
        // Co-follow analysis is non-critical — log but don't fail
        console.error("Co-follow analysis error (non-fatal):", followsError);
      }

      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      await updateEventStatus(eventId, "error");
      throw error;
    }
  } catch (error) {
    console.error("SideLines analyze error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}

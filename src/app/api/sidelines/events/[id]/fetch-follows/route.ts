import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import {
  initSidelinesTables,
  getEvent,
  updateEventStatus,
  getFollowsFetchProgress,
} from "@/lib/db-sidelines";
import { fetchFollowsBatch } from "@/lib/sidelines/follow-collector";

export const maxDuration = 300;

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

    // Only allow fetching follows from appropriate states
    const allowedStatuses = ["collected", "fetching_follows", "follows_ready", "ready"];
    if (!allowedStatuses.includes(event.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot fetch follows in status: ${event.status}` },
        { status: 400 }
      );
    }

    await updateEventStatus(eventId, "fetching_follows");

    try {
      const result = await fetchFollowsBatch(eventId, 200);

      if (result.done) {
        await updateEventStatus(eventId, "follows_ready");
      }

      return NextResponse.json({
        success: true,
        processed: result.processed,
        total: result.total,
        done: result.done,
      });
    } catch (error) {
      // On error, revert to collected so user can retry
      await updateEventStatus(eventId, "collected");
      throw error;
    }
  } catch (error) {
    console.error("SideLines fetch-follows error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Follow fetch failed" },
      { status: 500 }
    );
  }
}

export async function GET(
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

    const progress = await getFollowsFetchProgress(eventId);
    return NextResponse.json({
      success: true,
      ...progress,
      done: progress.fetched >= progress.total,
    });
  } catch (error) {
    console.error("SideLines fetch-follows progress error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Progress check failed" },
      { status: 500 }
    );
  }
}

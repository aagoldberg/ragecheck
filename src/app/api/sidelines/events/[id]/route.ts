import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import {
  initSidelinesTables,
  getEvent,
  getPostCount,
  getUserCount,
  getEdgeCount,
  getLatestDailyMetrics,
} from "@/lib/db-sidelines";

export async function GET(
  _request: Request,
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

    const [postCount, userCount, edgeCount, latestMetrics] = await Promise.all([
      getPostCount(eventId),
      getUserCount(eventId),
      getEdgeCount(eventId),
      getLatestDailyMetrics(eventId),
    ]);

    return NextResponse.json({
      success: true,
      event,
      counts: { postCount, userCount, edgeCount },
      latestMetrics,
    });
  } catch (error) {
    console.error("SideLines event GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get event" },
      { status: 500 }
    );
  }
}

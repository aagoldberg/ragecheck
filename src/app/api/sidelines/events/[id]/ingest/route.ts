import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import {
  initSidelinesTables,
  getEvent,
  updateEventStatus,
} from "@/lib/db-sidelines";
import { collectEvent } from "@/lib/sidelines/collector";

export const maxDuration = 300;

export async function POST(
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

    await updateEventStatus(eventId, "collecting");

    try {
      const result = await collectEvent(event);
      await updateEventStatus(eventId, "collected");

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      await updateEventStatus(eventId, "error");
      throw error;
    }
  } catch (error) {
    console.error("SideLines ingest error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 }
    );
  }
}

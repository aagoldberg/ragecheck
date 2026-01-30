import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import { initSidelinesTables, getDailyMetrics } from "@/lib/db-sidelines";

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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const metrics = await getDailyMetrics(eventId, days);

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error("SideLines metrics error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get metrics" },
      { status: 500 }
    );
  }
}

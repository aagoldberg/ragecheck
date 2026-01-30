import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import { initSidelinesTables, getTopPostsByArousal } from "@/lib/db-sidelines";

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
    const limit = parseInt(searchParams.get("limit") || "50");

    const posts = await getTopPostsByArousal(eventId, Math.min(limit, 200));

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("SideLines top-posts error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get top posts" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import { initSidelinesTables, createEvent, listEvents } from "@/lib/db-sidelines";

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
    const events = await listEvents();

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("SideLines events GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to list events" },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();

    const { name, description, platform, keywords, seedPostUris, startTs, endTs } = body;

    if (!name || !keywords || !startTs || !endTs) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, keywords, startTs, endTs" },
        { status: 400 }
      );
    }

    const id = await createEvent({
      name,
      description: description || "",
      platform: platform || "bluesky",
      keywords: Array.isArray(keywords) ? keywords : [keywords],
      seedPostUris: seedPostUris || [],
      startTs: new Date(startTs),
      endTs: new Date(endTs),
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error("SideLines events POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create event" },
      { status: 500 }
    );
  }
}

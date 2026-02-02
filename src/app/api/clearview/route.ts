import { NextResponse } from "next/server";
import { getClearviewData, initClearviewTable, isDBAvailable, getArchivedClearviewData, ClearviewStory } from "@/lib/db";

// This endpoint only serves cached data from the database.
// The /api/clearview/refresh endpoint (called by cron) handles generation.

interface ArchivedBriefing {
  stories: ClearviewStory[];
  generatedAt: string;
}

// Accept cache up to 24 hours old (cron runs every 12 hours)
const CACHE_HOURS = 24;

export async function GET() {
  try {
    const dbAvailable = await isDBAvailable();

    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    await initClearviewTable();
    const cached = await getClearviewData(CACHE_HOURS);

    if (!cached || cached.stories.length === 0) {
      return NextResponse.json({
        success: true,
        stories: [],
        generatedAt: null,
        archived: [],
        cached: false,
      });
    }

    // Get archived briefings
    let archived: ArchivedBriefing[] = [];
    try {
      const archivedData = await getArchivedClearviewData(cached.id);
      archived = archivedData.map(a => ({
        stories: a.stories,
        generatedAt: a.generatedAt,
      }));
    } catch (e) {
      console.error("Failed to load archived briefings:", e);
    }

    return NextResponse.json({
      success: true,
      id: cached.id,
      stories: cached.stories,
      generatedAt: cached.generatedAt,
      archived,
      cached: true,
    });
  } catch (error) {
    console.error("Clearview API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load analysis"
      },
      { status: 500 }
    );
  }
}

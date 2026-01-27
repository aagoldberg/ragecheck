import { NextResponse } from "next/server";
import {
  getExistingStories,
  getUnclusteredHeadlines,
  updateHeadlineStories,
  upsertStoriesWithFraming,
  getHeadlinesGroupedByStory,
} from "@/lib/db";
import { clusterHeadlinesBatch, HeadlineForClustering, extractFramingExamples } from "@/lib/llm";

// GET: Return headlines grouped by story
export async function GET() {
  try {
    const storyGroups = await getHeadlinesGroupedByStory(72); // Last 72 hours

    return NextResponse.json({
      success: true,
      stories: storyGroups,
      count: storyGroups.length,
      totalHeadlines: storyGroups.reduce((sum, g) => sum + g.headlines.length, 0),
    });
  } catch (error) {
    console.error("Failed to get story groups:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get story groups" },
      { status: 500 }
    );
  }
}

// POST: Run clustering job on unclustered headlines
export async function POST(request: Request) {
  try {
    // Check for admin key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const adminKey = process.env.ADMIN_KEY || "ragecheck-admin-2024";

    if (key !== adminKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get existing stories for context
    const existingStories = await getExistingStories();
    console.log(`Found ${existingStories.length} existing stories`);

    // Get unclustered headlines
    const unclustered = await getUnclusteredHeadlines(200);
    console.log(`Found ${unclustered.length} unclustered headlines`);

    if (unclustered.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unclustered headlines",
        clustered: 0,
        newStories: 0,
      });
    }

    // Prepare headlines for clustering
    const headlinesForClustering: HeadlineForClustering[] = unclustered.map((h) => ({
      id: h.id!,
      title: h.title,
      source: h.source,
      score: h.score,
    }));

    // Run clustering with Haiku
    const result = await clusterHeadlinesBatch(
      headlinesForClustering,
      existingStories.map((s) => ({ slug: s.slug, label: s.label }))
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || "Clustering failed",
      }, { status: 500 });
    }

    // Update database with story assignments
    if (result.assignments.length > 0) {
      await updateHeadlineStories(
        result.assignments.map((a) => ({
          id: a.headlineId,
          storySlug: a.storySlug,
          storyLabel: a.storyLabel,
        }))
      );
    }

    // Save new stories with framing examples
    if (result.newStories.length > 0) {
      await upsertStoriesWithFraming(result.newStories);
    }

    return NextResponse.json({
      success: true,
      clustered: result.assignments.length,
      newStories: result.newStories.length,
      newStoryList: result.newStories,
      existingStoriesUsed: existingStories.length,
    });
  } catch (error) {
    console.error("Clustering job failed:", error);
    return NextResponse.json(
      { success: false, error: "Clustering job failed" },
      { status: 500 }
    );
  }
}

// PUT: Backfill framing examples for existing stories
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const adminKey = process.env.ADMIN_KEY || "ragecheck-admin-2024";

    if (key !== adminKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get all story groups
    const storyGroups = await getHeadlinesGroupedByStory(72);

    // Check for force=true to re-extract all stories
    const force = searchParams.get("force") === "true";

    // Filter to stories without framing examples OR missing the new fields OR force refresh
    const storiesNeedingFraming = storyGroups.filter(s => {
      if (force) return true;
      if (!s.framingExamples) return true;
      // Also re-extract if missing the new fields (moralWords, conflictWords)
      if (!s.framingExamples.moralWords || !s.framingExamples.conflictWords) return true;
      return false;
    });
    console.log(`Found ${storiesNeedingFraming.length} stories needing framing examples`);

    if (storiesNeedingFraming.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All stories already have framing examples",
        updated: 0,
      });
    }

    const updates: { slug: string; label: string; framingExamples?: { divisionWords: string[]; emotionWords: string[]; moralWords: string[]; conflictWords: string[]; simplificationNote: string } }[] = [];

    for (const story of storiesNeedingFraming) {
      console.log(`Extracting framing for: ${story.label}`);
      const framingExamples = await extractFramingExamples(
        story.headlines.map(h => ({ title: h.title })),
        story.label
      );

      if (framingExamples) {
        updates.push({
          slug: story.slug,
          label: story.label,
          framingExamples,
        });
      }

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Save updates
    if (updates.length > 0) {
      await upsertStoriesWithFraming(updates);
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      stories: updates.map(u => ({ slug: u.slug, framingExamples: u.framingExamples })),
    });
  } catch (error) {
    console.error("Framing backfill failed:", error);
    return NextResponse.json(
      { success: false, error: "Framing backfill failed" },
      { status: 500 }
    );
  }
}

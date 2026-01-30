import { NextResponse } from "next/server";
import { isDBAvailable } from "@/lib/db";
import {
  initSidelinesTables,
  getClusterAssignments,
  getLatestDailyMetrics,
} from "@/lib/db-sidelines";

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
    const day = searchParams.get("day") || new Date().toISOString().split("T")[0];
    const minSize = parseInt(searchParams.get("minSize") || "5");

    const assignments = await getClusterAssignments(eventId, day);

    // Group by cluster for stats
    const clusterStats: Record<number, { count: number; members: { userId: number; handle?: string; displayName?: string; score: number }[] }> = {};
    for (const a of assignments) {
      if (!clusterStats[a.clusterId]) {
        clusterStats[a.clusterId] = { count: 0, members: [] };
      }
      clusterStats[a.clusterId].count++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extended = a as any;
      clusterStats[a.clusterId].members.push({
        userId: a.userId,
        handle: extended.handle,
        displayName: extended.displayName,
        score: a.score,
      });
    }

    // Filter by minSize
    const filteredClusters: typeof clusterStats = {};
    for (const [cid, data] of Object.entries(clusterStats)) {
      if (data.count >= minSize) {
        filteredClusters[parseInt(cid)] = data;
      }
    }

    // Include cluster summaries from latest metrics if available
    const latestMetrics = await getLatestDailyMetrics(eventId);
    const clusterSummaries = latestMetrics?.metrics?.clusterSummaries || [];

    return NextResponse.json({
      success: true,
      day,
      clusters: filteredClusters,
      clusterSummaries,
      totalUsers: assignments.length,
    });
  } catch (error) {
    console.error("SideLines clusters error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get clusters" },
      { status: 500 }
    );
  }
}

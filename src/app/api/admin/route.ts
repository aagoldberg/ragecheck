import { NextRequest, NextResponse } from "next/server";
import { initDB, getDashboardStats, getVisitorStats, getPageVisitorStats, getViralMetrics, isDBAvailable, invalidateIncompleteCache, recomputeBotFlags, getFeedbackStats, initFeedbackTable, getTimeToAnalysisMetrics, getConversionMetrics, getConversionInsights, getFunnelMetrics, getRetentionMetrics, getShareMetrics, getContentInsights } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Simple password protection via query param
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  // Use env var for admin key, fallback to a default for dev
  const adminKey = process.env.ADMIN_KEY || "ragecheck-admin-2024";

  if (key !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if DB is available
  const dbAvailable = await isDBAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "Database not configured", dbAvailable: false },
      { status: 503 }
    );
  }

  try {
    // Initialize DB tables if needed
    await initDB();
    await initFeedbackTable();

    // Get dashboard stats
    const stats = await getDashboardStats();
    const visitorStats = await getVisitorStats();
    const clearviewVisitorStats = await getPageVisitorStats("/clearview");
    const viralMetrics = await getViralMetrics();
    const feedbackStats = await getFeedbackStats();
    const timeToAnalysis = await getTimeToAnalysisMetrics();
    const conversionMetrics = await getConversionMetrics();
    const conversionInsights = await getConversionInsights();
    const funnelMetrics = await getFunnelMetrics();
    const retentionMetrics = await getRetentionMetrics();
    const shareMetrics = await getShareMetrics();
    const contentInsights = await getContentInsights();

    return NextResponse.json({
      success: true,
      dbAvailable: true,
      stats,
      visitorStats,
      clearviewVisitorStats,
      viralMetrics,
      feedbackStats,
      timeToAnalysis,
      conversionMetrics,
      conversionInsights,
      funnelMetrics,
      retentionMetrics,
      shareMetrics,
      contentInsights,
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Failed to get stats", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const adminKey = process.env.ADMIN_KEY || "ragecheck-admin-2024";

  if (key !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "invalidate_incomplete_cache") {
      const count = await invalidateIncompleteCache();
      return NextResponse.json({
        success: true,
        action,
        invalidatedCount: count,
        message: `Invalidated ${count} incomplete cache entries`,
      });
    }

    if (action === "recompute_bot_flags") {
      const result = await recomputeBotFlags();
      return NextResponse.json({
        success: true,
        action,
        ...result,
        message: `Updated ${result.analysesUpdated} analyses and ${result.visitorsUpdated} visitors`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json(
      { error: "Failed to execute action", details: String(error) },
      { status: 500 }
    );
  }
}

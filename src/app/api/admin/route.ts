import { NextRequest, NextResponse } from "next/server";
import { initDB, getDashboardStats, getVisitorStats, getPageVisitorStats, getViralMetrics, isDBAvailable } from "@/lib/db";

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

    // Get dashboard stats
    const stats = await getDashboardStats();
    const visitorStats = await getVisitorStats();
    const clearviewVisitorStats = await getPageVisitorStats("/clearview");
    const viralMetrics = await getViralMetrics();

    return NextResponse.json({
      success: true,
      dbAvailable: true,
      stats,
      visitorStats,
      clearviewVisitorStats,
      viralMetrics,
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Failed to get stats", details: String(error) },
      { status: 500 }
    );
  }
}

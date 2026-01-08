import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Initialize table if it doesn't exist
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS ragecheck_analyses (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      source_domain TEXT,
      platform TEXT,
      score INTEGER,
      label TEXT,
      llm_enhanced BOOLEAN DEFAULT FALSE,
      signal_loaded_language INTEGER,
      signal_absolutist INTEGER,
      signal_threat_panic INTEGER,
      signal_us_vs_them INTEGER,
      signal_engagement_bait INTEGER,
      success BOOLEAN DEFAULT TRUE,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export interface AnalysisLog {
  url: string;
  sourceDomain?: string;
  platform?: string;
  score?: number;
  label?: string;
  llmEnhanced?: boolean;
  signalBreakdown?: {
    loadedLanguage: number;
    absolutist: number;
    threatPanic: number;
    usVsThem: number;
    engagementBait: number;
  };
  success: boolean;
  error?: string;
}

function detectPlatform(domain: string): string {
  if (domain.includes("twitter.com") || domain.includes("x.com")) return "twitter";
  if (domain.includes("bsky.app")) return "bluesky";
  if (domain.includes("threads.net")) return "threads";
  if (domain.includes("warpcast.com") || domain.includes("farcaster")) return "farcaster";
  if (domain.includes("truthsocial.com")) return "truthsocial";
  return "web";
}

export async function logAnalysis(data: AnalysisLog) {
  try {
    const platform = data.sourceDomain ? detectPlatform(data.sourceDomain) : "unknown";

    await sql`
      INSERT INTO ragecheck_analyses (
        url, source_domain, platform, score, label, llm_enhanced,
        signal_loaded_language, signal_absolutist, signal_threat_panic,
        signal_us_vs_them, signal_engagement_bait, success, error
      ) VALUES (
        ${data.url},
        ${data.sourceDomain || null},
        ${platform},
        ${data.score || null},
        ${data.label || null},
        ${data.llmEnhanced || false},
        ${data.signalBreakdown?.loadedLanguage || null},
        ${data.signalBreakdown?.absolutist || null},
        ${data.signalBreakdown?.threatPanic || null},
        ${data.signalBreakdown?.usVsThem || null},
        ${data.signalBreakdown?.engagementBait || null},
        ${data.success},
        ${data.error || null}
      )
    `;
  } catch (error) {
    console.error("Failed to log analysis:", error);
    // Don't throw - logging shouldn't break the main flow
  }
}

export interface DashboardStats {
  totalAnalyses: number;
  todayAnalyses: number;
  weekAnalyses: number;
  avgScore: number;
  scoreDistribution: { low: number; medium: number; high: number };
  platformBreakdown: Record<string, number>;
  topDomains: { domain: string; count: number; avgScore: number }[];
  signalAverages: {
    loadedLanguage: number;
    absolutist: number;
    threatPanic: number;
    usVsThem: number;
    engagementBait: number;
  };
  successRate: number;
  llmEnhancedRate: number;
  recentAnalyses: {
    url: string;
    sourceDomain: string;
    score: number;
    label: string;
    createdAt: Date;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Total counts
  const [totalResult] = await sql`SELECT COUNT(*) as count FROM ragecheck_analyses`;
  const [todayResult] = await sql`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE created_at > NOW() - INTERVAL '1 day'`;
  const [weekResult] = await sql`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE created_at > NOW() - INTERVAL '7 days'`;

  // Average score
  const [avgResult] = await sql`SELECT AVG(score) as avg FROM ragecheck_analyses WHERE score IS NOT NULL`;

  // Score distribution
  const [lowCount] = await sql`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE score IS NOT NULL AND score <= 33`;
  const [medCount] = await sql`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE score IS NOT NULL AND score > 33 AND score <= 66`;
  const [highCount] = await sql`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE score IS NOT NULL AND score > 66`;

  // Platform breakdown
  const platformRows = await sql`SELECT platform, COUNT(*) as count FROM ragecheck_analyses GROUP BY platform`;
  const platformBreakdown: Record<string, number> = {};
  for (const row of platformRows) {
    platformBreakdown[row.platform || "unknown"] = Number(row.count);
  }

  // Top domains
  const topDomainRows = await sql`
    SELECT source_domain as domain, COUNT(*) as count, AVG(score) as avg_score
    FROM ragecheck_analyses
    WHERE source_domain IS NOT NULL
    GROUP BY source_domain
    ORDER BY count DESC
    LIMIT 10
  `;
  const topDomains = topDomainRows.map((row) => ({
    domain: row.domain,
    count: Number(row.count),
    avgScore: Math.round(Number(row.avg_score) || 0),
  }));

  // Signal averages
  const [signalAvgs] = await sql`
    SELECT
      AVG(signal_loaded_language) as loaded_language,
      AVG(signal_absolutist) as absolutist,
      AVG(signal_threat_panic) as threat_panic,
      AVG(signal_us_vs_them) as us_vs_them,
      AVG(signal_engagement_bait) as engagement_bait
    FROM ragecheck_analyses
    WHERE score IS NOT NULL
  `;

  // Success rate
  const [successResult] = await sql`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE success = true`;
  const successRate = totalResult.count > 0 ? (Number(successResult.count) / Number(totalResult.count)) * 100 : 0;

  // LLM enhanced rate
  const [llmResult] = await sql`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE llm_enhanced = true`;
  const llmEnhancedRate = totalResult.count > 0 ? (Number(llmResult.count) / Number(totalResult.count)) * 100 : 0;

  // Recent analyses
  const recentRows = await sql`
    SELECT url, source_domain, score, label, created_at, success
    FROM ragecheck_analyses
    ORDER BY created_at DESC
    LIMIT 100
  `;
  const recentAnalyses = recentRows.map((row) => ({
    url: row.url,
    sourceDomain: row.source_domain || "unknown",
    score: Number(row.score),
    label: row.label || "Unknown",
    createdAt: row.created_at,
  }));

  return {
    totalAnalyses: Number(totalResult.count),
    todayAnalyses: Number(todayResult.count),
    weekAnalyses: Number(weekResult.count),
    avgScore: Math.round(Number(avgResult.avg) || 0),
    scoreDistribution: {
      low: Number(lowCount.count),
      medium: Number(medCount.count),
      high: Number(highCount.count),
    },
    platformBreakdown,
    topDomains,
    signalAverages: {
      loadedLanguage: Math.round(Number(signalAvgs?.loaded_language) || 0),
      absolutist: Math.round(Number(signalAvgs?.absolutist) || 0),
      threatPanic: Math.round(Number(signalAvgs?.threat_panic) || 0),
      usVsThem: Math.round(Number(signalAvgs?.us_vs_them) || 0),
      engagementBait: Math.round(Number(signalAvgs?.engagement_bait) || 0),
    },
    successRate: Math.round(successRate),
    llmEnhancedRate: Math.round(llmEnhancedRate),
    recentAnalyses,
  };
}

export async function isDBAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

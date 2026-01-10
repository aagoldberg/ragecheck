import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Cache the database connection
let dbInstance: NeonQueryFunction<false, false> | null = null;

// Lazy initialization - only connect when needed (not at build time)
function getDb(): NeonQueryFunction<false, false> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured");
  }
  if (!dbInstance) {
    dbInstance = neon(process.env.DATABASE_URL);
  }
  return dbInstance;
}

// Retry wrapper for database operations with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isRetryable = error instanceof Error &&
        (error.message.includes("fetch failed") ||
         error.message.includes("ECONNRESET") ||
         error.message.includes("socket disconnected"));

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// Helper to ensure integer values
function toInt(value: number | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  return Math.round(Number(value));
}

// Bot detection patterns
const BOT_PATTERNS = [
  // Search engines
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i, /yandexbot/i,
  // Social media
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i, /pinterest/i, /slackbot/i, /discordbot/i,
  // Tools & libraries
  /python-requests/i, /python-urllib/i, /curl/i, /wget/i, /scrapy/i, /httpx/i,
  /node-fetch/i, /axios/i, /go-http-client/i, /java/i, /ruby/i, /perl/i,
  // Generic bots
  /bot/i, /crawler/i, /spider/i, /scraper/i, /headless/i, /phantom/i, /selenium/i,
  // Monitoring & SEO
  /uptimerobot/i, /pingdom/i, /ahrefsbot/i, /semrushbot/i, /mj12bot/i, /dotbot/i,
  // Preview generators
  /prerender/i, /lighthouse/i, /pagespeed/i,
];

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim() === "") return true; // Empty UA = likely bot
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// Initialize table if it doesn't exist
export async function initDB() {
  await getDb()`
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
      created_at TIMESTAMP DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      country TEXT
    )
  `;

  // Create visitors table
  await getDb()`
    CREATE TABLE IF NOT EXISTS ragecheck_visitors (
      id SERIAL PRIMARY KEY,
      ip_address TEXT,
      user_agent TEXT,
      country TEXT,
      referrer TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add columns if they don't exist (for existing tables)
  try {
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS ip_address TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS user_agent TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS country TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE`;
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE`;
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS page_path TEXT`;
  } catch {
    // Columns may already exist
  }
}

export interface AnalysisLog {
  url: string;
  sourceDomain?: string;
  platform?: string;
  score?: number;
  label?: string;
  llmEnhanced?: boolean;
  // New 5-bar model signal breakdown
  signalBreakdown?: {
    arousal: number;
    enemy_construction: number;
    moral_condemnation: number;
    simplification: number;
    call_to_conflict: number;
  };
  success: boolean;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
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
    const isBotUser = isBot(data.userAgent);

    // Map new 5-bar model to database columns (keeping old column names for backwards compat)
    // arousal -> signal_loaded_language (emotional intensity)
    // enemy_construction -> signal_us_vs_them (othering/division)
    // moral_condemnation -> signal_threat_panic (moral outrage)
    // simplification -> signal_absolutist (black-and-white thinking)
    // call_to_conflict -> signal_engagement_bait (engagement tactics)

    await withRetry(async () => {
      await getDb()`
        INSERT INTO ragecheck_analyses (
          url, source_domain, platform, score, label, llm_enhanced,
          signal_loaded_language, signal_absolutist, signal_threat_panic,
          signal_us_vs_them, signal_engagement_bait, success, error,
          ip_address, user_agent, country, is_bot
        ) VALUES (
          ${data.url},
          ${data.sourceDomain || null},
          ${platform},
          ${toInt(data.score)},
          ${data.label || null},
          ${data.llmEnhanced || false},
          ${toInt(data.signalBreakdown?.arousal)},
          ${toInt(data.signalBreakdown?.simplification)},
          ${toInt(data.signalBreakdown?.moral_condemnation)},
          ${toInt(data.signalBreakdown?.enemy_construction)},
          ${toInt(data.signalBreakdown?.call_to_conflict)},
          ${data.success},
          ${data.error || null},
          ${data.ipAddress || null},
          ${data.userAgent || null},
          ${data.country || null},
          ${isBotUser}
        )
      `;
    });
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
  botStats: {
    totalBots: number;
    totalHumans: number;
    botRate: number;
  };
  recentAnalyses: {
    url: string;
    sourceDomain: string;
    score: number;
    label: string;
    createdAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    country: string | null;
    isBot: boolean;
  }[];
  topUsers: {
    ipAddress: string;
    country: string | null;
    analysisCount: number;
    avgScore: number;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Total counts
  const [totalResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses`;
  const [todayResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE created_at > NOW() - INTERVAL '1 day'`;
  const [weekResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE created_at > NOW() - INTERVAL '7 days'`;

  // Average score
  const [avgResult] = await getDb()`SELECT AVG(score) as avg FROM ragecheck_analyses WHERE score IS NOT NULL`;

  // Score distribution
  const [lowCount] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE score IS NOT NULL AND score <= 33`;
  const [medCount] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE score IS NOT NULL AND score > 33 AND score <= 66`;
  const [highCount] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE score IS NOT NULL AND score > 66`;

  // Platform breakdown
  const platformRows = await getDb()`SELECT platform, COUNT(*) as count FROM ragecheck_analyses GROUP BY platform`;
  const platformBreakdown: Record<string, number> = {};
  for (const row of platformRows) {
    platformBreakdown[row.platform || "unknown"] = Number(row.count);
  }

  // Top domains
  const topDomainRows = await getDb()`
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
  const [signalAvgs] = await getDb()`
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
  const [successResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE success = true`;
  const successRate = totalResult.count > 0 ? (Number(successResult.count) / Number(totalResult.count)) * 100 : 0;

  // LLM enhanced rate
  const [llmResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE llm_enhanced = true`;
  const llmEnhancedRate = totalResult.count > 0 ? (Number(llmResult.count) / Number(totalResult.count)) * 100 : 0;

  // Bot stats
  const [botCount] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = true`;
  const totalBots = Number(botCount?.count || 0);
  const totalHumans = Number(totalResult.count) - totalBots;
  const botRate = totalResult.count > 0 ? (totalBots / Number(totalResult.count)) * 100 : 0;

  // Recent analyses
  const recentRows = await getDb()`
    SELECT url, source_domain, score, label, created_at, success, ip_address, user_agent, country, is_bot
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
    ipAddress: row.ip_address || null,
    userAgent: row.user_agent || null,
    country: row.country || null,
    isBot: row.is_bot || false,
  }));

  // Top users by analysis count
  const topUserRows = await getDb()`
    SELECT ip_address, country, COUNT(*) as analysis_count, AVG(score) as avg_score
    FROM ragecheck_analyses
    WHERE ip_address IS NOT NULL
    GROUP BY ip_address, country
    ORDER BY analysis_count DESC
    LIMIT 15
  `;
  const topUsers = topUserRows.map((row) => ({
    ipAddress: row.ip_address,
    country: row.country || null,
    analysisCount: Number(row.analysis_count),
    avgScore: Math.round(Number(row.avg_score) || 0),
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
    botStats: {
      totalBots,
      totalHumans,
      botRate: Math.round(botRate),
    },
    recentAnalyses,
    topUsers,
  };
}

export async function isDBAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await getDb()`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Cached analysis result
export interface CachedAnalysis {
  url: string;
  sourceDomain: string;
  score: number;
  label: string;
  llmEnhanced: boolean;
  signalBreakdown: {
    arousal: number;
    enemy_construction: number;
    moral_condemnation: number;
    simplification: number;
    call_to_conflict: number;
  };
  createdAt: Date;
}

// Get cached analysis for a URL (within last 24 hours)
export async function getCachedAnalysis(url: string): Promise<CachedAnalysis | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    const result = await withRetry(async () => {
      const [row] = await getDb()`
        SELECT
          url, source_domain, score, label, llm_enhanced,
          signal_loaded_language, signal_absolutist, signal_threat_panic,
          signal_us_vs_them, signal_engagement_bait, created_at
        FROM ragecheck_analyses
        WHERE url = ${url}
          AND success = true
          AND score IS NOT NULL
          AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      return row;
    });

    if (result) {
      return {
        url: result.url,
        sourceDomain: result.source_domain || "unknown",
        score: Number(result.score),
        label: result.label || "Medium",
        llmEnhanced: result.llm_enhanced || false,
        signalBreakdown: {
          arousal: Number(result.signal_loaded_language) || 0,
          enemy_construction: Number(result.signal_us_vs_them) || 0,
          moral_condemnation: Number(result.signal_threat_panic) || 0,
          simplification: Number(result.signal_absolutist) || 0,
          call_to_conflict: Number(result.signal_engagement_bait) || 0,
        },
        createdAt: result.created_at,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get cached analysis:", error);
    return null;
  }
}

export interface VisitorLog {
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  referrer?: string;
  pagePath?: string;
}

export async function logVisitor(data: VisitorLog) {
  try {
    const isBotUser = isBot(data.userAgent);
    await withRetry(async () => {
      await getDb()`
        INSERT INTO ragecheck_visitors (ip_address, user_agent, country, referrer, is_bot, page_path)
        VALUES (${data.ipAddress || null}, ${data.userAgent || null}, ${data.country || null}, ${data.referrer || null}, ${isBotUser}, ${data.pagePath || null})
      `;
    });
  } catch (error) {
    console.error("Failed to log visitor:", error);
  }
}

export interface VisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  weekVisitors: number;
  conversionRate: number;
  recentVisitors: {
    ipAddress: string | null;
    country: string | null;
    referrer: string | null;
    createdAt: Date;
    isBot: boolean;
  }[];
  timeSeries: {
    date: string;
    visitors: number;
    analyses: number;
  }[];
  realtimeSeries: {
    time: string;
    visitors: number;
    analyses: number;
  }[];
}

// Clearview cache storage
export interface ClearviewStory {
  id: string;
  topic: string;
  summary: string;
  whatHappened: string;
  sources: {
    name: string;
    lean: string;
    title: string;
    url: string;
    framing: string;
    manipulationTechniques: string[];
  }[];
  perspectives: {
    lean: string;
    viewpoint: string;
  }[];
  keyTakeaway: string;
}

export interface ClearviewCache {
  stories: ClearviewStory[];
  generatedAt: string;
}

export async function initClearviewTable() {
  try {
    await getDb()`
      CREATE TABLE IF NOT EXISTS ragecheck_clearview (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        generated_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (error) {
    console.error("Failed to create clearview table:", error);
  }
}

export async function saveClearviewData(stories: ClearviewStory[]): Promise<void> {
  try {
    const data = JSON.stringify({ stories });
    const generatedAt = new Date().toISOString();

    await withRetry(async () => {
      // Delete old entries (keep only the latest)
      await getDb()`DELETE FROM ragecheck_clearview WHERE generated_at < NOW() - INTERVAL '1 day'`;

      // Insert new entry
      await getDb()`
        INSERT INTO ragecheck_clearview (data, generated_at)
        VALUES (${data}::jsonb, ${generatedAt})
      `;
    });
  } catch (error) {
    console.error("Failed to save clearview data:", error);
  }
}

export async function getClearviewData(maxAgeHours: number = 4): Promise<ClearviewCache | null> {
  try {
    // Calculate the cutoff time
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

    const result = await withRetry(async () => {
      const [row] = await getDb()`
        SELECT data, generated_at
        FROM ragecheck_clearview
        WHERE generated_at > ${cutoffTime}
        ORDER BY generated_at DESC
        LIMIT 1
      `;
      return row;
    });

    if (result) {
      const data = typeof result.data === "string" ? JSON.parse(result.data) : result.data;
      return {
        stories: data.stories || [],
        generatedAt: result.generated_at.toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get clearview data:", error);
    return null;
  }
}

export async function getVisitorStats(): Promise<VisitorStats> {
  try {
    const [totalResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors`;
    const [todayResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE created_at > NOW() - INTERVAL '1 day'`;
    const [weekResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE created_at > NOW() - INTERVAL '7 days'`;

    const [analysesToday] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE created_at > NOW() - INTERVAL '1 day'`;

    const conversionRate = Number(todayResult.count) > 0
      ? (Number(analysesToday.count) / Number(todayResult.count)) * 100
      : 0;

    const recentRows = await getDb()`
      SELECT ip_address, country, referrer, created_at, is_bot
      FROM ragecheck_visitors
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const recentVisitors = recentRows.map((row) => ({
      ipAddress: row.ip_address || null,
      country: row.country || null,
      referrer: row.referrer || null,
      createdAt: row.created_at,
      isBot: row.is_bot || false,
    }));

    // Time series for last 14 days
    const visitorTimeSeries = await getDb()`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ragecheck_visitors
      WHERE created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const analysisTimeSeries = await getDb()`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ragecheck_analyses
      WHERE created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Merge into single time series
    const dateMap = new Map<string, { visitors: number; analyses: number }>();

    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dateMap.set(dateStr, { visitors: 0, analyses: 0 });
    }

    for (const row of visitorTimeSeries) {
      const dateStr = new Date(row.date).toISOString().split("T")[0];
      const existing = dateMap.get(dateStr) || { visitors: 0, analyses: 0 };
      existing.visitors = Number(row.count);
      dateMap.set(dateStr, existing);
    }

    for (const row of analysisTimeSeries) {
      const dateStr = new Date(row.date).toISOString().split("T")[0];
      const existing = dateMap.get(dateStr) || { visitors: 0, analyses: 0 };
      existing.analyses = Number(row.count);
      dateMap.set(dateStr, existing);
    }

    const timeSeries = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    // Realtime series - 30 minute buckets for last 24 hours
    const visitorRealtime = await getDb()`
      SELECT
        date_trunc('hour', created_at) +
        (floor(extract(minute FROM created_at) / 30) * interval '30 minutes') as bucket,
        COUNT(*) as count
      FROM ragecheck_visitors
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const analysisRealtime = await getDb()`
      SELECT
        date_trunc('hour', created_at) +
        (floor(extract(minute FROM created_at) / 30) * interval '30 minutes') as bucket,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    // Merge realtime data into 30-minute buckets
    const realtimeMap = new Map<string, { visitors: number; analyses: number }>();

    // Initialize last 24 hours in 30-minute intervals (48 buckets, excluding current incomplete bucket)
    const now = new Date();
    // Round down to current 30-min bucket start
    now.setMinutes(Math.floor(now.getMinutes() / 30) * 30, 0, 0);
    for (let i = 48; i >= 1; i--) {
      const d = new Date(now.getTime() - i * 30 * 60 * 1000);
      const timeStr = d.toISOString();
      realtimeMap.set(timeStr, { visitors: 0, analyses: 0 });
    }

    for (const row of visitorRealtime) {
      const timeStr = new Date(row.bucket).toISOString();
      const existing = realtimeMap.get(timeStr) || { visitors: 0, analyses: 0 };
      existing.visitors = Number(row.count);
      realtimeMap.set(timeStr, existing);
    }

    for (const row of analysisRealtime) {
      const timeStr = new Date(row.bucket).toISOString();
      const existing = realtimeMap.get(timeStr) || { visitors: 0, analyses: 0 };
      existing.analyses = Number(row.count);
      realtimeMap.set(timeStr, existing);
    }

    const realtimeSeries = Array.from(realtimeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, data]) => ({ time, ...data }));

    return {
      totalVisitors: Number(totalResult.count),
      todayVisitors: Number(todayResult.count),
      weekVisitors: Number(weekResult.count),
      conversionRate: Math.round(conversionRate),
      recentVisitors,
      timeSeries,
      realtimeSeries,
    };
  } catch (error) {
    console.error("Failed to get visitor stats:", error);
    return {
      totalVisitors: 0,
      todayVisitors: 0,
      weekVisitors: 0,
      conversionRate: 0,
      recentVisitors: [],
      timeSeries: [],
      realtimeSeries: [],
    };
  }
}

export interface PageVisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  weekVisitors: number;
  realtimeSeries: {
    time: string;
    visitors: number;
  }[];
  timeSeries: {
    date: string;
    visitors: number;
  }[];
}

export async function getPageVisitorStats(pagePath: string): Promise<PageVisitorStats> {
  try {
    const [totalResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE page_path = ${pagePath}`;
    const [todayResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE page_path = ${pagePath} AND created_at > NOW() - INTERVAL '1 day'`;
    const [weekResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE page_path = ${pagePath} AND created_at > NOW() - INTERVAL '7 days'`;

    // Realtime series - 30 minute buckets for last 24 hours
    const visitorRealtime = await getDb()`
      SELECT
        date_trunc('hour', created_at) +
        (floor(extract(minute FROM created_at) / 30) * interval '30 minutes') as bucket,
        COUNT(*) as count
      FROM ragecheck_visitors
      WHERE page_path = ${pagePath} AND created_at > NOW() - INTERVAL '24 hours'
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    // Merge realtime data into 30-minute buckets (excluding current incomplete bucket)
    const realtimeMap = new Map<string, number>();
    const now = new Date();
    // Round down to current 30-min bucket start
    now.setMinutes(Math.floor(now.getMinutes() / 30) * 30, 0, 0);
    for (let i = 48; i >= 1; i--) {
      const d = new Date(now.getTime() - i * 30 * 60 * 1000);
      realtimeMap.set(d.toISOString(), 0);
    }

    for (const row of visitorRealtime) {
      const timeStr = new Date(row.bucket).toISOString();
      realtimeMap.set(timeStr, Number(row.count));
    }

    const realtimeSeries = Array.from(realtimeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, visitors]) => ({ time, visitors }));

    // Daily time series for last 14 days
    const dailyData = await getDb()`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ragecheck_visitors
      WHERE page_path = ${pagePath} AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const dateMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateMap.set(d.toISOString().split("T")[0], 0);
    }

    for (const row of dailyData) {
      const dateStr = new Date(row.date).toISOString().split("T")[0];
      dateMap.set(dateStr, Number(row.count));
    }

    const timeSeries = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, visitors]) => ({ date, visitors }));

    return {
      totalVisitors: Number(totalResult.count),
      todayVisitors: Number(todayResult.count),
      weekVisitors: Number(weekResult.count),
      realtimeSeries,
      timeSeries,
    };
  } catch (error) {
    console.error("Failed to get page visitor stats:", error);
    return {
      totalVisitors: 0,
      todayVisitors: 0,
      weekVisitors: 0,
      realtimeSeries: [],
      timeSeries: [],
    };
  }
}

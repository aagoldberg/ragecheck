import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Helper to detect device type from user agent
function getDeviceType(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|opera mobi/i.test(ua)) return "mobile";
  return "desktop";
}

// Helper to detect OS from user agent
function getOS(userAgent: string | null): "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "Other" {
  if (!userAgent) return "Other";
  const ua = userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Linux|CrOS/i.test(ua)) return "Linux";
  return "Other";
}

// Helper to detect browser from user agent
function getBrowser(userAgent: string | null): "Chrome" | "Safari" | "Firefox" | "Edge" | "Other" {
  if (!userAgent) return "Other";
  const ua = userAgent;
  // Order matters - Edge contains Chrome, Chrome contains Safari
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Firefox/i.test(ua)) return "Firefox";
  return "Other";
}

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
  if (BOT_PATTERNS.some((pattern) => pattern.test(userAgent))) return true;

  // If both OS and Browser are "Other", it's likely a bot with a fake/minimal user agent
  const os = getOS(userAgent);
  const browser = getBrowser(userAgent);
  if (os === "Other" && browser === "Other") return true;

  return false;
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

  // Share events table for viral tracking
  await getDb()`
    CREATE TABLE IF NOT EXISTS ragecheck_shares (
      id SERIAL PRIMARY KEY,
      url TEXT,
      share_type TEXT,
      ip_address TEXT,
      referrer_code TEXT,
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
    // Add columns for full analysis caching
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS title TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS reasons JSONB`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS highlights JSONB`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS context_notes TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS text_preview TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS sharing_patterns JSONB`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS technique_explanations JSONB`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS share_card_summary TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS failed_image_url TEXT`;
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
  // Full analysis data for caching
  title?: string;
  reasons?: string[];
  highlights?: { start: number; end: number; category: string; text: string }[];
  contextNotes?: string;
  textPreview?: string;
  sharingPatterns?: string[];
  techniqueExplanations?: string[];
  shareCardSummary?: string;
  failedImageUrl?: string;
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
          ip_address, user_agent, country, is_bot,
          title, reasons, highlights, context_notes, text_preview,
          sharing_patterns, technique_explanations, share_card_summary, failed_image_url
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
          ${isBotUser},
          ${data.title || null},
          ${data.reasons ? JSON.stringify(data.reasons) : null},
          ${data.highlights ? JSON.stringify(data.highlights) : null},
          ${data.contextNotes || null},
          ${data.textPreview || null},
          ${data.sharingPatterns ? JSON.stringify(data.sharingPatterns) : null},
          ${data.techniqueExplanations ? JSON.stringify(data.techniqueExplanations) : null},
          ${data.shareCardSummary || null},
          ${data.failedImageUrl || null}
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
    platform: string;
    score: number;
    label: string;
    llmEnhanced: boolean;
    signals: {
      loadedLanguage: number;
      absolutist: number;
      threatPanic: number;
      usVsThem: number;
      engagementBait: number;
    };
    success: boolean;
    error: string | null;
    title: string | null;
    createdAt: Date;
    ipAddress: string | null;
    country: string | null;
    isBot: boolean;
    device: "mobile" | "tablet" | "desktop";
    shared: boolean;
  }[];
  topUsers: {
    ipAddress: string;
    country: string | null;
    analysisCount: number;
    avgScore: number;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Total counts (excluding bots)
  // Use EST timezone for "today" calculations
  const [totalResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false`;
  const [todayResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'`;
  const [weekResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days'`;

  // Average score (excluding bots)
  const [avgResult] = await getDb()`SELECT AVG(score) as avg FROM ragecheck_analyses WHERE is_bot = false AND score IS NOT NULL`;

  // Score distribution (excluding bots)
  const [lowCount] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false AND score IS NOT NULL AND score <= 33`;
  const [medCount] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false AND score IS NOT NULL AND score > 33 AND score <= 66`;
  const [highCount] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false AND score IS NOT NULL AND score > 66`;

  // Platform breakdown (excluding bots)
  const platformRows = await getDb()`SELECT platform, COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false GROUP BY platform`;
  const platformBreakdown: Record<string, number> = {};
  for (const row of platformRows) {
    platformBreakdown[row.platform || "unknown"] = Number(row.count);
  }

  // Top domains (excluding bots)
  const topDomainRows = await getDb()`
    SELECT source_domain as domain, COUNT(*) as count, AVG(score) as avg_score
    FROM ragecheck_analyses
    WHERE is_bot = false AND source_domain IS NOT NULL
    GROUP BY source_domain
    ORDER BY count DESC
    LIMIT 10
  `;
  const topDomains = topDomainRows.map((row) => ({
    domain: row.domain,
    count: Number(row.count),
    avgScore: Math.round(Number(row.avg_score) || 0),
  }));

  // Signal averages (excluding bots)
  const [signalAvgs] = await getDb()`
    SELECT
      AVG(signal_loaded_language) as loaded_language,
      AVG(signal_absolutist) as absolutist,
      AVG(signal_threat_panic) as threat_panic,
      AVG(signal_us_vs_them) as us_vs_them,
      AVG(signal_engagement_bait) as engagement_bait
    FROM ragecheck_analyses
    WHERE is_bot = false AND score IS NOT NULL
  `;

  // Success rate (excluding bots)
  const [successResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false AND success = true`;
  const successRate = totalResult.count > 0 ? (Number(successResult.count) / Number(totalResult.count)) * 100 : 0;

  // LLM enhanced rate (excluding bots)
  const [llmResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = false AND llm_enhanced = true`;
  const llmEnhancedRate = totalResult.count > 0 ? (Number(llmResult.count) / Number(totalResult.count)) * 100 : 0;

  // Bot stats (count all to show bot totals)
  const [allAnalyses] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses`;
  const [botCount] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_analyses WHERE is_bot = true`;
  const totalBots = Number(botCount?.count || 0);
  const totalHumans = Number(allAnalyses.count) - totalBots;
  const botRate = Number(allAnalyses.count) > 0 ? (totalBots / Number(allAnalyses.count)) * 100 : 0;

  // Recent analyses - include all fields (last 3 days)
  const recentRows = await getDb()`
    SELECT a.url, a.source_domain, a.platform, a.score, a.label, a.llm_enhanced,
           a.signal_loaded_language, a.signal_absolutist, a.signal_threat_panic,
           a.signal_us_vs_them, a.signal_engagement_bait,
           a.success, a.error, a.title, a.created_at, a.ip_address, a.user_agent, a.country, a.is_bot,
           EXISTS (SELECT 1 FROM ragecheck_shares s WHERE s.url = a.url) as shared
    FROM ragecheck_analyses a
    WHERE a.created_at > NOW() - INTERVAL '3 days'
    ORDER BY a.created_at DESC
  `;
  const recentAnalyses = recentRows.map((row) => ({
    url: row.url,
    sourceDomain: row.source_domain || "unknown",
    platform: row.platform || "unknown",
    score: Number(row.score) || 0,
    label: row.label || "Unknown",
    llmEnhanced: row.llm_enhanced || false,
    signals: {
      loadedLanguage: Number(row.signal_loaded_language) || 0,
      absolutist: Number(row.signal_absolutist) || 0,
      threatPanic: Number(row.signal_threat_panic) || 0,
      usVsThem: Number(row.signal_us_vs_them) || 0,
      engagementBait: Number(row.signal_engagement_bait) || 0,
    },
    success: row.success !== false,
    error: row.error || null,
    title: row.title || null,
    createdAt: row.created_at,
    ipAddress: row.ip_address || null,
    country: row.country || null,
    isBot: row.is_bot || false,
    device: getDeviceType(row.user_agent),
    shared: row.shared || false,
  }));

  // Top users by analysis count (excluding bots)
  const topUserRows = await getDb()`
    SELECT ip_address, country, COUNT(*) as analysis_count, AVG(score) as avg_score
    FROM ragecheck_analyses
    WHERE is_bot = false AND ip_address IS NOT NULL
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
  title: string | null;
  reasons: string[];
  highlights: { start: number; end: number; category: string; text: string }[];
  contextNotes: string | null;
  textPreview: string | null;
  sharingPatterns: string[];
  techniqueExplanations: string[];
  shareCardSummary: string | null;
}

// Invalidate incomplete cache entries (those without textPreview)
export async function invalidateIncompleteCache(): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;

  try {
    const result = await withRetry(async () => {
      const res = await getDb()`
        UPDATE ragecheck_analyses
        SET created_at = created_at - INTERVAL '25 hours'
        WHERE success = true
          AND score IS NOT NULL
          AND text_preview IS NULL
          AND created_at > NOW() - INTERVAL '24 hours'
      `;
      return res;
    });
    // postgres.js returns array with count property
    return (result as unknown as { count: number }).count || 0;
  } catch (error) {
    console.error("Failed to invalidate incomplete cache:", error);
    return 0;
  }
}

// Recompute bot flags for all records based on current detection logic
export async function recomputeBotFlags(): Promise<{ analysesUpdated: number; visitorsUpdated: number }> {
  if (!process.env.DATABASE_URL) return { analysesUpdated: 0, visitorsUpdated: 0 };

  try {
    // Get all analyses with user agents
    const analyses = await getDb()`
      SELECT id, user_agent FROM ragecheck_analyses WHERE user_agent IS NOT NULL
    `;

    let analysesUpdated = 0;
    for (const row of analyses) {
      const shouldBeBot = isBot(row.user_agent);
      await getDb()`
        UPDATE ragecheck_analyses SET is_bot = ${shouldBeBot} WHERE id = ${row.id}
      `;
      analysesUpdated++;
    }

    // Get all visitors with user agents
    const visitors = await getDb()`
      SELECT id, user_agent FROM ragecheck_visitors WHERE user_agent IS NOT NULL
    `;

    let visitorsUpdated = 0;
    for (const row of visitors) {
      const shouldBeBot = isBot(row.user_agent);
      await getDb()`
        UPDATE ragecheck_visitors SET is_bot = ${shouldBeBot} WHERE id = ${row.id}
      `;
      visitorsUpdated++;
    }

    return { analysesUpdated, visitorsUpdated };
  } catch (error) {
    console.error("Failed to recompute bot flags:", error);
    return { analysesUpdated: 0, visitorsUpdated: 0 };
  }
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
          signal_us_vs_them, signal_engagement_bait, created_at,
          title, reasons, highlights, context_notes, text_preview,
          sharing_patterns, technique_explanations, share_card_summary
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
      // Parse JSON fields
      let reasons: string[] = [];
      let highlights: { start: number; end: number; category: string; text: string }[] = [];
      let sharingPatterns: string[] = [];
      let techniqueExplanations: string[] = [];

      if (result.reasons) {
        reasons = typeof result.reasons === 'string' ? JSON.parse(result.reasons) : result.reasons;
      }
      if (result.highlights) {
        highlights = typeof result.highlights === 'string' ? JSON.parse(result.highlights) : result.highlights;
      }
      if (result.sharing_patterns) {
        sharingPatterns = typeof result.sharing_patterns === 'string' ? JSON.parse(result.sharing_patterns) : result.sharing_patterns;
      }
      if (result.technique_explanations) {
        techniqueExplanations = typeof result.technique_explanations === 'string' ? JSON.parse(result.technique_explanations) : result.technique_explanations;
      }

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
        title: result.title || null,
        reasons,
        highlights,
        contextNotes: result.context_notes || null,
        textPreview: result.text_preview || null,
        sharingPatterns,
        techniqueExplanations,
        shareCardSummary: result.share_card_summary || null,
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
    pagePath: string;
    device: "mobile" | "tablet" | "desktop";
    os: "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "Other";
    browser: "Chrome" | "Safari" | "Firefox" | "Edge" | "Other";
    createdAt: Date;
    hasLlmAnalysis: boolean;
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
  id?: number;
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
      // Delete old entries (keep 3 days of history)
      await getDb()`DELETE FROM ragecheck_clearview WHERE generated_at < NOW() - INTERVAL '3 days'`;

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
        SELECT id, data, generated_at
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
        id: result.id,
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

export async function getArchivedClearviewData(excludeLatestId?: number): Promise<ClearviewCache[]> {
  try {
    const result = await withRetry(async () => {
      // Get older entries from the past 3 days, excluding the current one
      if (excludeLatestId) {
        return await getDb()`
          SELECT id, data, generated_at
          FROM ragecheck_clearview
          WHERE id != ${excludeLatestId}
          ORDER BY generated_at DESC
          LIMIT 5
        `;
      }
      return await getDb()`
        SELECT id, data, generated_at
        FROM ragecheck_clearview
        ORDER BY generated_at DESC
        OFFSET 1
        LIMIT 5
      `;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.map((row: any) => {
      const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      return {
        stories: data.stories || [],
        generatedAt: row.generated_at.toISOString(),
      };
    });
  } catch (error) {
    console.error("Failed to get archived clearview data:", error);
    return [];
  }
}

export async function getVisitorStats(): Promise<VisitorStats> {
  try {
    // Use EST timezone for "today" calculations
    const estTodayStart = `DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'`;

    // Exclude bots from visitor counts
    const [totalResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE is_bot = false`;
    const [todayResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE is_bot = false AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'`;
    const [weekResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days'`;

    // True conversion rate: unique visitors who performed at least one analysis (today in EST)
    const [uniqueVisitorsToday] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count
      FROM ragecheck_visitors
      WHERE is_bot = false
        AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'
        AND ip_address IS NOT NULL
    `;

    const [convertedVisitors] = await getDb()`
      SELECT COUNT(DISTINCT v.ip_address) as count
      FROM ragecheck_visitors v
      WHERE v.is_bot = false
        AND v.created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'
        AND v.ip_address IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM ragecheck_analyses a
          WHERE a.ip_address = v.ip_address
            AND a.is_bot = false
            AND a.created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'
        )
    `;

    const conversionRate = Number(uniqueVisitorsToday.count) > 0
      ? (Number(convertedVisitors.count) / Number(uniqueVisitorsToday.count)) * 100
      : 0;

    const recentRows = await getDb()`
      SELECT v.ip_address, v.user_agent, v.country, v.referrer, v.page_path, v.created_at, v.is_bot,
             EXISTS (
               SELECT 1 FROM ragecheck_analyses a
               WHERE a.ip_address = v.ip_address AND a.llm_enhanced = true
             ) as has_llm_analysis
      FROM ragecheck_visitors v
      WHERE v.created_at > NOW() - INTERVAL '3 days'
      ORDER BY v.created_at DESC
    `;

    const recentVisitors = recentRows.map((row) => ({
      ipAddress: row.ip_address || null,
      country: row.country || null,
      referrer: row.referrer || null,
      pagePath: row.page_path || "/",
      device: getDeviceType(row.user_agent),
      os: getOS(row.user_agent),
      browser: getBrowser(row.user_agent),
      createdAt: row.created_at,
      hasLlmAnalysis: row.has_llm_analysis || false,
      isBot: row.is_bot || false,
    }));

    // Time series for last 14 days (grouped by EST date, excluding bots)
    const visitorTimeSeries = await getDb()`
      SELECT DATE(created_at AT TIME ZONE 'America/New_York') as date, COUNT(*) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY date ASC
    `;

    const analysisTimeSeries = await getDb()`
      SELECT DATE(created_at AT TIME ZONE 'America/New_York') as date, COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY date ASC
    `;

    // Merge into single time series
    const dateMap = new Map<string, { visitors: number; analyses: number }>();

    // Initialize last 14 complete days (excluding today which is incomplete)
    for (let i = 14; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dateMap.set(dateStr, { visitors: 0, analyses: 0 });
    }

    for (const row of visitorTimeSeries) {
      // Handle date without timezone conversion issues
      const d = new Date(row.date);
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const existing = dateMap.get(dateStr) || { visitors: 0, analyses: 0 };
      existing.visitors = Number(row.count);
      dateMap.set(dateStr, existing);
    }

    for (const row of analysisTimeSeries) {
      // Handle date without timezone conversion issues
      const d = new Date(row.date);
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const existing = dateMap.get(dateStr) || { visitors: 0, analyses: 0 };
      existing.analyses = Number(row.count);
      dateMap.set(dateStr, existing);
    }

    const timeSeries = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    // Realtime series - 30 minute buckets for last 3 days (72 hours), excluding bots
    const visitorRealtime = await getDb()`
      SELECT
        date_trunc('hour', created_at) +
        (floor(extract(minute FROM created_at) / 30) * interval '30 minutes') as bucket,
        COUNT(*) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '72 hours'
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const analysisRealtime = await getDb()`
      SELECT
        date_trunc('hour', created_at) +
        (floor(extract(minute FROM created_at) / 30) * interval '30 minutes') as bucket,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '72 hours'
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    // Merge realtime data into 30-minute buckets
    const realtimeMap = new Map<string, { visitors: number; analyses: number }>();

    // Initialize last 3 days (72 hours) in 30-minute intervals (144 buckets, excluding current incomplete bucket)
    const now = new Date();
    // Round down to current 30-min bucket start
    now.setMinutes(Math.floor(now.getMinutes() / 30) * 30, 0, 0);
    for (let i = 144; i >= 1; i--) {
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
    // Use EST timezone for "today" calculations, excluding bots
    const [totalResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE is_bot = false AND page_path = ${pagePath}`;
    const [todayResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE is_bot = false AND page_path = ${pagePath} AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'`;
    const [weekResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_visitors WHERE is_bot = false AND page_path = ${pagePath} AND created_at > NOW() - INTERVAL '7 days'`;

    // Realtime series - 30 minute buckets for last 24 hours (excluding bots)
    const visitorRealtime = await getDb()`
      SELECT
        date_trunc('hour', created_at) +
        (floor(extract(minute FROM created_at) / 30) * interval '30 minutes') as bucket,
        COUNT(*) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND page_path = ${pagePath} AND created_at > NOW() - INTERVAL '24 hours'
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

    // Daily time series for last 14 days (grouped by EST date, excluding bots)
    const dailyData = await getDb()`
      SELECT DATE(created_at AT TIME ZONE 'America/New_York') as date, COUNT(*) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND page_path = ${pagePath} AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY date ASC
    `;

    const dateMap = new Map<string, number>();
    // Exclude today (incomplete)
    for (let i = 14; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateMap.set(d.toISOString().split("T")[0], 0);
    }

    for (const row of dailyData) {
      // Handle date without timezone conversion issues
      const d = new Date(row.date);
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
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

// ============================================
// SHARE TRACKING & VIRAL METRICS
// ============================================

export interface ShareLog {
  url: string;
  shareType: "copy_link" | "share_button" | "twitter" | "facebook" | "other";
  ipAddress?: string;
  referrerCode?: string;
}

export async function logShare(data: ShareLog) {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO ragecheck_shares (url, share_type, ip_address, referrer_code)
        VALUES (${data.url}, ${data.shareType}, ${data.ipAddress || null}, ${data.referrerCode || null})
      `;
    });
  } catch (error) {
    console.error("Failed to log share:", error);
  }
}

export interface ViralMetrics {
  // Repeat users (return visitors)
  repeatUsers: number;
  repeatRate: number; // % of users who return
  avgVisitsPerUser: number;

  // Share metrics
  totalShares: number;
  uniqueSharers: number;
  todayShares: number;
  todayUniqueSharers: number;
  shareRate: number; // shares / analyses

  // Viral coefficient approximation
  kFactor: number;

  // Traffic baseline comparison
  trafficVsBaseline: number; // current vs 7-day avg
  isSpike: boolean;

  // Referral breakdown
  referralSources: { source: string; count: number }[];

  // 7-day trends for sparklines
  trends: {
    visitors: number[];       // Daily unique visitors
    shares: number[];         // Daily shares
    repeatVisitors: number[]; // Daily repeat visitors
    repeatRate: number[];     // Daily repeat rate percentage
    analyses: number[];       // Daily analyses
    kFactor: number[];        // Daily K-factor approximation
    trafficRatio: number[];   // Daily traffic vs 7-day avg
  };
}

// ============================================
// FEEDBACK TRACKING
// ============================================

export interface FeedbackLog {
  url: string;
  rating: "up" | "down";
  comment: string | null;
  score: number;
  title: string;
  sourceDomain: string;
  signalBreakdown: Record<string, number>;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  referrer?: string;
}

export async function initFeedbackTable() {
  try {
    await getDb()`
      CREATE TABLE IF NOT EXISTS ragecheck_feedback (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        rating TEXT NOT NULL,
        comment TEXT,
        score INTEGER,
        title TEXT,
        source_domain TEXT,
        signal_breakdown JSONB,
        ip_address TEXT,
        user_agent TEXT,
        country TEXT,
        referrer TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    // Add columns if they don't exist (for existing tables)
    await getDb()`ALTER TABLE ragecheck_feedback ADD COLUMN IF NOT EXISTS country TEXT`;
    await getDb()`ALTER TABLE ragecheck_feedback ADD COLUMN IF NOT EXISTS referrer TEXT`;
  } catch (error) {
    console.error("Failed to create feedback table:", error);
  }
}

export async function logFeedback(data: FeedbackLog) {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO ragecheck_feedback (
          url, rating, comment, score, title, source_domain,
          signal_breakdown, ip_address, user_agent, country, referrer
        ) VALUES (
          ${data.url},
          ${data.rating},
          ${data.comment},
          ${data.score},
          ${data.title},
          ${data.sourceDomain},
          ${JSON.stringify(data.signalBreakdown)}::jsonb,
          ${data.ipAddress || null},
          ${data.userAgent || null},
          ${data.country || null},
          ${data.referrer || null}
        )
      `;
    });
  } catch (error) {
    console.error("Failed to log feedback:", error);
  }
}

export interface FeedbackStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  positiveRate: number;
  recentFeedback: {
    url: string;
    rating: string;
    comment: string | null;
    score: number;
    sourceDomain: string | null;
    createdAt: Date;
  }[];
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    const [totalResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_feedback`;
    const [positiveResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_feedback WHERE rating = 'up'`;
    const [negativeResult] = await getDb()`SELECT COUNT(*) as count FROM ragecheck_feedback WHERE rating = 'down'`;

    const recentRows = await getDb()`
      SELECT url, rating, comment, score, source_domain, created_at
      FROM ragecheck_feedback
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const total = Number(totalResult.count) || 0;
    const positive = Number(positiveResult.count) || 0;

    return {
      totalFeedback: total,
      positiveCount: positive,
      negativeCount: Number(negativeResult.count) || 0,
      positiveRate: total > 0 ? Math.round((positive / total) * 100) : 0,
      recentFeedback: recentRows.map((row) => ({
        url: row.url,
        rating: row.rating,
        comment: row.comment,
        score: Number(row.score),
        sourceDomain: row.source_domain || null,
        createdAt: row.created_at,
      })),
    };
  } catch (error) {
    console.error("Failed to get feedback stats:", error);
    return {
      totalFeedback: 0,
      positiveCount: 0,
      negativeCount: 0,
      positiveRate: 0,
      recentFeedback: [],
    };
  }
}

export async function getViralMetrics(): Promise<ViralMetrics> {
  try {
    // Repeat users: visitors who came on 2+ different days (excluding bots)
    const repeatUserResult = await getDb()`
      SELECT COUNT(*) as count FROM (
        SELECT ip_address
        FROM ragecheck_visitors
        WHERE is_bot = false AND ip_address IS NOT NULL
        GROUP BY ip_address
        HAVING COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/New_York')) >= 2
      ) as repeat_users
    `;

    // Total unique users (excluding bots)
    const [uniqueUsersResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND ip_address IS NOT NULL
    `;

    // Average visits per user (by EST date, excluding bots)
    const [avgVisitsResult] = await getDb()`
      SELECT AVG(visit_count) as avg FROM (
        SELECT ip_address, COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/New_York')) as visit_count
        FROM ragecheck_visitors
        WHERE is_bot = false AND ip_address IS NOT NULL
        GROUP BY ip_address
      ) as user_visits
    `;

    // Share counts (total and unique by IP) - shares are human-initiated so no bot filter needed
    const [totalSharesResult] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_shares
    `;

    const [uniqueSharersResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count FROM ragecheck_shares
      WHERE ip_address IS NOT NULL
    `;

    // Use EST timezone for "today" calculations
    const [todaySharesResult] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_shares
      WHERE created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'
    `;

    const [todayUniqueSharersResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count FROM ragecheck_shares
      WHERE created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York' AND ip_address IS NOT NULL
    `;

    // Unique users for share rate calculation (unique sharers / unique analyzers, excluding bots)
    const [weekUniqueAnalyzersResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days' AND success = true AND ip_address IS NOT NULL
    `;

    const [weekUniqueSharersResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count FROM ragecheck_shares
      WHERE created_at > NOW() - INTERVAL '7 days' AND ip_address IS NOT NULL
    `;

    // Traffic baseline comparison (today in EST vs 7-day average, excluding bots)
    const [todayVisitorsResult] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_visitors
      WHERE is_bot = false AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'
    `;

    const [avgDailyVisitorsResult] = await getDb()`
      SELECT AVG(daily_count) as avg FROM (
        SELECT DATE(created_at AT TIME ZONE 'America/New_York') as day, COUNT(*) as daily_count
        FROM ragecheck_visitors
        WHERE is_bot = false AND created_at > NOW() - INTERVAL '8 days'
          AND created_at < DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'
        GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ) as daily_visits
    `;

    // Referral sources (external referrers, excluding bots)
    const referralSources = await getDb()`
      SELECT
        CASE
          WHEN referrer LIKE '%twitter%' OR referrer LIKE '%x.com%' THEN 'Twitter/X'
          WHEN referrer LIKE '%facebook%' THEN 'Facebook'
          WHEN referrer LIKE '%reddit%' THEN 'Reddit'
          WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
          WHEN referrer LIKE '%google%' THEN 'Google'
          WHEN referrer LIKE '%t.co%' THEN 'Twitter/X'
          WHEN referrer LIKE '%news.ycombinator%' THEN 'Hacker News'
          WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
          ELSE 'Other'
        END as source,
        COUNT(*) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `;

    // K-factor estimation: (unique sharers / unique users) × (conversion rate from shares)
    const uniqueUsers = Number(uniqueUsersResult.count) || 1;
    const uniqueSharers = Number(uniqueSharersResult.count) || 0;
    const shareRateDecimal = uniqueSharers / uniqueUsers; // What % of users share

    // Estimate conversion from shares (visitors with referrer containing our domain or share params, excluding bots)
    const [referralVisitsResult] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_visitors
      WHERE is_bot = false AND (referrer LIKE '%ragecheck%' OR referrer LIKE '%share%')
    `;
    const referralConversion = uniqueSharers > 0
      ? Number(referralVisitsResult.count) / uniqueSharers
      : 0;

    // K-factor = share rate × referral conversion (how many new users each share brings)
    const kFactor = shareRateDecimal * Math.min(referralConversion, 1);

    // Calculate metrics
    const repeatUsers = Number(repeatUserResult[0]?.count) || 0;
    const repeatRate = uniqueUsers > 0 ? (repeatUsers / uniqueUsers) * 100 : 0;
    const avgVisitsPerUser = Number(avgVisitsResult.avg) || 1;

    // Share rate: what % of users who analyzed also shared (based on unique IPs)
    const weekUniqueAnalyzers = Number(weekUniqueAnalyzersResult.count) || 1;
    const weekUniqueSharers = Number(weekUniqueSharersResult.count) || 0;
    const shareRate = (weekUniqueSharers / weekUniqueAnalyzers) * 100;

    const todayVisitors = Number(todayVisitorsResult.count) || 0;
    const avgDailyVisitors = Number(avgDailyVisitorsResult.avg) || 1;
    const trafficVsBaseline = todayVisitors / avgDailyVisitors;
    const isSpike = trafficVsBaseline > 3; // 3x normal = spike

    // Get 7-day trends for sparklines (grouped by EST date, excluding bots)
    const visitorTrends = await getDb()`
      SELECT DATE(created_at AT TIME ZONE 'America/New_York') as day, COUNT(DISTINCT ip_address) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days' AND ip_address IS NOT NULL
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY day ASC
    `;

    const shareTrends = await getDb()`
      SELECT DATE(created_at AT TIME ZONE 'America/New_York') as day, COUNT(*) as count
      FROM ragecheck_shares
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY day ASC
    `;

    const analysisTrends = await getDb()`
      SELECT DATE(created_at AT TIME ZONE 'America/New_York') as day, COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days' AND success = true
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY day ASC
    `;

    // Repeat visitors per day (visitors who had visited before that day, excluding bots)
    const repeatVisitorTrends = await getDb()`
      SELECT DATE(v.created_at AT TIME ZONE 'America/New_York') as day, COUNT(DISTINCT v.ip_address) as count
      FROM ragecheck_visitors v
      WHERE v.is_bot = false AND v.created_at > NOW() - INTERVAL '7 days'
        AND v.ip_address IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM ragecheck_visitors v2
          WHERE v2.is_bot = false AND v2.ip_address = v.ip_address
            AND DATE(v2.created_at AT TIME ZONE 'America/New_York') < DATE(v.created_at AT TIME ZONE 'America/New_York')
        )
      GROUP BY DATE(v.created_at AT TIME ZONE 'America/New_York')
      ORDER BY day ASC
    `;

    // Build trend arrays (7 days, oldest to newest)
    const trendDates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendDates.push(d.toISOString().split("T")[0]);
    }

    const visitorMap = new Map(visitorTrends.map(r => {
      const d = new Date(r.day);
      return [`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`, Number(r.count)];
    }));
    const shareMap = new Map(shareTrends.map(r => {
      const d = new Date(r.day);
      return [`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`, Number(r.count)];
    }));
    const analysisMap = new Map(analysisTrends.map(r => {
      const d = new Date(r.day);
      return [`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`, Number(r.count)];
    }));
    const repeatMap = new Map(repeatVisitorTrends.map(r => {
      const d = new Date(r.day);
      return [`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`, Number(r.count)];
    }));

    const dailyVisitors = trendDates.map(d => visitorMap.get(d) || 0);
    const dailyShares = trendDates.map(d => shareMap.get(d) || 0);
    const dailyAnalyses = trendDates.map(d => analysisMap.get(d) || 0);
    const dailyRepeatVisitors = trendDates.map(d => repeatMap.get(d) || 0);

    // Calculate daily repeat rate: repeat visitors / total visitors * 100
    const dailyRepeatRate = dailyVisitors.map((visitors, i) => {
      if (visitors === 0) return 0;
      return Math.round((dailyRepeatVisitors[i] / visitors) * 1000) / 10; // e.g., 6.3%
    });

    // Calculate daily K-factor approximation: (sharers/visitors) * estimated conversion
    // Simplified: shares / visitors as a proxy (higher = more viral potential)
    const dailyKFactor = dailyVisitors.map((visitors, i) => {
      if (visitors === 0) return 0;
      const shareRate = dailyShares[i] / visitors;
      // Assume ~0.5 conversion from shares (rough estimate)
      return Math.round(shareRate * 0.5 * 1000) / 1000;
    });

    // Calculate traffic ratio: each day vs overall 7-day average
    const avgDailyTraffic = dailyVisitors.reduce((a, b) => a + b, 0) / 7 || 1;
    const dailyTrafficRatio = dailyVisitors.map(v =>
      Math.round((v / avgDailyTraffic) * 100) / 100
    );

    const trends = {
      visitors: dailyVisitors,
      shares: dailyShares,
      analyses: dailyAnalyses,
      repeatVisitors: dailyRepeatVisitors,
      repeatRate: dailyRepeatRate,
      kFactor: dailyKFactor,
      trafficRatio: dailyTrafficRatio,
    };

    return {
      repeatUsers,
      repeatRate: Math.round(repeatRate * 10) / 10,
      avgVisitsPerUser: Math.round(avgVisitsPerUser * 10) / 10,
      totalShares: Number(totalSharesResult.count) || 0,
      uniqueSharers,
      todayShares: Number(todaySharesResult.count) || 0,
      todayUniqueSharers: Number(todayUniqueSharersResult.count) || 0,
      shareRate: Math.round(shareRate * 10) / 10,
      kFactor: Math.round(kFactor * 1000) / 1000,
      trafficVsBaseline: Math.round(trafficVsBaseline * 100) / 100,
      isSpike,
      referralSources: referralSources.map(r => ({
        source: r.source,
        count: Number(r.count),
      })),
      trends,
    };
  } catch (error) {
    console.error("Failed to get viral metrics:", error);
    return {
      repeatUsers: 0,
      repeatRate: 0,
      avgVisitsPerUser: 0,
      totalShares: 0,
      uniqueSharers: 0,
      todayShares: 0,
      todayUniqueSharers: 0,
      shareRate: 0,
      kFactor: 0,
      trafficVsBaseline: 1,
      isSpike: false,
      referralSources: [],
      trends: { visitors: [], shares: [], analyses: [], repeatVisitors: [], repeatRate: [], kFactor: [], trafficRatio: [] },
    };
  }
}

// Time to Analysis metrics
type StatGroup = {
  avgSeconds: number;
  medianSeconds: number;
  p10Seconds: number;
  p90Seconds: number;
  count: number;
};

export interface TimeToAnalysisMetrics {
  overall: StatGroup;
  byDevice: {
    mobile: StatGroup;
    tablet: StatGroup;
    desktop: StatGroup;
  };
  byOS: {
    iOS: StatGroup;
    Android: StatGroup;
    Windows: StatGroup;
    macOS: StatGroup;
    Linux: StatGroup;
    Other: StatGroup;
  };
}

export async function getTimeToAnalysisMetrics(): Promise<TimeToAnalysisMetrics> {
  try {
    // Get time differences between first visit and first analysis per IP (last 7 days, excluding bots)
    const results = await getDb()`
      WITH visitor_first AS (
        SELECT ip_address, user_agent, MIN(created_at) as first_visit
        FROM ragecheck_visitors
        WHERE is_bot = false
          AND ip_address IS NOT NULL
          AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY ip_address, user_agent
      ),
      analysis_first AS (
        SELECT ip_address, MIN(created_at) as first_analysis
        FROM ragecheck_analyses
        WHERE is_bot = false
          AND ip_address IS NOT NULL
          AND success = true
          AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY ip_address
      )
      SELECT
        v.user_agent,
        EXTRACT(EPOCH FROM (a.first_analysis - v.first_visit)) as seconds_to_analysis
      FROM visitor_first v
      JOIN analysis_first a ON v.ip_address = a.ip_address
      WHERE a.first_analysis >= v.first_visit
        AND a.first_analysis - v.first_visit < INTERVAL '1 hour'
    `;

    // Categorize by device and OS, calculate stats
    const byDevice = { mobile: [] as number[], tablet: [] as number[], desktop: [] as number[] };
    const byOS = { iOS: [] as number[], Android: [] as number[], Windows: [] as number[], macOS: [] as number[], Linux: [] as number[], Other: [] as number[] };

    for (const row of results) {
      const seconds = Number(row.seconds_to_analysis);
      if (seconds < 0 || seconds > 3600) continue; // Skip invalid values

      const device = getDeviceType(row.user_agent);
      const os = getOS(row.user_agent);

      byDevice[device].push(seconds);
      byOS[os].push(seconds);
    }

    const calcStats = (arr: number[]): StatGroup => {
      if (arr.length === 0) return { avgSeconds: 0, medianSeconds: 0, p10Seconds: 0, p90Seconds: 0, count: 0 };
      const sorted = [...arr].sort((a, b) => a - b);
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      const p10Index = Math.floor(sorted.length * 0.1);
      const p50Index = Math.floor(sorted.length * 0.5);
      const p90Index = Math.floor(sorted.length * 0.9);
      return {
        avgSeconds: Math.round(avg),
        medianSeconds: Math.round(sorted[p50Index]),
        p10Seconds: Math.round(sorted[p10Index]),
        p90Seconds: Math.round(sorted[p90Index]),
        count: arr.length,
      };
    };

    const all = [...byDevice.mobile, ...byDevice.tablet, ...byDevice.desktop];

    return {
      overall: calcStats(all),
      byDevice: {
        mobile: calcStats(byDevice.mobile),
        tablet: calcStats(byDevice.tablet),
        desktop: calcStats(byDevice.desktop),
      },
      byOS: {
        iOS: calcStats(byOS.iOS),
        Android: calcStats(byOS.Android),
        Windows: calcStats(byOS.Windows),
        macOS: calcStats(byOS.macOS),
        Linux: calcStats(byOS.Linux),
        Other: calcStats(byOS.Other),
      },
    };
  } catch (error) {
    console.error("Failed to get time-to-analysis metrics:", error);
    const emptyStats: StatGroup = { avgSeconds: 0, medianSeconds: 0, p10Seconds: 0, p90Seconds: 0, count: 0 };
    return {
      overall: emptyStats,
      byDevice: {
        mobile: emptyStats,
        tablet: emptyStats,
        desktop: emptyStats,
      },
      byOS: {
        iOS: emptyStats,
        Android: emptyStats,
        Windows: emptyStats,
        macOS: emptyStats,
        Linux: emptyStats,
        Other: emptyStats,
      },
    };
  }
}

// Conversion rate metrics by device and OS
type ConversionGroup = { visitors: number; converted: number; rate: number };

export interface ConversionMetrics {
  overall: ConversionGroup;
  byDevice: {
    mobile: ConversionGroup;
    tablet: ConversionGroup;
    desktop: ConversionGroup;
  };
  byOS: {
    iOS: ConversionGroup;
    Android: ConversionGroup;
    Windows: ConversionGroup;
    macOS: ConversionGroup;
    Linux: ConversionGroup;
    Other: ConversionGroup;
  };
}

export async function getConversionMetrics(): Promise<ConversionMetrics> {
  try {
    // Get all visitors with their user agent (last 7 days, excluding bots)
    const visitors = await getDb()`
      SELECT ip_address, user_agent
      FROM ragecheck_visitors
      WHERE is_bot = false
        AND ip_address IS NOT NULL
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY ip_address, user_agent
    `;

    // Get all IPs that converted (performed an analysis, excluding bots)
    const convertedIPs = await getDb()`
      SELECT DISTINCT ip_address
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND ip_address IS NOT NULL
        AND success = true
        AND created_at > NOW() - INTERVAL '7 days'
    `;

    const convertedSet = new Set(convertedIPs.map(r => r.ip_address));

    // Count visitors and conversions by device and OS
    const byDevice = {
      mobile: { visitors: 0, converted: 0 },
      tablet: { visitors: 0, converted: 0 },
      desktop: { visitors: 0, converted: 0 },
    };
    const byOS = {
      iOS: { visitors: 0, converted: 0 },
      Android: { visitors: 0, converted: 0 },
      Windows: { visitors: 0, converted: 0 },
      macOS: { visitors: 0, converted: 0 },
      Linux: { visitors: 0, converted: 0 },
      Other: { visitors: 0, converted: 0 },
    };

    for (const row of visitors) {
      const device = getDeviceType(row.user_agent);
      const os = getOS(row.user_agent);
      const converted = convertedSet.has(row.ip_address);

      byDevice[device].visitors++;
      if (converted) byDevice[device].converted++;

      byOS[os].visitors++;
      if (converted) byOS[os].converted++;
    }

    const calcRate = (g: { visitors: number; converted: number }): ConversionGroup => ({
      visitors: g.visitors,
      converted: g.converted,
      rate: g.visitors > 0 ? Math.round((g.converted / g.visitors) * 1000) / 10 : 0,
    });

    const totalVisitors = byDevice.mobile.visitors + byDevice.tablet.visitors + byDevice.desktop.visitors;
    const totalConverted = byDevice.mobile.converted + byDevice.tablet.converted + byDevice.desktop.converted;

    return {
      overall: {
        visitors: totalVisitors,
        converted: totalConverted,
        rate: totalVisitors > 0 ? Math.round((totalConverted / totalVisitors) * 1000) / 10 : 0,
      },
      byDevice: {
        mobile: calcRate(byDevice.mobile),
        tablet: calcRate(byDevice.tablet),
        desktop: calcRate(byDevice.desktop),
      },
      byOS: {
        iOS: calcRate(byOS.iOS),
        Android: calcRate(byOS.Android),
        Windows: calcRate(byOS.Windows),
        macOS: calcRate(byOS.macOS),
        Linux: calcRate(byOS.Linux),
        Other: calcRate(byOS.Other),
      },
    };
  } catch (error) {
    console.error("Failed to get conversion metrics:", error);
    const emptyGroup: ConversionGroup = { visitors: 0, converted: 0, rate: 0 };
    return {
      overall: emptyGroup,
      byDevice: { mobile: emptyGroup, tablet: emptyGroup, desktop: emptyGroup },
      byOS: { iOS: emptyGroup, Android: emptyGroup, Windows: emptyGroup, macOS: emptyGroup, Linux: emptyGroup, Other: emptyGroup },
    };
  }
}

// Conversion insights - analyze why visitors don't convert
type InsightRow = { name: string; visitors: number; converted: number; rate: number };

export interface ConversionInsights {
  byReferrerType: InsightRow[];
  byLandingPage: InsightRow[];
  byCountry: InsightRow[];
  byHourOfDay: InsightRow[];
  byDayOfWeek: InsightRow[];
  summary: {
    totalVisitors: number;
    totalConverted: number;
    overallRate: number;
    bestPerforming: { factor: string; name: string; rate: number } | null;
    worstPerforming: { factor: string; name: string; rate: number } | null;
  };
}

// Categorize referrer into types
function categorizeReferrer(referrer: string | null): string {
  if (!referrer) return "Direct";
  const r = referrer.toLowerCase();
  if (r.includes("google") || r.includes("bing") || r.includes("duckduckgo") || r.includes("yahoo")) return "Search";
  if (r.includes("twitter") || r.includes("x.com") || r.includes("facebook") || r.includes("instagram") || r.includes("linkedin") || r.includes("reddit") || r.includes("threads")) return "Social";
  if (r.includes("t.co")) return "Twitter/X";
  if (r.includes("news.ycombinator") || r.includes("hackernews")) return "Hacker News";
  return "Other";
}

export async function getConversionInsights(): Promise<ConversionInsights> {
  try {
    // Get all visitors with details (last 14 days, exclude bots)
    const visitors = await getDb()`
      SELECT
        v.ip_address,
        v.referrer,
        v.page_path,
        v.country,
        v.user_agent,
        v.created_at,
        EXTRACT(HOUR FROM v.created_at AT TIME ZONE 'America/New_York') as hour_of_day,
        EXTRACT(DOW FROM v.created_at AT TIME ZONE 'America/New_York') as day_of_week
      FROM ragecheck_visitors v
      WHERE v.is_bot = false
        AND v.ip_address IS NOT NULL
        AND v.created_at > NOW() - INTERVAL '14 days'
    `;

    // Get all IPs that converted (exclude bots)
    const convertedIPs = await getDb()`
      SELECT DISTINCT ip_address
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND ip_address IS NOT NULL
        AND success = true
        AND created_at > NOW() - INTERVAL '14 days'
    `;

    const convertedSet = new Set(convertedIPs.map(r => r.ip_address));

    // Aggregate by various dimensions
    const byReferrerType = new Map<string, { visitors: Set<string>; converted: Set<string> }>();
    const byLandingPage = new Map<string, { visitors: Set<string>; converted: Set<string> }>();
    const byCountry = new Map<string, { visitors: Set<string>; converted: Set<string> }>();
    const byHourOfDay = new Map<number, { visitors: Set<string>; converted: Set<string> }>();
    const byDayOfWeek = new Map<number, { visitors: Set<string>; converted: Set<string> }>();

    // Initialize hour and day maps
    for (let h = 0; h < 24; h++) byHourOfDay.set(h, { visitors: new Set(), converted: new Set() });
    for (let d = 0; d < 7; d++) byDayOfWeek.set(d, { visitors: new Set(), converted: new Set() });

    const allVisitors = new Set<string>();
    const allConverted = new Set<string>();

    for (const row of visitors) {
      const ip = row.ip_address;
      const converted = convertedSet.has(ip);

      allVisitors.add(ip);
      if (converted) allConverted.add(ip);

      // By referrer type
      const refType = categorizeReferrer(row.referrer);
      if (!byReferrerType.has(refType)) byReferrerType.set(refType, { visitors: new Set(), converted: new Set() });
      byReferrerType.get(refType)!.visitors.add(ip);
      if (converted) byReferrerType.get(refType)!.converted.add(ip);

      // By landing page
      const page = row.page_path || "/";
      if (!byLandingPage.has(page)) byLandingPage.set(page, { visitors: new Set(), converted: new Set() });
      byLandingPage.get(page)!.visitors.add(ip);
      if (converted) byLandingPage.get(page)!.converted.add(ip);

      // By country
      const country = row.country || "Unknown";
      if (!byCountry.has(country)) byCountry.set(country, { visitors: new Set(), converted: new Set() });
      byCountry.get(country)!.visitors.add(ip);
      if (converted) byCountry.get(country)!.converted.add(ip);

      // By hour
      const hour = Number(row.hour_of_day);
      byHourOfDay.get(hour)!.visitors.add(ip);
      if (converted) byHourOfDay.get(hour)!.converted.add(ip);

      // By day of week
      const dow = Number(row.day_of_week);
      byDayOfWeek.get(dow)!.visitors.add(ip);
      if (converted) byDayOfWeek.get(dow)!.converted.add(ip);
    }

    // Convert maps to sorted arrays
    const toInsightRows = (map: Map<string | number, { visitors: Set<string>; converted: Set<string> }>, nameTransform?: (k: string | number) => string): InsightRow[] => {
      return Array.from(map.entries())
        .map(([key, val]) => ({
          name: nameTransform ? nameTransform(key) : String(key),
          visitors: val.visitors.size,
          converted: val.converted.size,
          rate: val.visitors.size > 0 ? Math.round((val.converted.size / val.visitors.size) * 1000) / 10 : 0,
        }))
        .filter(r => r.visitors >= 5) // Only show with meaningful sample size
        .sort((a, b) => b.visitors - a.visitors);
    };

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hourLabel = (h: number) => {
      const ampm = h >= 12 ? "pm" : "am";
      const hour12 = h % 12 || 12;
      return `${hour12}${ampm}`;
    };

    const referrerRows = toInsightRows(byReferrerType);
    const landingRows = toInsightRows(byLandingPage);
    const countryRows = toInsightRows(byCountry).slice(0, 10); // Top 10 countries
    const hourRows = toInsightRows(byHourOfDay, (h) => hourLabel(Number(h)));
    const dayRows = toInsightRows(byDayOfWeek, (d) => dayNames[Number(d)]);

    // Find best and worst performing factors (with min 10 visitors)
    const allFactors: { factor: string; name: string; rate: number; visitors: number }[] = [
      ...referrerRows.map(r => ({ factor: "Referrer", name: r.name, rate: r.rate, visitors: r.visitors })),
      ...landingRows.map(r => ({ factor: "Landing Page", name: r.name, rate: r.rate, visitors: r.visitors })),
      ...countryRows.map(r => ({ factor: "Country", name: r.name, rate: r.rate, visitors: r.visitors })),
    ].filter(f => f.visitors >= 10);

    const sorted = allFactors.sort((a, b) => b.rate - a.rate);
    const best = sorted.length > 0 ? { factor: sorted[0].factor, name: sorted[0].name, rate: sorted[0].rate } : null;
    const worst = sorted.length > 0 ? { factor: sorted[sorted.length - 1].factor, name: sorted[sorted.length - 1].name, rate: sorted[sorted.length - 1].rate } : null;

    return {
      byReferrerType: referrerRows,
      byLandingPage: landingRows,
      byCountry: countryRows,
      byHourOfDay: hourRows,
      byDayOfWeek: dayRows,
      summary: {
        totalVisitors: allVisitors.size,
        totalConverted: allConverted.size,
        overallRate: allVisitors.size > 0 ? Math.round((allConverted.size / allVisitors.size) * 1000) / 10 : 0,
        bestPerforming: best,
        worstPerforming: worst,
      },
    };
  } catch (error) {
    console.error("Failed to get conversion insights:", error);
    return {
      byReferrerType: [],
      byLandingPage: [],
      byCountry: [],
      byHourOfDay: [],
      byDayOfWeek: [],
      summary: {
        totalVisitors: 0,
        totalConverted: 0,
        overallRate: 0,
        bestPerforming: null,
        worstPerforming: null,
      },
    };
  }
}

// Funnel metrics for conversion visualization
export interface FunnelStep {
  name: string;
  count: number;
  percentage: number; // of total (first step)
  dropoff: number; // percentage that dropped off from previous step
}

interface ConversionTrendPoint {
  date: string;
  visitors: number;
  converted: number;
  rate: number;
}

export interface FunnelMetrics {
  steps: FunnelStep[];
  trend: ConversionTrendPoint[];
  period: string;
}

export async function getFunnelMetrics(): Promise<FunnelMetrics> {
  try {
    await initDB();

    // Get unique visitors (non-bot) in last 7 days
    const [visitorsResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count
      FROM ragecheck_visitors
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
        AND ip_address IS NOT NULL
    `;

    // Get unique visitors who completed at least one analysis (non-bot)
    const [analyzedResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
        AND ip_address IS NOT NULL
        AND success = true
    `;

    // Get unique visitors who shared
    const [sharedResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count
      FROM ragecheck_shares
      WHERE created_at > NOW() - INTERVAL '7 days'
        AND ip_address IS NOT NULL
    `;

    const visitors = Number(visitorsResult?.count || 0);
    const analyzed = Number(analyzedResult?.count || 0);
    const shared = Number(sharedResult?.count || 0);

    const steps: FunnelStep[] = [
      {
        name: "Visited",
        count: visitors,
        percentage: 100,
        dropoff: 0,
      },
      {
        name: "Analyzed",
        count: analyzed,
        percentage: visitors > 0 ? Math.round((analyzed / visitors) * 1000) / 10 : 0,
        dropoff: visitors > 0 ? Math.round(((visitors - analyzed) / visitors) * 1000) / 10 : 0,
      },
      {
        name: "Shared",
        count: shared,
        percentage: visitors > 0 ? Math.round((shared / visitors) * 1000) / 10 : 0,
        dropoff: analyzed > 0 ? Math.round(((analyzed - shared) / analyzed) * 1000) / 10 : 0,
      },
    ];

    // Get daily conversion trend (last 14 days, excluding bots)
    const dailyVisitors = await getDb()`
      SELECT
        DATE(created_at AT TIME ZONE 'America/New_York') as date,
        COUNT(DISTINCT ip_address) as count
      FROM ragecheck_visitors
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '14 days'
        AND ip_address IS NOT NULL
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY date ASC
    `;

    const dailyConverted = await getDb()`
      SELECT
        DATE(created_at AT TIME ZONE 'America/New_York') as date,
        COUNT(DISTINCT ip_address) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '14 days'
        AND ip_address IS NOT NULL
        AND success = true
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY date ASC
    `;

    // Build trend data
    const trendMap = new Map<string, { visitors: number; converted: number }>();

    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap.set(dateStr, { visitors: 0, converted: 0 });
    }

    for (const row of dailyVisitors) {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        trendMap.get(dateStr)!.visitors = Number(row.count);
      }
    }

    for (const row of dailyConverted) {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        trendMap.get(dateStr)!.converted = Number(row.count);
      }
    }

    const trend: ConversionTrendPoint[] = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        visitors: data.visitors,
        converted: data.converted,
        rate: data.visitors > 0 ? Math.round((data.converted / data.visitors) * 1000) / 10 : 0,
      }));

    return {
      steps,
      trend,
      period: "Last 7 days",
    };
  } catch (error) {
    console.error("Failed to get funnel metrics:", error);
    return {
      steps: [],
      trend: [],
      period: "Last 7 days",
    };
  }
}

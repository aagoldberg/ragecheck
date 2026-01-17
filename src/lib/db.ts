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

// Helper to get date string in EST timezone (YYYY-MM-DD format)
// This ensures JS date strings match PostgreSQL DATE(... AT TIME ZONE 'America/New_York')
function getESTDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // en-CA gives YYYY-MM-DD format
}

// Helper to get EST date string from a PostgreSQL date result
// Handles both Date objects and string representations
function parseDBDateToEST(dbDate: Date | string): string {
  if (dbDate instanceof Date) {
    // If it's a Date object, the DB already parsed it - extract the date parts directly
    // PostgreSQL dates come back as midnight UTC, so we use UTC methods
    return `${dbDate.getUTCFullYear()}-${String(dbDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dbDate.getUTCDate()).padStart(2, '0')}`;
  }
  // If it's a string like "2025-01-15", just take the date part
  return String(dbDate).split('T')[0];
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

  // Analysis starts table for tracking abandonment
  await getDb()`
    CREATE TABLE IF NOT EXISTS ragecheck_analysis_starts (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      analysis_type TEXT NOT NULL,
      url TEXT,
      ip_address TEXT,
      user_agent TEXT,
      country TEXT,
      is_bot BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Email subscribers table
  await getDb()`
    CREATE TABLE IF NOT EXISTS ragecheck_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      country TEXT,
      source TEXT DEFAULT 'website',
      subscribed_at TIMESTAMP DEFAULT NOW(),
      unsubscribed_at TIMESTAMP
    )
  `;

  // Add additional columns to shares table for enhanced tracking
  try {
    await getDb()`ALTER TABLE ragecheck_shares ADD COLUMN IF NOT EXISTS score INTEGER`;
    await getDb()`ALTER TABLE ragecheck_shares ADD COLUMN IF NOT EXISTS platform TEXT`;
    await getDb()`ALTER TABLE ragecheck_shares ADD COLUMN IF NOT EXISTS user_agent TEXT`;
  } catch {
    // Columns may already exist
  }

  // Add columns if they don't exist (for existing tables)
  try {
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS ip_address TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS user_agent TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS country TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE`;
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE`;
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS page_path TEXT`;
    // UTM tracking columns for acquisition analysis
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS utm_source TEXT`;
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS utm_medium TEXT`;
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS utm_campaign TEXT`;
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS utm_content TEXT`;
    await getDb()`ALTER TABLE ragecheck_visitors ADD COLUMN IF NOT EXISTS utm_term TEXT`;
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
    // Content categorization columns
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS topic TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS content_type TEXT`;
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS source_type TEXT`;
    // Session correlation for funnel tracking
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS session_id TEXT`;
    await getDb()`CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON ragecheck_analyses(session_id) WHERE session_id IS NOT NULL`;
    // Abandonment tracking
    await getDb()`ALTER TABLE ragecheck_analysis_starts ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ`;
    // Enhanced abandonment diagnostics
    await getDb()`ALTER TABLE ragecheck_analysis_starts ADD COLUMN IF NOT EXISTS abandon_reason TEXT`; // timeout, error, user_close, page_leave
    await getDb()`ALTER TABLE ragecheck_analysis_starts ADD COLUMN IF NOT EXISTS time_to_abandon_ms INTEGER`;
    await getDb()`ALTER TABLE ragecheck_analysis_starts ADD COLUMN IF NOT EXISTS connection_type TEXT`; // wifi, cellular, ethernet, none, unknown
    await getDb()`ALTER TABLE ragecheck_analysis_starts ADD COLUMN IF NOT EXISTS effective_connection_type TEXT`; // slow-2g, 2g, 3g, 4g
    // Language selection tracking
    await getDb()`ALTER TABLE ragecheck_analyses ADD COLUMN IF NOT EXISTS language TEXT`;
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
  // Content categorization
  topic?: string;
  contentType?: string;
  sourceType?: string;
  // Session correlation for funnel tracking
  sessionId?: string;
  // Language selection
  language?: string;
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

    // Ensure a visitor record exists for this IP (fallback if /api/visit didn't fire)
    if (data.ipAddress) {
      try {
        const [existingVisitor] = await getDb()`
          SELECT 1 FROM ragecheck_visitors
          WHERE ip_address = ${data.ipAddress}
            AND created_at > NOW() - INTERVAL '1 hour'
          LIMIT 1
        `;
        if (!existingVisitor) {
          await getDb()`
            INSERT INTO ragecheck_visitors (ip_address, user_agent, country, is_bot, page_path)
            VALUES (${data.ipAddress}, ${data.userAgent || null}, ${data.country || null}, ${isBotUser}, '/')
          `;
        }
      } catch (visitorError) {
        // Don't fail analysis logging if visitor fallback fails
        console.error("Failed to ensure visitor exists:", visitorError);
      }
    }

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
          sharing_patterns, technique_explanations, share_card_summary, failed_image_url,
          topic, content_type, source_type, session_id, language
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
          ${data.failedImageUrl || null},
          ${data.topic || null},
          ${data.contentType || null},
          ${data.sourceType || null},
          ${data.sessionId || null},
          ${data.language || null}
        )
      `;
    });
  } catch (error) {
    console.error("Failed to log analysis:", error);
    // Don't throw - logging shouldn't break the main flow
  }
}

// ============================================
// ANALYSIS START TRACKING (for abandonment metrics)
// ============================================

export interface AnalysisStartLog {
  sessionId: string;
  analysisType: "url" | "image";
  url?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
}

export async function logAnalysisStart(data: AnalysisStartLog) {
  try {
    const isBotUser = isBot(data.userAgent);

    await withRetry(async () => {
      await getDb()`
        INSERT INTO ragecheck_analysis_starts (
          session_id, analysis_type, url, ip_address, user_agent, country, is_bot
        ) VALUES (
          ${data.sessionId},
          ${data.analysisType},
          ${data.url || null},
          ${data.ipAddress || null},
          ${data.userAgent || null},
          ${data.country || null},
          ${isBotUser}
        )
      `;
    });
  } catch (error) {
    console.error("Failed to log analysis start:", error);
    // Don't throw - logging shouldn't break the main flow
  }
}

export interface AbandonmentData {
  sessionId: string;
  reason?: 'timeout' | 'error' | 'user_close' | 'page_leave';
  timeToAbandonMs?: number;
  connectionType?: string;
  effectiveConnectionType?: string;
}

export async function markAnalysisAbandoned(data: AbandonmentData | string) {
  try {
    // Support both old string signature and new object signature
    const sessionId = typeof data === 'string' ? data : data.sessionId;
    const reason = typeof data === 'string' ? 'page_leave' : (data.reason || 'page_leave');
    const timeToAbandonMs = typeof data === 'string' ? null : (data.timeToAbandonMs || null);
    const connectionType = typeof data === 'string' ? null : (data.connectionType || null);
    const effectiveConnectionType = typeof data === 'string' ? null : (data.effectiveConnectionType || null);

    await withRetry(async () => {
      // Only mark as abandoned if not already completed
      await getDb()`
        UPDATE ragecheck_analysis_starts
        SET
          abandoned_at = NOW(),
          abandon_reason = ${reason},
          time_to_abandon_ms = ${timeToAbandonMs},
          connection_type = ${connectionType},
          effective_connection_type = ${effectiveConnectionType}
        WHERE session_id = ${sessionId}
          AND abandoned_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM ragecheck_analyses
            WHERE session_id = ${sessionId}
          )
      `;
    });
  } catch (error) {
    console.error("Failed to mark analysis as abandoned:", error);
  }
}

// ============================================
// ANALYSIS COMPLETION METRICS
// ============================================

export interface AnalysisCompletionMetrics {
  overall: {
    started: number;
    completed: number;
    completionRate: number;
    abandonmentRate: number;
    // New correlated metrics
    correlatedCompleted: number;  // Completions matched to starts by session_id
    correlatedRate: number;       // True completion rate based on correlation
    abandoned: number;            // Starts without matching completion
    failed: number;               // Completions with success=false
    avgTimeToComplete: number;    // Average seconds from start to complete
  };
  byDevice: {
    mobile: { started: number; completed: number; abandoned: number; completionRate: number };
    tablet: { started: number; completed: number; abandoned: number; completionRate: number };
    desktop: { started: number; completed: number; abandoned: number; completionRate: number };
  };
  byOS: {
    iOS: { started: number; completed: number; abandoned: number; completionRate: number };
    Android: { started: number; completed: number; abandoned: number; completionRate: number };
    Windows: { started: number; completed: number; abandoned: number; completionRate: number };
    macOS: { started: number; completed: number; abandoned: number; completionRate: number };
    Linux: { started: number; completed: number; abandoned: number; completionRate: number };
    Other: { started: number; completed: number; abandoned: number; completionRate: number };
  };
  byAnalysisType: {
    url: { started: number; completed: number; completionRate: number };
    image: { started: number; completed: number; completionRate: number };
  };
  // Error breakdown
  errorBreakdown: {
    type: string;
    count: number;
  }[];
  hourlyTrend: {
    hour: string;
    started: number;
    completed: number;
    rate: number;
  }[];
  dailyTrend: {
    date: string;
    started: number;
    completed: number;
    rate: number;
  }[];
  // Data quality indicator
  trackingSince: string | null;  // Date when session_id tracking started
}

export async function getAnalysisCompletionMetrics(): Promise<AnalysisCompletionMetrics> {
  try {
    await initDB();

    // Get earliest tracking date (when session_id tracking started)
    const [trackingStart] = await getDb()`
      SELECT MIN(created_at) as start_date
      FROM ragecheck_analysis_starts
      WHERE is_bot = false
    `;
    const trackingSince = trackingStart?.start_date
      ? parseDBDateToEST(trackingStart.start_date)
      : null;

    // Overall started (last 7 days, non-bot)
    const [startedResult] = await getDb()`
      SELECT COUNT(*) as count
      FROM ragecheck_analysis_starts
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
    `;

    // Overall completed (last 7 days, non-bot) - only where we have session_id tracking
    const [completedResult] = await getDb()`
      SELECT COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
        AND session_id IS NOT NULL
    `;

    // Correlated metrics - starts matched with completions by session_id
    const [correlatedResult] = await getDb()`
      SELECT
        COUNT(DISTINCT s.session_id) as correlated_completed,
        AVG(EXTRACT(EPOCH FROM (a.created_at - s.created_at))) as avg_time_seconds
      FROM ragecheck_analysis_starts s
      INNER JOIN ragecheck_analyses a ON s.session_id = a.session_id
      WHERE s.is_bot = false
        AND s.created_at > NOW() - INTERVAL '7 days'
        AND a.success = true
    `;

    // Failed analyses (with session_id)
    const [failedResult] = await getDb()`
      SELECT COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
        AND session_id IS NOT NULL
        AND success = false
    `;

    // Error breakdown - more granular categories
    const errorBreakdown = await getDb()`
      SELECT
        COALESCE(
          CASE
            -- Paywall/Login issues
            WHEN error ILIKE '%requires login%' OR error ILIKE '%paywalled%' THEN 'Paywall/Login Required'
            -- Platform-specific blocks
            WHEN error ILIKE '%twitter%' OR error ILIKE '%X has restricted%' THEN 'Twitter/X Blocked'
            WHEN error ILIKE '%threads%' THEN 'Threads Blocked'
            WHEN error ILIKE '%truth social%' THEN 'Truth Social Blocked'
            WHEN error ILIKE '%farcaster%' THEN 'Farcaster Blocked'
            -- Cloudflare protection
            WHEN error ILIKE '%cloudflare%' THEN 'Cloudflare Protected'
            -- Content extraction issues
            WHEN error ILIKE '%text too short%' OR error ILIKE '%couldn''t extract text%' THEN 'Content Too Short'
            WHEN error ILIKE '%content too large%' OR error ILIKE '%too large%' THEN 'Content Too Large'
            WHEN error ILIKE '%not HTML%' OR error ILIKE '%not text%' THEN 'Invalid Content Type'
            -- Timeout
            WHEN error ILIKE '%timeout%' OR error ILIKE '%timed out%' THEN 'Timeout'
            -- HTTP 4xx errors (specific codes first, then catch-all)
            WHEN error ILIKE '%HTTP 400%' OR error ILIKE '%bad request%' THEN 'HTTP 400 Bad Request'
            WHEN error ILIKE '%HTTP 401%' OR error ILIKE '%unauthorized%' THEN 'HTTP 401 Unauthorized'
            WHEN error ILIKE '%HTTP 403%' OR error ILIKE '%forbidden%' THEN 'HTTP 403 Forbidden'
            WHEN error ILIKE '%HTTP 404%' OR error ILIKE '%not found%' THEN 'HTTP 404 Not Found'
            WHEN error ILIKE '%HTTP 410%' OR error ILIKE '%gone%' THEN 'HTTP 410 Gone'
            WHEN error ILIKE '%HTTP 429%' OR error ILIKE '%rate limit%' OR error ILIKE '%too many requests%' THEN 'HTTP 429 Rate Limited'
            WHEN error ILIKE '%HTTP 4%' THEN 'HTTP 4xx Other'
            -- HTTP 5xx errors (specific codes first)
            WHEN error ILIKE '%HTTP 500%' OR error ILIKE '%internal server error%' THEN 'HTTP 500 Server Error'
            WHEN error ILIKE '%HTTP 502%' OR error ILIKE '%bad gateway%' THEN 'HTTP 502 Bad Gateway'
            WHEN error ILIKE '%HTTP 503%' OR error ILIKE '%service unavailable%' THEN 'HTTP 503 Unavailable'
            WHEN error ILIKE '%HTTP 504%' OR error ILIKE '%gateway timeout%' THEN 'HTTP 504 Gateway Timeout'
            WHEN error ILIKE '%HTTP 5%' THEN 'HTTP 5xx Other'
            -- URL issues
            WHEN error ILIKE '%invalid url%' OR error ILIKE '%url not allowed%' THEN 'Invalid URL'
            -- Image issues
            WHEN error ILIKE '%invalid image%' OR error ILIKE '%image too large%' THEN 'Invalid Image'
            WHEN error ILIKE '%no text content%' OR error ILIKE '%doesn''t have text%' THEN 'No Text in Image'
            -- Network/fetch issues
            WHEN error ILIKE '%network%' OR error ILIKE '%fetch%' OR error ILIKE '%failed to fetch%' THEN 'Network Error'
            -- API errors
            WHEN error ILIKE '%api error%' OR error ILIKE '%scrapingbee%' THEN 'API Error'
            ELSE 'Other'
          END,
          'Unknown'
        ) as type,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
        AND success = false
        AND session_id IS NOT NULL
      GROUP BY type
      ORDER BY count DESC
    `;

    const totalStarted = Number(startedResult?.count || 0);
    const totalCompleted = Number(completedResult?.count || 0);
    const correlatedCompleted = Number(correlatedResult?.correlated_completed || 0);
    const avgTimeToComplete = Math.round(Number(correlatedResult?.avg_time_seconds || 0) * 10) / 10;
    const failed = Number(failedResult?.count || 0);
    const abandoned = Math.max(0, totalStarted - correlatedCompleted - failed);

    // By device type - started
    const deviceStarted = await getDb()`
      SELECT user_agent, COUNT(*) as count
      FROM ragecheck_analysis_starts
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
        AND user_agent IS NOT NULL
      GROUP BY user_agent
    `;

    // By device type - completed (only correlated data with session_id)
    const deviceCompleted = await getDb()`
      SELECT user_agent, COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
        AND user_agent IS NOT NULL
        AND session_id IS NOT NULL
      GROUP BY user_agent
    `;

    // Aggregate by device
    const deviceStats = { mobile: { started: 0, completed: 0 }, tablet: { started: 0, completed: 0 }, desktop: { started: 0, completed: 0 } };
    for (const row of deviceStarted) {
      const device = getDeviceType(row.user_agent);
      deviceStats[device].started += Number(row.count);
    }
    for (const row of deviceCompleted) {
      const device = getDeviceType(row.user_agent);
      deviceStats[device].completed += Number(row.count);
    }

    // Aggregate by OS
    const osStats: Record<string, { started: number; completed: number }> = {
      iOS: { started: 0, completed: 0 },
      Android: { started: 0, completed: 0 },
      Windows: { started: 0, completed: 0 },
      macOS: { started: 0, completed: 0 },
      Linux: { started: 0, completed: 0 },
      Other: { started: 0, completed: 0 },
    };
    for (const row of deviceStarted) {
      const os = getOS(row.user_agent);
      osStats[os].started += Number(row.count);
    }
    for (const row of deviceCompleted) {
      const os = getOS(row.user_agent);
      osStats[os].completed += Number(row.count);
    }

    // By analysis type
    const [urlStarted] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_analysis_starts
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days' AND analysis_type = 'url'
    `;
    const [imageStarted] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_analysis_starts
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days' AND analysis_type = 'image'
    `;
    const [urlCompleted] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days' AND url != 'image-upload' AND session_id IS NOT NULL
    `;
    const [imageCompleted] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '7 days' AND url = 'image-upload' AND session_id IS NOT NULL
    `;

    // Hourly trend (last 24 hours)
    const hourlyStarted = await getDb()`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'HH24:00') as hour,
        COUNT(*) as count
      FROM ragecheck_analysis_starts
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '24 hours'
      GROUP BY TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'HH24:00')
      ORDER BY hour
    `;

    const hourlyCompleted = await getDb()`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'HH24:00') as hour,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '24 hours' AND session_id IS NOT NULL
      GROUP BY TO_CHAR(created_at AT TIME ZONE 'America/New_York', 'HH24:00')
      ORDER BY hour
    `;

    const hourlyMap = new Map<string, { started: number; completed: number }>();
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0') + ':00';
      hourlyMap.set(hour, { started: 0, completed: 0 });
    }
    for (const row of hourlyStarted) {
      if (hourlyMap.has(row.hour)) {
        hourlyMap.get(row.hour)!.started = Number(row.count);
      }
    }
    for (const row of hourlyCompleted) {
      if (hourlyMap.has(row.hour)) {
        hourlyMap.get(row.hour)!.completed = Number(row.count);
      }
    }

    // Daily trend (last 14 days)
    const dailyStarted = await getDb()`
      SELECT
        DATE(created_at AT TIME ZONE 'America/New_York') as date,
        COUNT(*) as count
      FROM ragecheck_analysis_starts
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY date
    `;

    const dailyCompleted = await getDb()`
      SELECT
        DATE(created_at AT TIME ZONE 'America/New_York') as date,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '14 days' AND session_id IS NOT NULL
      GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      ORDER BY date
    `;

    const dailyMap = new Map<string, { started: number; completed: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getESTDateString(d);
      dailyMap.set(dateStr, { started: 0, completed: 0 });
    }
    for (const row of dailyStarted) {
      const dateStr = parseDBDateToEST(row.date);
      if (dailyMap.has(dateStr)) {
        dailyMap.get(dateStr)!.started = Number(row.count);
      }
    }
    for (const row of dailyCompleted) {
      const dateStr = parseDBDateToEST(row.date);
      if (dailyMap.has(dateStr)) {
        dailyMap.get(dateStr)!.completed = Number(row.count);
      }
    }

    const calcRate = (started: number, completed: number) =>
      started > 0 ? Math.min(100, Math.round((completed / started) * 1000) / 10) : 0;

    return {
      overall: {
        started: totalStarted,
        completed: totalCompleted,
        completionRate: calcRate(totalStarted, totalCompleted),
        abandonmentRate: totalStarted > 0 ? Math.max(0, Math.round(((totalStarted - correlatedCompleted) / totalStarted) * 1000) / 10) : 0,
        // New correlated metrics
        correlatedCompleted,
        correlatedRate: calcRate(totalStarted, correlatedCompleted),
        abandoned,
        failed,
        avgTimeToComplete,
      },
      byDevice: {
        mobile: { ...deviceStats.mobile, abandoned: Math.max(0, deviceStats.mobile.started - deviceStats.mobile.completed), completionRate: calcRate(deviceStats.mobile.started, deviceStats.mobile.completed) },
        tablet: { ...deviceStats.tablet, abandoned: Math.max(0, deviceStats.tablet.started - deviceStats.tablet.completed), completionRate: calcRate(deviceStats.tablet.started, deviceStats.tablet.completed) },
        desktop: { ...deviceStats.desktop, abandoned: Math.max(0, deviceStats.desktop.started - deviceStats.desktop.completed), completionRate: calcRate(deviceStats.desktop.started, deviceStats.desktop.completed) },
      },
      byOS: {
        iOS: { ...osStats.iOS, abandoned: Math.max(0, osStats.iOS.started - osStats.iOS.completed), completionRate: calcRate(osStats.iOS.started, osStats.iOS.completed) },
        Android: { ...osStats.Android, abandoned: Math.max(0, osStats.Android.started - osStats.Android.completed), completionRate: calcRate(osStats.Android.started, osStats.Android.completed) },
        Windows: { ...osStats.Windows, abandoned: Math.max(0, osStats.Windows.started - osStats.Windows.completed), completionRate: calcRate(osStats.Windows.started, osStats.Windows.completed) },
        macOS: { ...osStats.macOS, abandoned: Math.max(0, osStats.macOS.started - osStats.macOS.completed), completionRate: calcRate(osStats.macOS.started, osStats.macOS.completed) },
        Linux: { ...osStats.Linux, abandoned: Math.max(0, osStats.Linux.started - osStats.Linux.completed), completionRate: calcRate(osStats.Linux.started, osStats.Linux.completed) },
        Other: { ...osStats.Other, abandoned: Math.max(0, osStats.Other.started - osStats.Other.completed), completionRate: calcRate(osStats.Other.started, osStats.Other.completed) },
      },
      byAnalysisType: {
        url: {
          started: Number(urlStarted?.count || 0),
          completed: Number(urlCompleted?.count || 0),
          completionRate: calcRate(Number(urlStarted?.count || 0), Number(urlCompleted?.count || 0)),
        },
        image: {
          started: Number(imageStarted?.count || 0),
          completed: Number(imageCompleted?.count || 0),
          completionRate: calcRate(Number(imageStarted?.count || 0), Number(imageCompleted?.count || 0)),
        },
      },
      errorBreakdown: errorBreakdown.map(row => ({
        type: row.type as string,
        count: Number(row.count),
      })),
      hourlyTrend: Array.from(hourlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, data]) => ({
          hour,
          started: data.started,
          completed: data.completed,
          rate: calcRate(data.started, data.completed),
        })),
      dailyTrend: Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({
          date,
          started: data.started,
          completed: data.completed,
          rate: calcRate(data.started, data.completed),
        })),
      trackingSince,
    };
  } catch (error) {
    console.error("Failed to get analysis completion metrics:", error);
    return {
      overall: {
        started: 0, completed: 0, completionRate: 0, abandonmentRate: 0,
        correlatedCompleted: 0, correlatedRate: 0, abandoned: 0, failed: 0, avgTimeToComplete: 0,
      },
      byDevice: {
        mobile: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
        tablet: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
        desktop: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
      },
      byOS: {
        iOS: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
        Android: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
        Windows: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
        macOS: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
        Linux: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
        Other: { started: 0, completed: 0, abandoned: 0, completionRate: 0 },
      },
      byAnalysisType: {
        url: { started: 0, completed: 0, completionRate: 0 },
        image: { started: 0, completed: 0, completionRate: 0 },
      },
      errorBreakdown: [],
      hourlyTrend: [],
      dailyTrend: [],
      trackingSince: null,
    };
  }
}

// ============================================
// ABANDONMENT DIAGNOSTICS
// ============================================

export interface AbandonmentDiagnostics {
  // Time-to-abandon histogram
  timeDistribution: {
    bucket: string; // '0-5s', '5-10s', '10-30s', '30s+'
    count: number;
    percentage: number;
  }[];
  // Reason breakdown
  reasonBreakdown: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  // Connection type breakdown
  connectionBreakdown: {
    connectionType: string;
    effectiveType: string;
    count: number;
    abandonRate: number;
  }[];
  // Abandonment rate by analysis duration (for correlation)
  durationCorrelation: {
    durationBucket: string; // '<3s', '3-5s', '5-10s', '10-20s', '20s+'
    totalCompleted: number;
    totalAbandoned: number;
    abandonRate: number;
  }[];
  // Summary stats
  summary: {
    totalAbandoned: number;
    avgTimeToAbandon: number;
    medianTimeToAbandon: number;
    mostCommonReason: string;
    highestAbandonConnection: string;
  };
}

export async function getAbandonmentDiagnostics(): Promise<AbandonmentDiagnostics> {
  try {
    await initDB();

    // Time-to-abandon distribution
    const timeDistributionResult = await getDb()`
      SELECT
        CASE
          WHEN time_to_abandon_ms IS NULL THEN 'unknown'
          WHEN time_to_abandon_ms < 5000 THEN '0-5s'
          WHEN time_to_abandon_ms < 10000 THEN '5-10s'
          WHEN time_to_abandon_ms < 30000 THEN '10-30s'
          ELSE '30s+'
        END as bucket,
        COUNT(*) as count
      FROM ragecheck_analysis_starts
      WHERE abandoned_at IS NOT NULL
        AND is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY bucket
      ORDER BY
        CASE bucket
          WHEN '0-5s' THEN 1
          WHEN '5-10s' THEN 2
          WHEN '10-30s' THEN 3
          WHEN '30s+' THEN 4
          ELSE 5
        END
    `;

    const totalAbandoned = timeDistributionResult.reduce((sum, r) => sum + Number(r.count), 0);
    const timeDistribution = timeDistributionResult.map(r => ({
      bucket: r.bucket as string,
      count: Number(r.count),
      percentage: totalAbandoned > 0 ? Math.round((Number(r.count) / totalAbandoned) * 1000) / 10 : 0,
    }));

    // Reason breakdown
    const reasonResult = await getDb()`
      SELECT
        COALESCE(abandon_reason, 'unknown') as reason,
        COUNT(*) as count
      FROM ragecheck_analysis_starts
      WHERE abandoned_at IS NOT NULL
        AND is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY abandon_reason
      ORDER BY count DESC
    `;

    const reasonBreakdown = reasonResult.map(r => ({
      reason: r.reason as string,
      count: Number(r.count),
      percentage: totalAbandoned > 0 ? Math.round((Number(r.count) / totalAbandoned) * 1000) / 10 : 0,
    }));

    // Connection type breakdown with abandon rates
    const connectionResult = await getDb()`
      SELECT
        COALESCE(connection_type, 'unknown') as connection_type,
        COALESCE(effective_connection_type, 'unknown') as effective_type,
        COUNT(*) FILTER (WHERE abandoned_at IS NOT NULL) as abandoned_count,
        COUNT(*) as total_count
      FROM ragecheck_analysis_starts
      WHERE is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY connection_type, effective_connection_type
      HAVING COUNT(*) >= 3
      ORDER BY COUNT(*) FILTER (WHERE abandoned_at IS NOT NULL)::float / NULLIF(COUNT(*), 0) DESC
    `;

    const connectionBreakdown = connectionResult.map(r => ({
      connectionType: r.connection_type as string,
      effectiveType: r.effective_type as string,
      count: Number(r.abandoned_count),
      abandonRate: Number(r.total_count) > 0
        ? Math.round((Number(r.abandoned_count) / Number(r.total_count)) * 1000) / 10
        : 0,
    }));

    // Duration correlation - compare completed vs abandoned by how long the analysis took
    const durationCorrelationResult = await getDb()`
      WITH completed_durations AS (
        SELECT
          EXTRACT(EPOCH FROM (a.created_at - s.created_at)) as duration_seconds
        FROM ragecheck_analysis_starts s
        INNER JOIN ragecheck_analyses a ON s.session_id = a.session_id
        WHERE s.is_bot = false
          AND s.created_at > NOW() - INTERVAL '7 days'
      ),
      abandoned_durations AS (
        SELECT
          COALESCE(time_to_abandon_ms / 1000.0, 10) as duration_seconds
        FROM ragecheck_analysis_starts
        WHERE abandoned_at IS NOT NULL
          AND is_bot = false
          AND created_at > NOW() - INTERVAL '7 days'
      ),
      all_durations AS (
        SELECT duration_seconds, 'completed' as status FROM completed_durations
        UNION ALL
        SELECT duration_seconds, 'abandoned' as status FROM abandoned_durations
      )
      SELECT
        CASE
          WHEN duration_seconds < 3 THEN '<3s'
          WHEN duration_seconds < 5 THEN '3-5s'
          WHEN duration_seconds < 10 THEN '5-10s'
          WHEN duration_seconds < 20 THEN '10-20s'
          ELSE '20s+'
        END as duration_bucket,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned
      FROM all_durations
      GROUP BY duration_bucket
      ORDER BY
        CASE duration_bucket
          WHEN '<3s' THEN 1
          WHEN '3-5s' THEN 2
          WHEN '5-10s' THEN 3
          WHEN '10-20s' THEN 4
          ELSE 5
        END
    `;

    const durationCorrelation = durationCorrelationResult.map(r => ({
      durationBucket: r.duration_bucket as string,
      totalCompleted: Number(r.completed),
      totalAbandoned: Number(r.abandoned),
      abandonRate: (Number(r.completed) + Number(r.abandoned)) > 0
        ? Math.round((Number(r.abandoned) / (Number(r.completed) + Number(r.abandoned))) * 1000) / 10
        : 0,
    }));

    // Summary stats
    const [summaryResult] = await getDb()`
      SELECT
        COUNT(*) as total_abandoned,
        AVG(time_to_abandon_ms) as avg_time,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_to_abandon_ms) as median_time
      FROM ragecheck_analysis_starts
      WHERE abandoned_at IS NOT NULL
        AND is_bot = false
        AND created_at > NOW() - INTERVAL '7 days'
        AND time_to_abandon_ms IS NOT NULL
    `;

    const mostCommonReason = reasonBreakdown.length > 0 ? reasonBreakdown[0].reason : 'unknown';
    const highestAbandonConnection = connectionBreakdown.length > 0
      ? `${connectionBreakdown[0].effectiveType} (${connectionBreakdown[0].abandonRate}%)`
      : 'unknown';

    return {
      timeDistribution,
      reasonBreakdown,
      connectionBreakdown,
      durationCorrelation,
      summary: {
        totalAbandoned,
        avgTimeToAbandon: Math.round(Number(summaryResult?.avg_time || 0) / 100) / 10, // Convert to seconds with 1 decimal
        medianTimeToAbandon: Math.round(Number(summaryResult?.median_time || 0) / 100) / 10,
        mostCommonReason,
        highestAbandonConnection,
      },
    };
  } catch (error) {
    console.error("Failed to get abandonment diagnostics:", error);
    return {
      timeDistribution: [],
      reasonBreakdown: [],
      connectionBreakdown: [],
      durationCorrelation: [],
      summary: {
        totalAbandoned: 0,
        avgTimeToAbandon: 0,
        medianTimeToAbandon: 0,
        mostCommonReason: 'unknown',
        highestAbandonConnection: 'unknown',
      },
    };
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
    shareType: string | null;
    failedImageUrl: string | null;
    isRepeatUser: boolean;
  }[];
  topUsers: {
    ipAddress: string;
    country: string | null;
    analysisCount: number;
    avgScore: number;
  }[];
  repeatUsers: {
    ipAddress: string;
    country: string | null;
    device: "mobile" | "tablet" | "desktop";
    firstPlatform: string;
    firstReferrer: string | null;
    firstDaySearches: number;
    totalDays: number;
    totalSearches: number;
    firstSeen: Date;
    lastSeen: Date;
    isMidnightCrossover: boolean; // True if 2 days but session < 4 hours (likely just crossed midnight)
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
           a.success, a.error, a.title,
           a.created_at,
           a.ip_address, a.user_agent, a.country, a.is_bot,
           a.failed_image_url,
           EXISTS (SELECT 1 FROM ragecheck_shares s WHERE s.url = a.url AND s.share_type NOT LIKE '%_clicked') as shared,
           (SELECT s.share_type FROM ragecheck_shares s WHERE s.url = a.url AND s.share_type NOT LIKE '%_clicked' ORDER BY s.created_at DESC LIMIT 1) as share_type,
           (SELECT COUNT(DISTINCT DATE(a2.created_at)) FROM ragecheck_analyses a2 WHERE a2.ip_address = a.ip_address AND a.ip_address IS NOT NULL) > 1 as is_repeat_user
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
    shareType: row.share_type || null,
    failedImageUrl: row.failed_image_url || null,
    isRepeatUser: row.is_repeat_user || false,
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

  // Repeat users - users who visited on multiple distinct days (excluding bots)
  const repeatUserRows = await getDb()`
    WITH user_days AS (
      SELECT
        ip_address,
        country,
        user_agent,
        COUNT(DISTINCT DATE(created_at)) as total_days,
        COUNT(*) as total_searches,
        MIN(created_at) as first_seen,
        MAX(created_at) as last_seen
      FROM ragecheck_analyses
      WHERE is_bot = false AND ip_address IS NOT NULL
      GROUP BY ip_address, country, user_agent
      HAVING COUNT(DISTINCT DATE(created_at)) > 1
    ),
    first_analysis AS (
      SELECT DISTINCT ON (a.ip_address)
        a.ip_address,
        a.platform as first_platform,
        (SELECT v.referrer FROM ragecheck_visitors v WHERE v.ip_address = a.ip_address ORDER BY v.created_at LIMIT 1) as first_referrer,
        (SELECT COUNT(*) FROM ragecheck_analyses a2 WHERE a2.ip_address = a.ip_address AND DATE(a2.created_at) = DATE(a.created_at)) as first_day_searches
      FROM ragecheck_analyses a
      WHERE a.is_bot = false AND a.ip_address IS NOT NULL
      ORDER BY a.ip_address, a.created_at
    )
    SELECT
      ud.ip_address,
      ud.country,
      ud.user_agent,
      ud.total_days,
      ud.total_searches,
      ud.first_seen AT TIME ZONE 'America/New_York' as first_seen,
      ud.last_seen AT TIME ZONE 'America/New_York' as last_seen,
      fa.first_platform,
      fa.first_referrer,
      fa.first_day_searches
    FROM user_days ud
    LEFT JOIN first_analysis fa ON ud.ip_address = fa.ip_address
    ORDER BY ud.total_days DESC, ud.total_searches DESC
    LIMIT 50
  `;
  const repeatUsers = repeatUserRows.map((row) => {
    const firstSeen = new Date(row.first_seen);
    const lastSeen = new Date(row.last_seen);
    const totalDays = Number(row.total_days);
    const hoursBetween = (lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60);
    // Flag as midnight crossover if exactly 2 days but less than 4 hours apart
    const isMidnightCrossover = totalDays === 2 && hoursBetween < 4;

    return {
      ipAddress: row.ip_address,
      country: row.country || null,
      device: getDeviceType(row.user_agent),
      firstPlatform: row.first_platform || "unknown",
      firstReferrer: row.first_referrer || null,
      firstDaySearches: Number(row.first_day_searches) || 1,
      totalDays,
      totalSearches: Number(row.total_searches),
      firstSeen,
      lastSeen,
      isMidnightCrossover,
    };
  });

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
    repeatUsers,
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

// ============================================
// EMAIL SUBSCRIBERS
// ============================================

export async function subscribeEmail(data: {
  email: string;
  ipAddress?: string;
  country?: string;
  source?: string;
}): Promise<{ success: boolean; error?: string; alreadySubscribed?: boolean }> {
  try {
    await initDB();

    // Check if already subscribed
    const [existing] = await getDb()`
      SELECT id, unsubscribed_at FROM ragecheck_subscribers
      WHERE email = ${data.email.toLowerCase().trim()}
    `;

    if (existing) {
      if (existing.unsubscribed_at) {
        // Re-subscribe
        await getDb()`
          UPDATE ragecheck_subscribers
          SET unsubscribed_at = NULL, subscribed_at = NOW()
          WHERE email = ${data.email.toLowerCase().trim()}
        `;
        return { success: true };
      }
      return { success: true, alreadySubscribed: true };
    }

    await getDb()`
      INSERT INTO ragecheck_subscribers (email, ip_address, country, source)
      VALUES (${data.email.toLowerCase().trim()}, ${data.ipAddress || null}, ${data.country || null}, ${data.source || 'website'})
    `;

    return { success: true };
  } catch (error) {
    console.error("Failed to subscribe email:", error);
    return { success: false, error: "Failed to subscribe" };
  }
}

export interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  bySource: { source: string; count: number }[];
  byCountry: { country: string; count: number }[];
  recentSubscribers: {
    email: string;
    subscribedAt: string;
    source: string;
    country: string | null;
  }[];
  dailySignups: { date: string; count: number }[];
}

export async function getSubscriberStats(): Promise<SubscriberStats | null> {
  try {
    await initDB();

    // Total counts
    const [totals] = await getDb()`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE unsubscribed_at IS NULL) as active,
        COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL) as unsubscribed,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '1 day' AND unsubscribed_at IS NULL) as today,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '7 days' AND unsubscribed_at IS NULL) as this_week,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '30 days' AND unsubscribed_at IS NULL) as this_month
      FROM ragecheck_subscribers
    `;

    // By source
    const bySource = await getDb()`
      SELECT COALESCE(source, 'unknown') as source, COUNT(*) as count
      FROM ragecheck_subscribers
      WHERE unsubscribed_at IS NULL
      GROUP BY source
      ORDER BY count DESC
    `;

    // By country
    const byCountry = await getDb()`
      SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
      FROM ragecheck_subscribers
      WHERE unsubscribed_at IS NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;

    // Recent subscribers
    const recentSubscribers = await getDb()`
      SELECT email, subscribed_at, COALESCE(source, 'website') as source, country
      FROM ragecheck_subscribers
      WHERE unsubscribed_at IS NULL
      ORDER BY subscribed_at DESC
      LIMIT 20
    `;

    // Daily signups (last 30 days)
    const dailySignups = await getDb()`
      SELECT DATE(subscribed_at) as date, COUNT(*) as count
      FROM ragecheck_subscribers
      WHERE subscribed_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(subscribed_at)
      ORDER BY date DESC
    `;

    return {
      total: Number(totals.total) || 0,
      active: Number(totals.active) || 0,
      unsubscribed: Number(totals.unsubscribed) || 0,
      today: Number(totals.today) || 0,
      thisWeek: Number(totals.this_week) || 0,
      thisMonth: Number(totals.this_month) || 0,
      bySource: bySource.map((r) => ({
        source: r.source as string,
        count: Number(r.count),
      })),
      byCountry: byCountry.map((r) => ({
        country: r.country as string,
        count: Number(r.count),
      })),
      recentSubscribers: recentSubscribers.map((r) => ({
        email: r.email as string,
        subscribedAt: r.subscribed_at as string,
        source: r.source as string,
        country: r.country as string | null,
      })),
      dailySignups: dailySignups.map((r) => ({
        date: r.date as string,
        count: Number(r.count),
      })),
    };
  } catch (error) {
    console.error("Failed to get subscriber stats:", error);
    return null;
  }
}

export interface ClearviewSubscriberStats {
  total: number;
  active: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  recentSubscribers: {
    email: string;
    subscribedAt: string;
    country: string | null;
  }[];
  dailySignups: { date: string; count: number }[];
}

export async function getClearviewSubscriberStats(): Promise<ClearviewSubscriberStats | null> {
  try {
    await initDB();

    // Total counts for clearview source
    const [totals] = await getDb()`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE unsubscribed_at IS NULL) as active,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '1 day' AND unsubscribed_at IS NULL) as today,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '7 days' AND unsubscribed_at IS NULL) as this_week,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '30 days' AND unsubscribed_at IS NULL) as this_month
      FROM ragecheck_subscribers
      WHERE source = 'clearview'
    `;

    // Recent clearview subscribers
    const recentSubscribers = await getDb()`
      SELECT email, subscribed_at, country
      FROM ragecheck_subscribers
      WHERE source = 'clearview' AND unsubscribed_at IS NULL
      ORDER BY subscribed_at DESC
      LIMIT 10
    `;

    // Daily signups (last 30 days) for clearview
    const dailySignups = await getDb()`
      SELECT DATE(subscribed_at) as date, COUNT(*) as count
      FROM ragecheck_subscribers
      WHERE source = 'clearview' AND subscribed_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(subscribed_at)
      ORDER BY date DESC
    `;

    return {
      total: Number(totals.total) || 0,
      active: Number(totals.active) || 0,
      today: Number(totals.today) || 0,
      thisWeek: Number(totals.this_week) || 0,
      thisMonth: Number(totals.this_month) || 0,
      recentSubscribers: recentSubscribers.map((r) => ({
        email: r.email as string,
        subscribedAt: r.subscribed_at as string,
        country: r.country as string | null,
      })),
      dailySignups: dailySignups.map((r) => ({
        date: r.date as string,
        count: Number(r.count),
      })),
    };
  } catch (error) {
    console.error("Failed to get clearview subscriber stats:", error);
    return null;
  }
}

export interface VisitorLog {
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  referrer?: string;
  pagePath?: string;
  // UTM parameters for acquisition tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export async function logVisitor(data: VisitorLog) {
  try {
    const isBotUser = isBot(data.userAgent);
    await withRetry(async () => {
      await getDb()`
        INSERT INTO ragecheck_visitors (
          ip_address, user_agent, country, referrer, is_bot, page_path,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term
        )
        VALUES (
          ${data.ipAddress || null},
          ${data.userAgent || null},
          ${data.country || null},
          ${data.referrer || null},
          ${isBotUser},
          ${data.pagePath || null},
          ${data.utmSource || null},
          ${data.utmMedium || null},
          ${data.utmCampaign || null},
          ${data.utmContent || null},
          ${data.utmTerm || null}
        )
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
    isRepeatUser: boolean;
    startedCount: number;
    abandonedCount: number;
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
  uniqueRealtimeSeries: {
    time: string;
    uniqueVisitors: number;
    uniqueAnalyzers: number;
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
      SELECT v.ip_address, v.user_agent, v.country, v.referrer, v.page_path,
             v.created_at, v.is_bot,
             EXISTS (
               SELECT 1 FROM ragecheck_analyses a
               WHERE a.ip_address = v.ip_address AND a.llm_enhanced = true
             ) as has_llm_analysis,
             (SELECT COUNT(DISTINCT DATE(v2.created_at)) FROM ragecheck_visitors v2 WHERE v2.ip_address = v.ip_address AND v.ip_address IS NOT NULL) > 1 as is_repeat_user,
             (SELECT COUNT(*) FROM ragecheck_analysis_starts s WHERE s.ip_address = v.ip_address AND v.ip_address IS NOT NULL) as started_count,
             (SELECT COUNT(*) FROM ragecheck_analysis_starts s
              WHERE s.ip_address = v.ip_address AND v.ip_address IS NOT NULL
              AND s.abandoned_at IS NOT NULL) as abandoned_count
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
      isRepeatUser: row.is_repeat_user || false,
      startedCount: Number(row.started_count) || 0,
      abandonedCount: Number(row.abandoned_count) || 0,
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
      const dateStr = getESTDateString(d);
      dateMap.set(dateStr, { visitors: 0, analyses: 0 });
    }

    for (const row of visitorTimeSeries) {
      const dateStr = parseDBDateToEST(row.date);
      const existing = dateMap.get(dateStr) || { visitors: 0, analyses: 0 };
      existing.visitors = Number(row.count);
      dateMap.set(dateStr, existing);
    }

    for (const row of analysisTimeSeries) {
      const dateStr = parseDBDateToEST(row.date);
      const existing = dateMap.get(dateStr) || { visitors: 0, analyses: 0 };
      existing.analyses = Number(row.count);
      dateMap.set(dateStr, existing);
    }

    const timeSeries = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    // Realtime series - 30 minute buckets for last 3 days (72 hours), excluding bots
    // Use EXTRACT(EPOCH) to get Unix timestamp in seconds - this is unambiguous and avoids timezone parsing issues
    // The bucketing is done in UTC (using date_trunc on created_at directly)
    const visitorRealtime = await getDb()`
      SELECT
        EXTRACT(EPOCH FROM date_trunc('hour', created_at) +
          (floor(extract(minute FROM created_at) / 30) * interval '30 minutes')) * 1000 as bucket_ms,
        COUNT(*) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '72 hours'
      GROUP BY 1
      ORDER BY bucket_ms ASC
    `;

    const analysisRealtime = await getDb()`
      SELECT
        EXTRACT(EPOCH FROM date_trunc('hour', created_at) +
          (floor(extract(minute FROM created_at) / 30) * interval '30 minutes')) * 1000 as bucket_ms,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false AND created_at > NOW() - INTERVAL '72 hours'
      GROUP BY 1
      ORDER BY bucket_ms ASC
    `;

    // Merge realtime data into 30-minute buckets
    const realtimeMap = new Map<string, { visitors: number; analyses: number }>();

    // Helper to get current EST-aligned bucket start
    // Returns UTC timestamp of the most recent complete EST 30-min bucket
    const getESTAlignedBucketStart = () => {
      const now = new Date();
      // Get current time formatted as EST
      const estFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const parts = estFormatter.formatToParts(now);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

      // Build EST date/time
      const estYear = parseInt(getPart('year'));
      const estMonth = parseInt(getPart('month')) - 1;
      const estDay = parseInt(getPart('day'));
      const estHour = parseInt(getPart('hour'));
      const estMinute = parseInt(getPart('minute'));

      // Round down to nearest 30 min in EST
      const roundedMinute = Math.floor(estMinute / 30) * 30;

      // Create a date string in EST and parse it to get UTC
      const estDateStr = `${estYear}-${String(estMonth + 1).padStart(2, '0')}-${String(estDay).padStart(2, '0')}T${String(estHour).padStart(2, '0')}:${String(roundedMinute).padStart(2, '0')}:00`;

      // Simpler approach: round current UTC time down to nearest 30 minutes
      // The EST formatting above was just to get the rounded minute in EST
      // But we can just round the UTC timestamp directly
      const nowMs = now.getTime();
      const thirtyMinMs = 30 * 60 * 1000;
      const roundedMs = Math.floor(nowMs / thirtyMinMs) * thirtyMinMs;
      return new Date(roundedMs);
    };

    // Initialize last 3 days (72 hours) in 30-minute intervals (144 buckets, excluding current incomplete bucket)
    const bucketStart = getESTAlignedBucketStart();
    for (let i = 144; i >= 1; i--) {
      const d = new Date(bucketStart.getTime() - i * 30 * 60 * 1000);
      const timeStr = d.toISOString();
      realtimeMap.set(timeStr, { visitors: 0, analyses: 0 });
    }

    for (const row of visitorRealtime) {
      const timeStr = new Date(Number(row.bucket_ms)).toISOString();
      const existing = realtimeMap.get(timeStr) || { visitors: 0, analyses: 0 };
      existing.visitors = Number(row.count);
      realtimeMap.set(timeStr, existing);
    }

    for (const row of analysisRealtime) {
      const timeStr = new Date(Number(row.bucket_ms)).toISOString();
      const existing = realtimeMap.get(timeStr) || { visitors: 0, analyses: 0 };
      existing.analyses = Number(row.count);
      realtimeMap.set(timeStr, existing);
    }

    const realtimeSeries = Array.from(realtimeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, data]) => ({ time, ...data }));

    // Unique sessions - count distinct IP addresses per bucket
    // This shows unique visitors rather than total page loads
    // Use EXTRACT(EPOCH) for unambiguous timestamp transfer
    const uniqueVisitorRealtime = await getDb()`
      SELECT
        EXTRACT(EPOCH FROM date_trunc('hour', created_at) +
          (floor(extract(minute FROM created_at) / 30) * interval '30 minutes')) * 1000 as bucket_ms,
        COUNT(DISTINCT ip_address) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND ip_address IS NOT NULL AND created_at > NOW() - INTERVAL '72 hours'
      GROUP BY 1
      ORDER BY bucket_ms ASC
    `;

    const uniqueAnalyzerRealtime = await getDb()`
      SELECT
        EXTRACT(EPOCH FROM date_trunc('hour', created_at) +
          (floor(extract(minute FROM created_at) / 30) * interval '30 minutes')) * 1000 as bucket_ms,
        COUNT(DISTINCT ip_address) as count
      FROM ragecheck_analyses
      WHERE is_bot = false AND ip_address IS NOT NULL AND created_at > NOW() - INTERVAL '72 hours'
      GROUP BY 1
      ORDER BY bucket_ms ASC
    `;

    // Build unique realtime map
    const uniqueRealtimeMap = new Map<string, { uniqueVisitors: number; uniqueAnalyzers: number }>();

    // Initialize same 144 buckets (using same EST-aligned bucket start)
    for (let i = 144; i >= 1; i--) {
      const d = new Date(bucketStart.getTime() - i * 30 * 60 * 1000);
      const timeStr = d.toISOString();
      uniqueRealtimeMap.set(timeStr, { uniqueVisitors: 0, uniqueAnalyzers: 0 });
    }

    for (const row of uniqueVisitorRealtime) {
      const timeStr = new Date(Number(row.bucket_ms)).toISOString();
      const existing = uniqueRealtimeMap.get(timeStr) || { uniqueVisitors: 0, uniqueAnalyzers: 0 };
      existing.uniqueVisitors = Number(row.count);
      uniqueRealtimeMap.set(timeStr, existing);
    }

    for (const row of uniqueAnalyzerRealtime) {
      const timeStr = new Date(Number(row.bucket_ms)).toISOString();
      const existing = uniqueRealtimeMap.get(timeStr) || { uniqueVisitors: 0, uniqueAnalyzers: 0 };
      existing.uniqueAnalyzers = Number(row.count);
      uniqueRealtimeMap.set(timeStr, existing);
    }

    const uniqueRealtimeSeries = Array.from(uniqueRealtimeMap.entries())
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
      uniqueRealtimeSeries,
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
      uniqueRealtimeSeries: [],
    };
  }
}

// Retention Metrics
export interface RetentionMetrics {
  // Cohort retention: for each cohort (users who first visited on a given day), what % returned
  cohortRetention: {
    cohortDate: string;
    cohortSize: number;
    d1: number; // % returned day 1
    d7: number; // % returned by day 7
    d14: number; // % returned by day 14
    d30: number; // % returned by day 30
  }[];
  // Rolling return rate: of users first seen 7+ days ago, what % have visited 2+ times
  rollingReturnRate: {
    windowDays: number;
    eligibleUsers: number;
    returnedUsers: number;
    rate: number;
  };
  // DAU/WAU/MAU stickiness
  stickiness: {
    dau: number;
    wau: number;
    mau: number;
    dauWauRatio: number;
    dauMauRatio: number;
  };
  // Frequency distribution
  frequencyDistribution: {
    visits1: number;
    visits2to3: number;
    visits4to10: number;
    visits10plus: number;
    total: number;
  };
}

export async function getRetentionMetrics(): Promise<RetentionMetrics> {
  try {
    // Cohort retention for last 14 days (need enough time to measure retention)
    const cohortData = await getDb()`
      WITH cohorts AS (
        SELECT
          DATE(MIN(created_at) AT TIME ZONE 'America/New_York') as cohort_date,
          ip_address
        FROM ragecheck_visitors
        WHERE is_bot = false AND ip_address IS NOT NULL
        GROUP BY ip_address
        HAVING DATE(MIN(created_at) AT TIME ZONE 'America/New_York') >= CURRENT_DATE - INTERVAL '30 days'
      ),
      cohort_sizes AS (
        SELECT cohort_date, COUNT(*) as cohort_size
        FROM cohorts
        GROUP BY cohort_date
      ),
      returns AS (
        SELECT
          c.cohort_date,
          c.ip_address,
          MAX(CASE WHEN DATE(v.created_at AT TIME ZONE 'America/New_York') > c.cohort_date THEN 1 ELSE 0 END) as returned_d1,
          MAX(CASE WHEN DATE(v.created_at AT TIME ZONE 'America/New_York') >= c.cohort_date + INTERVAL '7 days' THEN 1 ELSE 0 END) as returned_d7,
          MAX(CASE WHEN DATE(v.created_at AT TIME ZONE 'America/New_York') >= c.cohort_date + INTERVAL '14 days' THEN 1 ELSE 0 END) as returned_d14,
          MAX(CASE WHEN DATE(v.created_at AT TIME ZONE 'America/New_York') >= c.cohort_date + INTERVAL '30 days' THEN 1 ELSE 0 END) as returned_d30
        FROM cohorts c
        LEFT JOIN ragecheck_visitors v ON c.ip_address = v.ip_address AND v.is_bot = false
        GROUP BY c.cohort_date, c.ip_address
      ),
      retention_rates AS (
        SELECT
          r.cohort_date,
          cs.cohort_size,
          ROUND(100.0 * SUM(r.returned_d1) / NULLIF(cs.cohort_size, 0), 1) as d1,
          ROUND(100.0 * SUM(r.returned_d7) / NULLIF(cs.cohort_size, 0), 1) as d7,
          ROUND(100.0 * SUM(r.returned_d14) / NULLIF(cs.cohort_size, 0), 1) as d14,
          ROUND(100.0 * SUM(r.returned_d30) / NULLIF(cs.cohort_size, 0), 1) as d30
        FROM returns r
        JOIN cohort_sizes cs ON r.cohort_date = cs.cohort_date
        GROUP BY r.cohort_date, cs.cohort_size
      )
      SELECT * FROM retention_rates
      ORDER BY cohort_date DESC
      LIMIT 14
    `;

    const cohortRetention = cohortData.map(row => ({
      cohortDate: parseDBDateToEST(row.cohort_date),
      cohortSize: Number(row.cohort_size),
      d1: Number(row.d1) || 0,
      d7: Number(row.d7) || 0,
      d14: Number(row.d14) || 0,
      d30: Number(row.d30) || 0,
    }));

    // Rolling return rate: users first seen 3+ days ago who visited 2+ times
    const [rollingData] = await getDb()`
      WITH user_first_visit AS (
        SELECT
          ip_address,
          MIN(created_at) as first_visit,
          COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/New_York')) as visit_days
        FROM ragecheck_visitors
        WHERE is_bot = false AND ip_address IS NOT NULL
        GROUP BY ip_address
      )
      SELECT
        COUNT(*) as eligible_users,
        SUM(CASE WHEN visit_days >= 2 THEN 1 ELSE 0 END) as returned_users
      FROM user_first_visit
      WHERE first_visit < NOW() - INTERVAL '3 days'
    `;

    const eligibleUsers = Number(rollingData?.eligible_users) || 0;
    const returnedUsers = Number(rollingData?.returned_users) || 0;

    // DAU/WAU/MAU stickiness
    // DAU = Average daily unique users over last 7 complete days (not including today which is incomplete)
    const [dauData] = await getDb()`
      WITH daily_users AS (
        SELECT
          DATE(created_at AT TIME ZONE 'America/New_York') as day,
          COUNT(DISTINCT ip_address) as unique_users
        FROM ragecheck_visitors
        WHERE is_bot = false
          AND ip_address IS NOT NULL
          AND created_at >= NOW() - INTERVAL '8 days'
          AND created_at < DATE_TRUNC('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'
        GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
      )
      SELECT COALESCE(ROUND(AVG(unique_users)), 0) as dau
      FROM daily_users
    `;

    const [wauData] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as wau
      FROM ragecheck_visitors
      WHERE is_bot = false
        AND ip_address IS NOT NULL
        AND created_at >= NOW() - INTERVAL '7 days'
    `;

    const [mauData] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as mau
      FROM ragecheck_visitors
      WHERE is_bot = false
        AND ip_address IS NOT NULL
        AND created_at >= NOW() - INTERVAL '30 days'
    `;

    const dau = Number(dauData?.dau) || 0;
    const wau = Number(wauData?.wau) || 0;
    const mau = Number(mauData?.mau) || 0;

    // Frequency distribution (last 30 days)
    const freqData = await getDb()`
      WITH user_visits AS (
        SELECT
          ip_address,
          COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/New_York')) as visit_days
        FROM ragecheck_visitors
        WHERE is_bot = false
          AND ip_address IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY ip_address
      )
      SELECT
        SUM(CASE WHEN visit_days = 1 THEN 1 ELSE 0 END) as visits_1,
        SUM(CASE WHEN visit_days BETWEEN 2 AND 3 THEN 1 ELSE 0 END) as visits_2_3,
        SUM(CASE WHEN visit_days BETWEEN 4 AND 10 THEN 1 ELSE 0 END) as visits_4_10,
        SUM(CASE WHEN visit_days > 10 THEN 1 ELSE 0 END) as visits_10_plus,
        COUNT(*) as total
      FROM user_visits
    `;

    const freq = freqData[0] || {};

    return {
      cohortRetention,
      rollingReturnRate: {
        windowDays: 3,
        eligibleUsers,
        returnedUsers,
        rate: eligibleUsers > 0 ? Math.round(1000 * returnedUsers / eligibleUsers) / 10 : 0,
      },
      stickiness: {
        dau,
        wau,
        mau,
        dauWauRatio: wau > 0 ? Math.round(1000 * dau / wau) / 10 : 0,
        dauMauRatio: mau > 0 ? Math.round(1000 * dau / mau) / 10 : 0,
      },
      frequencyDistribution: {
        visits1: Number(freq.visits_1) || 0,
        visits2to3: Number(freq.visits_2_3) || 0,
        visits4to10: Number(freq.visits_4_10) || 0,
        visits10plus: Number(freq.visits_10_plus) || 0,
        total: Number(freq.total) || 0,
      },
    };
  } catch (error) {
    console.error("Failed to get retention metrics:", error);
    return {
      cohortRetention: [],
      rollingReturnRate: { windowDays: 7, eligibleUsers: 0, returnedUsers: 0, rate: 0 },
      stickiness: { dau: 0, wau: 0, mau: 0, dauWauRatio: 0, dauMauRatio: 0 },
      frequencyDistribution: { visits1: 0, visits2to3: 0, visits4to10: 0, visits10plus: 0, total: 0 },
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
    // Use EXTRACT(EPOCH) for unambiguous timestamp transfer
    const visitorRealtime = await getDb()`
      SELECT
        EXTRACT(EPOCH FROM date_trunc('hour', created_at) +
          (floor(extract(minute FROM created_at) / 30) * interval '30 minutes')) * 1000 as bucket_ms,
        COUNT(*) as count
      FROM ragecheck_visitors
      WHERE is_bot = false AND page_path = ${pagePath} AND created_at > NOW() - INTERVAL '24 hours'
      GROUP BY 1
      ORDER BY bucket_ms ASC
    `;

    // Merge realtime data into 30-minute buckets (excluding current incomplete bucket)
    const realtimeMap = new Map<string, number>();

    // Helper to get current bucket start (rounded to 30 min)
    const getESTAlignedBucketStart = () => {
      const now = new Date();
      const thirtyMinMs = 30 * 60 * 1000;
      const roundedMs = Math.floor(now.getTime() / thirtyMinMs) * thirtyMinMs;
      return new Date(roundedMs);
    };

    const bucketStart = getESTAlignedBucketStart();
    for (let i = 48; i >= 1; i--) {
      const d = new Date(bucketStart.getTime() - i * 30 * 60 * 1000);
      realtimeMap.set(d.toISOString(), 0);
    }

    for (const row of visitorRealtime) {
      const timeStr = new Date(Number(row.bucket_ms)).toISOString();
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
      dateMap.set(getESTDateString(d), 0);
    }

    for (const row of dailyData) {
      const dateStr = parseDBDateToEST(row.date);
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
  shareType: "copy_link" | "share_button" | "twitter" | "facebook" | "linkedin" | "native" | "other";
  ipAddress?: string;
  referrerCode?: string;
  score?: number;
  platform?: string;
  userAgent?: string;
}

export async function logShare(data: ShareLog) {
  try {
    // Detect platform from user agent if not provided
    const platform = data.platform || (data.userAgent ? detectSharePlatform(data.userAgent) : null);

    await withRetry(async () => {
      await getDb()`
        INSERT INTO ragecheck_shares (url, share_type, ip_address, referrer_code, score, platform, user_agent)
        VALUES (${data.url}, ${data.shareType}, ${data.ipAddress || null}, ${data.referrerCode || null}, ${data.score || null}, ${platform}, ${data.userAgent || null})
      `;
    });
  } catch (error) {
    console.error("Failed to log share:", error);
  }
}

function detectSharePlatform(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("twitter") || ua.includes("x.com")) return "twitter";
  if (ua.includes("facebook") || ua.includes("fb")) return "facebook";
  if (ua.includes("linkedin")) return "linkedin";
  if (ua.includes("reddit")) return "reddit";
  return "unknown";
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
      SELECT url, rating, comment, score, source_domain,
             created_at
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
    // Calculate start of today in EST using JavaScript to avoid SQL timezone issues
    const now = new Date();
    const estOffset = -5; // EST is UTC-5
    const estNow = new Date(now.getTime() + estOffset * 60 * 60 * 1000);
    const estMidnight = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate());
    const todayStartUTC = new Date(estMidnight.getTime() - estOffset * 60 * 60 * 1000);

    const [todaySharesResult] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_shares
      WHERE created_at >= ${todayStartUTC}
    `;

    const [todayUniqueSharersResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count FROM ragecheck_shares
      WHERE created_at >= ${todayStartUTC} AND ip_address IS NOT NULL
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
      trendDates.push(getESTDateString(d));
    }

    const visitorMap = new Map(visitorTrends.map(r => [parseDBDateToEST(r.day), Number(r.count)]));
    const shareMap = new Map(shareTrends.map(r => [parseDBDateToEST(r.day), Number(r.count)]));
    const analysisMap = new Map(analysisTrends.map(r => [parseDBDateToEST(r.day), Number(r.count)]));
    const repeatMap = new Map(repeatVisitorTrends.map(r => [parseDBDateToEST(r.day), Number(r.count)]));

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
      const dateStr = getESTDateString(d);
      trendMap.set(dateStr, { visitors: 0, converted: 0 });
    }

    for (const row of dailyVisitors) {
      const dateStr = parseDBDateToEST(row.date);
      if (trendMap.has(dateStr)) {
        trendMap.get(dateStr)!.visitors = Number(row.count);
      }
    }

    for (const row of dailyConverted) {
      const dateStr = parseDBDateToEST(row.date);
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

// ============================================
// SHARE METRICS (Dedicated Tab)
// ============================================

export interface ShareMetrics {
  // Overview stats
  overview: {
    totalShares: number;
    uniqueSharers: number;
    shareRate: number; // % of analyzers who share
    todayShares: number;
    weekShares: number;
    avgSharesPerSharer: number;
  };
  // Share type breakdown (how people share)
  shareTypes: {
    type: string;
    count: number;
    percentage: number;
  }[];
  // Top shared content (which URLs get shared most)
  topSharedContent: {
    url: string;
    domain: string;
    shareCount: number;
    uniqueSharers: number;
  }[];
  // Sharer segmentation (power sharers vs casual)
  sharerSegmentation: {
    oneTime: number; // shared once
    occasional: number; // shared 2-3 times
    frequent: number; // shared 4-10 times
    power: number; // shared 10+ times
    total: number;
  };
  // Individual sharer details
  sharerDetails: {
    ipMasked: string; // partially masked IP for privacy
    shareCount: number;
    segment: 'one-time' | 'occasional' | 'frequent' | 'power';
    lastShareAt: string;
    firstShareAt: string;
  }[];
  // Score distribution of shared content
  scoreDistribution: {
    low: number; // 0-33
    medium: number; // 34-66
    high: number; // 67-100
    unknown: number; // no score
  };
  // Daily trends
  dailyTrend: {
    date: string;
    shares: number;
    uniqueSharers: number;
  }[];
  // K-factor components
  kFactor: {
    shareRate: number; // % of users who share
    avgSharesPerSharer: number;
    estimatedConversion: number; // estimated conversion from shares
    kFactorValue: number; // shareRate * conversion
  };
}

// Content Insights for understanding what users analyze and share
export interface ContentInsights {
  // Topic distribution
  topicDistribution: {
    topic: string;
    count: number;
    percentage: number;
    avgScore: number;
    shareCount: number;
  }[];
  // Top domains analyzed
  topDomains: {
    domain: string;
    count: number;
    avgScore: number;
    shareCount: number;
  }[];
  // Content type distribution
  contentTypeDistribution: {
    contentType: string;
    count: number;
    percentage: number;
    avgScore: number;
  }[];
  // Source type distribution
  sourceTypeDistribution: {
    sourceType: string;
    count: number;
    percentage: number;
    avgScore: number;
  }[];
  // High-rage topics (topics with highest avg scores)
  highRageTopics: {
    topic: string;
    avgScore: number;
    count: number;
  }[];
  // Most shared topics
  mostSharedTopics: {
    topic: string;
    shareCount: number;
    shareRate: number;
    analyzeCount: number;
  }[];
}

// Acquisition metrics for understanding traffic sources
export interface AcquisitionMetrics {
  // Traffic by source
  sourceBreakdown: {
    source: string;
    visitors: number;
    percentage: number;
    conversions: number;
    conversionRate: number;
  }[];
  // Traffic by medium
  mediumBreakdown: {
    medium: string;
    visitors: number;
    percentage: number;
  }[];
  // Top campaigns
  topCampaigns: {
    campaign: string;
    source: string;
    visitors: number;
    conversions: number;
  }[];
  // Referrer breakdown (non-UTM)
  referrerBreakdown: {
    referrer: string;
    visitors: number;
    percentage: number;
  }[];
  // Summary stats
  summary: {
    totalWithUtm: number;
    totalWithReferrer: number;
    totalDirect: number;
    topSource: string;
    topMedium: string;
  };
}

export async function getAcquisitionMetrics(): Promise<AcquisitionMetrics> {
  try {
    // Admin IPs to exclude
    const adminIPs = (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
    const hasAdminExclusion = adminIPs.length > 0;

    // Get visitors with UTM source breakdown
    const sourceData = hasAdminExclusion
      ? await getDb()`
          SELECT
            COALESCE(utm_source, 'direct') as source,
            COUNT(*) as visitors,
            COUNT(DISTINCT CASE WHEN ip_address IN (
              SELECT DISTINCT ip_address FROM ragecheck_analyses WHERE is_bot = false AND success = true
            ) THEN ip_address END) as conversions
          FROM ragecheck_visitors
          WHERE is_bot = false
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY COALESCE(utm_source, 'direct')
          ORDER BY visitors DESC
          LIMIT 15
        `
      : await getDb()`
          SELECT
            COALESCE(utm_source, 'direct') as source,
            COUNT(*) as visitors,
            COUNT(DISTINCT CASE WHEN ip_address IN (
              SELECT DISTINCT ip_address FROM ragecheck_analyses WHERE is_bot = false AND success = true
            ) THEN ip_address END) as conversions
          FROM ragecheck_visitors
          WHERE is_bot = false
          GROUP BY COALESCE(utm_source, 'direct')
          ORDER BY visitors DESC
          LIMIT 15
        `;

    const totalVisitors = sourceData.reduce((sum, row) => sum + Number(row.visitors), 0);
    const sourceBreakdown = sourceData.map(row => ({
      source: String(row.source),
      visitors: Number(row.visitors),
      percentage: totalVisitors > 0 ? Math.round((Number(row.visitors) / totalVisitors) * 1000) / 10 : 0,
      conversions: Number(row.conversions) || 0,
      conversionRate: Number(row.visitors) > 0 ? Math.round((Number(row.conversions) / Number(row.visitors)) * 1000) / 10 : 0,
    }));

    // Medium breakdown
    const mediumData = hasAdminExclusion
      ? await getDb()`
          SELECT
            COALESCE(utm_medium, 'none') as medium,
            COUNT(*) as visitors
          FROM ragecheck_visitors
          WHERE is_bot = false
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY COALESCE(utm_medium, 'none')
          ORDER BY visitors DESC
          LIMIT 10
        `
      : await getDb()`
          SELECT
            COALESCE(utm_medium, 'none') as medium,
            COUNT(*) as visitors
          FROM ragecheck_visitors
          WHERE is_bot = false
          GROUP BY COALESCE(utm_medium, 'none')
          ORDER BY visitors DESC
          LIMIT 10
        `;

    const mediumBreakdown = mediumData.map(row => ({
      medium: String(row.medium),
      visitors: Number(row.visitors),
      percentage: totalVisitors > 0 ? Math.round((Number(row.visitors) / totalVisitors) * 1000) / 10 : 0,
    }));

    // Top campaigns
    const campaignData = hasAdminExclusion
      ? await getDb()`
          SELECT
            utm_campaign as campaign,
            utm_source as source,
            COUNT(*) as visitors,
            COUNT(DISTINCT CASE WHEN ip_address IN (
              SELECT DISTINCT ip_address FROM ragecheck_analyses WHERE is_bot = false AND success = true
            ) THEN ip_address END) as conversions
          FROM ragecheck_visitors
          WHERE is_bot = false AND utm_campaign IS NOT NULL
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY utm_campaign, utm_source
          ORDER BY visitors DESC
          LIMIT 10
        `
      : await getDb()`
          SELECT
            utm_campaign as campaign,
            utm_source as source,
            COUNT(*) as visitors,
            COUNT(DISTINCT CASE WHEN ip_address IN (
              SELECT DISTINCT ip_address FROM ragecheck_analyses WHERE is_bot = false AND success = true
            ) THEN ip_address END) as conversions
          FROM ragecheck_visitors
          WHERE is_bot = false AND utm_campaign IS NOT NULL
          GROUP BY utm_campaign, utm_source
          ORDER BY visitors DESC
          LIMIT 10
        `;

    const topCampaigns = campaignData.map(row => ({
      campaign: String(row.campaign),
      source: String(row.source || 'unknown'),
      visitors: Number(row.visitors),
      conversions: Number(row.conversions) || 0,
    }));

    // Referrer breakdown (for visitors without UTM)
    const referrerData = hasAdminExclusion
      ? await getDb()`
          SELECT
            CASE
              WHEN referrer IS NULL THEN 'direct'
              WHEN referrer LIKE '%google%' THEN 'google'
              WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.%' THEN 'facebook'
              WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'twitter/x'
              WHEN referrer LIKE '%linkedin%' THEN 'linkedin'
              WHEN referrer LIKE '%reddit%' THEN 'reddit'
              WHEN referrer LIKE '%bing%' THEN 'bing'
              WHEN referrer LIKE '%duckduckgo%' THEN 'duckduckgo'
              ELSE SUBSTRING(referrer FROM 'https?://([^/]+)')
            END as referrer,
            COUNT(*) as visitors
          FROM ragecheck_visitors
          WHERE is_bot = false AND utm_source IS NULL
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY 1
          ORDER BY visitors DESC
          LIMIT 15
        `
      : await getDb()`
          SELECT
            CASE
              WHEN referrer IS NULL THEN 'direct'
              WHEN referrer LIKE '%google%' THEN 'google'
              WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.%' THEN 'facebook'
              WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'twitter/x'
              WHEN referrer LIKE '%linkedin%' THEN 'linkedin'
              WHEN referrer LIKE '%reddit%' THEN 'reddit'
              WHEN referrer LIKE '%bing%' THEN 'bing'
              WHEN referrer LIKE '%duckduckgo%' THEN 'duckduckgo'
              ELSE SUBSTRING(referrer FROM 'https?://([^/]+)')
            END as referrer,
            COUNT(*) as visitors
          FROM ragecheck_visitors
          WHERE is_bot = false AND utm_source IS NULL
          GROUP BY 1
          ORDER BY visitors DESC
          LIMIT 15
        `;

    const referrerTotal = referrerData.reduce((sum, row) => sum + Number(row.visitors), 0);
    const referrerBreakdown = referrerData.map(row => ({
      referrer: String(row.referrer || 'direct'),
      visitors: Number(row.visitors),
      percentage: referrerTotal > 0 ? Math.round((Number(row.visitors) / referrerTotal) * 1000) / 10 : 0,
    }));

    // Summary counts
    const [summaryData] = hasAdminExclusion
      ? await getDb()`
          SELECT
            COUNT(*) FILTER (WHERE utm_source IS NOT NULL) as with_utm,
            COUNT(*) FILTER (WHERE utm_source IS NULL AND referrer IS NOT NULL) as with_referrer,
            COUNT(*) FILTER (WHERE utm_source IS NULL AND referrer IS NULL) as direct
          FROM ragecheck_visitors
          WHERE is_bot = false
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
        `
      : await getDb()`
          SELECT
            COUNT(*) FILTER (WHERE utm_source IS NOT NULL) as with_utm,
            COUNT(*) FILTER (WHERE utm_source IS NULL AND referrer IS NOT NULL) as with_referrer,
            COUNT(*) FILTER (WHERE utm_source IS NULL AND referrer IS NULL) as direct
          FROM ragecheck_visitors
          WHERE is_bot = false
        `;

    return {
      sourceBreakdown,
      mediumBreakdown,
      topCampaigns,
      referrerBreakdown,
      summary: {
        totalWithUtm: Number(summaryData?.with_utm) || 0,
        totalWithReferrer: Number(summaryData?.with_referrer) || 0,
        totalDirect: Number(summaryData?.direct) || 0,
        topSource: sourceBreakdown[0]?.source || 'none',
        topMedium: mediumBreakdown[0]?.medium || 'none',
      },
    };
  } catch (error) {
    console.error("Failed to get acquisition metrics:", error);
    return {
      sourceBreakdown: [],
      mediumBreakdown: [],
      topCampaigns: [],
      referrerBreakdown: [],
      summary: {
        totalWithUtm: 0,
        totalWithReferrer: 0,
        totalDirect: 0,
        topSource: 'none',
        topMedium: 'none',
      },
    };
  }
}

export async function getContentInsights(): Promise<ContentInsights> {
  try {
    // Admin IPs to exclude
    const adminIPs = (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
    const hasAdminExclusion = adminIPs.length > 0;

    // Topic distribution with avg score and share count
    const topicData = hasAdminExclusion
      ? await getDb()`
          SELECT
            a.topic,
            COUNT(*) as count,
            ROUND(AVG(a.score)) as avg_score,
            COUNT(DISTINCT s.id) as share_count
          FROM ragecheck_analyses a
          LEFT JOIN ragecheck_shares s ON a.url = s.url AND s.share_type NOT LIKE '%_clicked'
          WHERE a.is_bot = false AND a.success = true AND a.topic IS NOT NULL
            AND (a.ip_address IS NULL OR a.ip_address != ALL(${adminIPs}))
          GROUP BY a.topic
          ORDER BY count DESC
        `
      : await getDb()`
          SELECT
            a.topic,
            COUNT(*) as count,
            ROUND(AVG(a.score)) as avg_score,
            COUNT(DISTINCT s.id) as share_count
          FROM ragecheck_analyses a
          LEFT JOIN ragecheck_shares s ON a.url = s.url AND s.share_type NOT LIKE '%_clicked'
          WHERE a.is_bot = false AND a.success = true AND a.topic IS NOT NULL
          GROUP BY a.topic
          ORDER BY count DESC
        `;

    const totalWithTopic = topicData.reduce((sum, row) => sum + Number(row.count), 0);
    const topicDistribution = topicData.map(row => ({
      topic: String(row.topic),
      count: Number(row.count),
      percentage: totalWithTopic > 0 ? Math.round((Number(row.count) / totalWithTopic) * 1000) / 10 : 0,
      avgScore: Number(row.avg_score) || 0,
      shareCount: Number(row.share_count) || 0,
    }));

    // Top domains analyzed
    const domainData = hasAdminExclusion
      ? await getDb()`
          SELECT
            a.source_domain as domain,
            COUNT(*) as count,
            ROUND(AVG(a.score)) as avg_score,
            COUNT(DISTINCT s.id) as share_count
          FROM ragecheck_analyses a
          LEFT JOIN ragecheck_shares s ON a.url = s.url AND s.share_type NOT LIKE '%_clicked'
          WHERE a.is_bot = false AND a.success = true AND a.source_domain IS NOT NULL
            AND (a.ip_address IS NULL OR a.ip_address != ALL(${adminIPs}))
          GROUP BY a.source_domain
          ORDER BY count DESC
          LIMIT 20
        `
      : await getDb()`
          SELECT
            a.source_domain as domain,
            COUNT(*) as count,
            ROUND(AVG(a.score)) as avg_score,
            COUNT(DISTINCT s.id) as share_count
          FROM ragecheck_analyses a
          LEFT JOIN ragecheck_shares s ON a.url = s.url AND s.share_type NOT LIKE '%_clicked'
          WHERE a.is_bot = false AND a.success = true AND a.source_domain IS NOT NULL
          GROUP BY a.source_domain
          ORDER BY count DESC
          LIMIT 20
        `;

    const topDomains = domainData.map(row => ({
      domain: String(row.domain),
      count: Number(row.count),
      avgScore: Number(row.avg_score) || 0,
      shareCount: Number(row.share_count) || 0,
    }));

    // Content type distribution
    const contentTypeData = hasAdminExclusion
      ? await getDb()`
          SELECT
            content_type,
            COUNT(*) as count,
            ROUND(AVG(score)) as avg_score
          FROM ragecheck_analyses
          WHERE is_bot = false AND success = true AND content_type IS NOT NULL
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY content_type
          ORDER BY count DESC
        `
      : await getDb()`
          SELECT
            content_type,
            COUNT(*) as count,
            ROUND(AVG(score)) as avg_score
          FROM ragecheck_analyses
          WHERE is_bot = false AND success = true AND content_type IS NOT NULL
          GROUP BY content_type
          ORDER BY count DESC
        `;

    const totalWithContentType = contentTypeData.reduce((sum, row) => sum + Number(row.count), 0);
    const contentTypeDistribution = contentTypeData.map(row => ({
      contentType: String(row.content_type),
      count: Number(row.count),
      percentage: totalWithContentType > 0 ? Math.round((Number(row.count) / totalWithContentType) * 1000) / 10 : 0,
      avgScore: Number(row.avg_score) || 0,
    }));

    // Source type distribution
    const sourceTypeData = hasAdminExclusion
      ? await getDb()`
          SELECT
            source_type,
            COUNT(*) as count,
            ROUND(AVG(score)) as avg_score
          FROM ragecheck_analyses
          WHERE is_bot = false AND success = true AND source_type IS NOT NULL
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY source_type
          ORDER BY count DESC
        `
      : await getDb()`
          SELECT
            source_type,
            COUNT(*) as count,
            ROUND(AVG(score)) as avg_score
          FROM ragecheck_analyses
          WHERE is_bot = false AND success = true AND source_type IS NOT NULL
          GROUP BY source_type
          ORDER BY count DESC
        `;

    const totalWithSourceType = sourceTypeData.reduce((sum, row) => sum + Number(row.count), 0);
    const sourceTypeDistribution = sourceTypeData.map(row => ({
      sourceType: String(row.source_type),
      count: Number(row.count),
      percentage: totalWithSourceType > 0 ? Math.round((Number(row.count) / totalWithSourceType) * 1000) / 10 : 0,
      avgScore: Number(row.avg_score) || 0,
    }));

    // High-rage topics (sorted by avg score)
    const highRageTopics = [...topicDistribution]
      .filter(t => t.count >= 3) // Only topics with enough data
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5)
      .map(t => ({ topic: t.topic, avgScore: t.avgScore, count: t.count }));

    // Most shared topics (by share rate)
    const mostSharedTopics = [...topicDistribution]
      .filter(t => t.count >= 3)
      .map(t => ({
        topic: t.topic,
        shareCount: t.shareCount,
        shareRate: t.count > 0 ? Math.round((t.shareCount / t.count) * 1000) / 10 : 0,
        analyzeCount: t.count,
      }))
      .sort((a, b) => b.shareRate - a.shareRate)
      .slice(0, 5);

    return {
      topicDistribution,
      topDomains,
      contentTypeDistribution,
      sourceTypeDistribution,
      highRageTopics,
      mostSharedTopics,
    };
  } catch (error) {
    console.error("Failed to get content insights:", error);
    return {
      topicDistribution: [],
      topDomains: [],
      contentTypeDistribution: [],
      sourceTypeDistribution: [],
      highRageTopics: [],
      mostSharedTopics: [],
    };
  }
}

export async function getShareMetrics(): Promise<ShareMetrics> {
  try {
    // Filter out click events - only count completed shares
    // Click events end with "_clicked", actual shares are things like "share_image_success", "copy_link", etc.

    // Admin IPs to exclude from share metrics (comma-separated in env var)
    const adminIPs = (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);

    // Build exclusion clause for admin IPs
    const hasAdminExclusion = adminIPs.length > 0;

    // Total shares (excluding click events and admin)
    // Note: Use != ALL(array) instead of NOT IN for Neon template literals
    const [totalSharesResult] = hasAdminExclusion
      ? await getDb()`
          SELECT COUNT(*) as count FROM ragecheck_shares
          WHERE share_type NOT LIKE '%_clicked'
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
        `
      : await getDb()`
          SELECT COUNT(*) as count FROM ragecheck_shares
          WHERE share_type NOT LIKE '%_clicked'
        `;

    // Unique sharers (excluding click events and admin)
    const [uniqueSharersResult] = hasAdminExclusion
      ? await getDb()`
          SELECT COUNT(DISTINCT ip_address) as count FROM ragecheck_shares
          WHERE ip_address IS NOT NULL AND share_type NOT LIKE '%_clicked'
            AND ip_address != ALL(${adminIPs})
        `
      : await getDb()`
          SELECT COUNT(DISTINCT ip_address) as count FROM ragecheck_shares
          WHERE ip_address IS NOT NULL AND share_type NOT LIKE '%_clicked'
        `;

    // Today's shares (excluding click events and admin)
    // Calculate start of today in EST using JavaScript to avoid SQL timezone complexity
    const now = new Date();
    const estOffset = -5; // EST is UTC-5 (ignoring DST for simplicity)
    const estNow = new Date(now.getTime() + estOffset * 60 * 60 * 1000);
    const estMidnight = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate());
    const todayStartUTC = new Date(estMidnight.getTime() - estOffset * 60 * 60 * 1000);

    const [todaySharesResult] = hasAdminExclusion
      ? await getDb()`
          SELECT COUNT(*) as count FROM ragecheck_shares
          WHERE created_at >= ${todayStartUTC}
            AND share_type NOT LIKE '%_clicked'
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
        `
      : await getDb()`
          SELECT COUNT(*) as count FROM ragecheck_shares
          WHERE created_at >= ${todayStartUTC}
            AND share_type NOT LIKE '%_clicked'
        `;

    // This week's shares (excluding click events and admin)
    const [weekSharesResult] = hasAdminExclusion
      ? await getDb()`
          SELECT COUNT(*) as count FROM ragecheck_shares
          WHERE created_at > NOW() - INTERVAL '7 days'
            AND share_type NOT LIKE '%_clicked'
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
        `
      : await getDb()`
          SELECT COUNT(*) as count FROM ragecheck_shares
          WHERE created_at > NOW() - INTERVAL '7 days'
            AND share_type NOT LIKE '%_clicked'
        `;

    // Unique analyzers (for share rate calculation)
    const [uniqueAnalyzersResult] = await getDb()`
      SELECT COUNT(DISTINCT ip_address) as count FROM ragecheck_analyses
      WHERE is_bot = false AND success = true AND ip_address IS NOT NULL
    `;

    const totalShares = Number(totalSharesResult?.count) || 0;
    const uniqueSharers = Number(uniqueSharersResult?.count) || 0;
    const todayShares = Number(todaySharesResult?.count) || 0;
    const weekShares = Number(weekSharesResult?.count) || 0;
    const uniqueAnalyzers = Number(uniqueAnalyzersResult?.count) || 1;
    const shareRate = Math.round((uniqueSharers / uniqueAnalyzers) * 1000) / 10;
    const avgSharesPerSharer = uniqueSharers > 0 ? Math.round((totalShares / uniqueSharers) * 10) / 10 : 0;

    // Share type breakdown (excluding click events and admin)
    const shareTypeData = hasAdminExclusion
      ? await getDb()`
          SELECT share_type, COUNT(*) as count
          FROM ragecheck_shares
          WHERE share_type NOT LIKE '%_clicked'
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY share_type
          ORDER BY count DESC
        `
      : await getDb()`
          SELECT share_type, COUNT(*) as count
          FROM ragecheck_shares
          WHERE share_type NOT LIKE '%_clicked'
          GROUP BY share_type
          ORDER BY count DESC
        `;

    const shareTypes = shareTypeData.map(row => ({
      type: String(row.share_type || "unknown"),
      count: Number(row.count),
      percentage: totalShares > 0 ? Math.round((Number(row.count) / totalShares) * 1000) / 10 : 0,
    }));

    // Top shared content (excluding click events and admin)
    const topSharedData = hasAdminExclusion
      ? await getDb()`
          SELECT
            url,
            COUNT(*) as share_count,
            COUNT(DISTINCT ip_address) as unique_sharers
          FROM ragecheck_shares
          WHERE url IS NOT NULL AND share_type NOT LIKE '%_clicked'
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY url
          ORDER BY share_count DESC
          LIMIT 10
        `
      : await getDb()`
          SELECT
            url,
            COUNT(*) as share_count,
            COUNT(DISTINCT ip_address) as unique_sharers
          FROM ragecheck_shares
          WHERE url IS NOT NULL AND share_type NOT LIKE '%_clicked'
          GROUP BY url
          ORDER BY share_count DESC
          LIMIT 10
        `;

    const topSharedContent = topSharedData.map(row => {
      let domain = "unknown";
      try {
        const urlObj = new URL(String(row.url));
        domain = urlObj.hostname.replace("www.", "");
      } catch {
        domain = "unknown";
      }
      return {
        url: String(row.url),
        domain,
        shareCount: Number(row.share_count),
        uniqueSharers: Number(row.unique_sharers),
      };
    });

    // Sharer segmentation (excluding click events and admin)
    const segmentationData = hasAdminExclusion
      ? await getDb()`
          WITH sharer_counts AS (
            SELECT ip_address, COUNT(*) as share_count
            FROM ragecheck_shares
            WHERE ip_address IS NOT NULL AND share_type NOT LIKE '%_clicked'
              AND ip_address != ALL(${adminIPs})
            GROUP BY ip_address
          )
          SELECT
            SUM(CASE WHEN share_count = 1 THEN 1 ELSE 0 END) as one_time,
            SUM(CASE WHEN share_count BETWEEN 2 AND 3 THEN 1 ELSE 0 END) as occasional,
            SUM(CASE WHEN share_count BETWEEN 4 AND 10 THEN 1 ELSE 0 END) as frequent,
            SUM(CASE WHEN share_count > 10 THEN 1 ELSE 0 END) as power,
            COUNT(*) as total
          FROM sharer_counts
        `
      : await getDb()`
          WITH sharer_counts AS (
            SELECT ip_address, COUNT(*) as share_count
            FROM ragecheck_shares
            WHERE ip_address IS NOT NULL AND share_type NOT LIKE '%_clicked'
            GROUP BY ip_address
          )
          SELECT
            SUM(CASE WHEN share_count = 1 THEN 1 ELSE 0 END) as one_time,
            SUM(CASE WHEN share_count BETWEEN 2 AND 3 THEN 1 ELSE 0 END) as occasional,
            SUM(CASE WHEN share_count BETWEEN 4 AND 10 THEN 1 ELSE 0 END) as frequent,
            SUM(CASE WHEN share_count > 10 THEN 1 ELSE 0 END) as power,
            COUNT(*) as total
          FROM sharer_counts
        `;

    const seg = segmentationData[0] || {};
    const sharerSegmentation = {
      oneTime: Number(seg.one_time) || 0,
      occasional: Number(seg.occasional) || 0,
      frequent: Number(seg.frequent) || 0,
      power: Number(seg.power) || 0,
      total: Number(seg.total) || 0,
    };

    // Individual sharer details (excluding click events, but INCLUDE admin for visibility)
    // Admin can see all sharers including themselves
    const sharerDetailsData = await getDb()`
      SELECT
        ip_address,
        COUNT(*) as share_count,
        MAX(created_at) AT TIME ZONE 'America/New_York' as last_share_at,
        MIN(created_at) AT TIME ZONE 'America/New_York' as first_share_at
      FROM ragecheck_shares
      WHERE ip_address IS NOT NULL AND share_type NOT LIKE '%_clicked'
      GROUP BY ip_address
      ORDER BY share_count DESC
      LIMIT 50
    `;

    const sharerDetails = sharerDetailsData.map(row => {
      const shareCount = Number(row.share_count);
      let segment: 'one-time' | 'occasional' | 'frequent' | 'power' = 'one-time';
      if (shareCount > 10) segment = 'power';
      else if (shareCount >= 4) segment = 'frequent';
      else if (shareCount >= 2) segment = 'occasional';

      // Show full IP (admin dashboard only)
      const ip = String(row.ip_address || '');

      return {
        ipMasked: ip, // Full IP for admin visibility
        shareCount,
        segment,
        lastShareAt: row.last_share_at instanceof Date
          ? row.last_share_at.toISOString()
          : String(row.last_share_at || ''),
        firstShareAt: row.first_share_at instanceof Date
          ? row.first_share_at.toISOString()
          : String(row.first_share_at || ''),
      };
    });

    // Score distribution of shared content (excluding click events and admin)
    const scoreDistData = hasAdminExclusion
      ? await getDb()`
          SELECT
            SUM(CASE WHEN score IS NOT NULL AND score <= 33 THEN 1 ELSE 0 END) as low,
            SUM(CASE WHEN score IS NOT NULL AND score BETWEEN 34 AND 66 THEN 1 ELSE 0 END) as medium,
            SUM(CASE WHEN score IS NOT NULL AND score >= 67 THEN 1 ELSE 0 END) as high,
            SUM(CASE WHEN score IS NULL THEN 1 ELSE 0 END) as unknown
          FROM ragecheck_shares
          WHERE share_type NOT LIKE '%_clicked'
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
        `
      : await getDb()`
          SELECT
            SUM(CASE WHEN score IS NOT NULL AND score <= 33 THEN 1 ELSE 0 END) as low,
            SUM(CASE WHEN score IS NOT NULL AND score BETWEEN 34 AND 66 THEN 1 ELSE 0 END) as medium,
            SUM(CASE WHEN score IS NOT NULL AND score >= 67 THEN 1 ELSE 0 END) as high,
            SUM(CASE WHEN score IS NULL THEN 1 ELSE 0 END) as unknown
          FROM ragecheck_shares
          WHERE share_type NOT LIKE '%_clicked'
        `;

    const scoreDist = scoreDistData[0] || {};
    const scoreDistribution = {
      low: Number(scoreDist.low) || 0,
      medium: Number(scoreDist.medium) || 0,
      high: Number(scoreDist.high) || 0,
      unknown: Number(scoreDist.unknown) || 0,
    };

    // Daily trend (last 14 days, excluding click events and admin)
    const trendData = hasAdminExclusion
      ? await getDb()`
          SELECT
            DATE(created_at AT TIME ZONE 'America/New_York') as day,
            COUNT(*) as shares,
            COUNT(DISTINCT ip_address) as unique_sharers
          FROM ragecheck_shares
          WHERE created_at > NOW() - INTERVAL '14 days'
            AND share_type NOT LIKE '%_clicked'
            AND (ip_address IS NULL OR ip_address != ALL(${adminIPs}))
          GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
          ORDER BY day ASC
        `
      : await getDb()`
          SELECT
            DATE(created_at AT TIME ZONE 'America/New_York') as day,
            COUNT(*) as shares,
            COUNT(DISTINCT ip_address) as unique_sharers
          FROM ragecheck_shares
          WHERE created_at > NOW() - INTERVAL '14 days'
            AND share_type NOT LIKE '%_clicked'
          GROUP BY DATE(created_at AT TIME ZONE 'America/New_York')
          ORDER BY day ASC
        `;

    const dailyTrend = trendData.map(row => ({
      date: parseDBDateToEST(row.day),
      shares: Number(row.shares),
      uniqueSharers: Number(row.unique_sharers),
    }));

    // K-factor estimation
    const [referralVisitsResult] = await getDb()`
      SELECT COUNT(*) as count FROM ragecheck_visitors
      WHERE is_bot = false AND (referrer LIKE '%ragecheck%' OR referrer LIKE '%share%')
    `;
    const referralVisits = Number(referralVisitsResult?.count) || 0;
    const estimatedConversion = totalShares > 0 ? Math.min(referralVisits / totalShares, 1) : 0;
    const kFactorValue = Math.round((shareRate / 100) * estimatedConversion * 1000) / 1000;

    return {
      overview: {
        totalShares,
        uniqueSharers,
        shareRate,
        todayShares,
        weekShares,
        avgSharesPerSharer,
      },
      shareTypes,
      topSharedContent,
      sharerSegmentation,
      sharerDetails,
      scoreDistribution,
      dailyTrend,
      kFactor: {
        shareRate,
        avgSharesPerSharer,
        estimatedConversion: Math.round(estimatedConversion * 1000) / 10,
        kFactorValue,
      },
    };
  } catch (error) {
    console.error("Failed to get share metrics:", error);
    return {
      overview: {
        totalShares: 0,
        uniqueSharers: 0,
        shareRate: 0,
        todayShares: 0,
        weekShares: 0,
        avgSharesPerSharer: 0,
      },
      shareTypes: [],
      topSharedContent: [],
      sharerSegmentation: { oneTime: 0, occasional: 0, frequent: 0, power: 0, total: 0 },
      sharerDetails: [],
      scoreDistribution: { low: 0, medium: 0, high: 0, unknown: 0 },
      dailyTrend: [],
      kFactor: { shareRate: 0, avgSharesPerSharer: 0, estimatedConversion: 0, kFactorValue: 0 },
    };
  }
}

// ==========================================
// INTERACTION TRACKING
// ==========================================

export interface InteractionLog {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  referer?: string;
}

export async function initInteractionsTable(): Promise<void> {
  try {
    await getDb()`
      CREATE TABLE IF NOT EXISTS ragecheck_interactions (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        label VARCHAR(255),
        value INTEGER,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referer TEXT,
        is_bot BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    // Create indexes for fast querying
    await getDb()`
      CREATE INDEX IF NOT EXISTS idx_interactions_category ON ragecheck_interactions(category)
    `;
    await getDb()`
      CREATE INDEX IF NOT EXISTS idx_interactions_action ON ragecheck_interactions(action)
    `;
    await getDb()`
      CREATE INDEX IF NOT EXISTS idx_interactions_created ON ragecheck_interactions(created_at)
    `;
  } catch (error) {
    console.error("Failed to init interactions table:", error);
  }
}

export async function logInteraction(data: InteractionLog): Promise<void> {
  try {
    const isBotUser = isBot(data.userAgent);
    await getDb()`
      INSERT INTO ragecheck_interactions (
        category, action, label, value, metadata, ip_address, user_agent, referer, is_bot
      ) VALUES (
        ${data.category},
        ${data.action},
        ${data.label || null},
        ${data.value || null},
        ${data.metadata ? JSON.stringify(data.metadata) : null},
        ${data.ip || null},
        ${data.userAgent || null},
        ${data.referer || null},
        ${isBotUser}
      )
    `;
  } catch (error) {
    console.error("Failed to log interaction:", error);
  }
}

export interface InteractionStats {
  summary: {
    total: number;
    today: number;
    thisWeek: number;
    uniqueIPs: number;
  };
  byCategory: { category: string; count: number }[];
  byAction: { category: string; action: string; count: number }[];
  topLabels: { label: string; count: number }[];
  navigation: {
    destination: string;
    location: string;
    count: number;
  }[];
  shareCard: {
    action: string;
    count: number;
  }[];
  results: {
    action: string;
    label: string;
    count: number;
  }[];
  inputs: {
    action: string;
    count: number;
  }[];
  externalLinks: {
    destination: string;
    count: number;
  }[];
  hourlyTrend: { hour: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export async function getInteractionStats(): Promise<InteractionStats | null> {
  try {
    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) return null;

    // Initialize table if needed
    await initInteractionsTable();

    // Summary stats
    const summaryResult = await getDb()`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND NOT is_bot) as today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND NOT is_bot) as this_week,
        COUNT(DISTINCT ip_address) FILTER (WHERE NOT is_bot) as unique_ips
      FROM ragecheck_interactions
    `;
    const summary = summaryResult[0] || { total: 0, today: 0, this_week: 0, unique_ips: 0 };

    // By category
    const byCategory = await getDb()`
      SELECT category, COUNT(*) as count
      FROM ragecheck_interactions
      WHERE NOT is_bot
      GROUP BY category
      ORDER BY count DESC
    `;

    // By action (top 20)
    const byAction = await getDb()`
      SELECT category, action, COUNT(*) as count
      FROM ragecheck_interactions
      WHERE NOT is_bot
      GROUP BY category, action
      ORDER BY count DESC
      LIMIT 20
    `;

    // Top labels
    const topLabels = await getDb()`
      SELECT label, COUNT(*) as count
      FROM ragecheck_interactions
      WHERE label IS NOT NULL AND NOT is_bot
      GROUP BY label
      ORDER BY count DESC
      LIMIT 15
    `;

    // Navigation breakdown
    const navigation = await getDb()`
      SELECT
        label as destination,
        metadata->>'location' as location,
        COUNT(*) as count
      FROM ragecheck_interactions
      WHERE category = 'navigation' AND NOT is_bot
      GROUP BY label, metadata->>'location'
      ORDER BY count DESC
    `;

    // Share card breakdown
    const shareCard = await getDb()`
      SELECT action, COUNT(*) as count
      FROM ragecheck_interactions
      WHERE category = 'share_card' AND NOT is_bot
      GROUP BY action
      ORDER BY count DESC
    `;

    // Results interactions
    const results = await getDb()`
      SELECT action, COALESCE(label, 'none') as label, COUNT(*) as count
      FROM ragecheck_interactions
      WHERE category = 'results' AND NOT is_bot
      GROUP BY action, label
      ORDER BY count DESC
      LIMIT 20
    `;

    // Input interactions
    const inputs = await getDb()`
      SELECT action, COUNT(*) as count
      FROM ragecheck_interactions
      WHERE category = 'input' AND NOT is_bot
      GROUP BY action
      ORDER BY count DESC
    `;

    // External links
    const externalLinks = await getDb()`
      SELECT label as destination, COUNT(*) as count
      FROM ragecheck_interactions
      WHERE category = 'external_link' AND NOT is_bot
      GROUP BY label
      ORDER BY count DESC
    `;

    // Hourly trend (last 24 hours)
    const hourlyTrend = await getDb()`
      SELECT
        TO_CHAR(created_at, 'HH24:00') as hour,
        COUNT(*) as count
      FROM ragecheck_interactions
      WHERE created_at >= NOW() - INTERVAL '24 hours' AND NOT is_bot
      GROUP BY TO_CHAR(created_at, 'HH24:00')
      ORDER BY hour
    `;

    // Daily trend (last 30 days)
    const dailyTrend = await getDb()`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM ragecheck_interactions
      WHERE created_at >= NOW() - INTERVAL '30 days' AND NOT is_bot
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date
    `;

    return {
      summary: {
        total: Number(summary.total) || 0,
        today: Number(summary.today) || 0,
        thisWeek: Number(summary.this_week) || 0,
        uniqueIPs: Number(summary.unique_ips) || 0,
      },
      byCategory: byCategory.map((r) => ({
        category: r.category as string,
        count: Number(r.count),
      })),
      byAction: byAction.map((r) => ({
        category: r.category as string,
        action: r.action as string,
        count: Number(r.count),
      })),
      topLabels: topLabels.map((r) => ({
        label: r.label as string,
        count: Number(r.count),
      })),
      navigation: navigation.map((r) => ({
        destination: r.destination as string,
        location: (r.location as string) || "unknown",
        count: Number(r.count),
      })),
      shareCard: shareCard.map((r) => ({
        action: r.action as string,
        count: Number(r.count),
      })),
      results: results.map((r) => ({
        action: r.action as string,
        label: r.label as string,
        count: Number(r.count),
      })),
      inputs: inputs.map((r) => ({
        action: r.action as string,
        count: Number(r.count),
      })),
      externalLinks: externalLinks.map((r) => ({
        destination: r.destination as string,
        count: Number(r.count),
      })),
      hourlyTrend: hourlyTrend.map((r) => ({
        hour: r.hour as string,
        count: Number(r.count),
      })),
      dailyTrend: dailyTrend.map((r) => ({
        date: r.date as string,
        count: Number(r.count),
      })),
    };
  } catch (error) {
    console.error("Failed to get interaction stats:", error);
    return null;
  }
}

// ============================================
// LANGUAGE STATS
// ============================================

export interface LanguageStats {
  totalWithLanguage: number;
  byLanguage: { language: string; count: number; percentage: number }[];
  dailyTrend: { date: string; language: string; count: number }[];
  topLanguagesToday: { language: string; count: number }[];
}

export async function getLanguageStats(): Promise<LanguageStats | null> {
  try {
    await initDB();

    // Total analyses with language set (non-English)
    const [totalResult] = await getDb()`
      SELECT COUNT(*) as count
      FROM ragecheck_analyses
      WHERE language IS NOT NULL
        AND is_bot = false
        AND created_at > NOW() - INTERVAL '30 days'
    `;

    // Breakdown by language (last 30 days)
    const byLanguage = await getDb()`
      SELECT
        COALESCE(language, 'English') as language,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND success = true
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY COALESCE(language, 'English')
      ORDER BY count DESC
    `;

    // Daily trend by language (last 14 days, top 5 languages)
    const dailyTrend = await getDb()`
      WITH top_languages AS (
        SELECT COALESCE(language, 'English') as language
        FROM ragecheck_analyses
        WHERE is_bot = false
          AND success = true
          AND created_at > NOW() - INTERVAL '14 days'
        GROUP BY COALESCE(language, 'English')
        ORDER BY COUNT(*) DESC
        LIMIT 5
      )
      SELECT
        DATE(created_at) as date,
        COALESCE(language, 'English') as language,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND success = true
        AND created_at > NOW() - INTERVAL '14 days'
        AND COALESCE(language, 'English') IN (SELECT language FROM top_languages)
      GROUP BY DATE(created_at), COALESCE(language, 'English')
      ORDER BY date DESC, count DESC
    `;

    // Top languages today
    const topToday = await getDb()`
      SELECT
        COALESCE(language, 'English') as language,
        COUNT(*) as count
      FROM ragecheck_analyses
      WHERE is_bot = false
        AND success = true
        AND DATE(created_at) = CURRENT_DATE
      GROUP BY COALESCE(language, 'English')
      ORDER BY count DESC
      LIMIT 10
    `;

    const total = Number(totalResult?.count || 0);
    const totalAll = byLanguage.reduce((sum, r) => sum + Number(r.count), 0);

    return {
      totalWithLanguage: total,
      byLanguage: byLanguage.map((r) => ({
        language: r.language as string,
        count: Number(r.count),
        percentage: totalAll > 0 ? Math.round((Number(r.count) / totalAll) * 100) : 0,
      })),
      dailyTrend: dailyTrend.map((r) => ({
        date: r.date as string,
        language: r.language as string,
        count: Number(r.count),
      })),
      topLanguagesToday: topToday.map((r) => ({
        language: r.language as string,
        count: Number(r.count),
      })),
    };
  } catch (error) {
    console.error("Failed to get language stats:", error);
    return null;
  }
}

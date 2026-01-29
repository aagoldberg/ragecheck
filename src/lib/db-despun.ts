/**
 * Despun Analytics Database Tables
 *
 * Analytics platform tables for Despun/Clearview.
 * Note: Clearview cache data lives in ragecheck_clearview (not duplicated here).
 *
 * Tables:
 * - despun_analytics_events: Granular event tracking
 * - despun_sessions: Session aggregation
 * - despun_daily_metrics: Pre-aggregated daily rollups
 * - despun_story_performance: Per-story metrics
 * - despun_newsletter_signups: Newsletter subscription tracking
 * - despun_ab_tests: A/B testing framework
 * - despun_system_health: Infrastructure monitoring
 */

import { getDb, withRetry } from "./db";

// =============================================================================
// TYPES
// =============================================================================

export type DespunEventType =
  | "pageview"
  | "story_view"
  | "story_expand"
  | "source_click"
  | "scroll_depth"
  | "time_on_page";

export interface DespunAnalyticsEvent {
  id: number;
  eventType: DespunEventType;
  sessionId: string;
  visitorId: string;
  pagePath: string;
  storyId: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  scrollDepth: number | null;
  timeOnPage: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface DespunSession {
  id: number;
  sessionId: string;
  visitorId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  pageCount: number;
  storiesViewed: number;
  storiesExpanded: number;
  sourcesClicked: number;
  entryPage: string;
  exitPage: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  isBounce: boolean;
  isReturnVisitor: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface DespunDailyMetrics {
  id: number;
  date: string;
  pageviews: number;
  uniqueVisitors: number;
  sessions: number;
  newVisitors: number;
  returnVisitors: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  avgScrollDepth: number;
  totalStoryViews: number;
  totalStoryExpands: number;
  totalSourceClicks: number;
  trafficSources: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  geoBreakdown: Record<string, number>;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface DespunStoryPerformance {
  id: number;
  storyId: string;
  storyTopic: string | null;
  date: string;
  views: number;
  uniqueViewers: number;
  expands: number;
  expandRate: number;
  avgTimeOnStory: number;
  avgScrollDepth: number;
  sourceClicks: number;
  sourceClicksBreakdown: Record<string, number>;
  createdAt: Date;
}

export interface DespunNewsletterSignup {
  id: number;
  email: string;
  signupSource: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  visitorId: string | null;
  sessionId: string | null;
  status: "active" | "unsubscribed" | "bounced";
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
}

export interface DespunABTest {
  id: number;
  testName: string;
  testDescription: string | null;
  variants: { id: string; name: string }[];
  targetMetric: string;
  trafficAllocation: number;
  status: "draft" | "running" | "paused" | "completed";
  startedAt: Date | null;
  endedAt: Date | null;
  winnerVariant: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface DespunSystemHealth {
  id: number;
  timestamp: Date;
  apiResponseTimeAvg: number;
  apiResponseTimeP95: number;
  apiErrorRate: number;
  apiRequestsTotal: number;
  cacheHitRate: number;
  cacheSizeMb: number;
  rssFeedsStatus: Record<string, unknown>;
  rssFeedsHealthy: number;
  rssFeedsTotal: number;
  llmRequests: number;
  llmAvgLatency: number;
  llmErrors: number;
  llmTokensUsed: number;
  dbQueryTimeAvg: number;
  dbConnectionsActive: number;
  createdAt: Date;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

export async function initDespunTables() {
  // Analytics events - granular event tracking
  await getDb()`
    CREATE TABLE IF NOT EXISTS despun_analytics_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      session_id VARCHAR(64) NOT NULL,
      visitor_id VARCHAR(64) NOT NULL,
      page_path VARCHAR(255),
      story_id VARCHAR(100),
      referrer VARCHAR(500),
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      utm_campaign VARCHAR(100),
      device_type VARCHAR(20),
      browser VARCHAR(50),
      os VARCHAR(20),
      country VARCHAR(2),
      region VARCHAR(100),
      city VARCHAR(100),
      scroll_depth INTEGER,
      time_on_page INTEGER,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_events_session ON despun_analytics_events(session_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_events_visitor ON despun_analytics_events(visitor_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_events_story ON despun_analytics_events(story_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_events_created ON despun_analytics_events(created_at DESC)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_events_type ON despun_analytics_events(event_type)`;

  // Sessions - aggregated user journeys
  await getDb()`
    CREATE TABLE IF NOT EXISTS despun_sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(64) UNIQUE NOT NULL,
      visitor_id VARCHAR(64) NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ,
      duration_seconds INTEGER,
      page_count INTEGER DEFAULT 0,
      stories_viewed INTEGER DEFAULT 0,
      stories_expanded INTEGER DEFAULT 0,
      sources_clicked INTEGER DEFAULT 0,
      entry_page VARCHAR(255),
      exit_page VARCHAR(255),
      referrer VARCHAR(500),
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      device_type VARCHAR(20),
      browser VARCHAR(50),
      os VARCHAR(20),
      country VARCHAR(2),
      is_bounce BOOLEAN DEFAULT FALSE,
      is_return_visitor BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_sessions_visitor ON despun_sessions(visitor_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_sessions_started ON despun_sessions(started_at DESC)`;

  // Daily metrics - pre-aggregated rollups
  await getDb()`
    CREATE TABLE IF NOT EXISTS despun_daily_metrics (
      id SERIAL PRIMARY KEY,
      date DATE UNIQUE NOT NULL,
      pageviews INTEGER DEFAULT 0,
      unique_visitors INTEGER DEFAULT 0,
      sessions INTEGER DEFAULT 0,
      new_visitors INTEGER DEFAULT 0,
      return_visitors INTEGER DEFAULT 0,
      avg_session_duration DECIMAL DEFAULT 0,
      avg_pages_per_session DECIMAL DEFAULT 0,
      bounce_rate DECIMAL DEFAULT 0,
      avg_scroll_depth DECIMAL DEFAULT 0,
      total_story_views INTEGER DEFAULT 0,
      total_story_expands INTEGER DEFAULT 0,
      total_source_clicks INTEGER DEFAULT 0,
      traffic_sources JSONB DEFAULT '{}',
      device_breakdown JSONB DEFAULT '{}',
      geo_breakdown JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_daily_date ON despun_daily_metrics(date DESC)`;

  // Story performance - per-story metrics
  await getDb()`
    CREATE TABLE IF NOT EXISTS despun_story_performance (
      id SERIAL PRIMARY KEY,
      story_id VARCHAR(100) NOT NULL,
      story_topic VARCHAR(500),
      date DATE NOT NULL,
      views INTEGER DEFAULT 0,
      unique_viewers INTEGER DEFAULT 0,
      expands INTEGER DEFAULT 0,
      expand_rate DECIMAL DEFAULT 0,
      avg_time_on_story DECIMAL DEFAULT 0,
      avg_scroll_depth DECIMAL DEFAULT 0,
      source_clicks INTEGER DEFAULT 0,
      source_clicks_breakdown JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(story_id, date)
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_story_id ON despun_story_performance(story_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_story_date ON despun_story_performance(date DESC)`;

  // Newsletter signups
  await getDb()`
    CREATE TABLE IF NOT EXISTS despun_newsletter_signups (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      signup_source VARCHAR(100),
      referrer VARCHAR(500),
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      utm_campaign VARCHAR(100),
      visitor_id VARCHAR(64),
      session_id VARCHAR(64),
      status VARCHAR(20) DEFAULT 'active',
      confirmed_at TIMESTAMPTZ,
      unsubscribed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // A/B tests
  await getDb()`
    CREATE TABLE IF NOT EXISTS despun_ab_tests (
      id SERIAL PRIMARY KEY,
      test_name VARCHAR(100) UNIQUE NOT NULL,
      test_description TEXT,
      variants JSONB DEFAULT '[]',
      target_metric VARCHAR(100),
      traffic_allocation DECIMAL(3,2) DEFAULT 1.00,
      status VARCHAR(20) DEFAULT 'draft',
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      winner_variant VARCHAR(10),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // System health monitoring
  await getDb()`
    CREATE TABLE IF NOT EXISTS despun_system_health (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL,
      api_response_time_avg INTEGER,
      api_response_time_p95 INTEGER,
      api_error_rate DECIMAL(5,4),
      api_requests_total INTEGER,
      cache_hit_rate DECIMAL(5,4),
      cache_size_mb DECIMAL(10,2),
      rss_feeds_status JSONB,
      rss_feeds_healthy INTEGER,
      rss_feeds_total INTEGER,
      llm_requests INTEGER,
      llm_avg_latency INTEGER,
      llm_errors INTEGER,
      llm_tokens_used INTEGER,
      db_query_time_avg INTEGER,
      db_connections_active INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_despun_health_ts ON despun_system_health(timestamp DESC)`;
}

// =============================================================================
// ANALYTICS EVENTS
// =============================================================================

export async function logDespunEvent(event: {
  eventType: DespunEventType;
  sessionId: string;
  visitorId: string;
  pagePath?: string;
  storyId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  scrollDepth?: number;
  timeOnPage?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO despun_analytics_events (
          event_type, session_id, visitor_id, page_path, story_id,
          referrer, utm_source, utm_medium, utm_campaign,
          device_type, browser, os, country, region, city,
          scroll_depth, time_on_page, metadata
        ) VALUES (
          ${event.eventType}, ${event.sessionId}, ${event.visitorId},
          ${event.pagePath || null}, ${event.storyId || null},
          ${event.referrer || null}, ${event.utmSource || null},
          ${event.utmMedium || null}, ${event.utmCampaign || null},
          ${event.deviceType || null}, ${event.browser || null},
          ${event.os || null}, ${event.country || null},
          ${event.region || null}, ${event.city || null},
          ${event.scrollDepth || null}, ${event.timeOnPage || null},
          ${event.metadata ? JSON.stringify(event.metadata) : null}::jsonb
        )
      `;
    });
  } catch (error) {
    console.error("Failed to log despun event:", error);
  }
}

export async function getDespunEvents(filters: {
  sessionId?: string;
  visitorId?: string;
  storyId?: string;
  eventType?: DespunEventType;
  since?: Date;
  limit?: number;
}): Promise<DespunAnalyticsEvent[]> {
  const limit = filters.limit || 100;
  const rows = await withRetry(async () => {
    if (filters.sessionId) {
      return await getDb()`
        SELECT * FROM despun_analytics_events
        WHERE session_id = ${filters.sessionId}
        ORDER BY created_at ASC
        LIMIT ${limit}
      `;
    }
    if (filters.visitorId) {
      return await getDb()`
        SELECT * FROM despun_analytics_events
        WHERE visitor_id = ${filters.visitorId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }
    if (filters.storyId) {
      return await getDb()`
        SELECT * FROM despun_analytics_events
        WHERE story_id = ${filters.storyId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }
    return await getDb()`
      SELECT * FROM despun_analytics_events
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  });
  return rows.map(mapEvent);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(row: any): DespunAnalyticsEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    sessionId: row.session_id,
    visitorId: row.visitor_id,
    pagePath: row.page_path,
    storyId: row.story_id,
    referrer: row.referrer,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    deviceType: row.device_type,
    browser: row.browser,
    os: row.os,
    country: row.country,
    region: row.region,
    city: row.city,
    scrollDepth: row.scroll_depth,
    timeOnPage: row.time_on_page,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
  };
}

// =============================================================================
// SESSIONS
// =============================================================================

export async function upsertSession(session: {
  sessionId: string;
  visitorId: string;
  entryPage: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  isReturnVisitor?: boolean;
}): Promise<void> {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO despun_sessions (
          session_id, visitor_id, started_at, entry_page,
          referrer, utm_source, utm_medium, device_type, browser, os,
          country, is_return_visitor, page_count
        ) VALUES (
          ${session.sessionId}, ${session.visitorId}, NOW(),
          ${session.entryPage}, ${session.referrer || null},
          ${session.utmSource || null}, ${session.utmMedium || null},
          ${session.deviceType || null}, ${session.browser || null},
          ${session.os || null}, ${session.country || null},
          ${session.isReturnVisitor || false}, 1
        )
        ON CONFLICT (session_id) DO UPDATE SET
          page_count = despun_sessions.page_count + 1,
          exit_page = ${session.entryPage},
          ended_at = NOW(),
          duration_seconds = EXTRACT(EPOCH FROM (NOW() - despun_sessions.started_at))::INTEGER,
          updated_at = NOW()
      `;
    });
  } catch (error) {
    console.error("Failed to upsert session:", error);
  }
}

export async function updateSessionEngagement(
  sessionId: string,
  engagement: {
    storyViewed?: boolean;
    storyExpanded?: boolean;
    sourceClicked?: boolean;
  }
): Promise<void> {
  try {
    const updates: string[] = [];
    if (engagement.storyViewed) updates.push("stories_viewed = stories_viewed + 1");
    if (engagement.storyExpanded) updates.push("stories_expanded = stories_expanded + 1");
    if (engagement.sourceClicked) updates.push("sources_clicked = sources_clicked + 1");
    if (updates.length === 0) return;

    // Use individual updates since we can't template column updates
    if (engagement.storyViewed) {
      await getDb()`
        UPDATE despun_sessions SET stories_viewed = stories_viewed + 1, updated_at = NOW()
        WHERE session_id = ${sessionId}
      `;
    }
    if (engagement.storyExpanded) {
      await getDb()`
        UPDATE despun_sessions SET stories_expanded = stories_expanded + 1, updated_at = NOW()
        WHERE session_id = ${sessionId}
      `;
    }
    if (engagement.sourceClicked) {
      await getDb()`
        UPDATE despun_sessions SET sources_clicked = sources_clicked + 1, updated_at = NOW()
        WHERE session_id = ${sessionId}
      `;
    }
  } catch (error) {
    console.error("Failed to update session engagement:", error);
  }
}

export async function markSessionBounce(sessionId: string): Promise<void> {
  try {
    await getDb()`
      UPDATE despun_sessions SET is_bounce = TRUE, updated_at = NOW()
      WHERE session_id = ${sessionId} AND page_count <= 1
    `;
  } catch (error) {
    console.error("Failed to mark session bounce:", error);
  }
}

// =============================================================================
// DAILY METRICS (aggregation)
// =============================================================================

export async function aggregateDailyMetrics(date: string): Promise<void> {
  try {
    // Count events by type for the given date
    const [pageviews] = await getDb()`
      SELECT COUNT(*) as count FROM despun_analytics_events
      WHERE event_type = 'pageview'
        AND created_at::date = ${date}::date
    `;
    const [uniqueVisitors] = await getDb()`
      SELECT COUNT(DISTINCT visitor_id) as count FROM despun_analytics_events
      WHERE created_at::date = ${date}::date
    `;
    const [sessionCount] = await getDb()`
      SELECT COUNT(*) as count FROM despun_sessions
      WHERE started_at::date = ${date}::date
    `;
    const [avgDuration] = await getDb()`
      SELECT COALESCE(AVG(duration_seconds), 0) as avg FROM despun_sessions
      WHERE started_at::date = ${date}::date AND duration_seconds IS NOT NULL
    `;
    const [bounceCount] = await getDb()`
      SELECT COUNT(*) as count FROM despun_sessions
      WHERE started_at::date = ${date}::date AND is_bounce = TRUE
    `;
    const [storyViews] = await getDb()`
      SELECT COUNT(*) as count FROM despun_analytics_events
      WHERE event_type = 'story_view' AND created_at::date = ${date}::date
    `;
    const [storyExpands] = await getDb()`
      SELECT COUNT(*) as count FROM despun_analytics_events
      WHERE event_type = 'story_expand' AND created_at::date = ${date}::date
    `;
    const [sourceClicks] = await getDb()`
      SELECT COUNT(*) as count FROM despun_analytics_events
      WHERE event_type = 'source_click' AND created_at::date = ${date}::date
    `;

    const sessions = parseInt(sessionCount?.count || "0");
    const bounces = parseInt(bounceCount?.count || "0");
    const pv = parseInt(pageviews?.count || "0");
    const bounceRate = sessions > 0 ? bounces / sessions : 0;
    const avgPages = sessions > 0 ? pv / sessions : 0;

    // Traffic sources breakdown
    const trafficRows = await getDb()`
      SELECT COALESCE(utm_source, referrer, 'direct') as source, COUNT(*) as count
      FROM despun_sessions
      WHERE started_at::date = ${date}::date
      GROUP BY COALESCE(utm_source, referrer, 'direct')
    `;
    const trafficSources: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of trafficRows as any[]) {
      trafficSources[row.source] = parseInt(row.count);
    }

    // Device breakdown
    const deviceRows = await getDb()`
      SELECT COALESCE(device_type, 'unknown') as device, COUNT(*) as count
      FROM despun_sessions
      WHERE started_at::date = ${date}::date
      GROUP BY COALESCE(device_type, 'unknown')
    `;
    const deviceBreakdown: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of deviceRows as any[]) {
      deviceBreakdown[row.device] = parseInt(row.count);
    }

    // Geo breakdown
    const geoRows = await getDb()`
      SELECT COALESCE(country, 'unknown') as country, COUNT(*) as count
      FROM despun_sessions
      WHERE started_at::date = ${date}::date
      GROUP BY COALESCE(country, 'unknown')
    `;
    const geoBreakdown: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of geoRows as any[]) {
      geoBreakdown[row.country] = parseInt(row.count);
    }

    // New vs return
    const [newVisitors] = await getDb()`
      SELECT COUNT(*) as count FROM despun_sessions
      WHERE started_at::date = ${date}::date AND is_return_visitor = FALSE
    `;
    const [returnVisitors] = await getDb()`
      SELECT COUNT(*) as count FROM despun_sessions
      WHERE started_at::date = ${date}::date AND is_return_visitor = TRUE
    `;

    await getDb()`
      INSERT INTO despun_daily_metrics (
        date, pageviews, unique_visitors, sessions, new_visitors, return_visitors,
        avg_session_duration, avg_pages_per_session, bounce_rate,
        total_story_views, total_story_expands, total_source_clicks,
        traffic_sources, device_breakdown, geo_breakdown
      ) VALUES (
        ${date}::date, ${pv}, ${parseInt(uniqueVisitors?.count || "0")},
        ${sessions}, ${parseInt(newVisitors?.count || "0")},
        ${parseInt(returnVisitors?.count || "0")},
        ${parseFloat(avgDuration?.avg || "0")}, ${avgPages}, ${bounceRate},
        ${parseInt(storyViews?.count || "0")},
        ${parseInt(storyExpands?.count || "0")},
        ${parseInt(sourceClicks?.count || "0")},
        ${JSON.stringify(trafficSources)}::jsonb,
        ${JSON.stringify(deviceBreakdown)}::jsonb,
        ${JSON.stringify(geoBreakdown)}::jsonb
      )
      ON CONFLICT (date) DO UPDATE SET
        pageviews = EXCLUDED.pageviews,
        unique_visitors = EXCLUDED.unique_visitors,
        sessions = EXCLUDED.sessions,
        new_visitors = EXCLUDED.new_visitors,
        return_visitors = EXCLUDED.return_visitors,
        avg_session_duration = EXCLUDED.avg_session_duration,
        avg_pages_per_session = EXCLUDED.avg_pages_per_session,
        bounce_rate = EXCLUDED.bounce_rate,
        total_story_views = EXCLUDED.total_story_views,
        total_story_expands = EXCLUDED.total_story_expands,
        total_source_clicks = EXCLUDED.total_source_clicks,
        traffic_sources = EXCLUDED.traffic_sources,
        device_breakdown = EXCLUDED.device_breakdown,
        geo_breakdown = EXCLUDED.geo_breakdown,
        updated_at = NOW()
    `;
  } catch (error) {
    console.error("Failed to aggregate daily metrics:", error);
  }
}

export async function getDailyMetrics(
  daysBack: number = 30
): Promise<DespunDailyMetrics[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM despun_daily_metrics
      WHERE date > NOW()::date - ${daysBack}
      ORDER BY date DESC
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    date: row.date,
    pageviews: row.pageviews,
    uniqueVisitors: row.unique_visitors,
    sessions: row.sessions,
    newVisitors: row.new_visitors,
    returnVisitors: row.return_visitors,
    avgSessionDuration: parseFloat(row.avg_session_duration || "0"),
    avgPagesPerSession: parseFloat(row.avg_pages_per_session || "0"),
    bounceRate: parseFloat(row.bounce_rate || "0"),
    avgScrollDepth: parseFloat(row.avg_scroll_depth || "0"),
    totalStoryViews: row.total_story_views,
    totalStoryExpands: row.total_story_expands,
    totalSourceClicks: row.total_source_clicks,
    trafficSources: row.traffic_sources || {},
    deviceBreakdown: row.device_breakdown || {},
    geoBreakdown: row.geo_breakdown || {},
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  }));
}

// =============================================================================
// STORY PERFORMANCE
// =============================================================================

export async function upsertStoryPerformance(perf: {
  storyId: string;
  storyTopic?: string;
  date: string;
  views?: number;
  uniqueViewers?: number;
  expands?: number;
  sourceClicks?: number;
  sourceClicksBreakdown?: Record<string, number>;
}): Promise<void> {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO despun_story_performance (
          story_id, story_topic, date, views, unique_viewers,
          expands, source_clicks, source_clicks_breakdown
        ) VALUES (
          ${perf.storyId}, ${perf.storyTopic || null}, ${perf.date}::date,
          ${perf.views || 0}, ${perf.uniqueViewers || 0},
          ${perf.expands || 0}, ${perf.sourceClicks || 0},
          ${JSON.stringify(perf.sourceClicksBreakdown || {})}::jsonb
        )
        ON CONFLICT (story_id, date) DO UPDATE SET
          views = despun_story_performance.views + EXCLUDED.views,
          unique_viewers = GREATEST(despun_story_performance.unique_viewers, EXCLUDED.unique_viewers),
          expands = despun_story_performance.expands + EXCLUDED.expands,
          source_clicks = despun_story_performance.source_clicks + EXCLUDED.source_clicks
      `;
    });
  } catch (error) {
    console.error("Failed to upsert story performance:", error);
  }
}

export async function getTopStories(
  daysBack: number = 7,
  limit: number = 20
): Promise<DespunStoryPerformance[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM despun_story_performance
      WHERE date > NOW()::date - ${daysBack}
      ORDER BY views DESC
      LIMIT ${limit}
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    storyId: row.story_id,
    storyTopic: row.story_topic,
    date: row.date,
    views: row.views,
    uniqueViewers: row.unique_viewers,
    expands: row.expands,
    expandRate: parseFloat(row.expand_rate || "0"),
    avgTimeOnStory: parseFloat(row.avg_time_on_story || "0"),
    avgScrollDepth: parseFloat(row.avg_scroll_depth || "0"),
    sourceClicks: row.source_clicks,
    sourceClicksBreakdown: row.source_clicks_breakdown || {},
    createdAt: new Date(row.created_at),
  }));
}

// =============================================================================
// NEWSLETTER SIGNUPS
// =============================================================================

export async function logNewsletterSignup(signup: {
  email: string;
  signupSource?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  visitorId?: string;
  sessionId?: string;
}): Promise<{ id: number; isNew: boolean }> {
  try {
    const [existing] = await getDb()`
      SELECT id FROM despun_newsletter_signups WHERE email = ${signup.email}
    `;
    if (existing) {
      return { id: existing.id, isNew: false };
    }
    const [row] = await withRetry(async () => {
      return await getDb()`
        INSERT INTO despun_newsletter_signups (
          email, signup_source, referrer, utm_source, utm_medium,
          utm_campaign, visitor_id, session_id
        ) VALUES (
          ${signup.email}, ${signup.signupSource || null},
          ${signup.referrer || null}, ${signup.utmSource || null},
          ${signup.utmMedium || null}, ${signup.utmCampaign || null},
          ${signup.visitorId || null}, ${signup.sessionId || null}
        )
        RETURNING id
      `;
    });
    return { id: row.id, isNew: true };
  } catch (error) {
    console.error("Failed to log newsletter signup:", error);
    return { id: 0, isNew: false };
  }
}

export async function updateNewsletterStatus(
  email: string,
  status: "active" | "unsubscribed" | "bounced"
): Promise<void> {
  await withRetry(async () => {
    if (status === "unsubscribed") {
      await getDb()`
        UPDATE despun_newsletter_signups
        SET status = ${status}, unsubscribed_at = NOW()
        WHERE email = ${email}
      `;
    } else {
      await getDb()`
        UPDATE despun_newsletter_signups SET status = ${status}
        WHERE email = ${email}
      `;
    }
  });
}

// =============================================================================
// A/B TESTS
// =============================================================================

export async function createABTest(test: {
  testName: string;
  testDescription?: string;
  variants: { id: string; name: string }[];
  targetMetric: string;
  trafficAllocation?: number;
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO despun_ab_tests (
        test_name, test_description, variants, target_metric, traffic_allocation
      ) VALUES (
        ${test.testName}, ${test.testDescription || null},
        ${JSON.stringify(test.variants)}::jsonb,
        ${test.targetMetric}, ${test.trafficAllocation || 1.0}
      )
      RETURNING id
    `;
  });
  return row.id;
}

export async function getActiveABTests(): Promise<DespunABTest[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM despun_ab_tests WHERE status = 'running'
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    testName: row.test_name,
    testDescription: row.test_description,
    variants: row.variants || [],
    targetMetric: row.target_metric,
    trafficAllocation: parseFloat(row.traffic_allocation),
    status: row.status,
    startedAt: row.started_at ? new Date(row.started_at) : null,
    endedAt: row.ended_at ? new Date(row.ended_at) : null,
    winnerVariant: row.winner_variant,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  }));
}

// =============================================================================
// SYSTEM HEALTH
// =============================================================================

export async function logSystemHealth(health: {
  apiResponseTimeAvg: number;
  apiResponseTimeP95: number;
  apiErrorRate: number;
  apiRequestsTotal: number;
  cacheHitRate: number;
  cacheSizeMb: number;
  rssFeedsStatus?: Record<string, unknown>;
  rssFeedsHealthy: number;
  rssFeedsTotal: number;
  llmRequests: number;
  llmAvgLatency: number;
  llmErrors: number;
  llmTokensUsed: number;
  dbQueryTimeAvg: number;
  dbConnectionsActive: number;
}): Promise<void> {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO despun_system_health (
          timestamp, api_response_time_avg, api_response_time_p95,
          api_error_rate, api_requests_total, cache_hit_rate, cache_size_mb,
          rss_feeds_status, rss_feeds_healthy, rss_feeds_total,
          llm_requests, llm_avg_latency, llm_errors, llm_tokens_used,
          db_query_time_avg, db_connections_active
        ) VALUES (
          NOW(), ${health.apiResponseTimeAvg}, ${health.apiResponseTimeP95},
          ${health.apiErrorRate}, ${health.apiRequestsTotal},
          ${health.cacheHitRate}, ${health.cacheSizeMb},
          ${health.rssFeedsStatus ? JSON.stringify(health.rssFeedsStatus) : null}::jsonb,
          ${health.rssFeedsHealthy}, ${health.rssFeedsTotal},
          ${health.llmRequests}, ${health.llmAvgLatency},
          ${health.llmErrors}, ${health.llmTokensUsed},
          ${health.dbQueryTimeAvg}, ${health.dbConnectionsActive}
        )
      `;
    });
  } catch (error) {
    console.error("Failed to log system health:", error);
  }
}

export async function getRecentSystemHealth(
  limit: number = 24
): Promise<DespunSystemHealth[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM despun_system_health
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    timestamp: new Date(row.timestamp),
    apiResponseTimeAvg: row.api_response_time_avg,
    apiResponseTimeP95: row.api_response_time_p95,
    apiErrorRate: parseFloat(row.api_error_rate || "0"),
    apiRequestsTotal: row.api_requests_total,
    cacheHitRate: parseFloat(row.cache_hit_rate || "0"),
    cacheSizeMb: parseFloat(row.cache_size_mb || "0"),
    rssFeedsStatus: row.rss_feeds_status,
    rssFeedsHealthy: row.rss_feeds_healthy,
    rssFeedsTotal: row.rss_feeds_total,
    llmRequests: row.llm_requests,
    llmAvgLatency: row.llm_avg_latency,
    llmErrors: row.llm_errors,
    llmTokensUsed: row.llm_tokens_used,
    dbQueryTimeAvg: row.db_query_time_avg,
    dbConnectionsActive: row.db_connections_active,
    createdAt: new Date(row.created_at),
  }));
}

// =============================================================================
// RETENTION / PURGE
// =============================================================================

/**
 * Purge old analytics events. Keep daily_metrics (already aggregated).
 * Clearview cache lives in ragecheck_clearview (managed by db.ts).
 */
export async function purgeOldDespunData(retentionDays: number = 90): Promise<{
  events: number;
  sessions: number;
  health: number;
}> {
  const [eventsResult] = await getDb()`
    DELETE FROM despun_analytics_events
    WHERE created_at < NOW() - INTERVAL '1 day' * ${retentionDays}
    RETURNING COUNT(*) as count
  `;
  const [sessionsResult] = await getDb()`
    DELETE FROM despun_sessions
    WHERE started_at < NOW() - INTERVAL '1 day' * ${retentionDays}
    RETURNING COUNT(*) as count
  `;
  const [healthResult] = await getDb()`
    DELETE FROM despun_system_health
    WHERE timestamp < NOW() - INTERVAL '1 day' * ${retentionDays}
    RETURNING COUNT(*) as count
  `;

  return {
    events: parseInt(eventsResult?.count || "0"),
    sessions: parseInt(sessionsResult?.count || "0"),
    health: parseInt(healthResult?.count || "0"),
  };
}

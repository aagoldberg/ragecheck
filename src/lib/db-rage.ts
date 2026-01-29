/**
 * Rage Weather Database Tables
 *
 * Tables for storing rage weather monitoring data:
 * - rage_weather_reports: Hourly/daily/weekly aggregate reports
 * - rage_trending_topics: Fetched trending topics per platform
 * - rage_trend_analyses: Scored trend analysis with sampled content
 * - rage_account_metrics: Validated account engagement data
 * - rage_discovered_accounts: New accounts found via trending
 * - rage_raw_posts: Fetched tweets/posts for analysis
 */

import { getDb, withRetry } from "./db";

// =============================================================================
// TYPES
// =============================================================================

export interface RageWeatherReportRow {
  id: number;
  period: "hourly" | "daily" | "weekly";
  overallRageIndex: number;
  platformScores: {
    twitter: number;
    reddit: number;
    bluesky: number;
    threads: number;
  };
  topicScores: Record<string, number>;
  politicalScores: {
    left: number;
    center: number;
    right: number;
  };
  hotTopics: {
    topic: string;
    rageScore: number;
    tweetVolume: number;
    topVoice: string;
  }[];
  spikes: {
    topic: string;
    previousScore: number;
    currentScore: number;
    percentChange: number;
    trigger?: string;
  }[];
  generatedAt: Date;
  createdAt: Date;
}

export interface RageTrendingTopicRow {
  id: number;
  platform: string;
  name: string;
  tweetVolume: number | null;
  location: string | null;
  category: string | null;
  fetchedAt: Date;
  createdAt: Date;
}

export interface RageTrendAnalysisRow {
  id: number;
  trendingTopicId: number;
  rageScore: number;
  sentiment: { positive: number; negative: number; neutral: number };
  controversyLevel: string;
  topVoices: { handle: string; followers: number; engagement: number; isNewDiscovery: boolean }[];
  samplePosts: { text: string; engagement: number; rageScore: number }[];
  analyzedAt: Date;
  createdAt: Date;
}

export interface RageAccountMetricsRow {
  id: number;
  handle: string;
  platform: string;
  followerCount: number;
  engagementRate: number;
  viralTweetCount: number;
  controversyScore: number;
  rageBarometerScore: number;
  meetsCriteria: boolean;
  flags: string[];
  validatedAt: Date;
  createdAt: Date;
}

export interface RageDiscoveredAccountRow {
  id: number;
  handle: string;
  platform: string;
  trendAppearances: number;
  totalEngagement: number;
  avgRageScore: number;
  status: "watching" | "recommended" | "added" | "rejected";
  discoveredAt: Date;
  notes: string | null;
  createdAt: Date;
}

export interface RageRawPostRow {
  id: number;
  platform: string;
  externalId: string;
  authorHandle: string;
  text: string;
  engagement: { likes: number; retweets: number; replies: number; quotes: number };
  rageScore: number | null;
  trendingTopicId: number | null;
  fetchedAt: Date;
  createdAt: Date;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

export async function initRageTables() {
  await getDb()`
    CREATE TABLE IF NOT EXISTS rage_weather_reports (
      id SERIAL PRIMARY KEY,
      period VARCHAR(10) NOT NULL,
      overall_rage_index DECIMAL(5,2) NOT NULL,
      platform_scores JSONB NOT NULL,
      topic_scores JSONB NOT NULL,
      political_scores JSONB NOT NULL,
      hot_topics JSONB DEFAULT '[]',
      spikes JSONB DEFAULT '[]',
      report_data JSONB,
      generated_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_reports_period_date ON rage_weather_reports(period, generated_at DESC)`;

  await getDb()`
    CREATE TABLE IF NOT EXISTS rage_trending_topics (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(20) NOT NULL,
      name TEXT NOT NULL,
      tweet_volume INTEGER,
      location VARCHAR(50),
      category VARCHAR(20),
      fetched_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_trends_platform_date ON rage_trending_topics(platform, fetched_at DESC)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_trends_name ON rage_trending_topics(name, platform)`;

  await getDb()`
    CREATE TABLE IF NOT EXISTS rage_trend_analyses (
      id SERIAL PRIMARY KEY,
      trending_topic_id INTEGER REFERENCES rage_trending_topics(id) ON DELETE CASCADE,
      rage_score DECIMAL(5,2) NOT NULL,
      sentiment JSONB NOT NULL,
      controversy_level VARCHAR(10) NOT NULL,
      top_voices JSONB DEFAULT '[]',
      sample_posts JSONB DEFAULT '[]',
      analyzed_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_analyses_topic ON rage_trend_analyses(trending_topic_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_analyses_score ON rage_trend_analyses(rage_score DESC)`;

  await getDb()`
    CREATE TABLE IF NOT EXISTS rage_account_metrics (
      id SERIAL PRIMARY KEY,
      handle VARCHAR(100) NOT NULL,
      platform VARCHAR(20) NOT NULL,
      follower_count INTEGER,
      engagement_rate DECIMAL(8,6),
      viral_tweet_count INTEGER,
      controversy_score DECIMAL(8,6),
      rage_barometer_score DECIMAL(5,2),
      meets_criteria BOOLEAN DEFAULT FALSE,
      flags TEXT[],
      validated_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_metrics_handle ON rage_account_metrics(handle, platform, validated_at DESC)`;

  await getDb()`
    CREATE TABLE IF NOT EXISTS rage_discovered_accounts (
      id SERIAL PRIMARY KEY,
      handle VARCHAR(100) NOT NULL,
      platform VARCHAR(20) NOT NULL,
      trend_appearances INTEGER DEFAULT 0,
      total_engagement BIGINT DEFAULT 0,
      avg_rage_score DECIMAL(5,2),
      status VARCHAR(20) DEFAULT 'watching',
      discovered_at TIMESTAMPTZ NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(handle, platform)
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_discovered_status ON rage_discovered_accounts(status)`;

  await getDb()`
    CREATE TABLE IF NOT EXISTS rage_raw_posts (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(20) NOT NULL,
      external_id VARCHAR(100),
      author_handle VARCHAR(100),
      text TEXT,
      engagement JSONB,
      rage_score DECIMAL(5,2),
      trending_topic_id INTEGER REFERENCES rage_trending_topics(id) ON DELETE SET NULL,
      fetched_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(platform, external_id)
    )
  `;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_posts_platform_date ON rage_raw_posts(platform, fetched_at DESC)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_rage_posts_author ON rage_raw_posts(author_handle, platform)`;
}

// =============================================================================
// WEATHER REPORTS
// =============================================================================

export async function saveWeatherReport(report: {
  period: "hourly" | "daily" | "weekly";
  overallRageIndex: number;
  platformScores: Record<string, number>;
  topicScores: Record<string, number>;
  politicalScores: Record<string, number>;
  hotTopics?: { topic: string; rageScore: number; tweetVolume: number; topVoice: string }[];
  spikes?: { topic: string; previousScore: number; currentScore: number; percentChange: number; trigger?: string }[];
  reportData?: Record<string, unknown>;
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO rage_weather_reports (
        period, overall_rage_index, platform_scores, topic_scores,
        political_scores, hot_topics, spikes, report_data, generated_at
      ) VALUES (
        ${report.period},
        ${report.overallRageIndex},
        ${JSON.stringify(report.platformScores)}::jsonb,
        ${JSON.stringify(report.topicScores)}::jsonb,
        ${JSON.stringify(report.politicalScores)}::jsonb,
        ${JSON.stringify(report.hotTopics || [])}::jsonb,
        ${JSON.stringify(report.spikes || [])}::jsonb,
        ${report.reportData ? JSON.stringify(report.reportData) : null}::jsonb,
        NOW()
      )
      RETURNING id
    `;
  });
  return row.id;
}

export async function getLatestWeatherReport(
  period: "hourly" | "daily" | "weekly"
): Promise<RageWeatherReportRow | null> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM rage_weather_reports
      WHERE period = ${period}
      ORDER BY generated_at DESC
      LIMIT 1
    `;
  });
  if (!row) return null;
  return mapWeatherReport(row);
}

export async function getWeatherReportHistory(
  period: "hourly" | "daily" | "weekly",
  limit: number = 24
): Promise<RageWeatherReportRow[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM rage_weather_reports
      WHERE period = ${period}
      ORDER BY generated_at DESC
      LIMIT ${limit}
    `;
  });
  return rows.map(mapWeatherReport);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWeatherReport(row: any): RageWeatherReportRow {
  return {
    id: row.id,
    period: row.period,
    overallRageIndex: parseFloat(row.overall_rage_index),
    platformScores: row.platform_scores,
    topicScores: row.topic_scores,
    politicalScores: row.political_scores,
    hotTopics: row.hot_topics || [],
    spikes: row.spikes || [],
    generatedAt: new Date(row.generated_at),
    createdAt: new Date(row.created_at),
  };
}

// =============================================================================
// TRENDING TOPICS
// =============================================================================

export async function saveTrendingTopics(
  topics: {
    platform: string;
    name: string;
    tweetVolume?: number;
    location?: string;
    category?: string;
  }[]
): Promise<number[]> {
  const ids: number[] = [];
  for (const topic of topics) {
    const [row] = await withRetry(async () => {
      return await getDb()`
        INSERT INTO rage_trending_topics (platform, name, tweet_volume, location, category, fetched_at)
        VALUES (${topic.platform}, ${topic.name}, ${topic.tweetVolume || null}, ${topic.location || null}, ${topic.category || null}, NOW())
        RETURNING id
      `;
    });
    ids.push(row.id);
  }
  return ids;
}

export async function getRecentTrendingTopics(
  platform?: string,
  hoursBack: number = 24
): Promise<RageTrendingTopicRow[]> {
  const rows = await withRetry(async () => {
    if (platform) {
      return await getDb()`
        SELECT * FROM rage_trending_topics
        WHERE platform = ${platform}
          AND fetched_at > NOW() - INTERVAL '1 hour' * ${hoursBack}
        ORDER BY fetched_at DESC
      `;
    }
    return await getDb()`
      SELECT * FROM rage_trending_topics
      WHERE fetched_at > NOW() - INTERVAL '1 hour' * ${hoursBack}
      ORDER BY fetched_at DESC
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    platform: row.platform,
    name: row.name,
    tweetVolume: row.tweet_volume,
    location: row.location,
    category: row.category,
    fetchedAt: new Date(row.fetched_at),
    createdAt: new Date(row.created_at),
  }));
}

// =============================================================================
// TREND ANALYSES
// =============================================================================

export async function saveTrendAnalysis(analysis: {
  trendingTopicId: number;
  rageScore: number;
  sentiment: { positive: number; negative: number; neutral: number };
  controversyLevel: string;
  topVoices?: { handle: string; followers: number; engagement: number; isNewDiscovery: boolean }[];
  samplePosts?: { text: string; engagement: number; rageScore: number }[];
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO rage_trend_analyses (
        trending_topic_id, rage_score, sentiment, controversy_level,
        top_voices, sample_posts, analyzed_at
      ) VALUES (
        ${analysis.trendingTopicId},
        ${analysis.rageScore},
        ${JSON.stringify(analysis.sentiment)}::jsonb,
        ${analysis.controversyLevel},
        ${JSON.stringify(analysis.topVoices || [])}::jsonb,
        ${JSON.stringify(analysis.samplePosts || [])}::jsonb,
        NOW()
      )
      RETURNING id
    `;
  });
  return row.id;
}

export async function getHotTrendAnalyses(
  minRageScore: number = 60,
  limit: number = 20
): Promise<(RageTrendAnalysisRow & { topicName: string; platform: string })[]> {
  const rows = await withRetry(async () => {
    return await getDb()`
      SELECT a.*, t.name as topic_name, t.platform
      FROM rage_trend_analyses a
      JOIN rage_trending_topics t ON t.id = a.trending_topic_id
      WHERE a.rage_score >= ${minRageScore}
      ORDER BY a.rage_score DESC, a.analyzed_at DESC
      LIMIT ${limit}
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    trendingTopicId: row.trending_topic_id,
    rageScore: parseFloat(row.rage_score),
    sentiment: row.sentiment,
    controversyLevel: row.controversy_level,
    topVoices: row.top_voices || [],
    samplePosts: row.sample_posts || [],
    analyzedAt: new Date(row.analyzed_at),
    createdAt: new Date(row.created_at),
    topicName: row.topic_name,
    platform: row.platform,
  }));
}

// =============================================================================
// ACCOUNT METRICS
// =============================================================================

export async function saveAccountMetrics(metrics: {
  handle: string;
  platform: string;
  followerCount: number;
  engagementRate: number;
  viralTweetCount: number;
  controversyScore: number;
  rageBarometerScore: number;
  meetsCriteria: boolean;
  flags: string[];
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO rage_account_metrics (
        handle, platform, follower_count, engagement_rate, viral_tweet_count,
        controversy_score, rage_barometer_score, meets_criteria, flags, validated_at
      ) VALUES (
        ${metrics.handle}, ${metrics.platform}, ${metrics.followerCount},
        ${metrics.engagementRate}, ${metrics.viralTweetCount},
        ${metrics.controversyScore}, ${metrics.rageBarometerScore},
        ${metrics.meetsCriteria}, ${metrics.flags}, NOW()
      )
      RETURNING id
    `;
  });
  return row.id;
}

export async function getLatestAccountMetrics(
  handle: string,
  platform: string
): Promise<RageAccountMetricsRow | null> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      SELECT * FROM rage_account_metrics
      WHERE handle = ${handle} AND platform = ${platform}
      ORDER BY validated_at DESC
      LIMIT 1
    `;
  });
  if (!row) return null;
  return {
    id: row.id,
    handle: row.handle,
    platform: row.platform,
    followerCount: row.follower_count,
    engagementRate: parseFloat(row.engagement_rate),
    viralTweetCount: row.viral_tweet_count,
    controversyScore: parseFloat(row.controversy_score),
    rageBarometerScore: parseFloat(row.rage_barometer_score),
    meetsCriteria: row.meets_criteria,
    flags: row.flags || [],
    validatedAt: new Date(row.validated_at),
    createdAt: new Date(row.created_at),
  };
}

export async function getTopAccountsByScore(
  platform?: string,
  limit: number = 50
): Promise<RageAccountMetricsRow[]> {
  const rows = await withRetry(async () => {
    if (platform) {
      return await getDb()`
        SELECT DISTINCT ON (handle, platform) *
        FROM rage_account_metrics
        WHERE platform = ${platform}
        ORDER BY handle, platform, validated_at DESC
      `;
    }
    return await getDb()`
      SELECT DISTINCT ON (handle, platform) *
      FROM rage_account_metrics
      ORDER BY handle, platform, validated_at DESC
    `;
  });

  return rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => ({
      id: row.id,
      handle: row.handle,
      platform: row.platform,
      followerCount: row.follower_count,
      engagementRate: parseFloat(row.engagement_rate),
      viralTweetCount: row.viral_tweet_count,
      controversyScore: parseFloat(row.controversy_score),
      rageBarometerScore: parseFloat(row.rage_barometer_score),
      meetsCriteria: row.meets_criteria,
      flags: row.flags || [],
      validatedAt: new Date(row.validated_at),
      createdAt: new Date(row.created_at),
    }))
    .sort((a: RageAccountMetricsRow, b: RageAccountMetricsRow) => b.rageBarometerScore - a.rageBarometerScore)
    .slice(0, limit);
}

// =============================================================================
// DISCOVERED ACCOUNTS
// =============================================================================

export async function upsertDiscoveredAccount(account: {
  handle: string;
  platform: string;
  trendAppearances?: number;
  totalEngagement?: number;
  avgRageScore?: number;
  status?: "watching" | "recommended" | "added" | "rejected";
  notes?: string;
}): Promise<number> {
  const [row] = await withRetry(async () => {
    return await getDb()`
      INSERT INTO rage_discovered_accounts (
        handle, platform, trend_appearances, total_engagement,
        avg_rage_score, status, discovered_at, notes
      ) VALUES (
        ${account.handle}, ${account.platform},
        ${account.trendAppearances || 1}, ${account.totalEngagement || 0},
        ${account.avgRageScore || null}, ${account.status || "watching"},
        NOW(), ${account.notes || null}
      )
      ON CONFLICT (handle, platform) DO UPDATE SET
        trend_appearances = rage_discovered_accounts.trend_appearances + 1,
        total_engagement = COALESCE(EXCLUDED.total_engagement, rage_discovered_accounts.total_engagement),
        avg_rage_score = COALESCE(EXCLUDED.avg_rage_score, rage_discovered_accounts.avg_rage_score),
        status = COALESCE(EXCLUDED.status, rage_discovered_accounts.status),
        notes = COALESCE(EXCLUDED.notes, rage_discovered_accounts.notes)
      RETURNING id
    `;
  });
  return row.id;
}

export async function getDiscoveredAccounts(
  status?: "watching" | "recommended" | "added" | "rejected"
): Promise<RageDiscoveredAccountRow[]> {
  const rows = await withRetry(async () => {
    if (status) {
      return await getDb()`
        SELECT * FROM rage_discovered_accounts
        WHERE status = ${status}
        ORDER BY trend_appearances DESC, total_engagement DESC
      `;
    }
    return await getDb()`
      SELECT * FROM rage_discovered_accounts
      ORDER BY trend_appearances DESC, total_engagement DESC
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    handle: row.handle,
    platform: row.platform,
    trendAppearances: row.trend_appearances,
    totalEngagement: parseInt(row.total_engagement),
    avgRageScore: row.avg_rage_score ? parseFloat(row.avg_rage_score) : 0,
    status: row.status,
    discoveredAt: new Date(row.discovered_at),
    notes: row.notes,
    createdAt: new Date(row.created_at),
  }));
}

export async function updateDiscoveredAccountStatus(
  handle: string,
  platform: string,
  status: "watching" | "recommended" | "added" | "rejected",
  notes?: string
): Promise<void> {
  await withRetry(async () => {
    await getDb()`
      UPDATE rage_discovered_accounts
      SET status = ${status}, notes = COALESCE(${notes || null}, notes)
      WHERE handle = ${handle} AND platform = ${platform}
    `;
  });
}

// =============================================================================
// RAW POSTS
// =============================================================================

export async function saveRawPosts(
  posts: {
    platform: string;
    externalId: string;
    authorHandle: string;
    text: string;
    engagement: { likes: number; retweets: number; replies: number; quotes: number };
    rageScore?: number;
    trendingTopicId?: number;
  }[]
): Promise<number> {
  let inserted = 0;
  for (const post of posts) {
    try {
      await withRetry(async () => {
        await getDb()`
          INSERT INTO rage_raw_posts (
            platform, external_id, author_handle, text, engagement,
            rage_score, trending_topic_id, fetched_at
          ) VALUES (
            ${post.platform}, ${post.externalId}, ${post.authorHandle},
            ${post.text}, ${JSON.stringify(post.engagement)}::jsonb,
            ${post.rageScore || null}, ${post.trendingTopicId || null}, NOW()
          )
          ON CONFLICT (platform, external_id) DO NOTHING
        `;
      });
      inserted++;
    } catch {
      // Skip duplicates
    }
  }
  return inserted;
}

export async function getRecentPosts(
  platform?: string,
  authorHandle?: string,
  limit: number = 100
): Promise<RageRawPostRow[]> {
  const rows = await withRetry(async () => {
    if (platform && authorHandle) {
      return await getDb()`
        SELECT * FROM rage_raw_posts
        WHERE platform = ${platform} AND author_handle = ${authorHandle}
        ORDER BY fetched_at DESC
        LIMIT ${limit}
      `;
    }
    if (platform) {
      return await getDb()`
        SELECT * FROM rage_raw_posts
        WHERE platform = ${platform}
        ORDER BY fetched_at DESC
        LIMIT ${limit}
      `;
    }
    return await getDb()`
      SELECT * FROM rage_raw_posts
      ORDER BY fetched_at DESC
      LIMIT ${limit}
    `;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    platform: row.platform,
    externalId: row.external_id,
    authorHandle: row.author_handle,
    text: row.text,
    engagement: row.engagement,
    rageScore: row.rage_score ? parseFloat(row.rage_score) : null,
    trendingTopicId: row.trending_topic_id,
    fetchedAt: new Date(row.fetched_at),
    createdAt: new Date(row.created_at),
  }));
}

// =============================================================================
// RETENTION / PURGE
// =============================================================================

export async function purgeOldRageData(retentionDays: number = 90): Promise<{
  topics: number;
  posts: number;
  metrics: number;
}> {
  const [topicsResult] = await getDb()`
    DELETE FROM rage_trending_topics
    WHERE fetched_at < NOW() - INTERVAL '1 day' * ${retentionDays}
    RETURNING COUNT(*) as count
  `;
  const [postsResult] = await getDb()`
    DELETE FROM rage_raw_posts
    WHERE fetched_at < NOW() - INTERVAL '1 day' * ${retentionDays}
    RETURNING COUNT(*) as count
  `;
  const [metricsResult] = await getDb()`
    DELETE FROM rage_account_metrics
    WHERE validated_at < NOW() - INTERVAL '1 day' * ${retentionDays}
      AND (handle, platform, validated_at) NOT IN (
        SELECT handle, platform, MAX(validated_at)
        FROM rage_account_metrics
        GROUP BY handle, platform
      )
    RETURNING COUNT(*) as count
  `;

  return {
    topics: parseInt(topicsResult?.count || "0"),
    posts: parseInt(postsResult?.count || "0"),
    metrics: parseInt(metricsResult?.count || "0"),
  };
}

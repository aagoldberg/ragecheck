/**
 * Account Validation Scripts
 *
 * These functions validate accounts against real engagement data
 * once API access is available.
 */

import { TwitterAccount } from "./types";
import {
  AccountMetrics,
  AccountValidationResult,
  InclusionCriteria,
  DEFAULT_INCLUSION_CRITERIA,
  calculateRageBarometerScore,
  ValidationRecommendation,
} from "./methodology";

// =============================================================================
// MOCK TYPES (Replace with real API types when integrating)
// =============================================================================

interface TwitterAPIUser {
  id: string;
  username: string;
  name: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

interface TwitterAPITweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate a single account against the API.
 *
 * Implementation notes:
 * - Requires Twitter API v2 access
 * - Uses GET /2/users/by/username/:username
 * - Uses GET /2/users/:id/tweets
 */
export async function validateAccount(
  account: TwitterAccount,
  criteria: InclusionCriteria = DEFAULT_INCLUSION_CRITERIA
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
): Promise<AccountValidationResult> {
  // TODO: Replace with real API call
  // const user = await fetchTwitterUser(account.handle);
  // const tweets = await fetchRecentTweets(user.id, { days: 30 });

  // For now, return a placeholder
  const mockMetrics: AccountMetrics = {
    handle: account.handle,
    followerCount: 0,
    followingCount: 0,
    totalTweets: 0,
    totalLikes: 0,
    totalRetweets: 0,
    totalReplies: 0,
    totalQuoteTweets: 0,
    engagementRate: 0,
    viralTweetCount: 0,
    avgEngagementPerTweet: 0,
    replyToLikeRatio: 0,
    quoteToRetweetRatio: 0,
    tweetsPerDay: 0,
    lastTweetDate: new Date(),
    trendAppearances: 0,
  };

  return {
    handle: account.handle,
    meetsInclusionCriteria: false,
    metrics: mockMetrics,
    flags: ["NOT_VALIDATED - API integration pending"],
    score: 0,
  };
}

/**
 * Calculate metrics from raw tweet data.
 */
export function calculateMetrics(
  handle: string,
  user: TwitterAPIUser,
  tweets: TwitterAPITweet[],
  daysPeriod: number = 30
): AccountMetrics {
  const totalLikes = tweets.reduce(
    (sum, t) => sum + t.public_metrics.like_count,
    0
  );
  const totalRetweets = tweets.reduce(
    (sum, t) => sum + t.public_metrics.retweet_count,
    0
  );
  const totalReplies = tweets.reduce(
    (sum, t) => sum + t.public_metrics.reply_count,
    0
  );
  const totalQuotes = tweets.reduce(
    (sum, t) => sum + t.public_metrics.quote_count,
    0
  );

  const totalEngagement = totalLikes + totalRetweets + totalReplies;
  const engagementRate =
    tweets.length > 0
      ? totalEngagement / user.public_metrics.followers_count / tweets.length
      : 0;

  const viralThreshold = 5000;
  const viralTweetCount = tweets.filter(
    (t) =>
      t.public_metrics.like_count +
        t.public_metrics.retweet_count +
        t.public_metrics.reply_count >
      viralThreshold
  ).length;

  const lastTweetDate =
    tweets.length > 0 ? new Date(tweets[0].created_at) : new Date(0);

  return {
    handle,
    followerCount: user.public_metrics.followers_count,
    followingCount: user.public_metrics.following_count,
    totalTweets: tweets.length,
    totalLikes,
    totalRetweets,
    totalReplies,
    totalQuoteTweets: totalQuotes,
    engagementRate,
    viralTweetCount,
    avgEngagementPerTweet:
      tweets.length > 0 ? totalEngagement / tweets.length : 0,
    replyToLikeRatio: totalLikes > 0 ? totalReplies / totalLikes : 0,
    quoteToRetweetRatio: totalRetweets > 0 ? totalQuotes / totalRetweets : 0,
    tweetsPerDay: tweets.length / daysPeriod,
    lastTweetDate,
    trendAppearances: 0, // Would need separate trending data
  };
}

/**
 * Check if metrics meet inclusion criteria.
 */
export function meetsInclusionCriteria(
  metrics: AccountMetrics,
  criteria: InclusionCriteria
): { meets: boolean; flags: string[] } {
  const flags: string[] = [];

  if (metrics.followerCount < criteria.minFollowers) {
    flags.push(
      `LOW_FOLLOWERS: ${metrics.followerCount} < ${criteria.minFollowers}`
    );
  }

  if (metrics.engagementRate < criteria.minEngagementRate) {
    flags.push(
      `LOW_ENGAGEMENT: ${(metrics.engagementRate * 100).toFixed(2)}% < ${criteria.minEngagementRate * 100}%`
    );
  }

  if (metrics.viralTweetCount < criteria.minViralTweetsPerMonth) {
    flags.push(
      `LOW_VIRAL: ${metrics.viralTweetCount} < ${criteria.minViralTweetsPerMonth}`
    );
  }

  const daysSinceActive = Math.floor(
    (Date.now() - metrics.lastTweetDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActive > criteria.maxDaysSinceActive) {
    flags.push(
      `INACTIVE: ${daysSinceActive} days > ${criteria.maxDaysSinceActive}`
    );
  }

  if (
    criteria.minControversyScore &&
    metrics.replyToLikeRatio < criteria.minControversyScore
  ) {
    flags.push(
      `LOW_CONTROVERSY: ${metrics.replyToLikeRatio.toFixed(3)} < ${criteria.minControversyScore}`
    );
  }

  return {
    meets: flags.length === 0,
    flags: flags.length === 0 ? ["MEETS_ALL_CRITERIA"] : flags,
  };
}

/**
 * Validate all accounts and generate recommendations.
 */
export async function validateAllAccounts(
  accounts: TwitterAccount[],
  criteria: InclusionCriteria = DEFAULT_INCLUSION_CRITERIA
): Promise<{
  results: AccountValidationResult[];
  recommendations: ValidationRecommendation;
  stats: {
    total: number;
    passing: number;
    failing: number;
    avgScore: number;
  };
}> {
  const results: AccountValidationResult[] = [];

  for (const account of accounts) {
    const result = await validateAccount(account, criteria);
    results.push(result);
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score);

  // Generate recommendations
  const passing = results.filter((r) => r.meetsInclusionCriteria);
  const failing = results.filter((r) => !r.meetsInclusionCriteria);

  const recommendations: ValidationRecommendation = {
    keep: passing.map((r) => r.handle),
    drop: failing.filter((r) => r.score < 20).map((r) => r.handle),
    watch: failing
      .filter((r) => r.score >= 20 && r.score < 40)
      .map((r) => r.handle),
    add: [], // Would come from trending analysis
  };

  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return {
    results,
    recommendations,
    stats: {
      total: results.length,
      passing: passing.length,
      failing: failing.length,
      avgScore,
    },
  };
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

/**
 * Generate a validation report.
 */
export function generateValidationReport(
  results: AccountValidationResult[],
  recommendations: ValidationRecommendation
): string {
  const lines: string[] = [
    "# Account Validation Report",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    `- Total accounts: ${results.length}`,
    `- Passing: ${results.filter((r) => r.meetsInclusionCriteria).length}`,
    `- Failing: ${results.filter((r) => !r.meetsInclusionCriteria).length}`,
    `- Average score: ${(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)}`,
    "",
    "## Top Performers",
  ];

  const top10 = results.slice(0, 10);
  for (const r of top10) {
    lines.push(`- @${r.handle}: ${r.score.toFixed(1)} points`);
  }

  lines.push("", "## Recommended Drops");
  for (const handle of recommendations.drop.slice(0, 10)) {
    const result = results.find((r) => r.handle === handle);
    lines.push(`- @${handle}: ${result?.flags.join(", ")}`);
  }

  lines.push("", "## Watch List (Borderline)");
  for (const handle of recommendations.watch.slice(0, 10)) {
    const result = results.find((r) => r.handle === handle);
    lines.push(`- @${handle}: score ${result?.score.toFixed(1)}`);
  }

  return lines.join("\n");
}

// =============================================================================
// TWITTER API INTEGRATION STUBS
// =============================================================================

/**
 * Stub for Twitter API user fetch.
 * Replace with real implementation using Twitter API v2.
 *
 * ```typescript
 * const client = new TwitterApi(BEARER_TOKEN);
 * const user = await client.v2.userByUsername(handle, {
 *   'user.fields': 'public_metrics,created_at,description'
 * });
 * ```
 */
export async function fetchTwitterUser(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _handle: string
): Promise<TwitterAPIUser | null> {
  // TODO: Implement with real Twitter API
  console.log("fetchTwitterUser: API integration pending");
  return null;
}

/**
 * Stub for Twitter API tweets fetch.
 * Replace with real implementation using Twitter API v2.
 *
 * ```typescript
 * const client = new TwitterApi(BEARER_TOKEN);
 * const tweets = await client.v2.userTimeline(userId, {
 *   max_results: 100,
 *   'tweet.fields': 'public_metrics,created_at',
 *   start_time: thirtyDaysAgo.toISOString()
 * });
 * ```
 */
export async function fetchRecentTweets(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: { days: number }
): Promise<TwitterAPITweet[]> {
  // TODO: Implement with real Twitter API
  console.log("fetchRecentTweets: API integration pending");
  return [];
}

/**
 * Stub for Twitter trending topics fetch.
 *
 * ```typescript
 * const client = new TwitterApi(BEARER_TOKEN);
 * const trends = await client.v2.trendsByWoeid(WOEID);
 * ```
 */
export async function fetchTrendingTopics(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _woeid: number
): Promise<TrendingTopic[]> {
  // TODO: Implement with real Twitter API
  console.log("fetchTrendingTopics: API integration pending");
  return [];
}

// Import type for stub
import { TrendingTopic } from "./trending";

// Re-export for convenience
export { calculateRageBarometerScore };

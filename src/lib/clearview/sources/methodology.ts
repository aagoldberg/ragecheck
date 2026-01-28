/**
 * Rage Weather Source Selection Methodology
 *
 * This file documents how accounts are selected, validated, and maintained
 * for the rage weather monitoring system.
 */

// =============================================================================
// SELECTION PHILOSOPHY
// =============================================================================

/**
 * We use a HYBRID approach:
 *
 * 1. SEED LIST (Initial)
 *    - Curated accounts based on known influence
 *    - Balanced across political spectrum, gender, topics
 *    - Starting point, not final word
 *
 * 2. DATA-DRIVEN VALIDATION (Ongoing)
 *    - Measure actual engagement metrics
 *    - Prune underperformers
 *    - Promote high performers
 *
 * 3. DYNAMIC DISCOVERY (Continuous)
 *    - Monitor trending topics
 *    - Identify who's driving each trend
 *    - Add emerging voices automatically
 *
 * The goal is to let DATA tell us who drives discourse,
 * not rely on subjective curation alone.
 */

// =============================================================================
// ACCOUNT INCLUSION CRITERIA
// =============================================================================

export interface InclusionCriteria {
  // Minimum follower count to be considered
  minFollowers: number;

  // Minimum engagement rate (engagements / followers)
  // Industry average is ~0.5-1%, high performers are 2-5%
  minEngagementRate: number;

  // Minimum viral tweets per month (tweets exceeding engagement threshold)
  minViralTweetsPerMonth: number;

  // Engagement threshold to count as "viral"
  viralEngagementThreshold: number;

  // Maximum days since last post (must be active)
  maxDaysSinceActive: number;

  // Minimum controversy score (reply:like ratio) - optional
  // Higher ratio = more controversial = more rage signal
  minControversyScore?: number;
}

export const DEFAULT_INCLUSION_CRITERIA: InclusionCriteria = {
  minFollowers: 50_000,
  minEngagementRate: 0.01, // 1% engagement rate
  minViralTweetsPerMonth: 2,
  viralEngagementThreshold: 5_000, // 5K+ engagements = viral
  maxDaysSinceActive: 14,
  minControversyScore: undefined, // Don't filter by controversy initially
};

export const STRICT_INCLUSION_CRITERIA: InclusionCriteria = {
  minFollowers: 100_000,
  minEngagementRate: 0.02, // 2% engagement rate
  minViralTweetsPerMonth: 5,
  viralEngagementThreshold: 10_000,
  maxDaysSinceActive: 7,
  minControversyScore: 0.05, // At least 5% reply:like ratio
};

// =============================================================================
// ENGAGEMENT METRICS
// =============================================================================

export interface AccountMetrics {
  handle: string;
  followerCount: number;
  followingCount: number;

  // Engagement metrics (last 30 days)
  totalTweets: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  totalQuoteTweets: number;

  // Calculated metrics
  engagementRate: number; // (likes + RTs + replies) / followers / tweets
  viralTweetCount: number; // Tweets exceeding threshold
  avgEngagementPerTweet: number;

  // Controversy signals
  replyToLikeRatio: number; // High = controversial
  quoteToRetweetRatio: number; // High = dunking/disagreement

  // Activity
  tweetsPerDay: number;
  lastTweetDate: Date;

  // Trend participation
  trendAppearances: number; // How often in trending topics
}

export interface AccountValidationResult {
  handle: string;
  meetsInclusionCriteria: boolean;
  metrics: AccountMetrics;
  flags: string[]; // Reasons for inclusion/exclusion
  score: number; // Overall "rage barometer" score
}

// =============================================================================
// SCORING ALGORITHM
// =============================================================================

/**
 * Calculate a "rage barometer score" for an account.
 * Higher score = better signal for rage weather monitoring.
 *
 * Components:
 * - Engagement rate (do people interact?)
 * - Viral frequency (do tweets break out?)
 * - Controversy score (do people argue?)
 * - Activity level (are they posting?)
 * - Trend participation (do they drive trends?)
 */
export function calculateRageBarometerScore(metrics: AccountMetrics): number {
  const weights = {
    engagementRate: 0.25,
    viralFrequency: 0.25,
    controversyScore: 0.20,
    activityLevel: 0.15,
    trendParticipation: 0.15,
  };

  // Normalize each component to 0-100 scale
  const engagementScore = Math.min(100, metrics.engagementRate * 2000); // 5% = 100
  const viralScore = Math.min(100, metrics.viralTweetCount * 10); // 10 viral tweets = 100
  const controversyScore = Math.min(100, metrics.replyToLikeRatio * 500); // 0.2 ratio = 100
  const activityScore = Math.min(100, metrics.tweetsPerDay * 20); // 5 tweets/day = 100
  const trendScore = Math.min(100, metrics.trendAppearances * 20); // 5 appearances = 100

  return (
    engagementScore * weights.engagementRate +
    viralScore * weights.viralFrequency +
    controversyScore * weights.controversyScore +
    activityScore * weights.activityLevel +
    trendScore * weights.trendParticipation
  );
}

// =============================================================================
// VALIDATION PROCESS
// =============================================================================

/**
 * Account Validation Process:
 *
 * 1. INITIAL FETCH
 *    - Get account profile (followers, following, bio)
 *    - Get last 100 tweets (or 30 days, whichever is less)
 *
 * 2. CALCULATE METRICS
 *    - Engagement rate
 *    - Viral tweet count
 *    - Controversy signals
 *    - Activity level
 *
 * 3. APPLY INCLUSION CRITERIA
 *    - Check against thresholds
 *    - Flag accounts that don't meet criteria
 *
 * 4. SCORE AND RANK
 *    - Calculate rage barometer score
 *    - Rank all accounts
 *
 * 5. RECOMMEND ACTIONS
 *    - Keep high performers
 *    - Drop low performers
 *    - Suggest additions from trending
 */

export interface ValidationRecommendation {
  keep: string[]; // Accounts to keep
  drop: string[]; // Accounts to remove
  add: string[]; // Suggested additions from trending
  watch: string[]; // Borderline, monitor for next cycle
}

// =============================================================================
// BALANCE REQUIREMENTS
// =============================================================================

/**
 * To avoid systematic bias, we enforce balance across dimensions:
 */

export interface BalanceRequirements {
  // Political balance
  political: {
    left: { min: number; max: number };
    center: { min: number; max: number };
    right: { min: number; max: number };
  };

  // Gender balance (for individual accounts, not orgs)
  gender: {
    male: { min: number; max: number };
    female: { min: number; max: number };
  };

  // Topic balance
  topics: {
    political: { min: number; max: number };
    cultural: { min: number; max: number };
    parenting: { min: number; max: number };
    entertainment: { min: number; max: number };
    news: { min: number; max: number };
  };
}

export const DEFAULT_BALANCE_REQUIREMENTS: BalanceRequirements = {
  political: {
    left: { min: 0.25, max: 0.40 },
    center: { min: 0.20, max: 0.35 },
    right: { min: 0.25, max: 0.40 },
  },
  gender: {
    male: { min: 0.35, max: 0.55 },
    female: { min: 0.35, max: 0.55 },
  },
  topics: {
    political: { min: 0.25, max: 0.45 },
    cultural: { min: 0.15, max: 0.30 },
    parenting: { min: 0.05, max: 0.15 },
    entertainment: { min: 0.10, max: 0.25 },
    news: { min: 0.15, max: 0.30 },
  },
};

// =============================================================================
// REFRESH SCHEDULE
// =============================================================================

export const REFRESH_SCHEDULE = {
  // How often to validate existing accounts
  accountValidation: "weekly",

  // How often to check for new accounts via trending
  trendDiscovery: "daily",

  // How often to recalculate metrics
  metricsRefresh: "daily",

  // How often to prune/promote accounts
  listMaintenance: "monthly",
};

// =============================================================================
// EXTERNAL DATA SOURCES
// =============================================================================

/**
 * We cross-reference with external sources for validation:
 */
export const EXTERNAL_SOURCES = {
  // Media bias ratings
  mediaBias: [
    {
      name: "AllSides",
      url: "https://www.allsides.com/media-bias/ratings",
      provides: "Political lean ratings for media outlets",
    },
    {
      name: "Media Bias/Fact Check",
      url: "https://mediabiasfactcheck.com/",
      provides: "Political lean + factual accuracy",
    },
    {
      name: "Ad Fontes Media",
      url: "https://adfontesmedia.com/",
      provides: "Media bias chart",
    },
  ],

  // Academic research
  academic: [
    {
      name: "Pew Research Center",
      url: "https://www.pewresearch.org/",
      provides: "Social media usage studies",
    },
    {
      name: "Reuters Institute",
      url: "https://reutersinstitute.politics.ox.ac.uk/",
      provides: "Digital news consumption research",
    },
  ],

  // Twitter-specific
  twitterResearch: [
    {
      name: "Twitter Lists",
      description:
        "Curated lists by journalists (e.g., 'Political Twitter')",
    },
    {
      name: "Social Blade",
      url: "https://socialblade.com/",
      provides: "Follower growth and engagement trends",
    },
  ],
};

// =============================================================================
// KNOWN LIMITATIONS
// =============================================================================

export const KNOWN_LIMITATIONS = [
  {
    limitation: "Seed list bias",
    description:
      "Initial list based on curator's knowledge, may miss important voices",
    mitigation: "Trending topic discovery adds accounts dynamically",
  },
  {
    limitation: "Platform skew",
    description: "Twitter/X, Reddit, Bluesky skew male and politically engaged",
    mitigation:
      "Explicit inclusion of women's media, female-dominated subreddits",
  },
  {
    limitation: "Recency bias",
    description: "Metrics favor currently active accounts",
    mitigation: "Balance with known long-term influential accounts",
  },
  {
    limitation: "Engagement ≠ influence",
    description: "High engagement doesn't always mean real-world impact",
    mitigation: "Cross-reference with news coverage, trend participation",
  },
  {
    limitation: "Bot/coordinated activity",
    description: "Some high-engagement accounts may have inauthentic activity",
    mitigation: "Monitor for unusual patterns, cross-platform verification",
  },
];

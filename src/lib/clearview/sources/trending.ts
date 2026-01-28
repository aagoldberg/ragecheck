/**
 * Trending Topic Monitoring
 *
 * Instead of only following pre-selected accounts, we also monitor
 * trending topics to:
 * 1. Catch emerging discourse
 * 2. Discover new voices
 * 3. Measure rage on specific topics
 */

// =============================================================================
// TYPES
// =============================================================================

export interface TrendingTopic {
  name: string;
  url?: string;
  tweetVolume?: number; // Tweets in last 24h (if available)
  platform: "twitter" | "bluesky" | "reddit" | "threads";
  location?: string; // "US", "Worldwide", etc.
  category?: TrendCategory;
  fetchedAt: Date;
}

export type TrendCategory =
  | "politics"
  | "entertainment"
  | "sports"
  | "technology"
  | "news"
  | "culture"
  | "unknown";

export interface TrendAnalysis {
  topic: TrendingTopic;
  rageScore: number; // 0-100 from RageCheck model
  sampleTweets: TrendTweet[];
  topVoices: TrendVoice[]; // Who's driving this trend
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  controversyLevel: "low" | "medium" | "high" | "extreme";
}

export interface TrendTweet {
  id: string;
  text: string;
  authorHandle: string;
  authorFollowers: number;
  likes: number;
  retweets: number;
  replies: number;
  rageScore?: number;
}

export interface TrendVoice {
  handle: string;
  name: string;
  followers: number;
  tweetsInTrend: number;
  totalEngagement: number;
  isNewDiscovery: boolean; // Not in our existing list
}

// =============================================================================
// TWITTER/X TRENDING
// =============================================================================

/**
 * Twitter API v2 Trending Topics
 *
 * Endpoint: GET /2/trends/by/woeid/:woeid
 *
 * WOEIDs (Where On Earth IDs):
 * - 1: Worldwide
 * - 23424977: United States
 * - 23424975: United Kingdom
 * - 23424748: Australia
 *
 * Returns: Top 50 trending topics
 *
 * Cost: Included in Basic tier ($100/mo)
 */

export const TWITTER_TREND_LOCATIONS = {
  worldwide: 1,
  unitedStates: 23424977,
  unitedKingdom: 23424975,
  canada: 23424775,
  australia: 23424748,
  // Major US cities
  newYork: 2459115,
  losAngeles: 2442047,
  chicago: 2379574,
  houston: 2424766,
  phoenix: 2471390,
  washingtonDC: 2514815,
};

export interface TwitterTrendConfig {
  // Which locations to monitor
  locations: number[];

  // How often to fetch trends (minutes)
  fetchIntervalMinutes: number;

  // How many tweets to sample per trend
  tweetsPerTrend: number;

  // Minimum tweet volume to analyze (filter low-volume trends)
  minTweetVolume: number;

  // Whether to fetch tweets for each trend
  fetchTweetsForTrends: boolean;
}

export const DEFAULT_TWITTER_TREND_CONFIG: TwitterTrendConfig = {
  locations: [
    TWITTER_TREND_LOCATIONS.unitedStates,
    TWITTER_TREND_LOCATIONS.worldwide,
  ],
  fetchIntervalMinutes: 60, // Hourly
  tweetsPerTrend: 50,
  minTweetVolume: 10000,
  fetchTweetsForTrends: true,
};

// =============================================================================
// REDDIT TRENDING
// =============================================================================

/**
 * Reddit "Hot" and "Rising" posts serve as trending indicators.
 *
 * Endpoints:
 * - GET /r/{subreddit}/hot
 * - GET /r/{subreddit}/rising
 * - GET /r/all/hot (cross-subreddit)
 *
 * Cost: Free API
 */

export interface RedditTrendConfig {
  // Monitor r/all for cross-subreddit trends
  monitorRAll: boolean;

  // Additional subreddits to monitor for trending
  subreddits: string[];

  // How often to fetch (minutes)
  fetchIntervalMinutes: number;

  // Posts per subreddit
  postsPerSubreddit: number;

  // Minimum upvotes to consider "trending"
  minUpvotes: number;

  // Minimum comments (engagement signal)
  minComments: number;
}

export const DEFAULT_REDDIT_TREND_CONFIG: RedditTrendConfig = {
  monitorRAll: true,
  subreddits: [
    "politics",
    "news",
    "worldnews",
    "TwoXChromosomes",
    "AmItheAsshole",
    "technology",
    "entertainment",
  ],
  fetchIntervalMinutes: 30,
  postsPerSubreddit: 25,
  minUpvotes: 1000,
  minComments: 100,
};

// =============================================================================
// BLUESKY TRENDING
// =============================================================================

/**
 * Bluesky doesn't have official "trending" but we can approximate:
 *
 * 1. Monitor "What's Hot" feed
 * 2. Track hashtag usage
 * 3. Monitor high-engagement posts
 *
 * Endpoints:
 * - app.bsky.feed.getFeed (custom feeds like "What's Hot")
 * - app.bsky.feed.searchPosts (search by hashtag)
 *
 * Cost: Free API
 */

export interface BlueskyTrendConfig {
  // Feeds to monitor
  feeds: string[];

  // Hashtags to track
  hashtags: string[];

  // How often to fetch (minutes)
  fetchIntervalMinutes: number;

  // Posts per feed
  postsPerFeed: number;
}

export const DEFAULT_BLUESKY_TREND_CONFIG: BlueskyTrendConfig = {
  feeds: [
    "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot", // What's Hot
  ],
  hashtags: [], // Add specific hashtags to track
  fetchIntervalMinutes: 60,
  postsPerFeed: 50,
};

// =============================================================================
// TREND ANALYSIS PIPELINE
// =============================================================================

/**
 * Pipeline for analyzing trending topics:
 *
 * 1. FETCH TRENDS
 *    - Get trending topics from each platform
 *    - Filter by minimum volume/engagement
 *
 * 2. SAMPLE CONTENT
 *    - Fetch top tweets/posts for each trend
 *    - Prioritize high-engagement content
 *
 * 3. SCORE FOR RAGE
 *    - Run RageCheck model on sampled content
 *    - Calculate aggregate rage score per trend
 *
 * 4. IDENTIFY TOP VOICES
 *    - Who's driving this trend?
 *    - Are they in our existing list?
 *    - Flag new discoveries for potential addition
 *
 * 5. AGGREGATE INTO WEATHER
 *    - Combine trend-level scores
 *    - Weight by trend volume/engagement
 *    - Output overall "rage weather" index
 */

export interface TrendPipelineConfig {
  // Platforms to monitor
  platforms: {
    twitter: boolean;
    reddit: boolean;
    bluesky: boolean;
    threads: boolean;
  };

  // How many trends to analyze per platform
  trendsPerPlatform: number;

  // Minimum rage score to flag as "hot"
  hotRageThreshold: number;

  // How many top voices to extract per trend
  topVoicesPerTrend: number;

  // Whether to auto-add discovered voices to watch list
  autoAddDiscoveries: boolean;
}

export const DEFAULT_TREND_PIPELINE_CONFIG: TrendPipelineConfig = {
  platforms: {
    twitter: true,
    reddit: true,
    bluesky: true,
    threads: false, // Limited API
  },
  trendsPerPlatform: 10,
  hotRageThreshold: 60, // 60+ rage score = "hot"
  topVoicesPerTrend: 5,
  autoAddDiscoveries: true,
};

// =============================================================================
// ACCOUNT DISCOVERY VIA TRENDS
// =============================================================================

/**
 * Discover new accounts to monitor by analyzing who drives trends.
 */

export interface DiscoveryConfig {
  // Minimum appearances in trends to consider adding
  minTrendAppearances: number;

  // Minimum followers
  minFollowers: number;

  // Minimum engagement when appearing in trends
  minTrendEngagement: number;

  // How long to watch before adding (days)
  watchPeriodDays: number;
}

export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  minTrendAppearances: 3, // Appear in 3+ trends
  minFollowers: 25000,
  minTrendEngagement: 5000, // 5K+ engagements when trending
  watchPeriodDays: 14, // Watch for 2 weeks before adding
};

export interface DiscoveredAccount {
  handle: string;
  platform: "twitter" | "bluesky" | "reddit" | "threads";
  discoveredAt: Date;
  trendAppearances: TrendAppearance[];
  totalEngagement: number;
  avgRageScore: number;
  status: "watching" | "recommended" | "added" | "rejected";
  notes?: string;
}

export interface TrendAppearance {
  trendName: string;
  date: Date;
  engagement: number;
  rageScore: number;
}

// =============================================================================
// RAGE WEATHER OUTPUT
// =============================================================================

/**
 * The final "rage weather" output combines:
 * - Account-based monitoring (our curated list)
 * - Trend-based monitoring (dynamic discovery)
 */

export interface RageWeatherReport {
  timestamp: Date;
  period: "hourly" | "daily" | "weekly";

  // Overall index (0-100)
  overallRageIndex: number;

  // Breakdown by platform
  platformScores: {
    twitter: number;
    reddit: number;
    bluesky: number;
    threads: number;
  };

  // Breakdown by topic
  topicScores: {
    politics: number;
    culture: number;
    entertainment: number;
    parenting: number;
    health: number;
    technology: number;
  };

  // Breakdown by political lean
  politicalScores: {
    left: number;
    center: number;
    right: number;
  };

  // Top trending rage topics
  hotTopics: {
    topic: string;
    rageScore: number;
    tweetVolume: number;
    topVoice: string;
  }[];

  // Notable spikes
  spikes: {
    topic: string;
    previousScore: number;
    currentScore: number;
    percentChange: number;
    trigger?: string;
  }[];

  // Newly discovered accounts
  discoveries: DiscoveredAccount[];
}

// =============================================================================
// MONITORING SCHEDULE
// =============================================================================

export const MONITORING_SCHEDULE = {
  // Trend fetching
  trendFetch: {
    twitter: "hourly",
    reddit: "every 30 minutes",
    bluesky: "hourly",
    threads: "every 2 hours",
  },

  // Account tweet fetching
  accountFetch: {
    frequency: "3x daily",
    times: ["08:00 EST", "14:00 EST", "20:00 EST"],
  },

  // Rage weather report generation
  reports: {
    hourly: "every hour",
    daily: "midnight EST",
    weekly: "Sunday midnight EST",
  },

  // Account list maintenance
  maintenance: {
    validation: "weekly (Sunday)",
    pruning: "monthly (1st)",
    discoveryReview: "weekly (Friday)",
  },
};

// =============================================================================
// API COST ESTIMATES
// =============================================================================

export const API_COST_ESTIMATES = {
  twitter: {
    tier: "Basic",
    monthlyCost: 100,
    trendsPerDay: 48, // Hourly × 2 locations
    tweetsPerDay: 2400, // 50 per trend × 48 trends
    accountTweetsPerDay: 900, // 100 accounts × 3 tweets × 3 times
    totalTweetsPerMonth: 99000,
    withinLimit: true, // 10K/month limit? Need to check
    notes: "May need Pro tier ($5K/mo) for full trending + account monitoring",
  },
  reddit: {
    tier: "Free",
    monthlyCost: 0,
    rateLimit: "100 requests/minute",
    notes: "Generous free tier, should be sufficient",
  },
  bluesky: {
    tier: "Free",
    monthlyCost: 0,
    rateLimit: "3000 requests/5 minutes",
    notes: "Very generous, no concerns",
  },
  threads: {
    tier: "Free (limited)",
    monthlyCost: 0,
    notes: "API still maturing, limited functionality",
  },
  total: {
    minimumMonthlyCost: 100,
    recommendedMonthlyCost: 100, // Start with Basic, upgrade if needed
    notes: "Start with Twitter Basic, validate ROI before upgrading to Pro",
  },
};

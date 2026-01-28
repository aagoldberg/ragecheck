/**
 * Rage Weather Data Sources
 *
 * Curated lists of accounts and sources for monitoring "emotional weather"
 * across the internet, with explicit attention to gender balance.
 *
 * Platforms covered:
 * - Twitter/X ($100/mo Basic tier)
 * - Bluesky (Free API)
 * - Reddit (Free API)
 * - Threads (Free, limited API)
 *
 * Key modules:
 * - types.ts: TypeScript types for all sources
 * - twitter.ts: Twitter/X account list
 * - bluesky.ts: Bluesky account list
 * - reddit.ts: Reddit subreddit list
 * - threads.ts: Threads account list
 * - womens-media.ts: Women's media outlets reference
 * - methodology.ts: Selection criteria and scoring
 * - trending.ts: Trending topic monitoring
 * - validation.ts: Account validation scripts
 *
 * Usage:
 * ```typescript
 * import {
 *   ALL_TWITTER_ACCOUNTS,
 *   ALL_REDDIT_SOURCES,
 *   DEFAULT_INCLUSION_CRITERIA,
 *   DEFAULT_TREND_PIPELINE_CONFIG,
 * } from '@/lib/clearview/sources';
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export * from "./types";

// =============================================================================
// PLATFORM-SPECIFIC SOURCES
// =============================================================================

export * from "./twitter";
export * from "./bluesky";
export * from "./reddit";
export * from "./threads";

// =============================================================================
// WOMEN'S MEDIA REFERENCE
// =============================================================================

export * from "./womens-media";

// =============================================================================
// METHODOLOGY & VALIDATION
// =============================================================================

export * from "./methodology";
export * from "./trending";
export * from "./validation";

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

import { ALL_TWITTER_ACCOUNTS, TWITTER_STATS } from "./twitter";
import { ALL_BLUESKY_ACCOUNTS, BLUESKY_STATS } from "./bluesky";
import { ALL_REDDIT_SOURCES, REDDIT_STATS } from "./reddit";
import { ALL_THREADS_ACCOUNTS, THREADS_STATS } from "./threads";
import { ALL_WOMENS_MEDIA, WOMENS_MEDIA_STATS } from "./womens-media";
import { DEFAULT_INCLUSION_CRITERIA, REFRESH_SCHEDULE } from "./methodology";
import {
  DEFAULT_TREND_PIPELINE_CONFIG,
  API_COST_ESTIMATES,
  MONITORING_SCHEDULE,
} from "./trending";

// =============================================================================
// COMBINED STATISTICS
// =============================================================================

export const COMBINED_STATS = {
  twitter: TWITTER_STATS,
  bluesky: BLUESKY_STATS,
  reddit: REDDIT_STATS,
  threads: THREADS_STATS,
  womensMedia: WOMENS_MEDIA_STATS,
  totals: {
    twitterAccounts: ALL_TWITTER_ACCOUNTS.length,
    blueskyAccounts: ALL_BLUESKY_ACCOUNTS.length,
    redditSubreddits: ALL_REDDIT_SOURCES.length,
    threadsAccounts: ALL_THREADS_ACCOUNTS.length,
    womensMediaOutlets: ALL_WOMENS_MEDIA.length,
  },
};

// =============================================================================
// API COST SUMMARY
// =============================================================================

export const API_COSTS = {
  twitter: {
    tier: "Basic",
    cost: "$100/month",
    limit: "10,000 tweets/month",
    strategy: "~70 accounts, 3 tweets each, 3x daily = 630/day = 18,900/month",
    note: "May need Pro tier for full trending + account monitoring",
  },
  bluesky: {
    tier: "Free",
    cost: "$0",
    limit: "Rate limited but generous (3000 req/5 min)",
    strategy: "Monitor all accounts freely",
  },
  reddit: {
    tier: "Free",
    cost: "$0",
    limit: "100 requests/minute",
    strategy: "Monitor hot posts from subreddits",
  },
  threads: {
    tier: "Free (limited)",
    cost: "$0",
    limit: "API still maturing",
    strategy: "Monitor brand accounts",
  },
  total: "$100/month for full multi-platform coverage",
};

// =============================================================================
// QUICK START GUIDE
// =============================================================================

export const QUICK_START = {
  step1: {
    name: "Get API Access",
    actions: [
      "Sign up for Twitter API Basic tier ($100/mo)",
      "Create Bluesky app password",
      "Register Reddit API application",
    ],
  },
  step2: {
    name: "Validate Seed Accounts",
    actions: [
      "Run validation.ts against Twitter API",
      "Score accounts by engagement metrics",
      "Prune underperformers, note high performers",
    ],
  },
  step3: {
    name: "Set Up Monitoring",
    actions: [
      "Configure cron jobs per MONITORING_SCHEDULE",
      "Fetch trends hourly, account tweets 3x daily",
      "Store results for aggregation",
    ],
  },
  step4: {
    name: "Generate Rage Weather",
    actions: [
      "Run RageCheck model on fetched content",
      "Aggregate into rage weather index",
      "Generate hourly/daily/weekly reports",
    ],
  },
  step5: {
    name: "Iterate",
    actions: [
      "Review discovered accounts weekly",
      "Validate and prune monthly",
      "Adjust criteria based on signal quality",
    ],
  },
};

// =============================================================================
// METHODOLOGY SUMMARY
// =============================================================================

export const METHODOLOGY_SUMMARY = {
  approach: "Hybrid: Curated seed list + Data-driven validation + Dynamic discovery",

  selectionCriteria: DEFAULT_INCLUSION_CRITERIA,

  balanceGoals: {
    political: "25-40% left, 20-35% center, 25-40% right",
    gender: "35-55% male, 35-55% female (individuals)",
    topics: "Politics, culture, parenting, entertainment, news",
  },

  dataValidation: {
    frequency: "Weekly",
    metrics: [
      "Engagement rate (likes + RTs + replies / followers)",
      "Viral frequency (tweets > 5K engagement)",
      "Controversy score (reply:like ratio)",
      "Activity level (tweets per day)",
      "Trend participation",
    ],
  },

  dynamicDiscovery: {
    method: "Monitor trending topics, identify top voices",
    frequency: "Hourly",
    additionCriteria: "3+ trend appearances, 25K+ followers, 5K+ engagement",
  },

  refreshSchedule: REFRESH_SCHEDULE,

  knownLimitations: [
    "Seed list bias - mitigated by trending discovery",
    "Platform skew (male/political) - mitigated by women's media inclusion",
    "Engagement ≠ influence - mitigated by cross-platform verification",
  ],
};

// =============================================================================
// GENDER BALANCE ANALYSIS
// =============================================================================

export const GENDER_BALANCE = {
  twitter: {
    individuals: {
      male: ALL_TWITTER_ACCOUNTS.filter(
        (a) => a.gender === "male"
      ).length,
      female: ALL_TWITTER_ACCOUNTS.filter(
        (a) => a.gender === "female"
      ).length,
    },
    organizations: ALL_TWITTER_ACCOUNTS.filter((a) => a.gender === "org").length,
    percentFemale: (
      (ALL_TWITTER_ACCOUNTS.filter((a) => a.gender === "female").length /
        ALL_TWITTER_ACCOUNTS.filter((a) => a.gender !== "org").length) *
      100
    ).toFixed(1),
  },
  reddit: {
    femaleSkew: ALL_REDDIT_SOURCES.filter((s) => s.genderSkew === "female").length,
    maleSkew: ALL_REDDIT_SOURCES.filter((s) => s.genderSkew === "male").length,
    mixed: ALL_REDDIT_SOURCES.filter((s) => s.genderSkew === "mixed").length,
  },
  strategies: [
    "Include dedicated women's media accounts (Scary Mommy, Betches, etc.)",
    "Monitor female-dominated subreddits (TwoXChromosomes, AITA, etc.)",
    "Track women-focused topics (parenting, healthcare, workplace)",
    "Use Threads (inherits Instagram's 57% female user base)",
  ],
};

// =============================================================================
// TREND PIPELINE CONFIG
// =============================================================================

export { DEFAULT_TREND_PIPELINE_CONFIG, API_COST_ESTIMATES, MONITORING_SCHEDULE };

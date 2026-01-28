import { RedditSource } from "./types";

/**
 * Reddit subreddits for rage weather monitoring
 *
 * Reddit has FREE API access and diverse communities.
 * Explicitly balanced for gender representation.
 *
 * Strategy: Monitor "hot" posts from each subreddit
 * Posts with high comment:upvote ratio = controversy
 */

// =============================================================================
// NEWS & POLITICS (Male-skewing)
// =============================================================================

export const REDDIT_NEWS_POLITICS: RedditSource[] = [
  {
    subreddit: "politics",
    name: "Politics",
    category: "pundit_left",
    genderSkew: "male",
    subscribers: 8500000,
    notes: "Main US politics, left-leaning",
  },
  {
    subreddit: "news",
    name: "News",
    category: "news_outlet",
    genderSkew: "male",
    subscribers: 26000000,
    notes: "General news, high engagement",
  },
  {
    subreddit: "worldnews",
    name: "World News",
    category: "news_outlet",
    genderSkew: "male",
    subscribers: 33000000,
    notes: "International news",
  },
  {
    subreddit: "Conservative",
    name: "Conservative",
    category: "pundit_right",
    genderSkew: "male",
    subscribers: 1100000,
    notes: "Right-leaning political discussion",
  },
  {
    subreddit: "moderatepolitics",
    name: "Moderate Politics",
    category: "pundit_center",
    genderSkew: "male",
    subscribers: 300000,
    notes: "Center/moderate discussion",
  },
];

// =============================================================================
// WOMEN-DOMINATED SUBREDDITS
// =============================================================================

export const REDDIT_WOMEN_FOCUSED: RedditSource[] = [
  {
    subreddit: "TwoXChromosomes",
    name: "TwoXChromosomes",
    category: "womens_media",
    genderSkew: "female",
    subscribers: 14000000,
    notes: "Women's perspectives, often political/social rage",
  },
  {
    subreddit: "AmItheAsshole",
    name: "Am I The Asshole",
    category: "relationships",
    genderSkew: "female",
    subscribers: 20000000,
    notes: "Judgment/drama, very high engagement, gender balanced but female-lean",
  },
  {
    subreddit: "relationship_advice",
    name: "Relationship Advice",
    category: "relationships",
    genderSkew: "female",
    subscribers: 10000000,
    notes: "Relationship drama, high rage potential",
  },
  {
    subreddit: "JUSTNOMIL",
    name: "Just No Mother-in-Law",
    category: "relationships",
    genderSkew: "female",
    subscribers: 2100000,
    notes: "Family drama, in-law rage",
  },
  {
    subreddit: "weddingshaming",
    name: "Wedding Shaming",
    category: "entertainment",
    genderSkew: "female",
    subscribers: 600000,
    notes: "Wedding drama and outrage",
  },
  {
    subreddit: "BestofRedditorUpdates",
    name: "Best of Redditor Updates",
    category: "entertainment",
    genderSkew: "female",
    subscribers: 3500000,
    notes: "Drama aggregation, high engagement",
  },
  {
    subreddit: "TrollXChromosomes",
    name: "TrollXChromosomes",
    category: "womens_media",
    genderSkew: "female",
    subscribers: 800000,
    notes: "Feminist humor/venting",
  },
  {
    subreddit: "WitchesVsPatriarchy",
    name: "Witches vs Patriarchy",
    category: "womens_media",
    genderSkew: "female",
    subscribers: 1300000,
    notes: "Feminist community, social issues",
  },
  {
    subreddit: "TheGirlSurvivalGuide",
    name: "The Girl Survival Guide",
    category: "womens_media",
    genderSkew: "female",
    subscribers: 900000,
    notes: "Women's advice and discussion",
  },
  {
    subreddit: "AskWomen",
    name: "Ask Women",
    category: "womens_media",
    genderSkew: "female",
    subscribers: 5000000,
    notes: "Questions for women, diverse topics",
  },
];

// =============================================================================
// PARENTING (Mixed, female-lean)
// =============================================================================

export const REDDIT_PARENTING: RedditSource[] = [
  {
    subreddit: "Parenting",
    name: "Parenting",
    category: "parenting",
    genderSkew: "mixed",
    subscribers: 5000000,
    notes: "General parenting discussion",
  },
  {
    subreddit: "Mommit",
    name: "Mommit",
    category: "parenting",
    genderSkew: "female",
    subscribers: 500000,
    notes: "Mothers community",
  },
  {
    subreddit: "beyondthebump",
    name: "Beyond The Bump",
    category: "parenting",
    genderSkew: "female",
    subscribers: 300000,
    notes: "New parents, postpartum",
  },
  {
    subreddit: "breakingmom",
    name: "Breaking Mom",
    category: "parenting",
    genderSkew: "female",
    subscribers: 200000,
    notes: "Mom venting, private-ish",
  },
  {
    subreddit: "daddit",
    name: "Daddit",
    category: "parenting",
    genderSkew: "male",
    subscribers: 400000,
    notes: "Fathers community",
  },
];

// =============================================================================
// WORK & CAREER
// =============================================================================

export const REDDIT_WORK: RedditSource[] = [
  {
    subreddit: "antiwork",
    name: "Antiwork",
    category: "activist",
    genderSkew: "mixed",
    subscribers: 3000000,
    notes: "Work reform, high rage, viral moments",
  },
  {
    subreddit: "Teachers",
    name: "Teachers",
    category: "activist",
    genderSkew: "female",
    subscribers: 600000,
    notes: "Teacher venting, education rage",
  },
  {
    subreddit: "nursing",
    name: "Nursing",
    category: "health_wellness",
    genderSkew: "female",
    subscribers: 700000,
    notes: "Nurse venting, healthcare rage",
  },
  {
    subreddit: "WorkReform",
    name: "Work Reform",
    category: "activist",
    genderSkew: "mixed",
    subscribers: 600000,
    notes: "Labor issues",
  },
  {
    subreddit: "cscareerquestions",
    name: "CS Career Questions",
    category: "viral_account",
    genderSkew: "male",
    subscribers: 900000,
    notes: "Tech career, layoff rage",
  },
];

// =============================================================================
// ENTERTAINMENT & CULTURE
// =============================================================================

export const REDDIT_ENTERTAINMENT: RedditSource[] = [
  {
    subreddit: "entertainment",
    name: "Entertainment",
    category: "entertainment",
    genderSkew: "mixed",
    subscribers: 1000000,
  },
  {
    subreddit: "movies",
    name: "Movies",
    category: "entertainment",
    genderSkew: "male",
    subscribers: 33000000,
    notes: "Film discussion, can get heated",
  },
  {
    subreddit: "television",
    name: "Television",
    category: "entertainment",
    genderSkew: "mixed",
    subscribers: 20000000,
  },
  {
    subreddit: "popheads",
    name: "Pop Heads",
    category: "entertainment",
    genderSkew: "mixed",
    subscribers: 2500000,
    notes: "Pop music, stan culture",
  },
  {
    subreddit: "TaylorSwift",
    name: "Taylor Swift",
    category: "entertainment",
    genderSkew: "female",
    subscribers: 600000,
    notes: "Swiftie community, very engaged",
  },
  {
    subreddit: "Deuxmoi",
    name: "Deux Moi",
    category: "entertainment",
    genderSkew: "female",
    subscribers: 400000,
    notes: "Celebrity gossip, drama",
  },
  {
    subreddit: "popculturechat",
    name: "Pop Culture Chat",
    category: "entertainment",
    genderSkew: "female",
    subscribers: 400000,
    notes: "Celebrity discussion, female-dominated",
  },
];

// =============================================================================
// HEALTH & WELLNESS
// =============================================================================

export const REDDIT_HEALTH: RedditSource[] = [
  {
    subreddit: "health",
    name: "Health",
    category: "health_wellness",
    genderSkew: "mixed",
    subscribers: 1000000,
  },
  {
    subreddit: "HealthAnxiety",
    name: "Health Anxiety",
    category: "health_wellness",
    genderSkew: "mixed",
    subscribers: 200000,
    notes: "Mental health discussions",
  },
  {
    subreddit: "xxfitness",
    name: "XX Fitness",
    category: "health_wellness",
    genderSkew: "female",
    subscribers: 600000,
    notes: "Women's fitness",
  },
];

// =============================================================================
// TECHNOLOGY (Male-dominated but important for balance)
// =============================================================================

export const REDDIT_TECH: RedditSource[] = [
  {
    subreddit: "technology",
    name: "Technology",
    category: "news_outlet",
    genderSkew: "male",
    subscribers: 15000000,
    notes: "Tech news, often contentious",
  },
  {
    subreddit: "Futurology",
    name: "Futurology",
    category: "news_outlet",
    genderSkew: "male",
    subscribers: 20000000,
    notes: "Future tech, AI discussions",
  },
];

// =============================================================================
// AGGREGATE EXPORTS
// =============================================================================

export const ALL_REDDIT_SOURCES: RedditSource[] = [
  ...REDDIT_NEWS_POLITICS,
  ...REDDIT_WOMEN_FOCUSED,
  ...REDDIT_PARENTING,
  ...REDDIT_WORK,
  ...REDDIT_ENTERTAINMENT,
  ...REDDIT_HEALTH,
  ...REDDIT_TECH,
];

export const REDDIT_WOMENS_SOURCES = [
  ...REDDIT_WOMEN_FOCUSED,
  ...REDDIT_PARENTING.filter((s) => s.genderSkew === "female"),
  ...REDDIT_WORK.filter((s) => s.genderSkew === "female"),
  ...REDDIT_ENTERTAINMENT.filter((s) => s.genderSkew === "female"),
  ...REDDIT_HEALTH.filter((s) => s.genderSkew === "female"),
];

export const REDDIT_STATS = {
  total: ALL_REDDIT_SOURCES.length,
  byGenderSkew: {
    female: ALL_REDDIT_SOURCES.filter((s) => s.genderSkew === "female").length,
    male: ALL_REDDIT_SOURCES.filter((s) => s.genderSkew === "male").length,
    mixed: ALL_REDDIT_SOURCES.filter((s) => s.genderSkew === "mixed").length,
  },
  totalSubscribers: ALL_REDDIT_SOURCES.reduce(
    (sum, s) => sum + (s.subscribers || 0),
    0
  ),
  womensFocused: REDDIT_WOMENS_SOURCES.length,
};

/**
 * Reddit-specific rage signals:
 * - High comment:upvote ratio = controversy
 * - "Locked" threads = extreme controversy
 * - Cross-posting to drama subs = viral rage
 * - Awards like "Wholesome" on dark content = ironic engagement
 */
export const REDDIT_RAGE_SIGNALS = {
  controversyRatio: "comments / upvotes > 0.5 suggests controversy",
  lockedThread: "Moderator locked = extreme controversy",
  sortControversial: "Posts in 'controversial' sort = rage content",
  crossPostToSubredditDrama: "If appears in r/SubredditDrama = viral rage",
};

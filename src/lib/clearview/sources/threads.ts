import { ThreadsAccount } from "./types";

/**
 * Threads accounts for rage weather monitoring
 *
 * Threads (Meta) characteristics:
 * - Launched July 2023
 * - Tied to Instagram accounts
 * - May inherit more of Instagram's female user base
 * - API is limited but growing
 * - Good for catching Instagram-adjacent discourse
 */

// =============================================================================
// NEWS OUTLETS
// =============================================================================

export const THREADS_NEWS: ThreadsAccount[] = [
  {
    handle: "nytimes",
    name: "New York Times",
    category: "news_outlet",
    gender: "org",
  },
  {
    handle: "washingtonpost",
    name: "Washington Post",
    category: "news_outlet",
    gender: "org",
  },
  {
    handle: "cnn",
    name: "CNN",
    category: "news_outlet",
    gender: "org",
  },
  {
    handle: "nbcnews",
    name: "NBC News",
    category: "news_outlet",
    gender: "org",
  },
  {
    handle: "cbsnews",
    name: "CBS News",
    category: "news_outlet",
    gender: "org",
  },
  {
    handle: "abcnews",
    name: "ABC News",
    category: "news_outlet",
    gender: "org",
  },
  {
    handle: "npr",
    name: "NPR",
    category: "news_outlet",
    gender: "org",
  },
];

// =============================================================================
// WOMEN'S MEDIA BRANDS
// =============================================================================

export const THREADS_WOMENS_MEDIA: ThreadsAccount[] = [
  {
    handle: "scarymommy",
    name: "Scary Mommy",
    category: "parenting",
    gender: "org",
    notes: "100M+ social reach, parenting content",
  },
  {
    handle: "bustle",
    name: "Bustle",
    category: "womens_media",
    gender: "org",
    notes: "BDG flagship",
  },
  {
    handle: "romper",
    name: "Romper",
    category: "parenting",
    gender: "org",
  },
  {
    handle: "refinery29",
    name: "Refinery29",
    category: "womens_media",
    gender: "org",
  },
  {
    handle: "thecut",
    name: "The Cut",
    category: "womens_media",
    gender: "org",
    notes: "NY Mag women's vertical",
  },
  {
    handle: "glamourmag",
    name: "Glamour",
    category: "womens_media",
    gender: "org",
  },
  {
    handle: "cosmopolitan",
    name: "Cosmopolitan",
    category: "womens_media",
    gender: "org",
  },
  {
    handle: "elleusa",
    name: "Elle",
    category: "womens_media",
    gender: "org",
  },
  {
    handle: "voloue",
    name: "Vogue",
    category: "womens_media",
    gender: "org",
  },
  {
    handle: "harpersbazaarus",
    name: "Harper's Bazaar",
    category: "womens_media",
    gender: "org",
  },
  {
    handle: "wellandgood",
    name: "Well+Good",
    category: "health_wellness",
    gender: "org",
  },
  {
    handle: "theskimm",
    name: "theSkimm",
    category: "womens_media",
    gender: "org",
    notes: "5M newsletter subscribers",
  },
  {
    handle: "betches",
    name: "Betches",
    category: "womens_media",
    gender: "org",
    notes: "Millennial/Gen Z women",
  },
];

// =============================================================================
// ENTERTAINMENT
// =============================================================================

export const THREADS_ENTERTAINMENT: ThreadsAccount[] = [
  {
    handle: "enews",
    name: "E! News",
    category: "entertainment",
    gender: "org",
  },
  {
    handle: "people",
    name: "People Magazine",
    category: "entertainment",
    gender: "org",
  },
  {
    handle: "usweekly",
    name: "Us Weekly",
    category: "entertainment",
    gender: "org",
  },
  {
    handle: "tmz_tv",
    name: "TMZ",
    category: "entertainment",
    gender: "org",
  },
  {
    handle: "etonline",
    name: "Entertainment Tonight",
    category: "entertainment",
    gender: "org",
  },
];

// =============================================================================
// CELEBRITIES & INFLUENCERS (High engagement)
// =============================================================================

export const THREADS_CELEBRITIES: ThreadsAccount[] = [
  // Note: Celebrities on Threads often drive massive engagement
  // This list focuses on those who engage with social/political topics
  {
    handle: "zaborork",
    name: "Mark Zuckerberg",
    category: "viral_account",
    gender: "male",
    notes: "Platform owner, posts updates",
  },
];

// =============================================================================
// JOURNALISTS & COMMENTATORS
// =============================================================================

export const THREADS_JOURNALISTS: ThreadsAccount[] = [
  // Note: Many journalists are on Threads but engagement varies
  // Add specific handles as platform matures
];

// =============================================================================
// AGGREGATE EXPORTS
// =============================================================================

export const ALL_THREADS_ACCOUNTS: ThreadsAccount[] = [
  ...THREADS_NEWS,
  ...THREADS_WOMENS_MEDIA,
  ...THREADS_ENTERTAINMENT,
  ...THREADS_CELEBRITIES,
  ...THREADS_JOURNALISTS,
];

export const THREADS_STATS = {
  total: ALL_THREADS_ACCOUNTS.length,
  byGender: {
    female: ALL_THREADS_ACCOUNTS.filter((a) => a.gender === "female").length,
    male: ALL_THREADS_ACCOUNTS.filter((a) => a.gender === "male").length,
    org: ALL_THREADS_ACCOUNTS.filter((a) => a.gender === "org").length,
  },
  note: "Threads is newer, list will grow. Strong women's media presence due to Instagram ties.",
};

/**
 * Threads platform characteristics
 */
export const THREADS_PLATFORM_NOTES = {
  owner: "Meta",
  launchDate: "July 2023",
  tieToInstagram: "Accounts linked to Instagram",
  apiStatus: "Limited but expanding",
  estimatedUsers: "100M+ (but lower engagement than peak)",
  strengths: [
    "Instagram user base (more female)",
    "Brand accounts active",
    "Less toxic than Twitter",
  ],
  weaknesses: [
    "Lower engagement than Twitter",
    "API limitations",
    "Algorithm-driven feed",
    "No hashtags initially (now added)",
  ],
  demographicNotes:
    "May inherit Instagram's 57% female user base, making it valuable for gender balance",
};

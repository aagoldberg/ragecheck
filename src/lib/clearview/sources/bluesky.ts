import { BlueskyAccount } from "./types";

/**
 * Bluesky accounts for rage weather monitoring
 *
 * Bluesky is newer and smaller than Twitter, but has:
 * - Many journalists who migrated from Twitter
 * - Progressive/liberal lean overall
 * - Growing rapidly
 * - Free API access
 *
 * Handle format: username.bsky.social or custom domains
 */

// =============================================================================
// JOURNALISTS & MEDIA
// =============================================================================

export const BLUESKY_JOURNALISTS: BlueskyAccount[] = [
  {
    handle: "taylorlorenz.bsky.social",
    name: "Taylor Lorenz",
    category: "journalist",
    gender: "female",
    notes: "Tech/culture reporter, active on Bluesky",
  },
  {
    handle: "jayrosen.bsky.social",
    name: "Jay Rosen",
    category: "journalist",
    gender: "male",
    notes: "NYU journalism professor, media critic",
  },
  {
    handle: "dangillmor.bsky.social",
    name: "Dan Gillmor",
    category: "journalist",
    gender: "male",
    notes: "Journalism professor, media commentator",
  },
  {
    handle: "emptywheel.bsky.social",
    name: "Marcy Wheeler",
    category: "journalist",
    gender: "female",
    notes: "National security reporter",
  },
  {
    handle: "katemannion.bsky.social",
    name: "Kate Mannion",
    category: "journalist",
    gender: "female",
    notes: "Reporter",
  },
  {
    handle: "mollyjongfast.bsky.social",
    name: "Molly Jong-Fast",
    category: "pundit_left",
    gender: "female",
    politicalLean: "left",
    notes: "Vanity Fair, political commentary",
  },
];

// =============================================================================
// POLITICAL COMMENTATORS
// =============================================================================

export const BLUESKY_PUNDITS: BlueskyAccount[] = [
  {
    handle: "rbreich.bsky.social",
    name: "Robert Reich",
    category: "pundit_left",
    gender: "male",
    politicalLean: "left",
    notes: "Former Labor Secretary",
  },
  {
    handle: "aoc.bsky.social",
    name: "Alexandria Ocasio-Cortez",
    category: "politician",
    gender: "female",
    politicalLean: "left",
    notes: "If active on Bluesky",
  },
  {
    handle: "markjacob.bsky.social",
    name: "Mark Jacob",
    category: "pundit_left",
    gender: "male",
    politicalLean: "left",
    notes: "Former Chicago Tribune editor",
  },
];

// =============================================================================
// WOMEN'S MEDIA & CULTURE
// =============================================================================

export const BLUESKY_WOMENS_MEDIA: BlueskyAccount[] = [
  // Note: Many women's media brands are still establishing Bluesky presence
  // This list will grow as more brands join
  {
    handle: "jezebel.bsky.social",
    name: "Jezebel",
    category: "womens_media",
    gender: "org",
    notes: "Feminist news/culture (if present)",
  },
];

// =============================================================================
// AUTHORS & CULTURAL COMMENTATORS
// =============================================================================

export const BLUESKY_CULTURE: BlueskyAccount[] = [
  {
    handle: "neilhimself.bsky.social",
    name: "Neil Gaiman",
    category: "creator",
    gender: "male",
    notes: "Author, cultural figure",
  },
  {
    handle: "scalzi.bsky.social",
    name: "John Scalzi",
    category: "creator",
    gender: "male",
    notes: "Author, commentator",
  },
  {
    handle: "sfranklinreaders.bsky.social",
    name: "Sarah Franklin",
    category: "creator",
    gender: "female",
    notes: "BookTok/reading community",
  },
];

// =============================================================================
// NEWS OUTLETS
// =============================================================================

export const BLUESKY_NEWS: BlueskyAccount[] = [
  {
    handle: "nytimes.bsky.social",
    name: "New York Times",
    category: "news_outlet",
    gender: "org",
    notes: "If present on Bluesky",
  },
  {
    handle: "washingtonpost.bsky.social",
    name: "Washington Post",
    category: "news_outlet",
    gender: "org",
    notes: "If present on Bluesky",
  },
  {
    handle: "theguardian.bsky.social",
    name: "The Guardian",
    category: "news_outlet",
    gender: "org",
    notes: "UK outlet, progressive lean",
  },
  {
    handle: "npr.bsky.social",
    name: "NPR",
    category: "news_outlet",
    gender: "org",
  },
];

// =============================================================================
// AGGREGATE EXPORTS
// =============================================================================

export const ALL_BLUESKY_ACCOUNTS: BlueskyAccount[] = [
  ...BLUESKY_JOURNALISTS,
  ...BLUESKY_PUNDITS,
  ...BLUESKY_WOMENS_MEDIA,
  ...BLUESKY_CULTURE,
  ...BLUESKY_NEWS,
];

export const BLUESKY_STATS = {
  total: ALL_BLUESKY_ACCOUNTS.length,
  byGender: {
    male: ALL_BLUESKY_ACCOUNTS.filter((a) => a.gender === "male").length,
    female: ALL_BLUESKY_ACCOUNTS.filter((a) => a.gender === "female").length,
    org: ALL_BLUESKY_ACCOUNTS.filter((a) => a.gender === "org").length,
  },
  note: "Bluesky list is smaller due to platform newness. Will grow over time.",
};

/**
 * Known Bluesky characteristics:
 * - Skews progressive/liberal
 * - Strong journalist presence
 * - Growing but still smaller than Twitter
 * - Free API with good rate limits
 * - Decentralized protocol (AT Protocol)
 */
export const BLUESKY_PLATFORM_NOTES = {
  politicalLean: "left/liberal",
  apiAccess: "free",
  estimatedActiveUsers: "10-20M",
  keyDemographics: ["journalists", "academics", "tech workers", "creatives"],
  strengths: ["Free API", "Growing", "Less toxic than Twitter"],
  weaknesses: ["Smaller reach", "Echo chamber risk", "Less diverse"],
};

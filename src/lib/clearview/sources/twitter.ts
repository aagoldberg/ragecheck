import { TwitterAccount } from "./types";

/**
 * Twitter/X accounts for rage weather monitoring
 *
 * Curated for balance across:
 * - Political spectrum (left/center/right)
 * - Gender (male/female/org)
 * - Topics (political, cultural, parenting, health, entertainment)
 * - Demographics (Gen Z through Boomer)
 *
 * Target: ~100 accounts for Basic tier ($100/mo = 10K tweets/month)
 * At 3 tweets/account/day × 30 days = 9,000 tweets/month
 *
 * Handles verified: January 2025
 */

// =============================================================================
// POLITICAL COMMENTATORS - LEFT
// =============================================================================

export const PUNDITS_LEFT: TwitterAccount[] = [
  {
    handle: "AOC",
    name: "Alexandria Ocasio-Cortez",
    category: "politician",
    gender: "female",
    politicalLean: "left",
    demographic: "millennial",
    notes: "Progressive congresswoman, massive engagement. Also @RepAOC (staff)",
  },
  {
    handle: "BernieSanders",
    name: "Bernie Sanders",
    category: "politician",
    gender: "male",
    politicalLean: "left",
    demographic: "boomer",
  },
  {
    handle: "RBReich",
    name: "Robert Reich",
    category: "pundit_left",
    gender: "male",
    politicalLean: "left",
    notes: "Former Labor Secretary, economic commentary. 1.4M followers",
  },
  {
    handle: "mehdirhasan",
    name: "Mehdi Hasan",
    category: "pundit_left",
    gender: "male",
    politicalLean: "left",
    notes: "Journalist, former MSNBC. Still active on X.",
  },
  {
    handle: "chrislhayes",
    name: "Chris Hayes",
    category: "pundit_left",
    gender: "male",
    politicalLean: "left",
    notes: "MSNBC host, All In with Chris Hayes",
  },
  {
    handle: "MaryLTrump",
    name: "Mary Trump",
    category: "pundit_left",
    gender: "female",
    politicalLean: "left",
    notes: "Trump family critic, psychologist",
  },
  {
    handle: "IlhanMN",
    name: "Ilhan Omar",
    category: "politician",
    gender: "female",
    politicalLean: "left",
    demographic: "millennial",
    notes: "Personal account. Also @Ilhan (congressional, staff-managed)",
  },
  {
    handle: "RashidaTlaib",
    name: "Rashida Tlaib",
    category: "politician",
    gender: "female",
    politicalLean: "left",
    demographic: "gen_x",
    notes: "Progressive congresswoman",
  },
];

// Note: Joy Reid (@JoyAnnReid) left Twitter/X in November 2024

// =============================================================================
// POLITICAL COMMENTATORS - RIGHT
// =============================================================================

export const PUNDITS_RIGHT: TwitterAccount[] = [
  {
    handle: "benshapiro",
    name: "Ben Shapiro",
    category: "pundit_right",
    gender: "male",
    politicalLean: "right",
    notes: "Daily Wire founder, ~8M followers",
  },
  {
    handle: "TuckerCarlson",
    name: "Tucker Carlson",
    category: "pundit_right",
    gender: "male",
    politicalLean: "right",
    notes: "Former Fox News host, 16.9M followers",
  },
  {
    handle: "MattWalshBlog",
    name: "Matt Walsh",
    category: "pundit_right",
    gender: "male",
    politicalLean: "right",
    notes: "Daily Wire host",
  },
  {
    handle: "RealCandaceO",
    name: "Candace Owens",
    category: "pundit_right",
    gender: "female",
    politicalLean: "right",
    notes: "Conservative commentator",
  },
  {
    handle: "MeghanMcCain",
    name: "Meghan McCain",
    category: "pundit_right",
    gender: "female",
    politicalLean: "center_right",
    notes: "Former The View co-host",
  },
  {
    handle: "TomiLahren",
    name: "Tomi Lahren",
    category: "pundit_right",
    gender: "female",
    politicalLean: "right",
    demographic: "millennial",
    notes: "Fox News, Outkick host",
  },
  {
    handle: "RonFilipkowski",
    name: "Ron Filipkowski",
    category: "pundit_left", // Actually left, monitors right
    gender: "male",
    politicalLean: "left",
    notes: "Tracks right-wing media",
  },
  {
    handle: "charliekirk11",
    name: "Charlie Kirk",
    category: "pundit_right",
    gender: "male",
    politicalLean: "right",
    notes: "Turning Point USA founder, 6.1M followers",
  },
  {
    handle: "DLoesch",
    name: "Dana Loesch",
    category: "pundit_right",
    gender: "female",
    politicalLean: "right",
    notes: "Radio host, former NRA spokesperson",
  },
];

// =============================================================================
// JOURNALISTS & CENTER
// =============================================================================

export const JOURNALISTS: TwitterAccount[] = [
  {
    handle: "maggieNYT",
    name: "Maggie Haberman",
    category: "journalist",
    gender: "female",
    politicalLean: "center",
    notes: "NYT White House correspondent",
  },
  {
    handle: "KatiePorterOC",
    name: "Katie Porter",
    category: "politician",
    gender: "female",
    politicalLean: "center_left",
    notes: "Known for whiteboard moments",
  },
  {
    handle: "kasie",
    name: "Kasie Hunt",
    category: "journalist",
    gender: "female",
    politicalLean: "center",
    notes: "CNN host, The Arena. 562K followers.",
  },
  {
    handle: "jaketapper",
    name: "Jake Tapper",
    category: "journalist",
    gender: "male",
    politicalLean: "center",
    notes: "CNN anchor",
  },
  {
    handle: "Yamiche",
    name: "Yamiche Alcindor",
    category: "journalist",
    gender: "female",
    politicalLean: "center",
    notes: "PBS NewsHour",
  },
  {
    handle: "sbg1",
    name: "Susan Glasser",
    category: "journalist",
    gender: "female",
    politicalLean: "center",
    notes: "New Yorker staff writer",
  },
  {
    handle: "AriMelber",
    name: "Ari Melber",
    category: "journalist",
    gender: "male",
    politicalLean: "center_left",
    notes: "MSNBC host",
  },
  {
    handle: "andersoncooper",
    name: "Anderson Cooper",
    category: "journalist",
    gender: "male",
    politicalLean: "center",
    notes: "CNN anchor",
  },
  {
    handle: "TaylorLorenz",
    name: "Taylor Lorenz",
    category: "journalist",
    gender: "female",
    notes: "Tech/culture reporter, often in discourse. User Mag founder.",
  },
];

// =============================================================================
// WOMEN'S MEDIA & PARENTING
// =============================================================================

export const WOMENS_MEDIA: TwitterAccount[] = [
  {
    handle: "ScaryMommy",
    name: "Scary Mommy",
    category: "parenting",
    gender: "org",
    demographic: "millennial",
    notes: "100M+ social reach, parenting rage central. 612K Threads followers.",
  },
  {
    handle: "romper",
    name: "Romper",
    category: "parenting",
    gender: "org",
    demographic: "millennial",
    notes: "BDG property, pregnancy/parenting",
  },
  {
    handle: "theSkimm",
    name: "theSkimm",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "5M subscribers, daily news for women. Acquired by Ziff Davis 2025.",
  },
  {
    handle: "bustle",
    name: "Bustle",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "BDG flagship, culture/politics",
  },
  {
    handle: "EliteDaily",
    name: "Elite Daily",
    category: "womens_media",
    gender: "org",
    demographic: "gen_z",
    notes: "BDG property, Gen Z focus. 4M IG followers.",
  },
  {
    handle: "Refinery29",
    name: "Refinery29",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "Culture, identity, style. Owned by Sundial Media.",
  },
  {
    handle: "betchesluvthis",
    name: "Betches",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "Politics meets group chat, NFL partner. The Sup newsletter.",
  },
  {
    handle: "TheCut",
    name: "The Cut",
    category: "womens_media",
    gender: "org",
    notes: "NY Mag women's vertical, high quality journalism",
  },
  {
    handle: "glamourmag",
    name: "Glamour",
    category: "womens_media",
    gender: "org",
    notes: "Conde Nast, traditional magazine with strong digital",
  },
  {
    handle: "Cosmopolitan",
    name: "Cosmopolitan",
    category: "womens_media",
    gender: "org",
    notes: "Hearst. Lifestyle, relationships, culture",
  },
  {
    handle: "TheEverygirl_",
    name: "The Everygirl",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "Career, lifestyle. Note the underscore in handle.",
  },
  {
    handle: "iamwellandgood",
    name: "Well+Good",
    category: "health_wellness",
    gender: "org",
    notes: "Wellness, health, self-care. Owned by Leaf Group.",
  },
  {
    handle: "NylonMag",
    name: "NYLON",
    category: "womens_media",
    gender: "org",
    demographic: "gen_z",
    notes: "BDG property, fashion/music/culture",
  },
  {
    handle: "ELLEmagazine",
    name: "Elle",
    category: "womens_media",
    gender: "org",
    notes: "Hearst. Fashion, beauty, culture, politics.",
  },
  {
    handle: "voguemagazine",
    name: "Vogue",
    category: "womens_media",
    gender: "org",
    notes: "Conde Nast. Fashion, culture. US edition.",
  },
];

// =============================================================================
// NEWS OUTLETS
// =============================================================================

export const NEWS_OUTLETS: TwitterAccount[] = [
  // Left-leaning
  {
    handle: "MSNBC",
    name: "MSNBC",
    category: "news_outlet_left",
    gender: "org",
    politicalLean: "left",
  },
  {
    handle: "HuffPost",
    name: "HuffPost",
    category: "news_outlet_left",
    gender: "org",
    politicalLean: "left",
  },
  {
    handle: "voxdotcom",
    name: "Vox",
    category: "news_outlet_left",
    gender: "org",
    politicalLean: "center_left",
  },

  // Center
  {
    handle: "nytimes",
    name: "New York Times",
    category: "news_outlet",
    gender: "org",
    politicalLean: "center_left",
  },
  {
    handle: "washingtonpost",
    name: "Washington Post",
    category: "news_outlet",
    gender: "org",
    politicalLean: "center_left",
  },
  {
    handle: "CNN",
    name: "CNN",
    category: "news_outlet",
    gender: "org",
    politicalLean: "center",
  },
  {
    handle: "ABCNews",
    name: "ABC News",
    category: "news_outlet",
    gender: "org",
    politicalLean: "center",
  },
  {
    handle: "NPR",
    name: "NPR",
    category: "news_outlet",
    gender: "org",
    politicalLean: "center",
  },
  {
    handle: "Reuters",
    name: "Reuters",
    category: "news_outlet",
    gender: "org",
    politicalLean: "center",
  },
  {
    handle: "AP",
    name: "Associated Press",
    category: "news_outlet",
    gender: "org",
    politicalLean: "center",
  },

  // Right-leaning
  {
    handle: "FoxNews",
    name: "Fox News",
    category: "news_outlet_right",
    gender: "org",
    politicalLean: "right",
  },
  {
    handle: "BreitbartNews",
    name: "Breitbart",
    category: "news_outlet_right",
    gender: "org",
    politicalLean: "right",
  },
  {
    handle: "nypost",
    name: "New York Post",
    category: "news_outlet_right",
    gender: "org",
    politicalLean: "center_right",
  },
  {
    handle: "DailyMail",
    name: "Daily Mail",
    category: "news_outlet",
    gender: "org",
    notes: "Tabloid, high engagement",
  },
  {
    handle: "realDailyWire",
    name: "Daily Wire",
    category: "news_outlet_right",
    gender: "org",
    politicalLean: "right",
    notes: "Conservative media company",
  },
];

// =============================================================================
// ENTERTAINMENT & CULTURE
// =============================================================================

export const ENTERTAINMENT: TwitterAccount[] = [
  {
    handle: "PopCrave",
    name: "Pop Crave",
    category: "entertainment",
    gender: "org",
    notes: "Celebrity news, 2.3M followers. 'ESPN of pop music'",
  },
  {
    handle: "DiscussingFilm",
    name: "DiscussingFilm",
    category: "entertainment",
    gender: "org",
    notes: "Film/TV news and discussion",
  },
  {
    handle: "enews",
    name: "E! News",
    category: "entertainment",
    gender: "org",
    notes: "Celebrity, entertainment. 3.4M Threads followers.",
  },
  {
    handle: "people",
    name: "People Magazine",
    category: "entertainment",
    gender: "org",
    notes: "Celebrity, human interest",
  },
  {
    handle: "usweekly",
    name: "Us Weekly",
    category: "entertainment",
    gender: "org",
    notes: "Celebrity gossip",
  },
  {
    handle: "TMZ",
    name: "TMZ",
    category: "entertainment",
    gender: "org",
    notes: "Breaking celebrity news, often controversial",
  },
  {
    handle: "Deuxmoi",
    name: "Deuxmoi",
    category: "entertainment",
    gender: "org",
    notes: "Celebrity gossip, anonymous tips",
  },
];

// =============================================================================
// VIRAL / MAIN CHARACTER ACCOUNTS
// =============================================================================

export const VIRAL_ACCOUNTS: TwitterAccount[] = [
  // These are accounts that frequently go viral or are "main characters"
  // This list should be updated regularly based on who's driving discourse
  {
    handle: "elonmusk",
    name: "Elon Musk",
    category: "viral_account",
    gender: "male",
    notes: "Platform owner, 226M followers, constant engagement",
  },
  {
    handle: "JessaBKelly",
    name: "Jesse Kelly",
    category: "pundit_right",
    gender: "male",
    politicalLean: "right",
    notes: "Radio host, high engagement",
  },
  {
    handle: "catturd2",
    name: "Catturd",
    category: "viral_account",
    gender: "male",
    politicalLean: "right",
    notes: "Conservative viral account",
  },
];

// =============================================================================
// HEALTH & WELLNESS
// =============================================================================

export const HEALTH_WELLNESS: TwitterAccount[] = [
  {
    handle: "DrLeanaWen",
    name: "Dr. Leana Wen",
    category: "health_wellness",
    gender: "female",
    notes: "Public health expert, former Planned Parenthood president",
  },
  {
    handle: "DrJenLincoln",
    name: "Dr. Jennifer Lincoln",
    category: "health_wellness",
    gender: "female",
    notes: "OB-GYN, women's health advocate. Millions of TikTok followers.",
  },
];

// =============================================================================
// EDUCATION & TEACHERS
// =============================================================================

export const EDUCATION: TwitterAccount[] = [
  {
    handle: "AFTunion",
    name: "American Federation of Teachers",
    category: "activist",
    gender: "org",
    notes: "Teachers union, 1.7M members",
  },
  {
    handle: "NEAToday",
    name: "NEA",
    category: "activist",
    gender: "org",
    notes: "National Education Association",
  },
  {
    handle: "rweingarten",
    name: "Randi Weingarten",
    category: "activist",
    gender: "female",
    notes: "AFT President. Also on Bluesky @rweingarten.bsky.social",
  },
];

// =============================================================================
// AGGREGATE EXPORTS
// =============================================================================

export const ALL_TWITTER_ACCOUNTS: TwitterAccount[] = [
  ...PUNDITS_LEFT,
  ...PUNDITS_RIGHT,
  ...JOURNALISTS,
  ...WOMENS_MEDIA,
  ...NEWS_OUTLETS,
  ...ENTERTAINMENT,
  ...VIRAL_ACCOUNTS,
  ...HEALTH_WELLNESS,
  ...EDUCATION,
];

// Filtered exports for different use cases
export const POLITICAL_ACCOUNTS = [
  ...PUNDITS_LEFT,
  ...PUNDITS_RIGHT,
  ...JOURNALISTS,
];

export const WOMENS_FOCUSED_ACCOUNTS = [...WOMENS_MEDIA, ...HEALTH_WELLNESS];

export const getAccountsByCategory = (category: string): TwitterAccount[] =>
  ALL_TWITTER_ACCOUNTS.filter((a) => a.category === category);

export const getAccountsByGender = (gender: string): TwitterAccount[] =>
  ALL_TWITTER_ACCOUNTS.filter((a) => a.gender === gender);

export const getAccountsByPoliticalLean = (lean: string): TwitterAccount[] =>
  ALL_TWITTER_ACCOUNTS.filter((a) => a.politicalLean === lean);

/**
 * Statistics about the account list
 */
export const TWITTER_STATS = {
  total: ALL_TWITTER_ACCOUNTS.length,
  byGender: {
    male: ALL_TWITTER_ACCOUNTS.filter((a) => a.gender === "male").length,
    female: ALL_TWITTER_ACCOUNTS.filter((a) => a.gender === "female").length,
    org: ALL_TWITTER_ACCOUNTS.filter((a) => a.gender === "org").length,
  },
  byPoliticalLean: {
    left: ALL_TWITTER_ACCOUNTS.filter((a) => a.politicalLean === "left").length,
    center_left: ALL_TWITTER_ACCOUNTS.filter(
      (a) => a.politicalLean === "center_left"
    ).length,
    center: ALL_TWITTER_ACCOUNTS.filter((a) => a.politicalLean === "center")
      .length,
    center_right: ALL_TWITTER_ACCOUNTS.filter(
      (a) => a.politicalLean === "center_right"
    ).length,
    right: ALL_TWITTER_ACCOUNTS.filter((a) => a.politicalLean === "right")
      .length,
  },
};

/**
 * Handles that need periodic verification (may change or deactivate)
 */
export const HANDLES_TO_VERIFY = [
  "theSkimm", // May have changed after Ziff Davis acquisition
];

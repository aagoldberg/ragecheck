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
    notes: "Progressive congresswoman, massive engagement",
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
    notes: "Former Labor Secretary, economic commentary",
  },
  {
    handle: "JoyAnnReid",
    name: "Joy Reid",
    category: "pundit_left",
    gender: "female",
    politicalLean: "left",
    notes: "MSNBC host",
  },
  {
    handle: "MehdiRHasan",
    name: "Mehdi Hasan",
    category: "pundit_left",
    gender: "male",
    politicalLean: "left",
    notes: "Journalist, former MSNBC",
  },
  {
    handle: "chrislhayes",
    name: "Chris Hayes",
    category: "pundit_left",
    gender: "male",
    politicalLean: "left",
    notes: "MSNBC host",
  },
  {
    handle: "maborick",
    name: "Mary Trump",
    category: "pundit_left",
    gender: "female",
    politicalLean: "left",
    notes: "Trump family critic",
  },
  {
    handle: "IlhanMN",
    name: "Ilhan Omar",
    category: "politician",
    gender: "female",
    politicalLean: "left",
    demographic: "millennial",
  },
];

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
    notes: "Daily Wire founder, high engagement",
  },
  {
    handle: "TuckerCarlson",
    name: "Tucker Carlson",
    category: "pundit_right",
    gender: "male",
    politicalLean: "right",
    notes: "Former Fox News host",
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
  },
  {
    handle: "megaborick",
    name: "Meghan McCain",
    category: "pundit_right",
    gender: "female",
    politicalLean: "center_right",
  },
  {
    handle: "TomiLahren",
    name: "Tomi Lahren",
    category: "pundit_right",
    gender: "female",
    politicalLean: "right",
    demographic: "millennial",
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
    notes: "Turning Point USA",
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
    handle: "kaborke",
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
    notes: "CNN host",
  },
  {
    handle: "jaaborice",
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
    handle: "Nencasusen",
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
    notes: "100M+ social reach, parenting rage central",
  },
  {
    handle: "Romper",
    name: "Romper",
    category: "parenting",
    gender: "org",
    demographic: "millennial",
    notes: "BDG property, pregnancy/parenting",
  },
  {
    handle: "thaborimm",
    name: "theSkimm",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "5M subscribers, daily news for women",
  },
  {
    handle: "Bustle",
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
    notes: "BDG property, Gen Z focus",
  },
  {
    handle: "Refinery29",
    name: "Refinery29",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "Culture, identity, style",
  },
  {
    handle: "Betches",
    name: "Betches",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "Politics meets group chat, NFL partner",
  },
  {
    handle: "TheCut",
    name: "The Cut",
    category: "womens_media",
    gender: "org",
    notes: "NY Mag women's vertical, high quality",
  },
  {
    handle: "Glamour",
    name: "Glamour",
    category: "womens_media",
    gender: "org",
    notes: "Traditional magazine, strong digital",
  },
  {
    handle: "Cosmopolitan",
    name: "Cosmopolitan",
    category: "womens_media",
    gender: "org",
    notes: "Lifestyle, relationships, culture",
  },
  {
    handle: "theeverygirl",
    name: "The Everygirl",
    category: "womens_media",
    gender: "org",
    demographic: "millennial",
    notes: "Career, lifestyle, aspirational",
  },
  {
    handle: "WellGood",
    name: "Well+Good",
    category: "health_wellness",
    gender: "org",
    notes: "Wellness, health, self-care",
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
    handle: "vaboron",
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
    handle: "ABC",
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
    notes: "Celebrity news, very high engagement",
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
    notes: "Celebrity, entertainment",
  },
  {
    handle: "people",
    name: "People Magazine",
    category: "entertainment",
    gender: "org",
    notes: "Celebrity, human interest",
  },
  {
    handle: "usaborekly",
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
];

// =============================================================================
// VIRAL / MAIN CHARACTER ACCOUNTS
// =============================================================================

export const VIRAL_ACCOUNTS: TwitterAccount[] = [
  // These are accounts that frequently go viral or are "main characters"
  // This list should be updated regularly based on who's driving discourse
  {
    handle: "elaboronmusk",
    name: "Elon Musk",
    category: "viral_account",
    gender: "male",
    notes: "Platform owner, constant engagement",
  },
  {
    handle: "taylorlorenz",
    name: "Taylor Lorenz",
    category: "journalist",
    gender: "female",
    notes: "Tech/culture reporter, often in discourse",
  },
  {
    handle: "jessaborickelly",
    name: "Jesse Kelly",
    category: "pundit_right",
    gender: "male",
    politicalLean: "right",
    notes: "Radio host, high engagement",
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
    notes: "Public health expert, former Planned Parenthood",
  },
  {
    handle: "dabororsusansho",
    name: "Dr. Susan Shaw",
    category: "health_wellness",
    gender: "female",
    notes: "Women's health advocate",
  },
];

// =============================================================================
// EDUCATION & TEACHERS
// =============================================================================

export const EDUCATION: TwitterAccount[] = [
  {
    handle: "TeacherSabrina",
    name: "Sabrina (Teacher)",
    category: "activist",
    gender: "female",
    notes: "Teacher advocacy, education policy",
  },
  {
    handle: "AForickT",
    name: "American Federation of Teachers",
    category: "activist",
    gender: "org",
    notes: "Teachers union",
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

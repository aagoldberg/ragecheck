import { WomensMediaOutlet } from "./types";

/**
 * Women-focused media outlets for rage weather monitoring
 *
 * These are the major properties that reach women at scale.
 * Use their social accounts across platforms for monitoring.
 *
 * Sources: Research from January 2025
 */

// =============================================================================
// TIER 1: MASSIVE REACH (50M+ monthly)
// =============================================================================

export const TIER_1_WOMENS_MEDIA: WomensMediaOutlet[] = [
  {
    name: "Bustle Digital Group (BDG)",
    type: "website",
    reach: "80M+ monthly readers across properties",
    platforms: {
      twitter: "Bustle",
      instagram: "bustle",
      threads: "bustle",
      website: "https://www.bustle.com",
    },
    demographic: "millennial",
    notes:
      "Conglomerate: Bustle, Scary Mommy, Romper, Elite Daily, NYLON, Fatherly. $75M revenue.",
  },
  {
    name: "Scary Mommy",
    type: "social_brand",
    reach: "100M+ social monthly, 5.8M web visits",
    platforms: {
      twitter: "ScaryMommy",
      instagram: "scarymommy",
      threads: "scarymommy",
      website: "https://www.scarymommy.com",
    },
    demographic: "millennial",
    notes:
      "Biggest parenting media brand in US. Millennial moms. Part of BDG. Parenting rage central.",
  },
];

// =============================================================================
// TIER 2: MAJOR PLAYERS (1-10M reach)
// =============================================================================

export const TIER_2_WOMENS_MEDIA: WomensMediaOutlet[] = [
  {
    name: "theSkimm",
    type: "newsletter",
    reach: "5M subscribers across 6 newsletters",
    platforms: {
      twitter: "theSkimm",
      instagram: "theskimm",
      threads: "theskimm",
      website: "https://www.theskimm.com",
    },
    demographic: "millennial",
    notes:
      "Acquired by Ziff Davis March 2025. Daily news digest. Millennial/Gen X women focus.",
  },
  {
    name: "Refinery29",
    type: "website",
    reach: "~$100M revenue at sale (2024)",
    platforms: {
      twitter: "Refinery29",
      instagram: "refinery29",
      threads: "refinery29",
      website: "https://www.refinery29.com",
    },
    demographic: "millennial",
    notes: "Sold to Sundial Media 2024. Culture, identity, style. Closing UK ops.",
  },
  {
    name: "Romper",
    type: "website",
    reach: "Part of BDG 80M",
    platforms: {
      twitter: "Romper",
      instagram: "romaborper",
      threads: "romper",
      website: "https://www.romper.com",
    },
    demographic: "millennial",
    notes: "BDG property. Pregnancy and parenting.",
  },
  {
    name: "Elite Daily",
    type: "website",
    reach: "Part of BDG 80M",
    platforms: {
      twitter: "EliteDaily",
      instagram: "elitedaily",
      website: "https://www.elitedaily.com",
    },
    demographic: "gen_z",
    notes: "BDG property. Gen Z focus. Dating, lifestyle, astrology.",
  },
  {
    name: "The Cut",
    type: "website",
    reach: "Major (NY Mag vertical)",
    platforms: {
      twitter: "TheCut",
      instagram: "thecut",
      threads: "thecut",
      website: "https://www.thecut.com",
    },
    demographic: "millennial",
    notes: "New York Magazine's women's vertical. High quality journalism.",
  },
  {
    name: "Betches",
    type: "social_brand",
    reach: "Large, NFL partnership level",
    platforms: {
      twitter: "Betches",
      instagram: "betches",
      threads: "betches",
      website: "https://betches.com",
    },
    demographic: "millennial",
    notes:
      "'Politics meets group chat.' NFL media partner. The Sup newsletter for politics.",
  },
];

// =============================================================================
// TIER 3: SIGNIFICANT NICHE (100K-1M)
// =============================================================================

export const TIER_3_WOMENS_MEDIA: WomensMediaOutlet[] = [
  {
    name: "The Everygirl",
    type: "website",
    reach: "Significant (Substack presence)",
    platforms: {
      twitter: "theeverygirl",
      instagram: "theeverygirl",
      website: "https://theeverygirl.com",
    },
    demographic: "millennial",
    notes: "Career, lifestyle. Now on Substack. Also runs The Everymom.",
  },
  {
    name: "Well+Good",
    type: "website",
    reach: "Large wellness audience",
    platforms: {
      twitter: "iamwellandgood",
      instagram: "wellandgood",
      threads: "wellandgood",
      website: "https://www.wellandgood.com",
    },
    demographic: "millennial",
    notes: "Owned by Leaf Group. Wellness, health, self-care.",
  },
  {
    name: "PureWow",
    type: "website",
    reach: "Significant",
    platforms: {
      twitter: "PureWow",
      instagram: "purewow",
      website: "https://www.purewow.com",
    },
    demographic: "millennial",
    notes: "Lifestyle, entertainment for women.",
  },
  {
    name: "NYLON",
    type: "website",
    reach: "Part of BDG",
    platforms: {
      twitter: "NylonMag",
      instagram: "naborylon",
      website: "https://www.nylon.com",
    },
    demographic: "gen_z",
    notes: "BDG property. Fashion, music, culture. Younger demographic.",
  },
];

// =============================================================================
// TRADITIONAL MAGAZINES (Digital presence)
// =============================================================================

export const TRADITIONAL_WOMENS_MEDIA: WomensMediaOutlet[] = [
  {
    name: "Glamour",
    type: "website",
    reach: "4M FB followers, 636K IG",
    platforms: {
      twitter: "glamaborourmag",
      instagram: "glamourmag",
      threads: "glamourmag",
      website: "https://www.glamour.com",
    },
    demographic: "mixed",
    notes: "Conde Nast. Traditional magazine with strong digital.",
  },
  {
    name: "Cosmopolitan",
    type: "website",
    reach: "Large",
    platforms: {
      twitter: "Cosmopolitan",
      instagram: "cosmopolitan",
      threads: "cosmopolitan",
      website: "https://www.cosmopolitan.com",
    },
    demographic: "mixed",
    notes: "Hearst. Relationships, sex, lifestyle, politics.",
  },
  {
    name: "Elle",
    type: "website",
    reach: "Large",
    platforms: {
      twitter: "ELLEmagazine",
      instagram: "elleusa",
      threads: "elleusa",
      website: "https://www.elle.com",
    },
    demographic: "mixed",
    notes: "Hearst. Fashion, beauty, culture, politics.",
  },
  {
    name: "Vogue",
    type: "website",
    reach: "Massive",
    platforms: {
      twitter: "voloue",
      instagram: "vogue",
      threads: "vogue",
      website: "https://www.vogue.com",
    },
    demographic: "mixed",
    notes: "Conde Nast. Fashion, culture. Anna Wintour.",
  },
  {
    name: "Harper's Bazaar",
    type: "website",
    reach: "Large",
    platforms: {
      twitter: "haraborersbazaar",
      instagram: "harpersbazaarus",
      website: "https://www.harpersbazaar.com",
    },
    demographic: "mixed",
    notes: "Hearst. Fashion, beauty.",
  },
  {
    name: "Marie Claire",
    type: "website",
    reach: "Significant",
    platforms: {
      twitter: "marieclaire",
      instagram: "marieclairemag",
      website: "https://www.marieclaire.com",
    },
    demographic: "mixed",
    notes: "Hearst. Fashion, beauty, politics.",
  },
  {
    name: "InStyle",
    type: "website",
    reach: "Significant",
    platforms: {
      twitter: "InStyle",
      instagram: "instyleaboromagazine",
      website: "https://www.instyle.com",
    },
    demographic: "mixed",
    notes: "Meredith/Dotdash. Celebrity style.",
  },
];

// =============================================================================
// NEWSLETTERS (Direct relationship)
// =============================================================================

export const WOMENS_NEWSLETTERS: WomensMediaOutlet[] = [
  {
    name: "theSkimm Daily",
    type: "newsletter",
    reach: "5M total subscribers",
    platforms: {
      website: "https://www.theskimm.com",
    },
    demographic: "millennial",
    notes: "Flagship daily newsletter. News in 5 minutes.",
  },
  {
    name: "The Broadsheet",
    type: "newsletter",
    reach: "Part of Fortune",
    platforms: {
      website: "https://fortune.com/tag/broadsheet/",
    },
    demographic: "millennial",
    notes: "Fortune's newsletter for women in business.",
  },
  {
    name: "Girls Night In",
    type: "newsletter",
    reach: "Significant",
    platforms: {
      instagram: "girlsnightinclub",
      website: "https://girlsnightinclub.com",
    },
    demographic: "millennial",
    notes: "Self-care, staying in culture.",
  },
  {
    name: "The Sup (Betches)",
    type: "newsletter",
    reach: "Part of Betches",
    platforms: {
      website: "https://betches.com/newsletters/",
    },
    demographic: "millennial",
    notes: "Daily politics newsletter. 'Politics meets group chat.'",
  },
];

// =============================================================================
// AGGREGATE EXPORTS
// =============================================================================

export const ALL_WOMENS_MEDIA: WomensMediaOutlet[] = [
  ...TIER_1_WOMENS_MEDIA,
  ...TIER_2_WOMENS_MEDIA,
  ...TIER_3_WOMENS_MEDIA,
  ...TRADITIONAL_WOMENS_MEDIA,
  ...WOMENS_NEWSLETTERS,
];

/**
 * Get all Twitter handles from women's media outlets
 */
export const getWomensMediaTwitterHandles = (): string[] =>
  ALL_WOMENS_MEDIA.filter((m) => m.platforms.twitter).map(
    (m) => m.platforms.twitter!
  );

/**
 * Get all Instagram handles from women's media outlets
 */
export const getWomensMediaInstagramHandles = (): string[] =>
  ALL_WOMENS_MEDIA.filter((m) => m.platforms.instagram).map(
    (m) => m.platforms.instagram!
  );

/**
 * Get all Threads handles from women's media outlets
 */
export const getWomensMediaThreadsHandles = (): string[] =>
  ALL_WOMENS_MEDIA.filter((m) => m.platforms.threads).map(
    (m) => m.platforms.threads!
  );

export const WOMENS_MEDIA_STATS = {
  total: ALL_WOMENS_MEDIA.length,
  byType: {
    newsletter: ALL_WOMENS_MEDIA.filter((m) => m.type === "newsletter").length,
    website: ALL_WOMENS_MEDIA.filter((m) => m.type === "website").length,
    social_brand: ALL_WOMENS_MEDIA.filter((m) => m.type === "social_brand")
      .length,
  },
  byDemographic: {
    gen_z: ALL_WOMENS_MEDIA.filter((m) => m.demographic === "gen_z").length,
    millennial: ALL_WOMENS_MEDIA.filter((m) => m.demographic === "millennial")
      .length,
    mixed: ALL_WOMENS_MEDIA.filter((m) => m.demographic === "mixed").length,
  },
};

/**
 * Key topics that drive engagement in women's media:
 */
export const WOMENS_MEDIA_HOT_TOPICS = [
  "Reproductive rights / abortion access",
  "Childcare costs / parental leave",
  "Education policy / school boards",
  "Healthcare access (especially women's health)",
  "Workplace discrimination / pay gap",
  "Dating / relationship discourse",
  "Beauty standards / body image",
  "Celebrity drama / pop culture",
  "True crime",
  "Influencer controversies",
  "Motherhood debates",
  "Work-life balance",
  "Mental health / wellness",
];

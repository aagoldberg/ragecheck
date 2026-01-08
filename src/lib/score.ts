export type SignalCategory =
  | "loadedLanguage"
  | "absolutist"
  | "threatPanic"
  | "usVsThem"
  | "engagementBait";

export interface Highlight {
  start: number;
  end: number;
  category: SignalCategory;
  text: string;
}

export interface SignalBreakdown {
  loadedLanguage: number;
  absolutist: number;
  threatPanic: number;
  usVsThem: number;
  engagementBait: number;
}

export interface ScoreResult {
  score: number;
  label: "Low" | "Medium" | "High";
  reasons: string[];
  highlights: Highlight[];
  signalBreakdown: SignalBreakdown;
}

// Signal dictionaries - words/phrases for each category
// These are case-insensitive patterns
const SIGNAL_DICTIONARIES: Record<SignalCategory, string[]> = {
  loadedLanguage: [
    "disgusting",
    "evil",
    "traitor",
    "traitors",
    "scum",
    "corrupt",
    "corruption",
    "woke",
    "fascist",
    "fascists",
    "snowflake",
    "snowflakes",
    "radical",
    "radicals",
    "extremist",
    "extremists",
    "crazy",
    "insane",
    "lunatic",
    "lunatics",
    "deranged",
    "pathetic",
    "disgusted",
    "sickening",
    "horrific",
    "horrifying",
    "appalling",
    "shameful",
    "shameless",
    "despicable",
    "vile",
    "toxic",
    "hateful",
    "bigot",
    "bigots",
    "racist",
    "racists",
    "sexist",
    "nazis",
    "nazi",
    "communist",
    "communists",
    "socialist",
    "socialists",
    "libtard",
    "libtards",
    "deplorable",
    "deplorables",
    "mob",
    "thug",
    "thugs",
    "criminal",
    "criminals",
    "monster",
    "monsters",
    "demon",
    "demons",
    "demonic",
    "satanic",
    "unhinged",
    "outrageous",
  ],

  absolutist: [
    "always",
    "never",
    "everyone knows",
    "no one is talking about",
    "the truth is",
    "the fact is",
    "obviously",
    "clearly",
    "undeniably",
    "without question",
    "without a doubt",
    "absolutely",
    "completely",
    "totally",
    "entirely",
    "nothing",
    "everything",
    "all of them",
    "none of them",
    "every single",
    "not a single",
    "100%",
    "zero",
    "impossible",
    "guaranteed",
    "proven",
    "fact",
    "undisputed",
    "irrefutable",
    "unquestionable",
    "beyond doubt",
    "no way",
    "only way",
    "the only",
    "must be",
    "has to be",
    "can only be",
    "there is no",
    "there are no",
  ],

  threatPanic: [
    "they're coming for",
    "coming for your",
    "coming for our",
    "destroying",
    "destruction",
    "under attack",
    "end of",
    "collapse",
    "collapsing",
    "crisis",
    "emergency",
    "threat",
    "threatens",
    "threatening",
    "danger",
    "dangerous",
    "deadly",
    "death of",
    "dying",
    "killing",
    "war on",
    "attack on",
    "assault on",
    "invasion",
    "invading",
    "infiltrating",
    "takeover",
    "take over",
    "seizing",
    "stolen",
    "stealing",
    "catastrophe",
    "catastrophic",
    "disaster",
    "disastrous",
    "apocalypse",
    "apocalyptic",
    "existential",
    "survival",
    "survive",
    "fight for",
    "fighting for",
    "battle for",
    "save",
    "saving",
    "protect",
    "defend",
    "before it's too late",
    "wake up",
    "time is running out",
    "last chance",
    "final",
    "permanent",
    "irreversible",
  ],

  usVsThem: [
    "they",
    "them",
    "those people",
    "these people",
    "real americans",
    "true americans",
    "patriots",
    "elites",
    "elite",
    "establishment",
    "the left",
    "the right",
    "leftists",
    "rightists",
    "liberals",
    "conservatives",
    "democrats",
    "republicans",
    "mainstream media",
    "msm",
    "the media",
    "big tech",
    "big pharma",
    "globalists",
    "globalist",
    "deep state",
    "swamp",
    "ruling class",
    "coastal elites",
    "hollywood",
    "wall street",
    "silicon valley",
    "the rich",
    "billionaires",
    "corporations",
    "corporate",
    "insiders",
    "outsiders",
    "ordinary people",
    "regular people",
    "working class",
    "real people",
    "average american",
    "middle america",
    "flyover",
    "us vs them",
    "our side",
    "their side",
    "our people",
    "their agenda",
    "special interests",
  ],

  engagementBait: [
    "you won't believe",
    "shocking",
    "shocked",
    "outrage",
    "outraged",
    "outrageous",
    "furious",
    "fury",
    "explosive",
    "bombshell",
    "breaking",
    "must see",
    "must read",
    "must watch",
    "share this",
    "spread the word",
    "watch until the end",
    "wait for it",
    "unbelievable",
    "incredible",
    "insane",
    "mind-blowing",
    "jaw-dropping",
    "stunning",
    "devastating",
    "damning",
    "exposed",
    "exposes",
    "reveals",
    "revealed",
    "secret",
    "secrets",
    "hidden",
    "cover-up",
    "coverup",
    "scandal",
    "scandalous",
    "controversial",
    "controversy",
    "backlash",
    "slammed",
    "blasted",
    "destroyed",
    "demolished",
    "obliterated",
    "torched",
    "ripped",
    "hammered",
    "roasted",
    "schooled",
    "owned",
    "epic",
    "brutal",
    "savage",
    "goes viral",
    "viral",
    "trending",
    "internet is losing it",
    "people are saying",
  ],
};

// Weight for each category (how much it contributes to final score)
const CATEGORY_WEIGHTS: Record<SignalCategory, number> = {
  loadedLanguage: 25,
  absolutist: 15,
  threatPanic: 25,
  usVsThem: 15,
  engagementBait: 20,
};

// Descriptions for generating reasons
const CATEGORY_DESCRIPTIONS: Record<SignalCategory, string> = {
  loadedLanguage: "Heavy loaded language and emotional appeals",
  absolutist: "Strong absolutist/certainty language",
  threatPanic: "Threat and moral panic framing",
  usVsThem: "Us-vs-them divisive framing",
  engagementBait: "Engagement bait and outrage cues",
};

// Find all matches of patterns in text
function findMatches(
  text: string,
  patterns: string[],
  category: SignalCategory
): { count: number; highlights: Highlight[] } {
  const lowerText = text.toLowerCase();
  const highlights: Highlight[] = [];
  let count = 0;

  for (const pattern of patterns) {
    const lowerPattern = pattern.toLowerCase();
    let searchStart = 0;

    while (true) {
      const index = lowerText.indexOf(lowerPattern, searchStart);
      if (index === -1) break;

      // Check word boundaries (avoid partial matches)
      const before = index === 0 ? " " : lowerText[index - 1];
      const after =
        index + lowerPattern.length >= lowerText.length
          ? " "
          : lowerText[index + lowerPattern.length];

      const isWordBoundaryBefore = /[\s\.,;:!?"'()\[\]{}<>\/\-]/.test(before);
      const isWordBoundaryAfter = /[\s\.,;:!?"'()\[\]{}<>\/\-]/.test(after);

      if (isWordBoundaryBefore && isWordBoundaryAfter) {
        count++;
        highlights.push({
          start: index,
          end: index + lowerPattern.length,
          category,
          text: text.substring(index, index + lowerPattern.length),
        });
      }

      searchStart = index + 1;
    }
  }

  return { count, highlights };
}

// Calculate normalized score per 1000 words
function normalizeCount(count: number, wordCount: number): number {
  if (wordCount === 0) return 0;
  return (count / wordCount) * 1000;
}

// Cap normalized count to avoid extreme inflation
function capNormalizedCount(normalized: number, cap: number = 50): number {
  return Math.min(normalized, cap);
}

export function analyzeText(text: string): ScoreResult {
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  const allHighlights: Highlight[] = [];
  const rawCounts: Record<SignalCategory, number> = {
    loadedLanguage: 0,
    absolutist: 0,
    threatPanic: 0,
    usVsThem: 0,
    engagementBait: 0,
  };

  const normalizedCounts: Record<SignalCategory, number> = {
    loadedLanguage: 0,
    absolutist: 0,
    threatPanic: 0,
    usVsThem: 0,
    engagementBait: 0,
  };

  // Find matches for each category
  for (const category of Object.keys(SIGNAL_DICTIONARIES) as SignalCategory[]) {
    const { count, highlights } = findMatches(
      text,
      SIGNAL_DICTIONARIES[category],
      category
    );
    rawCounts[category] = count;
    normalizedCounts[category] = capNormalizedCount(
      normalizeCount(count, wordCount)
    );
    allHighlights.push(...highlights);
  }

  // Deduplicate overlapping highlights (keep the first one found)
  const sortedHighlights = allHighlights.sort((a, b) => a.start - b.start);
  const dedupedHighlights: Highlight[] = [];
  let lastEnd = -1;

  for (const h of sortedHighlights) {
    if (h.start >= lastEnd) {
      dedupedHighlights.push(h);
      lastEnd = h.end;
    }
  }

  // Calculate signal breakdown (0-100 scale for each)
  const signalBreakdown: SignalBreakdown = {
    loadedLanguage: Math.min(100, normalizedCounts.loadedLanguage * 10),
    absolutist: Math.min(100, normalizedCounts.absolutist * 8),
    threatPanic: Math.min(100, normalizedCounts.threatPanic * 10),
    usVsThem: Math.min(100, normalizedCounts.usVsThem * 5),
    engagementBait: Math.min(100, normalizedCounts.engagementBait * 10),
  };

  // Calculate base score from weighted category contributions
  let score = 0;
  for (const category of Object.keys(CATEGORY_WEIGHTS) as SignalCategory[]) {
    const contribution =
      (signalBreakdown[category] / 100) * CATEGORY_WEIGHTS[category];
    score += contribution;
  }

  // Co-occurrence bonus: if multiple categories are high, add bonus
  const highCategories = Object.values(signalBreakdown).filter(
    (v) => v >= 40
  ).length;
  if (highCategories >= 3) {
    score += 10;
  } else if (highCategories >= 2) {
    score += 5;
  }

  // Clamp score
  score = Math.min(100, Math.max(0, Math.round(score)));

  // Determine label
  let label: "Low" | "Medium" | "High";
  if (score <= 33) {
    label = "Low";
  } else if (score <= 66) {
    label = "Medium";
  } else {
    label = "High";
  }

  // Generate reasons (top categories with significant presence)
  const reasons: string[] = [];
  const sortedCategories = (
    Object.keys(signalBreakdown) as SignalCategory[]
  ).sort((a, b) => signalBreakdown[b] - signalBreakdown[a]);

  for (const category of sortedCategories) {
    if (signalBreakdown[category] >= 20 && reasons.length < 5) {
      let reason = CATEGORY_DESCRIPTIONS[category];

      // Add example matches for context
      const categoryHighlights = dedupedHighlights
        .filter((h) => h.category === category)
        .slice(0, 3)
        .map((h) => `"${h.text}"`);

      if (categoryHighlights.length > 0) {
        reason += ` (${categoryHighlights.join(", ")})`;
      }

      reasons.push(reason);
    }
  }

  // Always provide at least one reason
  if (reasons.length === 0) {
    if (score > 0) {
      reasons.push("Minor presence of outrage-bait patterns detected");
    } else {
      reasons.push("No significant outrage-bait patterns detected");
    }
  }

  // Limit highlights to avoid overwhelming UI
  const limitedHighlights = dedupedHighlights.slice(0, 50);

  return {
    score,
    label,
    reasons,
    highlights: limitedHighlights,
    signalBreakdown,
  };
}

// Export dictionaries for documentation/customization
export { SIGNAL_DICTIONARIES, CATEGORY_WEIGHTS, CATEGORY_DESCRIPTIONS };

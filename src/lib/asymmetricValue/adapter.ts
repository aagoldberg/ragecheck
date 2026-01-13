/**
 * Adapter: Maps existing RageCheck analysis to AsymmetricValue input
 *
 * This bridges the current analysis output to the new Asymmetric Value system.
 */

import {
  AsymmetricValueInput,
  ContentType,
  LanguageCategory,
  LanguageFeatures,
  Citation,
  ExtractedClaim,
} from "./types";

interface SignalBreakdown {
  arousal: number;
  enemy_construction: number;
  moral_condemnation: number;
  simplification: number;
  call_to_conflict: number;
}

interface Highlight {
  text: string;
  category: string;
}

interface AnalysisResult {
  score?: number;
  signalBreakdown?: SignalBreakdown;
  title?: string;
  sourceDomain?: string;
  textPreview?: string;
  highlights?: Highlight[];
  reasons?: string[];
  techniqueExplanations?: string[];
  sharingPatterns?: string[];
}

/**
 * Detect content type from URL or domain
 */
function detectContentType(url: string, domain?: string): ContentType {
  const lowerUrl = url.toLowerCase();
  const lowerDomain = (domain || "").toLowerCase();

  if (
    lowerUrl.includes("twitter.com") ||
    lowerUrl.includes("x.com") ||
    lowerDomain.includes("twitter") ||
    lowerDomain.includes("x.com")
  ) {
    return "tweet";
  }

  if (lowerUrl.includes("bsky.app") || lowerDomain.includes("bsky")) {
    return "bluesky_post";
  }

  if (url.startsWith("data:image") || url.includes("blob:")) {
    return "screenshot";
  }

  return "article";
}

/**
 * Map signal breakdown categories to language categories
 */
function mapCategories(
  signalBreakdown: SignalBreakdown,
  highlights?: Highlight[]
): LanguageCategory[] {
  const categories: LanguageCategory[] = [];

  // Map from 5-bar model to language categories
  if (signalBreakdown.enemy_construction >= 40) {
    categories.push("enemy_construction");
  }

  if (signalBreakdown.moral_condemnation >= 40) {
    categories.push("moral_purity_test");
  }

  if (signalBreakdown.call_to_conflict >= 40) {
    categories.push("call_to_punish");
  }

  if (signalBreakdown.arousal >= 60) {
    categories.push("fear_alert");
  }

  // Infer additional categories from highlights
  if (highlights) {
    const highlightTexts = highlights.map((h) => h.text.toLowerCase()).join(" ");

    if (
      highlightTexts.includes("share") ||
      highlightTexts.includes("retweet") ||
      highlightTexts.includes("spread")
    ) {
      categories.push("call_to_share");
    }

    if (
      highlightTexts.includes("betray") ||
      highlightTexts.includes("sold out") ||
      highlightTexts.includes("backstab")
    ) {
      categories.push("betrayal_narrative");
    }

    if (
      highlightTexts.includes("doom") ||
      highlightTexts.includes("collapse") ||
      highlightTexts.includes("end of")
    ) {
      categories.push("doom_loop");
    }

    if (
      highlightTexts.includes("humiliat") ||
      highlightTexts.includes("embarrass") ||
      highlightTexts.includes("own") ||
      highlightTexts.includes("ratio")
    ) {
      categories.push("humiliation");
    }
  }

  // Deduplicate
  return [...new Set(categories)];
}

/**
 * Compute language features from signal breakdown
 */
function computeLanguageFeatures(
  signalBreakdown: SignalBreakdown,
  highlights?: Highlight[],
  textPreview?: string
): LanguageFeatures {
  // Heat score: weighted combination of emotional signals
  const heat_score = Math.round(
    signalBreakdown.arousal * 0.35 +
      signalBreakdown.enemy_construction * 0.25 +
      signalBreakdown.moral_condemnation * 0.25 +
      signalBreakdown.call_to_conflict * 0.15
  );

  // Evidence score: inverse of simplification + base from low arousal
  // Higher simplification = lower evidence
  const evidence_score = Math.round(
    Math.max(0, 100 - signalBreakdown.simplification * 0.7 - signalBreakdown.arousal * 0.3)
  );

  // Agency score: how much it calls for action
  const agency_score = Math.round(
    signalBreakdown.call_to_conflict * 0.6 +
      signalBreakdown.moral_condemnation * 0.4
  );

  // Ambiguity score: based on simplification and lack of specifics
  const ambiguity_score = Math.round(signalBreakdown.simplification * 0.8);

  const categories = mapCategories(signalBreakdown, highlights);

  return {
    heat_score: Math.min(100, Math.max(0, heat_score)),
    evidence_score: Math.min(100, Math.max(0, evidence_score)),
    agency_score: Math.min(100, Math.max(0, agency_score)),
    ambiguity_score: Math.min(100, Math.max(0, ambiguity_score)),
    categories,
  };
}

/**
 * Extract claims from text and highlights
 */
function extractClaims(
  textPreview?: string,
  highlights?: Highlight[]
): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];

  // Use highlights as proxy for claims
  if (highlights) {
    highlights.slice(0, 5).forEach((h) => {
      claims.push({ claim_text: h.text });
    });
  }

  return claims;
}

/**
 * Detect if content has date context
 */
function detectDateContext(textPreview?: string): {
  has_date: boolean;
  detected_date?: string;
} {
  if (!textPreview) {
    return { has_date: false };
  }

  // Simple date patterns
  const datePatterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b(today|yesterday|last week|this week|last month)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = textPreview.match(pattern);
    if (match) {
      return {
        has_date: true,
        detected_date: new Date().toISOString(), // Simplified: just mark as detected
      };
    }
  }

  return { has_date: false };
}

/**
 * Main adapter function
 */
export function adaptAnalysisToInput(
  url: string,
  analysis: AnalysisResult
): AsymmetricValueInput {
  const signalBreakdown = analysis.signalBreakdown || {
    arousal: 0,
    enemy_construction: 0,
    moral_condemnation: 0,
    simplification: 0,
    call_to_conflict: 0,
  };

  const languageFeatures = computeLanguageFeatures(
    signalBreakdown,
    analysis.highlights,
    analysis.textPreview
  );

  const dateContext = detectDateContext(analysis.textPreview);

  const extractedClaims = extractClaims(
    analysis.textPreview,
    analysis.highlights
  );

  // For now, we don't have citation extraction - mark as empty
  const citations: Citation[] = [];

  return {
    content_type: detectContentType(url, analysis.sourceDomain),
    original_url: url,
    post_text: analysis.textPreview || analysis.title || "",
    extracted_claims: extractedClaims,
    citations_found: citations,
    has_date_context: dateContext.has_date,
    detected_date: dateContext.detected_date,
    language_features: languageFeatures,
    // Template matching would require additional analysis
    template_match: undefined,
    user_context: undefined,
  };
}

/**
 * Quick validation for input
 */
export function validateInput(input: AsymmetricValueInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.original_url) {
    errors.push("Missing original_url");
  }

  if (!input.post_text && input.content_type !== "screenshot") {
    errors.push("Missing post_text");
  }

  if (!input.language_features) {
    errors.push("Missing language_features");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

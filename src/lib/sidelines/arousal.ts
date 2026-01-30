/**
 * SideLines Arousal Scorer
 *
 * Fast lexicon-based arousal scoring for social media posts.
 * Reuses RageCheck lexicons for consistency. No LLM calls.
 * ~5000 posts/sec, pure computation.
 */

import {
  EMOTION_ANGER_FEAR_DISGUST,
  URGENCY_WORDS,
  INTENSIFIERS,
  MORAL_JUDGMENT_TERMS,
  PURITY_CONTAMINATION,
  DEHUMANIZATION_TERMS,
  ABSOLUTIST_TERMS,
} from "@/lib/model/lexicons";
import {
  tokenize,
  countPunctuation,
  findPatternMatches,
} from "@/lib/model/preprocess";
import type { ArousalBreakdown, ArousalResult } from "./types";

// Component weights (sum = 1.0)
const WEIGHTS = {
  emotionAngerFearDisgust: 0.25,
  urgency: 0.15,
  intensifiers: 0.10,
  moralJudgment: 0.15,
  purityContamination: 0.10,
  dehumanization: 0.15,
  absolutist: 0.10,
};

/**
 * Score a single component: proportion of matched tokens capped at 1.0
 */
function scoreComponent(
  text: string,
  tokens: string[],
  lexicon: (string | RegExp)[]
): number {
  const matches = findPatternMatches(text, lexicon);
  if (tokens.length === 0) return 0;

  const matchCount = matches.length;
  // 1 match = 0.3, 2 = 0.5, 3 = 0.7, 4+ = scaled up to 1.0
  if (matchCount === 0) return 0;
  if (matchCount === 1) return 0.3;
  if (matchCount === 2) return 0.5;
  if (matchCount === 3) return 0.7;

  // Density-based for 4+ matches
  const density = matchCount / tokens.length;
  return Math.min(1.0, 0.7 + density * 5);
}

/**
 * Compute arousal score for a single text.
 * Returns score (0-1) and a 7-component breakdown.
 */
export function computeArousal(text: string): ArousalResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      breakdown: {
        emotionAngerFearDisgust: 0,
        urgency: 0,
        intensifiers: 0,
        moralJudgment: 0,
        purityContamination: 0,
        dehumanization: 0,
        absolutist: 0,
      },
    };
  }

  const tokens = tokenize(text);
  const punct = countPunctuation(text);

  const breakdown: ArousalBreakdown = {
    emotionAngerFearDisgust: scoreComponent(text, tokens, EMOTION_ANGER_FEAR_DISGUST),
    urgency: scoreComponent(text, tokens, URGENCY_WORDS),
    intensifiers: scoreComponent(text, tokens, INTENSIFIERS),
    moralJudgment: scoreComponent(text, tokens, MORAL_JUDGMENT_TERMS),
    purityContamination: scoreComponent(text, tokens, PURITY_CONTAMINATION),
    dehumanization: scoreComponent(text, tokens, DEHUMANIZATION_TERMS),
    absolutist: scoreComponent(text, tokens, ABSOLUTIST_TERMS),
  };

  // Weighted sum
  let score =
    breakdown.emotionAngerFearDisgust * WEIGHTS.emotionAngerFearDisgust +
    breakdown.urgency * WEIGHTS.urgency +
    breakdown.intensifiers * WEIGHTS.intensifiers +
    breakdown.moralJudgment * WEIGHTS.moralJudgment +
    breakdown.purityContamination * WEIGHTS.purityContamination +
    breakdown.dehumanization * WEIGHTS.dehumanization +
    breakdown.absolutist * WEIGHTS.absolutist;

  // Punctuation boost: heavy exclamation/ALL CAPS adds up to 0.1
  const punctBoost = Math.min(0.1, punct.intensity * 0.01);
  score = Math.min(1.0, score + punctBoost);

  // ALL CAPS boost
  const words = text.split(/\s+/).filter((w) => w.length >= 3);
  const capsWords = words.filter(
    (w) => w === w.toUpperCase() && /[A-Z]/.test(w)
  );
  if (words.length > 0) {
    const capsRatio = capsWords.length / words.length;
    if (capsRatio > 0.3) {
      score = Math.min(1.0, score + 0.05);
    }
  }

  return {
    score: Math.round(score * 10000) / 10000,
    breakdown,
  };
}

/**
 * Batch compute arousal for multiple texts.
 */
export function computeArousalBatch(texts: string[]): ArousalResult[] {
  return texts.map(computeArousal);
}

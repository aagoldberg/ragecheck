// Bar scoring modules - combine signals into bar scores
// Each bar uses multiple weighted signals

import { BarResult, PreprocessedText, SignalBreakdownItem } from "./types";
import * as signals from "./signals";

// Helper to combine signals with weights
function combineSignals(
  signalResults: { name: string; weight: number; result: ReturnType<typeof signals.detectEmotionLexicon> }[]
): BarResult {
  let totalWeight = 0;
  let weightedSum = 0;
  const allEvidence: string[] = [];
  const signalBreakdown: SignalBreakdownItem[] = [];

  for (const { name, weight, result } of signalResults) {
    totalWeight += weight;
    weightedSum += result.score01 * weight;
    allEvidence.push(...result.evidence);
    signalBreakdown.push({
      name,
      weight,
      score01: result.score01,
      evidence: result.evidence,
    });
  }

  const score01 = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const score100 = Math.round(score01 * 100);

  return {
    score100,
    evidence: [...new Set(allEvidence)].slice(0, 10),
    signalBreakdown,
  };
}

/**
 * Bar 1: Arousal
 * Measures emotional intensity and urgency
 *
 * Signals:
 * - Emotion lexicon hits (anger/fear/disgust)
 * - Urgency words
 * - Punctuation intensity (!, ?, ALL CAPS)
 * - Intensifiers
 */
export function computeArousal(prep: PreprocessedText): BarResult {
  return combineSignals([
    { name: "Emotion Lexicon", weight: 0.30, result: signals.detectEmotionLexicon(prep) },
    { name: "Urgency Words", weight: 0.25, result: signals.detectUrgencyWords(prep) },
    { name: "Punctuation Intensity", weight: 0.25, result: signals.detectPunctuationIntensity(prep) },
    { name: "Intensifiers", weight: 0.20, result: signals.detectIntensifiers(prep) },
  ]);
}

/**
 * Bar 2: Enemy Construction
 * Detects othering, dehumanization, and scapegoating
 *
 * Signals:
 * - Group generalizations ("they all", "the left/right")
 * - Malicious intent attribution ("they want to destroy")
 * - Dehumanization terms (vermin, parasites)
 * - Scapegoat patterns ("X is to blame for Y")
 */
export function computeEnemyConstruction(prep: PreprocessedText): BarResult {
  return combineSignals([
    { name: "Group Generalizations", weight: 0.25, result: signals.detectGroupGeneralizations(prep) },
    { name: "Malicious Intent", weight: 0.25, result: signals.detectMaliciousIntent(prep) },
    { name: "Dehumanization", weight: 0.30, result: signals.detectDehumanization(prep) },
    { name: "Scapegoating", weight: 0.20, result: signals.detectScapegoating(prep) },
  ]);
}

/**
 * Bar 3: Moral Condemnation
 * Detects moral outrage and purity rhetoric
 *
 * Signals:
 * - Moral judgment terms (evil, corrupt, traitor)
 * - Purity/contamination metaphors (poison, infect, rot)
 * - Betrayal framing (sold out, backstab)
 */
export function computeMoralCondemnation(prep: PreprocessedText): BarResult {
  return combineSignals([
    { name: "Moral Judgment", weight: 0.40, result: signals.detectMoralJudgment(prep) },
    { name: "Purity/Contamination", weight: 0.35, result: signals.detectPurityContamination(prep) },
    { name: "Betrayal Framing", weight: 0.25, result: signals.detectBetrayalFraming(prep) },
  ]);
}

/**
 * Bar 4: Simplification
 * Detects black-and-white thinking and oversimplification
 *
 * Signals:
 * - Absolutist terms (always, never, everyone)
 * - False dilemma patterns (either/or)
 * - Causal oversimplification ("this is why")
 * - Slogan/repetition
 */
export function computeSimplification(prep: PreprocessedText): BarResult {
  return combineSignals([
    { name: "Absolutist Terms", weight: 0.35, result: signals.detectAbsolutistTerms(prep) },
    { name: "False Dilemma", weight: 0.25, result: signals.detectFalseDilemma(prep) },
    { name: "Causal Oversimplification", weight: 0.25, result: signals.detectCausalOversimplification(prep) },
    { name: "Repetition/Slogans", weight: 0.15, result: signals.detectRepetition(prep) },
  ]);
}

/**
 * Bar 5: Call-to-Conflict
 * Detects engagement bait and provocation
 *
 * Signals:
 * - Reply bait templates ("how is this allowed")
 * - Rhetorical question density
 * - Second-person provocation ("you people", "if you support X")
 */
export function computeCallToConflict(prep: PreprocessedText): BarResult {
  return combineSignals([
    { name: "Reply Bait", weight: 0.40, result: signals.detectReplyBait(prep) },
    { name: "Rhetorical Questions", weight: 0.30, result: signals.detectRhetoricalQuestionDensity(prep) },
    { name: "Second-Person Provocation", weight: 0.30, result: signals.detectSecondPersonProvocation(prep) },
  ]);
}

/**
 * Modifier A: Reporting/Analysis Discount
 * Reduces false positives for journalistic/analytical text
 *
 * Signals:
 * - Attribution verbs ("said", "claimed", "according to")
 * - Quotation marks
 * - Hedging terms ("appears", "suggests", "may")
 * - Multi-perspective markers ("however", "critics say")
 * - Analytic structure (longer, multi-sentence)
 */
export function computeReportingDiscount(prep: PreprocessedText): BarResult {
  return combineSignals([
    { name: "Attribution Verbs", weight: 0.25, result: signals.detectAttributionVerbs(prep) },
    { name: "Quotations", weight: 0.20, result: signals.detectQuotations(prep) },
    { name: "Hedging", weight: 0.20, result: signals.detectHedging(prep) },
    { name: "Multi-Perspective", weight: 0.20, result: signals.detectMultiPerspective(prep) },
    { name: "Analytic Structure", weight: 0.15, result: signals.detectAnalyticStructure(prep) },
  ]);
}

/**
 * Modifier B: Information Density
 * Measures substance vs pure rhetoric
 *
 * Signals:
 * - Named entities count
 * - Numbers/dates/percentages
 * - Links/domains
 */
export function computeInformationDensity(prep: PreprocessedText): BarResult {
  // Single signal, but structured as bar for consistency
  const result = signals.detectInformationDensity(prep);
  return {
    score100: Math.round(result.score01 * 100),
    evidence: result.evidence,
    signalBreakdown: [{
      name: "Information Density",
      weight: 1.0,
      score01: result.score01,
      evidence: result.evidence,
    }],
  };
}

// Final scoring function
// Implements the exact formula from the spec

import {
  AnalysisResult,
  BarName,
  ModifierName,
  Label,
  TopSignal,
  PreprocessedText,
} from "./types";
import { preprocess } from "./preprocess";
import * as bars from "./bars";

// Bar weights (must sum to 1.0)
const BAR_WEIGHTS: Record<BarName, number> = {
  arousal: 0.20,
  enemy_construction: 0.25,
  moral_condemnation: 0.20,
  simplification: 0.15,
  call_to_conflict: 0.20,
};

// Clamp value to range
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Generate label from score
// Thresholds calibrated to test samples
function getLabel(score: number): Label {
  if (score >= 50) return "ragebait";
  if (score >= 10) return "borderline";
  return "not_ragebait";
}

// Calculate confidence based on bar distribution and discount
function calculateConfidence(
  barScores: Record<BarName, number>,
  reportingDiscount: number
): number {
  // Count bars with high scores (>50)
  const highBars = Object.values(barScores).filter(s => s > 50).length;

  // Base confidence on bar agreement
  let confidence = 0.5;

  // Higher confidence when 3+ bars are high
  if (highBars >= 3) {
    confidence = 0.85;
  } else if (highBars >= 2) {
    confidence = 0.7;
  } else if (highBars === 1) {
    // Only one bar high - check if it's just arousal
    if (barScores.arousal > 50 && highBars === 1) {
      confidence = 0.4; // Lower confidence for arousal-only
    } else {
      confidence = 0.55;
    }
  }

  // Discount reduces confidence (might be false positive)
  if (reportingDiscount > 50) {
    confidence *= 0.7;
  } else if (reportingDiscount > 25) {
    confidence *= 0.85;
  }

  return Math.round(confidence * 100);
}

// Extract top signals across all bars
function extractTopSignals(
  arousalResult: ReturnType<typeof bars.computeArousal>,
  enemyResult: ReturnType<typeof bars.computeEnemyConstruction>,
  moralResult: ReturnType<typeof bars.computeMoralCondemnation>,
  simplificationResult: ReturnType<typeof bars.computeSimplification>,
  conflictResult: ReturnType<typeof bars.computeCallToConflict>
): TopSignal[] {
  const allSignals: TopSignal[] = [];

  const addSignals = (barName: string, result: ReturnType<typeof bars.computeArousal>) => {
    for (const signal of result.signalBreakdown) {
      if (signal.score01 > 0.1 && signal.evidence.length > 0) {
        allSignals.push({
          name: signal.name,
          bar: barName,
          weight: signal.weight,
          matched: signal.evidence,
        });
      }
    }
  };

  addSignals("arousal", arousalResult);
  addSignals("enemy_construction", enemyResult);
  addSignals("moral_condemnation", moralResult);
  addSignals("simplification", simplificationResult);
  addSignals("call_to_conflict", conflictResult);

  // Sort by weighted score and take top 5
  return allSignals
    .sort((a, b) => {
      const aScore = a.weight * (a.matched.length > 0 ? 1 : 0);
      const bScore = b.weight * (b.matched.length > 0 ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, 5);
}

/**
 * Main analysis function
 * Computes all bars, modifiers, and final bait score
 */
export function analyze(text: string): AnalysisResult {
  // Preprocess text
  const prep: PreprocessedText = preprocess(text);

  // Compute all 5 bars
  const arousalResult = bars.computeArousal(prep);
  const enemyResult = bars.computeEnemyConstruction(prep);
  const moralResult = bars.computeMoralCondemnation(prep);
  const simplificationResult = bars.computeSimplification(prep);
  const conflictResult = bars.computeCallToConflict(prep);

  // Compute modifiers
  const reportingResult = bars.computeReportingDiscount(prep);
  const densityResult = bars.computeInformationDensity(prep);

  // Collect bar scores
  const barScores: Record<BarName, number> = {
    arousal: arousalResult.score100,
    enemy_construction: enemyResult.score100,
    moral_condemnation: moralResult.score100,
    simplification: simplificationResult.score100,
    call_to_conflict: conflictResult.score100,
  };

  // Compute core score as weighted sum of bars
  // core = sum(bar_score * bar_weight) for all bars
  let core = 0;
  for (const [bar, weight] of Object.entries(BAR_WEIGHTS)) {
    core += barScores[bar as BarName] * weight;
  }

  // Apply non-linear boost when multiple bars are high
  // Boosts are NON-STACKING: we take the highest applicable multiplier
  // This prevents multiplicative explosion (e.g., 1.6 * 1.35 = 2.16x)
  const highBars = Object.values(barScores).filter(s => s >= 20).length;
  const veryHighBars = Object.values(barScores).filter(s => s >= 50).length;

  let boost = 1.0;

  // Multi-bar boosts
  if (veryHighBars >= 3) {
    boost = Math.max(boost, 1.6);
  } else if (veryHighBars >= 2 || highBars >= 4) {
    boost = Math.max(boost, 1.45);
  } else if (highBars >= 3) {
    boost = Math.max(boost, 1.35);
  } else if (highBars >= 2) {
    boost = Math.max(boost, 1.25);
  }

  // Special boost for very high call_to_conflict (most ragebait-specific signal)
  if (barScores.call_to_conflict >= 55) {
    boost = Math.max(boost, 1.8);
  } else if (barScores.call_to_conflict >= 40) {
    boost = Math.max(boost, 1.4);
  }

  // Special boost for high enemy_construction + moral_condemnation combo
  if (barScores.enemy_construction >= 30 && barScores.moral_condemnation >= 30) {
    boost = Math.max(boost, 1.3);
  }

  // Special boost for enemy_construction + call_to_conflict combo (contempt + engagement bait)
  if (barScores.enemy_construction >= 30 && barScores.call_to_conflict >= 30) {
    boost = Math.max(boost, 1.5);
  }

  core = core * boost;

  // Apply reporting/analysis discount
  // Formula: bait_score = core * (1 - reporting_discount/125)
  // This means at discount=100, score is multiplied by 0.2 (80% reduction)
  // At discount=0, score is unchanged
  const discountFactor = 1 - (reportingResult.score100 / 125);
  const bait_score = clamp(Math.round(core * discountFactor), 0, 100);

  // Determine label
  const label = getLabel(bait_score);

  // Calculate confidence
  const confidence = calculateConfidence(barScores, reportingResult.score100);

  // Collect evidence
  const evidence: Record<BarName | ModifierName, string[]> = {
    arousal: arousalResult.evidence,
    enemy_construction: enemyResult.evidence,
    moral_condemnation: moralResult.evidence,
    simplification: simplificationResult.evidence,
    call_to_conflict: conflictResult.evidence,
    reporting_analysis_discount: reportingResult.evidence,
    information_density: densityResult.evidence,
  };

  // Extract top signals
  const top_signals = extractTopSignals(
    arousalResult,
    enemyResult,
    moralResult,
    simplificationResult,
    conflictResult
  );

  // Generate explanation
  const explanation = generateExplanation(
    barScores,
    reportingResult.score100,
    densityResult.score100,
    label
  );

  return {
    text,
    bait_score,
    bars: barScores,
    modifiers: {
      reporting_analysis_discount: reportingResult.score100,
      information_density: densityResult.score100,
    },
    evidence,
    top_signals,
    explanation,
    label,
    confidence,
  };
}

/**
 * Generate a non-moralizing, mechanism-based explanation
 */
function generateExplanation(
  barScores: Record<BarName, number>,
  reportingDiscount: number,
  informationDensity: number,
  label: Label
): string {
  // Find top 2 bars
  const sortedBars = Object.entries(barScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  const barNames: Record<BarName, string> = {
    arousal: "emotional arousal",
    enemy_construction: "enemy construction",
    moral_condemnation: "moral condemnation",
    simplification: "oversimplification",
    call_to_conflict: "call-to-conflict",
  };

  const [topBar, topScore] = sortedBars[0];
  const [secondBar, secondScore] = sortedBars[1];

  let explanation = "";

  if (label === "ragebait") {
    explanation = `This text shows strong ${barNames[topBar as BarName]} signals (${topScore}%) combined with ${barNames[secondBar as BarName]} patterns (${secondScore}%). `;
    explanation += "These mechanisms are commonly used to trigger emotional reactions and drive engagement. ";
  } else if (label === "borderline") {
    explanation = `This text contains moderate ${barNames[topBar as BarName]} elements (${topScore}%) and some ${barNames[secondBar as BarName]} patterns (${secondScore}%). `;
    explanation += "While not extreme, these signals suggest content designed more to provoke than inform. ";
  } else {
    if (topScore > 20) {
      explanation = `This text shows low-to-moderate ${barNames[topBar as BarName]} signals (${topScore}%), but lacks the combination of mechanisms typical of ragebait. `;
    } else {
      explanation = `This text shows minimal ragebait signals across all dimensions. `;
    }
  }

  // Add discount context
  if (reportingDiscount > 50) {
    explanation += `The high reporting/analysis discount (${reportingDiscount}%) indicates this may be journalistic or analytical content rather than engagement bait.`;
  } else if (reportingDiscount > 25) {
    explanation += `Some reporting markers present (${reportingDiscount}% discount) suggest partial analytical framing.`;
  }

  return explanation.trim();
}

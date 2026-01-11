// Import the new 5-bar model
import { analyze as modelAnalyze, BarName } from "@/lib/model";

// New 5-bar model signal categories
export type SignalCategory =
  | "arousal"
  | "enemy_construction"
  | "moral_condemnation"
  | "simplification"
  | "call_to_conflict";

export interface Highlight {
  start: number;
  end: number;
  category: SignalCategory;
  text: string;
}

export interface SignalBreakdown {
  arousal: number;
  enemy_construction: number;
  moral_condemnation: number;
  simplification: number;
  call_to_conflict: number;
}

export interface ScoreResult {
  score: number;
  label: "Low" | "Medium" | "High";
  reasons: string[];
  highlights: Highlight[];
  signalBreakdown: SignalBreakdown;
}

// Weight for each category (how much it contributes to final score)
const CATEGORY_WEIGHTS: Record<SignalCategory, number> = {
  arousal: 20,
  enemy_construction: 25,
  moral_condemnation: 20,
  simplification: 15,
  call_to_conflict: 20,
};

// Descriptions for generating reasons
const CATEGORY_DESCRIPTIONS: Record<SignalCategory, string> = {
  arousal: "High emotional intensity and urgency signals",
  enemy_construction: "Othering and dehumanization patterns",
  moral_condemnation: "Moral outrage and purity rhetoric",
  simplification: "Black-and-white thinking and oversimplification",
  call_to_conflict: "Engagement bait and provocation",
};

// Canonical signal labels for UI display
export const SIGNAL_LABELS: Record<SignalCategory, string> = {
  arousal: "Emotional Arousal",
  enemy_construction: "Enemy Construction",
  moral_condemnation: "Moral Condemnation",
  simplification: "Oversimplification",
  call_to_conflict: "Call-to-Conflict",
};

/**
 * Analyze text using the new 5-bar model
 * Returns results in a format compatible with the existing API
 */
export function analyzeText(text: string): ScoreResult {
  // Use the new 5-bar model
  const modelResult = modelAnalyze(text);

  // Map bar scores to signal breakdown
  const signalBreakdown: SignalBreakdown = {
    arousal: modelResult.bars.arousal,
    enemy_construction: modelResult.bars.enemy_construction,
    moral_condemnation: modelResult.bars.moral_condemnation,
    simplification: modelResult.bars.simplification,
    call_to_conflict: modelResult.bars.call_to_conflict,
  };

  // Convert evidence to highlights format
  // We'll create approximate highlights based on evidence strings
  const highlights: Highlight[] = [];
  const lowerText = text.toLowerCase();

  for (const [barName, evidenceList] of Object.entries(modelResult.evidence)) {
    const category = barName as SignalCategory;
    // Skip modifiers, only process bars
    if (!["arousal", "enemy_construction", "moral_condemnation", "simplification", "call_to_conflict"].includes(barName)) {
      continue;
    }

    for (const evidence of evidenceList) {
      // Try to find the evidence text in the original
      const lowerEvidence = evidence.toLowerCase();
      const index = lowerText.indexOf(lowerEvidence);
      if (index !== -1) {
        highlights.push({
          start: index,
          end: index + evidence.length,
          category,
          text: text.substring(index, index + evidence.length),
        });
      }
    }
  }

  // Deduplicate overlapping highlights
  const sortedHighlights = highlights.sort((a, b) => a.start - b.start);
  const dedupedHighlights: Highlight[] = [];
  let lastEnd = -1;

  for (const h of sortedHighlights) {
    if (h.start >= lastEnd) {
      dedupedHighlights.push(h);
      lastEnd = h.end;
    }
  }

  // Map model score to label
  // Model uses: >= 50 ragebait, >= 10 borderline, < 10 not_ragebait
  // We map to: > 66 High, > 33 Medium, <= 33 Low
  let label: "Low" | "Medium" | "High";
  if (modelResult.bait_score >= 50) {
    label = "High";
  } else if (modelResult.bait_score >= 25) {
    label = "Medium";
  } else {
    label = "Low";
  }

  // Generate reasons from top signals
  const reasons: string[] = [];
  const sortedCategories = (Object.keys(signalBreakdown) as SignalCategory[])
    .sort((a, b) => signalBreakdown[b] - signalBreakdown[a]);

  for (const category of sortedCategories) {
    if (signalBreakdown[category] >= 20 && reasons.length < 5) {
      let reason = CATEGORY_DESCRIPTIONS[category];

      // Add example matches for context
      const categoryEvidence = modelResult.evidence[category as BarName] || [];
      if (categoryEvidence.length > 0) {
        const examples = categoryEvidence.slice(0, 3).map(e => `"${e}"`);
        reason += ` (${examples.join(", ")})`;
      }

      reasons.push(reason);
    }
  }

  // Always provide at least one reason
  if (reasons.length === 0) {
    if (modelResult.bait_score > 0) {
      reasons.push("Minor presence of manipulation patterns detected");
    } else {
      reasons.push("No significant manipulation patterns detected");
    }
  }

  return {
    score: modelResult.bait_score,
    label,
    reasons,
    highlights: dedupedHighlights.slice(0, 50),
    signalBreakdown,
  };
}

// Export weights and descriptions for documentation
export { CATEGORY_WEIGHTS, CATEGORY_DESCRIPTIONS };

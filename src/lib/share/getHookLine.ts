import { SignalBreakdown, SIGNAL_LABELS } from "@/lib/score";

export interface HookLineResult {
  hookLine: string;
  topSignals: string[];
}

const SIGNAL_SHORT_LABELS: Record<keyof SignalBreakdown, string> = {
  arousal: "Arousal",
  enemy_construction: "Enemy framing",
  moral_condemnation: "Moral outrage",
  simplification: "Oversimplification",
  call_to_conflict: "Call-to-conflict",
};

/**
 * Generate a hook line for the share image based on scores
 * Returns a punchy one-liner that captures the analysis verdict
 */
export function getHookLine(
  baitScore: number,
  signalBreakdown: SignalBreakdown
): HookLineResult {
  // Get top signals sorted by score
  const sortedSignals = (Object.keys(signalBreakdown) as (keyof SignalBreakdown)[])
    .map(key => ({ key, value: signalBreakdown[key] }))
    .sort((a, b) => b.value - a.value);

  // Always include top 3 signals for the triggers line
  const topSignals = sortedSignals
    .slice(0, 3)
    .map(s => SIGNAL_SHORT_LABELS[s.key]);

  const top1 = sortedSignals[0];
  const top2 = sortedSignals[1];

  let hookLine: string;

  // High bait score (70+)
  if (baitScore >= 75) {
    if (top1.key === "call_to_conflict" && top1.value >= 60) {
      hookLine = "Built to provoke replies.";
    } else if (top1.key === "enemy_construction" && top1.value >= 60) {
      hookLine = "Classic us-vs-them framing.";
    } else if (top1.key === "arousal" && top1.value >= 60) {
      hookLine = "Designed to trigger your emotions.";
    } else {
      hookLine = "This one's trying to start something.";
    }
  }
  // High arousal + enemy construction combo
  else if (signalBreakdown.arousal >= 60 && signalBreakdown.enemy_construction >= 50) {
    hookLine = "High heat + enemy framing.";
  }
  // High call-to-conflict
  else if (signalBreakdown.call_to_conflict >= 60) {
    hookLine = "Built to provoke replies.";
  }
  // Medium-high bait score (50-74)
  else if (baitScore >= 50) {
    if (signalBreakdown.moral_condemnation >= 50) {
      hookLine = "Heavy on moral outrage.";
    } else if (signalBreakdown.simplification >= 50) {
      hookLine = "Oversimplifies the story.";
    } else {
      hookLine = "Worth a second look.";
    }
  }
  // Borderline (35-49)
  else if (baitScore >= 35) {
    hookLine = "Borderline — watch the framing.";
  }
  // Low bait score with some signals
  else if (baitScore >= 20) {
    hookLine = "Mild manipulation patterns.";
  }
  // Very low
  else {
    hookLine = "Low bait — mostly substance.";
  }

  return {
    hookLine,
    topSignals,
  };
}

/**
 * Get a "triggers" line listing the top signals
 */
export function getTriggersLine(topSignals: string[]): string {
  if (topSignals.length === 0) {
    return "";
  }
  return `Triggers: ${topSignals.join(", ")}`;
}

export { SIGNAL_SHORT_LABELS };

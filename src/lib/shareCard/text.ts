/**
 * Text generation helpers for share cards
 * Hook lines, verdicts, and driver selection
 */

export interface Verdict {
  label: string;
  sub: string;
}

export interface Driver {
  key: string;
  label: string;
  value: number;
}

export interface Bar {
  key: string;
  label: string;
  value: number;
}

// Signal key to display label mapping
const SIGNAL_LABELS: Record<string, string> = {
  arousal: "Emotional arousal",
  enemy_construction: "Enemy framing",
  moral_condemnation: "Moral outrage",
  simplification: "Oversimplification",
  call_to_conflict: "Call-to-conflict",
};

/**
 * Get verdict label and subtext based on bait score
 */
export function getVerdict(baitScore: number): Verdict {
  if (baitScore <= 29) return { label: "Low bait", sub: "Mostly substance" };
  if (baitScore <= 49) return { label: "Mild", sub: "Some emotional framing" };
  if (baitScore <= 69) return { label: "Borderline", sub: "Leaning emotional framing" };
  if (baitScore <= 84) return { label: "High bait", sub: "Optimized for reaction" };
  return { label: "Very high", sub: "Designed to provoke" };
}

// SignalBreakdown type from the app
interface SignalBreakdown {
  arousal: number;
  enemy_construction: number;
  moral_condemnation: number;
  simplification: number;
  call_to_conflict: number;
}

/**
 * Get top 2 drivers by value
 */
export function getTopDrivers(
  bars: Bar[] | Record<string, number> | SignalBreakdown
): Driver[] {
  // Handle both array and object formats
  let normalizedBars: Bar[];

  if (Array.isArray(bars)) {
    normalizedBars = bars.map(b => ({
      key: b.key,
      label: b.label || SIGNAL_LABELS[b.key] || b.key,
      // Normalize to 0-100 if value appears to be 0-1
      value: b.value <= 1 ? Math.round(b.value * 100) : Math.round(b.value),
    }));
  } else {
    // Convert object format (including SignalBreakdown) to array
    normalizedBars = Object.entries(bars).map(([key, value]) => ({
      key,
      label: SIGNAL_LABELS[key] || key,
      value: typeof value === "number" ? (value <= 1 ? Math.round(value * 100) : Math.round(value)) : 0,
    }));
  }

  // Sort by value descending and take top 2
  return normalizedBars
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
}

/**
 * Hook line library organized by category and register
 * Tone: Accessible, observational, non-judgmental
 */
const HOOK_LINES = {
  // High bait (75+)
  high: [
    "Heavy on emotion.",
    "Designed to get a reaction.",
    "Strong emotional pull.",
    "Pushing buttons.",
  ],
  // Arousal-focused
  arousal: [
    "Lots of charged language.",
    "Leans on emotion.",
    "Emotionally charged.",
    "High on intensity.",
  ],
  // Enemy framing focused
  enemy: [
    "Draws clear sides.",
    "Us vs. them setup.",
    "Picks a villain.",
    "Takes sides.",
  ],
  // Moral outrage focused
  moral: [
    "Appeals to outrage.",
    "Heavy on moral framing.",
    "Plays to values.",
  ],
  // Medium bait (50-74)
  medium: [
    "A bit of spin.",
    "Mix of facts and framing.",
    "Leans persuasive.",
    "Some emotional pull.",
  ],
  // Low bait (0-49)
  low: [
    "Pretty straightforward.",
    "Sticks to the facts.",
    "Mostly substance.",
    "Light on emotion.",
  ],
};

/**
 * Generate hook line based on score and top drivers
 */
export function getHookLine(baitScore: number, topDrivers: Driver[]): string {
  const primaryDriver = topDrivers[0];
  const primaryKey = primaryDriver?.key?.toLowerCase() || "";
  const primaryValue = primaryDriver?.value || 0;

  // High bait score (75+)
  if (baitScore >= 75) {
    // Check for specific high drivers
    if (primaryKey.includes("arousal") && primaryValue >= 60) {
      return pickDeterministic(HOOK_LINES.arousal, baitScore);
    }
    if (primaryKey.includes("enemy") && primaryValue >= 60) {
      return pickDeterministic(HOOK_LINES.enemy, baitScore);
    }
    return pickDeterministic(HOOK_LINES.high, baitScore);
  }

  // Medium-high (50-74)
  if (baitScore >= 50) {
    // Check dominant driver
    if (primaryKey.includes("arousal") && primaryValue >= 50) {
      return pickDeterministic(HOOK_LINES.arousal, baitScore);
    }
    if (primaryKey.includes("enemy") && primaryValue >= 50) {
      return pickDeterministic(HOOK_LINES.enemy, baitScore);
    }
    if (primaryKey.includes("moral") && primaryValue >= 50) {
      return pickDeterministic(HOOK_LINES.moral, baitScore);
    }
    return pickDeterministic(HOOK_LINES.medium, baitScore);
  }

  // Low bait (0-49)
  return pickDeterministic(HOOK_LINES.low, baitScore);
}

/**
 * Pick an item from an array deterministically based on score
 */
function pickDeterministic(arr: string[], seed: number): string {
  if (arr.length === 0) return "";
  const index = Math.abs(seed) % arr.length;
  return arr[index];
}

/**
 * Get deterministic hook line (always same for same inputs)
 */
export function getDeterministicHookLine(
  baitScore: number,
  topDrivers: Driver[]
): string {
  const primaryDriver = topDrivers[0];
  const primaryKey = primaryDriver?.key?.toLowerCase() || "";
  const primaryValue = primaryDriver?.value || 0;

  // High bait score (75+)
  if (baitScore >= 75) {
    if (primaryKey.includes("arousal") && primaryValue >= 60) {
      return "Lots of charged language.";
    }
    if (primaryKey.includes("enemy") && primaryValue >= 60) {
      return "Draws clear sides.";
    }
    return "Heavy on emotion.";
  }

  // Medium-high (60-74)
  if (baitScore >= 60) {
    if (primaryKey.includes("arousal")) return "Leans on emotion.";
    if (primaryKey.includes("enemy")) return "Us vs. them setup.";
    if (primaryKey.includes("moral")) return "Appeals to outrage.";
    return "Strong emotional pull.";
  }

  // Medium (40-59)
  if (baitScore >= 40) {
    return "A bit of spin.";
  }

  // Low (0-39)
  if (baitScore >= 20) {
    return "Mostly substance.";
  }

  return "Sticks to the facts.";
}

/**
 * Get score color based on bait score
 */
export function getScoreColor(baitScore: number): string {
  if (baitScore <= 33) return "#10b981"; // green
  if (baitScore <= 66) return "#f59e0b"; // amber/orange
  return "#ef4444"; // red
}

/**
 * Get accent color (warm orange for high scores)
 */
export function getAccentColor(baitScore: number): string {
  if (baitScore >= 70) return "#f97316"; // orange-500
  if (baitScore >= 40) return "#eab308"; // yellow-500
  return "#22c55e"; // green-500
}

export { SIGNAL_LABELS };

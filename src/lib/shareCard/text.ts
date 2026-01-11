/**
 * Text generation helpers for share cards
 * Hook lines and driver selection
 */

import { SIGNAL_LABELS, type SignalBreakdown } from "@/lib/score";

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
      label: b.label || SIGNAL_LABELS[b.key as keyof typeof SIGNAL_LABELS] || b.key,
      // Normalize to 0-100 if value appears to be 0-1
      value: b.value <= 1 ? Math.round(b.value * 100) : Math.round(b.value),
    }));
  } else {
    // Convert object format (including SignalBreakdown) to array
    normalizedBars = Object.entries(bars).map(([key, value]) => ({
      key,
      label: SIGNAL_LABELS[key as keyof typeof SIGNAL_LABELS] || key,
      value: typeof value === "number" ? (value <= 1 ? Math.round(value * 100) : Math.round(value)) : 0,
    }));
  }

  // Sort by value descending and take top 2
  return normalizedBars
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
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

export { SIGNAL_LABELS };

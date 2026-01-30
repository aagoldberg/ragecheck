// DefenseCheck — Scoring and Validation

import { DefenseCategory, DetectedPattern } from "./types";

const CONFIDENCE_THRESHOLD = 0.3;

/**
 * Normalize detected patterns into a 0-100 composite score
 * weighted by confidence.
 */
export function normalizeScore(patterns: DetectedPattern[]): number {
  if (patterns.length === 0) return 0;

  // Weighted average: severity × confidence, scaled to 0-100
  let totalWeight = 0;
  let weightedSum = 0;

  for (const p of patterns) {
    const weight = p.confidence;
    weightedSum += (p.severity / 10) * 100 * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  let score = Math.round(weightedSum / totalWeight);

  // Cap at 85 if max confidence across all patterns is < 0.7
  const maxConfidence = Math.max(...patterns.map((p) => p.confidence));
  if (maxConfidence < 0.7 && score > 85) {
    score = 85;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Get a hedged label for a given score.
 */
export function getScoreLabel(score: number): string {
  if (score <= 25) return "Minimal patterns";
  if (score <= 50) return "Some patterns noted";
  if (score <= 75) return "Notable patterns";
  return "Significant patterns";
}

/**
 * Get the score color (teal gradient: low=green-teal, high=amber-teal).
 */
export function getScoreColor(score: number): string {
  if (score <= 25) return "#2dd4bf"; // teal-400
  if (score <= 50) return "#14b8a6"; // teal-500
  if (score <= 75) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

/**
 * Parse and validate Claude's JSON response, filtering low-confidence patterns
 * and sorting by severity descending.
 */
export function validateAndCleanPatterns(raw: unknown): DetectedPattern[] {
  if (!raw || !Array.isArray(raw)) return [];

  const validCategories = new Set(Object.values(DefenseCategory));

  return raw
    .filter((p: Record<string, unknown>) => {
      if (!p || typeof p !== "object") return false;
      if (!validCategories.has(p.category as DefenseCategory)) return false;
      if (typeof p.severity !== "number" || typeof p.confidence !== "number") return false;
      if (p.confidence < CONFIDENCE_THRESHOLD) return false;
      if (typeof p.evidence !== "string" || typeof p.explanation !== "string") return false;
      return true;
    })
    .map((p: Record<string, unknown>) => ({
      category: p.category as DefenseCategory,
      severity: Math.min(10, Math.max(0, Math.round(p.severity as number))),
      confidence: Math.min(1, Math.max(0, p.confidence as number)),
      evidence: (p.evidence as string).slice(0, 500),
      explanation: (p.explanation as string).slice(0, 500),
    }))
    .sort((a, b) => b.severity - a.severity);
}

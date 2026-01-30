import { CATEGORY_META, DefenseCategory } from "@/lib/defensecheck/types";

interface DefenseCheckShareInput {
  score: number;
  scoreLabel: string;
  patterns: {
    category: string;
    severity: number;
    evidence: string;
  }[];
}

export interface DefenseCheckShareTexts {
  xText: string;
  blueskyText: string;
  nativeText: string;
  nativeTitle: string;
}

export function getDefenseCheckShareText(
  result: DefenseCheckShareInput,
  url: string
): DefenseCheckShareTexts {
  const topPattern = result.patterns[0];
  const topCategoryLabel = topPattern
    ? CATEGORY_META[topPattern.category as DefenseCategory]?.label || topPattern.category
    : "None";
  const topEvidence = topPattern
    ? topPattern.evidence.slice(0, 80)
    : "";
  const patternCount = result.patterns.length;

  const xText = topPattern
    ? `DefenseCheck score: ${result.score}/100. Top pattern: ${topCategoryLabel}. "${topEvidence}"\n\nAnalyze any text for defensive rhetoric:`
    : `DefenseCheck score: ${result.score}/100 — ${result.scoreLabel}.\n\nAnalyze any text for defensive rhetoric:`;

  const blueskyText = topPattern
    ? `I ran this through DefenseCheck — it detected ${patternCount} defensive rhetoric pattern${patternCount !== 1 ? "s" : ""}.\n\nThe top one: ${topCategoryLabel}\n\n${url}`
    : `I ran this through DefenseCheck — ${result.scoreLabel.toLowerCase()}.\n\n${url}`;

  const nativeText = topPattern
    ? `DefenseCheck: ${result.scoreLabel} (${result.score}/100) — ${topCategoryLabel} detected\n\n${url}`
    : `DefenseCheck: ${result.scoreLabel} (${result.score}/100)\n\n${url}`;

  return {
    xText,
    blueskyText,
    nativeText,
    nativeTitle: `DefenseCheck: ${result.scoreLabel}`,
  };
}

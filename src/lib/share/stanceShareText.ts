import { POSTURE_META, type StanceAnalysis, type Posture } from "@/lib/stance/types";

export interface StanceShareTexts {
  xText: string;
  blueskyText: string;
  nativeText: string;
  nativeTitle: string;
}

export function getStanceShareText(
  analysis: StanceAnalysis,
  url: string
): StanceShareTexts {
  const posture = analysis.posture.primary;
  const postureLabel = POSTURE_META[posture as Posture]?.label || posture;
  const defenseScore = analysis.defense_module.overall_defense_score_raw;
  const topTechnique = analysis.rhetorical_techniques?.[0]?.technique || "";
  const summary = analysis.summary.neutral_summary.slice(0, 100);

  const xText = topTechnique
    ? `Stance analysis — Primary posture: ${postureLabel}. Defense score: ${defenseScore}/100. Top technique: ${topTechnique}.\n\nFull 8-stage rhetorical analysis:`
    : `Stance analysis — Primary posture: ${postureLabel}. Defense score: ${defenseScore}/100.\n\nFull 8-stage rhetorical analysis:`;

  const blueskyText = `I ran this through Stance — an 8-stage rhetorical analysis.\n\nPosture: ${postureLabel}\nDefense score: ${defenseScore}/100\n\n${url}`;

  const nativeText = `Stance: ${postureLabel} posture, defense score ${defenseScore}/100. "${summary}..."\n\n${url}`;

  return {
    xText,
    blueskyText,
    nativeText,
    nativeTitle: `Stance: ${postureLabel} — ${defenseScore}/100`,
  };
}

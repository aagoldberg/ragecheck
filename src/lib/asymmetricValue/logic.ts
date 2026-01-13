/**
 * Asymmetric Value Logic Module
 *
 * Core decision logic for computing forecasts, verification shortcuts,
 * incentive fingerprints, and low-regret actions.
 */

import {
  AsymmetricValueInput,
  AsymmetricValueOutput,
  AsymmetricValueJSON,
  Forecast,
  ForecastType,
  HeatVsEvidence,
  VerificationCheck,
  VerificationStatus,
  IncentiveFingerprint,
  IncentiveAction,
  LanguageCategory,
  NarrativeTemplate,
  LowRegretAction,
  SharecardOutput,
  SharecardContent,
  SharecardVariant,
} from "./types";

// ============================================
// HEAT VS EVIDENCE
// ============================================

export function computeHeatVsEvidence(
  heat_score: number,
  evidence_score: number
): HeatVsEvidence {
  const delta = heat_score - evidence_score;
  const warning_active = delta >= 25;

  let interpretation: string;
  if (delta >= 40) {
    interpretation =
      "High emotional intensity with minimal factual grounding. Classic manipulation signature.";
  } else if (delta >= 25) {
    interpretation =
      "Emotional framing outpaces the evidence provided. Worth verifying before engaging.";
  } else if (delta >= 10) {
    interpretation =
      "Moderate emotional content relative to evidence. Normal range for opinion pieces.";
  } else if (delta >= -10) {
    interpretation =
      "Balanced emotional tone and evidence. Typical of substantive reporting.";
  } else {
    interpretation =
      "Evidence-heavy with restrained emotional framing. Analytical or academic style.";
  }

  return {
    heat_score,
    evidence_score,
    delta,
    warning_active,
    warning_label: warning_active ? "Heat > Evidence" : undefined,
    interpretation,
  };
}

// ============================================
// FORECAST
// ============================================

const FORECAST_MAP: Record<ForecastType, string> = {
  impulsive_sharing:
    "Content structure optimizes for rapid sharing before verification. Expect quick spread with limited fact-checking.",
  polarization:
    "Framing emphasizes group identity and moral certainty. Likely to reinforce existing beliefs and widen divides.",
  dunking_dynamics:
    "Content sets up targets for public criticism. May trigger pile-on behavior and quote-tweet mockery.",
  anxiety_spiral:
    "Threat framing designed to activate fear responses. May lead to doom-scrolling or anxiety sharing.",
  outgroup_distrust:
    "Builds narrative of 'them vs us.' Optimized to deepen distrust of specific groups or institutions.",
  neutral:
    "No strong manipulation pattern detected. Standard informational content.",
};

export function computeForecast(
  categories: LanguageCategory[],
  heat_score: number,
  evidence_score: number
): Forecast {
  const delta = heat_score - evidence_score;

  // Priority-ordered checks
  if (
    categories.includes("call_to_share") ||
    (categories.includes("fear_alert") && delta >= 20)
  ) {
    return {
      type: "impulsive_sharing",
      text: FORECAST_MAP.impulsive_sharing,
      confidence: delta >= 30 ? "high" : "medium",
    };
  }

  if (categories.includes("humiliation") || categories.includes("call_to_punish")) {
    return {
      type: "dunking_dynamics",
      text: FORECAST_MAP.dunking_dynamics,
      confidence: categories.includes("call_to_punish") ? "high" : "medium",
    };
  }

  if (
    categories.includes("enemy_construction") ||
    categories.includes("moral_purity_test")
  ) {
    return {
      type: "polarization",
      text: FORECAST_MAP.polarization,
      confidence:
        categories.includes("enemy_construction") &&
        categories.includes("moral_purity_test")
          ? "high"
          : "medium",
    };
  }

  if (categories.includes("doom_loop") || categories.includes("fear_alert")) {
    return {
      type: "anxiety_spiral",
      text: FORECAST_MAP.anxiety_spiral,
      confidence: categories.includes("doom_loop") ? "high" : "medium",
    };
  }

  if (categories.includes("betrayal_narrative") || categories.includes("conspiracy_frame")) {
    return {
      type: "outgroup_distrust",
      text: FORECAST_MAP.outgroup_distrust,
      confidence: categories.includes("conspiracy_frame") ? "high" : "medium",
    };
  }

  return {
    type: "neutral",
    text: FORECAST_MAP.neutral,
    confidence: "low",
  };
}

// ============================================
// VERIFICATION SHORTCUT
// ============================================

export function computeVerificationChecks(
  input: AsymmetricValueInput
): [VerificationCheck, VerificationCheck, VerificationCheck] {
  const { citations_found, has_date_context, language_features, content_type } =
    input;

  // Check 1: Primary source present?
  const primarySources = citations_found.filter((c) => c.type === "primary");
  const hasPrimary = primarySources.length > 0;

  let check1Status: VerificationStatus;
  let check1Detail: string;

  if (hasPrimary) {
    check1Status = "yes";
    check1Detail = `Primary source linked: ${primarySources[0].domain}`;
  } else if (citations_found.length > 0) {
    check1Status = "partial";
    check1Detail = `${citations_found.length} secondary source(s), no primary`;
  } else {
    check1Status = "no";
    check1Detail =
      content_type === "screenshot"
        ? "Screenshot with no verifiable source"
        : "No sources linked in content";
  }

  const check1: VerificationCheck = {
    label: "Primary source present?",
    status: check1Status,
    detail: check1Detail,
  };

  // Check 2: Date context present?
  let check2Status: VerificationStatus;
  let check2Detail: string;

  if (has_date_context && input.detected_date) {
    const dateObj = new Date(input.detected_date);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > 365) {
      check2Status = "partial";
      check2Detail = `Dated ${Math.floor(daysDiff / 365)}+ years ago. May be resurfaced content.`;
    } else if (daysDiff > 30) {
      check2Status = "partial";
      check2Detail = `Dated ${daysDiff} days ago. Check if still relevant.`;
    } else {
      check2Status = "yes";
      check2Detail = `Recent: ${dateObj.toLocaleDateString()}`;
    }
  } else {
    check2Status = "no";
    check2Detail = "No clear date or timeframe provided";
  }

  const check2: VerificationCheck = {
    label: "Date context present?",
    status: check2Status,
    detail: check2Detail,
  };

  // Check 3: Counter-evidence suggested?
  const needsCounterEvidence =
    language_features.evidence_score < 40 ||
    language_features.ambiguity_score > 60;

  let check3Status: VerificationStatus;
  let check3Detail: string;

  if (!needsCounterEvidence) {
    check3Status = "yes";
    check3Detail = "Evidence score adequate. Standard verification applies.";
  } else if (language_features.ambiguity_score > 60) {
    check3Status = "no";
    check3Detail = "High ambiguity. Search for primary source to clarify claims.";
  } else {
    check3Status = "no";
    check3Detail =
      "Low evidence score. Search for reputable counter-perspectives.";
  }

  const check3: VerificationCheck = {
    label: "Counter-evidence suggested?",
    status: check3Status,
    detail: check3Detail,
  };

  return [check1, check2, check3];
}

// ============================================
// INCENTIVE FINGERPRINT
// ============================================

const CATEGORY_TO_ACTION: Record<LanguageCategory, IncentiveAction> = {
  call_to_share: "make you share fast",
  fear_alert: "make you feel threatened",
  enemy_construction: "make you distrust an outgroup",
  moral_purity_test: "make you feel morally certain",
  humiliation: "make you join a pile-on",
  call_to_punish: "make you punish/ban",
  betrayal_narrative: "make you distrust an outgroup",
  conspiracy_frame: "make you distrust an outgroup",
  doom_loop: "make you feel threatened",
  status_signal: "make you feel morally certain",
};

const ACTION_BENEFICIARIES: Record<IncentiveAction, string> = {
  "make you share fast": "the original poster gains reach",
  "make you distrust an outgroup": "in-group loyalty strengthens",
  "make you feel morally certain": "engagement increases through validation",
  "make you join a pile-on": "the poster gains status through target's humiliation",
  "make you feel threatened": "attention economy captures your anxiety",
  "make you punish/ban": "moderation pressure shifts platform dynamics",
  "inform without manipulation": "no clear beneficiary beyond the reader",
};

export function computeIncentiveFingerprint(
  categories: LanguageCategory[],
  heat_score: number
): IncentiveFingerprint {
  if (categories.length === 0 || heat_score < 20) {
    return {
      primary_drivers: [],
      action: "inform without manipulation",
      beneficiary: ACTION_BENEFICIARIES["inform without manipulation"],
      text: "This content appears informational without strong manipulation signals.",
    };
  }

  // Get top 2 categories by manipulation severity
  const categoryPriority: LanguageCategory[] = [
    "call_to_punish",
    "enemy_construction",
    "humiliation",
    "fear_alert",
    "moral_purity_test",
    "call_to_share",
    "conspiracy_frame",
    "betrayal_narrative",
    "doom_loop",
    "status_signal",
  ];

  const sortedCategories = categories.sort(
    (a, b) => categoryPriority.indexOf(a) - categoryPriority.indexOf(b)
  );

  const primaryDrivers = sortedCategories.slice(0, 2);
  const primaryCategory = primaryDrivers[0];
  const action = CATEGORY_TO_ACTION[primaryCategory];
  const beneficiary = ACTION_BENEFICIARIES[action];

  const driverLabels = primaryDrivers
    .map((c) => c.replace(/_/g, " "))
    .join(" + ");

  return {
    primary_drivers: primaryDrivers,
    action,
    beneficiary,
    text: `This is optimized to: ${action}. Primary drivers: ${driverLabels}. When it works, ${beneficiary}.`,
  };
}

// ============================================
// NARRATIVE TEMPLATE
// ============================================

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  outrage_bait:
    "Content structured to maximize emotional reaction and sharing impulse.",
  tribal_signaling:
    "Designed to reinforce in-group identity and signal membership.",
  fear_cascade:
    "Uses escalating threat framing to maintain attention and anxiety.",
  righteous_dunking:
    "Sets up target for public criticism to generate engagement.",
  moral_panic:
    "Frames issue as urgent moral crisis requiring immediate action.",
  conspiracy_teaser:
    "Hints at hidden truth to generate curiosity and distrust.",
  victim_narrative:
    "Positions subject as wronged party to generate sympathy and outrage.",
  call_to_arms:
    "Explicit mobilization framing for collective action.",
};

export function computeNarrativeTemplate(
  template_match?: { template_name: string; confidence: number }
): NarrativeTemplate | undefined {
  if (!template_match || template_match.confidence < 0.65) {
    return undefined;
  }

  const description =
    TEMPLATE_DESCRIPTIONS[template_match.template_name] ||
    "Matches a known viral content template.";

  return {
    name: template_match.template_name.replace(/_/g, " "),
    description,
    confidence: template_match.confidence,
  };
}

// ============================================
// LOW-REGRET ACTION
// ============================================

export function computeLowRegretAction(
  input: AsymmetricValueInput,
  heatVsEvidence: HeatVsEvidence,
  verificationChecks: [VerificationCheck, VerificationCheck, VerificationCheck]
): LowRegretAction {
  const [primaryCheck, dateCheck] = verificationChecks;
  const { content_type } = input;

  // Priority 1: No primary source
  if (primaryCheck.status === "no") {
    if (content_type === "screenshot") {
      return {
        action: "Reverse image search or find original",
        reason:
          "Screenshots can be edited or taken out of context. Finding the original source is essential.",
        priority: "high",
      };
    }
    return {
      action: "Ask for the original source",
      reason:
        "Without a primary source, claims cannot be verified. Request the original before engaging.",
      priority: "high",
    };
  }

  // Priority 2: No date context
  if (dateCheck.status === "no") {
    return {
      action: "Check date and full context",
      reason:
        "Undated content may be resurfaced or outdated. Verify when this actually happened.",
      priority: "high",
    };
  }

  // Priority 3: High heat-evidence delta
  if (heatVsEvidence.delta >= 25) {
    return {
      action: "Wait 10 minutes, then verify",
      reason:
        "High emotional intensity relative to evidence. A brief pause helps bypass the impulse to share.",
      priority: "medium",
    };
  }

  // Priority 4: Partial date context (old content)
  if (dateCheck.status === "partial") {
    return {
      action: "Confirm this is current and relevant",
      reason:
        "Content may be dated. Check if the situation has changed since publication.",
      priority: "medium",
    };
  }

  // Default: Read primary source
  return {
    action: "Read the primary source first",
    reason:
      "Best practice before engaging: read the full original, not just the summary or quote.",
    priority: "low",
  };
}

// ============================================
// SHARECARD GENERATION
// ============================================

function getVerificationFlag(
  verificationChecks: [VerificationCheck, VerificationCheck, VerificationCheck],
  content_type: string
): string {
  const [primaryCheck, dateCheck] = verificationChecks;

  if (content_type === "screenshot") {
    return "Screenshot risk";
  }
  if (primaryCheck.status === "no") {
    return "No primary source";
  }
  if (dateCheck.status === "no") {
    return "No date context";
  }
  if (primaryCheck.status === "partial") {
    return "Quote w/o link";
  }
  if (dateCheck.status === "partial") {
    return "May be outdated";
  }
  return "Verify before sharing";
}

function getShortAction(lowRegretAction: LowRegretAction): string {
  const action = lowRegretAction.action;
  // Truncate to max 6 words
  const words = action.split(" ");
  if (words.length <= 6) return action;
  return words.slice(0, 6).join(" ");
}

function generateHook(
  variant: SharecardVariant,
  forecast: Forecast,
  heatVsEvidence: HeatVsEvidence
): string {
  const { delta } = heatVsEvidence;

  if (variant === "respectful_share") {
    if (forecast.type === "neutral") {
      return "Checks out. Worth a read.";
    }
    if (delta >= 30) {
      return "High emotion, low evidence.";
    }
    if (delta >= 15) {
      return "Worth a second look.";
    }
    return "Some context to consider.";
  }

  if (variant === "group_sanity_check") {
    if (forecast.type === "neutral") {
      return "This one seems solid.";
    }
    if (forecast.type === "impulsive_sharing") {
      return "Designed for quick shares.";
    }
    if (forecast.type === "dunking_dynamics") {
      return "Pile-on bait detected.";
    }
    if (forecast.type === "polarization") {
      return "Tribal framing in play.";
    }
    return "Check before you share.";
  }

  // direct_warning
  if (forecast.type === "neutral") {
    return "Low manipulation signals.";
  }
  if (delta >= 40) {
    return "Strong manipulation pattern.";
  }
  if (delta >= 25) {
    return "Heat exceeds evidence here.";
  }
  if (forecast.type === "dunking_dynamics") {
    return "Sets up a target.";
  }
  return "Verification flags present.";
}

export function generateSharecards(
  forecast: Forecast,
  heatVsEvidence: HeatVsEvidence,
  verificationChecks: [VerificationCheck, VerificationCheck, VerificationCheck],
  lowRegretAction: LowRegretAction,
  original_url: string,
  content_type: string
): SharecardOutput {
  const flag = getVerificationFlag(verificationChecks, content_type);
  const action = getShortAction(lowRegretAction);

  // Extract domain from URL
  let domain = "unknown";
  try {
    domain = new URL(original_url).hostname.replace("www.", "");
  } catch {
    domain = "link";
  }

  const baseContent = {
    heat_display: `${heatVsEvidence.heat_score}`,
    evidence_display: `${heatVsEvidence.evidence_score}`,
    verification_flag: flag,
    low_regret_action: action,
    footer_domain: "ragecheck.com",
    footer_source: domain,
  };

  const variants: SharecardVariant[] = [
    "respectful_share",
    "group_sanity_check",
    "direct_warning",
  ];

  const output: SharecardOutput = {} as SharecardOutput;

  for (const variant of variants) {
    const hook = generateHook(variant, forecast, heatVsEvidence);
    output[variant] = {
      ...baseContent,
      variant,
      hook,
    } as SharecardContent;
  }

  return output;
}

// ============================================
// MAIN COMPUTATION
// ============================================

function hashInput(input: AsymmetricValueInput): string {
  const str = JSON.stringify({
    url: input.original_url,
    text: input.post_text.slice(0, 100),
    heat: input.language_features.heat_score,
    evidence: input.language_features.evidence_score,
  });
  // Simple hash for deduplication
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function computeAsymmetricValue(
  input: AsymmetricValueInput
): AsymmetricValueOutput {
  const { language_features, template_match, content_type } = input;

  // Compute all components
  const heatVsEvidence = computeHeatVsEvidence(
    language_features.heat_score,
    language_features.evidence_score
  );

  const forecast = computeForecast(
    language_features.categories,
    language_features.heat_score,
    language_features.evidence_score
  );

  const verificationChecks = computeVerificationChecks(input);

  const incentiveFingerprint = computeIncentiveFingerprint(
    language_features.categories,
    language_features.heat_score
  );

  const narrativeTemplate = computeNarrativeTemplate(template_match);

  const lowRegretAction = computeLowRegretAction(
    input,
    heatVsEvidence,
    verificationChecks
  );

  return {
    forecast,
    heat_vs_evidence: heatVsEvidence,
    verification_checks: verificationChecks,
    incentive_fingerprint: incentiveFingerprint,
    narrative_template: narrativeTemplate,
    low_regret_action: lowRegretAction,
    computed_at: new Date().toISOString(),
    input_hash: hashInput(input),
  };
}

// ============================================
// JSON EXPORT
// ============================================

export function toJSON(
  output: AsymmetricValueOutput,
  sharecards: SharecardOutput
): AsymmetricValueJSON {
  return {
    forecast_text: output.forecast.text,
    heat_score: output.heat_vs_evidence.heat_score,
    evidence_score: output.heat_vs_evidence.evidence_score,
    warning_label: output.heat_vs_evidence.warning_label,
    verification_checks: output.verification_checks.map((check) => ({
      label: check.label,
      status: check.status,
      detail: check.detail,
    })),
    incentive_fingerprint_text: output.incentive_fingerprint.text,
    template_match_text: output.narrative_template
      ? `${output.narrative_template.name}: ${output.narrative_template.description}`
      : undefined,
    low_regret_action_text: output.low_regret_action.action,
    sharecard_variants: [
      {
        variant: "respectful_share",
        hook: sharecards.respectful_share.hook,
        flag: sharecards.respectful_share.verification_flag,
        action: sharecards.respectful_share.low_regret_action,
        footer: `${sharecards.respectful_share.footer_domain} | ${sharecards.respectful_share.footer_source}`,
      },
      {
        variant: "group_sanity_check",
        hook: sharecards.group_sanity_check.hook,
        flag: sharecards.group_sanity_check.verification_flag,
        action: sharecards.group_sanity_check.low_regret_action,
        footer: `${sharecards.group_sanity_check.footer_domain} | ${sharecards.group_sanity_check.footer_source}`,
      },
      {
        variant: "direct_warning",
        hook: sharecards.direct_warning.hook,
        flag: sharecards.direct_warning.verification_flag,
        action: sharecards.direct_warning.low_regret_action,
        footer: `${sharecards.direct_warning.footer_domain} | ${sharecards.direct_warning.footer_source}`,
      },
    ],
  };
}

/**
 * Asymmetric Value Analysis Types
 *
 * These types define the structured outputs for the Asymmetric Value feature,
 * which transforms RageCheck from commentary into actionable utility.
 */

// Input types - what we receive from the analysis
export type ContentType = "tweet" | "bluesky_post" | "article" | "screenshot" | "other";

export type LanguageCategory =
  | "enemy_construction"
  | "betrayal_narrative"
  | "fear_alert"
  | "moral_purity_test"
  | "humiliation"
  | "status_signal"
  | "conspiracy_frame"
  | "doom_loop"
  | "call_to_punish"
  | "call_to_share";

export interface Citation {
  url: string;
  domain: string;
  type: "primary" | "secondary" | "unknown";
}

export interface ExtractedClaim {
  claim_text: string;
}

export interface EngagementSignals {
  likes?: number;
  reposts?: number;
  replies?: number;
}

export interface LanguageFeatures {
  heat_score: number; // 0-100: emotional intensity
  evidence_score: number; // 0-100: factual grounding
  agency_score: number; // 0-100: calls to action
  ambiguity_score: number; // 0-100: vagueness/uncertainty
  categories: LanguageCategory[];
}

export interface TemplateMatch {
  template_name: string;
  confidence: number; // 0-1
}

export interface UserContext {
  trigger_themes_top3?: string[];
  heat_drift_7d?: number;
}

export interface AsymmetricValueInput {
  content_type: ContentType;
  original_url: string;
  author_handle?: string;
  post_text: string;
  extracted_claims: ExtractedClaim[];
  citations_found: Citation[];
  has_date_context: boolean;
  detected_date?: string; // ISO string
  engagement_signals?: EngagementSignals;
  language_features: LanguageFeatures;
  template_match?: TemplateMatch;
  user_context?: UserContext;
}

// Output types - what we produce

export type ForecastType =
  | "impulsive_sharing"
  | "polarization"
  | "dunking_dynamics"
  | "anxiety_spiral"
  | "outgroup_distrust"
  | "neutral";

export interface Forecast {
  type: ForecastType;
  text: string;
  confidence: "high" | "medium" | "low";
}

export type VerificationStatus = "yes" | "no" | "partial" | "unknown";

export interface VerificationCheck {
  label: string;
  status: VerificationStatus;
  detail: string;
}

export type IncentiveAction =
  | "make you share fast"
  | "make you distrust an outgroup"
  | "make you feel morally certain"
  | "make you join a pile-on"
  | "make you feel threatened"
  | "make you punish/ban"
  | "inform without manipulation";

export interface IncentiveFingerprint {
  primary_drivers: LanguageCategory[];
  action: IncentiveAction;
  beneficiary: string;
  text: string;
}

export interface NarrativeTemplate {
  name: string;
  description: string;
  confidence: number;
}

export interface LowRegretAction {
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface HeatVsEvidence {
  heat_score: number;
  evidence_score: number;
  delta: number;
  warning_active: boolean;
  warning_label?: string;
  interpretation: string;
}

// Main output structure
export interface AsymmetricValueOutput {
  forecast: Forecast;
  heat_vs_evidence: HeatVsEvidence;
  verification_checks: [VerificationCheck, VerificationCheck, VerificationCheck];
  incentive_fingerprint: IncentiveFingerprint;
  narrative_template?: NarrativeTemplate;
  low_regret_action: LowRegretAction;

  // Metadata
  computed_at: string;
  input_hash: string;
}

// Sharecard types
export type SharecardVariant = "respectful_share" | "group_sanity_check" | "direct_warning";

export interface SharecardContent {
  variant: SharecardVariant;
  hook: string; // max 7 words
  heat_display: string;
  evidence_display: string;
  verification_flag: string;
  low_regret_action: string; // max 6 words
  footer_domain: string;
  footer_source: string;
}

export interface SharecardOutput {
  respectful_share: SharecardContent;
  group_sanity_check: SharecardContent;
  direct_warning: SharecardContent;
}

// Complete JSON output for API
export interface AsymmetricValueJSON {
  forecast_text: string;
  heat_score: number;
  evidence_score: number;
  warning_label?: string;
  verification_checks: {
    label: string;
    status: VerificationStatus;
    detail: string;
  }[];
  incentive_fingerprint_text: string;
  template_match_text?: string;
  low_regret_action_text: string;
  sharecard_variants: {
    variant: SharecardVariant;
    hook: string;
    flag: string;
    action: string;
    footer: string;
  }[];
}

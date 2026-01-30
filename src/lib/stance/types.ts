// Stance — Full Rhetorical Analysis Types

export type Posture =
  | "RAGE"
  | "DEFENSE"
  | "PERSUASION"
  | "SIGNALING"
  | "STATUS"
  | "COALITION"
  | "INQUIRY"
  | "CYNICISM"
  | "FEAR"
  | "HUMOR";

export type PrimaryMode = "FACT" | "OPINION" | "CALL_TO_ACTION" | "MIXED";

export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export type DefenseTag =
  | "DENIAL_MINIMIZATION"
  | "RATIONALIZATION"
  | "PROJECTION"
  | "SPLITTING_MORAL_DICHOTOMY"
  | "WHATABOUTISM_TU_QUOQUE"
  | "ABSOLUTIST_CERTAINTY"
  | "EPISTEMIC_CLOSURE"
  | "MORAL_EMOTIONAL_ESCALATION";

export interface EvidenceSpan {
  quote: string;
  explanation: string;
}

export interface SecondaryPosture {
  label: Posture;
  weight: number;
}

export interface DefenseTagResult {
  tag: DefenseTag;
  intensity: number; // 0-10
  confidence: Confidence;
  evidence_spans: EvidenceSpan[];
  alt_explanations: string[];
}

export interface RhetoricalTechnique {
  technique: string;
  confidence: Confidence;
  evidence_spans: EvidenceSpan[];
  alt_explanations: string[];
}

export interface StanceAnalysis {
  version: string;
  content_type: string;
  summary: {
    neutral_summary: string;
    primary_mode: PrimaryMode;
    top_claims: string[];
  };
  posture: {
    primary: Posture;
    secondary: SecondaryPosture[];
    evidence_spans: EvidenceSpan[];
  };
  defense_module: {
    overall_defense_score_raw: number; // 0-100
    tags: DefenseTagResult[];
  };
  rhetorical_techniques: RhetoricalTechnique[];
  vulnerability_hypotheses: {
    assumed_beliefs: string[];
    invited_identity: string;
    rewarded_assumptions: string[];
    confidence: Confidence;
  };
  predicted_effects: {
    escalation_likelihood: number; // 0-100
    polarization_push: number;
    belief_closure: number;
    virality_language_only: number;
    likely_reply_dynamics: string;
    confidence: Confidence;
    why: string;
  };
  interventions: {
    self_check_questions: string[];
    response_templates: string[];
    sharing_caution: string;
  };
  calibration: {
    context_needed: boolean;
    context_notes: string[];
    failure_modes: string[];
    what_would_change_assessment: string[];
  };
}

export interface StanceResult {
  id: string;
  analysis: StanceAnalysis;
  analyzedAt: string;
}

export interface StanceInput {
  text?: string;
  url?: string;
  image?: string;
}

// Posture display metadata
export const POSTURE_META: Record<Posture, { label: string; color: string; description: string }> = {
  RAGE: { label: "Rage", color: "#ef4444", description: "Expressing or channeling anger" },
  DEFENSE: { label: "Defense", color: "#14b8a6", description: "Protecting beliefs or deflecting accountability" },
  PERSUASION: { label: "Persuasion", color: "#8b5cf6", description: "Attempting to change minds" },
  SIGNALING: { label: "Signaling", color: "#3b82f6", description: "Broadcasting identity or group membership" },
  STATUS: { label: "Status", color: "#f59e0b", description: "Asserting or claiming authority" },
  COALITION: { label: "Coalition", color: "#22c55e", description: "Building or reinforcing group bonds" },
  INQUIRY: { label: "Inquiry", color: "#06b6d4", description: "Genuinely questioning or exploring" },
  CYNICISM: { label: "Cynicism", color: "#64748b", description: "Dismissing or expressing distrust" },
  FEAR: { label: "Fear", color: "#f97316", description: "Expressing or triggering anxiety" },
  HUMOR: { label: "Humor", color: "#ec4899", description: "Using comedy, irony, or satire" },
};

export const DEFENSE_TAG_LABELS: Record<DefenseTag, string> = {
  DENIAL_MINIMIZATION: "Denial / Minimization",
  RATIONALIZATION: "Rationalization",
  PROJECTION: "Projection",
  SPLITTING_MORAL_DICHOTOMY: "Moral Dichotomy",
  WHATABOUTISM_TU_QUOQUE: "Whataboutism",
  ABSOLUTIST_CERTAINTY: "Absolutist Certainty",
  EPISTEMIC_CLOSURE: "Epistemic Closure",
  MORAL_EMOTIONAL_ESCALATION: "Moral Escalation",
};

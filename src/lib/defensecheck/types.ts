// DefenseCheck — Defensive Rhetoric Analyzer Types

export enum DefenseCategory {
  DENIAL_MINIMIZATION = "DENIAL_MINIMIZATION",
  DEFLECTION_WHATABOUTISM = "DEFLECTION_WHATABOUTISM",
  RATIONALIZATION = "RATIONALIZATION",
  PROJECTION = "PROJECTION",
  BLAME_SHIFTING = "BLAME_SHIFTING",
  VICTIMHOOD_REVERSAL = "VICTIMHOOD_REVERSAL",
  GASLIGHTING_MARKERS = "GASLIGHTING_MARKERS",
  STONEWALLING_DISMISSAL = "STONEWALLING_DISMISSAL",
}

export interface CategoryMeta {
  label: string;
  description: string;
  color: string;
  icon: string;
}

export const CATEGORY_META: Record<DefenseCategory, CategoryMeta> = {
  [DefenseCategory.DENIAL_MINIMIZATION]: {
    label: "Denial / Minimization",
    description: '"That never happened" or "It wasn\'t that bad"',
    color: "#2dd4bf", // teal-400
    icon: "ban",
  },
  [DefenseCategory.DEFLECTION_WHATABOUTISM]: {
    label: "Deflection / Whataboutism",
    description: '"What about when you..." or changing the subject',
    color: "#14b8a6", // teal-500
    icon: "arrow-right-left",
  },
  [DefenseCategory.RATIONALIZATION]: {
    label: "Rationalization",
    description: '"I only did it because..." or elaborate justifications',
    color: "#0d9488", // teal-600
    icon: "brain",
  },
  [DefenseCategory.PROJECTION]: {
    label: "Projection",
    description: "Attributing own behavior to others",
    color: "#0f766e", // teal-700
    icon: "mirror",
  },
  [DefenseCategory.BLAME_SHIFTING]: {
    label: "Blame Shifting",
    description: '"You made me..." or externalizing responsibility',
    color: "#f59e0b", // amber-500
    icon: "arrow-up-right",
  },
  [DefenseCategory.VICTIMHOOD_REVERSAL]: {
    label: "Victimhood Reversal",
    description: '"I\'m the real victim here"',
    color: "#f97316", // orange-500
    icon: "shield-alert",
  },
  [DefenseCategory.GASLIGHTING_MARKERS]: {
    label: "Gaslighting Markers",
    description: '"You\'re being crazy" or reality-questioning',
    color: "#ef4444", // red-500
    icon: "flame",
  },
  [DefenseCategory.STONEWALLING_DISMISSAL]: {
    label: "Stonewalling / Dismissal",
    description: '"I don\'t want to talk about it" or shutting down',
    color: "#64748b", // slate-500
    icon: "wall",
  },
};

export interface DetectedPattern {
  category: DefenseCategory;
  severity: number; // 0-10
  confidence: number; // 0-1
  evidence: string; // text excerpt
  explanation: string;
}

export interface AlternativeReading {
  summary: string;
  factors: string[];
}

export type InputType = "confrontation" | "explanation" | "narrative" | "other";

export interface ClaudeAnalysisResponse {
  patterns: DetectedPattern[];
  alternativeReading: AlternativeReading;
  overallAssessment: string;
  inputType: InputType;
}

export interface DefenseCheckResult {
  id: string;
  score: number; // 0-100
  scoreLabel: string;
  patterns: DetectedPattern[]; // sorted by severity desc
  alternativeReading: AlternativeReading;
  overallAssessment: string;
  inputType: InputType;
  analyzedAt: string;
}

export interface DefenseCheckInput {
  text: string;
  mode: "text" | "url";
}

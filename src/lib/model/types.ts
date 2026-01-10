// Core types for the 5-bar + 2-modifier ragebait detection system

export type BarName =
  | "arousal"
  | "enemy_construction"
  | "moral_condemnation"
  | "simplification"
  | "call_to_conflict";

export type ModifierName =
  | "reporting_analysis_discount"
  | "information_density";

export type Label = "ragebait" | "borderline" | "not_ragebait";

// Signal result from individual detection modules
export interface SignalResult {
  score01: number; // 0-1 normalized score
  evidence: string[];
  debug?: Record<string, unknown>;
}

// Bar result combining multiple signals
export interface BarResult {
  score100: number; // 0-100 score
  evidence: string[];
  signalBreakdown: SignalBreakdownItem[];
}

export interface SignalBreakdownItem {
  name: string;
  weight: number;
  score01: number;
  evidence: string[];
}

// Top signal for display
export interface TopSignal {
  name: string;
  bar: string;
  weight: number;
  matched: string[];
}

// Full analysis result
export interface AnalysisResult {
  text: string;
  bait_score: number;
  bars: Record<BarName, number>;
  modifiers: Record<ModifierName, number>;
  evidence: Record<BarName | ModifierName, string[]>;
  top_signals: TopSignal[];
  explanation: string;
  label: Label;
  confidence: number;
}

// Preprocessed text for analysis
export interface PreprocessedText {
  original: string;
  lowercase: string;
  sentences: string[];
  tokens: string[];
  wordCount: number;
  capsRatio: number;
  exclamationCount: number;
  questionCount: number;
  punctuationIntensity: number;
}

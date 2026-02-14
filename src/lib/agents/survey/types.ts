// Survey Research Pipeline — Shared Types
// Used across all 3 agents: Poll Finder → Poll Analyst → Viz Spec Generator

// ── Agent Input ──────────────────────────────────────────────

export interface StoryContext {
  topic: string;
  category: string;
  entities: string[];    // Key people, orgs, policies (e.g., ["ICE", "deportation", "immigration enforcement"])
  angle: string;         // The specific angle of the story (e.g., "ICE conducting operations in sensitive locations")
  summary?: string;      // Brief story summary for additional context
}

// ── Agent 1 Output: Raw Poll Data ────────────────────────────

export interface PollQuestion {
  questionWording: string;     // Exact wording, not paraphrased
  responses: PollResponse[];
  trendData?: TrendPoint[];    // Previous wave comparisons
}

export interface PollResponse {
  option: string;              // "Gone too far", "About right", "Not far enough"
  overall: number;             // 65 (percentage)
  byParty?: {
    dem: number;
    ind: number;
    rep: number;
  };
  byDemographic?: Record<string, number>;  // e.g., { "18-29": 72, "65+": 58 }
}

export interface TrendPoint {
  date: string;                // "June 2025"
  values: Record<string, number>;  // { "Gone too far": 54, "About right": 26 }
}

export interface RawPollData {
  organization: string;        // "NPR/PBS News/Marist Poll"
  datesConducted: string;      // "January 27-30, 2026"
  sampleSize?: number;         // 1462
  marginOfError?: string;      // "±2.9 percentage points"
  mode?: string;               // "phone, text, online"
  url: string;
  questions: PollQuestion[];
}

export interface PollFinderResult {
  topic: string;
  polls: RawPollData[];
  searchFailed?: boolean;
}

// ── Agent 2 Output: Poll Analysis ────────────────────────────

export interface KeyFinding {
  finding: string;             // "65% say ICE has gone too far"
  source: string;              // "Marist, Jan 2026"
  questionWording?: string;    // Exact question, for transparency
  crossPartisan?: {
    dem: number;
    ind: number;
    rep: number;
  };
  trend?: {
    direction: "up" | "down" | "stable";
    from: number;
    to: number;
    period: string;            // "June 2025 → January 2026"
  };
}

export interface PollAnalysis {
  headlineInsight: string;     // The surprising finding, not conventional wisdom
  perceptionGap: {
    claim: string;             // What the data actually shows
    mediaFraming: string;      // What coverage suggests
    gapMagnitude: string;      // How big the distortion is
  };
  keyFindings: KeyFinding[];
  dataQuality: "strong" | "moderate" | "limited";
  sourceCount: number;         // How many independent polls back this up
}

// ── Agent 3 Output: Visualization Specs ──────────────────────

export interface ChartDataPoint {
  label: string;               // "Democrats", "Gone too far", etc.
  value: number;
  color?: string;              // Tailwind color class or hex
  secondary?: number;          // For paired bars (expected vs actual)
  secondaryLabel?: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface VizSpec {
  chartType: "partisan-bars" | "perception-gap" | "trend" | "distribution";
  title: string;
  subtitle?: string;           // Source attribution: "Marist, Jan 27-30 2026, n=1,462, ±2.9%"
  data: ChartDataPoint[];
  trendData?: TrendDataPoint[];
  annotations?: string[];      // Callout for key insights
  sourceAttribution: string;   // Full citation
  questionWording?: string;    // Exact question for transparency
}

// ── Persistent Poll Store Types ─────────────────────────────

export interface StoredPoll {
  id: number;
  url: string;
  organization: string;
  datesConducted: string | null;
  pollDate: Date | null;           // Normalized for sorting
  sampleSize: number | null;
  marginOfError: string | null;
  mode: string | null;
  topics: string[];
  entities: string[];
  categories: string[];
  questions: PollQuestion[];       // Full cross-tab data
  pageText: string | null;         // Preserved for re-extraction
  pageFetchedAt: Date | null;
  extractionQuality: "full" | "partial" | "snippet_only" | "unknown";
  firstSeenInStory: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoveredPoll {
  url: string;
  organization: string;
  approximateDate: string;
}

export interface DiscoveryResult {
  topic: string;
  discoveredPolls: DiscoveredPoll[];
  searchFailed?: boolean;
}

// ── Pipeline Output (what the refresh route consumes) ────────

export interface SurveyResearchResult {
  topic: string;
  analysis: PollAnalysis;
  vizSpecs: VizSpec[];
  rawPolls: RawPollData[];     // Preserved for fallback/debugging
}

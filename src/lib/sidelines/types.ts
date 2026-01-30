/**
 * SideLines shared types
 *
 * Types for measuring political discourse dynamics via event-bounded
 * social network subgraphs from Bluesky.
 */

// =============================================================================
// CORE ENTITIES
// =============================================================================

export type EventStatus =
  | "draft"
  | "collecting"
  | "collected"
  | "analyzing"
  | "ready"
  | "error";

export type InteractionType = "reply" | "quote" | "repost";

export type ConfidenceLevel = "LOW" | "MED" | "HIGH";

export interface SidelinesEvent {
  id: number;
  name: string;
  description: string;
  platform: string;
  keywords: string[];
  seedPostUris: string[];
  startTs: Date;
  endTs: Date;
  status: EventStatus;
  createdAt: Date;
}

export interface SidelinesPost {
  id: number;
  eventId: number;
  platform: string;
  uri: string;
  authorDid: string;
  authorHandle: string;
  text: string;
  createdAt: Date;
  rawJson: Record<string, unknown> | null;
  arousalScore: number | null;
  arousalBreakdown: ArousalBreakdown | null;
}

export interface SidelinesUser {
  id: number;
  eventId: number;
  platform: string;
  did: string;
  handle: string;
  displayName: string | null;
  followerCount: number | null;
}

export interface SidelinesInteraction {
  id: number;
  eventId: number;
  type: InteractionType;
  srcUserId: number;
  dstUserId: number;
  postUri: string;
  parentUri: string | null;
  createdAt: Date;
  weight: number;
}

// =============================================================================
// METRICS & ANALYSIS
// =============================================================================

export interface ArousalBreakdown {
  emotionAngerFearDisgust: number;
  urgency: number;
  intensifiers: number;
  moralJudgment: number;
  purityContamination: number;
  dehumanization: number;
  absolutist: number;
}

export interface ArousalResult {
  score: number;
  breakdown: ArousalBreakdown;
}

export interface DiscourseTemperature {
  score: number;
  label: string;
  colorZone: string;
}

export interface ClusterSummary {
  clusterId: number;
  size: number;
  meanArousal: number;
  energyLevel: string;
  keyVoices: { userId: number; betweenness: number }[];
  edgeDensity: number;
  interactionBreakdown: { reply: number; quote: number; repost: number };
  topPost?: {
    text: string;
    authorHandle: string;
    arousalScore: number;
  };
}

export interface BridgeUser {
  userId: number;
  handle?: string;
  betweenness: number;
  arousal: number;
  clustersSpanned: number[];
}

export interface FieldPosition {
  clusterId: number;
  x: number;
  y: number;
}

export interface DailyMetrics {
  baseActivation: number;
  crossClusterContact: number;
  bridgeChurn: number;
  middleAttrition: number;
  clusterCount: number;
  nodeCount: number;
  edgeCount: number;
  meanArousal: number;
  // New fields (optional for backward compatibility)
  totalUsers?: number;
  giantComponentSize?: number;
  isolatedUsers?: number;
  meaningfulClusterCount?: number;
  discourseTemperature?: DiscourseTemperature;
  headlineInsight?: string;
  clusterSummaries?: ClusterSummary[];
  bridgeUsers?: BridgeUser[];
  clusterPositions?: FieldPosition[];
}

export interface MetricsPayload {
  eventId: number;
  day: string;
  metrics: DailyMetrics;
  confidence: ConfidenceLevel;
}

export interface ClusterAssignment {
  eventId: number;
  day: string;
  userId: number;
  clusterId: number;
  score: number;
}

export interface UserFeatures {
  eventId: number;
  day: string;
  userId: number;
  arousalMean: number;
  arousalP95: number;
  postCount: number;
  inDegree: number;
  outDegree: number;
  betweenness: number;
}

export interface AttackMatrixEntry {
  srcCluster: number;
  dstCluster: number;
  edgeCount: number;
  meanArousal: number;
}

// =============================================================================
// DATABASE ROW TYPES
// =============================================================================

export interface SidelinesEventRow {
  id: number;
  name: string;
  description: string;
  platform: string;
  keywords: string[];
  seed_post_uris: string[];
  start_ts: Date;
  end_ts: Date;
  status: EventStatus;
  created_at: Date;
}

export interface SidelinesDailyMetricsRow {
  event_id: number;
  day: string;
  metrics_json: DailyMetrics;
  confidence: ConfidenceLevel;
}

export interface SidelinesClusterAssignmentRow {
  event_id: number;
  day: string;
  user_id: number;
  cluster_id: number;
  score: number;
}

export interface SidelinesUserFeaturesRow {
  event_id: number;
  day: string;
  user_id: number;
  arousal_mean: number;
  arousal_p95: number;
  post_count: number;
  in_degree: number;
  out_degree: number;
  betweenness: number;
}

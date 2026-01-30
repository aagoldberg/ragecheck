"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";

// =============================================================================
// TYPES
// =============================================================================

interface DiscourseTemperature {
  score: number;
  label: string;
  colorZone: string;
}

interface ClusterSummary {
  clusterId: number;
  size: number;
  meanArousal: number;
  energyLevel: string;
  keyVoices: { userId: number; betweenness: number; handle?: string }[];
  edgeDensity: number;
  interactionBreakdown: { reply: number; quote: number; repost: number };
  topPost?: { text: string; authorHandle: string; arousalScore: number };
}

interface BridgeUser {
  userId: number;
  handle?: string;
  betweenness: number;
  arousal: number;
  clustersSpanned: number[];
}

interface FieldPosition {
  clusterId: number;
  x: number;
  y: number;
}

interface CofollowCommunity {
  clusterId: number;
  memberCount: number;
  llmSummary: string;
  topFollowedHandles: string[];
  meanArousal: number;
  postCount: number;
  activeOnTopic: boolean;
}

interface CommunityBreakdown {
  communityId: number;
  communityName: string;
  communityDescription: string;
  memberCount: number;
  postCount: number;
  meanArousal: number;
  activeOnTopic: boolean;
}

interface DailyMetrics {
  baseActivation: number;
  crossClusterContact: number;
  bridgeChurn: number;
  middleAttrition: number;
  clusterCount: number;
  nodeCount: number;
  edgeCount: number;
  meanArousal: number;
  attackMatrix?: AttackMatrixEntry[];
  totalUsers?: number;
  giantComponentSize?: number;
  isolatedUsers?: number;
  meaningfulClusterCount?: number;
  discourseTemperature?: DiscourseTemperature;
  headlineInsight?: string;
  clusterSummaries?: ClusterSummary[];
  bridgeUsers?: BridgeUser[];
  interClusterEdges?: InterClusterEdge[];
  clusterPositions?: FieldPosition[];
  cofollowCommunities?: CofollowCommunity[];
  communityBreakdown?: CommunityBreakdown[];
}

interface InterClusterEdge {
  fromCluster: number;
  toCluster: number;
  count: number;
  meanArousal: number;
}

interface AttackMatrixEntry {
  src_cluster: number;
  dst_cluster: number;
  edge_count: number;
  mean_arousal: number;
}

interface MetricsDay {
  day: string;
  metrics: DailyMetrics;
  confidence: string;
}

interface EventData {
  id: number;
  name: string;
  description: string;
  platform: string;
  keywords: string[];
  status: string;
  startTs: string;
  endTs: string;
}

interface PostData {
  id: number;
  uri: string;
  authorHandle: string;
  text: string;
  arousalScore: number | null;
  arousalBreakdown?: Record<string, number> | null;
  createdAt: string;
  clusterId?: number;
  dominantArousalType?: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", label: "Draft" },
  collecting: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Collecting..." },
  collected: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Collected" },
  fetching_follows: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", label: "Fetching Follows..." },
  follows_ready: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-400", label: "Follows Ready" },
  analyzing: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "Analyzing..." },
  ready: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Ready" },
  error: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Error" },
};

const CONFIDENCE_CONFIG: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  MED: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  HIGH: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
};

const TEAM_COLORS = [
  { fill: "#6366f1", stroke: "#4f46e5", glow: "rgba(99,102,241,0.3)", name: "indigo" },
  { fill: "#10b981", stroke: "#059669", glow: "rgba(16,185,129,0.3)", name: "emerald" },
  { fill: "#f59e0b", stroke: "#d97706", glow: "rgba(245,158,11,0.3)", name: "amber" },
  { fill: "#f43f5e", stroke: "#e11d48", glow: "rgba(244,63,94,0.3)", name: "rose" },
  { fill: "#06b6d4", stroke: "#0891b2", glow: "rgba(6,182,212,0.3)", name: "cyan" },
  { fill: "#8b5cf6", stroke: "#7c3aed", glow: "rgba(139,92,246,0.3)", name: "violet" },
  { fill: "#ec4899", stroke: "#db2777", glow: "rgba(236,72,153,0.3)", name: "pink" },
  { fill: "#14b8a6", stroke: "#0d9488", glow: "rgba(20,184,166,0.3)", name: "teal" },
];

const TEMP_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  zinc: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" },
  blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  orange: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
};

function getTeamColor(index: number) {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}

function getTeamLabel(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C, ...
}

// =============================================================================
// ZONE 1: SCOREBOARD
// =============================================================================

function Scoreboard({
  event,
  metrics,
  confidence,
  ingesting,
  analyzing,
  fetchingFollows,
  followsProgress,
  onIngest,
  onFetchFollows,
  onAnalyze,
}: {
  event: EventData;
  metrics: DailyMetrics | undefined;
  confidence: string;
  ingesting: boolean;
  analyzing: boolean;
  fetchingFollows: boolean;
  followsProgress: { fetched: number; total: number } | null;
  onIngest: () => void;
  onFetchFollows: () => void;
  onAnalyze: () => void;
}) {
  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;
  const confConfig = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.LOW;
  const temp = metrics?.discourseTemperature;
  const tempColors = temp ? TEMP_COLORS[temp.colorZone] || TEMP_COLORS.zinc : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mb-6">
      {/* Headline */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>
        {metrics?.headlineInsight && (
          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {metrics.headlineInsight}
          </p>
        )}
      </div>

      {/* Game Stats Row */}
      <div className="px-6 pb-4 flex flex-wrap gap-2">
        {temp && tempColors && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${tempColors.bg} ${tempColors.text}`}>
            <span className={`w-2 h-2 rounded-full ${tempColors.dot}`} />
            Game Intensity: {temp.label}
          </span>
        )}
        {metrics?.meaningfulClusterCount != null && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
            {metrics.meaningfulClusterCount} Teams
          </span>
        )}
        {metrics?.giantComponentSize != null && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
            {metrics.giantComponentSize.toLocaleString()} Active Players
          </span>
        )}
        {metrics?.isolatedUsers != null && metrics.isolatedUsers > 0 && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            {metrics.isolatedUsers.toLocaleString()} Spectators
          </span>
        )}
        {metrics && (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${confConfig.bg} ${confConfig.text}`}>
            Confidence: {confidence}
          </span>
        )}
      </div>

      {/* Game Clock + Admin Controls */}
      <div className="px-6 pb-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
        <div className="text-xs text-zinc-400">
          {event.startTs && event.endTs && (
            <span>
              {new Date(event.startTs).toLocaleDateString()} — {new Date(event.endTs).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={onIngest}
            disabled={ingesting || event.status === "collecting"}
            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-medium transition-colors"
          >
            {ingesting ? "Ingesting..." : "Ingest"}
          </button>
          <button
            onClick={onFetchFollows}
            disabled={fetchingFollows || event.status === "fetching_follows"}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {fetchingFollows
              ? followsProgress
                ? `Follows: ${followsProgress.fetched} / ${followsProgress.total}`
                : "Fetching..."
              : "Fetch Follows"}
          </button>
          <button
            onClick={onAnalyze}
            disabled={analyzing || event.status === "analyzing"}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ZONE 2: THE FIELD (SVG)
// =============================================================================

function isRealHandle(handle: string | undefined): boolean {
  if (!handle) return false;
  // Filter out numeric-only IDs like "5801"
  return !/^\d+$/.test(handle);
}

function formatHandle(v: { handle?: string; userId: number }): string {
  return isRealHandle(v.handle) ? `@${v.handle}` : `User ${v.userId}`;
}

function densityLabel(density: number): string {
  if (density >= 0.5) return "Very tight-knit";
  if (density >= 0.2) return "Tight-knit";
  if (density >= 0.05) return "Connected";
  return "Loosely connected";
}

const MAX_FIELD_TEAMS = 8;

function TheField({
  clusterSummaries: allSummaries,
  clusterPositions,
  bridgeUsers,
  metrics,
  cofollowCommunities,
  onSelectTeam,
}: {
  clusterSummaries: ClusterSummary[];
  clusterPositions: FieldPosition[];
  bridgeUsers: BridgeUser[];
  metrics: DailyMetrics;
  cofollowCommunities?: CofollowCommunity[];
  onSelectTeam: (clusterId: number | null) => void;
}) {
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);
  const [hoveredBridge, setHoveredBridge] = useState<number | null>(null);
  const [hoveredArrow, setHoveredArrow] = useState<string | null>(null);

  // Cap to top N teams by size for readable field
  const clusterSummaries = [...allSummaries]
    .sort((a, b) => b.size - a.size)
    .slice(0, MAX_FIELD_TEAMS);
  const hiddenCount = allSummaries.length - clusterSummaries.length;

  const width = 800;
  const height = 500;
  const padding = 60;

  // Map cluster IDs to positions
  const posMap = new Map(clusterPositions.map((p) => [p.clusterId, p]));
  const summaryMap = new Map(clusterSummaries.map((s, i) => [s.clusterId, { ...s, colorIndex: i }]));

  // Compute bubble sizes (area-proportional to member count)
  const maxSize = Math.max(...clusterSummaries.map((s) => s.size), 1);
  const minRadius = 25;
  const maxRadius = 55;

  function getRadius(size: number): number {
    return minRadius + (maxRadius - minRadius) * Math.sqrt(size / maxSize);
  }

  function getScreenPos(pos: FieldPosition): { cx: number; cy: number } {
    return {
      cx: padding + pos.x * (width - 2 * padding),
      cy: padding + pos.y * (height - 2 * padding),
    };
  }

  // Build interaction arrows from interClusterEdges (all cross-cluster edges)
  const interEdges = metrics.interClusterEdges || [];
  const arrowData = interEdges
    .filter((e) => summaryMap.has(e.fromCluster) && summaryMap.has(e.toCluster))
    .map((e) => ({
      from: e.fromCluster,
      to: e.toCluster,
      count: e.count,
      meanArousal: e.meanArousal,
    }));
  const maxArrowCount = Math.max(...arrowData.map((a) => a.count), 1);

  // Bridge user positions: place along the arrows they bridge
  const validBridges = bridgeUsers
    .filter((b) => b.clustersSpanned.some((cid) => summaryMap.has(cid)))
    .slice(0, 8);
  const bridgePositions = validBridges.map((b, i) => {
    const spanned = b.clustersSpanned.filter((cid) => summaryMap.has(cid));
    if (spanned.length >= 2) {
      const p1 = posMap.get(spanned[0]);
      const p2 = posMap.get(spanned[1]);
      if (p1 && p2) {
        const t = 0.3 + (i * 0.1) % 0.4;
        return {
          ...b,
          x: padding + (p1.x + (p2.x - p1.x) * t) * (width - 2 * padding),
          y: padding + (p1.y + (p2.y - p1.y) * t) * (height - 2 * padding),
        };
      }
    }
    // Fallback: place in center area
    return {
      ...b,
      x: width / 2 + (i - validBridges.length / 2) * 30,
      y: height / 2 + (i % 2 === 0 ? -15 : 15),
    };
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mb-6">
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">The Field</h2>
        <span className="text-xs text-zinc-400">
          {clusterSummaries.length} teams
          {hiddenCount > 0 && ` (+${hiddenCount} smaller)`}
          {" · "}
          {validBridges.length} midfielders
        </span>
      </div>
      <div className="px-4 pb-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[800px] mx-auto"
          style={{ minWidth: 500 }}
        >
          {/* Field background */}
          <rect
            x={10}
            y={10}
            width={width - 20}
            height={height - 20}
            rx={16}
            fill="currentColor"
            fillOpacity={0.02}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1.5}
          />

          {/* Center line */}
          <line
            x1={width / 2}
            y1={30}
            x2={width / 2}
            y2={height - 30}
            stroke="currentColor"
            strokeOpacity={0.06}
            strokeWidth={1}
            strokeDasharray="6 4"
          />

          {/* Center circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={50}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.06}
            strokeWidth={1}
          />

          {/* Interaction arrows (from inter-cluster edge data) */}
          {arrowData.map((arrow) => {
            const fromPos = posMap.get(arrow.from);
            const toPos = posMap.get(arrow.to);
            if (!fromPos || !toPos) return null;
            const from = getScreenPos(fromPos);
            const to = getScreenPos(toPos);
            const midX = (from.cx + to.cx) / 2;
            const midY = (from.cy + to.cy) / 2;
            // Curve the path
            const dx = to.cx - from.cx;
            const dy = to.cy - from.cy;
            const cpX = midX - dy * 0.15;
            const cpY = midY + dx * 0.15;
            const strokeWidth = 1 + (arrow.count / maxArrowCount) * 4;
            // Use count-based opacity so arrows show even with low arousal
            const opacity = 0.12 + (arrow.count / maxArrowCount) * 0.45;
            const key = `${arrow.from}-${arrow.to}`;
            const isHovered = hoveredArrow === key;

            return (
              <g key={key}>
                <path
                  d={`M ${from.cx} ${from.cy} Q ${cpX} ${cpY} ${to.cx} ${to.cy}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isHovered ? strokeWidth + 1 : strokeWidth}
                  strokeOpacity={isHovered ? Math.min(opacity + 0.2, 0.9) : opacity}
                  strokeLinecap="round"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredArrow(key)}
                  onMouseLeave={() => setHoveredArrow(null)}
                />
                {isHovered && (
                  <text
                    x={cpX}
                    y={cpY - 10}
                    textAnchor="middle"
                    fontSize={11}
                    fill="currentColor"
                    fillOpacity={0.7}
                    className="pointer-events-none"
                  >
                    {arrow.count} interactions · {(arrow.meanArousal * 100).toFixed(0)}% energy
                  </text>
                )}
              </g>
            );
          })}

          {/* Team bubbles */}
          {clusterSummaries.map((summary, i) => {
            const pos = posMap.get(summary.clusterId);
            if (!pos) return null;
            const { cx, cy } = getScreenPos(pos);
            const r = getRadius(summary.size);
            const color = getTeamColor(i);
            const label = getTeamLabel(i);
            const isHovered = hoveredTeam === summary.clusterId;
            const voiceLabels = summary.keyVoices
              .filter((v) => isRealHandle(v.handle))
              .slice(0, 2)
              .map((v) => `@${v.handle}`)
              .join(", ");

            // Use co-follow community name if available
            const cofollowMatch = cofollowCommunities?.find((c) => c.clusterId === summary.clusterId);
            let displayName = `Team ${label}`;
            if (cofollowMatch?.llmSummary) {
              const parts = cofollowMatch.llmSummary.split(":");
              if (parts.length > 1 && parts[0].length <= 30) {
                displayName = parts[0].trim();
              }
            }
            // Truncate if too long for SVG bubble
            if (displayName.length > 20) {
              displayName = displayName.slice(0, 18) + "...";
            }

            return (
              <g
                key={summary.clusterId}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredTeam(summary.clusterId)}
                onMouseLeave={() => setHoveredTeam(null)}
                onClick={() => onSelectTeam(summary.clusterId)}
              >
                {/* Glow for high energy */}
                {summary.energyLevel === "High" && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 6}
                    fill="none"
                    stroke={color.glow}
                    strokeWidth={4}
                    opacity={isHovered ? 0.8 : 0.4}
                    className="transition-opacity"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? r + 3 : r}
                  fill={color.fill}
                  fillOpacity={isHovered ? 0.25 : 0.15}
                  stroke={color.stroke}
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all"
                />
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  fontSize={cofollowMatch ? 11 : 14}
                  fontWeight="bold"
                  fill={color.fill}
                  className="pointer-events-none"
                >
                  {displayName}
                </text>
                <text
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  fontSize={12}
                  fill="currentColor"
                  fillOpacity={0.5}
                  className="pointer-events-none"
                >
                  {summary.size} players
                </text>

                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={cx - 95}
                      y={cy + r + 10}
                      width={190}
                      height={voiceLabels ? 52 : 32}
                      rx={8}
                      fill="currentColor"
                      fillOpacity={0.05}
                      stroke="currentColor"
                      strokeOpacity={0.1}
                    />
                    <text x={cx - 85} y={cy + r + 28} fontSize={10} fill="currentColor" fillOpacity={0.6}>
                      {summary.energyLevel} energy · {densityLabel(summary.edgeDensity)}
                    </text>
                    {voiceLabels && (
                      <text x={cx - 85} y={cy + r + 44} fontSize={10} fill="currentColor" fillOpacity={0.5}>
                        {voiceLabels}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Midfielders (bridge users) */}
          {bridgePositions.map((bridge, i) => {
            const isHovered = hoveredBridge === i;
            const spannedColors = bridge.clustersSpanned
              .map((cid) => summaryMap.get(cid))
              .filter(Boolean)
              .map((s) => getTeamColor(s!.colorIndex));
            const color = spannedColors[0] || TEAM_COLORS[0];
            const handleLabel = formatHandle(bridge);

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredBridge(i)}
                onMouseLeave={() => setHoveredBridge(null)}
                className="cursor-pointer"
              >
                {/* Diamond shape */}
                <polygon
                  points={`${bridge.x},${bridge.y - 8} ${bridge.x + 8},${bridge.y} ${bridge.x},${bridge.y + 8} ${bridge.x - 8},${bridge.y}`}
                  fill={color.fill}
                  fillOpacity={isHovered ? 0.5 : 0.3}
                  stroke={color.stroke}
                  strokeWidth={1.5}
                  className="transition-all"
                />
                {isHovered && (
                  <g>
                    <rect
                      x={bridge.x - 85}
                      y={bridge.y - 30}
                      width={170}
                      height={20}
                      rx={6}
                      fill="currentColor"
                      fillOpacity={0.05}
                      stroke="currentColor"
                      strokeOpacity={0.1}
                    />
                    <text
                      x={bridge.x}
                      y={bridge.y - 16}
                      textAnchor="middle"
                      fontSize={10}
                      fill="currentColor"
                      fillOpacity={0.7}
                    >
                      {handleLabel} — Connects Teams{" "}
                      {bridge.clustersSpanned
                        .filter((cid) => summaryMap.has(cid))
                        .map((cid) => {
                          const s = summaryMap.get(cid);
                          return s ? getTeamLabel(s.colorIndex) : `?`;
                        })
                        .join(" & ")}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g>
            <polygon
              points="30,470 38,478 30,486 22,478"
              fill="currentColor"
              fillOpacity={0.15}
              stroke="currentColor"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
            <text x={45} y={482} fontSize={10} fill="currentColor" fillOpacity={0.35}>
              Midfielders (bridge users)
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

// =============================================================================
// ZONE 3A: TEAM ROSTER CARDS
// =============================================================================

function TeamRosterCards({
  clusterSummaries,
  selectedTeam,
  onSelectTeam,
}: {
  clusterSummaries: ClusterSummary[];
  selectedTeam: number | null;
  onSelectTeam: (id: number | null) => void;
}) {
  if (clusterSummaries.length === 0) return null;

  const displayed = selectedTeam != null
    ? clusterSummaries.filter((s) => s.clusterId === selectedTeam)
    : clusterSummaries;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Team Rosters</h2>
        {selectedTeam != null && (
          <button
            onClick={() => onSelectTeam(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Show all teams
          </button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {displayed.map((summary, i) => {
          const actualIndex = clusterSummaries.indexOf(summary);
          const color = getTeamColor(actualIndex);
          const label = getTeamLabel(actualIndex);
          const breakdown = summary.interactionBreakdown;

          return (
            <div
              key={summary.clusterId}
              className="flex-shrink-0 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden snap-start"
            >
              {/* Color stripe */}
              <div className="h-1.5" style={{ backgroundColor: color.fill }} />

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: color.fill }}>
                      Team {label}
                    </span>
                    <span className="text-xs text-zinc-400">{summary.size} members</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    summary.energyLevel === "High"
                      ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                      : summary.energyLevel === "Medium"
                        ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}>
                    {summary.energyLevel} Energy
                  </span>
                </div>

                {/* Key Players */}
                <div className="mb-3">
                  <div className="text-xs text-zinc-400 mb-1">Key Players</div>
                  <div className="flex flex-wrap gap-1">
                    {summary.keyVoices.map((v, vi) => (
                      <span
                        key={vi}
                        className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        {formatHandle(v)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Play Style: interaction breakdown */}
                <div className="mb-3">
                  <div className="text-xs text-zinc-400 mb-1">Play Style</div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {breakdown.reply > 0 && (
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${breakdown.reply * 100}%` }}
                        title={`Replies: ${(breakdown.reply * 100).toFixed(0)}%`}
                      />
                    )}
                    {breakdown.quote > 0 && (
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${breakdown.quote * 100}%` }}
                        title={`Quotes: ${(breakdown.quote * 100).toFixed(0)}%`}
                      />
                    )}
                    {breakdown.repost > 0 && (
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${breakdown.repost * 100}%` }}
                        title={`Reposts: ${(breakdown.repost * 100).toFixed(0)}%`}
                      />
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {(breakdown.reply * 100).toFixed(0)}% replies
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {(breakdown.quote * 100).toFixed(0)}% quotes
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {(breakdown.repost * 100).toFixed(0)}% reposts
                    </span>
                  </div>
                </div>

                {/* Stat line */}
                <div className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  Avg energy: {(summary.meanArousal * 100).toFixed(0)}%
                  {" · "}{densityLabel(summary.edgeDensity)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// ZONE 2B: WHO'S ON THE FIELD (Co-follow Communities)
// =============================================================================

function WhosOnTheField({
  communities,
  communityBreakdown,
}: {
  communities?: CofollowCommunity[];
  communityBreakdown?: CommunityBreakdown[];
}) {
  // Prefer global community breakdown over per-event cofollows
  if (communityBreakdown && communityBreakdown.length > 0) {
    const sorted = [...communityBreakdown].sort((a, b) => b.memberCount - a.memberCount);

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Who&apos;s On The Field</h2>
          <span className="text-xs text-zinc-400">
            {sorted.length} communities from global follow graph
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((community) => {
            const activePercent = community.memberCount > 0
              ? Math.round((community.postCount > 0 ? community.postCount / community.memberCount : 0) * 100)
              : 0;
            const barWidth = Math.min(activePercent, 100);

            return (
              <div
                key={community.communityId}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{community.communityName}</h3>
                  <span className="text-xs text-zinc-400 flex-shrink-0 ml-2">
                    {community.memberCount.toLocaleString()} users
                  </span>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                  {community.communityDescription}
                </p>

                {/* Activity stats */}
                <div className="flex items-center gap-3 text-[10px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span>{community.postCount} posts</span>
                  <span>{(community.meanArousal * 100).toFixed(0)}% avg energy</span>
                </div>

                {/* Active on topic bar */}
                {community.activeOnTopic && (
                  <div className="mt-2">
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {barWidth}% active on topic
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fall back to per-event cofollows
  if (!communities || communities.length === 0) return null;

  const sorted = [...communities].sort((a, b) => b.memberCount - a.memberCount);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Who&apos;s On The Field</h2>
        <span className="text-xs text-zinc-400">
          {sorted.length} communities detected via shared follows
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((community) => {
          const parts = community.llmSummary.split(":");
          const communityName = parts.length > 1 ? parts[0].trim() : `Community ${community.clusterId}`;
          const summary = parts.length > 1 ? parts.slice(1).join(":").trim() : community.llmSummary;

          const activePercent = community.memberCount > 0
            ? Math.round((community.postCount > 0 ? community.postCount / community.memberCount : 0) * 100)
            : 0;
          const barWidth = Math.min(activePercent, 100);

          return (
            <div
              key={community.clusterId}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{communityName}</h3>
                <span className="text-xs text-zinc-400 flex-shrink-0 ml-2">
                  {community.memberCount.toLocaleString()} users
                </span>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                {summary}
              </p>

              {community.topFollowedHandles.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-zinc-400 mb-1">Top follows</div>
                  <div className="flex flex-wrap gap-1">
                    {community.topFollowedHandles.slice(0, 6).map((handle, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      >
                        @{handle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-[10px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span>{community.postCount} posts</span>
                <span>{(community.meanArousal * 100).toFixed(0)}% avg energy</span>
              </div>

              {community.activeOnTopic && (
                <div className="mt-2">
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {barWidth}% active on topic
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// ZONE 3B: PLAY-BY-PLAY
// =============================================================================

function PlayByPlay({
  posts,
  clusterSummaries,
}: {
  posts: PostData[];
  clusterSummaries: ClusterSummary[];
}) {
  if (posts.length === 0) return null;

  // Build team label map
  const clusterLabelMap = new Map<number, { label: string; color: typeof TEAM_COLORS[0] }>();
  clusterSummaries.forEach((s, i) => {
    clusterLabelMap.set(s.clusterId, { label: getTeamLabel(i), color: getTeamColor(i) });
  });

  return (
    <section className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-lg font-bold">Play-by-Play</h2>
        <p className="text-xs text-zinc-400">Highest-energy moments in the discourse</p>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {posts.slice(0, 15).map((post) => {
          const team = post.clusterId != null ? clusterLabelMap.get(post.clusterId) : null;
          const energyPct = post.arousalScore != null ? (post.arousalScore * 100).toFixed(0) : null;

          return (
            <div key={post.id} className="px-6 py-3 flex gap-3">
              {/* Energy indicator */}
              <div className="flex-shrink-0 w-14 text-right">
                {energyPct != null && (
                  <span className={`text-sm font-bold ${
                    post.arousalScore! >= 0.7 ? "text-red-500" :
                    post.arousalScore! >= 0.4 ? "text-amber-500" : "text-emerald-500"
                  }`}>
                    {energyPct}%
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-zinc-500">
                    @{post.authorHandle}
                  </span>
                  {team && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: team.color.fill + "1a",
                        color: team.color.fill,
                      }}
                    >
                      Team {team.label}
                    </span>
                  )}
                  {post.dominantArousalType && (
                    <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                      {post.dominantArousalType}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-2">
                  {post.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// =============================================================================
// ZONE 3C: GAME TRENDS (MOMENTUM CHART)
// =============================================================================

function GameTrends({ data }: { data: MetricsDay[] }) {
  if (data.length <= 1) return null;

  const sorted = [...data].sort((a, b) => a.day.localeCompare(b.day));
  const width = 700;
  const height = 180;
  const pad = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  // Compute temperature for each day (or use stored value)
  const scores = sorted.map((d) => d.metrics.discourseTemperature?.score ?? 0);
  const maxScore = Math.max(...scores, 1);

  function getX(i: number): number {
    if (sorted.length === 1) return pad.left + chartW / 2;
    return pad.left + (i / (sorted.length - 1)) * chartW;
  }

  function getY(score: number): number {
    return pad.top + chartH * (1 - score / Math.max(maxScore, 100));
  }

  const points = scores.map((s, i) => `${getX(i)},${getY(s)}`).join(" ");

  // Gradient stops based on temperature
  const gradientId = "momentum-gradient";

  return (
    <section className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-lg font-bold">Game Trends</h2>
        <p className="text-xs text-zinc-400">Discourse momentum over time</p>
      </div>
      <div className="px-4 pb-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[700px]">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="33%" stopColor="#f59e0b" />
              <stop offset="66%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line
                x1={pad.left}
                y1={getY(v)}
                x2={width - pad.right}
                y2={getY(v)}
                stroke="currentColor"
                strokeOpacity={0.06}
              />
              <text x={pad.left - 8} y={getY(v) + 4} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.3}>
                {v}
              </text>
            </g>
          ))}

          {/* Area under curve */}
          <polygon
            points={`${getX(0)},${pad.top + chartH} ${points} ${getX(sorted.length - 1)},${pad.top + chartH}`}
            fill={`url(#${gradientId})`}
            fillOpacity={0.08}
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots */}
          {scores.map((s, i) => (
            <circle key={i} cx={getX(i)} cy={getY(s)} r={3} fill="currentColor" fillOpacity={0.3} />
          ))}

          {/* X-axis */}
          {sorted.map((d, i) => {
            if (sorted.length > 10 && i % Math.ceil(sorted.length / 8) !== 0) return null;
            return (
              <text key={d.day} x={getX(i)} y={height - 5} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.3}>
                {d.day.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

// =============================================================================
// ZONE 3D: POST-GAME ANALYSIS (COLLAPSIBLE RAW STATS)
// =============================================================================

function PostGameAnalysis({ metrics }: { metrics: DailyMetrics }) {
  const [expanded, setExpanded] = useState(false);

  const attackMatrix = metrics.attackMatrix || [];

  return (
    <section className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-sm font-bold">Full Stats</span>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
          {/* Raw Metrics Table */}
          <div>
            <h3 className="text-sm font-bold mb-2">Raw Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-zinc-400">Base Activation</div>
                <div className="font-bold">{metrics.baseActivation.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-zinc-400">Cross-Cluster Contact</div>
                <div className="font-bold">{metrics.crossClusterContact.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-zinc-400">Bridge Churn</div>
                <div className="font-bold">{metrics.bridgeChurn.toFixed(4)}</div>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-zinc-400">Middle Attrition</div>
                <div className="font-bold">{metrics.middleAttrition.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-zinc-400">Cluster Count (all)</div>
                <div className="font-bold">{metrics.clusterCount}</div>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-zinc-400">Node Count</div>
                <div className="font-bold">{metrics.nodeCount.toLocaleString()}</div>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-zinc-400">Edge Count</div>
                <div className="font-bold">{metrics.edgeCount.toLocaleString()}</div>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-zinc-400">Mean Arousal</div>
                <div className="font-bold">{metrics.meanArousal.toFixed(4)}</div>
              </div>
              {metrics.totalUsers != null && (
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-zinc-400">Total Users</div>
                  <div className="font-bold">{metrics.totalUsers.toLocaleString()}</div>
                </div>
              )}
              {metrics.giantComponentSize != null && (
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-zinc-400">Giant Component</div>
                  <div className="font-bold">{metrics.giantComponentSize.toLocaleString()}</div>
                </div>
              )}
              {metrics.discourseTemperature && (
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-zinc-400">Temperature Score</div>
                  <div className="font-bold">{metrics.discourseTemperature.score.toFixed(1)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Attack Matrix (Shot Chart) */}
          {attackMatrix.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2">Shot Chart (Attack Matrix)</h3>
              <p className="text-xs text-zinc-400 mb-2">
                Cross-cluster aggressive interactions (arousal &gt; 0.6). Cell values = edge count.
              </p>
              <AttackMatrixTable entries={attackMatrix} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AttackMatrixTable({ entries }: { entries: AttackMatrixEntry[] }) {
  const clusters = new Set<number>();
  for (const e of entries) {
    clusters.add(e.src_cluster);
    clusters.add(e.dst_cluster);
  }
  const sorted = [...clusters].sort((a, b) => a - b);
  const maxEdges = Math.max(...entries.map((e) => e.edge_count), 1);
  const lookup: Record<string, AttackMatrixEntry> = {};
  for (const e of entries) {
    lookup[`${e.src_cluster}-${e.dst_cluster}`] = e;
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="p-2 text-zinc-500">From \ To</th>
            {sorted.map((c) => (
              <th key={c} className="p-2 text-zinc-500">C{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((src) => (
            <tr key={src}>
              <td className="p-2 font-medium text-zinc-500">C{src}</td>
              {sorted.map((dst) => {
                if (src === dst) {
                  return <td key={dst} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-center">-</td>;
                }
                const entry = lookup[`${src}-${dst}`];
                if (!entry) {
                  return <td key={dst} className="p-2 text-center text-zinc-300 dark:text-zinc-700">0</td>;
                }
                const intensity = entry.edge_count / maxEdges;
                const r = Math.round(239 + (220 - 239) * intensity);
                const g = Math.round(68 + (38 - 68) * intensity);
                const b = Math.round(68 + (38 - 68) * intensity);
                return (
                  <td
                    key={dst}
                    className="p-2 text-center text-white font-medium"
                    style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                    title={`${entry.edge_count} edges, mean arousal ${entry.mean_arousal.toFixed(2)}`}
                  >
                    {entry.edge_count}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = parseInt(id);

  const [event, setEvent] = useState<EventData | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<MetricsDay | null>(null);
  const [timeline, setTimeline] = useState<MetricsDay[]>([]);
  const [topPosts, setTopPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchingFollows, setFetchingFollows] = useState(false);
  const [followsProgress, setFollowsProgress] = useState<{ fetched: number; total: number } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [eventRes, metricsRes, postsRes] = await Promise.all([
        fetch(`/api/sidelines/events/${eventId}`),
        fetch(`/api/sidelines/events/${eventId}/metrics`),
        fetch(`/api/sidelines/events/${eventId}/top-posts?limit=30`),
      ]);

      const eventData = await eventRes.json();
      if (eventData.success) {
        setEvent(eventData.event);
        setLatestMetrics(eventData.latestMetrics);
      }

      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setTimeline(metricsData.metrics);
      }

      const postsData = await postsRes.json();
      if (postsData.success) {
        setTopPosts(postsData.posts);
      }
    } catch (err) {
      console.error("Failed to load event data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleIngest() {
    setIngesting(true);
    try {
      await fetch(`/api/sidelines/events/${eventId}/ingest`, { method: "POST" });
      fetchAll();
    } catch (err) {
      console.error("Ingest failed:", err);
    } finally {
      setIngesting(false);
    }
  }

  async function handleFetchFollows() {
    setFetchingFollows(true);
    try {
      let done = false;
      while (!done) {
        const res = await fetch(`/api/sidelines/events/${eventId}/fetch-follows`, {
          method: "POST",
        });
        const data = await res.json();
        if (!data.success) {
          console.error("Fetch follows error:", data.error);
          break;
        }
        setFollowsProgress({ fetched: data.processed, total: data.total });
        done = data.done;
      }
      fetchAll();
    } catch (err) {
      console.error("Fetch follows failed:", err);
    } finally {
      setFetchingFollows(false);
      setFollowsProgress(null);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      await fetch(`/api/sidelines/events/${eventId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      fetchAll();
    } catch (err) {
      console.error("Analyze failed:", err);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500">Event not found.</div>
      </div>
    );
  }

  const m = latestMetrics?.metrics;
  const confidence = latestMetrics?.confidence || "LOW";
  const clusterSummaries = m?.clusterSummaries || [];
  const clusterPositions = m?.clusterPositions || [];
  const bridgeUsers = m?.bridgeUsers || [];
  const hasFieldData = clusterSummaries.length > 0 && clusterPositions.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/sidelines" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-600 dark:bg-emerald-500 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">SideLines</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Analyzer</Link>
            <Link href="/clearview" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">ClearView</Link>
            <Link href="/sidelines" className="text-zinc-900 dark:text-zinc-100">SideLines</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Zone 1: Scoreboard */}
        <Scoreboard
          event={event}
          metrics={m}
          confidence={confidence}
          ingesting={ingesting}
          analyzing={analyzing}
          fetchingFollows={fetchingFollows}
          followsProgress={followsProgress}
          onIngest={handleIngest}
          onFetchFollows={handleFetchFollows}
          onAnalyze={handleAnalyze}
        />

        {/* Zone 2: The Field */}
        {hasFieldData && m && (
          <TheField
            clusterSummaries={clusterSummaries}
            clusterPositions={clusterPositions}
            bridgeUsers={bridgeUsers}
            metrics={m}
            cofollowCommunities={m.cofollowCommunities}
            onSelectTeam={setSelectedTeam}
          />
        )}

        {/* Zone 2B: Who's On The Field (Global Communities or Co-follow) */}
        {(m?.communityBreakdown?.length || m?.cofollowCommunities?.length) ? (
          <WhosOnTheField
            communities={m?.cofollowCommunities}
            communityBreakdown={m?.communityBreakdown}
          />
        ) : null}

        {/* Zone 3A: Team Roster Cards */}
        {clusterSummaries.length > 0 && (
          <TeamRosterCards
            clusterSummaries={clusterSummaries}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
          />
        )}

        {/* Zone 3B: Play-by-Play */}
        <PlayByPlay posts={topPosts} clusterSummaries={clusterSummaries} />

        {/* Zone 3C: Game Trends */}
        <GameTrends data={timeline} />

        {/* Zone 3D: Post-Game Analysis */}
        {m && <PostGameAnalysis metrics={m} />}

        {/* Disclaimer */}
        <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-500 leading-relaxed">
          SideLines observes the game from the sidelines. These metrics track interaction patterns — not beliefs,
          persuasion, or radicalization. Community detection groups users by who talks to whom, not by ideology.
        </div>

        {/* Back link */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/sidelines"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium text-sm"
          >
            &larr; Back to SideLines
          </Link>
        </div>
      </div>
    </div>
  );
}

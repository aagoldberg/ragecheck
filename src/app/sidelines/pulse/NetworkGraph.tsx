"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import type { ForceGraphMethods } from "react-force-graph-2d";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

// =============================================================================
// TYPES
// =============================================================================

interface NetworkNode {
  id: string;
  handle: string;
  community_id: number;
  community_name: string;
  in_degree: number;
  x: number;
  y: number;
  // Added by force-graph at runtime
  fx?: number;
  fy?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
}

interface SignalsAgg {
  emotions: Record<string, number>;
  mean_valence: number;
  mean_toxicity: number;
  toxic_pct: number;
  mean_irony: number;
  ironic_pct: number;
  dominant_emotion: string;
  scored_pct: number;
}

interface CommunityMeta {
  id: number;
  name: string;
  member_count: number;
  color_index: number;
  signals_agg?: SignalsAgg;
}

type ColorMode = "community" | "emotion" | "toxicity";

interface NetworkStats {
  total_nodes: number;
  total_edges: number;
  sampled_from_nodes: number;
  sampled_from_edges: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  communities: CommunityMeta[];
  stats: NetworkStats;
}

// =============================================================================
// COLOR PALETTE — 12 Gephi-style community colors for dark background
// =============================================================================

const COMMUNITY_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
  "#a855f7", // purple
  "#64748b", // slate
];

function getCommunityColor(colorIndex: number): string {
  return COMMUNITY_COLORS[colorIndex % COMMUNITY_COLORS.length];
}

const EMOTION_NODE_COLORS: Record<string, string> = {
  anger: "#ef4444",
  joy: "#22c55e",
  fear: "#a855f7",
  sadness: "#3b82f6",
  surprise: "#eab308",
  disgust: "#f97316",
  neutral: "#71717a",
};

function getToxicityColor(meanToxicity: number): string {
  if (meanToxicity > 0.3) return "#ef4444"; // red
  if (meanToxicity > 0.1) return "#eab308"; // yellow
  return "#22c55e"; // green
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NetworkGraph() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightCommunity, setHighlightCommunity] = useState<number | null>(
    null
  );
  const [colorMode, setColorMode] = useState<ColorMode>("community");
  const [dimensions, setDimensions] = useState({ width: 0, height: 650 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  // Fetch data
  const fetchNetwork = useCallback(async () => {
    try {
      const res = await fetch("/api/sidelines/pulse/network");
      const json = await res.json();
      if (json.success && json.nodes) {
        setData({
          nodes: json.nodes,
          edges: json.edges,
          communities: json.communities,
          stats: json.stats,
        });
        setError(null);
      } else {
        setError(json.error || "Failed to fetch network data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetwork();
    const interval = setInterval(fetchNetwork, 300_000); // 5 min
    return () => clearInterval(interval);
  }, [fetchNetwork]);

  // Track container width
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 650,
        });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build color lookup based on current color mode
  const communityColorMap = useMemo(() => {
    if (!data) return new Map<number, string>();
    const m = new Map<number, string>();
    for (const c of data.communities) {
      if (colorMode === "emotion" && c.signals_agg) {
        m.set(c.id, EMOTION_NODE_COLORS[c.signals_agg.dominant_emotion] || "#71717a");
      } else if (colorMode === "toxicity" && c.signals_agg) {
        m.set(c.id, getToxicityColor(c.signals_agg.mean_toxicity));
      } else {
        m.set(c.id, getCommunityColor(c.color_index));
      }
    }
    return m;
  }, [data, colorMode]);

  // Determine label threshold: top ~5 per community
  const labelSet = useMemo(() => {
    if (!data) return new Set<string>();
    const byCommunity = new Map<number, NetworkNode[]>();
    for (const n of data.nodes) {
      const arr = byCommunity.get(n.community_id) || [];
      arr.push(n);
      byCommunity.set(n.community_id, arr);
    }
    const ids = new Set<string>();
    for (const members of byCommunity.values()) {
      members.sort((a, b) => b.in_degree - a.in_degree);
      for (const m of members.slice(0, 5)) {
        if (m.handle) ids.add(m.id);
      }
    }
    return ids;
  }, [data]);

  // Build graph data for force-graph (uses "links" not "edges")
  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };

    // Scale positions to pixel space with padding
    const pad = 50;
    const w = (dimensions.width || 800) - pad * 2;
    const h = dimensions.height - pad * 2;

    const nodes = data.nodes.map((n) => ({
      ...n,
      fx: pad + n.x * w,
      fy: pad + n.y * h,
    }));

    return {
      nodes,
      links: data.edges.map((e) => ({ source: e.source, target: e.target })),
    };
  }, [data, dimensions]);

  // Custom node renderer
  const paintNode = useCallback(
    (
      node: Record<string, unknown>,
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      const n = node as unknown as NetworkNode;
      const communityId = n.community_id;
      const color = communityColorMap.get(communityId) || "#666";
      const dimmed =
        highlightCommunity !== null && highlightCommunity !== communityId;

      // Radius: log scale from in_degree
      const deg = (n.in_degree || 1);
      const radius = Math.max(1.5, Math.min(8, 1.5 + Math.log(deg + 1) * 1.2));

      const x = (node.x as number) || 0;
      const y = (node.y as number) || 0;

      // Glow for high-degree nodes
      if (deg > 50 && !dimmed) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
        ctx.fillStyle = color + "33"; // 20% opacity
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = dimmed ? color + "30" : color;
      ctx.fill();

      // Label for notable accounts
      if (
        labelSet.has(n.id) &&
        n.handle &&
        globalScale > 0.3 &&
        !dimmed
      ) {
        const label = n.handle.replace(".bsky.social", "");
        const fontSize = Math.max(3, 10 / globalScale);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#e4e4e7"; // zinc-200
        ctx.fillText(label, x, y + radius + 2);
      }
    },
    [communityColorMap, highlightCommunity, labelSet]
  );

  // Node pointer area (for hover/click detection)
  const paintNodeArea = useCallback(
    (
      node: Record<string, unknown>,
      color: string,
      ctx: CanvasRenderingContext2D
    ) => {
      const n = node as unknown as NetworkNode;
      const deg = (n.in_degree || 1);
      const radius = Math.max(1.5, Math.min(8, 1.5 + Math.log(deg + 1) * 1.2));
      const x = (node.x as number) || 0;
      const y = (node.y as number) || 0;
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  // Link color by source community
  const linkColor = useCallback(
    (link: Record<string, unknown>) => {
      const source = link.source as Record<string, unknown> | string;
      let communityId: number | undefined;
      if (typeof source === "object" && source !== null) {
        communityId = source.community_id as number;
      }
      const color = communityId !== undefined
        ? communityColorMap.get(communityId) || "#333"
        : "#333";
      if (highlightCommunity !== null && communityId !== highlightCommunity) {
        return color + "08"; // nearly invisible
      }
      return color + "18"; // low opacity
    },
    [communityColorMap, highlightCommunity]
  );

  // Node click: open Bluesky profile
  const handleNodeClick = useCallback(
    (node: Record<string, unknown>) => {
      const n = node as unknown as NetworkNode;
      if (n.handle) {
        window.open(`https://bsky.app/profile/${n.handle}`, "_blank");
      }
    },
    []
  );

  // Node label (tooltip)
  const nodeLabel = useCallback(
    (node: Record<string, unknown>) => {
      const n = node as unknown as NetworkNode;
      const handle = n.handle || n.id;
      return `<div style="background:#18181b;color:#e4e4e7;padding:6px 10px;border-radius:6px;font-size:12px;line-height:1.5;border:1px solid #3f3f46">
        <strong>${handle}</strong><br/>
        ${n.community_name}<br/>
        ${n.in_degree.toLocaleString()} followers
      </div>`;
    },
    []
  );

  // Legend click handler
  function toggleCommunity(id: number) {
    setHighlightCommunity((prev) => (prev === id ? null : id));
  }

  // ============= RENDER =============

  if (loading) {
    return (
      <div className="bg-[#09090b] rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-center" style={{ height: 650 }}>
          <div className="text-zinc-500 flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading network graph...
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || data.nodes.length === 0) {
    return (
      <div className="bg-[#09090b] rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <p className="text-zinc-500 text-sm">
            {error || "No network data available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-[#09090b] rounded-2xl border border-zinc-800 overflow-hidden relative"
    >
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-start justify-between p-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-200">
              Community Network
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {data.stats.total_nodes.toLocaleString()} nodes &middot;{" "}
              {data.stats.total_edges.toLocaleString()} edges
            </p>
            {/* Color mode toggle */}
            <div className="flex gap-1 mt-2 pointer-events-auto">
              {(["community", "emotion", "toxicity"] as ColorMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setColorMode(mode)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    colorMode === mode
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-1.5 max-w-[60%] justify-end pointer-events-auto">
            {data.communities
              .filter((c) => {
                // Only show communities that have nodes in our sample
                return data.nodes.some((n) => n.community_id === c.id);
              })
              .map((c) => {
                const color = getCommunityColor(c.color_index);
                const active =
                  highlightCommunity === null ||
                  highlightCommunity === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCommunity(c.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-opacity ${
                      active ? "opacity-100" : "opacity-30"
                    } hover:opacity-100`}
                    style={{ background: color + "22" }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-zinc-300 truncate max-w-[120px]">
                      {c.name}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Graph */}
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#09090b"
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={paintNodeArea}
          nodeLabel={nodeLabel}
          onNodeClick={handleNodeClick}
          linkColor={linkColor}
          linkWidth={0.3}
          enableNodeDrag={false}
          cooldownTicks={0}
          warmupTicks={0}
          d3AlphaMin={1}
          minZoom={0.5}
          maxZoom={10}
        />
      )}
    </div>
  );
}

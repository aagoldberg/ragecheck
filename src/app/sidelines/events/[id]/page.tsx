"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

// --- Types ---

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
  createdAt: string;
}

interface ClusterData {
  [clusterId: string]: {
    count: number;
    members: { userId: number; handle?: string; score: number }[];
  };
}

// --- Status Config ---

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", label: "Draft" },
  collecting: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Collecting..." },
  collected: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Collected" },
  analyzing: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "Analyzing..." },
  ready: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Ready" },
  error: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Error" },
};

const CONFIDENCE_CONFIG: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  MED: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  HIGH: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
};

// --- Metric Card ---

function MetricCard({ label, value, unit, description }: {
  label: string;
  value: number | string;
  unit?: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-bold">
        {typeof value === "number" ? value.toFixed(1) : value}
        {unit && <span className="text-sm font-normal text-zinc-400 ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-zinc-400 mt-1">{description}</div>
    </div>
  );
}

// --- SVG Timeline Chart ---

function MetricsChart({ data }: { data: MetricsDay[] }) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.day.localeCompare(b.day));
  const width = 700;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const lines = [
    { key: "baseActivation", color: "#10b981", label: "Base Activation" },
    { key: "crossClusterContact", color: "#3b82f6", label: "Cross-Cluster Contact" },
    { key: "bridgeChurn", color: "#f59e0b", label: "Bridge Churn" },
    { key: "middleAttrition", color: "#ef4444", label: "Middle Attrition" },
  ];

  // Scale: 0-100 for activation/contact/attrition, 0-1 for churn
  function getY(key: string, val: number): number {
    const max = key === "bridgeChurn" ? 1 : 100;
    const normalized = Math.min(val / max, 1);
    return padding.top + chartH * (1 - normalized);
  }

  function getX(i: number): number {
    if (sorted.length === 1) return padding.left + chartW / 2;
    return padding.left + (i / (sorted.length - 1)) * chartW;
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[700px]">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={padding.top + chartH * (1 - v / 100)}
              x2={width - padding.right}
              y2={padding.top + chartH * (1 - v / 100)}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
            <text
              x={padding.left - 5}
              y={padding.top + chartH * (1 - v / 100) + 4}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.4}
            >
              {v}
            </text>
          </g>
        ))}

        {/* Data lines */}
        {lines.map(({ key, color }) => {
          const points = sorted.map((d, i) => {
            const val = d.metrics[key as keyof DailyMetrics] as number;
            return `${getX(i)},${getY(key, val)}`;
          });
          return (
            <polyline
              key={key}
              points={points.join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          );
        })}

        {/* X-axis labels */}
        {sorted.map((d, i) => {
          if (sorted.length > 10 && i % Math.ceil(sorted.length / 8) !== 0) return null;
          return (
            <text
              key={d.day}
              x={getX(i)}
              y={height - 5}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.4}
            >
              {d.day.slice(5)}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap mt-2 text-xs">
        {lines.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
            <span className="text-zinc-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Attack Matrix Heatmap ---

function AttackMatrix({ entries }: { entries: AttackMatrixEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">No cross-cluster aggression detected.</p>;
  }

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

// --- Arousal Bar ---

function ArousalBar({ score }: { score: number }) {
  const pct = Math.min(score * 100, 100);
  const color =
    score >= 0.7 ? "bg-red-500" : score >= 0.4 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// --- Main Page ---

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = parseInt(id);

  const [event, setEvent] = useState<EventData | null>(null);
  const [counts, setCounts] = useState({ postCount: 0, userCount: 0, edgeCount: 0 });
  const [latestMetrics, setLatestMetrics] = useState<MetricsDay | null>(null);
  const [timeline, setTimeline] = useState<MetricsDay[]>([]);
  const [topPosts, setTopPosts] = useState<PostData[]>([]);
  const [clusters, setClusters] = useState<ClusterData>({});
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll() {
    setLoading(true);
    try {
      const [eventRes, metricsRes, postsRes, clusterRes] = await Promise.all([
        fetch(`/api/sidelines/events/${eventId}`),
        fetch(`/api/sidelines/events/${eventId}/metrics`),
        fetch(`/api/sidelines/events/${eventId}/top-posts?limit=30`),
        fetch(`/api/sidelines/events/${eventId}/clusters`),
      ]);

      const eventData = await eventRes.json();
      if (eventData.success) {
        setEvent(eventData.event);
        setCounts(eventData.counts);
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

      const clusterData = await clusterRes.json();
      if (clusterData.success) {
        setClusters(clusterData.clusters || {});
      }
    } catch (err) {
      console.error("Failed to load event data:", err);
    } finally {
      setLoading(false);
    }
  }

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
  const confConfig = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.LOW;
  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;

  const clusterEntries = Object.entries(clusters);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>
          {event.description && (
            <p className="text-zinc-600 dark:text-zinc-400">{event.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-zinc-500">
            <span>{counts.postCount.toLocaleString()} posts</span>
            <span>{counts.userCount.toLocaleString()} users</span>
            <span>{counts.edgeCount.toLocaleString()} edges</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={handleIngest}
            disabled={ingesting || event.status === "collecting"}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {ingesting ? "Ingesting..." : "Ingest Data"}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || event.status === "analyzing"}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </button>
          {m && (
            <span className={`px-3 py-2 rounded-lg text-xs font-medium ${confConfig.bg} ${confConfig.text}`}>
              Confidence: {confidence}
            </span>
          )}
        </div>

        {/* Metrics Summary Cards */}
        {m && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Base Activation"
              value={m.baseActivation}
              description="Within-cluster density × arousal"
            />
            <MetricCard
              label="Cross-Cluster Contact"
              value={m.crossClusterContact}
              description="Inter-community interaction rate"
            />
            <MetricCard
              label="Bridge Churn"
              value={m.bridgeChurn}
              unit="ratio"
              description="Day-over-day bridge node turnover"
            />
            <MetricCard
              label="Middle Attrition"
              value={m.middleAttrition}
              description="Composite moderate disengagement"
            />
          </div>
        )}

        {/* Metrics Timeline */}
        {timeline.length > 0 && (
          <section className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <h2 className="text-lg font-bold mb-4">Metrics Timeline</h2>
            <MetricsChart data={timeline} />
          </section>
        )}

        {/* Cluster View */}
        {clusterEntries.length > 0 && (
          <section className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <h2 className="text-lg font-bold mb-4">Cluster View</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {clusterEntries.map(([clusterId, data]) => (
                <div
                  key={clusterId}
                  className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                >
                  <div className="font-medium text-sm mb-1">Cluster {clusterId}</div>
                  <div className="text-2xl font-bold">{data.count}</div>
                  <div className="text-xs text-zinc-500">members</div>
                  {data.members.slice(0, 3).map((member, i) => (
                    <div key={i} className="text-xs text-zinc-400 truncate mt-1">
                      @{member.handle || `user-${member.userId}`}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attack Matrix */}
        {m?.attackMatrix && m.attackMatrix.length > 0 && (
          <section className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <h2 className="text-lg font-bold mb-2">Attack Matrix</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Cross-cluster aggressive interactions (arousal &gt; 0.6). Cell values = edge count.
            </p>
            <AttackMatrix entries={m.attackMatrix} />
          </section>
        )}

        {/* Play-by-Play: Top Posts */}
        {topPosts.length > 0 && (
          <section className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <h2 className="text-lg font-bold mb-4">Play-by-Play</h2>
            <div className="space-y-3">
              {topPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex gap-3 items-start p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg"
                >
                  <div className="flex-shrink-0 w-24">
                    {post.arousalScore !== null && (
                      <>
                        <div className="text-xs text-zinc-500 mb-1">
                          {(post.arousalScore * 100).toFixed(0)}%
                        </div>
                        <ArousalBar score={post.arousalScore} />
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 mb-1">
                      @{post.authorHandle}
                    </div>
                    <p className="text-sm leading-relaxed line-clamp-3">
                      {post.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <div className="mb-8 p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-500">
          SideLines measures discourse dynamics as structural proxies. These metrics track interaction patterns,
          not persuasion, radicalization, or individual beliefs. Community detection via Leiden clustering groups
          users by interaction density, not by ideology. Use with appropriate caution.
        </div>

        {/* Back link */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/sidelines"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
          >
            ← Back to SideLines
          </Link>
        </div>
      </div>
    </div>
  );
}

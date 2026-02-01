"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// =============================================================================
// TYPES
// =============================================================================

interface HistoryPoint {
  window_end: string;
  mean_arousal: number;
  post_count: number;
  spike: boolean;
}

interface CommunitySnapshot {
  id: number;
  community_id: number;
  community_name: string;
  community_description: string;
  community_member_count: number;
  window_start: string;
  window_end: string;
  post_count: number;
  mean_arousal: number;
  max_arousal: number;
  p95_arousal: number;
  baseline_arousal: number;
  spike: boolean;
  top_terms: string[];
  history: HistoryPoint[];
}

interface GlobalStats {
  posts_last_hour: number;
  tracked_users: number;
  mean_arousal: number;
}

interface PulseData {
  snapshots: CommunitySnapshot[];
  global_stats: GlobalStats;
  spikes: CommunitySnapshot[];
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function ArousalBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.round(value * 100));
  let color = "bg-emerald-500";
  if (value >= 0.5) color = "bg-red-500";
  else if (value >= 0.3) color = "bg-amber-500";

  return (
    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Sparkline({ history }: { history: HistoryPoint[] }) {
  if (!history || history.length < 2) {
    return <div className="h-8 text-xs text-zinc-400">No history</div>;
  }

  const values = history.map((h) => h.mean_arousal);
  const max = Math.max(...values, 0.1);
  const width = 120;
  const height = 32;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * height}`)
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-emerald-500"
      />
      {history.map((h, i) =>
        h.spike ? (
          <circle
            key={i}
            cx={i * step}
            cy={height - (h.mean_arousal / max) * height}
            r="2.5"
            className="fill-red-500"
          />
        ) : null
      )}
    </svg>
  );
}

function DeltaBadge({ current, baseline }: { current: number; baseline: number }) {
  if (!baseline || baseline === 0) return null;
  const delta = ((current - baseline) / baseline) * 100;
  const isUp = delta > 0;
  const abs = Math.abs(Math.round(delta));

  if (abs < 1) return null;

  return (
    <span
      className={`text-xs font-medium ${
        isUp
          ? "text-red-600 dark:text-red-400"
          : "text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {isUp ? "\u2191" : "\u2193"} {abs}%
    </span>
  );
}

function TemperatureLabel({ value }: { value: number }) {
  let label = "Cool";
  let color = "text-emerald-600 dark:text-emerald-400";
  if (value >= 0.5) {
    label = "Hot";
    color = "text-red-600 dark:text-red-400";
  } else if (value >= 0.3) {
    label = "Warm";
    color = "text-amber-600 dark:text-amber-400";
  }
  return <span className={`text-xs font-medium ${color}`}>{label}</span>;
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PulsePage() {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPulse = useCallback(async () => {
    try {
      const res = await fetch("/api/sidelines/pulse");
      const json = await res.json();
      if (json.success) {
        setData({
          snapshots: json.snapshots || [],
          global_stats: json.global_stats || {
            posts_last_hour: 0,
            tracked_users: 0,
            mean_arousal: 0,
          },
          spikes: json.spikes || [],
        });
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(json.error || "Failed to fetch pulse data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 60_000);
    return () => clearInterval(interval);
  }, [fetchPulse]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/sidelines" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-600 dark:bg-emerald-500 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">SideLines</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Analyzer</Link>
            <Link href="/clearview" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">ClearView</Link>
            <Link href="/sidelines" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">SideLines</Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <Link href="/sidelines/pulse" className="text-zinc-900 dark:text-zinc-100">Pulse</Link>
            <Link href="/sidelines/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</Link>
            <Link href="/sidelines/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Community Pulse</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Real-time arousal monitoring across political communities on Bluesky.
          </p>

          {/* Stats pills */}
          {data && (
            <div className="flex flex-wrap gap-3 items-center">
              <div className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm">
                <span className="text-zinc-500">Posts/hr</span>{" "}
                <span className="font-semibold">
                  {data.global_stats.posts_last_hour.toLocaleString()}
                </span>
              </div>
              <div className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm">
                <span className="text-zinc-500">Tracked users</span>{" "}
                <span className="font-semibold">
                  {data.global_stats.tracked_users.toLocaleString()}
                </span>
              </div>
              <div className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm">
                <span className="text-zinc-500">Temperature</span>{" "}
                <TemperatureLabel value={data.global_stats.mean_arousal} />
                <span className="ml-1 text-zinc-400 font-mono text-xs">
                  {(data.global_stats.mean_arousal * 100).toFixed(0)}
                </span>
              </div>
              {lastUpdated && (
                <div className="text-xs text-zinc-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-zinc-500">Loading pulse data...</div>
        )}

        {/* Spike Alerts */}
        {data && data.spikes.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
              Active Spikes
            </h2>
            {data.spikes.map((spike) => (
              <div
                key={spike.community_id}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-red-700 dark:text-red-300">
                      {spike.community_name}
                    </span>
                    <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                      {(spike.mean_arousal * 100).toFixed(0)} vs {(spike.baseline_arousal * 100).toFixed(0)} baseline
                    </span>
                  </div>
                  <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full font-medium">
                    SPIKE
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-red-600 dark:text-red-400">
                  <span>{spike.post_count} posts</span>
                  <DeltaBadge current={spike.mean_arousal} baseline={spike.baseline_arousal} />
                </div>
                {spike.top_terms.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {spike.top_terms.slice(0, 5).map((term) => (
                      <span
                        key={term}
                        className="px-2 py-0.5 bg-red-100 dark:bg-red-800/40 rounded text-xs text-red-700 dark:text-red-300"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Community Grid */}
        {data && data.snapshots.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
              Communities ({data.snapshots.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.snapshots.map((snapshot) => (
                <div
                  key={snapshot.community_id}
                  className={`p-5 bg-white dark:bg-zinc-900 border rounded-xl transition-colors ${
                    snapshot.spike
                      ? "border-red-300 dark:border-red-700"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {/* Community name + description */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm">{snapshot.community_name}</h3>
                      {snapshot.spike && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                          SPIKE
                        </span>
                      )}
                    </div>
                    {snapshot.community_description && (
                      <p className="text-xs text-zinc-500 line-clamp-1">
                        {snapshot.community_description}
                      </p>
                    )}
                  </div>

                  {/* Arousal bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">Arousal</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold">
                          {(snapshot.mean_arousal * 100).toFixed(0)}
                        </span>
                        <DeltaBadge
                          current={snapshot.mean_arousal}
                          baseline={snapshot.baseline_arousal}
                        />
                      </div>
                    </div>
                    <ArousalBar value={snapshot.mean_arousal} />
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 text-xs text-zinc-500 mb-3">
                    <span>{snapshot.post_count} posts (30m)</span>
                    <span>{snapshot.community_member_count?.toLocaleString()} members</span>
                  </div>

                  {/* Top terms */}
                  {snapshot.top_terms && snapshot.top_terms.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {snapshot.top_terms.slice(0, 5).map((term) => (
                        <span
                          key={term}
                          className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-400"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sparkline */}
                  <div className="text-zinc-400">
                    <Sparkline history={snapshot.history} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data && data.snapshots.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-zinc-500 mb-2">No pulse data yet.</p>
            <p className="text-sm text-zinc-400">
              Snapshots are generated every 10 minutes from live post data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

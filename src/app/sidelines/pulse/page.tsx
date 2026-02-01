"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const NetworkGraph = dynamic(() => import("./NetworkGraph"), { ssr: false });

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

interface CommunityPost {
  text: string;
  author_did: string;
  uri: string;
  arousal_score: number;
  created_at: string;
  reply_parent_uri?: string;
  reply_root_uri?: string;
  quote_uri?: string;
  post_type?: "original" | "reply";
}

interface TopicThread {
  root: CommunityPost;
  replies: CommunityPost[];
}

interface TopicGroup {
  topic_label: string;
  topic_keywords: string[];
  threads: TopicThread[];
  standalone: CommunityPost[];
  post_count: number;
  mean_arousal: number;
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

function Sparkline({
  history,
  large,
}: {
  history: HistoryPoint[];
  large?: boolean;
}) {
  if (!history || history.length < 2) {
    return <div className="h-8 text-xs text-zinc-400">No history</div>;
  }

  const values = history.map((h) => h.mean_arousal);
  const max = Math.max(...values, 0.01);
  const width = large ? 400 : 120;
  const height = large ? 64 : 32;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * height}`)
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: large ? 64 : 32 }}
    >
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
            r="3"
            className="fill-red-500"
          />
        ) : null
      )}
    </svg>
  );
}

function DeltaBadge({
  current,
  baseline,
}: {
  current: number;
  baseline: number;
}) {
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

function PostArousalDot({ score }: { score: number }) {
  let color = "bg-emerald-400";
  if (score >= 0.5) color = "bg-red-400";
  else if (score >= 0.3) color = "bg-amber-400";
  else if (score >= 0.1) color = "bg-yellow-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

// =============================================================================
// COMMUNITY CARD (expandable)
// =============================================================================

function CommunityCard({ snapshot }: { snapshot: CommunitySnapshot }) {
  const [expanded, setExpanded] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [topics, setTopics] = useState<TopicGroup[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    if (posts.length > 0 || topics.length > 0) return; // already loaded
    setLoadingPosts(true);
    try {
      const res = await fetch(
        `/api/sidelines/pulse/community?id=${snapshot.community_id}`
      );
      const json = await res.json();
      if (json.success) {
        if (json.posts) setPosts(json.posts);
        if (json.topics) setTopics(json.topics);
      }
    } catch {
      // silent
    } finally {
      setLoadingPosts(false);
    }
  }, [snapshot.community_id, posts.length, topics.length]);

  function handleClick() {
    const next = !expanded;
    setExpanded(next);
    if (next) fetchPosts();
  }

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border rounded-xl transition-colors cursor-pointer ${
        snapshot.spike
          ? "border-red-300 dark:border-red-700"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      } ${expanded ? "md:col-span-2" : ""}`}
      onClick={handleClick}
    >
      <div className="p-5">
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
            <p
              className={`text-xs text-zinc-500 ${expanded ? "" : "line-clamp-1"}`}
            >
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
                {(snapshot.mean_arousal * 100).toFixed(1)}
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
          <span>
            {snapshot.community_member_count?.toLocaleString()} members
          </span>
          {expanded && (
            <>
              <span>p95: {(snapshot.p95_arousal * 100).toFixed(1)}</span>
              <span>max: {(snapshot.max_arousal * 100).toFixed(1)}</span>
            </>
          )}
        </div>

        {/* Top terms */}
        {snapshot.top_terms && snapshot.top_terms.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {snapshot.top_terms
              .slice(0, expanded ? 10 : 5)
              .map((term) => (
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
          <Sparkline history={snapshot.history} large={expanded} />
        </div>
      </div>

      {/* Expanded: topic-grouped or flat posts */}
      {expanded && (
        <div
          className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4"
          onClick={(e) => e.stopPropagation()}
        >
          {loadingPosts && (
            <p className="text-xs text-zinc-400">Loading posts...</p>
          )}
          {!loadingPosts && posts.length === 0 && topics.length === 0 && (
            <p className="text-xs text-zinc-400">
              No scored posts in the last hour.
            </p>
          )}

          {/* Topic-grouped view */}
          {!loadingPosts && topics.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Topics (last hour)
              </h4>
              {topics.map((topic) => {
                const isTopicExpanded = expandedTopics.has(topic.topic_label);
                return (
                  <div
                    key={topic.topic_label}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                  >
                    {/* Topic header */}
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      onClick={() => {
                        setExpandedTopics((prev) => {
                          const next = new Set(prev);
                          if (next.has(topic.topic_label)) {
                            next.delete(topic.topic_label);
                          } else {
                            next.add(topic.topic_label);
                          }
                          return next;
                        });
                      }}
                    >
                      <span className="text-xs text-zinc-400">
                        {isTopicExpanded ? "\u25BC" : "\u25B6"}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded text-xs font-semibold">
                        {topic.topic_label}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {topic.post_count} posts
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {(topic.mean_arousal * 100).toFixed(1)}
                      </span>
                      {topic.topic_keywords.length > 0 && (
                        <div className="flex gap-1 ml-auto">
                          {topic.topic_keywords.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] text-zinc-500"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>

                    {/* Topic posts (expanded) */}
                    {isTopicExpanded && (
                      <div className="px-3 pb-3 space-y-2.5">
                        {/* Threads */}
                        {topic.threads.map((thread, ti) => (
                          <div key={ti} className="space-y-1">
                            {/* Root post */}
                            <div className="flex gap-2 items-start">
                              <PostArousalDot score={thread.root.arousal_score} />
                              <div
                                className={`flex-1 min-w-0 ${
                                  thread.root.quote_uri
                                    ? "border-l-2 border-blue-300 dark:border-blue-700 pl-2"
                                    : ""
                                }`}
                              >
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">
                                  {thread.root.text.length > 280
                                    ? thread.root.text.slice(0, 280) + "..."
                                    : thread.root.text}
                                </p>
                                <div className="flex gap-3 mt-0.5 text-xs text-zinc-400">
                                  <span className="font-mono">
                                    {(thread.root.arousal_score * 100).toFixed(1)}
                                  </span>
                                  <span>{timeAgo(thread.root.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            {/* Replies */}
                            {thread.replies.map((reply, ri) => (
                              <div
                                key={ri}
                                className="flex gap-2 items-start ml-4 pl-3 border-l border-zinc-200 dark:border-zinc-700"
                              >
                                <span className="text-zinc-400 text-xs mt-0.5">&crarr;</span>
                                <PostArousalDot score={reply.arousal_score} />
                                <div
                                  className={`flex-1 min-w-0 ${
                                    reply.quote_uri
                                      ? "border-l-2 border-blue-300 dark:border-blue-700 pl-2"
                                      : ""
                                  }`}
                                >
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400 break-words">
                                    {reply.text.length > 280
                                      ? reply.text.slice(0, 280) + "..."
                                      : reply.text}
                                  </p>
                                  <div className="flex gap-3 mt-0.5 text-xs text-zinc-400">
                                    <span className="font-mono">
                                      {(reply.arousal_score * 100).toFixed(1)}
                                    </span>
                                    <span>{timeAgo(reply.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* Standalone posts */}
                        {topic.standalone.map((post, si) => (
                          <div key={`s-${si}`} className="flex gap-2 items-start">
                            <PostArousalDot score={post.arousal_score} />
                            <div
                              className={`flex-1 min-w-0 ${
                                post.quote_uri
                                  ? "border-l-2 border-blue-300 dark:border-blue-700 pl-2"
                                  : ""
                              }`}
                            >
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">
                                {post.text.length > 280
                                  ? post.text.slice(0, 280) + "..."
                                  : post.text}
                              </p>
                              <div className="flex gap-3 mt-0.5 text-xs text-zinc-400">
                                <span className="font-mono">
                                  {(post.arousal_score * 100).toFixed(1)}
                                </span>
                                <span>{timeAgo(post.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Flat post list fallback (when no topics) */}
          {!loadingPosts && topics.length === 0 && posts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Highest-arousal posts (last hour)
              </h4>
              <div className="space-y-3">
                {posts.slice(0, 10).map((post, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <PostArousalDot score={post.arousal_score} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">
                        {post.text.length > 280
                          ? post.text.slice(0, 280) + "..."
                          : post.text}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-zinc-400">
                        <span className="font-mono">
                          {(post.arousal_score * 100).toFixed(1)}
                        </span>
                        <span>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
            <Link
              href="/"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Analyzer
            </Link>
            <Link
              href="/clearview"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              ClearView
            </Link>
            <Link
              href="/sidelines"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              SideLines
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <Link
              href="/sidelines/pulse"
              className="text-zinc-900 dark:text-zinc-100"
            >
              Pulse
            </Link>
            <Link
              href="/sidelines/methodology"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="/sidelines/about"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Community Pulse
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Real-time arousal monitoring across political communities on
            Bluesky.
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
                  {(data.global_stats.mean_arousal * 100).toFixed(1)}
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

        {/* Network Graph */}
        <div className="mb-8">
          <NetworkGraph />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-zinc-500">
            Loading pulse data...
          </div>
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
                      {(spike.mean_arousal * 100).toFixed(1)} vs{" "}
                      {(spike.baseline_arousal * 100).toFixed(1)} baseline
                    </span>
                  </div>
                  <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full font-medium">
                    SPIKE
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-red-600 dark:text-red-400">
                  <span>{spike.post_count} posts</span>
                  <DeltaBadge
                    current={spike.mean_arousal}
                    baseline={spike.baseline_arousal}
                  />
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
                <CommunityCard
                  key={snapshot.community_id}
                  snapshot={snapshot}
                />
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

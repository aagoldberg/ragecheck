"use client";

import { useState, useEffect } from "react";

interface DashboardStats {
  totalAnalyses: number;
  todayAnalyses: number;
  weekAnalyses: number;
  avgScore: number;
  scoreDistribution: { low: number; medium: number; high: number };
  platformBreakdown: Record<string, number>;
  topDomains: { domain: string; count: number; avgScore: number }[];
  signalAverages: {
    loadedLanguage: number;
    absolutist: number;
    threatPanic: number;
    usVsThem: number;
    engagementBait: number;
  };
  successRate: number;
  llmEnhancedRate: number;
  recentAnalyses: {
    url: string;
    sourceDomain: string;
    score: number;
    label: string;
    createdAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    country: string | null;
  }[];
}

interface VisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  weekVisitors: number;
  conversionRate: number;
  recentVisitors: {
    ipAddress: string | null;
    country: string | null;
    referrer: string | null;
    createdAt: string;
  }[];
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  stats?: DashboardStats;
  visitorStats?: VisitorStats;
  dbAvailable?: boolean;
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-medium">{value}</span>
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [key, setKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);

  const fetchStats = async (adminKey: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin?key=${encodeURIComponent(adminKey)}`);
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch stats");
        setAuthenticated(false);
        return;
      }

      if (data.stats) {
        setStats(data.stats);
        setVisitorStats(data.visitorStats || null);
        setAuthenticated(true);
        // Save key to localStorage
        localStorage.setItem("ragecheck-admin-key", adminKey);
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Try to auto-login with saved key
  useEffect(() => {
    const savedKey = localStorage.getItem("ragecheck-admin-key");
    if (savedKey) {
      setKey(savedKey);
      fetchStats(savedKey);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      fetchStats(key.trim());
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setStats(null);
    setKey("");
    localStorage.removeItem("ragecheck-admin-key");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">
              RageCheck Admin
            </h1>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Admin key"
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 mb-4"
              />
              <button
                type="submit"
                disabled={loading || !key.trim()}
                className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Access Dashboard"}
              </button>
            </form>
            {error && (
              <p className="mt-4 text-sm text-rose-600 dark:text-rose-400 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalScored = stats ? stats.scoreDistribution.low + stats.scoreDistribution.medium + stats.scoreDistribution.high : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">RageCheck</span>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-medium">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchStats(key)}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && !stats ? (
          <div className="text-center py-20 text-zinc-500">Loading...</div>
        ) : stats ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Analyses" value={stats.totalAnalyses} />
              <StatCard title="Today" value={stats.todayAnalyses} />
              <StatCard title="This Week" value={stats.weekAnalyses} />
              <StatCard title="Avg Score" value={stats.avgScore} subtitle="/100" />
            </div>

            {/* Visitor Stats */}
            {visitorStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Visitors" value={visitorStats.totalVisitors} />
                <StatCard title="Visitors Today" value={visitorStats.todayVisitors} />
                <StatCard title="Visitors This Week" value={visitorStats.weekVisitors} />
                <StatCard title="Conversion Rate" value={`${visitorStats.conversionRate}%`} subtitle="visitors → analyses" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Score Distribution */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Score Distribution
                </h3>
                <ProgressBar label="Low (0-33)" value={stats.scoreDistribution.low} max={totalScored} color="bg-emerald-500" />
                <ProgressBar label="Medium (34-66)" value={stats.scoreDistribution.medium} max={totalScored} color="bg-amber-500" />
                <ProgressBar label="High (67-100)" value={stats.scoreDistribution.high} max={totalScored} color="bg-rose-500" />
              </div>

              {/* Platform Breakdown */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Platform Breakdown
                </h3>
                {Object.entries(stats.platformBreakdown).map(([platform, count]) => (
                  <ProgressBar
                    key={platform}
                    label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    value={count}
                    max={stats.totalAnalyses}
                    color="bg-indigo-500"
                  />
                ))}
              </div>

              {/* Technical Stats */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Technical
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Success Rate</span>
                    <span className="font-medium text-emerald-600">{stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">AI Enhanced</span>
                    <span className="font-medium text-purple-600">{stats.llmEnhancedRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Signal Averages */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Average Signal Scores
                </h3>
                <ProgressBar label="Loaded Language" value={stats.signalAverages.loadedLanguage} max={100} color="bg-rose-500" />
                <ProgressBar label="Absolutist" value={stats.signalAverages.absolutist} max={100} color="bg-indigo-500" />
                <ProgressBar label="Threat/Panic" value={stats.signalAverages.threatPanic} max={100} color="bg-orange-500" />
                <ProgressBar label="Us-vs-Them" value={stats.signalAverages.usVsThem} max={100} color="bg-blue-500" />
                <ProgressBar label="Engagement Bait" value={stats.signalAverages.engagementBait} max={100} color="bg-amber-500" />
              </div>

              {/* Top Domains */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Top Analyzed Domains
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {stats.topDomains.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No data yet</p>
                  ) : (
                    stats.topDomains.map((d, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">{d.domain}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">{d.count} analyses</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            d.avgScore > 66 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" :
                            d.avgScore > 33 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          }`}>
                            {d.avgScore}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Analyses & Visitors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Analyses */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Recent Analyses
                  </h3>
                  <span className="text-xs text-zinc-400">Last {stats.recentAnalyses.length}</span>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">URL</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Score</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentAnalyses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-zinc-500 text-center">No analyses yet</td>
                        </tr>
                      ) : (
                        stats.recentAnalyses.map((a, i) => (
                          <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="py-2 px-3 max-w-[200px] truncate">
                              <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                {a.sourceDomain || a.url}
                              </a>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                a.score > 66 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" :
                                a.score > 33 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              }`}>
                                {a.score}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">
                              {a.country || "-"}
                            </td>
                            <td className="py-2 px-3 text-zinc-500 text-xs whitespace-nowrap">
                              {new Date(a.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Visitors */}
              {visitorStats && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Recent Visitors
                    </h3>
                    <span className="text-xs text-zinc-400">Last {visitorStats.recentVisitors.length}</span>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                        <tr className="border-b border-zinc-200 dark:border-zinc-700">
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP</th>
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium">Referrer</th>
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitorStats.recentVisitors.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-zinc-500 text-center">No visitors yet</td>
                          </tr>
                        ) : (
                          visitorStats.recentVisitors.map((v, i) => (
                            <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                              <td className="py-2 px-3 text-zinc-500 text-xs font-mono">
                                {v.ipAddress || "-"}
                              </td>
                              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">
                                {v.country || "-"}
                              </td>
                              <td className="py-2 px-3 text-zinc-500 text-xs max-w-[200px] truncate" title={v.referrer || undefined}>
                                {v.referrer || "-"}
                              </td>
                              <td className="py-2 px-3 text-zinc-500 text-xs whitespace-nowrap">
                                {new Date(v.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

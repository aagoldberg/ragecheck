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
  botStats: {
    totalBots: number;
    totalHumans: number;
    botRate: number;
  };
  recentAnalyses: {
    url: string;
    sourceDomain: string;
    score: number;
    label: string;
    createdAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    country: string | null;
    isBot: boolean;
  }[];
  topUsers: {
    ipAddress: string;
    country: string | null;
    analysisCount: number;
    avgScore: number;
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
    isBot: boolean;
  }[];
  timeSeries: {
    date: string;
    visitors: number;
    analyses: number;
  }[];
  realtimeSeries: {
    time: string;
    visitors: number;
    analyses: number;
  }[];
}

interface PageVisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  weekVisitors: number;
  realtimeSeries: {
    time: string;
    visitors: number;
  }[];
  timeSeries: {
    date: string;
    visitors: number;
  }[];
}

interface ViralMetrics {
  repeatUsers: number;
  repeatRate: number;
  avgVisitsPerUser: number;
  totalShares: number;
  todayShares: number;
  shareRate: number;
  kFactor: number;
  trafficVsBaseline: number;
  isSpike: boolean;
  referralSources: { source: string; count: number }[];
}

interface FeedbackStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  positiveRate: number;
  recentFeedback: {
    url: string;
    rating: string;
    comment: string | null;
    score: number;
    sourceDomain: string | null;
    createdAt: Date;
  }[];
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  stats?: DashboardStats;
  visitorStats?: VisitorStats;
  clearviewVisitorStats?: PageVisitorStats;
  viralMetrics?: ViralMetrics;
  feedbackStats?: FeedbackStats;
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

function TimeSeriesChart({ data }: { data: { date: string; visitors: number; analyses: number }[] }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => Math.max(d.visitors, d.analyses)), 1);
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  // Catmull-Rom spline interpolation for smooth curves
  const catmullRomSpline = (points: { x: number; y: number }[], tension = 0.5): string => {
    if (points.length < 2) return '';
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const visitorsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.visitors) }));
  const analysesPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.analyses) }));

  const visitorsPath = catmullRomSpline(visitorsPoints);
  const analysesPath = catmullRomSpline(analysesPoints);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Activity (Last 14 Days)
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-indigo-500 rounded" />
            <span className="text-zinc-500">Visitors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-500 rounded" />
            <span className="text-zinc-500">Analyses</span>
          </div>
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              strokeWidth="1"
            />
          ))}
          {/* Visitors line */}
          <path
            d={visitorsPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Analyses line */}
          <path
            d={analysesPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points - Visitors */}
          {data.map((d, i) => (
            <circle
              key={`v-${i}`}
              cx={getX(i)}
              cy={getY(d.visitors)}
              r="5"
              fill="#6366f1"
            />
          ))}
          {/* Data points - Analyses */}
          {data.map((d, i) => (
            <circle
              key={`a-${i}`}
              cx={getX(i)}
              cy={getY(d.analyses)}
              r="5"
              fill="#10b981"
            />
          ))}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-zinc-400">
          <span>{data[0]?.date.slice(5)}</span>
          <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
          <span>{data[data.length - 1]?.date.slice(5)}</span>
        </div>
        {/* Y-axis label */}
        <div className="absolute top-0 right-0 text-xs text-zinc-400">
          max: {maxValue}
        </div>
      </div>
    </div>
  );
}

function RealtimeChart({ data }: { data: { time: string; visitors: number; analyses: number }[] }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => Math.max(d.visitors, d.analyses)), 1);
  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  // Create area fill path
  const createAreaPath = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${padding.top + chartHeight}`;
    path += ` L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    path += ` L ${points[points.length - 1].x} ${padding.top + chartHeight}`;
    path += ' Z';
    return path;
  };

  const visitorsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.visitors) }));
  const analysesPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.analyses) }));

  // Format time labels
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Realtime Activity (Last 24 Hours - 30 min intervals)
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-indigo-500 rounded" />
            <span className="text-zinc-500">Visitors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-500 rounded" />
            <span className="text-zinc-500">Analyses</span>
          </div>
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              strokeWidth="1"
            />
          ))}
          {/* Visitors area */}
          <path
            d={createAreaPath(visitorsPoints)}
            fill="rgba(99, 102, 241, 0.15)"
          />
          {/* Analyses area */}
          <path
            d={createAreaPath(analysesPoints)}
            fill="rgba(16, 185, 129, 0.15)"
          />
          {/* Visitors line */}
          <polyline
            points={visitorsPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Analyses line */}
          <polyline
            points={analysesPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-zinc-400">
          <span>{data[0] ? formatTime(data[0].time) : ''}</span>
          <span>{data[Math.floor(data.length / 4)] ? formatTime(data[Math.floor(data.length / 4)].time) : ''}</span>
          <span>{data[Math.floor(data.length / 2)] ? formatTime(data[Math.floor(data.length / 2)].time) : ''}</span>
          <span>{data[Math.floor(data.length * 3 / 4)] ? formatTime(data[Math.floor(data.length * 3 / 4)].time) : ''}</span>
          <span>{data[data.length - 1] ? formatTime(data[data.length - 1].time) : ''}</span>
        </div>
        {/* Y-axis label */}
        <div className="absolute top-0 right-0 text-xs text-zinc-400">
          max: {maxValue}
        </div>
      </div>
    </div>
  );
}

function PageTrafficChart({ data, title }: { data: { time: string; visitors: number }[]; title: string }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.visitors), 1);
  const width = 800;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.visitors) }));

  // Create area fill path
  const createAreaPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length < 2) return '';
    let path = `M ${pts[0].x} ${padding.top + chartHeight}`;
    path += ` L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      path += ` L ${pts[i].x} ${pts[i].y}`;
    }
    path += ` L ${pts[pts.length - 1].x} ${padding.top + chartHeight}`;
    path += ' Z';
    return path;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-0.5 bg-purple-500 rounded" />
          <span className="text-zinc-500">Visitors</span>
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              strokeWidth="1"
            />
          ))}
          <path d={createAreaPath(points)} fill="rgba(168, 85, 247, 0.15)" />
          <polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex justify-between mt-2 text-xs text-zinc-400">
          <span>{data[0] ? formatTime(data[0].time) : ''}</span>
          <span>{data[Math.floor(data.length / 2)] ? formatTime(data[Math.floor(data.length / 2)].time) : ''}</span>
          <span>{data[data.length - 1] ? formatTime(data[data.length - 1].time) : ''}</span>
        </div>
        <div className="absolute top-0 right-0 text-xs text-zinc-400">max: {maxValue}</div>
      </div>
    </div>
  );
}

function PageDailyChart({ data, title }: { data: { date: string; visitors: number }[]; title: string }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.visitors), 1);
  const width = 800;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.visitors) }));

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              strokeWidth="1"
            />
          ))}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#a855f7" />
          ))}
          <polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex justify-between mt-2 text-xs text-zinc-400">
          <span>{data[0]?.date.slice(5)}</span>
          <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
          <span>{data[data.length - 1]?.date.slice(5)}</span>
        </div>
        <div className="absolute top-0 right-0 text-xs text-zinc-400">max: {maxValue}</div>
      </div>
    </div>
  );
}

type TabType = "overview" | "clearview";

interface ClearviewStats {
  lastGenerated: string | null;
  storyCount: number;
  sourceCount: number;
  stories: {
    topic: string;
    sourceCount: number;
    perspectives: number;
  }[];
}

export default function AdminDashboard() {
  const [key, setKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [clearviewStats, setClearviewStats] = useState<ClearviewStats | null>(null);
  const [clearviewLoading, setClearviewLoading] = useState(false);
  const [clearviewVisitorStats, setClearviewVisitorStats] = useState<PageVisitorStats | null>(null);
  const [viralMetrics, setViralMetrics] = useState<ViralMetrics | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);

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
        setClearviewVisitorStats(data.clearviewVisitorStats || null);
        setViralMetrics(data.viralMetrics || null);
        setFeedbackStats(data.feedbackStats || null);
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

  const fetchClearviewStats = async () => {
    setClearviewLoading(true);
    try {
      const response = await fetch("/api/clearview");
      const data = await response.json();

      if (data.stories) {
        const stories = data.stories.map((s: { topic: string; sources: unknown[]; perspectives: unknown[] }) => ({
          topic: s.topic,
          sourceCount: s.sources?.length || 0,
          perspectives: s.perspectives?.length || 0,
        }));

        const totalSources = stories.reduce((sum: number, s: { sourceCount: number }) => sum + s.sourceCount, 0);

        setClearviewStats({
          lastGenerated: data.generatedAt || null,
          storyCount: stories.length,
          sourceCount: totalSources,
          stories,
        });
      }
    } catch (err) {
      console.error("Failed to fetch clearview stats:", err);
    } finally {
      setClearviewLoading(false);
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

  // Fetch clearview stats when tab changes
  useEffect(() => {
    if (authenticated && activeTab === "clearview" && !clearviewStats) {
      fetchClearviewStats();
    }
  }, [authenticated, activeTab, clearviewStats]);

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
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("clearview")}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "clearview"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Clearview
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && !stats ? (
          <div className="text-center py-20 text-zinc-500">Loading...</div>
        ) : stats ? (
          <>
            {/* Clearview Tab */}
            {activeTab === "clearview" && (
              <div>
                {clearviewLoading ? (
                  <div className="text-center py-20 text-zinc-500">Loading Clearview data...</div>
                ) : clearviewStats ? (
                  <>
                    {/* Clearview Traffic Stats */}
                    {clearviewVisitorStats && (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                          <StatCard title="Total Visitors" value={clearviewVisitorStats.totalVisitors} />
                          <StatCard title="Today" value={clearviewVisitorStats.todayVisitors} />
                          <StatCard title="This Week" value={clearviewVisitorStats.weekVisitors} />
                        </div>
                        {clearviewVisitorStats.realtimeSeries.length > 0 && (
                          <PageTrafficChart
                            data={clearviewVisitorStats.realtimeSeries}
                            title="Clearview Traffic (Last 24 Hours - 30 min intervals)"
                          />
                        )}
                        {clearviewVisitorStats.timeSeries.length > 0 && (
                          <PageDailyChart
                            data={clearviewVisitorStats.timeSeries}
                            title="Clearview Daily Visitors (Last 14 Days)"
                          />
                        )}
                      </>
                    )}

                    {/* Clearview Content Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <StatCard title="Stories Today" value={clearviewStats.storyCount} />
                      <StatCard title="Total Sources" value={clearviewStats.sourceCount} />
                      <StatCard
                        title="Last Generated"
                        value={clearviewStats.lastGenerated
                          ? new Date(clearviewStats.lastGenerated).toLocaleTimeString()
                          : "Never"}
                        subtitle={clearviewStats.lastGenerated
                          ? new Date(clearviewStats.lastGenerated).toLocaleDateString()
                          : undefined}
                      />
                      <StatCard
                        title="Avg Sources/Story"
                        value={clearviewStats.storyCount > 0
                          ? Math.round(clearviewStats.sourceCount / clearviewStats.storyCount)
                          : 0}
                      />
                    </div>

                    {/* Stories Table */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Current Stories
                        </h3>
                        <button
                          onClick={fetchClearviewStats}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Refresh
                        </button>
                      </div>
                      <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-50 dark:bg-zinc-800">
                            <tr className="border-b border-zinc-200 dark:border-zinc-700">
                              <th className="text-left py-3 px-4 text-zinc-500 font-medium">Topic</th>
                              <th className="text-left py-3 px-4 text-zinc-500 font-medium">Sources</th>
                              <th className="text-left py-3 px-4 text-zinc-500 font-medium">Perspectives</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clearviewStats.stories.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="py-8 text-zinc-500 text-center">No stories generated yet</td>
                              </tr>
                            ) : (
                              clearviewStats.stories.map((story, i) => (
                                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                  <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">
                                    {story.topic}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                      {story.sourceCount} sources
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                      {story.perspectives} perspectives
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                        Actions
                      </h3>
                      <div className="flex gap-4">
                        <a
                          href="/clearview"
                          target="_blank"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          View Clearview Page
                        </a>
                        <a
                          href="/api/clearview/refresh"
                          target="_blank"
                          className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                        >
                          Trigger Refresh
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-zinc-500">
                    <p className="mb-4">No Clearview data available</p>
                    <button
                      onClick={fetchClearviewStats}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Load Data
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
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

            {/* Realtime Chart (10-min intervals) */}
            {visitorStats && visitorStats.realtimeSeries && visitorStats.realtimeSeries.length > 0 && (
              <RealtimeChart data={visitorStats.realtimeSeries} />
            )}

            {/* Time Series Chart (daily) */}
            {visitorStats && visitorStats.timeSeries.length > 0 && (
              <TimeSeriesChart data={visitorStats.timeSeries} />
            )}

            {/* Viral Metrics Section */}
            {viralMetrics && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  Viral & Retention Metrics
                  {viralMetrics.isSpike && (
                    <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-full animate-pulse">
                      TRAFFIC SPIKE
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  <StatCard
                    title="Repeat Users"
                    value={viralMetrics.repeatUsers}
                    subtitle={`${viralMetrics.repeatRate}% of visitors`}
                  />
                  <StatCard
                    title="Avg Days/User"
                    value={viralMetrics.avgVisitsPerUser}
                    subtitle="visits per user"
                  />
                  <StatCard
                    title="Total Shares"
                    value={viralMetrics.totalShares}
                    subtitle={`${viralMetrics.todayShares} today`}
                  />
                  <StatCard
                    title="Share Rate"
                    value={`${viralMetrics.shareRate}%`}
                    subtitle="shares/analyses"
                  />
                  <StatCard
                    title="K-Factor"
                    value={viralMetrics.kFactor}
                    subtitle={viralMetrics.kFactor >= 1 ? "🚀 Viral!" : viralMetrics.kFactor >= 0.5 ? "Good" : "Building"}
                  />
                  <StatCard
                    title="Traffic vs Avg"
                    value={`${viralMetrics.trafficVsBaseline}x`}
                    subtitle={viralMetrics.isSpike ? "Spike detected!" : "vs 7-day avg"}
                  />
                </div>

                {/* Referral Sources */}
                {viralMetrics.referralSources.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                      Traffic Sources (Last 7 Days)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {viralMetrics.referralSources.map((source) => (
                        <div key={source.source} className="text-center">
                          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            {source.count}
                          </div>
                          <div className="text-xs text-zinc-500">{source.source}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feedback & Error Reports Section */}
            {feedbackStats && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  Feedback & Error Reports
                  {feedbackStats.recentFeedback.filter(f => f.comment?.includes("[SITE ERROR]")).length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                      {feedbackStats.recentFeedback.filter(f => f.comment?.includes("[SITE ERROR]")).length} site errors
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    title="Total Feedback"
                    value={feedbackStats.totalFeedback}
                  />
                  <StatCard
                    title="Positive"
                    value={feedbackStats.positiveCount}
                    subtitle={`${feedbackStats.positiveRate}% satisfaction`}
                  />
                  <StatCard
                    title="Negative"
                    value={feedbackStats.negativeCount}
                  />
                  <StatCard
                    title="Site Errors"
                    value={feedbackStats.recentFeedback.filter(f => f.comment?.includes("[SITE ERROR]")).length}
                    subtitle="reported by users"
                  />
                </div>

                {/* Site Errors Table */}
                {feedbackStats.recentFeedback.filter(f => f.comment?.includes("[SITE ERROR]")).length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Sites Users Want Supported
                    </h3>
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-amber-50 dark:bg-amber-900/20">
                          <tr className="border-b border-amber-200 dark:border-amber-800">
                            <th className="text-left py-3 px-3 text-amber-700 dark:text-amber-300 font-medium">URL</th>
                            <th className="text-left py-3 px-3 text-amber-700 dark:text-amber-300 font-medium">Error</th>
                            <th className="text-left py-3 px-3 text-amber-700 dark:text-amber-300 font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feedbackStats.recentFeedback
                            .filter(f => f.comment?.includes("[SITE ERROR]"))
                            .map((f, i) => (
                              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                                <td className="py-2 px-3 max-w-[300px]">
                                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate block">
                                    {f.url}
                                  </a>
                                </td>
                                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs font-mono">
                                  {f.comment?.replace("[SITE ERROR] ", "")}
                                </td>
                                <td className="py-2 px-3 text-zinc-500 text-xs whitespace-nowrap">
                                  {new Date(f.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* User Feedback Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                    Recent User Feedback
                  </h3>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                        <tr className="border-b border-zinc-200 dark:border-zinc-700">
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium w-16">Rating</th>
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium">Site</th>
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium w-16">Score</th>
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium">What they said</th>
                          <th className="text-left py-3 px-3 text-zinc-500 font-medium w-32">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedbackStats.recentFeedback.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-zinc-500 text-center">No feedback yet</td>
                          </tr>
                        ) : (
                          feedbackStats.recentFeedback
                            .filter(f => !f.comment?.includes("[SITE ERROR]"))
                            .map((f, i) => (
                              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                <td className="py-3 px-3">
                                  <span className={`text-xl ${f.rating === "up" ? "text-green-500" : "text-rose-500"}`}>
                                    {f.rating === "up" ? "👍" : "👎"}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm font-medium">
                                    {f.sourceDomain || (() => { try { return new URL(f.url).hostname; } catch { return f.url; } })()}
                                  </a>
                                </td>
                                <td className="py-3 px-3">
                                  {f.score >= 0 && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                      f.score > 66 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" :
                                      f.score > 33 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    }`}>
                                      {f.score}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 text-sm">
                                  {f.comment ? (
                                    <span className="block max-w-md">{f.comment}</span>
                                  ) : (
                                    <span className="text-zinc-400 italic">No comment provided</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-zinc-500 text-xs whitespace-nowrap">
                                  {new Date(f.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-zinc-600 dark:text-zinc-400">Humans</span>
                      <span className="font-medium text-emerald-600">{stats.botStats.totalHumans}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-zinc-600 dark:text-zinc-400">Bots</span>
                      <span className="font-medium text-orange-600">{stats.botStats.totalBots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Bot Rate</span>
                      <span className="font-medium text-orange-600">{stats.botStats.botRate}%</span>
                    </div>
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

            {/* Top Users */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                Top Users by Analyses
              </h3>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP Address</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Analyses</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-zinc-500 text-center">No data yet</td>
                      </tr>
                    ) : (
                      stats.topUsers.map((u, i) => (
                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="py-2 px-3 text-zinc-500 text-xs font-mono">{u.ipAddress}</td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">{u.country || "-"}</td>
                          <td className="py-2 px-3 text-zinc-900 dark:text-zinc-100 font-medium">{u.analysisCount}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              u.avgScore > 66 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" :
                              u.avgScore > 33 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            }`}>
                              {u.avgScore}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentAnalyses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-zinc-500 text-center">No analyses yet</td>
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
                            <td className="py-2 px-3 text-zinc-500 text-xs font-mono">
                              {a.ipAddress || "-"}
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
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

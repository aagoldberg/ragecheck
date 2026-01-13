"use client";

import { useState, useEffect, useRef } from "react";

// Helper to format dates in EST timezone
const formatDateTimeEST = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  return d.toLocaleString('en-US', { timeZone: 'America/New_York' });
};

const formatTimeOnlyEST = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  return d.toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
};

const formatDateOnlyEST = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
};

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
    platform: string;
    score: number;
    label: string;
    llmEnhanced: boolean;
    signals: {
      loadedLanguage: number;
      absolutist: number;
      threatPanic: number;
      usVsThem: number;
      engagementBait: number;
    };
    success: boolean;
    error: string | null;
    title: string | null;
    createdAt: string;
    ipAddress: string | null;
    country: string | null;
    isBot: boolean;
    device: "mobile" | "tablet" | "desktop";
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
    pagePath: string;
    device: "mobile" | "tablet" | "desktop";
    os: "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "Other";
    browser: "Chrome" | "Safari" | "Firefox" | "Edge" | "Other";
    createdAt: string;
    hasLlmAnalysis: boolean;
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
  uniqueSharers: number;
  todayShares: number;
  todayUniqueSharers: number;
  shareRate: number;
  kFactor: number;
  trafficVsBaseline: number;
  isSpike: boolean;
  referralSources: { source: string; count: number }[];
  trends: {
    visitors: number[];
    shares: number[];
    repeatVisitors: number[];
    repeatRate: number[];
    analyses: number[];
    kFactor: number[];
    trafficRatio: number[];
  };
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

type StatGroup = { avgSeconds: number; medianSeconds: number; count: number };

interface TimeToAnalysisMetrics {
  overall: StatGroup;
  byDevice: {
    mobile: StatGroup;
    tablet: StatGroup;
    desktop: StatGroup;
  };
  byOS: {
    iOS: StatGroup;
    Android: StatGroup;
    Windows: StatGroup;
    macOS: StatGroup;
    Linux: StatGroup;
    Other: StatGroup;
  };
}

type ConversionGroup = { visitors: number; converted: number; rate: number };

interface ConversionMetrics {
  overall: ConversionGroup;
  byDevice: {
    mobile: ConversionGroup;
    tablet: ConversionGroup;
    desktop: ConversionGroup;
  };
  byOS: {
    iOS: ConversionGroup;
    Android: ConversionGroup;
    Windows: ConversionGroup;
    macOS: ConversionGroup;
    Linux: ConversionGroup;
    Other: ConversionGroup;
  };
}

type InsightRow = { name: string; visitors: number; converted: number; rate: number };

interface ConversionInsights {
  byReferrerType: InsightRow[];
  byLandingPage: InsightRow[];
  byCountry: InsightRow[];
  byHourOfDay: InsightRow[];
  byDayOfWeek: InsightRow[];
  summary: {
    totalVisitors: number;
    totalConverted: number;
    overallRate: number;
    bestPerforming: { factor: string; name: string; rate: number } | null;
    worstPerforming: { factor: string; name: string; rate: number } | null;
  };
}

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
}

interface FunnelMetrics {
  steps: FunnelStep[];
  period: string;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  stats?: DashboardStats;
  visitorStats?: VisitorStats;
  clearviewVisitorStats?: PageVisitorStats;
  viralMetrics?: ViralMetrics;
  feedbackStats?: FeedbackStats;
  timeToAnalysis?: TimeToAnalysisMetrics;
  conversionMetrics?: ConversionMetrics;
  conversionInsights?: ConversionInsights;
  funnelMetrics?: FunnelMetrics;
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

function Sparkline({ data, color = "#6366f1", height = 32, width = 80 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  // Create area path
  const areaPath = `M 0,${height} L ${points.split(' ').map((p, i) => i === 0 ? p : p).join(' L ')} L ${width},${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={areaPath} fill={color} fillOpacity="0.15" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function StatCardWithSparkline({
  title,
  value,
  subtitle,
  sparklineData,
  sparklineColor = "#6366f1"
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  sparklineData?: number[];
  sparklineColor?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate trend direction (compare last 2 days to first 2 days for stability)
  const trend = sparklineData && sparklineData.length >= 4
    ? (sparklineData[sparklineData.length - 1] + sparklineData[sparklineData.length - 2]) / 2 -
      (sparklineData[0] + sparklineData[1]) / 2
    : sparklineData && sparklineData.length >= 2
    ? sparklineData[sparklineData.length - 1] - sparklineData[0]
    : 0;

  const hasSparkline = sparklineData && sparklineData.length >= 2 && sparklineData.some(v => v > 0);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 relative group">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
        {title}
      </h3>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">{value}</p>
          {subtitle && <p className="text-xs text-zinc-500 mt-1 truncate">{subtitle}</p>}
        </div>
        {hasSparkline && (
          <div
            className="relative flex-shrink-0 pb-1"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative">
              {/* Interactive hover zones */}
              <div className="absolute inset-0 flex z-10">
                {sparklineData.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                  />
                ))}
              </div>
              <Sparkline data={sparklineData} color={sparklineColor} width={70} height={28} />
            </div>
            {/* Tooltip */}
            {hoveredIndex !== null && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                {sparklineData[hoveredIndex]}
              </div>
            )}
            {/* Trend indicator */}
            <div className={`absolute -top-2 -right-2 text-[10px] font-bold ${trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : 'text-zinc-400'}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FunnelChart({ steps, period }: { steps: FunnelStep[]; period: string }) {
  if (!steps || steps.length === 0) return null;

  const maxCount = steps[0]?.count || 1;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Conversion Funnel
        </h3>
        <span className="text-xs text-zinc-400">{period}</span>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => {
          const widthPercent = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const isFirst = i === 0;
          const prevStep = steps[i - 1];

          return (
            <div key={step.name}>
              {/* Step label and stats */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{step.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{step.count.toLocaleString()}</span>
                  <span className={`font-medium ${isFirst ? 'text-zinc-400' : step.percentage >= 50 ? 'text-emerald-600' : step.percentage >= 20 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {step.percentage}%
                  </span>
                </div>
              </div>

              {/* Funnel bar */}
              <div className="relative">
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg transition-all duration-500"
                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  />
                </div>

                {/* Drop-off indicator between steps */}
                {!isFirst && prevStep && step.dropoff > 0 && (
                  <div className="absolute -top-5 right-0 text-xs text-rose-500 font-medium">
                    -{step.dropoff}% drop
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {steps.length >= 2 && (
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Overall Conversion</span>
            <span className={`font-bold ${steps[steps.length - 1].percentage >= 10 ? 'text-emerald-600' : steps[steps.length - 1].percentage >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>
              {steps[0].count} → {steps[steps.length - 1].count} ({steps[steps.length - 1].percentage}%)
            </span>
          </div>
        </div>
      )}
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
        {/* X-axis labels - show 5 points */}
        <div className="flex justify-between mt-2 text-xs text-zinc-400">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const idx = Math.floor(ratio * (data.length - 1));
            return <span key={i}>{data[idx]?.date.slice(5)}</span>;
          })}
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to the right (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [data]);

  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => Math.max(d.visitors, d.analyses)), 1);
  // 3x width (2400) to maintain same density as before when showing 3 days instead of 1
  const width = 2400;
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

  // Format time labels in EST
  const formatTimeEST = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'America/New_York' });
  };

  // Generate label positions every 6 hours (12 buckets per 6 hours at 30-min intervals)
  // 3 days = 72 hours = 12 six-hour blocks = 13 labels (including start and end)
  const labelIndices: number[] = [];
  for (let i = 0; i <= 12; i++) {
    labelIndices.push(Math.min(Math.floor(i * 12), data.length - 1)); // 12 buckets = 6 hours
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Realtime Activity (Last 3 Days - 30 min intervals, EST)
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
        {/* Y-axis label - outside scroll area */}
        <div className="absolute top-0 right-0 text-xs text-zinc-400 z-10 bg-white dark:bg-zinc-900 px-1">
          max: {maxValue}
        </div>
        {/* Scrollable chart container */}
        <div ref={scrollRef} className="overflow-x-auto">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="h-40" style={{ minWidth: width }}>
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
          {/* X-axis labels - inside scroll area */}
          <div className="flex justify-between mt-2 text-xs text-zinc-400" style={{ minWidth: width }}>
            {labelIndices.map((idx, i) => (
              <span key={i}>{data[idx] ? formatTimeEST(data[idx].time) : ''}</span>
            ))}
          </div>
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
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });
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

type TabType = "overview" | "users" | "conversions" | "feedback" | "content" | "clearview";

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
  const [timeToAnalysis, setTimeToAnalysis] = useState<TimeToAnalysisMetrics | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [conversionInsights, setConversionInsights] = useState<ConversionInsights | null>(null);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);

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
        setTimeToAnalysis(data.timeToAnalysis || null);
        setConversionMetrics(data.conversionMetrics || null);
        setConversionInsights(data.conversionInsights || null);
        setFunnelMetrics(data.funnelMetrics || null);
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
            {(["overview", "users", "conversions", "feedback", "content", "clearview"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
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
                          ? formatTimeOnlyEST(clearviewStats.lastGenerated)
                          : "Never"}
                        subtitle={clearviewStats.lastGenerated
                          ? formatDateOnlyEST(clearviewStats.lastGenerated) + " EST"
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
                  <span className="text-xs text-zinc-400 font-normal ml-2">(hover for daily values)</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <StatCardWithSparkline
                    title="Repeat Users"
                    value={`${viralMetrics.repeatRate}%`}
                    subtitle={`${viralMetrics.repeatUsers} users`}
                    sparklineData={viralMetrics.trends?.repeatRate}
                    sparklineColor="#10b981"
                  />
                  <StatCardWithSparkline
                    title="Visitors"
                    value={viralMetrics.trends?.visitors?.reduce((a, b) => a + b, 0) || 0}
                    subtitle="7-day total"
                    sparklineData={viralMetrics.trends?.visitors}
                    sparklineColor="#6366f1"
                  />
                  <StatCardWithSparkline
                    title="Shares"
                    value={viralMetrics.uniqueSharers}
                    subtitle={`${viralMetrics.todayUniqueSharers} today`}
                    sparklineData={viralMetrics.trends?.shares}
                    sparklineColor="#f59e0b"
                  />
                  <StatCardWithSparkline
                    title="Analyses"
                    value={viralMetrics.trends?.analyses?.reduce((a, b) => a + b, 0) || 0}
                    subtitle="7-day total"
                    sparklineData={viralMetrics.trends?.analyses}
                    sparklineColor="#8b5cf6"
                  />
                  <StatCardWithSparkline
                    title="K-Factor"
                    value={viralMetrics.kFactor}
                    subtitle={viralMetrics.kFactor >= 1 ? "Viral!" : viralMetrics.kFactor >= 0.5 ? "Good" : "Building"}
                    sparklineData={viralMetrics.trends?.kFactor}
                    sparklineColor="#ec4899"
                  />
                  <StatCardWithSparkline
                    title="Traffic vs Avg"
                    value={`${viralMetrics.trafficVsBaseline}x`}
                    subtitle={viralMetrics.isSpike ? "Spike!" : "vs 7-day avg"}
                    sparklineData={viralMetrics.trends?.trafficRatio}
                    sparklineColor="#14b8a6"
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
            </>
            )}

            {/* Conversions Tab */}
            {activeTab === "conversions" && (
            <>
            {/* Funnel Chart */}
            {funnelMetrics && funnelMetrics.steps.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Conversion Funnel
                </h2>
                <FunnelChart steps={funnelMetrics.steps} period={funnelMetrics.period} />
              </div>
            )}

            {/* Time to Analysis Card */}
            {timeToAnalysis && timeToAnalysis.overall.count > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Time to Analysis
                </h2>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                  {/* By Device */}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">By Device</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    {/* Overall */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                        {timeToAnalysis.overall.avgSeconds < 60
                          ? `${timeToAnalysis.overall.avgSeconds}s`
                          : `${Math.round(timeToAnalysis.overall.avgSeconds / 60)}m`}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">Overall Avg</div>
                      <div className="text-xs text-zinc-400">{timeToAnalysis.overall.count} samples</div>
                    </div>
                    {/* Mobile */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {timeToAnalysis.byDevice.mobile.count > 0
                          ? timeToAnalysis.byDevice.mobile.avgSeconds < 60
                            ? `${timeToAnalysis.byDevice.mobile.avgSeconds}s`
                            : `${Math.round(timeToAnalysis.byDevice.mobile.avgSeconds / 60)}m`
                          : "-"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">📱 Mobile</div>
                      <div className="text-xs text-zinc-400">{timeToAnalysis.byDevice.mobile.count} samples</div>
                    </div>
                    {/* Tablet */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {timeToAnalysis.byDevice.tablet.count > 0
                          ? timeToAnalysis.byDevice.tablet.avgSeconds < 60
                            ? `${timeToAnalysis.byDevice.tablet.avgSeconds}s`
                            : `${Math.round(timeToAnalysis.byDevice.tablet.avgSeconds / 60)}m`
                          : "-"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">📱 Tablet</div>
                      <div className="text-xs text-zinc-400">{timeToAnalysis.byDevice.tablet.count} samples</div>
                    </div>
                    {/* Desktop */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {timeToAnalysis.byDevice.desktop.count > 0
                          ? timeToAnalysis.byDevice.desktop.avgSeconds < 60
                            ? `${timeToAnalysis.byDevice.desktop.avgSeconds}s`
                            : `${Math.round(timeToAnalysis.byDevice.desktop.avgSeconds / 60)}m`
                          : "-"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">💻 Desktop</div>
                      <div className="text-xs text-zinc-400">{timeToAnalysis.byDevice.desktop.count} samples</div>
                    </div>
                  </div>
                  {/* By OS */}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">By OS</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {(["iOS", "Android", "Windows", "macOS", "Linux", "Other"] as const).map((os) => (
                      <div key={os} className="text-center">
                        <div className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
                          {timeToAnalysis.byOS[os].count > 0
                            ? timeToAnalysis.byOS[os].avgSeconds < 60
                              ? `${timeToAnalysis.byOS[os].avgSeconds}s`
                              : `${Math.round(timeToAnalysis.byOS[os].avgSeconds / 60)}m`
                            : "-"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">{os}</div>
                        <div className="text-xs text-zinc-400">{timeToAnalysis.byOS[os].count}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center text-xs text-zinc-400">
                    Time from first visit to first analysis (last 7 days, within 1 hour)
                  </div>
                </div>
              </div>
            )}

            {/* Conversion Rate Card */}
            {conversionMetrics && conversionMetrics.overall.visitors > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Conversion Rate
                </h2>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                  {/* By Device */}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">By Device</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    {/* Overall */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                        {conversionMetrics.overall.rate}%
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">Overall</div>
                      <div className="text-xs text-zinc-400">{conversionMetrics.overall.converted}/{conversionMetrics.overall.visitors}</div>
                    </div>
                    {/* Mobile */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {conversionMetrics.byDevice.mobile.visitors > 0 ? `${conversionMetrics.byDevice.mobile.rate}%` : "-"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">📱 Mobile</div>
                      <div className="text-xs text-zinc-400">{conversionMetrics.byDevice.mobile.converted}/{conversionMetrics.byDevice.mobile.visitors}</div>
                    </div>
                    {/* Tablet */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {conversionMetrics.byDevice.tablet.visitors > 0 ? `${conversionMetrics.byDevice.tablet.rate}%` : "-"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">📱 Tablet</div>
                      <div className="text-xs text-zinc-400">{conversionMetrics.byDevice.tablet.converted}/{conversionMetrics.byDevice.tablet.visitors}</div>
                    </div>
                    {/* Desktop */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {conversionMetrics.byDevice.desktop.visitors > 0 ? `${conversionMetrics.byDevice.desktop.rate}%` : "-"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">💻 Desktop</div>
                      <div className="text-xs text-zinc-400">{conversionMetrics.byDevice.desktop.converted}/{conversionMetrics.byDevice.desktop.visitors}</div>
                    </div>
                  </div>
                  {/* By OS */}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">By OS</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {(["iOS", "Android", "Windows", "macOS", "Linux", "Other"] as const).map((os) => (
                      <div key={os} className="text-center">
                        <div className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
                          {conversionMetrics.byOS[os].visitors > 0 ? `${conversionMetrics.byOS[os].rate}%` : "-"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">{os}</div>
                        <div className="text-xs text-zinc-400">{conversionMetrics.byOS[os].converted}/{conversionMetrics.byOS[os].visitors}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center text-xs text-zinc-400">
                    Visitors who performed at least one analysis (last 7 days)
                  </div>
                </div>
              </div>
            )}

            {/* Conversion Insights Card */}
            {conversionInsights && conversionInsights.summary.totalVisitors > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Conversion Insights
                </h2>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {conversionInsights.summary.overallRate}%
                      </div>
                      <div className="text-xs text-zinc-500">Overall Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                        {conversionInsights.summary.totalVisitors}
                      </div>
                      <div className="text-xs text-zinc-500">Total Visitors</div>
                    </div>
                    {conversionInsights.summary.bestPerforming && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {conversionInsights.summary.bestPerforming.rate}%
                        </div>
                        <div className="text-xs text-zinc-500">Best: {conversionInsights.summary.bestPerforming.name}</div>
                      </div>
                    )}
                    {conversionInsights.summary.worstPerforming && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                          {conversionInsights.summary.worstPerforming.rate}%
                        </div>
                        <div className="text-xs text-zinc-500">Worst: {conversionInsights.summary.worstPerforming.name}</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* By Referrer Type */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Referrer</h3>
                      <div className="space-y-2">
                        {conversionInsights.byReferrerType.slice(0, 5).map((row) => (
                          <div key={row.name} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">{row.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-xs">{row.converted}/{row.visitors}</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 w-12 text-right">{row.rate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Landing Page */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Page</h3>
                      <div className="space-y-2">
                        {conversionInsights.byLandingPage.slice(0, 5).map((row) => (
                          <div key={row.name} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">{row.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-xs">{row.converted}/{row.visitors}</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 w-12 text-right">{row.rate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Country */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Country</h3>
                      <div className="space-y-2">
                        {conversionInsights.byCountry.slice(0, 5).map((row) => (
                          <div key={row.name} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">{row.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-xs">{row.converted}/{row.visitors}</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 w-12 text-right">{row.rate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Hour of Day */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Hour (EST)</h3>
                      <div className="space-y-2">
                        {conversionInsights.byHourOfDay.slice(0, 5).map((row) => (
                          <div key={row.name} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">{row.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-xs">{row.converted}/{row.visitors}</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 w-12 text-right">{row.rate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Day of Week */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Day</h3>
                      <div className="space-y-2">
                        {conversionInsights.byDayOfWeek.map((row) => (
                          <div key={row.name} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">{row.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-xs">{row.converted}/{row.visitors}</span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 w-12 text-right">{row.rate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center text-xs text-zinc-400">
                    Conversion insights based on last 7 days of visitor data
                  </div>
                </div>
              </div>
            )}
            </>
            )}

            {/* Feedback Tab */}
            {activeTab === "feedback" && (
            <>
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
                                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs font-mono" title={f.comment?.replace("[SITE ERROR] ", "")}>
                                  {(() => {
                                    const msg = f.comment?.replace("[SITE ERROR] ", "") || "";
                                    return msg.length > 100 ? msg.slice(0, 100) + "..." : msg;
                                  })()}
                                </td>
                                <td className="py-2 px-3 text-zinc-500 text-xs whitespace-nowrap">
                                  {formatDateTimeEST(f.createdAt)}
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
                                    <span className="block max-w-md" title={f.comment}>
                                      {f.comment.length > 150 ? f.comment.slice(0, 150) + "..." : f.comment}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 italic">No comment provided</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-zinc-500 text-xs whitespace-nowrap">
                                  {formatDateTimeEST(f.createdAt)}
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
            </>
            )}

            {/* Content Tab */}
            {activeTab === "content" && (
            <>
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

            {/* Recent Analyses */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Recent Analyses
                </h3>
                <span className="text-xs text-zinc-400">Last {stats.recentAnalyses.length}</span>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Time</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">URL</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Platform</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Score</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">AI</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Device</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAnalyses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-4 text-zinc-500 text-center">No analyses yet</td>
                      </tr>
                    ) : (
                      stats.recentAnalyses.map((a, i) => (
                        <tr key={i} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${!a.success ? 'opacity-50' : ''}`}>
                          <td className="py-2 px-3 text-zinc-500 text-xs whitespace-nowrap">
                            {formatDateTimeEST(a.createdAt)}
                          </td>
                          <td className="py-2 px-3 max-w-[200px] truncate" title={a.title || a.url}>
                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                              {a.title || a.sourceDomain || a.url}
                            </a>
                          </td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs capitalize">
                            {a.platform}
                          </td>
                          <td className="py-2 px-3">
                            {a.success ? (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                a.score > 66 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" :
                                a.score > 33 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              }`}>
                                {a.score}
                              </span>
                            ) : (
                              <span className="text-xs text-rose-500" title={a.error || undefined}>err</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-zinc-500 text-xs">
                            {a.llmEnhanced ? "✓" : "-"}
                          </td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs capitalize">
                            {a.device}
                          </td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">
                            {a.country || "-"}
                          </td>
                          <td className="py-2 px-3 text-zinc-500 text-xs font-mono">
                            {a.ipAddress || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
            <>
            {/* Recent Visitors */}
            {visitorStats && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Recent Visitors
                  </h3>
                  <span className="text-xs text-zinc-400">Last {visitorStats.recentVisitors.length}</span>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Time</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Page</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Device</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">OS</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Browser</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Referrer</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">AI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorStats.recentVisitors.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-4 text-zinc-500 text-center">No visitors yet</td>
                        </tr>
                      ) : (
                        visitorStats.recentVisitors.map((v, i) => (
                          <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="py-2 px-3 text-zinc-500 text-xs whitespace-nowrap">
                              {formatDateTimeEST(v.createdAt)}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">
                              {v.pagePath}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs capitalize">
                              {v.device}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">
                              {v.os}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">
                              {v.browser}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">
                              {v.country || "-"}
                            </td>
                            <td className="py-2 px-3 text-zinc-500 text-xs max-w-[200px] truncate" title={v.referrer || undefined}>
                              {v.referrer || "-"}
                            </td>
                            <td className="py-2 px-3 text-zinc-500 text-xs font-mono">
                              {v.ipAddress || "-"}
                            </td>
                            <td className="py-2 px-3 text-zinc-500 text-xs">
                              {v.hasLlmAnalysis ? "✓" : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Users */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
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
            </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

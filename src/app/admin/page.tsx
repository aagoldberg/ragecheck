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

// Format share type into a readable short label
const formatShareType = (shareType: string): string => {
  const typeMap: Record<string, string> = {
    'share_image_success': 'Image',
    'copy_link': 'Link',
    'Copy Link': 'Link',
    'Share X': 'X',
    'Share Bluesky': 'Bsky',
    'Download Image': 'Download',
    'Copy Image': 'Copy Img',
    'Web Share': 'Web',
    'native': 'Native',
  };
  return typeMap[shareType] || shareType.replace(/_/g, ' ').replace(/success$/i, '').trim();
};

// Share type descriptions for the Shares tab
const SHARE_TYPE_INFO: Record<string, { label: string; description: string }> = {
  'share_image_success': {
    label: 'Share Image',
    description: 'User copied the share card image to clipboard to paste elsewhere',
  },
  'copy_link': {
    label: 'Copy Link',
    description: 'User copied the shareable URL to their clipboard',
  },
  'Copy Link': {
    label: 'Copy Link',
    description: 'User copied the shareable URL to their clipboard',
  },
  'Share X': {
    label: 'Share to X',
    description: 'User clicked to share on X/Twitter (opens X intent)',
  },
  'Share Bluesky': {
    label: 'Share to Bluesky',
    description: 'User clicked to share on Bluesky (opens Bluesky intent)',
  },
  'Download Image': {
    label: 'Download Image',
    description: 'User downloaded the share card image as a file',
  },
  'Copy Image': {
    label: 'Copy Image',
    description: 'User copied the share card image to clipboard',
  },
  'Web Share': {
    label: 'Web Share',
    description: 'User used the native browser share menu (mobile)',
  },
  'native': {
    label: 'Native Share',
    description: 'User used the native OS share dialog',
  },
  'Share Facebook': {
    label: 'Share to Facebook',
    description: 'User clicked to share on Facebook (opens Facebook sharer)',
  },
  'Share LinkedIn': {
    label: 'Share to LinkedIn',
    description: 'User clicked to share on LinkedIn (opens LinkedIn share)',
  },
  'ClearView X': {
    label: 'ClearView → X',
    description: 'User shared a ClearView story or briefing to X/Twitter',
  },
  'ClearView Bluesky': {
    label: 'ClearView → Bluesky',
    description: 'User shared a ClearView story or briefing to Bluesky',
  },
  'ClearView Facebook': {
    label: 'ClearView → Facebook',
    description: 'User shared a ClearView story or briefing to Facebook',
  },
  'ClearView LinkedIn': {
    label: 'ClearView → LinkedIn',
    description: 'User shared a ClearView story or briefing to LinkedIn',
  },
  'ClearView Copy Link': {
    label: 'ClearView → Copy Link',
    description: 'User copied a ClearView share URL to their clipboard',
  },
  'ClearView Web Share': {
    label: 'ClearView → Native',
    description: 'User shared a ClearView story using the native share dialog',
  },
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
    shared: boolean;
    shareType: string | null;
    failedImageUrl: string | null;
    isRepeatUser: boolean;
  }[];
  topUsers: {
    ipAddress: string;
    country: string | null;
    analysisCount: number;
    avgScore: number;
  }[];
  repeatUsers: {
    ipAddress: string;
    country: string | null;
    device: "mobile" | "tablet" | "desktop";
    firstPlatform: string;
    firstReferrer: string | null;
    firstDaySearches: number;
    totalDays: number;
    totalSearches: number;
    firstSeen: Date;
    lastSeen: Date;
    isMidnightCrossover: boolean;
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
    isBot: boolean;
    isRepeatUser: boolean;
    startedCount: number;
    abandonedCount: number;
    durationSeconds: number | null;
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
  uniqueRealtimeSeries: {
    time: string;
    uniqueVisitors: number;
    uniqueAnalyzers: number;
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

type StatGroup = { avgSeconds: number; medianSeconds: number; p10Seconds: number; p90Seconds: number; count: number };

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

interface ConversionTrendPoint {
  date: string;
  visitors: number;
  converted: number;
  rate: number;
}

interface FunnelMetrics {
  steps: FunnelStep[];
  trend: ConversionTrendPoint[];
  period: string;
}

interface RetentionMetrics {
  cohortRetention: {
    cohortDate: string;
    cohortSize: number;
    d1: number;
    d7: number;
    d14: number;
    d30: number;
  }[];
  rollingReturnRate: {
    windowDays: number;
    eligibleUsers: number;
    returnedUsers: number;
    rate: number;
  };
  stickiness: {
    dau: number;
    wau: number;
    mau: number;
    dauWauRatio: number;
    dauMauRatio: number;
  };
  frequencyDistribution: {
    visits1: number;
    visits2to3: number;
    visits4to10: number;
    visits10plus: number;
    total: number;
  };
}

interface ShareMetrics {
  overview: {
    totalShares: number;
    uniqueSharers: number;
    shareRate: number;
    todayShares: number;
    weekShares: number;
    avgSharesPerSharer: number;
  };
  shareTypes: {
    type: string;
    count: number;
    percentage: number;
  }[];
  topSharedContent: {
    url: string;
    domain: string;
    shareCount: number;
    uniqueSharers: number;
  }[];
  sharerSegmentation: {
    oneTime: number;
    occasional: number;
    frequent: number;
    power: number;
    total: number;
  };
  sharerDetails: {
    ipMasked: string;
    shareCount: number;
    segment: 'one-time' | 'occasional' | 'frequent' | 'power';
    lastShareAt: string;
    firstShareAt: string;
  }[];
  scoreDistribution: {
    low: number;
    medium: number;
    high: number;
    unknown: number;
  };
  dailyTrend: {
    date: string;
    shares: number;
    uniqueSharers: number;
  }[];
  kFactor: {
    shareRate: number;
    avgSharesPerSharer: number;
    estimatedConversion: number;
    kFactorValue: number;
  };
  attribution: {
    qrScans: number;
    qrScansWeek: number;
    twitterReferrals: number;
    twitterReferralsWeek: number;
    facebookReferrals: number;
    facebookReferralsWeek: number;
    linkedinReferrals: number;
    linkedinReferralsWeek: number;
    totalAttributed: number;
    totalAttributedWeek: number;
    conversionFromQr: number;
  };
}

interface ContentInsights {
  topicDistribution: {
    topic: string;
    count: number;
    percentage: number;
    avgScore: number;
    shareCount: number;
  }[];
  topDomains: {
    domain: string;
    count: number;
    avgScore: number;
    shareCount: number;
  }[];
  contentTypeDistribution: {
    contentType: string;
    count: number;
    percentage: number;
    avgScore: number;
  }[];
  sourceTypeDistribution: {
    sourceType: string;
    count: number;
    percentage: number;
    avgScore: number;
  }[];
  highRageTopics: {
    topic: string;
    avgScore: number;
    count: number;
  }[];
  mostSharedTopics: {
    topic: string;
    shareCount: number;
    shareRate: number;
    analyzeCount: number;
  }[];
}

interface AcquisitionMetrics {
  sourceBreakdown: {
    source: string;
    visitors: number;
    percentage: number;
    conversions: number;
    conversionRate: number;
  }[];
  mediumBreakdown: {
    medium: string;
    visitors: number;
    percentage: number;
  }[];
  topCampaigns: {
    campaign: string;
    source: string;
    visitors: number;
    conversions: number;
  }[];
  referrerBreakdown: {
    referrer: string;
    visitors: number;
    percentage: number;
  }[];
  summary: {
    totalWithUtm: number;
    totalWithReferrer: number;
    totalDirect: number;
    topSource: string;
    topMedium: string;
  };
}

type CompletionGroup = { started: number; completed: number; abandoned: number; completionRate: number };

interface AnalysisCompletionMetrics {
  overall: {
    started: number;
    completed: number;
    completionRate: number;
    abandonmentRate: number;
    // Correlated metrics (matched by session_id)
    correlatedCompleted: number;
    correlatedRate: number;
    abandoned: number;
    failed: number;
    avgTimeToComplete: number;
  };
  byDevice: {
    mobile: CompletionGroup;
    tablet: CompletionGroup;
    desktop: CompletionGroup;
  };
  byOS: {
    iOS: CompletionGroup;
    Android: CompletionGroup;
    Windows: CompletionGroup;
    macOS: CompletionGroup;
    Linux: CompletionGroup;
    Other: CompletionGroup;
  };
  byAnalysisType: {
    url: CompletionGroup;
    image: CompletionGroup;
  };
  errorBreakdown: {
    type: string;
    count: number;
  }[];
  hourlyTrend: {
    hour: string;
    started: number;
    completed: number;
    rate: number;
  }[];
  dailyTrend: {
    date: string;
    started: number;
    completed: number;
    rate: number;
  }[];
  trackingSince: string | null;
}

interface AbandonmentDiagnostics {
  timeDistribution: {
    bucket: string;
    count: number;
    percentage: number;
  }[];
  reasonBreakdown: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  connectionBreakdown: {
    connectionType: string;
    effectiveType: string;
    count: number;
    abandonRate: number;
  }[];
  durationCorrelation: {
    durationBucket: string;
    totalCompleted: number;
    totalAbandoned: number;
    abandonRate: number;
  }[];
  summary: {
    totalAbandoned: number;
    avgTimeToAbandon: number;
    medianTimeToAbandon: number;
    mostCommonReason: string;
    highestAbandonConnection: string;
  };
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
  retentionMetrics?: RetentionMetrics;
  shareMetrics?: ShareMetrics;
  contentInsights?: ContentInsights;
  acquisitionMetrics?: AcquisitionMetrics;
  analysisCompletionMetrics?: AnalysisCompletionMetrics;
  abandonmentDiagnostics?: AbandonmentDiagnostics;
  subscriberStats?: SubscriberStats;
  interactionStats?: InteractionStats;
  clearviewSubscriberStats?: ClearviewSubscriberStats;
  languageStats?: LanguageStats;
  defenseCheckMetrics?: { totalAnalyses: number; avgScore: number; categoryDistribution: Record<string, number>; analysesPerDay: { date: string; count: number }[] };
  stanceMetrics?: { totalAnalyses: number; avgDefenseScore: number; postureDistribution: Record<string, number>; analysesPerDay: { date: string; count: number }[] };
  clearviewAnalytics?: ClearViewAnalytics;
  sessionDurationStats?: SessionDurationStats;
  dbAvailable?: boolean;
}

function StatCard({ title, value, subtitle, icon, accent = "indigo", tooltip }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "purple";
  tooltip?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const accentColors = {
    indigo: "from-indigo-500 to-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
    emerald: "from-emerald-500 to-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
    amber: "from-amber-500 to-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
    rose: "from-rose-500 to-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50",
    purple: "from-purple-500 to-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50",
  };
  const [gradient, textColor, bgColor] = accentColors[accent].split(" ").reduce((acc, cls) => {
    if (cls.startsWith("from-") || cls.startsWith("to-")) acc[0] += " " + cls;
    else if (cls.startsWith("text-")) acc[1] += " " + cls;
    else if (cls.startsWith("bg-") || cls.startsWith("dark:bg-")) acc[2] += " " + cls;
    return acc;
  }, ["", "", ""]);

  return (
    <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-lg transition-shadow group">
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${gradient} rounded-l-xl`}></div>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
            {title}
            {tooltip && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
                className="p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </h3>
          <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
          {subtitle && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${bgColor}`}>
            {icon}
          </div>
        )}
      </div>
      {/* Tooltip popup - shows below the card */}
      {tooltip && showTooltip && (
        <div
          className="absolute left-0 right-0 mt-2 p-3 bg-zinc-800 dark:bg-zinc-700 text-white text-xs rounded-lg shadow-xl z-[100] leading-relaxed"
          style={{ top: '100%' }}
        >
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 p-1 hover:bg-zinc-700 dark:hover:bg-zinc-600 rounded"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pr-6">{tooltip}</div>
        </div>
      )}
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

      <div className="space-y-1">
        {steps.map((step, i) => {
          const widthPercent = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const isFirst = i === 0;
          const prevStep = steps[i - 1];
          // Calculate step-to-step conversion rate (positive)
          const stepConversion = prevStep && prevStep.count > 0
            ? Math.round((step.count / prevStep.count) * 100)
            : 100;

          return (
            <div key={step.name}>
              {/* Conversion rate between steps (shown above the bar) */}
              {!isFirst && prevStep && (
                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600" />
                    <span className={`font-semibold ${stepConversion >= 50 ? 'text-emerald-600' : stepConversion >= 20 ? 'text-amber-600' : 'text-rose-500'}`}>
                      {stepConversion}% converted
                    </span>
                    <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600" />
                  </div>
                </div>
              )}

              {/* Step bar with integrated label */}
              <div className="relative">
                <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg transition-all duration-500 flex items-center"
                    style={{ width: `${Math.max(widthPercent, 8)}%` }}
                  >
                    {/* Step number inside bar */}
                    <span className="ml-3 w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                  </div>
                </div>

                {/* Label and count overlay */}
                <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                  <span className="font-medium text-white ml-10">{step.name}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-white/90 dark:bg-zinc-900/90 px-2 py-0.5 rounded text-sm">
                    {step.count.toLocaleString()}
                  </span>
                </div>
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
              {steps[steps.length - 1].percentage}%
              <span className="font-normal text-zinc-400 ml-2">
                ({steps[0].count.toLocaleString()} → {steps[steps.length - 1].count.toLocaleString()})
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversionTrendChart({ data }: { data: ConversionTrendPoint[] }) {
  if (!data || data.length < 2) return null;

  // Calculate chart bounds with padding for better visualization
  const rates = data.map(d => d.rate);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);
  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;

  // Add 20% padding to the range for better visualization
  const range = maxRate - minRate || 1;
  const chartMax = Math.min(100, maxRate + range * 0.2);
  const chartMin = Math.max(0, minRate - range * 0.2);
  const chartRange = chartMax - chartMin || 1;

  // SVG dimensions
  const width = 100;
  const height = 100;
  const padding = { top: 10, right: 5, bottom: 20, left: 5 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate line path
  const points = data.map((point, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((point.rate - chartMin) / chartRange) * chartHeight;
    return { x, y, ...point };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area path (for fill under line)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Average line Y position
  const avgY = padding.top + chartHeight - ((avgRate - chartMin) / chartRange) * chartHeight;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Conversion Rate Trend
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-400">Last 14 days</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            avg {avgRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative h-40">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <line
            x1={padding.left} y1={avgY}
            x2={width - padding.right} y2={avgY}
            stroke="currentColor"
            strokeDasharray="2,2"
            className="text-zinc-300 dark:text-zinc-600"
            strokeWidth="0.5"
          />

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-500"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={point.date}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill="currentColor"
                className={point.rate >= avgRate ? 'text-emerald-500' : 'text-indigo-500'}
              />
            </g>
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Hover overlay with tooltips */}
        <div className="absolute inset-0 flex">
          {data.map((point, i) => {
            const dateLabel = new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
            return (
              <div key={point.date} className="flex-1 group relative">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    <div className="font-medium">{dateLabel}</div>
                    <div>{point.rate}% ({point.converted}/{point.visitors})</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-zinc-400">
        <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}</span>
        <span>{new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}</span>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Above avg</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Below avg</span>
        </div>
      </div>
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

  // Scroll to the right (most recent) on mount and data change
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is painted before scrolling
    const scrollToEnd = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    };
    // Double RAF to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToEnd);
    });
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

  // Format time labels in EST (including minutes for 30-min bucket accuracy)
  const formatTimeEST = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
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

function UniqueSessionsChart({ data }: { data: { time: string; uniqueVisitors: number; uniqueAnalyzers: number }[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to the right (most recent) on mount and data change
  useEffect(() => {
    const scrollToEnd = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    };
    // Double RAF to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToEnd);
    });
  }, [data]);

  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => Math.max(d.uniqueVisitors, d.uniqueAnalyzers)), 1);
  const width = 2400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

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

  const visitorsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.uniqueVisitors) }));
  const analyzersPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.uniqueAnalyzers) }));

  const formatTimeEST = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  };

  const labelIndices: number[] = [];
  for (let i = 0; i <= 12; i++) {
    labelIndices.push(Math.min(Math.floor(i * 12), data.length - 1));
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Unique Sessions (Last 3 Days - deduplicated per 30 min window, EST)
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-amber-500 rounded" />
            <span className="text-zinc-500">Unique Visitors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-purple-500 rounded" />
            <span className="text-zinc-500">Unique Analyzers</span>
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute top-0 right-0 text-xs text-zinc-400 z-10 bg-white dark:bg-zinc-900 px-1">
          max: {maxValue}
        </div>
        <div ref={scrollRef} className="overflow-x-auto">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="h-40" style={{ minWidth: width }}>
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
            <path
              d={createAreaPath(visitorsPoints)}
              fill="rgba(245, 158, 11, 0.15)"
            />
            <path
              d={createAreaPath(analyzersPoints)}
              fill="rgba(168, 85, 247, 0.15)"
            />
            <polyline
              points={visitorsPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={analyzersPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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

interface SessionDurationStats {
  avgDuration: number | null;
  medianDuration: number | null;
  totalWithDuration: number;
  distribution: { bucket: string; count: number }[];
  perPage: { pagePath: string; avgDuration: number; visits: number }[];
}

type TabType = "overview" | "users" | "conversions" | "funnel" | "retention" | "shares" | "feedback" | "content" | "clearview" | "subscribers" | "interactions" | "languages" | "defensecheck" | "stance";

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

interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  bySource: { source: string; count: number }[];
  byCountry: { country: string; count: number }[];
  recentSubscribers: {
    email: string;
    subscribedAt: string;
    source: string;
    country: string | null;
  }[];
  dailySignups: { date: string; count: number }[];
}

interface InteractionStats {
  summary: {
    total: number;
    today: number;
    thisWeek: number;
    uniqueIPs: number;
  };
  byCategory: { category: string; count: number }[];
  byAction: { category: string; action: string; count: number }[];
  topLabels: { label: string; count: number }[];
  navigation: { destination: string; location: string; count: number }[];
  shareCard: { action: string; count: number }[];
  results: { action: string; label: string; count: number }[];
  inputs: { action: string; count: number }[];
  externalLinks: { destination: string; count: number }[];
  hourlyTrend: { hour: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

interface ClearviewSubscriberStats {
  total: number;
  active: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  recentSubscribers: {
    email: string;
    subscribedAt: string;
    country: string | null;
  }[];
  dailySignups: { date: string; count: number }[];
}

interface LanguageStats {
  totalWithLanguage: number;
  byLanguage: { language: string; count: number; percentage: number }[];
  dailyTrend: { date: string; language: string; count: number }[];
  topLanguagesToday: { language: string; count: number }[];
}

interface ClearViewAnalytics {
  trafficSources: {
    channels: { channel: string; visitors: number; percentage: number }[];
    topReferrers: { domain: string; visitors: number; percentage: number }[];
    utmSources: { source: string; visitors: number }[];
    utmMediums: { medium: string; visitors: number }[];
    utmCampaigns: { campaign: string; source: string; visitors: number }[];
    todayVs7Day: {
      todayDirect: number; todayReferral: number; todayUtm: number;
      weekDirect: number; weekReferral: number; weekUtm: number;
    };
  };
  recentVisitors: {
    createdAt: string; ipAddress: string; country: string | null;
    device: string; os: string; browser: string;
    referrer: string | null; utmSource: string | null; isRepeat: boolean;
    durationSeconds: number | null;
  }[];
  repeatUsers: {
    newToday: number; returningToday: number; new7Day: number; returning7Day: number;
    repeatDetails: {
      ipAddress: string; country: string | null; device: string;
      firstSeen: string; lastSeen: string; totalVisits: number; daysActive: number;
    }[];
    frequencyDistribution: { visits1: number; visits2to3: number; visits4to10: number; visits10plus: number };
    avgDaysBetweenVisits: number;
  };
  retention: {
    cohortRetention: { cohortDate: string; cohortSize: number; d1: number; d7: number; d14: number; d30: number }[];
    rollingReturnRate: number;
    stickiness: { dau: number; wau: number; mau: number; dauWauRatio: number; dauMauRatio: number };
  };
  engagement: {
    sharesByPlatform: { platform: string; count: number }[];
    shareRate: number; totalShares: number; totalUniqueVisitors: number;
    topSharedStories: { label: string; count: number }[];
    interactionBreakdown: { action: string; label: string; count: number }[];
    recentShares: {
      createdAt: string; ipAddress: string; country: string | null;
      device: string; os: string; browser: string;
      shareType: string; url: string | null; platform: string | null; score: number | null;
    }[];
    recentBriefingShares: {
      createdAt: string; ipAddress: string; country: string | null;
      device: string; os: string; browser: string; platform: string;
    }[];
  };
  geoDevice: {
    countries: { country: string; visitors: number; percentage: number }[];
    devices: { type: string; count: number; percentage: number }[];
    browsers: { browser: string; count: number; percentage: number }[];
    operatingSystems: { os: string; count: number; percentage: number }[];
  };
  heatmap: {
    grid: number[][];
    maxValue: number;
  };
  spikeDetection: {
    dailyCounts: { date: string; unique: number; isSpike: boolean; baseline: number }[];
    spikes: { date: string; unique: number; multiplier: number; topSource: string }[];
    surgeCohorts: { spikeDate: string; newVisitors: number; d1Return: number; d3Return: number; d7Return: number }[];
    organicBaseline: { d1Return: number; d3Return: number; d7Return: number };
  };
  attributionResults: { source: string; count: number; percentage: number }[];
  attributionResponseRate: number;
  viralityEstimate: {
    shareRate: number;
    measuredReferralRate: number;
    darkSocialMultiplier: number;
    adjustedReferralRate: number;
    kFactor: number;
    dailyGrowthRate: number;
    virality: 'viral' | 'growing' | 'organic' | 'stalled';
    trend: number[];
  };
}

// ============================================
// ClearView Insight Generators
// ============================================

function InsightBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 mb-6 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
      {children}
    </div>
  );
}

function AlertCard({ level, text }: { level: 'green' | 'yellow' | 'red'; text: string }) {
  const styles = {
    green: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    yellow: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    red: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300',
  };
  const icons = { green: '+', yellow: '!', red: '-' };
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs font-medium ${styles[level]}`}>
      <span className="font-bold mr-1">{icons[level]}</span>{text}
    </div>
  );
}

function getClearViewExecutiveSummary(a: ClearViewAnalytics): string {
  const todayTotal = a.trafficSources.todayVs7Day.todayDirect + a.trafficSources.todayVs7Day.todayReferral + a.trafficSources.todayVs7Day.todayUtm;
  const weekTotal = a.trafficSources.todayVs7Day.weekDirect + a.trafficSources.todayVs7Day.weekReferral + a.trafficSources.todayVs7Day.weekUtm;
  const weekDailyAvg = weekTotal > 0 ? Math.round(weekTotal / 7) : 0;

  const parts: string[] = [];

  // Visitor volume
  if (weekDailyAvg > 0) {
    const pctVsAvg = Math.round(((todayTotal - weekDailyAvg) / weekDailyAvg) * 100);
    if (pctVsAvg > 10) {
      parts.push(`ClearView had ${todayTotal} visitors today, ${pctVsAvg}% above the 7-day average of ${weekDailyAvg}/day.`);
    } else if (pctVsAvg < -10) {
      parts.push(`ClearView had ${todayTotal} visitors today, ${Math.abs(pctVsAvg)}% below the 7-day average of ${weekDailyAvg}/day.`);
    } else {
      parts.push(`ClearView had ${todayTotal} visitors today, in line with the 7-day average of ${weekDailyAvg}/day.`);
    }
  } else {
    parts.push(`ClearView had ${todayTotal} visitors today.`);
  }

  // New vs returning
  const todayReturning = a.repeatUsers.returningToday;
  const todayNew = a.repeatUsers.newToday;
  const todayAll = todayReturning + todayNew;
  if (todayAll > 0) {
    const retPct = Math.round((todayReturning / todayAll) * 100);
    if (retPct >= 30) {
      parts.push(`${retPct}% were returning users \u2014 habit formation is progressing.`);
    } else if (retPct >= 15) {
      parts.push(`${retPct}% were returning users, with room to grow retention.`);
    } else {
      parts.push(`Only ${retPct}% were returning users \u2014 most visitors are new, focus on retention.`);
    }
  }

  // Share rate
  if (a.engagement.totalUniqueVisitors > 0) {
    if (a.engagement.shareRate >= 5) {
      parts.push(`Share rate is ${a.engagement.shareRate}%, indicating strong word-of-mouth.`);
    } else if (a.engagement.shareRate >= 1) {
      parts.push(`Share rate is ${a.engagement.shareRate}%.`);
    } else if (a.engagement.totalShares > 0) {
      parts.push(`Share rate is ${a.engagement.shareRate}% \u2014 consider making sharing more prominent.`);
    }
  }

  // Top channel
  const topChannel = a.trafficSources.channels[0];
  if (topChannel) {
    if (topChannel.channel === 'Direct' && topChannel.percentage >= 60) {
      parts.push(`${topChannel.percentage}% of traffic is Direct, suggesting users are bookmarking or typing the URL.`);
    } else if (topChannel.channel === 'Social' && topChannel.percentage >= 40) {
      parts.push(`${topChannel.percentage}% of traffic comes from Social \u2014 your sharing features are driving discovery.`);
    } else if (topChannel.channel !== 'Direct') {
      parts.push(`Top channel: ${topChannel.channel} (${topChannel.percentage}%).`);
    }
  }

  return parts.join(' ');
}

function getClearViewAlerts(a: ClearViewAnalytics): { level: 'green' | 'yellow' | 'red'; text: string }[] {
  const alerts: { level: 'green' | 'yellow' | 'red'; text: string }[] = [];

  // Return rate
  if (a.retention.rollingReturnRate < 5 && a.retention.stickiness.mau > 10) {
    alerts.push({ level: 'red', text: `Return rate is only ${a.retention.rollingReturnRate}% \u2014 very few users come back.` });
  } else if (a.retention.rollingReturnRate >= 20) {
    alerts.push({ level: 'green', text: `Return rate is ${a.retention.rollingReturnRate}% \u2014 strong retention.` });
  }

  // Stickiness
  const dauWau = a.retention.stickiness.dauWauRatio;
  if (dauWau >= 20) {
    alerts.push({ level: 'green', text: `DAU/WAU is ${dauWau}% \u2014 daily habit forming.` });
  } else if (dauWau > 0 && dauWau < 10) {
    alerts.push({ level: 'yellow', text: `DAU/WAU is ${dauWau}% \u2014 users visit occasionally, not daily yet.` });
  }

  // No shares
  const todayTotal = a.trafficSources.todayVs7Day.todayDirect + a.trafficSources.todayVs7Day.todayReferral + a.trafficSources.todayVs7Day.todayUtm;
  if (a.engagement.totalShares === 0 && a.engagement.totalUniqueVisitors > 20) {
    alerts.push({ level: 'yellow', text: `No ClearView shares recorded despite ${a.engagement.totalUniqueVisitors} unique visitors.` });
  }

  // Briefing shares underuse
  if (a.engagement.recentBriefingShares.length === 0 && todayTotal > 10) {
    alerts.push({ level: 'yellow', text: 'No briefing shares this period \u2014 feature may be underutilized.' });
  }

  // Referrer concentration
  const topRef = a.trafficSources.topReferrers[0];
  const totalRefVisitors = a.trafficSources.topReferrers.reduce((s, r) => s + r.visitors, 0);
  if (topRef && totalRefVisitors > 10 && topRef.visitors / totalRefVisitors > 0.8) {
    alerts.push({ level: 'yellow', text: `${Math.round((topRef.visitors / totalRefVisitors) * 100)}% of referral traffic comes from ${topRef.domain}. Diversification opportunity.` });
  }

  // Traffic spike from a referrer
  if (topRef && topRef.visitors > 50) {
    alerts.push({ level: 'green', text: `Strong referral traffic from ${topRef.domain}: ${topRef.visitors} visitors.` });
  }

  // Repeat user power base
  const powerUsers = a.repeatUsers.frequencyDistribution.visits10plus;
  if (powerUsers > 0) {
    alerts.push({ level: 'green', text: `${powerUsers} power user${powerUsers > 1 ? 's' : ''} visited 10+ days in the last 30 days.` });
  }

  // Traffic spike alerts
  for (const spike of a.spikeDetection.spikes) {
    const severity: 'yellow' | 'red' = spike.multiplier >= 5 ? 'red' : 'yellow';
    alerts.push({ level: severity, text: `Traffic spike detected: ${spike.date} had ${spike.unique} visitors (${spike.multiplier}\u00d7 normal). Top source: ${spike.topSource}.` });
  }

  // Surge cohort retention alert
  const latestSurge = a.spikeDetection.surgeCohorts[a.spikeDetection.surgeCohorts.length - 1];
  const orgBase = a.spikeDetection.organicBaseline;
  if (latestSurge && orgBase.d7Return > 0) {
    const comparison = latestSurge.d7Return >= orgBase.d7Return ? 'better' : 'worse';
    const level: 'green' | 'yellow' = comparison === 'better' ? 'green' : 'yellow';
    alerts.push({ level, text: `Surge cohort (${latestSurge.spikeDate}) D7 retention is ${latestSurge.d7Return}% \u2014 ${comparison} than ${orgBase.d7Return}% organic baseline.` });
  }

  return alerts;
}

function getAcquisitionInsight(a: ClearViewAnalytics): string {
  const channels = a.trafficSources.channels;
  if (channels.length === 0) return '';

  const parts: string[] = [];
  const topChannel = channels[0];

  // Growth mode classification
  const directPct = channels.find(c => c.channel === 'Direct')?.percentage || 0;
  const socialPct = channels.find(c => c.channel === 'Social')?.percentage || 0;
  const searchPct = channels.find(c => c.channel === 'Organic Search')?.percentage || 0;
  const campaignPct = (channels.find(c => c.channel === 'Campaign')?.percentage || 0) +
                      (channels.find(c => c.channel === 'Paid')?.percentage || 0);

  if (directPct >= 50) {
    parts.push(`Growth mode: Organic/Direct. ${directPct}% of visitors arrive with no referrer, indicating bookmarks, direct URL entry, or dark social sharing.`);
  } else if (socialPct >= 40) {
    parts.push(`Growth mode: Viral/Social. ${socialPct}% of traffic comes from social platforms \u2014 sharing is your primary growth channel.`);
  } else if (searchPct >= 30) {
    parts.push(`Growth mode: SEO-driven. ${searchPct}% of traffic comes from organic search.`);
  } else if (campaignPct >= 20) {
    parts.push(`Growth mode: Campaign-driven. ${campaignPct}% of traffic comes from tracked campaigns.`);
  }

  // Channel mix shift
  const t = a.trafficSources.todayVs7Day;
  const todayTotal = t.todayDirect + t.todayReferral + t.todayUtm;
  const weekTotal = t.weekDirect + t.weekReferral + t.weekUtm;
  if (todayTotal >= 5 && weekTotal >= 20) {
    const todayDirectPct = Math.round((t.todayDirect / todayTotal) * 100);
    const weekDirectPct = Math.round((t.weekDirect / weekTotal) * 100);
    const diff = todayDirectPct - weekDirectPct;
    if (Math.abs(diff) >= 15) {
      parts.push(diff > 0
        ? `Today's traffic skews ${diff}pp more Direct than the 7-day average \u2014 fewer referrals today.`
        : `Today's traffic skews ${Math.abs(diff)}pp more Referral/UTM than the 7-day average \u2014 campaign or social spike.`);
    }
  }

  return parts.join(' ');
}

function getHabitInsight(a: ClearViewAnalytics): string {
  const parts: string[] = [];
  const freq = a.repeatUsers.frequencyDistribution;
  const total = freq.visits1 + freq.visits2to3 + freq.visits4to10 + freq.visits10plus;

  if (total > 0) {
    const oneTimePct = Math.round((freq.visits1 / total) * 100);
    const repeatPct = 100 - oneTimePct;
    const corePct = Math.round(((freq.visits4to10 + freq.visits10plus) / total) * 100);

    parts.push(`${oneTimePct}% of users visited once and didn't return. ${repeatPct}% came back at least once.`);
    if (corePct > 0) {
      parts.push(`${corePct}% visited 4+ times \u2014 your engaged core audience.`);
    }
    if (freq.visits10plus > 0) {
      parts.push(`${freq.visits10plus} user${freq.visits10plus > 1 ? 's have' : ' has'} visited 10+ days, forming a strong daily habit.`);
    }
  }

  if (a.repeatUsers.avgDaysBetweenVisits > 0) {
    const avg = a.repeatUsers.avgDaysBetweenVisits;
    if (avg <= 1.5) {
      parts.push(`Repeat visitors return every ${avg} days on average \u2014 near-daily usage.`);
    } else if (avg <= 3) {
      parts.push(`Repeat visitors return every ${avg} days on average \u2014 roughly every other day.`);
    } else if (avg <= 7) {
      parts.push(`Repeat visitors return every ${avg} days on average \u2014 roughly weekly.`);
    } else {
      parts.push(`Repeat visitors return every ${avg} days on average \u2014 infrequent, consider engagement hooks.`);
    }
  }

  return parts.join(' ');
}

function getRetentionInsight(a: ClearViewAnalytics): string {
  const parts: string[] = [];

  // DAU/WAU interpretation
  const dauWau = a.retention.stickiness.dauWauRatio;
  if (dauWau > 0) {
    if (dauWau >= 25) {
      parts.push(`DAU/WAU of ${dauWau}% indicates strong daily engagement \u2014 users are forming a regular habit.`);
    } else if (dauWau >= 14) {
      parts.push(`DAU/WAU of ${dauWau}% suggests a weekly habit is forming, with about 1 in ${Math.round(100 / dauWau)} weekly users visiting daily.`);
    } else {
      parts.push(`DAU/WAU of ${dauWau}% indicates occasional usage. Most weekly users aren't visiting daily yet.`);
    }
  }

  // DAU/MAU
  const dauMau = a.retention.stickiness.dauMauRatio;
  if (dauMau > 0) {
    parts.push(`DAU/MAU is ${dauMau}% (industry benchmark: 10-20% for news/content apps).`);
  }

  // Best/worst cohort
  const cohorts = a.retention.cohortRetention;
  if (cohorts.length >= 3) {
    const withD1 = cohorts.filter(c => c.d1 > 0);
    if (withD1.length >= 2) {
      const best = withD1.reduce((a, b) => a.d1 > b.d1 ? a : b);
      const worst = withD1.reduce((a, b) => a.d1 < b.d1 ? a : b);
      if (best.cohortDate !== worst.cohortDate) {
        parts.push(`Best D1 retention: ${best.cohortDate} cohort at ${best.d1}%. Weakest: ${worst.cohortDate} at ${worst.d1}%.`);
      }
    }
  }

  // Rolling return rate
  if (a.retention.rollingReturnRate > 0) {
    parts.push(`${a.retention.rollingReturnRate}% of users who first visited 3+ days ago have returned at least once.`);
  }

  return parts.join(' ');
}

function getShareInsight(a: ClearViewAnalytics): string {
  const parts: string[] = [];

  // Share funnel
  if (a.engagement.totalUniqueVisitors > 0) {
    const visitorsPerShare = a.engagement.totalShares > 0 ? Math.round(a.engagement.totalUniqueVisitors / a.engagement.totalShares) : 0;
    if (visitorsPerShare > 0) {
      parts.push(`1 in every ${visitorsPerShare} visitors shares ClearView content (${a.engagement.shareRate}% share rate).`);
    } else {
      parts.push(`No shares recorded from ${a.engagement.totalUniqueVisitors} unique visitors.`);
    }
  }

  // Top platform
  if (a.engagement.sharesByPlatform.length > 0) {
    const top = a.engagement.sharesByPlatform[0];
    const total = a.engagement.totalShares;
    if (total > 0) {
      const pct = Math.round((top.count / total) * 100);
      parts.push(`${top.platform} is the top share channel (${pct}% of shares).`);
    }
  }

  // Briefing vs story
  const briefingCount = a.engagement.recentBriefingShares.length;
  const storyShares = a.engagement.topSharedStories.reduce((s, st) => s + st.count, 0);
  if (briefingCount > 0 && storyShares > 0) {
    if (briefingCount > storyShares) {
      parts.push(`Briefing shares (${briefingCount}) outpace individual story shares (${storyShares}) \u2014 the daily briefing format resonates more.`);
    } else {
      parts.push(`Story shares (${storyShares}) outpace briefing shares (${briefingCount}) \u2014 individual stories drive more sharing.`);
    }
  }

  return parts.join(' ');
}

function getAudienceInsight(a: ClearViewAnalytics): string {
  const parts: string[] = [];
  const { devices, browsers, operatingSystems, countries } = a.geoDevice;

  // Persona
  const topDevice = devices[0];
  const topOS = operatingSystems[0];
  const topBrowser = browsers[0];
  const topCountry = countries[0];

  if (topDevice && topOS && topBrowser && topCountry) {
    parts.push(`Typical ClearView user: ${topOS.os} on ${topDevice.type} (${topBrowser.browser}), from ${topCountry.country}.`);
  }

  // Mobile implication
  const mobilePct = devices.find(d => d.type === 'mobile')?.percentage || 0;
  const desktopPct = devices.find(d => d.type === 'desktop')?.percentage || 0;
  if (mobilePct > 60) {
    parts.push(`${mobilePct}% mobile traffic suggests most users discover ClearView through social media links on their phones.`);
  } else if (desktopPct > 60) {
    parts.push(`${desktopPct}% desktop traffic suggests intentional, bookmarked usage \u2014 users seek out ClearView deliberately.`);
  } else {
    parts.push(`Balanced mobile/desktop split (${mobilePct}%/${desktopPct}%) \u2014 users access from both contexts.`);
  }

  // Geographic concentration
  if (countries.length >= 3) {
    const top3Pct = countries.slice(0, 3).reduce((s, c) => s + c.percentage, 0);
    parts.push(`Top 3 countries account for ${Math.round(top3Pct)}% of traffic.`);
  }

  return parts.join(' ');
}

function getHeatmapInsight(a: ClearViewAnalytics): string {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parts: string[] = [];
  const { grid, maxValue } = a.heatmap;
  if (maxValue === 0) return 'No visit data available for heatmap analysis.';

  // Find peak hour/day
  let peakDay = 0, peakHour = 0, peakVal = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (grid[d]?.[h] > peakVal) {
        peakVal = grid[d][h];
        peakDay = d;
        peakHour = h;
      }
    }
  }

  const hourLabel = peakHour === 0 ? '12am' : peakHour < 12 ? `${peakHour}am` : peakHour === 12 ? '12pm' : `${peakHour - 12}pm`;
  parts.push(`Peak usage: ${DAYS[peakDay]}s at ${hourLabel} EST (${peakVal} visits).`);

  // Weekday vs weekend
  let weekdayTotal = 0, weekendTotal = 0;
  for (let d = 0; d < 7; d++) {
    const dayTotal = grid[d]?.reduce((s: number, v: number) => s + v, 0) || 0;
    if (d === 0 || d === 6) weekendTotal += dayTotal;
    else weekdayTotal += dayTotal;
  }
  const weekdayAvg = weekdayTotal / 5;
  const weekendAvg = weekendTotal / 2;
  if (weekendAvg > 0) {
    const ratio = weekdayAvg / weekendAvg;
    if (ratio >= 1.5) {
      parts.push(`Weekday traffic is ${ratio.toFixed(1)}x weekend traffic, consistent with a work-morning news routine.`);
    } else if (ratio <= 0.7) {
      parts.push(`Weekend traffic is higher than weekday, suggesting leisure reading behavior.`);
    } else {
      parts.push(`Weekday and weekend traffic are comparable, suggesting ClearView fits both routines.`);
    }
  }

  // Morning vs evening pattern
  let morningTotal = 0, eveningTotal = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 6; h < 12; h++) morningTotal += grid[d]?.[h] || 0;
    for (let h = 18; h < 24; h++) eveningTotal += grid[d]?.[h] || 0;
  }
  if (morningTotal > eveningTotal * 1.5) {
    parts.push('Usage skews morning \u2014 users check ClearView as part of their AM routine.');
  } else if (eveningTotal > morningTotal * 1.5) {
    parts.push('Usage skews evening \u2014 users catch up on ClearView after work.');
  }

  return parts.join(' ');
}

const HEATMAP_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HEATMAP_HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12a';
  if (i < 12) return `${i}a`;
  if (i === 12) return '12p';
  return `${i - 12}p`;
});

function HeatmapChart({ grid, maxValue }: { grid: number[][]; maxValue: number }) {
  const cellW = 28;
  const cellH = 20;
  const labelW = 36;
  const labelH = 24;
  const svgW = labelW + cellW * 24 + 2;
  const svgH = labelH + cellH * 7 + 2;

  // Use CSS custom properties for dark mode compatibility
  const colorSteps = [
    { light: '#f4f4f5', dark: '#27272a' }, // 0
    { light: '#e0e7ff', dark: '#312e81' }, // 0-20%
    { light: '#c7d2fe', dark: '#3730a3' }, // 20-40%
    { light: '#a5b4fc', dark: '#4338ca' }, // 40-60%
    { light: '#818cf8', dark: '#4f46e5' }, // 60-80%
    { light: '#4f46e5', dark: '#6366f1' }, // 80-100%
  ];

  function getStepIndex(value: number): number {
    if (maxValue === 0 || value === 0) return 0;
    const ratio = value / maxValue;
    if (ratio < 0.2) return 1;
    if (ratio < 0.4) return 2;
    if (ratio < 0.6) return 3;
    if (ratio < 0.8) return 4;
    return 5;
  }

  return (
    <div className="overflow-x-auto">
      {/* Grid rendered as divs for proper dark mode support */}
      <div style={{ width: svgW, minWidth: svgW }}>
        {/* Hour labels row */}
        <div className="flex" style={{ paddingLeft: labelW }}>
          {HEATMAP_HOURS.map((label, h) => (
            <div key={h} className="text-center text-zinc-400 dark:text-zinc-500" style={{ width: cellW, fontSize: 9 }}>
              {h % 3 === 0 ? label : ''}
            </div>
          ))}
        </div>
        {/* Day rows */}
        {HEATMAP_DAYS.map((day, d) => (
          <div key={d} className="flex items-center">
            <div className="text-right text-zinc-500 dark:text-zinc-400 pr-1.5" style={{ width: labelW, fontSize: 10 }}>
              {day}
            </div>
            {grid[d]?.map((val, h) => {
              const step = getStepIndex(val);
              return (
                <div
                  key={h}
                  className="rounded-sm transition-colors"
                  style={{
                    width: cellW - 1,
                    height: cellH - 1,
                    margin: '0.5px',
                    backgroundColor: colorSteps[step].light,
                  }}
                  title={val > 0 ? `${day} ${HEATMAP_HOURS[h]}: ${val} visits` : `${day} ${HEATMAP_HOURS[h]}: 0 visits`}
                >
                  <div
                    className="hidden dark:block w-full h-full rounded-sm"
                    style={{ backgroundColor: colorSteps[step].dark }}
                  />
                </div>
              );
            })}
          </div>
        ))}
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
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [clearviewStats, setClearviewStats] = useState<ClearviewStats | null>(null);
  const [clearviewLoading, setClearviewLoading] = useState(false);
  const [clearviewRefreshing, setClearviewRefreshing] = useState(false);
  const [clearviewVisitorStats, setClearviewVisitorStats] = useState<PageVisitorStats | null>(null);
  const [viralMetrics, setViralMetrics] = useState<ViralMetrics | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [timeToAnalysis, setTimeToAnalysis] = useState<TimeToAnalysisMetrics | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [conversionInsights, setConversionInsights] = useState<ConversionInsights | null>(null);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [shareMetrics, setShareMetrics] = useState<ShareMetrics | null>(null);
  const [contentInsights, setContentInsights] = useState<ContentInsights | null>(null);
  const [acquisitionMetrics, setAcquisitionMetrics] = useState<AcquisitionMetrics | null>(null);
  const [analysisCompletionMetrics, setAnalysisCompletionMetrics] = useState<AnalysisCompletionMetrics | null>(null);
  const [abandonmentDiagnostics, setAbandonmentDiagnostics] = useState<AbandonmentDiagnostics | null>(null);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats | null>(null);
  const [interactionStats, setInteractionStats] = useState<InteractionStats | null>(null);
  const [clearviewSubscriberStats, setClearviewSubscriberStats] = useState<ClearviewSubscriberStats | null>(null);
  const [languageStats, setLanguageStats] = useState<LanguageStats | null>(null);
  const [defenseCheckMetrics, setDefenseCheckMetrics] = useState<{ totalAnalyses: number; avgScore: number; categoryDistribution: Record<string, number>; analysesPerDay: { date: string; count: number }[] } | null>(null);
  const [stanceMetrics, setStanceMetrics] = useState<{ totalAnalyses: number; avgDefenseScore: number; postureDistribution: Record<string, number>; analysesPerDay: { date: string; count: number }[] } | null>(null);
  const [clearviewAnalytics, setClearviewAnalytics] = useState<ClearViewAnalytics | null>(null);
  const [sessionDurationStats, setSessionDurationStats] = useState<SessionDurationStats | null>(null);

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
        setRetentionMetrics(data.retentionMetrics || null);
        setShareMetrics(data.shareMetrics || null);
        setContentInsights(data.contentInsights || null);
        setAcquisitionMetrics(data.acquisitionMetrics || null);
        setAnalysisCompletionMetrics(data.analysisCompletionMetrics || null);
        setAbandonmentDiagnostics(data.abandonmentDiagnostics || null);
        setSubscriberStats(data.subscriberStats || null);
        setInteractionStats(data.interactionStats || null);
        setClearviewSubscriberStats(data.clearviewSubscriberStats || null);
        setLanguageStats(data.languageStats || null);
        setDefenseCheckMetrics(data.defenseCheckMetrics || null);
        setStanceMetrics(data.stanceMetrics || null);
        setClearviewAnalytics(data.clearviewAnalytics || null);
        setSessionDurationStats(data.sessionDurationStats || null);
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

  const refreshClearview = async () => {
    setClearviewRefreshing(true);
    try {
      const response = await fetch("/api/clearview/refresh", {
        headers: {
          "Authorization": `Bearer ${key}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Refresh the stats after successful regeneration
        setClearviewStats(null);
        await fetchClearviewStats();
        alert(`ClearView refreshed! ${data.storiesCount} stories generated.`);
      } else {
        alert(`Refresh failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to refresh clearview:", err);
      alert("Failed to refresh ClearView");
    } finally {
      setClearviewRefreshing(false);
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
            {(["overview", "users", "conversions", "funnel", "retention", "shares", "feedback", "content", "clearview", "defensecheck", "stance", "subscribers", "interactions", "languages"] as const).map((tab) => (
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

                    {/* ======= ClearView Comprehensive Analytics ======= */}
                    {clearviewAnalytics && (
                      <>
                        {/* Executive Summary */}
                        {(() => {
                          const summary = getClearViewExecutiveSummary(clearviewAnalytics);
                          const alerts = getClearViewAlerts(clearviewAnalytics);
                          return (
                            <div className="mb-8">
                              {summary && (
                                <InsightBlock>
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Summary: </span>
                                  {summary}
                                </InsightBlock>
                              )}
                              {alerts.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
                                  {alerts.map((alert, i) => (
                                    <AlertCard key={i} level={alert.level} text={alert.text} />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Section 1: Traffic Sources & Acquisition */}
                        <div className="mb-8">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                            Traffic Sources & Acquisition
                          </h3>
                          {(() => {
                            const insight = getAcquisitionInsight(clearviewAnalytics);
                            return insight ? <InsightBlock>{insight}</InsightBlock> : null;
                          })()}
                          {/* Today vs 7-Day comparison */}
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                            <StatCard title="Today Direct" value={clearviewAnalytics.trafficSources.todayVs7Day.todayDirect} accent="indigo" />
                            <StatCard title="Today Referral" value={clearviewAnalytics.trafficSources.todayVs7Day.todayReferral} accent="emerald" />
                            <StatCard title="Today UTM" value={clearviewAnalytics.trafficSources.todayVs7Day.todayUtm} accent="purple" />
                            <StatCard title="7d Direct" value={clearviewAnalytics.trafficSources.todayVs7Day.weekDirect} accent="indigo" />
                            <StatCard title="7d Referral" value={clearviewAnalytics.trafficSources.todayVs7Day.weekReferral} accent="emerald" />
                            <StatCard title="7d UTM" value={clearviewAnalytics.trafficSources.todayVs7Day.weekUtm} accent="purple" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Channel Grouping */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                Channel Grouping (30 days)
                              </h4>
                              <div className="space-y-3">
                                {clearviewAnalytics.trafficSources.channels.map((ch) => {
                                  const maxPct = Math.max(...clearviewAnalytics.trafficSources.channels.map(c => c.percentage), 1);
                                  return (
                                    <div key={ch.channel}>
                                      <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-zinc-600 dark:text-zinc-400">{ch.channel}</span>
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{ch.visitors} <span className="text-xs font-normal text-zinc-400">({ch.percentage}%)</span></span>
                                      </div>
                                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(ch.percentage / maxPct) * 100}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Top Referrers */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                Top Referrers (30 days)
                              </h4>
                              {clearviewAnalytics.trafficSources.topReferrers.length === 0 ? (
                                <p className="text-sm text-zinc-400">No referral data yet</p>
                              ) : (
                                <div className="space-y-3">
                                  {clearviewAnalytics.trafficSources.topReferrers.slice(0, 10).map((ref) => {
                                    const maxPct = Math.max(...clearviewAnalytics.trafficSources.topReferrers.map(r => r.percentage), 1);
                                    return (
                                      <div key={ref.domain}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                          <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[180px]">{ref.domain}</span>
                                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{ref.visitors} <span className="text-xs font-normal text-zinc-400">({ref.percentage}%)</span></span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(ref.percentage / maxPct) * 100}%` }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* UTM Breakdown */}
                          {(clearviewAnalytics.trafficSources.utmSources.length > 0 || clearviewAnalytics.trafficSources.utmCampaigns.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">UTM Sources</h4>
                                <div className="space-y-2">
                                  {clearviewAnalytics.trafficSources.utmSources.slice(0, 8).map((s) => (
                                    <div key={s.source} className="flex justify-between text-sm">
                                      <span className="text-zinc-600 dark:text-zinc-400">{s.source}</span>
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.visitors}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">UTM Mediums</h4>
                                <div className="space-y-2">
                                  {clearviewAnalytics.trafficSources.utmMediums.slice(0, 8).map((m) => (
                                    <div key={m.medium} className="flex justify-between text-sm">
                                      <span className="text-zinc-600 dark:text-zinc-400">{m.medium}</span>
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{m.visitors}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Top Campaigns</h4>
                                <div className="space-y-2">
                                  {clearviewAnalytics.trafficSources.utmCampaigns.slice(0, 8).map((c) => (
                                    <div key={c.campaign} className="flex justify-between text-sm">
                                      <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]" title={c.campaign}>{c.campaign}</span>
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.visitors}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 2: Recent Visitors Table */}
                        <div className="mb-8">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                            Recent ClearView Visitors (Last 3 Days)
                          </h3>
                          {clearviewAnalytics.recentVisitors.length === 0 ? (
                            <p className="text-sm text-zinc-400">No visitors in the last 3 days</p>
                          ) : (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <div className="overflow-x-auto max-h-96 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                <table className="w-full text-sm">
                                  <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0 z-10">
                                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Time</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Device</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">OS</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Browser</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Referrer</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">UTM</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Duration</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Repeat?</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {clearviewAnalytics.recentVisitors.map((v, i) => (
                                      <tr key={i} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${v.isRepeat ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}>
                                        <td className="py-2 px-3 text-zinc-500 whitespace-nowrap text-xs">{formatDateTimeEST(v.createdAt)}</td>
                                        <td className="py-2 px-3 text-zinc-600 dark:text-zinc-300 font-mono text-xs">{v.ipAddress?.slice(-8) || '-'}</td>
                                        <td className="py-2 px-3 text-zinc-500">{v.country || '-'}</td>
                                        <td className="py-2 px-3 text-zinc-500">{v.device}</td>
                                        <td className="py-2 px-3 text-zinc-500">{v.os}</td>
                                        <td className="py-2 px-3 text-zinc-500">{v.browser}</td>
                                        <td className="py-2 px-3 text-zinc-500 max-w-[120px] truncate" title={v.referrer || ''}>{v.referrer ? (() => { try { return new URL(v.referrer.startsWith('http') ? v.referrer : `https://${v.referrer}`).hostname.replace('www.', ''); } catch { return v.referrer; } })() : '-'}</td>
                                        <td className="py-2 px-3 text-zinc-500">{v.utmSource || '-'}</td>
                                        <td className="py-2 px-3 text-zinc-500 text-xs whitespace-nowrap">
                                          {v.durationSeconds != null
                                            ? v.durationSeconds >= 60
                                              ? `${Math.floor(v.durationSeconds / 60)}m ${v.durationSeconds % 60}s`
                                              : `${v.durationSeconds}s`
                                            : '-'}
                                        </td>
                                        <td className="py-2 px-3">
                                          {v.isRepeat ? (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">Repeat</span>
                                          ) : (
                                            <span className="text-xs text-zinc-400">New</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 3: Repeat User / Habit Formation */}
                        <div className="mb-8">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                            Repeat Users & Habit Formation
                          </h3>
                          {(() => {
                            const insight = getHabitInsight(clearviewAnalytics);
                            return insight ? <InsightBlock>{insight}</InsightBlock> : null;
                          })()}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            <StatCard title="New Today" value={clearviewAnalytics.repeatUsers.newToday} accent="emerald" />
                            <StatCard title="Returning Today" value={clearviewAnalytics.repeatUsers.returningToday} accent="indigo" />
                            <StatCard title="New (7d)" value={clearviewAnalytics.repeatUsers.new7Day} accent="emerald" />
                            <StatCard title="Returning (7d)" value={clearviewAnalytics.repeatUsers.returning7Day} accent="indigo" />
                            <StatCard title="Avg Days Between" value={clearviewAnalytics.repeatUsers.avgDaysBetweenVisits} subtitle="days between repeat visits" accent="purple" />
                          </div>

                          {/* Frequency Distribution */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                Visit Frequency (30 days)
                              </h4>
                              {(() => {
                                const freq = clearviewAnalytics.repeatUsers.frequencyDistribution;
                                const maxFreq = Math.max(freq.visits1, freq.visits2to3, freq.visits4to10, freq.visits10plus, 1);
                                const bars = [
                                  { label: '1 visit', value: freq.visits1, color: 'bg-zinc-400' },
                                  { label: '2-3 visits', value: freq.visits2to3, color: 'bg-indigo-400' },
                                  { label: '4-10 visits', value: freq.visits4to10, color: 'bg-indigo-500' },
                                  { label: '10+ visits', value: freq.visits10plus, color: 'bg-indigo-600' },
                                ];
                                return (
                                  <div className="space-y-3">
                                    {bars.map((bar) => (
                                      <div key={bar.label}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                          <span className="text-zinc-600 dark:text-zinc-400">{bar.label}</span>
                                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{bar.value}</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${(bar.value / maxFreq) * 100}%` }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Repeat Visitor Detail Table */}
                            {clearviewAnalytics.repeatUsers.repeatDetails.length > 0 && (
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                  Top Repeat Visitors
                                </h4>
                                <div className="overflow-x-auto max-h-64 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                  <table className="w-full text-xs">
                                    <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0">
                                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">IP</th>
                                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">Country</th>
                                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">Device</th>
                                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">First</th>
                                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">Last</th>
                                        <th className="text-right py-2 px-2 text-zinc-500 font-medium">Visits</th>
                                        <th className="text-right py-2 px-2 text-zinc-500 font-medium">Days</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {clearviewAnalytics.repeatUsers.repeatDetails.slice(0, 20).map((rd, i) => (
                                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                          <td className="py-1.5 px-2 font-mono text-zinc-600 dark:text-zinc-300">{rd.ipAddress?.slice(-8)}</td>
                                          <td className="py-1.5 px-2 text-zinc-500">{rd.country || '-'}</td>
                                          <td className="py-1.5 px-2 text-zinc-500">{rd.device}</td>
                                          <td className="py-1.5 px-2 text-zinc-400">{rd.firstSeen}</td>
                                          <td className="py-1.5 px-2 text-zinc-400">{rd.lastSeen}</td>
                                          <td className="py-1.5 px-2 text-right font-bold text-zinc-900 dark:text-zinc-100">{rd.totalVisits}</td>
                                          <td className="py-1.5 px-2 text-right text-zinc-600 dark:text-zinc-300">{rd.daysActive}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Section 4: ClearView-Specific Retention */}
                        <div className="mb-8">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                            ClearView Retention
                          </h3>
                          {(() => {
                            const insight = getRetentionInsight(clearviewAnalytics);
                            return insight ? <InsightBlock>{insight}</InsightBlock> : null;
                          })()}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            <StatCard title="Return Rate" value={`${clearviewAnalytics.retention.rollingReturnRate}%`} subtitle="3+ day old users who returned" accent="indigo" />
                            <StatCard title="DAU" value={clearviewAnalytics.retention.stickiness.dau} accent="emerald" />
                            <StatCard title="WAU" value={clearviewAnalytics.retention.stickiness.wau} accent="emerald" />
                            <StatCard title="DAU/WAU" value={`${clearviewAnalytics.retention.stickiness.dauWauRatio}%`} accent="purple" />
                            <StatCard title="DAU/MAU" value={`${clearviewAnalytics.retention.stickiness.dauMauRatio}%`} accent="purple" />
                          </div>

                          {/* Cohort Retention Table */}
                          {clearviewAnalytics.retention.cohortRetention.length > 0 && (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                Cohort Retention (ClearView Only)
                              </h4>
                              <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                <table className="w-full text-sm">
                                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                      <th className="text-left py-3 px-4 text-zinc-500 font-medium">Cohort</th>
                                      <th className="text-right py-3 px-4 text-zinc-500 font-medium">Size</th>
                                      <th className="text-right py-3 px-4 text-zinc-500 font-medium">D1</th>
                                      <th className="text-right py-3 px-4 text-zinc-500 font-medium">D7</th>
                                      <th className="text-right py-3 px-4 text-zinc-500 font-medium">D14</th>
                                      <th className="text-right py-3 px-4 text-zinc-500 font-medium">D30</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {clearviewAnalytics.retention.cohortRetention.map((c, i) => (
                                      <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                        <td className="py-2 px-4 text-zinc-600 dark:text-zinc-300">{c.cohortDate}</td>
                                        <td className="py-2 px-4 text-right text-zinc-900 dark:text-zinc-100 font-medium">{c.cohortSize}</td>
                                        <td className="py-2 px-4 text-right">
                                          <span className={c.d1 > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}>{c.d1}%</span>
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                          <span className={c.d7 > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}>{c.d7}%</span>
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                          <span className={c.d14 > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}>{c.d14}%</span>
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                          <span className={c.d30 > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}>{c.d30}%</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 5: Engagement & Shares */}
                        <div className="mb-8">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                            ClearView Engagement & Shares
                          </h3>
                          {(() => {
                            const insight = getShareInsight(clearviewAnalytics);
                            return insight ? <InsightBlock>{insight}</InsightBlock> : null;
                          })()}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <StatCard title="Total Shares" value={clearviewAnalytics.engagement.totalShares} accent="indigo" />
                            <StatCard title="Unique Visitors (30d)" value={clearviewAnalytics.engagement.totalUniqueVisitors} accent="emerald" />
                            <StatCard title="Share Rate" value={`${clearviewAnalytics.engagement.shareRate}%`} subtitle="shares / unique visitors" accent="purple" />
                            <StatCard title="Platforms" value={clearviewAnalytics.engagement.sharesByPlatform.length} accent="amber" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Shares by Platform */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                Shares by Platform
                              </h4>
                              {clearviewAnalytics.engagement.sharesByPlatform.length === 0 ? (
                                <p className="text-sm text-zinc-400">No shares yet</p>
                              ) : (
                                <div className="space-y-3">
                                  {clearviewAnalytics.engagement.sharesByPlatform.map((sp) => {
                                    const maxShares = Math.max(...clearviewAnalytics.engagement.sharesByPlatform.map(s => s.count), 1);
                                    return (
                                      <div key={sp.platform}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                          <span className="text-zinc-600 dark:text-zinc-400">{sp.platform}</span>
                                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{sp.count}</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${(sp.count / maxShares) * 100}%` }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Top Shared Stories */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                Top Shared Stories
                              </h4>
                              {clearviewAnalytics.engagement.topSharedStories.length === 0 ? (
                                <p className="text-sm text-zinc-400">No story shares yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {clearviewAnalytics.engagement.topSharedStories.slice(0, 10).map((story, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                      <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]" title={story.label}>{story.label}</span>
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100 ml-2">{story.count}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interaction Breakdown */}
                          {clearviewAnalytics.engagement.interactionBreakdown.length > 0 && (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                ClearView Interactions
                              </h4>
                              <div className="overflow-x-auto max-h-64 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                <table className="w-full text-sm">
                                  <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0">
                                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                      <th className="text-left py-2 px-4 text-zinc-500 font-medium">Action</th>
                                      <th className="text-left py-2 px-4 text-zinc-500 font-medium">Label</th>
                                      <th className="text-right py-2 px-4 text-zinc-500 font-medium">Count</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {clearviewAnalytics.engagement.interactionBreakdown.map((ix, i) => (
                                      <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                        <td className="py-2 px-4 text-zinc-600 dark:text-zinc-300">{ix.action}</td>
                                        <td className="py-2 px-4 text-zinc-500 max-w-[200px] truncate" title={ix.label}>{ix.label || '-'}</td>
                                        <td className="py-2 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">{ix.count}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Recent Shares Table */}
                        {clearviewAnalytics.engagement.recentShares.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                              Recent ClearView Shares
                            </h3>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <div className="overflow-x-auto max-h-96 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                <table className="w-full text-sm">
                                  <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0 z-10">
                                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Time</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Device</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">OS</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Browser</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Share Type</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">URL</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {clearviewAnalytics.engagement.recentShares.map((s, i) => (
                                      <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="py-2 px-3 text-zinc-500 whitespace-nowrap text-xs">{formatDateTimeEST(s.createdAt)}</td>
                                        <td className="py-2 px-3 text-zinc-600 dark:text-zinc-300 font-mono text-xs">{s.ipAddress?.slice(-8) || '-'}</td>
                                        <td className="py-2 px-3 text-zinc-500">{s.country || '-'}</td>
                                        <td className="py-2 px-3 text-zinc-500">{s.device}</td>
                                        <td className="py-2 px-3 text-zinc-500">{s.os}</td>
                                        <td className="py-2 px-3 text-zinc-500">{s.browser}</td>
                                        <td className="py-2 px-3">
                                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                            {s.shareType}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-zinc-500 max-w-[200px] truncate text-xs" title={s.url || ''}>
                                          {s.url ? (() => { try { return new URL(s.url).pathname.slice(0, 40); } catch { return s.url.slice(0, 40); } })() : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Briefing Shares Table */}
                        {clearviewAnalytics.engagement.recentBriefingShares.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                              Briefing Shares
                            </h3>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <div className="overflow-x-auto max-h-96 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                <table className="w-full text-sm">
                                  <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0 z-10">
                                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Time</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Device</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">OS</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Browser</th>
                                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Platform</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {clearviewAnalytics.engagement.recentBriefingShares.map((s, i) => (
                                      <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="py-2 px-3 text-zinc-500 whitespace-nowrap text-xs">{formatDateTimeEST(s.createdAt)}</td>
                                        <td className="py-2 px-3 text-zinc-600 dark:text-zinc-300 font-mono text-xs">{s.ipAddress?.slice(-8) || '-'}</td>
                                        <td className="py-2 px-3 text-zinc-500">{s.country || '-'}</td>
                                        <td className="py-2 px-3 text-zinc-500">{s.device}</td>
                                        <td className="py-2 px-3 text-zinc-500">{s.os}</td>
                                        <td className="py-2 px-3 text-zinc-500">{s.browser}</td>
                                        <td className="py-2 px-3">
                                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                            {s.platform}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Section 6: Geographic & Device Distribution */}
                        <div className="mb-8">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                            Geographic & Device Distribution
                          </h3>
                          {(() => {
                            const insight = getAudienceInsight(clearviewAnalytics);
                            return insight ? <InsightBlock>{insight}</InsightBlock> : null;
                          })()}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Country Breakdown */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                Top Countries (30 days)
                              </h4>
                              {clearviewAnalytics.geoDevice.countries.length === 0 ? (
                                <p className="text-sm text-zinc-400">No geographic data</p>
                              ) : (
                                <div className="space-y-2">
                                  {clearviewAnalytics.geoDevice.countries.map((c) => {
                                    const maxPct = Math.max(...clearviewAnalytics.geoDevice.countries.map(x => x.percentage), 1);
                                    return (
                                      <div key={c.country}>
                                        <div className="flex justify-between items-center text-sm mb-0.5">
                                          <span className="text-zinc-600 dark:text-zinc-400">{c.country}</span>
                                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.visitors} <span className="text-xs text-zinc-400">({c.percentage}%)</span></span>
                                        </div>
                                        <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(c.percentage / maxPct) * 100}%` }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Device / Browser / OS */}
                            <div className="space-y-6">
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Device Type</h4>
                                <div className="space-y-2">
                                  {clearviewAnalytics.geoDevice.devices.map((d) => (
                                    <div key={d.type} className="flex justify-between text-sm">
                                      <span className="text-zinc-600 dark:text-zinc-400 capitalize">{d.type}</span>
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{d.count} <span className="text-xs text-zinc-400">({d.percentage}%)</span></span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Browser</h4>
                                <div className="space-y-2">
                                  {clearviewAnalytics.geoDevice.browsers.map((b) => (
                                    <div key={b.browser} className="flex justify-between text-sm">
                                      <span className="text-zinc-600 dark:text-zinc-400">{b.browser}</span>
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{b.count} <span className="text-xs text-zinc-400">({b.percentage}%)</span></span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Operating System</h4>
                                <div className="space-y-2">
                                  {clearviewAnalytics.geoDevice.operatingSystems.map((o) => (
                                    <div key={o.os} className="flex justify-between text-sm">
                                      <span className="text-zinc-600 dark:text-zinc-400">{o.os}</span>
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{o.count} <span className="text-xs text-zinc-400">({o.percentage}%)</span></span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 7: Time-of-Day / Day-of-Week Heatmap */}
                        <div className="mb-8">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                            Visit Heatmap (EST, Last 30 Days)
                          </h3>
                          {(() => {
                            const insight = getHeatmapInsight(clearviewAnalytics);
                            return insight ? <InsightBlock>{insight}</InsightBlock> : null;
                          })()}
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                            <HeatmapChart grid={clearviewAnalytics.heatmap.grid} maxValue={clearviewAnalytics.heatmap.maxValue} />
                            <div className="flex items-center justify-end gap-2 mt-3">
                              <span className="text-xs text-zinc-400">Less</span>
                              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-3 rounded-sm"
                                  style={{ backgroundColor: ratio === 0 ? '#f4f4f5' : ratio < 0.3 ? '#e0e7ff' : ratio < 0.5 ? '#c7d2fe' : ratio < 0.7 ? '#a5b4fc' : ratio < 0.9 ? '#818cf8' : '#4f46e5' }}
                                />
                              ))}
                              <span className="text-xs text-zinc-400">More</span>
                            </div>
                          </div>
                        </div>

                        {/* Section 8: Attribution Survey Results */}
                        {clearviewAnalytics.attributionResults.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                              Attribution Survey Results
                            </h3>
                            <InsightBlock>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Top self-reported source: </span>
                              {clearviewAnalytics.attributionResults[0].source} ({clearviewAnalytics.attributionResults[0].percentage}%).
                              {clearviewAnalytics.attributionResults.length > 1 && ` Followed by ${clearviewAnalytics.attributionResults[1].source} (${clearviewAnalytics.attributionResults[1].percentage}%).`}
                              {' '}Response rate: {clearviewAnalytics.attributionResponseRate}%.
                            </InsightBlock>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                              <StatCard
                                title="Total Responses"
                                value={clearviewAnalytics.attributionResults.reduce((s, r) => s + r.count, 0)}
                                accent="indigo"
                              />
                              <StatCard
                                title="Response Rate"
                                value={`${clearviewAnalytics.attributionResponseRate}%`}
                                accent="emerald"
                              />
                              <StatCard
                                title="Top Source"
                                value={clearviewAnalytics.attributionResults[0].source}
                                subtitle={`${clearviewAnalytics.attributionResults[0].count} responses`}
                                accent="purple"
                              />
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                              <div className="space-y-3">
                                {clearviewAnalytics.attributionResults.map((attr) => {
                                  const maxPct = Math.max(...clearviewAnalytics.attributionResults.map(a => a.percentage), 1);
                                  return (
                                    <div key={attr.source} className="flex items-center gap-3">
                                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-36 truncate">{attr.source}</span>
                                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-5 overflow-hidden">
                                        <div
                                          className="bg-indigo-500 h-full rounded-full transition-all"
                                          style={{ width: `${(attr.percentage / maxPct) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-zinc-500 w-16 text-right">{attr.count} ({attr.percentage}%)</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Section 8b: ClearView Virality Estimate */}
                        {(() => {
                          const v = clearviewAnalytics.viralityEstimate;
                          const statusConfig = {
                            viral: { label: 'Viral', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                            growing: { label: 'Growing', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
                            organic: { label: 'Organic', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                            stalled: { label: 'Stalled', color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' },
                          };
                          const status = statusConfig[v.virality];
                          return (
                            <div className="mb-8">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                                ClearView Virality Estimate
                              </h3>
                              <InsightBlock>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">K-factor: {v.kFactor} </span>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${status.color}`}>{status.label}</span>
                                {' \u2014 '}
                                {v.kFactor >= 1
                                  ? 'Each user is bringing in more than 1 new user. Exponential growth.'
                                  : v.kFactor >= 0.3
                                  ? 'Word-of-mouth is contributing meaningful growth. Not yet self-sustaining.'
                                  : v.kFactor > 0
                                  ? 'Some organic spread, but growth mainly depends on external discovery.'
                                  : 'No measurable viral spread yet. Focus on making the product shareable.'}
                                {v.darkSocialMultiplier > 1.2 && ` Dark social multiplier is ${v.darkSocialMultiplier}\u00d7 \u2014 significant word-of-mouth is hidden in "Direct" traffic.`}
                              </InsightBlock>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <StatCard title="K-Factor (est.)" value={v.kFactor} accent={v.kFactor >= 1 ? 'emerald' : v.kFactor >= 0.3 ? 'amber' : 'indigo'} />
                                <StatCard title="Share Rate" value={`${v.shareRate}%`} subtitle="of visitors share" accent="purple" />
                                <StatCard title="Referral Rate" value={`${v.adjustedReferralRate}%`} subtitle={v.darkSocialMultiplier > 1 ? `${v.measuredReferralRate}% measured + dark social` : 'of traffic from referrals'} accent="emerald" />
                                <StatCard title="Daily Growth" value={`${v.dailyGrowthRate > 0 ? '+' : ''}${v.dailyGrowthRate}%`} subtitle="14-day avg new visitors" accent={v.dailyGrowthRate > 0 ? 'emerald' : 'rose'} />
                              </div>

                              {/* K-factor trend sparkline */}
                              {v.trend.length > 2 && (
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">14-Day K-Factor Trend</span>
                                    <span className="text-[10px] text-zinc-400">
                                      {v.kFactor >= 1 ? 'K \u2265 1 = viral' : 'K \u2265 1 needed for viral growth'}
                                    </span>
                                  </div>
                                  {(() => {
                                    const data = v.trend;
                                    const w = 500;
                                    const h = 60;
                                    const maxK = Math.max(...data, 1, 0.1);
                                    const xS = (i: number) => (i / (data.length - 1)) * w;
                                    const yS = (val: number) => h - (val / maxK) * (h - 8) - 4;
                                    const pts = data.map((val, i) => `${xS(i)},${yS(val)}`).join(' ');
                                    const kOneLine = yS(1);
                                    return (
                                      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
                                        {/* K=1 reference line */}
                                        {maxK >= 1 && (
                                          <line x1="0" y1={kOneLine} x2={w} y2={kOneLine} stroke="#10b981" strokeWidth="0.5" strokeDasharray="3 3" />
                                        )}
                                        <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
                                        {data.map((val, i) => (
                                          <circle key={i} cx={xS(i)} cy={yS(val)} r="2.5" fill={val >= 1 ? '#10b981' : '#6366f1'} />
                                        ))}
                                      </svg>
                                    );
                                  })()}
                                  <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
                                    <span>14 days ago</span>
                                    <span>Today</span>
                                  </div>
                                </div>
                              )}

                              {/* Breakdown */}
                              <div className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">How This Is Calculated</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                  <div className="flex justify-between">
                                    <span>Measured referral rate</span>
                                    <span className="font-mono font-bold">{v.measuredReferralRate}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Dark social multiplier</span>
                                    <span className="font-mono font-bold">{v.darkSocialMultiplier}&times;</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Adjusted referral rate</span>
                                    <span className="font-mono font-bold">{v.adjustedReferralRate}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Share rate (unique sharers / visitors)</span>
                                    <span className="font-mono font-bold">{v.shareRate}%</span>
                                  </div>
                                  <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1 col-span-1 md:col-span-2">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">K = share_rate &times; conversion_per_share</span>
                                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{v.kFactor}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Section 9: Traffic Spike Detection */}
                        {clearviewAnalytics.spikeDetection.dailyCounts.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                              Traffic Spike Detection (60 Days)
                            </h3>
                            {clearviewAnalytics.spikeDetection.spikes.length > 0 && (
                              <InsightBlock>
                                {clearviewAnalytics.spikeDetection.spikes.length} spike{clearviewAnalytics.spikeDetection.spikes.length !== 1 ? 's' : ''} detected.
                                {' '}Largest: {clearviewAnalytics.spikeDetection.spikes.reduce((max, s) => s.multiplier > max.multiplier ? s : max, clearviewAnalytics.spikeDetection.spikes[0]).date}
                                {' '}({clearviewAnalytics.spikeDetection.spikes.reduce((max, s) => s.multiplier > max.multiplier ? s : max, clearviewAnalytics.spikeDetection.spikes[0]).multiplier}&times; baseline).
                              </InsightBlock>
                            )}

                            {/* Sparkline Chart */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-4">
                              {(() => {
                                const data = clearviewAnalytics.spikeDetection.dailyCounts;
                                const chartW = 720;
                                const chartH = 120;
                                const padL = 0;
                                const maxVal = Math.max(...data.map(d => d.unique), 1);

                                const xScale = (i: number) => padL + (i / (data.length - 1)) * (chartW - padL);
                                const yScale = (v: number) => chartH - (v / maxVal) * (chartH - 8) - 4;

                                // Area + line for daily counts
                                const areaPoints = data.map((d, i) => `${xScale(i)},${yScale(d.unique)}`).join(' ');
                                const areaPath = `M ${xScale(0)},${chartH} L ${areaPoints.split(' ').join(' L ')} L ${xScale(data.length - 1)},${chartH} Z`;
                                const linePoints = areaPoints;

                                // Baseline dashed line
                                const baselinePoints = data.map((d, i) => `${xScale(i)},${yScale(d.baseline)}`).join(' ');

                                // Spike dots
                                const spikeDots = data
                                  .map((d, i) => d.isSpike ? { x: xScale(i), y: yScale(d.unique), date: d.date, unique: d.unique } : null)
                                  .filter(Boolean) as { x: number; y: number; date: string; unique: number }[];

                                return (
                                  <div>
                                    <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full" preserveAspectRatio="none">
                                      {/* Area fill */}
                                      <path d={areaPath} fill="#a1a1aa" fillOpacity="0.15" />
                                      {/* Daily line */}
                                      <polyline points={linePoints} fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinejoin="round" />
                                      {/* Baseline dashed line */}
                                      <polyline points={baselinePoints} fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 3" strokeLinejoin="round" />
                                      {/* Spike dots */}
                                      {spikeDots.map((dot, i) => (
                                        <g key={i}>
                                          <circle cx={dot.x} cy={dot.y} r="4" fill="#ef4444" />
                                          <text x={dot.x} y={dot.y - 8} textAnchor="middle" fontSize="8" fill="#ef4444" fontWeight="bold">
                                            {dot.unique}
                                          </text>
                                        </g>
                                      ))}
                                      {/* X-axis labels (every ~10 days) */}
                                      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0 || i === data.length - 1).map((d, i) => (
                                        <text
                                          key={i}
                                          x={xScale(data.indexOf(d))}
                                          y={chartH + 14}
                                          textAnchor="middle"
                                          fontSize="8"
                                          fill="#a1a1aa"
                                        >
                                          {`${parseInt(d.date.slice(5, 7))}/${parseInt(d.date.slice(8, 10))}`}
                                        </text>
                                      ))}
                                    </svg>
                                    <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-400">
                                      <span className="flex items-center gap-1">
                                        <span className="inline-block w-3 h-px bg-zinc-400" /> Daily
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="inline-block w-3 h-px border-t border-dashed border-indigo-500" /> 7-day avg
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Spike
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Spike Summary Cards */}
                            {clearviewAnalytics.spikeDetection.spikes.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {clearviewAnalytics.spikeDetection.spikes.map((spike) => (
                                  <div key={spike.date} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{spike.date}</span>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${spike.multiplier >= 5 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                        {spike.multiplier}&times; baseline
                                      </span>
                                    </div>
                                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">{spike.unique}</div>
                                    <div className="text-xs text-zinc-500 mt-1">Top source: {spike.topSource}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Section 10: Surge Cohort Retention */}
                        {clearviewAnalytics.spikeDetection.surgeCohorts.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                              Surge Cohort Retention
                            </h3>
                            {(() => {
                              const latest = clearviewAnalytics.spikeDetection.surgeCohorts[clearviewAnalytics.spikeDetection.surgeCohorts.length - 1];
                              const org = clearviewAnalytics.spikeDetection.organicBaseline;
                              if (latest && org.d1Return > 0) {
                                const d1Comp = latest.d1Return >= org.d1Return ? 'above' : 'below';
                                return (
                                  <InsightBlock>
                                    Visitors from the {latest.spikeDate} spike retained at {latest.d1Return}% on D1 vs {org.d1Return}% organic baseline ({d1Comp}).
                                    {latest.d7Return > 0 && ` D7: ${latest.d7Return}% vs ${org.d7Return}% organic.`}
                                  </InsightBlock>
                                );
                              }
                              return null;
                            })()}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                    <th className="px-4 py-2.5 text-left font-semibold text-zinc-500 uppercase tracking-wider">Spike Date</th>
                                    <th className="px-4 py-2.5 text-right font-semibold text-zinc-500 uppercase tracking-wider">New Visitors</th>
                                    <th className="px-4 py-2.5 text-right font-semibold text-zinc-500 uppercase tracking-wider">D1 Return</th>
                                    <th className="px-4 py-2.5 text-right font-semibold text-zinc-500 uppercase tracking-wider">D3 Return</th>
                                    <th className="px-4 py-2.5 text-right font-semibold text-zinc-500 uppercase tracking-wider">D7 Return</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {clearviewAnalytics.spikeDetection.surgeCohorts.map((cohort) => {
                                    const org = clearviewAnalytics.spikeDetection.organicBaseline;
                                    const cellColor = (val: number, baseline: number) =>
                                      baseline > 0 && val >= baseline
                                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                        : baseline > 0
                                        ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'
                                        : '';
                                    return (
                                      <tr key={cohort.spikeDate} className="border-b border-zinc-100 dark:border-zinc-800/50">
                                        <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{cohort.spikeDate}</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-zinc-700 dark:text-zinc-300">{cohort.newVisitors}</td>
                                        <td className={`px-4 py-2.5 text-right font-bold ${cellColor(cohort.d1Return, org.d1Return)}`}>{cohort.d1Return}%</td>
                                        <td className={`px-4 py-2.5 text-right font-bold ${cellColor(cohort.d3Return, org.d3Return)}`}>{cohort.d3Return}%</td>
                                        <td className={`px-4 py-2.5 text-right font-bold ${cellColor(cohort.d7Return, org.d7Return)}`}>{cohort.d7Return}%</td>
                                      </tr>
                                    );
                                  })}
                                  {/* Organic Baseline Row */}
                                  {(() => {
                                    const org = clearviewAnalytics.spikeDetection.organicBaseline;
                                    return (
                                      <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-t-2 border-zinc-300 dark:border-zinc-600">
                                        <td className="px-4 py-2.5 font-bold text-zinc-500 uppercase text-[10px] tracking-wider">Organic Baseline</td>
                                        <td className="px-4 py-2.5 text-right text-zinc-400">&mdash;</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-zinc-500">{org.d1Return}%</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-zinc-500">{org.d3Return}%</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-zinc-500">{org.d7Return}%</td>
                                      </tr>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Clearview Subscriber Stats */}
                    {clearviewSubscriberStats && (
                      <div className="mb-8">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                          Clearview Subscribers
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                          <StatCard title="Total Subscribers" value={clearviewSubscriberStats.total} />
                          <StatCard title="Active" value={clearviewSubscriberStats.active} />
                          <StatCard title="Today" value={clearviewSubscriberStats.today} />
                          <StatCard title="This Week" value={clearviewSubscriberStats.thisWeek} />
                          <StatCard title="This Month" value={clearviewSubscriberStats.thisMonth} />
                        </div>

                        {/* Daily Signups Chart */}
                        {clearviewSubscriberStats.dailySignups.length > 0 && (
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                              Daily Signups (Last 14 Days)
                            </h4>
                            <div className="h-48">
                              <div className="flex items-end justify-between h-full gap-1">
                                {clearviewSubscriberStats.dailySignups.map((day, i) => {
                                  const maxCount = Math.max(...clearviewSubscriberStats.dailySignups.map(d => d.count), 1);
                                  const height = (day.count / maxCount) * 100;
                                  return (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                      <div className="text-xs text-zinc-500 mb-1">{day.count}</div>
                                      <div
                                        className="w-full bg-indigo-500 rounded-t transition-all"
                                        style={{ height: `${Math.max(height, 2)}%` }}
                                      />
                                      <div className="text-xs text-zinc-400 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                                        {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Recent Subscribers Table */}
                        {clearviewSubscriberStats.recentSubscribers.length > 0 && (
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                              Recent Subscribers
                            </h4>
                            <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                              <table className="w-full text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800">
                                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Email</th>
                                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Subscribed</th>
                                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Country</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {clearviewSubscriberStats.recentSubscribers.map((sub, i) => (
                                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{sub.email}</td>
                                      <td className="py-3 px-4 text-zinc-500">
                                        {new Date(sub.subscribedAt).toLocaleString()}
                                      </td>
                                      <td className="py-3 px-4 text-zinc-500">{sub.country || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Clearview Content Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        ClearView Content
                      </h3>
                      <button
                        onClick={refreshClearview}
                        disabled={clearviewRefreshing}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {clearviewRefreshing ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh ClearView
                          </>
                        )}
                      </button>
                    </div>
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
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {visitorStats && (
                <StatCard
                  title="Visitors Today"
                  value={visitorStats.todayVisitors.toLocaleString()}
                  accent="emerald"
                />
              )}
              <StatCard
                title="Analyses Today"
                value={stats.todayAnalyses.toLocaleString()}
                accent="indigo"
              />
              {visitorStats && (
                <StatCard
                  title="Conversion Today"
                  value={`${visitorStats.conversionRate}%`}
                  accent="rose"
                />
              )}
              {visitorStats && (
                <StatCard
                  title="Total Visitors"
                  value={visitorStats.totalVisitors.toLocaleString()}
                  accent="purple"
                />
              )}
              <StatCard
                title="Total Analyses"
                value={stats.totalAnalyses.toLocaleString()}
                accent="amber"
              />
              <StatCard
                title="Avg Score"
                value={stats.avgScore}
                subtitle="/100"
                accent="indigo"
              />
            </div>


            {/* Realtime Chart (10-min intervals) */}
            {visitorStats && visitorStats.realtimeSeries && visitorStats.realtimeSeries.length > 0 && (
              <RealtimeChart data={visitorStats.realtimeSeries} />
            )}

            {/* Unique Sessions Chart (deduplicated) */}
            {visitorStats && visitorStats.uniqueRealtimeSeries && visitorStats.uniqueRealtimeSeries.length > 0 && (
              <UniqueSessionsChart data={visitorStats.uniqueRealtimeSeries} />
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

              </div>
            )}

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
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Share</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Device</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAnalyses.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-4 text-zinc-500 text-center">No analyses yet</td>
                      </tr>
                    ) : (
                      stats.recentAnalyses.map((a, i) => (
                        <tr key={i} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${!a.success ? 'opacity-50' : ''}`}>
                          <td className="py-2 px-3 text-zinc-500 text-xs whitespace-nowrap">
                            {formatDateTimeEST(a.createdAt)}
                          </td>
                          <td className="py-2 px-3 max-w-[200px]" title={a.title || a.url}>
                            {a.failedImageUrl ? (
                              <a href={a.failedImageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                <img
                                  src={a.failedImageUrl}
                                  alt="Upload"
                                  className="w-10 h-10 object-cover rounded border border-zinc-200 dark:border-zinc-700"
                                />
                                <span className="text-indigo-600 hover:underline text-xs">
                                  {a.sourceDomain || "image"}
                                </span>
                              </a>
                            ) : (
                              <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate block">
                                {a.title || a.sourceDomain || a.url}
                              </a>
                            )}
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
                          <td className="py-2 px-3 text-xs">
                            {a.shareType ? (
                              <span className="text-emerald-600" title={a.shareType}>
                                {formatShareType(a.shareType)}
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs capitalize">
                            {a.device}
                          </td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">
                            {a.country || "-"}
                          </td>
                          <td className="py-2 px-3 text-zinc-500 text-xs font-mono">
                            <span className="flex items-center gap-1">
                              {a.ipAddress || "-"}
                              {a.isRepeatUser && (
                                <span className="text-[9px] px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded font-sans font-medium">repeat</span>
                              )}
                            </span>
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
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Duration</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Started</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Abandoned</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Bot</th>
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">AI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorStats.recentVisitors.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-4 text-zinc-500 text-center">No visitors yet</td>
                        </tr>
                      ) : (
                        visitorStats.recentVisitors.map((v, i) => (
                          <tr key={i} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${v.isBot ? 'opacity-50' : ''}`}>
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
                              <span className="flex items-center gap-1">
                                {v.ipAddress || "-"}
                                {v.isRepeatUser && (
                                  <span className="text-[9px] px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded font-sans font-medium">repeat</span>
                                )}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs whitespace-nowrap">
                              {v.durationSeconds != null
                                ? v.durationSeconds >= 60
                                  ? `${Math.floor(v.durationSeconds / 60)}m ${v.durationSeconds % 60}s`
                                  : `${v.durationSeconds}s`
                                : <span className="text-zinc-400">-</span>}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs text-center">
                              {v.startedCount > 0 ? v.startedCount : "-"}
                            </td>
                            <td className="py-2 px-3 text-xs text-center">
                              {v.abandonedCount > 0 ? (
                                <span className="text-amber-600">{v.abandonedCount}</span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-xs">
                              {v.isBot ? (
                                <span className="text-orange-600">Bot</span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
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

            {/* Session Duration Stats */}
            {sessionDurationStats && sessionDurationStats.totalWithDuration > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Session Duration
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  <StatCard
                    title="Avg Duration"
                    value={sessionDurationStats.avgDuration != null ? `${Math.floor(sessionDurationStats.avgDuration / 60)}m ${sessionDurationStats.avgDuration % 60}s` : "-"}
                    accent="indigo"
                  />
                  <StatCard
                    title="Median Duration"
                    value={sessionDurationStats.medianDuration != null ? `${Math.floor(sessionDurationStats.medianDuration / 60)}m ${Math.round(sessionDurationStats.medianDuration % 60)}s` : "-"}
                    accent="emerald"
                  />
                  <StatCard
                    title="Sessions Tracked"
                    value={sessionDurationStats.totalWithDuration.toLocaleString()}
                    accent="purple"
                  />
                </div>

                {/* Duration Distribution */}
                {sessionDurationStats.distribution.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Duration Distribution</h3>
                    <div className="flex items-end gap-2 h-32">
                      {sessionDurationStats.distribution.map((d) => {
                        const maxCount = Math.max(...sessionDurationStats.distribution.map(b => b.count), 1);
                        const height = (d.count / maxCount) * 100;
                        return (
                          <div key={d.bucket} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-zinc-500">{d.count}</span>
                            <div
                              className="w-full bg-indigo-500 dark:bg-indigo-400 rounded-t"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            />
                            <span className="text-xs text-zinc-500 whitespace-nowrap">{d.bucket}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Per-Page Breakdown */}
                {sessionDurationStats.perPage.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Duration by Page</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                          <th className="py-2 px-3 font-medium">Page</th>
                          <th className="py-2 px-3 font-medium text-right">Avg Duration</th>
                          <th className="py-2 px-3 font-medium text-right">Visits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionDurationStats.perPage.map((p) => (
                          <tr key={p.pagePath} className="border-b border-zinc-50 dark:border-zinc-800/50">
                            <td className="py-2 px-3 font-mono text-xs">{p.pagePath}</td>
                            <td className="py-2 px-3 text-right text-zinc-600 dark:text-zinc-400">
                              {Math.floor(p.avgDuration / 60)}m {p.avgDuration % 60}s
                            </td>
                            <td className="py-2 px-3 text-right text-zinc-600 dark:text-zinc-400">
                              {p.visits.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FunnelChart steps={funnelMetrics.steps} period={funnelMetrics.period} />
                  {funnelMetrics.trend && funnelMetrics.trend.length > 0 && (
                    <ConversionTrendChart data={funnelMetrics.trend} />
                  )}
                </div>
              </div>
            )}

            {/* Analysis Completion Summary */}
            {analysisCompletionMetrics && analysisCompletionMetrics.overall.started > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Analysis Completion
                  <span className="ml-2 text-sm font-normal text-zinc-500">(Started → Completed)</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Completion Rate"
                    value={`${analysisCompletionMetrics.overall.completionRate}%`}
                    subtitle={`${analysisCompletionMetrics.overall.completed}/${analysisCompletionMetrics.overall.started}`}
                    accent={analysisCompletionMetrics.overall.completionRate >= 90 ? "emerald" : analysisCompletionMetrics.overall.completionRate >= 75 ? "amber" : "rose"}
                    tooltip="% of started analyses that completed. Lower = users abandoning during loading."
                  />
                  <StatCard
                    title="Mobile Completion"
                    value={`${analysisCompletionMetrics.byDevice.mobile.completionRate}%`}
                    subtitle={`${analysisCompletionMetrics.byDevice.mobile.completed}/${analysisCompletionMetrics.byDevice.mobile.started}`}
                    accent={analysisCompletionMetrics.byDevice.mobile.completionRate >= 90 ? "emerald" : analysisCompletionMetrics.byDevice.mobile.completionRate >= 75 ? "amber" : "rose"}
                    tooltip="Mobile users often have slower connections and may abandon more during loading."
                  />
                  <StatCard
                    title="Desktop Completion"
                    value={`${analysisCompletionMetrics.byDevice.desktop.completionRate}%`}
                    subtitle={`${analysisCompletionMetrics.byDevice.desktop.completed}/${analysisCompletionMetrics.byDevice.desktop.started}`}
                    accent={analysisCompletionMetrics.byDevice.desktop.completionRate >= 90 ? "emerald" : analysisCompletionMetrics.byDevice.desktop.completionRate >= 75 ? "amber" : "rose"}
                    tooltip="Desktop completion rate - typically higher than mobile due to better connection."
                  />
                  <StatCard
                    title="Abandoned"
                    value={analysisCompletionMetrics.overall.started - analysisCompletionMetrics.overall.completed}
                    subtitle={`${analysisCompletionMetrics.overall.abandonmentRate}% abandonment`}
                    accent={analysisCompletionMetrics.overall.abandonmentRate <= 10 ? "emerald" : analysisCompletionMetrics.overall.abandonmentRate <= 25 ? "amber" : "rose"}
                    tooltip="Users who started but didn't receive results - likely left during loading."
                  />
                </div>
                <div className="mt-3 text-right">
                  <button
                    onClick={() => setActiveTab("funnel")}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    View full funnel analysis →
                  </button>
                </div>
              </div>
            )}

            {/* Time to Analysis Card */}
            {timeToAnalysis && timeToAnalysis.overall.count > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Time to Analysis
                </h2>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                  {/* Overall Distribution with Visual */}
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                      Distribution
                    </h3>
                    {(() => {
                      const fmt = (s: number) => {
                        if (s < 60) return `${s}s`;
                        if (s < 3600) return `${Math.round(s / 60)}m`;
                        return `${(s / 3600).toFixed(1)}h`;
                      };
                      const { p10Seconds, medianSeconds, p90Seconds, count } = timeToAnalysis.overall;
                      const maxTime = p90Seconds || 1;
                      const p10Pct = (p10Seconds / maxTime) * 100;
                      const medianPct = (medianSeconds / maxTime) * 100;

                      return (
                        <div className="space-y-4">
                          {/* Visual distribution bar */}
                          <div className="relative h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                            {/* P10 to P90 range */}
                            <div
                              className="absolute h-full bg-indigo-200 dark:bg-indigo-900/50"
                              style={{ left: `${p10Pct}%`, width: `${100 - p10Pct}%` }}
                            />
                            {/* P10 marker */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-indigo-400"
                              style={{ left: `${p10Pct}%` }}
                            />
                            {/* Median marker */}
                            <div
                              className="absolute top-0 bottom-0 w-1 bg-indigo-600"
                              style={{ left: `${medianPct}%` }}
                            />
                            {/* P90 marker (at end) */}
                            <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-indigo-400" />
                          </div>

                          {/* Labeled values */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Fast (p10)</div>
                              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(p10Seconds)}</div>
                            </div>
                            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Median (p50)</div>
                              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{fmt(medianSeconds)}</div>
                            </div>
                            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Slow (p90)</div>
                              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{fmt(p90Seconds)}</div>
                            </div>
                          </div>
                          <div className="text-center text-xs text-zinc-400">{count} samples</div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* By Device - Simplified */}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                    By Device (median)
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {([
                      { key: 'mobile', label: 'Mobile', icon: '📱', data: timeToAnalysis.byDevice.mobile },
                      { key: 'tablet', label: 'Tablet', icon: '📱', data: timeToAnalysis.byDevice.tablet },
                      { key: 'desktop', label: 'Desktop', icon: '💻', data: timeToAnalysis.byDevice.desktop },
                    ] as const).map(({ key, label, icon, data }) => {
                      const fmt = (s: number) => s < 60 ? `${s}s` : `${Math.round(s / 60)}m`;
                      return (
                        <div key={key} className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                          <div className="text-xs text-zinc-500 mb-1">{icon} {label}</div>
                          <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {data.count > 0 ? fmt(data.medianSeconds) : '-'}
                          </div>
                          <div className="text-xs text-zinc-400">{data.count}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* By OS */}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">By OS (median)</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {(["iOS", "Android", "Windows", "macOS", "Linux", "Other"] as const).map((os) => {
                      const data = timeToAnalysis.byOS[os];
                      const fmt = (s: number) => s < 60 ? `${s}s` : `${Math.round(s / 60)}m`;
                      return (
                        <div key={os} className="text-center p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                          <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                            {data.count > 0 ? fmt(data.medianSeconds) : '-'}
                          </div>
                          <div className="text-xs text-zinc-500">{os}</div>
                          <div className="text-xs text-zinc-400">{data.count}</div>
                        </div>
                      );
                    })}
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
                  {/* Overall headline metric */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                        {conversionMetrics.overall.rate}%
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">Overall conversion rate</div>
                    </div>
                    <div className="text-right text-sm text-zinc-400">
                      {conversionMetrics.overall.converted.toLocaleString()} / {conversionMetrics.overall.visitors.toLocaleString()} visitors
                    </div>
                  </div>

                  {/* By Device - Horizontal bars */}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">By Device</h3>
                  <div className="space-y-3 mb-6">
                    {([
                      { key: 'desktop', label: 'Desktop', icon: '💻', data: conversionMetrics.byDevice.desktop },
                      { key: 'mobile', label: 'Mobile', icon: '📱', data: conversionMetrics.byDevice.mobile },
                      { key: 'tablet', label: 'Tablet', icon: '📱', data: conversionMetrics.byDevice.tablet },
                    ] as const).map(({ key, label, icon, data }) => {
                      const avgRate = conversionMetrics.overall.rate;
                      const isAboveAvg = data.rate >= avgRate;
                      const barWidth = Math.min(100, (data.rate / Math.max(avgRate * 1.5, 1)) * 100);
                      return (
                        <div key={key} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">{icon} {label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-400">{data.converted}/{data.visitors}</span>
                              <span className={`font-bold text-sm w-14 text-right ${isAboveAvg ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                {data.visitors > 0 ? `${data.rate}%` : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isAboveAvg ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              style={{ width: `${data.visitors > 0 ? barWidth : 0}%` }}
                            />
                            {/* Average line marker */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-zinc-400"
                              style={{ left: `${(avgRate / Math.max(avgRate * 1.5, 1)) * 100}%` }}
                              title={`Avg: ${avgRate}%`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* By OS - Horizontal bars */}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">By OS</h3>
                  <div className="space-y-3">
                    {(["Windows", "macOS", "iOS", "Android", "Linux", "Other"] as const).map((os) => {
                      const data = conversionMetrics.byOS[os];
                      const avgRate = conversionMetrics.overall.rate;
                      const isAboveAvg = data.rate >= avgRate;
                      const barWidth = Math.min(100, (data.rate / Math.max(avgRate * 1.5, 1)) * 100);
                      return (
                        <div key={os} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">{os}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-400">{data.converted}/{data.visitors}</span>
                              <span className={`font-bold text-sm w-14 text-right ${isAboveAvg ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                {data.visitors > 0 ? `${data.rate}%` : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isAboveAvg ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              style={{ width: `${data.visitors > 0 ? barWidth : 0}%` }}
                            />
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-zinc-400"
                              style={{ left: `${(avgRate / Math.max(avgRate * 1.5, 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-zinc-400" />
                      <span>Average</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-2 bg-emerald-500 rounded" />
                      <span>Above avg</span>
                    </div>
                    <span>Last 7 days</span>
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
                        {conversionInsights.summary.totalVisitors.toLocaleString()}
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

                  {/* Segment breakdowns with horizontal bars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* By Referrer Type */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Referrer</h3>
                      <div className="space-y-2">
                        {conversionInsights.byReferrerType.slice(0, 5).map((row) => {
                          const avgRate = conversionInsights.summary.overallRate;
                          const isAboveAvg = row.rate >= avgRate;
                          const barWidth = Math.min(100, (row.rate / Math.max(avgRate * 1.5, 1)) * 100);
                          return (
                            <div key={row.name}>
                              <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[100px]">{row.name}</span>
                                <span className={`font-bold text-sm ${isAboveAvg ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                  {row.rate}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isAboveAvg ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* By Landing Page */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Page</h3>
                      <div className="space-y-2">
                        {conversionInsights.byLandingPage.slice(0, 5).map((row) => {
                          const avgRate = conversionInsights.summary.overallRate;
                          const isAboveAvg = row.rate >= avgRate;
                          const barWidth = Math.min(100, (row.rate / Math.max(avgRate * 1.5, 1)) * 100);
                          return (
                            <div key={row.name}>
                              <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[100px]">{row.name}</span>
                                <span className={`font-bold text-sm ${isAboveAvg ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                  {row.rate}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isAboveAvg ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* By Country */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Country</h3>
                      <div className="space-y-2">
                        {conversionInsights.byCountry.slice(0, 5).map((row) => {
                          const avgRate = conversionInsights.summary.overallRate;
                          const isAboveAvg = row.rate >= avgRate;
                          const barWidth = Math.min(100, (row.rate / Math.max(avgRate * 1.5, 1)) * 100);
                          return (
                            <div key={row.name}>
                              <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[100px]">{row.name}</span>
                                <span className={`font-bold text-sm ${isAboveAvg ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                  {row.rate}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isAboveAvg ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Time-based heatmaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* By Day of Week - Horizontal heatmap */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Day of Week</h3>
                      <div className="flex gap-1">
                        {conversionInsights.byDayOfWeek.map((row) => {
                          const avgRate = conversionInsights.summary.overallRate;
                          const intensity = Math.min(1, row.rate / (avgRate * 1.5));
                          const isAboveAvg = row.rate >= avgRate;
                          return (
                            <div key={row.name} className="flex-1 group relative">
                              <div
                                className={`h-12 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                                  isAboveAvg
                                    ? 'text-white'
                                    : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                                style={{
                                  backgroundColor: isAboveAvg
                                    ? `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`
                                    : `rgba(99, 102, 241, ${0.1 + intensity * 0.3})`
                                }}
                              >
                                {row.rate}%
                              </div>
                              <div className="text-[10px] text-zinc-500 text-center mt-1">{row.name.slice(0, 3)}</div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                                <div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  {row.name}: {row.converted}/{row.visitors}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* By Hour - Bar chart */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">By Hour (EST)</h3>
                      {(() => {
                        const hourData = conversionInsights.byHourOfDay;
                        const maxRate = Math.max(...hourData.map(h => h.rate), 1);
                        const avgRate = conversionInsights.summary.overallRate;
                        return (
                          <div className="relative h-16">
                            {/* Average line */}
                            <div
                              className="absolute w-full border-t border-dashed border-zinc-400"
                              style={{ bottom: `${(avgRate / maxRate) * 100}%` }}
                            />
                            <div className="flex items-end h-full gap-px">
                              {hourData.map((row) => {
                                const height = (row.rate / maxRate) * 100;
                                const isAboveAvg = row.rate >= avgRate;
                                return (
                                  <div key={row.name} className="flex-1 group relative">
                                    <div
                                      className={`w-full rounded-t transition-colors ${isAboveAvg ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                                      style={{ height: `${Math.max(height, 2)}%` }}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                                      <div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                        {row.name}: {row.rate}% ({row.converted}/{row.visitors})
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
                              <span>12am</span>
                              <span>6am</span>
                              <span>12pm</span>
                              <span>6pm</span>
                              <span>11pm</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-2 bg-emerald-500 rounded" />
                      <span>Above avg</span>
                    </div>
                    <span>Last 7 days</span>
                  </div>
                </div>
              </div>
            )}
            </>
            )}

            {/* Funnel Tab - Analysis Completion/Abandonment */}
            {activeTab === "funnel" && analysisCompletionMetrics && (
              <div className="space-y-8">
                {/* Data Quality Notice */}
                {analysisCompletionMetrics.trackingSince && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
                    Session tracking active since {analysisCompletionMetrics.trackingSince}. Correlated metrics require matched session IDs.
                  </div>
                )}

                {/* Overview Stats - Row 1: Core Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Analyses Started"
                    value={analysisCompletionMetrics.overall.started}
                    subtitle="Last 7 days"
                    accent="indigo"
                    tooltip="Total number of analysis requests initiated (user clicked Analyze)"
                  />
                  <StatCard
                    title="Completed (Correlated)"
                    value={analysisCompletionMetrics.overall.correlatedCompleted}
                    subtitle={`${analysisCompletionMetrics.overall.correlatedRate}% success rate`}
                    accent="emerald"
                    tooltip="Analyses that completed successfully, matched by session ID to their start event"
                  />
                  <StatCard
                    title="Abandoned"
                    value={analysisCompletionMetrics.overall.abandoned}
                    subtitle={`${analysisCompletionMetrics.overall.abandonmentRate}% of started`}
                    accent={analysisCompletionMetrics.overall.abandonmentRate <= 10 ? "emerald" : analysisCompletionMetrics.overall.abandonmentRate <= 25 ? "amber" : "rose"}
                    tooltip="Users who started analysis but left before completion (no matching completion event)"
                  />
                  <StatCard
                    title="Failed"
                    value={analysisCompletionMetrics.overall.failed}
                    subtitle="Errors returned"
                    accent={analysisCompletionMetrics.overall.failed === 0 ? "emerald" : "rose"}
                    tooltip="Analyses that returned an error (invalid URL, extraction failed, etc.)"
                  />
                </div>

                {/* Row 2: Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Avg Time to Complete"
                    value={`${analysisCompletionMetrics.overall.avgTimeToComplete}s`}
                    subtitle={analysisCompletionMetrics.overall.avgTimeToComplete <= 5 ? "Fast" : analysisCompletionMetrics.overall.avgTimeToComplete <= 10 ? "Moderate" : "Slow"}
                    accent={analysisCompletionMetrics.overall.avgTimeToComplete <= 5 ? "emerald" : analysisCompletionMetrics.overall.avgTimeToComplete <= 10 ? "amber" : "rose"}
                    tooltip="Average seconds from clicking Analyze to receiving results"
                  />
                  <StatCard
                    title="Success Rate"
                    value={`${analysisCompletionMetrics.overall.correlatedRate}%`}
                    subtitle={analysisCompletionMetrics.overall.correlatedRate >= 90 ? "Healthy" : analysisCompletionMetrics.overall.correlatedRate >= 75 ? "Moderate" : "Needs attention"}
                    accent={analysisCompletionMetrics.overall.correlatedRate >= 90 ? "emerald" : analysisCompletionMetrics.overall.correlatedRate >= 75 ? "amber" : "rose"}
                    tooltip="Percentage of started analyses that completed successfully (correlated by session)"
                  />
                </div>

                {/* Error Breakdown */}
                {analysisCompletionMetrics.errorBreakdown && analysisCompletionMetrics.errorBreakdown.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Error Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {analysisCompletionMetrics.errorBreakdown.map((error) => (
                        <div key={error.type} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                          <div className="text-2xl font-bold text-rose-600">{error.count}</div>
                          <div className="text-xs text-zinc-500">{error.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Device Type */}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Completion by Device</h3>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Device</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Started</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Completed</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Abandoned</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Rate</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Visual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {(["mobile", "tablet", "desktop"] as const).map((device) => {
                          const data = analysisCompletionMetrics.byDevice[device];
                          const rate = data.completionRate;
                          return (
                            <tr key={device} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                              <td className="px-4 py-3 font-medium capitalize">{device}</td>
                              <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{data.started}</td>
                              <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{data.completed}</td>
                              <td className="px-4 py-3 text-right text-amber-600">{data.abandoned}</td>
                              <td className={`px-4 py-3 text-right font-semibold ${rate >= 90 ? "text-emerald-600" : rate >= 75 ? "text-amber-600" : "text-rose-600"}`}>
                                {rate}%
                              </td>
                              <td className="px-4 py-3">
                                <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* By OS */}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Completion by OS</h3>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">OS</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Started</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Completed</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Abandoned</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Rate</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Visual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {(["iOS", "Android", "macOS", "Windows", "Linux", "Other"] as const)
                          .filter((os) => analysisCompletionMetrics.byOS[os].started > 0)
                          .map((os) => {
                            const data = analysisCompletionMetrics.byOS[os];
                            const rate = data.completionRate;
                            return (
                              <tr key={os} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                <td className="px-4 py-3 font-medium">{os}</td>
                                <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{data.started}</td>
                                <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{data.completed}</td>
                                <td className="px-4 py-3 text-right text-amber-600">{data.abandoned}</td>
                                <td className={`px-4 py-3 text-right font-semibold ${rate >= 90 ? "text-emerald-600" : rate >= 75 ? "text-amber-600" : "text-rose-600"}`}>
                                  {rate}%
                                </td>
                                <td className="px-4 py-3">
                                  <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                                      style={{ width: `${rate}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* By Analysis Type */}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Completion by Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(["url", "image"] as const).map((type) => {
                      const data = analysisCompletionMetrics.byAnalysisType[type];
                      return (
                        <div key={type} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">{type === "url" ? "URL Analysis" : "Image Upload"}</span>
                            <span className={`text-lg font-bold ${data.completionRate >= 90 ? "text-emerald-600" : data.completionRate >= 75 ? "text-amber-600" : "text-rose-600"}`}>
                              {data.completionRate}%
                            </span>
                          </div>
                          <div className="text-sm text-zinc-500 mb-2">
                            {data.completed} of {data.started} completed
                          </div>
                          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${data.completionRate >= 90 ? "bg-emerald-500" : data.completionRate >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${data.completionRate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Trend */}
                {analysisCompletionMetrics.dailyTrend.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Daily Trend (14 days)</h3>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                      <div className="h-48 flex items-end gap-1">
                        {analysisCompletionMetrics.dailyTrend.map((day, i) => {
                          const maxValue = Math.max(...analysisCompletionMetrics.dailyTrend.map(d => Math.max(d.started, d.completed)), 1);
                          const startedHeight = (day.started / maxValue) * 100;
                          const completedHeight = (day.completed / maxValue) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                              <div className="w-full flex gap-0.5 items-end" style={{ height: "160px" }}>
                                <div
                                  className="flex-1 bg-indigo-200 dark:bg-indigo-900 rounded-t"
                                  style={{ height: `${startedHeight}%` }}
                                  title={`Started: ${day.started}`}
                                />
                                <div
                                  className="flex-1 bg-emerald-500 rounded-t"
                                  style={{ height: `${completedHeight}%` }}
                                  title={`Completed: ${day.completed}`}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-400">{day.date.slice(5)}</span>
                              {/* Hover tooltip */}
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {day.rate}% rate ({day.completed}/{day.started})
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-indigo-200 dark:bg-indigo-900 rounded" />
                          <span>Started</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded" />
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Note */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>About this data:</strong> This tracks users who start an analysis (click button) vs. those who receive results.
                      High abandonment rates suggest users are leaving during the ~5s loading time. Mobile users may be more likely to
                      abandon due to slower connections or shorter attention spans.
                    </div>
                  </div>
                </div>

                {/* Abandonment Diagnostics Section */}
                {abandonmentDiagnostics && abandonmentDiagnostics.summary.totalAbandoned > 0 && (
                  <>
                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Abandonment Diagnostics</h2>

                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <StatCard
                          title="Total Abandoned"
                          value={abandonmentDiagnostics.summary.totalAbandoned}
                          subtitle="Last 7 days"
                          accent="rose"
                        />
                        <StatCard
                          title="Avg Time to Abandon"
                          value={`${abandonmentDiagnostics.summary.avgTimeToAbandon}s`}
                          subtitle="Mean duration"
                          accent={abandonmentDiagnostics.summary.avgTimeToAbandon < 5 ? "amber" : abandonmentDiagnostics.summary.avgTimeToAbandon < 10 ? "amber" : "rose"}
                        />
                        <StatCard
                          title="Median Time"
                          value={`${abandonmentDiagnostics.summary.medianTimeToAbandon}s`}
                          subtitle="50th percentile"
                          accent="indigo"
                        />
                        <StatCard
                          title="Top Reason"
                          value={abandonmentDiagnostics.summary.mostCommonReason}
                          subtitle="Most common"
                          accent="purple"
                        />
                        <StatCard
                          title="Worst Connection"
                          value={abandonmentDiagnostics.summary.highestAbandonConnection.split(' ')[0]}
                          subtitle={abandonmentDiagnostics.summary.highestAbandonConnection.includes('(') ? abandonmentDiagnostics.summary.highestAbandonConnection.split('(')[1]?.replace(')', '') : 'Highest abandon rate'}
                          accent="amber"
                        />
                      </div>

                      {/* Time-to-Abandon Distribution */}
                      {abandonmentDiagnostics.timeDistribution.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Time to Abandon Distribution</h3>
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                            <div className="grid grid-cols-4 gap-4">
                              {abandonmentDiagnostics.timeDistribution.map((bucket) => (
                                <div key={bucket.bucket} className="text-center">
                                  <div className="relative h-24 mb-2">
                                    <div
                                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-16 rounded-t ${
                                        bucket.bucket === '0-5s' ? 'bg-rose-500' :
                                        bucket.bucket === '5-10s' ? 'bg-amber-500' :
                                        bucket.bucket === '10-30s' ? 'bg-indigo-500' : 'bg-zinc-400'
                                      }`}
                                      style={{ height: `${Math.max(bucket.percentage, 5)}%` }}
                                    />
                                  </div>
                                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{bucket.count}</div>
                                  <div className="text-xs text-zinc-500">{bucket.bucket}</div>
                                  <div className="text-xs text-zinc-400">{bucket.percentage}%</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 text-xs text-zinc-500 text-center">
                              {abandonmentDiagnostics.timeDistribution[0]?.bucket === '0-5s' && abandonmentDiagnostics.timeDistribution[0]?.percentage > 40 && (
                                <span className="text-amber-600">⚠️ High early abandonment - users may not understand loading is happening</span>
                              )}
                              {abandonmentDiagnostics.timeDistribution.find(b => b.bucket === '30s+')?.percentage || 0 > 30 && (
                                <span className="text-rose-600">⚠️ Many users waiting 30s+ - consider speed optimizations</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reason Breakdown */}
                      {abandonmentDiagnostics.reasonBreakdown.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Abandon Reason Breakdown</h3>
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Reason</th>
                                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Count</th>
                                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">%</th>
                                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Visual</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {abandonmentDiagnostics.reasonBreakdown.map((reason) => (
                                  <tr key={reason.reason} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                    <td className="px-4 py-3 font-medium capitalize">{reason.reason.replace('_', ' ')}</td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{reason.count}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-rose-600">{reason.percentage}%</td>
                                    <td className="px-4 py-3">
                                      <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${reason.percentage}%` }} />
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Duration Correlation Chart */}
                      {abandonmentDiagnostics.durationCorrelation.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Abandonment Rate by Duration</h3>
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                            <div className="flex items-end gap-2 h-40">
                              {abandonmentDiagnostics.durationCorrelation.map((bucket) => {
                                const total = bucket.totalCompleted + bucket.totalAbandoned;
                                const completedHeight = total > 0 ? (bucket.totalCompleted / total) * 100 : 0;
                                const abandonedHeight = total > 0 ? (bucket.totalAbandoned / total) * 100 : 0;
                                return (
                                  <div key={bucket.durationBucket} className="flex-1 flex flex-col items-center group relative">
                                    <div className="w-full flex flex-col items-center" style={{ height: "120px" }}>
                                      <div className="w-full flex flex-col-reverse" style={{ height: "100%" }}>
                                        <div
                                          className="w-full bg-emerald-500 rounded-b"
                                          style={{ height: `${completedHeight}%` }}
                                        />
                                        <div
                                          className="w-full bg-rose-500 rounded-t"
                                          style={{ height: `${abandonedHeight}%` }}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-xs text-zinc-500 mt-2">{bucket.durationBucket}</span>
                                    <span className={`text-xs font-semibold ${bucket.abandonRate > 30 ? 'text-rose-600' : bucket.abandonRate > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                      {bucket.abandonRate}%
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      {bucket.totalCompleted} completed, {bucket.totalAbandoned} abandoned
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-zinc-500">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded" />
                                <span>Completed</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-rose-500 rounded" />
                                <span>Abandoned</span>
                              </div>
                            </div>
                            <div className="mt-4 text-xs text-zinc-500 text-center">
                              Shows abandon rate for analyses by how long they took. Higher rates at longer durations suggest impatience.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Connection Quality */}
                      {abandonmentDiagnostics.connectionBreakdown.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Abandonment by Connection Quality</h3>
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Connection</th>
                                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Effective Type</th>
                                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Abandoned</th>
                                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Abandon Rate</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {abandonmentDiagnostics.connectionBreakdown.slice(0, 6).map((conn, i) => (
                                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                    <td className="px-4 py-3 font-medium">{conn.connectionType}</td>
                                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{conn.effectiveType}</td>
                                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{conn.count}</td>
                                    <td className={`px-4 py-3 text-right font-semibold ${conn.abandonRate > 30 ? 'text-rose-600' : conn.abandonRate > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                      {conn.abandonRate}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "funnel" && !analysisCompletionMetrics && (
              <div className="text-center py-12 text-zinc-500">
                <p>No funnel data available yet. Data will appear once users start analyzing content.</p>
              </div>
            )}

            {/* Retention Tab */}
            {activeTab === "retention" && retentionMetrics && (
              <div className="space-y-8">
                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title={`Return Rate (${retentionMetrics.rollingReturnRate.windowDays}d+)`}
                    value={`${retentionMetrics.rollingReturnRate.rate}%`}
                    subtitle={`${retentionMetrics.rollingReturnRate.returnedUsers} of ${retentionMetrics.rollingReturnRate.eligibleUsers} users`}
                    tooltip={`Of users who first visited ${retentionMetrics.rollingReturnRate.windowDays}+ days ago, what % came back at least once? Higher = better retention.`}
                  />
                  <StatCard
                    title="DAU/MAU Ratio"
                    value={`${retentionMetrics.stickiness.dauMauRatio}%`}
                    subtitle={`${retentionMetrics.stickiness.dau} avg daily / ${retentionMetrics.stickiness.mau} monthly`}
                    tooltip="Average Daily Active Users (last 7 days) / Monthly Active Users. Measures how often your monthly users come back daily. 10-20% is typical, 25%+ is strong engagement."
                  />
                  <StatCard
                    title="DAU/WAU Ratio"
                    value={`${retentionMetrics.stickiness.dauWauRatio}%`}
                    subtitle={`${retentionMetrics.stickiness.dau} avg daily / ${retentionMetrics.stickiness.wau} weekly`}
                    tooltip="Average Daily Active Users (last 7 days) / Weekly Active Users. Higher ratio means users visit more frequently within a week."
                  />
                  <StatCard
                    title="Multi-Visit Users"
                    value={retentionMetrics.frequencyDistribution.total - retentionMetrics.frequencyDistribution.visits1}
                    subtitle={`of ${retentionMetrics.frequencyDistribution.total} total (30d)`}
                    tooltip="Users who visited on 2+ different days in the last 30 days. These are your engaged returning users."
                  />
                </div>

                {/* Frequency Distribution */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Visit Frequency Distribution (Last 30 Days)
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "1 visit", value: retentionMetrics.frequencyDistribution.visits1, color: "bg-zinc-400" },
                      { label: "2-3 visits", value: retentionMetrics.frequencyDistribution.visits2to3, color: "bg-blue-500" },
                      { label: "4-10 visits", value: retentionMetrics.frequencyDistribution.visits4to10, color: "bg-indigo-500" },
                      { label: "10+ visits", value: retentionMetrics.frequencyDistribution.visits10plus, color: "bg-emerald-500" },
                    ].map((item) => {
                      const pct = retentionMetrics.frequencyDistribution.total > 0
                        ? (item.value / retentionMetrics.frequencyDistribution.total) * 100
                        : 0;
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="w-20 text-xs text-zinc-500 dark:text-zinc-400">{item.label}</span>
                          <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                            <div
                              className={`h-full ${item.color} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-16 text-xs font-medium text-zinc-700 dark:text-zinc-300 text-right">
                            {item.value} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cohort Retention Table */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Cohort Retention (by First Visit Date)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-700">
                          <th className="text-left py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Cohort</th>
                          <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium" title="Number of unique visitors who first visited on this date">Size</th>
                          <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium cursor-help" title="Day 1 Retention: % of cohort who returned within 1 day of their first visit">D1</th>
                          <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium cursor-help" title="Day 7 Retention: % of cohort who returned within 7 days of their first visit">D7</th>
                          <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium cursor-help" title="Day 14 Retention: % of cohort who returned within 14 days of their first visit">D14</th>
                          <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium cursor-help" title="Day 30 Retention: % of cohort who returned within 30 days of their first visit">D30</th>
                        </tr>
                      </thead>
                      <tbody>
                        {retentionMetrics.cohortRetention.map((cohort) => (
                          <tr key={cohort.cohortDate} className="border-b border-zinc-100 dark:border-zinc-800">
                            <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">{cohort.cohortDate}</td>
                            <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 text-right">{cohort.cohortSize}</td>
                            <td className="py-2 px-3 text-right">
                              <span className={`${cohort.d1 > 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                                {cohort.d1}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={`${cohort.d7 > 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                                {cohort.d7}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={`${cohort.d14 > 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                                {cohort.d14}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={`${cohort.d30 > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                                {cohort.d30}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {retentionMetrics.cohortRetention.length === 0 && (
                    <p className="text-center text-zinc-500 py-4">No cohort data available yet</p>
                  )}
                </div>

                {/* Benchmarks */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Industry Benchmarks</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                    <div><strong>DAU/MAU:</strong> 10-20% typical, 25%+ strong</div>
                    <div><strong>D1 Retention:</strong> 25-40% good for apps</div>
                    <div><strong>D7 Retention:</strong> 10-20% good for apps</div>
                    <div><strong>Return Rate:</strong> 20%+ is strong for tools</div>
                  </div>
                </div>
              </div>
            )}

            {/* Shares Tab */}
            {activeTab === "shares" && shareMetrics && (
              <div className="space-y-8">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard
                    title="Total Shares"
                    value={shareMetrics.overview.totalShares}
                    subtitle={`${shareMetrics.overview.todayShares} today`}
                    tooltip="Total number of share button clicks across all time"
                  />
                  <StatCard
                    title="Unique Sharers"
                    value={shareMetrics.overview.uniqueSharers}
                    subtitle={`${shareMetrics.overview.weekShares} this week`}
                    tooltip="Number of distinct users who have shared at least once"
                  />
                  <StatCard
                    title="Share Rate"
                    value={`${shareMetrics.overview.shareRate}%`}
                    subtitle="of analyzers share"
                    tooltip="Percentage of users who analyzed content and then shared it. Higher = more viral potential."
                    accent="emerald"
                  />
                  <StatCard
                    title="Shares/Sharer"
                    value={shareMetrics.overview.avgSharesPerSharer}
                    subtitle="avg per user"
                    tooltip="Average number of times each sharer shares. Higher = power users are engaged."
                  />
                  <StatCard
                    title="K-Factor"
                    value={shareMetrics.kFactor.kFactorValue}
                    subtitle={shareMetrics.kFactor.kFactorValue >= 1 ? "Viral!" : "Sub-viral"}
                    accent={shareMetrics.kFactor.kFactorValue >= 1 ? "emerald" : "amber"}
                    tooltip="Viral coefficient: (share rate) × (conversion from shares). K > 1 means viral growth where each user brings in more than 1 new user."
                  />
                  <StatCard
                    title="Est. Conversion"
                    value={`${shareMetrics.kFactor.estimatedConversion}%`}
                    subtitle="from shares"
                    tooltip="Estimated percentage of share recipients who visit the site. Based on referral traffic patterns."
                  />
                </div>

                {/* Share Attribution - How effective are shares at bringing users */}
                {shareMetrics.attribution && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                      Share Attribution
                      <span className="ml-2 text-[10px] font-normal normal-case text-zinc-400">
                        Track where visitors come from after seeing shared content
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {shareMetrics.attribution.qrScans}
                        </div>
                        <div className="text-xs text-zinc-500">QR Code Scans</div>
                        <div className="text-[10px] text-zinc-400">{shareMetrics.attribution.qrScansWeek} this week</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                          {shareMetrics.attribution.twitterReferrals}
                        </div>
                        <div className="text-xs text-zinc-500">X/Twitter Referrals</div>
                        <div className="text-[10px] text-zinc-400">{shareMetrics.attribution.twitterReferralsWeek} this week</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-[#1877F2]">
                          {shareMetrics.attribution.facebookReferrals}
                        </div>
                        <div className="text-xs text-zinc-500">Facebook Referrals</div>
                        <div className="text-[10px] text-zinc-400">{shareMetrics.attribution.facebookReferralsWeek} this week</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-[#0A66C2]">
                          {shareMetrics.attribution.linkedinReferrals}
                        </div>
                        <div className="text-xs text-zinc-500">LinkedIn Referrals</div>
                        <div className="text-[10px] text-zinc-400">{shareMetrics.attribution.linkedinReferralsWeek} this week</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {shareMetrics.attribution.totalAttributed}
                        </div>
                        <div className="text-xs text-zinc-500">Total From Shares</div>
                        <div className="text-[10px] text-zinc-400">{shareMetrics.attribution.totalAttributedWeek} this week</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {shareMetrics.attribution.conversionFromQr}%
                        </div>
                        <div className="text-xs text-zinc-500">QR → Analyze</div>
                        <div className="text-[10px] text-zinc-400">conversion rate</div>
                      </div>
                    </div>
                    {shareMetrics.attribution.totalAttributed === 0 && (
                      <p className="mt-4 text-xs text-zinc-400 text-center">
                        No attributed visits yet. Shares include a QR code that tracks scans (utm_source=qr).
                      </p>
                    )}
                  </div>
                )}

                {/* Share Method & Score Distribution Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* How People Share */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">How People Share</h3>
                    {shareMetrics.shareTypes.length > 0 ? (
                      <div className="space-y-4">
                        {shareMetrics.shareTypes.map((type) => {
                          const colors: Record<string, string> = {
                            copy_link: "bg-blue-500",
                            'Copy Link': "bg-blue-500",
                            share_image_success: "bg-emerald-500",
                            'Share X': "bg-sky-500",
                            'Share Bluesky': "bg-blue-600",
                            'Share Facebook': "bg-[#1877F2]",
                            'Share LinkedIn': "bg-[#0A66C2]",
                            'Download Image': "bg-purple-500",
                            'Copy Image': "bg-indigo-500",
                            'Web Share': "bg-amber-500",
                            native: "bg-teal-500",
                            'ClearView X': "bg-sky-500",
                            'ClearView Bluesky': "bg-blue-600",
                            'ClearView Facebook': "bg-[#1877F2]",
                            'ClearView LinkedIn': "bg-[#0A66C2]",
                            'ClearView Copy Link': "bg-blue-500",
                            'ClearView Web Share': "bg-amber-500",
                          };
                          const info = SHARE_TYPE_INFO[type.type];
                          return (
                            <div key={type.type} className="space-y-1">
                              <div className="flex items-center gap-3">
                                <div className="w-28 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                  {info?.label || formatShareType(type.type)}
                                </div>
                                <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${colors[type.type] || "bg-zinc-400"} rounded-full transition-all`}
                                    style={{ width: `${type.percentage}%` }}
                                  />
                                </div>
                                <div className="w-20 text-right text-sm text-zinc-600 dark:text-zinc-400">
                                  {type.count} ({type.percentage}%)
                                </div>
                              </div>
                              {info?.description && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 ml-0 pl-0">
                                  {info.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-zinc-500 py-4">No share data yet</p>
                    )}
                  </div>

                  {/* What Content Gets Shared */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Score Distribution of Shared Content</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Low (0-33)", value: shareMetrics.scoreDistribution.low, color: "bg-emerald-500" },
                        { label: "Medium (34-66)", value: shareMetrics.scoreDistribution.medium, color: "bg-amber-500" },
                        { label: "High (67-100)", value: shareMetrics.scoreDistribution.high, color: "bg-rose-500" },
                        { label: "Unknown", value: shareMetrics.scoreDistribution.unknown, color: "bg-zinc-400" },
                      ].map((item) => {
                        const total = shareMetrics.scoreDistribution.low + shareMetrics.scoreDistribution.medium + shareMetrics.scoreDistribution.high + shareMetrics.scoreDistribution.unknown;
                        const pct = total > 0 ? (item.value / total) * 100 : 0;
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className="w-28 text-sm text-zinc-600 dark:text-zinc-400">{item.label}</div>
                            <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="w-20 text-right text-sm text-zinc-600 dark:text-zinc-400">
                              {item.value} ({pct.toFixed(1)}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-xs text-zinc-500">
                      {shareMetrics.scoreDistribution.high > shareMetrics.scoreDistribution.low
                        ? "Users share high-rage content more often - outrage drives sharing"
                        : "Users share across all score ranges"}
                    </p>
                  </div>
                </div>

                {/* Sharer Segmentation */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Sharer Segmentation</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{shareMetrics.sharerSegmentation.oneTime}</div>
                      <div className="text-sm text-zinc-500">One-time</div>
                      <div className="text-xs text-zinc-400">shared once</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{shareMetrics.sharerSegmentation.occasional}</div>
                      <div className="text-sm text-zinc-500">Occasional</div>
                      <div className="text-xs text-zinc-400">2-3 shares</div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{shareMetrics.sharerSegmentation.frequent}</div>
                      <div className="text-sm text-zinc-500">Frequent</div>
                      <div className="text-xs text-zinc-400">4-10 shares</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{shareMetrics.sharerSegmentation.power}</div>
                      <div className="text-sm text-zinc-500">Power</div>
                      <div className="text-xs text-zinc-400">10+ shares</div>
                    </div>
                  </div>
                  {shareMetrics.sharerSegmentation.power > 0 && (
                    <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
                      You have {shareMetrics.sharerSegmentation.power} power sharer{shareMetrics.sharerSegmentation.power !== 1 ? "s" : ""} - these are your viral champions!
                    </p>
                  )}

                  {/* Individual Sharer Table */}
                  {shareMetrics.sharerDetails && shareMetrics.sharerDetails.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wide">Individual Sharers</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-700">
                              <th className="text-left py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">User (IP)</th>
                              <th className="text-center py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Shares</th>
                              <th className="text-center py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Segment</th>
                              <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">First Share</th>
                              <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Last Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shareMetrics.sharerDetails.map((sharer, idx) => (
                              <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                                <td className="py-2 px-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{sharer.ipMasked}</td>
                                <td className="py-2 px-3 text-center font-semibold text-zinc-900 dark:text-zinc-100">{sharer.shareCount}</td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    sharer.segment === 'power'
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                      : sharer.segment === 'frequent'
                                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                        : sharer.segment === 'occasional'
                                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                  }`}>
                                    {sharer.segment}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right text-xs text-zinc-500 dark:text-zinc-400">
                                  {new Date(sharer.firstShareAt).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
                                </td>
                                <td className="py-2 px-3 text-right text-xs text-zinc-500 dark:text-zinc-400">
                                  {new Date(sharer.lastShareAt).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Shared Content */}
                {shareMetrics.topSharedContent.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Top Shared URLs</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-700">
                            <th className="text-left py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">URL</th>
                            <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Shares</th>
                            <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Unique</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shareMetrics.topSharedContent.slice(0, 10).map((item, idx) => (
                            <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                              <td className="py-2 px-3">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline block truncate max-w-lg"
                                  title={item.url}
                                >
                                  {item.url.length > 70 ? item.url.substring(0, 70) + "..." : item.url}
                                </a>
                              </td>
                              <td className="py-2 px-3 text-right text-zinc-700 dark:text-zinc-300">{item.shareCount}</td>
                              <td className="py-2 px-3 text-right text-zinc-700 dark:text-zinc-300">{item.uniqueSharers}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Share Trends Chart */}
                {shareMetrics.dailyTrend.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Daily Share Trend (14 days)</h3>
                    <div className="flex items-end gap-1 h-32">
                      {shareMetrics.dailyTrend.map((day, idx) => {
                        const maxShares = Math.max(...shareMetrics.dailyTrend.map(d => d.shares), 1);
                        const height = (day.shares / maxShares) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group">
                            <div className="relative w-full flex flex-col items-center">
                              <div
                                className="w-full bg-indigo-500 rounded-t transition-all group-hover:bg-indigo-600"
                                style={{ height: `${height}%`, minHeight: day.shares > 0 ? '4px' : '1px' }}
                                title={`${day.date}: ${day.shares} shares`}
                              />
                            </div>
                            {idx % 2 === 0 && (
                              <span className="text-[10px] text-zinc-400 mt-1 rotate-45 origin-left">
                                {day.date.slice(5)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Benchmarks */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Industry Benchmarks</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                    <div><strong>Share Rate:</strong> 5-15% typical, 20%+ viral</div>
                    <div><strong>K-Factor:</strong> &lt;1 sub-viral, &gt;1 viral growth</div>
                    <div><strong>Power Sharers:</strong> Top 10% drive 80% of shares</div>
                    <div><strong>Conversion:</strong> 10-30% from shared links</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "shares" && !shareMetrics && (
              <div className="text-center py-12 text-zinc-500">
                No share metrics available
              </div>
            )}

            {/* Content Tab */}
            {activeTab === "content" && contentInsights && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Content Insights
                </h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Understand what content users analyze and share. Topic/content categorization is extracted by AI during analysis.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Topics Tracked"
                    value={contentInsights.topicDistribution.length}
                    subtitle="unique topics detected"
                    tooltip="Number of distinct topics identified by AI during content analysis"
                  />
                  <StatCard
                    title="Top Topic"
                    value={contentInsights.topicDistribution[0]?.topic || "N/A"}
                    subtitle={`${contentInsights.topicDistribution[0]?.count || 0} analyses`}
                    tooltip="Most frequently analyzed topic"
                  />
                  <StatCard
                    title="Highest Rage Topic"
                    value={contentInsights.highRageTopics[0]?.topic || "N/A"}
                    subtitle={`avg score: ${contentInsights.highRageTopics[0]?.avgScore || 0}`}
                    accent="rose"
                    tooltip="Topic with highest average rage score"
                  />
                  <StatCard
                    title="Most Shared Topic"
                    value={contentInsights.mostSharedTopics[0]?.topic || "N/A"}
                    subtitle={`${contentInsights.mostSharedTopics[0]?.shareRate || 0}% share rate`}
                    accent="emerald"
                    tooltip="Topic with highest share rate (shares / analyses)"
                  />
                </div>

                {/* Topic Distribution */}
                {contentInsights.topicDistribution.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Topic Distribution</h3>
                    <div className="space-y-3">
                      {contentInsights.topicDistribution.map((topic, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-32 text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {topic.topic.replace(/_/g, ' ')}
                          </div>
                          <div className="flex-1">
                            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${topic.percentage}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                {topic.count} ({topic.percentage}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-20 text-right text-xs text-zinc-500">
                            avg: {topic.avgScore}
                          </div>
                          <div className="w-16 text-right text-xs text-emerald-600 dark:text-emerald-400">
                            {topic.shareCount} shares
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Two-column layout: Content Type + Source Type */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Content Type Distribution */}
                  {contentInsights.contentTypeDistribution.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Content Type</h3>
                      <div className="space-y-2">
                        {contentInsights.contentTypeDistribution.map((ct, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {ct.contentType.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {ct.count}
                              </span>
                              <span className="text-xs text-zinc-500">
                                ({ct.percentage}%)
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                ct.avgScore >= 67 ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                                ct.avgScore >= 34 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                                'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                avg: {ct.avgScore}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source Type Distribution */}
                  {contentInsights.sourceTypeDistribution.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Source Type</h3>
                      <div className="space-y-2">
                        {contentInsights.sourceTypeDistribution.map((st, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {st.sourceType.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {st.count}
                              </span>
                              <span className="text-xs text-zinc-500">
                                ({st.percentage}%)
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                st.avgScore >= 67 ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                                st.avgScore >= 34 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                                'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                avg: {st.avgScore}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Domains */}
                {contentInsights.topDomains.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Top Analyzed Domains</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-700">
                            <th className="text-left py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Domain</th>
                            <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Analyses</th>
                            <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Avg Score</th>
                            <th className="text-right py-2 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Shares</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contentInsights.topDomains.slice(0, 15).map((domain, idx) => (
                            <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                              <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">{domain.domain}</td>
                              <td className="py-2 px-3 text-right text-zinc-900 dark:text-zinc-100 font-medium">{domain.count}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  domain.avgScore >= 67 ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                                  domain.avgScore >= 34 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                                  'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                }`}>
                                  {domain.avgScore}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">{domain.shareCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Insights cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* High Rage Topics */}
                  {contentInsights.highRageTopics.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-rose-200 dark:border-rose-800">
                      <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                        Highest Rage Topics
                      </h3>
                      <div className="space-y-3">
                        {contentInsights.highRageTopics.map((topic, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {topic.topic.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">{topic.count} analyses</span>
                              <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-full">
                                {topic.avgScore} avg
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Most Shared Topics */}
                  {contentInsights.mostSharedTopics.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Most Shared Topics
                      </h3>
                      <div className="space-y-3">
                        {contentInsights.mostSharedTopics.map((topic, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {topic.topic.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">{topic.shareCount} / {topic.analyzeCount}</span>
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                                {topic.shareRate}% rate
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Empty state note */}
                {contentInsights.topicDistribution.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500 mb-2">No content categorization data yet</p>
                    <p className="text-sm text-zinc-400">Topic/content data will appear after users analyze content with LLM enhancement enabled</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "content" && !contentInsights && (
              <div className="text-center py-12 text-zinc-500">
                No content insights available
              </div>
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
            </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
            <>
            {/* Time Series Chart (daily) */}
            {visitorStats && visitorStats.timeSeries.length > 0 && (
              <TimeSeriesChart data={visitorStats.timeSeries} />
            )}

            {/* Traffic Sources */}
            {viralMetrics && viralMetrics.referralSources.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
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

            {/* Repeat Users */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                Repeat Users (Multi-Day Visitors)
              </h3>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">IP Address</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Country</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Device</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">First Platform</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">First Referrer</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">1st Day Searches</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Days Returned</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Total Searches</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.repeatUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-4 text-zinc-500 text-center">No repeat users yet</td>
                      </tr>
                    ) : (
                      stats.repeatUsers.map((u, i) => (
                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="py-2 px-3 text-zinc-500 text-xs font-mono">{u.ipAddress}</td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">{u.country || "-"}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              u.device === "mobile" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                              u.device === "tablet" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                              "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}>
                              {u.device}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-xs">{u.firstPlatform}</td>
                          <td className="py-2 px-3 text-zinc-500 text-xs truncate max-w-[150px]" title={u.firstReferrer || "-"}>
                            {u.firstReferrer || "-"}
                          </td>
                          <td className="py-2 px-3 text-zinc-900 dark:text-zinc-100 text-center">{u.firstDaySearches}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              u.isMidnightCrossover
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            }`} title={u.isMidnightCrossover ? "Likely midnight crossover - session < 4 hours" : ""}>
                              {u.totalDays} days{u.isMidnightCrossover ? " ⚠️" : ""}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-zinc-900 dark:text-zinc-100 font-medium text-center">{u.totalSearches}</td>
                          <td className="py-2 px-3 text-zinc-500 text-xs">{formatDateTimeEST(u.lastSeen)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acquisition Metrics */}
            {acquisitionMetrics && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Acquisition (UTM Tracking)
                </h3>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{acquisitionMetrics.summary.totalWithUtm}</div>
                    <div className="text-xs text-zinc-500">With UTM</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{acquisitionMetrics.summary.totalWithReferrer}</div>
                    <div className="text-xs text-zinc-500">With Referrer</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{acquisitionMetrics.summary.totalDirect}</div>
                    <div className="text-xs text-zinc-500">Direct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{acquisitionMetrics.summary.topSource || "-"}</div>
                    <div className="text-xs text-zinc-500">Top Source</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* UTM Sources */}
                  {acquisitionMetrics.sourceBreakdown.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">By Source</h4>
                      <div className="space-y-2">
                        {acquisitionMetrics.sourceBreakdown.map((s, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.source || "(direct)"}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400">{s.percentage.toFixed(0)}%</span>
                              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.visitors}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* UTM Mediums */}
                  {acquisitionMetrics.mediumBreakdown.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">By Medium</h4>
                      <div className="space-y-2">
                        {acquisitionMetrics.mediumBreakdown.map((m, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">{m.medium || "(none)"}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400">{m.percentage.toFixed(0)}%</span>
                              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{m.visitors}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Campaigns */}
                {acquisitionMetrics.topCampaigns.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Top Campaigns</h4>
                    <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800">
                          <tr className="border-b border-zinc-200 dark:border-zinc-700">
                            <th className="text-left py-2 px-3 text-zinc-500 font-medium">Campaign</th>
                            <th className="text-left py-2 px-3 text-zinc-500 font-medium">Source</th>
                            <th className="text-right py-2 px-3 text-zinc-500 font-medium">Visitors</th>
                            <th className="text-right py-2 px-3 text-zinc-500 font-medium">Conversions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {acquisitionMetrics.topCampaigns.map((c, i) => (
                            <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                              <td className="py-2 px-3 text-zinc-900 dark:text-zinc-100 font-medium">{c.campaign}</td>
                              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{c.source || "-"}</td>
                              <td className="py-2 px-3 text-right text-zinc-900 dark:text-zinc-100">{c.visitors}</td>
                              <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">{c.conversions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Referrers */}
                {acquisitionMetrics.referrerBreakdown.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Top Referrers</h4>
                    <div className="space-y-2">
                      {acquisitionMetrics.referrerBreakdown.slice(0, 10).map((r, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[80%]" title={r.referrer || "(direct)"}>
                            {r.referrer || "(direct)"}
                          </span>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{r.visitors}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {acquisitionMetrics.sourceBreakdown.length === 0 &&
                 acquisitionMetrics.mediumBreakdown.length === 0 &&
                 acquisitionMetrics.topCampaigns.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    No UTM data yet. Add ?utm_source=... to your links to track campaigns.
                  </p>
                )}
              </div>
            )}
            </>
            )}
          </>
        ) : null}

        {/* Subscribers Tab */}
        {activeTab === "subscribers" && subscriberStats && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{subscriberStats.total}</div>
                <div className="text-sm text-zinc-500">Total</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-emerald-600">{subscriberStats.active}</div>
                <div className="text-sm text-zinc-500">Active</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-zinc-400">{subscriberStats.unsubscribed}</div>
                <div className="text-sm text-zinc-500">Unsubscribed</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-blue-600">{subscriberStats.today}</div>
                <div className="text-sm text-zinc-500">Today</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-purple-600">{subscriberStats.thisWeek}</div>
                <div className="text-sm text-zinc-500">This Week</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-amber-600">{subscriberStats.thisMonth}</div>
                <div className="text-sm text-zinc-500">This Month</div>
              </div>
            </div>

            {/* Breakdowns Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Source */}
              {subscriberStats.bySource.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">By Source</h3>
                  <div className="space-y-2">
                    {subscriberStats.bySource.map((s, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.source || "direct"}</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Country */}
              {subscriberStats.byCountry.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">By Country</h3>
                  <div className="space-y-2">
                    {subscriberStats.byCountry.map((c, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{c.country || "Unknown"}</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Daily Signups Chart */}
            {subscriberStats.dailySignups.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-500 mb-3">Daily Signups (Last 30 Days)</h3>
                <div className="h-32 flex items-end gap-1">
                  {subscriberStats.dailySignups.map((d, i) => {
                    const max = Math.max(...subscriberStats.dailySignups.map(x => x.count), 1);
                    const height = (d.count / max) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-emerald-500 rounded-t hover:bg-emerald-400 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${d.date}: ${d.count} signups`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-400">
                  <span>{subscriberStats.dailySignups[0]?.date}</span>
                  <span>{subscriberStats.dailySignups[subscriberStats.dailySignups.length - 1]?.date}</span>
                </div>
              </div>
            )}

            {/* Recent Subscribers Table */}
            {subscriberStats.recentSubscribers.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500">Recent Subscribers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Source</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Country</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Subscribed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {subscriberStats.recentSubscribers.map((sub, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                            {sub.email}
                          </td>
                          <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                            {sub.source || "direct"}
                          </td>
                          <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                            {sub.country || "—"}
                          </td>
                          <td className="px-4 py-2 text-sm text-zinc-500">
                            {new Date(sub.subscribedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subscriberStats.total === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">
                No subscribers yet.
              </p>
            )}
          </div>
        )}

        {activeTab === "subscribers" && !subscriberStats && (
          <p className="text-sm text-zinc-500 text-center py-8">
            Loading subscriber data...
          </p>
        )}

        {/* Interactions Tab */}
        {activeTab === "interactions" && interactionStats && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{interactionStats.summary.total.toLocaleString()}</div>
                <div className="text-sm text-zinc-500">Total Interactions</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-blue-600">{interactionStats.summary.today.toLocaleString()}</div>
                <div className="text-sm text-zinc-500">Today</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-purple-600">{interactionStats.summary.thisWeek.toLocaleString()}</div>
                <div className="text-sm text-zinc-500">This Week</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-bold text-emerald-600">{interactionStats.summary.uniqueIPs.toLocaleString()}</div>
                <div className="text-sm text-zinc-500">Unique Users</div>
              </div>
            </div>

            {/* Category & Action Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Category */}
              {interactionStats.byCategory.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">By Category</h3>
                  <div className="space-y-2">
                    {interactionStats.byCategory.map((c, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">{c.category}</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Actions */}
              {interactionStats.byAction.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Top Actions</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {interactionStats.byAction.map((a, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          <span className="font-mono text-xs text-zinc-400">{a.category}/</span>
                          <span className="font-mono">{a.action}</span>
                        </span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{a.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Specific Interaction Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Navigation */}
              {interactionStats.navigation.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Navigation Clicks</h3>
                  <div className="space-y-2">
                    {interactionStats.navigation.map((n, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {n.destination} <span className="text-zinc-400">({n.location})</span>
                        </span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{n.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Card */}
              {interactionStats.shareCard.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Share Card</h3>
                  <div className="space-y-2">
                    {interactionStats.shareCard.map((s, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">{s.action}</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Actions */}
              {interactionStats.inputs.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Input Actions</h3>
                  <div className="space-y-2">
                    {interactionStats.inputs.map((inp, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">{inp.action}</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{inp.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              {interactionStats.externalLinks.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">External Links</h3>
                  <div className="space-y-2">
                    {interactionStats.externalLinks.map((e, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-32">{e.destination}</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{e.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results Interactions */}
            {interactionStats.results.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-500 mb-3">Result Interactions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {interactionStats.results.map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="font-mono">{r.action}</span>
                        {r.label !== "none" && <span className="text-zinc-400 ml-1">({r.label})</span>}
                      </span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Trend Chart */}
            {interactionStats.dailyTrend.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-500 mb-3">Daily Interactions (Last 30 Days)</h3>
                <div className="h-32 flex items-end gap-1">
                  {interactionStats.dailyTrend.map((d, i) => {
                    const max = Math.max(...interactionStats.dailyTrend.map(x => x.count), 1);
                    const height = (d.count / max) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-400 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${d.date}: ${d.count} interactions`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-400">
                  <span>{interactionStats.dailyTrend[0]?.date}</span>
                  <span>{interactionStats.dailyTrend[interactionStats.dailyTrend.length - 1]?.date}</span>
                </div>
              </div>
            )}

            {/* Top Labels */}
            {interactionStats.topLabels.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-500 mb-3">Top Labels/Destinations</h3>
                <div className="flex flex-wrap gap-2">
                  {interactionStats.topLabels.map((l, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400">{l.label}</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{l.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {interactionStats.summary.total === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">
                No interactions tracked yet. Interactions will appear here once users start clicking buttons, links, and other UI elements.
              </p>
            )}
          </div>
        )}

        {activeTab === "interactions" && !interactionStats && (
          <p className="text-sm text-zinc-500 text-center py-8">
            Loading interaction data...
          </p>
        )}

        {/* Languages Tab */}
        {activeTab === "languages" && languageStats && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
              Language Selection (Last 30 Days)
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Non-English Analyses"
                value={languageStats.totalWithLanguage}
              />
              <StatCard
                title="Languages Used"
                value={languageStats.byLanguage.filter(l => l.language !== "English").length}
              />
              <StatCard
                title="Top Language Today"
                value={languageStats.topLanguagesToday[0]?.language || "English"}
                subtitle={languageStats.topLanguagesToday[0] ? `${languageStats.topLanguagesToday[0].count} analyses` : undefined}
              />
              <StatCard
                title="English Usage"
                value={`${languageStats.byLanguage.find(l => l.language === "English")?.percentage || 0}%`}
              />
            </div>

            {/* Language Breakdown */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                Usage by Language
              </h4>
              <div className="space-y-3">
                {languageStats.byLanguage.map((lang, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {lang.language}
                    </div>
                    <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${lang.language === "English" ? "bg-indigo-500" : "bg-emerald-500"}`}
                        style={{ width: `${lang.percentage}%` }}
                      />
                    </div>
                    <div className="w-20 text-right text-sm text-zinc-500">
                      {lang.count} ({lang.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Usage */}
            {languageStats.topLanguagesToday.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Today&apos;s Language Usage
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {languageStats.topLanguagesToday.map((lang, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center"
                    >
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {lang.count}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {lang.language}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "languages" && !languageStats && (
          <p className="text-sm text-zinc-500 text-center py-8">
            Loading language data...
          </p>
        )}

        {activeTab === "defensecheck" && defenseCheckMetrics && (
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">DefenseCheck Metrics</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard title="Total Analyses" value={defenseCheckMetrics.totalAnalyses} />
              <StatCard title="Avg Score" value={defenseCheckMetrics.avgScore} />
              <StatCard title="Categories Detected" value={Object.keys(defenseCheckMetrics.categoryDistribution).length} />
            </div>

            {/* Category Distribution */}
            {Object.keys(defenseCheckMetrics.categoryDistribution).length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Category Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(defenseCheckMetrics.categoryDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => {
                      const maxCount = Math.max(...Object.values(defenseCheckMetrics.categoryDistribution), 1);
                      const width = (count / maxCount) * 100;
                      const label = category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <div key={category} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500 w-44 truncate">{label}</span>
                          <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Daily analyses */}
            {defenseCheckMetrics.analysesPerDay.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Analyses Per Day (Last 30 Days)
                </h3>
                <div className="h-48">
                  <div className="flex items-end justify-between h-full gap-1">
                    {defenseCheckMetrics.analysesPerDay.slice().reverse().map((day, i) => {
                      const maxCount = Math.max(...defenseCheckMetrics.analysesPerDay.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full bg-teal-500 rounded-t"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.date}: ${day.count}`}
                          />
                          {i % 5 === 0 && (
                            <span className="text-[9px] text-zinc-400 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "defensecheck" && !defenseCheckMetrics && (
          <p className="text-sm text-zinc-500 text-center py-8">
            Loading DefenseCheck metrics...
          </p>
        )}

        {activeTab === "stance" && stanceMetrics && (
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Stance Metrics</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard title="Total Analyses" value={stanceMetrics.totalAnalyses} />
              <StatCard title="Avg Defense Score" value={stanceMetrics.avgDefenseScore} />
              <StatCard title="Postures Detected" value={Object.keys(stanceMetrics.postureDistribution).length} />
            </div>

            {Object.keys(stanceMetrics.postureDistribution).length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Posture Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(stanceMetrics.postureDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([posture, count]) => {
                      const maxCount = Math.max(...Object.values(stanceMetrics.postureDistribution), 1);
                      const width = (count / maxCount) * 100;
                      const label = posture.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <div key={posture} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500 w-44 truncate">{label}</span>
                          <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {stanceMetrics.analysesPerDay.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                  Analyses Per Day (Last 30 Days)
                </h3>
                <div className="h-48">
                  <div className="flex items-end justify-between h-full gap-1">
                    {stanceMetrics.analysesPerDay.slice().reverse().map((day, i) => {
                      const maxCount = Math.max(...stanceMetrics.analysesPerDay.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full bg-violet-500 rounded-t"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.date}: ${day.count}`}
                          />
                          {i % 5 === 0 && (
                            <span className="text-[9px] text-zinc-400 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "stance" && !stanceMetrics && (
          <p className="text-sm text-zinc-500 text-center py-8">
            Loading Stance metrics...
          </p>
        )}
      </div>
    </div>
  );
}

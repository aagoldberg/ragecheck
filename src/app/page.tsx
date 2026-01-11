"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  getShareText,
  buildXIntentUrl,
  buildBlueskyIntentUrl,
  isWorthSharing,
  getScoreBucket,
} from "@/lib/share";
import {
  getDeterministicHookLine,
  getTopDrivers,
} from "@/lib/shareCard";
import { copyShareImageToClipboard } from "@/lib/shareImage";

interface Highlight {
  start: number;
  end: number;
  category: string;
  text: string;
}

interface SignalBreakdown {
  arousal: number;
  enemy_construction: number;
  moral_condemnation: number;
  simplification: number;
  call_to_conflict: number;
}

interface AnalysisResult {
  success: boolean;
  error?: string;
  score?: number;
  label?: "Low" | "Medium" | "High";
  reasons?: string[];
  highlights?: Highlight[];
  signalBreakdown?: SignalBreakdown;
  title?: string;
  sourceDomain?: string;
  textPreview?: string;
  llmEnhanced?: boolean;
  contextNotes?: string;
  sharingPatterns?: string[];
  techniqueExplanations?: string[];
  image?: string;
  cached?: boolean;
}

interface Headline {
  source: string;
  lean: string;
  color: string;
  title: string;
  url: string;
  publishedAt: string;
}

const EXAMPLES = {
  news: "https://www.foxnews.com/politics",
  tweet: "https://x.com/BernieSanders/status/1931727686952526003",
  bluesky: "https://bsky.app/profile/aoc.bsky.social/post/3mbjqcdvqh22q",
};

// Demo result shown on page load to demonstrate value
const DEMO_RESULT: AnalysisResult = {
  success: true,
  score: 68,
  label: "High",
  title: "EXPOSED: The Radical Left's Secret Plan to Destroy America",
  sourceDomain: "example-news.com",
  textPreview: "Wake up, patriots! The radical left is DESTROYING everything we hold dear. They want to take YOUR guns, YOUR freedom, and YOUR children's future. This is not a drill—it's an all-out WAR on American values. The mainstream media won't tell you this, but we will. Share this before it's too late! Every real American needs to see this. They're coming for everything you love, and if we don't act NOW, our country is FINISHED.",
  llmEnhanced: true,
  signalBreakdown: {
    arousal: 85,
    enemy_construction: 78,
    moral_condemnation: 72,
    simplification: 65,
    call_to_conflict: 80,
  },
  highlights: [
    { start: 0, end: 8, category: "call_to_conflict", text: "Wake up" },
    { start: 22, end: 34, category: "enemy_construction", text: "radical left" },
    { start: 38, end: 48, category: "arousal", text: "DESTROYING" },
    { start: 78, end: 82, category: "enemy_construction", text: "They" },
    { start: 96, end: 100, category: "enemy_construction", text: "YOUR" },
    { start: 171, end: 174, category: "arousal", text: "WAR" },
    { start: 296, end: 320, category: "call_to_conflict", text: "Share this before it's too late" },
    { start: 328, end: 345, category: "enemy_construction", text: "Every real American" },
    { start: 362, end: 368, category: "enemy_construction", text: "They're" },
    { start: 420, end: 428, category: "simplification", text: "FINISHED" },
  ],
  reasons: [
    "Heavy use of emotionally charged language ('DESTROYING', 'WAR', 'FINISHED')",
    "Strong us-vs-them framing ('They want to take YOUR...', 'radical left')",
    "Fear-based messaging with urgency ('This is not a drill', 'before it's too late')",
    "Call to share creates viral pressure without informational value",
  ],
  contextNotes: "This content uses multiple manipulation techniques designed to provoke emotional reactions rather than inform.",
  sharingPatterns: [
    "Creates fear that motivates sharing as a 'warning'",
    "In-group identity ('real Americans') drives tribal sharing",
    "Urgency bypasses critical thinking",
  ],
  techniqueExplanations: [
    "Fear Appeal: Uses existential threats to bypass rational evaluation",
    "Tribal Framing: Divides audience into 'us' vs 'them' to build loyalty",
    "Urgency Manipulation: 'Act NOW' language pressures immediate action",
  ],
};

const CURATED_EXAMPLES = [
  // News Articles
  {
    source: "Breitbart",
    lean: "Far Right",
    type: "article",
    title: "ICE Agent Killed in Minneapolis Ambush Attack",
    url: "https://www.breitbart.com/politics/2025/01/07/ice-agent-killed-minneapolis-ambush-attack/",
    color: "#f97316",
  },
  {
    source: "Fox News",
    lean: "Right",
    type: "article",
    title: "ICE longest-serving acting director issues warning after Minneapolis ambush",
    url: "https://www.foxnews.com/media/ice-longest-serving-acting-director-issues-warning-minneapolis-ambush",
    color: "#003366",
  },
  {
    source: "Reuters",
    lean: "Center",
    type: "article",
    title: "Gunman kills federal agent, wounds others at Minneapolis ICE office",
    url: "https://www.reuters.com/world/us/multiple-people-shot-ice-facility-minneapolis-cbs-2025-01-07/",
    color: "#ff8000",
  },
  {
    source: "NPR",
    lean: "Center",
    type: "article",
    title: "What we know about the deadly shooting at an ICE office in Minneapolis",
    url: "https://www.npr.org/2025/01/08/nx-s1-5253490/minneapolis-ice-shooting",
    color: "#5a5a5a",
  },
  {
    source: "CNN",
    lean: "Left",
    type: "article",
    title: "What we know about the Minneapolis ICE shooting",
    url: "https://www.cnn.com/2025/01/07/us/minneapolis-ice-shooting-what-we-know/index.html",
    color: "#cc0000",
  },
  {
    source: "MSNBC",
    lean: "Left",
    type: "article",
    title: "Minneapolis ICE shooting sparks immigration debate",
    url: "https://www.msnbc.com/rachel-maddow-show/maddowblog/minneapolis-ice-shooting-trump-immigration-rcna186658",
    color: "#0089d0",
  },
  // Tweets - actual posts about ICE/immigration
  {
    source: "@TuckerCarlson",
    lean: "Far Right",
    type: "tweet",
    title: "\"The U.S. could be on the verge of civil war...\"",
    url: "https://x.com/TuckerCarlson/status/1976082862878367967",
    image: "https://unavatar.io/twitter/TuckerCarlson",
  },
  {
    source: "@FoxNews",
    lean: "Right",
    type: "tweet",
    title: "\"President Trump reacts to the deadly ICE-involved shooting in Minneapolis...\"",
    url: "https://x.com/FoxNews/status/2009002750810411250",
    image: "https://unavatar.io/twitter/FoxNews",
  },
  {
    source: "@MayorFrey",
    lean: "Center",
    type: "tweet",
    title: "\"The presence of federal immigration enforcement agents is causing chaos...\"",
    url: "https://x.com/MayorFrey/status/2008945355925364762",
    image: "https://unavatar.io/twitter/MayorFrey",
  },
  {
    source: "@AOC",
    lean: "Left",
    type: "tweet",
    title: "\"Members of Congress have legal authority to enter ICE facilities...\"",
    url: "https://x.com/AOC/status/1921269087398765013",
    image: "https://unavatar.io/twitter/AOC",
  },
  {
    source: "@BernieSanders",
    lean: "Far Left",
    type: "tweet",
    title: "\"Trump's authoritarianism in real time: Conduct massive illegal raids...\"",
    url: "https://x.com/BernieSanders/status/1931727686952526003",
    image: "https://unavatar.io/twitter/BernieSanders",
  },
];

const LEAN_COLORS: Record<string, string> = {
  "Far Right": "bg-red-600 text-white",
  "Right": "bg-red-400 text-white",
  "Center": "bg-zinc-500 text-white",
  "Left": "bg-blue-400 text-white",
  "Far Left": "bg-blue-600 text-white",
};

const SIGNAL_LABELS: Record<keyof SignalBreakdown, string> = {
  arousal: "Emotional Arousal",
  enemy_construction: "Enemy Construction",
  moral_condemnation: "Moral Condemnation",
  simplification: "Oversimplification",
  call_to_conflict: "Call-to-Conflict",
};

// Professional Palette for 5-bar model
const CATEGORY_COLORS: Record<string, string> = {
  arousal: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
  enemy_construction: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
  moral_condemnation: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
  simplification: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  call_to_conflict: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
};

function BentoCard({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5 md:p-6 flex-1">{children}</div>
    </div>
  );
}

function ScoreGauge({ score }: { score: number; label?: string }) {
  const rotation = (score / 100) * 180 - 90;
  
  const getColor = (val: number) => {
    if (val < 33) return "stroke-emerald-500";
    if (val < 66) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  const getTextColor = (val: number) => {
    if (val < 33) return "text-emerald-600 dark:text-emerald-400";
    if (val < 66) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      <svg className="w-64 h-36" viewBox="0 0 100 55">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-zinc-100 dark:text-zinc-800"
          strokeLinecap="round"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          strokeWidth="6"
          strokeDasharray="125.6"
          strokeDashoffset={125.6 - (score / 100) * 125.6}
          className={`${getColor(score)} transition-all duration-1000 ease-out`}
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1="50" y1="50" x2="50" y2="15"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-zinc-800 dark:text-zinc-200 transition-transform duration-1000 ease-out origin-bottom"
          style={{ transformOrigin: '50px 50px', transform: `rotate(${rotation}deg)` }}
        />
        <circle cx="50" cy="50" r="3" fill="currentColor" className="text-zinc-800 dark:text-zinc-200" />
      </svg>
      <div className="text-center -mt-8">
        <span className={`text-6xl font-black tracking-tight ${getTextColor(score)}`}>
          {score}
        </span>
        <div className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mt-1">
          Bait Score
        </div>
      </div>
    </div>
  );
}

function SignalBar({ label, value }: { label: string; value: number }) {
  const getBarColor = (val: number) => {
    if (val < 33) return "bg-emerald-500";
    if (val < 66) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="group">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
          {label}
        </span>
        <span className="text-xs font-mono font-medium text-zinc-500">{Math.round(value)}%</span>
      </div>
      <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(value)} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function HighlightedText({
  text,
  highlights,
  filterCategory,
}: {
  text: string;
  highlights: Highlight[];
  filterCategory?: string | null;
}) {
  const filteredHighlights = useMemo(() => {
    let hs = [...highlights].sort((a, b) => a.start - b.start);
    if (filterCategory) {
      hs = hs.filter(h => h.category === filterCategory);
    }
    return hs;
  }, [highlights, filterCategory]);

  if (!filteredHighlights || filteredHighlights.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[15px] whitespace-pre-wrap">{text}</p>;
  }

  const elements: React.ReactNode[] = [];
  let lastEnd = 0;

  filteredHighlights.forEach((h, i) => {
    if (h.start > lastEnd) {
      elements.push(
        <span key={`text-${i}`}>{text.substring(lastEnd, h.start)}</span>
      );
    }
    elements.push(
      <mark
        key={`highlight-${i}`}
        className={`${CATEGORY_COLORS[h.category] || "bg-yellow-100 text-yellow-800"} px-0.5 py-0.5 rounded cursor-help transition-all hover:brightness-95`}
        title={SIGNAL_LABELS[h.category as keyof SignalBreakdown] || h.category}
      >
        {text.substring(h.start, h.end)}
      </mark>
    );
    lastEnd = h.end;
  });

  if (lastEnd < text.length) {
    elements.push(<span key="text-end">{text.substring(lastEnd)}</span>);
  }

  return (
    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-[15px] whitespace-pre-wrap font-serif sm:font-sans">{elements}</p>
  );
}

function SocialPostCard({
  title,
  text,
  highlights,
  sourceDomain,
  activeFilter,
  image
}: {
  title: string;
  text: string;
  highlights: Highlight[];
  sourceDomain: string;
  activeFilter: string | null;
  image?: string;
}) {
  const handleMatch = title.match(/@([a-zA-Z0-9_.-]+)/);
  const handle = handleMatch ? handleMatch[1] : "user";
  const displayName = handle;

  const isTwitter = sourceDomain.includes("twitter.com") || sourceDomain.includes("x.com");
  const isBluesky = sourceDomain.includes("bsky.app");
  const isThreads = sourceDomain.includes("threads.net");
  const isTruthSocial = sourceDomain.includes("truthsocial.com");

  return (
    <div className="mx-auto max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm
            ${isTwitter ? "bg-black dark:bg-white dark:text-black" : ""}
            ${isBluesky ? "bg-blue-500" : ""}
            ${isThreads ? "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900" : ""}
            ${isTruthSocial ? "bg-purple-700" : ""}
            ${!isTwitter && !isBluesky && !isThreads && !isTruthSocial ? "bg-zinc-500" : ""}
          `}>
            {handle[0].toUpperCase()}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer">
              {displayName}
            </span>
            <span className="text-zinc-500 text-sm">@{handle}</span>
          </div>
        </div>
        <div className="text-zinc-400">
           {isTwitter && (
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
           )}
           {isBluesky && (
             <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 512 512"><path d="M111.8 62.2C170.2 105.9 226.3 199.6 256 256c29.7-56.4 85.8-150.1 144.2-193.8 38.8-29.1 82.7-44.4 111.8-62.2s48.6-26.6 48.6-26.6-23.7 87.7-93.7 182.7c-5.8 7.9-10.7 16.6-13.8 25.8-10.3 30.7-3.5 59.8 17.3 84.8 55.4 66.8 41.3 175.7 41.3 175.7s-70-22.3-157.9-108.5c-30.7-30.1-60.8-63.5-74.1-73.4-3.2-2.4-7.8-1.5-10.1 1.9L256 278.5l-13.5-16.1c-2.3-3.4-6.9-4.3-10.1-1.9-13.3 9.9-43.4 43.3-74.1 73.4-87.9 86.2-157.9 108.5-157.9 108.5s-14.1-108.9 41.3-175.7c20.8-25 27.6-54.1 17.3-84.8-3.1-9.2-8-17.9-13.8-25.8C47.7 62.2 24 0 24 0s19.5 8.8 48.6 26.6c29.1 17.8 73 33.1 111.8 62.2z"/></svg>
           )}
           {isTruthSocial && (
             <svg className="w-5 h-5 text-purple-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
           )}
        </div>
      </div>

      <div className="text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap mb-3">
        <HighlightedText 
          text={text} 
          highlights={highlights} 
          filterCategory={activeFilter} 
        />
      </div>

      {image && (
        <div className="mb-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <img src={image} alt="Post attachment" className="w-full h-auto object-cover max-h-80" />
        </div>
      )}

      <div className="flex items-center gap-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-zinc-500 text-sm">
        <div className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer group">
           <span className="group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 p-1.5 -ml-1.5 rounded-full transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
           </span>
           <span>Analysis</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-green-500 transition-colors cursor-pointer group">
           <span className="group-hover:bg-green-50 dark:group-hover:bg-green-900/20 p-1.5 -ml-1.5 rounded-full transition-colors">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
           </span>
           <span>Share</span>
        </div>
      </div>
    </div>
  );
}

const ANALYSIS_STEPS = [
  { label: "Fetching content", duration: 1500 },
  { label: "Extracting text", duration: 800 },
  { label: "Scanning emotional arousal", duration: 600 },
  { label: "Detecting enemy construction", duration: 600 },
  { label: "Analyzing moral framing", duration: 600 },
  { label: "Checking oversimplification", duration: 600 },
  { label: "Identifying engagement bait", duration: 600 },
  { label: "Calculating final score", duration: 400 },
];

function AnalyzingProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = ANALYSIS_STEPS.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 50;

      // Calculate which step we're on based on elapsed time
      let accumulatedTime = 0;
      let stepIndex = 0;
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        if (elapsed >= accumulatedTime && elapsed < accumulatedTime + ANALYSIS_STEPS[i].duration) {
          stepIndex = i;
          break;
        }
        accumulatedTime += ANALYSIS_STEPS[i].duration;
        if (i === ANALYSIS_STEPS.length - 1) stepIndex = i;
      }

      setCurrentStep(stepIndex);
      setProgress(Math.min(95, (elapsed / totalDuration) * 100)); // Cap at 95% until done
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const currentLabel = ANALYSIS_STEPS[currentStep]?.label || "Finalizing...";

  return (
    <div className="max-w-md mx-auto mt-12 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {currentLabel}
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Step {currentStep + 1} of {ANALYSIS_STEPS.length}</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(DEMO_RESULT);
  const [isDemo, setIsDemo] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: document.referrer || null,
        pagePath: "/"
      }),
    }).catch(() => {});

    fetch("/api/headlines")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.headlines) {
          setHeadlines(data.headlines);
        }
      })
      .catch(() => {}) // Ignore errors for headlines
      .finally(() => setHeadlinesLoading(false));

    // Check if Web Share API is available (primarily mobile)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setCanNativeShare(isMobile && typeof navigator.share === "function");
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (!file) {
      setImagePreview(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setImageError("Please upload a JPEG, PNG, GIF, or WebP image");
      setImagePreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image too large (max 5MB)");
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setUrl("");
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageError(null);
    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const analyzeImage = async () => {
    if (!imagePreview) return;

    setLoading(true);
    setResult(null);
    setIsDemo(false);
    setActiveFilter(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview }),
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: "Failed to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyze = async (targetUrl: string, force = false) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setResult(null);
    setIsDemo(false);
    setActiveFilter(null);
    clearImage();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim(), force }),
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: "Failed to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  const forceReanalyze = () => {
    if (url.trim()) {
      analyze(url, true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyze(url);
  };

  const tryExample = (type: "news" | "tweet" | "bluesky") => {
    const exampleUrl = EXAMPLES[type];
    setUrl(exampleUrl);
    analyze(exampleUrl);
  };

  const triggerImageUpload = () => {
    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  const getShareUrl = () => {
    if (!result?.success || result.score === undefined) return "";
    const params = new URLSearchParams({
      url: url,
      score: String(result.score),
      domain: result.sourceDomain || "",
      title: result.title || "",
    });
    return `${window.location.origin}/share?${params.toString()}`;
  };

  const trackShareEvent = (
    eventType: string,
    metadata?: Record<string, string | number>
  ) => {
    if (!result?.success || result.score === undefined || !result.signalBreakdown) return;

    const topBars = Object.entries(result.signalBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key]) => key);

    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        shareType: eventType,
        baitScoreBucket: getScoreBucket(result.score),
        topBars,
        ...metadata,
      }),
    }).catch(() => {});
  };

  // Get hook line for share text
  const getHookLineForShare = () => {
    if (!result?.success || result.score === undefined || !result.signalBreakdown) {
      return "";
    }
    const topDrivers = getTopDrivers(result.signalBreakdown);
    return getDeterministicHookLine(result.score, topDrivers);
  };

  const copyShareCard = () => {
    if (!result?.success || result.score === undefined) return;
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackShareEvent("copy_link_clicked");
    setShowMoreMenu(false);
  };

  const shareOnTwitter = () => {
    if (!result?.success || result.score === undefined || !result.signalBreakdown) return;
    const shareUrl = getShareUrl();
    const hookLine = getHookLineForShare();
    const text = getShareText("x", hookLine, shareUrl);
    const twitterUrl = buildXIntentUrl(text, shareUrl);
    window.open(twitterUrl, "_blank", "width=550,height=420");
    trackShareEvent("share_x_clicked");
    // Also copy image to clipboard for easy pasting
    handleShareImage(true);
  };

  const shareOnBluesky = () => {
    if (!result?.success || result.score === undefined || !result.signalBreakdown) return;
    const shareUrl = getShareUrl();
    const hookLine = getHookLineForShare();
    const text = getShareText("bluesky", hookLine, shareUrl);
    const blueskyUrl = buildBlueskyIntentUrl(text);
    window.open(blueskyUrl, "_blank", "width=550,height=420");
    trackShareEvent("share_bluesky_clicked");
    // Also copy image to clipboard for easy pasting
    handleShareImage(true);
  };

  const shareNative = async () => {
    if (!result?.success || result.score === undefined || !result.signalBreakdown) return;
    if (!navigator.share) return;

    const shareUrl = getShareUrl();
    const hookLine = getHookLineForShare();
    const text = getShareText("native", hookLine, shareUrl);

    try {
      await navigator.share({
        title: "RageCheck Analysis",
        text,
        url: shareUrl,
      });
      trackShareEvent("web_share_clicked");
    } catch {
      // User cancelled or share failed - ignore
    }
  };

  // Check if this result is "worth sharing"
  const showSharePrompt = useMemo(() => {
    if (!result?.success || result.score === undefined || !result.signalBreakdown) {
      return false;
    }
    return isWorthSharing(
      result.score,
      result.signalBreakdown.arousal,
      result.signalBreakdown.call_to_conflict
    );
  }, [result]);

  // Build share card API URL
  const getShareCardUrl = (size: "x" | "bsky" = "x") => {
    if (!result?.success || result.score === undefined || !result.signalBreakdown) return null;

    const params = new URLSearchParams({
      score: String(result.score),
      title: result.title || "Content Analysis",
      domain: result.sourceDomain || "unknown",
      size,
      arousal: String(result.signalBreakdown.arousal),
      enemy: String(result.signalBreakdown.enemy_construction),
      moral: String(result.signalBreakdown.moral_condemnation),
      simplification: String(result.signalBreakdown.simplification),
      conflict: String(result.signalBreakdown.call_to_conflict),
    });

    return `/api/share-card?${params.toString()}`;
  };

  // Primary share action - uses client-side canvas for clipboard copy
  const handleShareImage = async (silent = false) => {
    if (!result?.success || result.score === undefined || !result.signalBreakdown) return;

    try {
      const success = await copyShareImageToClipboard({
        score: result.score,
        title: result.title || "Content Analysis",
        domain: result.sourceDomain || "unknown",
        signalBreakdown: result.signalBreakdown,
      });

      if (success && !silent) {
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 3000);
        trackShareEvent("share_image_success");
      }
    } catch (error) {
      console.error("Failed to copy image:", error);
    }
  };

  // Click handler for share image button
  const onShareImageClick = async () => {
    trackShareEvent("share_image_clicked");
    await handleShareImage();
  };

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-lg shadow-sm" />
            <span className="font-bold text-lg tracking-tight">RageCheck</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-zinc-500">
            <a href="/clearview" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Clearview</a>
            <a href="/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</a>
            <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-6 leading-[1.1]">
            Is that post <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600">designed</span> to make you angry?
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            Identify engagement bait, fear-mongering, and manipulation patterns in news and social media instantly.
          </p>

          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
            {imagePreview && (
              <div className="mb-6 relative animate-in fade-in zoom-in duration-300">
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-lg">
                  <img
                    src={imagePreview}
                    alt="Screenshot preview"
                    className="w-full max-h-64 object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-3 right-3 p-1.5 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-full transition-colors backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={analyzeImage}
                  disabled={loading}
                  className="mt-4 w-full px-6 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
                >
                  {loading ? "Scanning Image..." : "Analyze Screenshot"}
                </button>
              </div>
            )}

            {!imagePreview && (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-xl transition-shadow ring-1 ring-zinc-200 dark:ring-zinc-800 group-focus-within:ring-zinc-300 dark:group-focus-within:ring-zinc-700">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste URL (article, tweet, bsky)..."
                    className="flex-1 w-full pl-6 pr-4 py-5 bg-transparent border-0 focus:ring-0 text-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                    required
                  />
                  <div className="pr-3 flex items-center gap-3">
                    <label
                      htmlFor="image-upload"
                      className="p-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      title="Upload screenshot"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={loading || !url.trim()}
                      className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-base font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </span>
                      ) : "Analyze"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {imageError && (
              <p className="mt-3 text-sm text-rose-600 dark:text-rose-400 font-medium animate-pulse">{imageError}</p>
            )}

            {!imagePreview && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-500">
                <span>Try an example:</span>
                <button
                  type="button"
                  onClick={() => tryExample("news")}
                  className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-xs"
                >
                  News Article
                </button>
                <button
                  type="button"
                  onClick={() => tryExample("tweet")}
                  className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-xs"
                >
                  Viral Tweet
                </button>
                <button
                  type="button"
                  onClick={() => tryExample("bluesky")}
                  className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-xs"
                >
                  Bluesky Post
                </button>
              </div>
            )}
          </form>

          {/* Loading State - under input bar */}
          {loading && <AnalyzingProgress />}
        </div>

        {/* Live Headlines Section */}
        {(!result || isDemo) && (
          <div className="mt-24 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block"></span>
                Trending Headlines
              </h2>
              <span className="text-sm text-zinc-400 hidden sm:inline-block">Live from across the spectrum</span>
            </div>

            {/* News Grid */}
            <div className="mb-12">
              {headlinesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 h-32 animate-pulse" />
                  ))}
                </div>
              ) : headlines.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {headlines.map((headline, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setUrl(headline.url);
                        analyze(headline.url);
                      }}
                      className="group flex flex-col justify-between text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all h-full"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {headline.source}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${LEAN_COLORS[headline.lean] || "bg-gray-400 text-white"}`}>
                            {headline.lean}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-3 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {headline.title}
                        </p>
                      </div>
                      <p className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        Analyze Pattern →
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-500">Could not load live headlines.</p>
                </div>
              )}
            </div>

            {/* Social Grid */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                 <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                   Viral on Social Media
                 </h3>
                 <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {CURATED_EXAMPLES.filter(e => e.type === "tweet").map((example, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUrl(example.url);
                      analyze(example.url);
                    }}
                    className="group text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={example.image}
                        alt={example.source}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${example.source.slice(1)}&background=random`;
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {example.source}
                        </span>
                        <span className={`text-[9px] w-fit font-medium px-1.5 py-px rounded ${LEAN_COLORS[example.lean]}`}>
                          {example.lean}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {example.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 mt-12">

            {/* Demo Banner */}
            {isDemo && (
              <div className="max-w-4xl mx-auto bg-indigo-600 text-white rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold">Demo Mode</p>
                    <p className="text-indigo-100 text-sm">Showing analysis for an example article.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setResult(null);
                    setIsDemo(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  Analyze Your Own Link
                </button>
              </div>
            )}

            {!isDemo && (
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setResult(DEMO_RESULT);
                    setIsDemo(true);
                    setUrl("");
                  }}
                  className="group flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Analyze Another
                </button>
                {result?.cached && (!result.textPreview || result.title === "Article Analysis") && (
                  <button
                    onClick={forceReanalyze}
                    className="group flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-full text-sm font-medium text-amber-700 dark:text-amber-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-analyze (Fresh)
                  </button>
                )}
              </div>
            )}

            {!result.success ? (
              <div className="max-w-xl mx-auto p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-center text-rose-700 dark:text-rose-300">
                <svg className="w-12 h-12 mx-auto mb-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-bold text-lg mb-1">Analysis Failed</p>
                <p>{result.error}</p>
              </div>
            ) : (
              <>
              {/* Share Buttons - Above Analysis */}
              <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-zinc-400">
                    {activeFilter ? `Filtering: ${SIGNAL_LABELS[activeFilter as keyof SignalBreakdown]}` : "Showing all detected patterns"}
                  </span>
                  {showSharePrompt && !isDemo && (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 animate-pulse">
                      This one&apos;s worth sharing.
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Primary CTA: Share Image */}
                  <button
                    onClick={onShareImageClick}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
                    title="Copy image to clipboard — paste anywhere"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {imageCopied ? "Copied — paste anywhere!" : "Share Image"}
                  </button>
                  {/* Post on X */}
                  <button
                    onClick={shareOnTwitter}
                    className="flex items-center gap-1.5 px-3 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-colors"
                    title="Post on X"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Post on X
                  </button>
                  {/* Post on Bluesky */}
                  <button
                    onClick={shareOnBluesky}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#0085ff] hover:bg-[#0070d6] text-white text-xs font-bold rounded-lg transition-colors"
                    title="Post on Bluesky"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 600 530" fill="currentColor">
                      <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.69-7.914 0-2.918-1.176 0.534-3.69 7.914-13.72 40.255-67.24 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.449-163.25-81.433-5.9561-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z"/>
                    </svg>
                    Post on Bluesky
                  </button>
                  {/* More dropdown */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="flex items-center gap-1 px-2 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      title="More options"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50">
                        <button
                          onClick={copyShareCard}
                          className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                          {copied ? "Link Copied!" : "Copy Link"}
                        </button>
                        {canNativeShare && (
                          <button
                            onClick={() => {
                              shareNative();
                              setShowMoreMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            Share via...
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Score & Context Card */}
                <BentoCard className="lg:col-span-4 lg:sticky lg:top-24 h-fit" title="Assessment">
                  <div className="flex flex-col items-center justify-center text-center">
                    <ScoreGauge score={result.score!} label={result.label!} />

                    <div className="mt-8 space-y-4 w-full">
                       <div className="grid grid-cols-2 gap-3 text-center text-xs text-zinc-500">
                          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <span className="block font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate mb-1">{result.sourceDomain}</span>
                            Source
                          </div>
                          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <span className="block font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-1">{result.llmEnhanced ? "AI + Rules" : "Rules"}</span>
                            Method
                          </div>
                       </div>
                    </div>

                    {result.llmEnhanced && result.techniqueExplanations && result.techniqueExplanations.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full text-left">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                          Techniques Detected
                        </h4>
                        <div className="space-y-3">
                          {result.techniqueExplanations.map((technique, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-snug">{technique}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.llmEnhanced && result.sharingPatterns && result.sharingPatterns.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full text-left">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                          Viral Triggers
                        </h4>
                        <div className="space-y-3">
                          {result.sharingPatterns.map((pattern, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                                {i + 1}
                              </span>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-snug">{pattern}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </BentoCard>

                {/* Analysis Breakdown */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Top Row: Title & Signals */}
                  <BentoCard>
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg uppercase tracking-wider">
                             {result.sourceDomain}
                        </span>
                        {result.llmEnhanced && (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-lg uppercase tracking-wider flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                              AI Enhanced
                            </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mb-6">
                        {result.title}
                      </h2>
                      
                      {result.signalBreakdown && (
                        (() => {
                           const dominantEntry = Object.entries(result.signalBreakdown).reduce((a, b) => a[1] > b[1] ? a : b);
                           const dominantSignal = dominantEntry[0] as keyof SignalBreakdown;
                           const dominantValue = dominantEntry[1];
                           
                           if (dominantValue > 40) {
                             return (
                               <div className={`p-5 rounded-xl border-l-4 mb-8 ${ 
                                 dominantValue > 70 ? 'bg-rose-50 border-rose-500 dark:bg-rose-900/10' : 'bg-amber-50 border-amber-500 dark:bg-amber-900/10'
                               }`}>
                                 <h3 className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2">
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                   </svg>
                                   High Levels of {SIGNAL_LABELS[dominantSignal]}
                                 </h3>
                                 <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                   {result.reasons?.[0] || `Significant density of ${SIGNAL_LABELS[dominantSignal].toLowerCase()} detected.`}
                                 </p>
                               </div>
                             );
                           }
                           return null;
                        })()
                      )}

                      <div className="pl-5 border-l-2 border-zinc-200 dark:border-zinc-800">
                        <p className="text-lg text-zinc-500 italic font-serif">
                          &ldquo;{result.contextNotes || "This content exhibits multiple patterns associated with manipulative framing."}"&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                      {result.signalBreakdown && Object.entries(result.signalBreakdown).map(([key, value]) => (
                         <div 
                          key={key}
                          className={`cursor-pointer hover:opacity-80 transition-opacity ${activeFilter && activeFilter !== key ? 'opacity-30' : ''}`}
                          onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                         >
                           <SignalBar label={SIGNAL_LABELS[key as keyof SignalBreakdown]} value={value} />
                         </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Highlighted Text */}
                  <BentoCard title={result.sourceDomain?.match(/twitter|x.com|bsky|threads|truthsocial/) ? "Social Context" : "Key Excerpts"} className="flex-1">
                    <div className="relative">
                      <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {result.sourceDomain?.match(/twitter|x.com|bsky|threads|truthsocial/) ? (
                          <SocialPostCard 
                             title={result.title || ""}
                             text={result.textPreview || ""}
                             highlights={result.highlights || []}
                             sourceDomain={result.sourceDomain || ""}
                             activeFilter={activeFilter}
                             image={result.image}
                          />
                        ) : (
                          <HighlightedText
                            text={result.textPreview || ""}
                            highlights={result.highlights || []}
                            filterCategory={activeFilter}
                          />
                        )}
                      </div>
                    </div>
                    </BentoCard>
                </div>
              </div>
              </>
            )}
          </div>
        )}

      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
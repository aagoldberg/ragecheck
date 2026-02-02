"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getScoreBucket } from "@/lib/share";
import { SIGNAL_LABELS } from "@/lib/shareCard";
import { copyShareImageToClipboard } from "@/lib/shareImage";
import {
  buildXIntentUrl,
  buildBlueskyIntentUrl,
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
} from "@/lib/share/getShareText";
import * as tracking from "@/lib/tracking";
import { detectConversationShape, ConversationShape } from "@/lib/conversationShape";
import AttributionSurvey from "@/components/AttributionSurvey";
// import { HighRageHeadlines } from "@/components/HighRageHeadlines";

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
  shareCardSummary?: string;
  shareCardBullets?: string[];
  image?: string;
  uploadedImageUrl?: string;
  analyzedUrl?: string; // The URL that was analyzed, for share tracking
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

const SIGNAL_DESCRIPTIONS: Record<keyof SignalBreakdown, string> = {
  arousal: "Language designed to trigger immediate physical reactions like fear, anger, or disgust using intensity and urgency.",
  enemy_construction: "Rhetoric that frames an opponent not just as wrong, but as an existential threat or evil force.",
  moral_condemnation: "Framing an issue as a black-and-white battle between good and evil to bypass rational debate.",
  simplification: "Stripping away nuance to present complex issues as simple binary choices or obvious truths.",
  call_to_conflict: "Direct or indirect encouragement to attack, harass, or view the 'other side' as an enemy to be defeated.",
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

function SignalBar({ label, value, description }: { label: string; value: number; description?: string }) {
  const getBarColor = (val: number) => {
    if (val < 33) return "bg-emerald-500";
    if (val < 66) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="group">
      <div className="flex justify-between mb-2 items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
            {label}
          </span>
          {description && (
            <div className="relative group/info cursor-help">
              <svg className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] leading-tight rounded shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-10 pointer-events-none">
                {description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-zinc-900"></div>
              </div>
            </div>
          )}
        </div>
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

function MiniScoreGauge({ score }: { score: number }) {
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
    <div className="flex flex-col items-center justify-center scale-75 origin-top">
      <svg className="w-24 h-14" viewBox="0 0 100 55">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" strokeLinecap="round" />
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" strokeWidth="8" strokeDasharray="125.6" strokeDashoffset={125.6 - (score / 100) * 125.6} className={getColor(score)} strokeLinecap="round" />
        <line x1="50" y1="50" x2="50" y2="15" stroke="currentColor" strokeWidth="3" className="text-zinc-800 dark:text-zinc-200" style={{ transformOrigin: '50px 50px', transform: `rotate(${rotation}deg)` }} />
      </svg>
      <div className="-mt-3 flex flex-col items-center">
        <span className={`text-xl font-black ${getTextColor(score)}`}>{score}</span>
        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest -mt-1">Bait Score</span>
      </div>
    </div>
  );
}

function MicroDemoCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
        
        {/* Social Header */}
        <div className="p-5 pb-3 flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
           </div>
           <div className="leading-tight">
             <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Political Pundit</div>
             <div className="text-xs text-zinc-500">@pundit_real</div>
           </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          <p className="text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
            EXPOSED: The <mark className="bg-indigo-100 text-indigo-800 px-0.5 rounded font-medium">Radical Left&apos;s</mark> Secret Plan to <mark className="bg-rose-100 text-rose-800 px-0.5 rounded font-medium">Destroy America</mark>
          </p>
        </div>

        {/* Analysis Footer */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 p-4">
           <div className="flex items-center gap-4">
              <div className="flex-shrink-0 scale-90 origin-left">
                 <MiniScoreGauge score={84} /> 
              </div>
              
              <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700"></div>

              <div className="flex-1 space-y-2.5">
                 <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                       <span>Us vs Them</span>
                       <span>85%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 w-[85%] rounded-full"></div>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                       <span>Emotional Heat</span>
                       <span>72%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500 w-[72%] rounded-full"></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
      
      <div className="absolute -z-10 -bottom-5 -right-5 w-full h-full bg-indigo-500/10 rounded-3xl blur-3xl"></div>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [autoAnalyzeTriggered, setAutoAnalyzeTriggered] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageCopied, setImageCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [emailSubscribing, setEmailSubscribing] = useState(false);
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>(""); // Empty string = English (default)
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [subscribeMessage, setSubscribeMessage] = useState("");

  // Track current sessionId and start time for abandonment detection
  const currentSessionIdRef = useRef<string | null>(null);
  const analysisStartTimeRef = useRef<number | null>(null);

  // Helper to get connection info
  const getConnectionInfo = () => {
    const nav = navigator as Navigator & {
      connection?: {
        type?: string;
        effectiveType?: string;
      };
    };
    return {
      connectionType: nav.connection?.type || 'unknown',
      effectiveConnectionType: nav.connection?.effectiveType || 'unknown',
    };
  };

  // Abandonment beacon - send when user leaves page during analysis
  useEffect(() => {
    const handlePageLeave = () => {
      if (loading && currentSessionIdRef.current) {
        const timeToAbandonMs = analysisStartTimeRef.current
          ? Date.now() - analysisStartTimeRef.current
          : undefined;
        const { connectionType, effectiveConnectionType } = getConnectionInfo();

        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(
          "/api/track-abandon",
          JSON.stringify({
            sessionId: currentSessionIdRef.current,
            reason: 'page_leave',
            timeToAbandonMs,
            connectionType,
            effectiveConnectionType,
          })
        );
      }
    };

    // Listen for page unload and visibility changes
    window.addEventListener("beforeunload", handlePageLeave);
    window.addEventListener("pagehide", handlePageLeave);

    return () => {
      window.removeEventListener("beforeunload", handlePageLeave);
      window.removeEventListener("pagehide", handlePageLeave);
    };
  }, [loading]);

  // Conversation shape detection
  const conversationShape = useMemo<ConversationShape | null>(() => {
    if (!result?.success || !result.signalBreakdown) return null;
    return detectConversationShape({
      signalBreakdown: result.signalBreakdown,
      techniqueExplanations: result.techniqueExplanations,
      sharingPatterns: result.sharingPatterns,
      score: result.score,
    });
  }, [result]);

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [errorReported, setErrorReported] = useState(false);

  useEffect(() => {
    fetch("/api/headlines")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.headlines) {
          setHeadlines(data.headlines);
        }
      })
      .catch(() => {})
      .finally(() => setHeadlinesLoading(false));
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
      tracking.trackImageUploaded("button");
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageError(null);
    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const [isDragging, setIsDragging] = useState(false);

  // Handle paste from clipboard (Cmd/Ctrl+V)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        if (file.size > 5 * 1024 * 1024) {
          setImageError("Image too large (max 5MB)");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreview(event.target?.result as string);
          setUrl("");
          setImageError(null);
          tracking.trackImageUploaded("paste");
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);

  // Handle drag over (required to allow drop)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setImageError("Please drop a JPEG, PNG, GIF, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setUrl("");
      setImageError(null);
      tracking.trackImageUploaded("drop");
    };
    reader.readAsDataURL(file);
  }, []);

  // Track analysis start in database and return sessionId for correlation
  const trackAnalysisStartDB = useCallback((type: "url" | "image", targetUrl?: string): string => {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    fetch("/api/track-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, analysisType: type, url: targetUrl }),
    }).catch(() => {}); // Ignore errors - tracking shouldn't break UX
    return sessionId;
  }, []);

  const analyzeImage = async () => {
    if (!imagePreview) return;

    setLoading(true);
    setResult(null);
    setIsDemo(false);
    setActiveFilter(null);
    tracking.trackAnalysisStarted("image");
    const sessionId = trackAnalysisStartDB("image");
    currentSessionIdRef.current = sessionId; // Track for abandonment detection
    analysisStartTimeRef.current = Date.now(); // Track start time

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview, sessionId, language: language || undefined }),
      });

      const data = await response.json();
      // Use the unique URL from API response for share tracking, fallback to generic if not provided
      if (!data.analyzedUrl) {
        data.analyzedUrl = "image-upload";
      }
      setResult(data);
      // Scroll to top so users see results from the beginning
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (data.success && data.score !== undefined) {
        tracking.trackAnalysisCompleted(data.score, data.platform || null, data.llmEnhanced || false);
      } else if (!data.success) {
        tracking.trackAnalysisFailed(data.error || "Unknown error");
      }
    } catch {
      tracking.trackAnalysisFailed("Network error");
      setResult({
        success: false,
        error: "Failed to connect to server",
      });
    } finally {
      setLoading(false);
      currentSessionIdRef.current = null; // Clear on completion
      analysisStartTimeRef.current = null; // Clear start time
    }
  };

  const analyze = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setResult(null);
    setIsDemo(false);
    setActiveFilter(null);
    clearImage();
    tracking.trackAnalysisStarted("url");
    const sessionId = trackAnalysisStartDB("url", targetUrl.trim());
    currentSessionIdRef.current = sessionId; // Track for abandonment detection
    analysisStartTimeRef.current = Date.now(); // Track start time

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim(), sessionId, language: language || undefined }),
      });

      const data = await response.json();
      // Store the analyzed URL in the result for share tracking
      data.analyzedUrl = targetUrl.trim();
      setResult(data);
      // Scroll to top so users see results from the beginning
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (data.success && data.score !== undefined) {
        tracking.trackAnalysisCompleted(data.score, data.sourceDomain || null, data.llmEnhanced || false);
      } else if (!data.success) {
        tracking.trackAnalysisFailed(data.error || "Unknown error");
      }
    } catch {
      tracking.trackAnalysisFailed("Network error");
      setResult({
        success: false,
        error: "Failed to connect to server",
      });
    } finally {
      setLoading(false);
      currentSessionIdRef.current = null; // Clear on completion
      analysisStartTimeRef.current = null; // Clear start time
    }
  };

  // Handle URL param from Clearview "Analyze" button
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam && !autoAnalyzeTriggered) {
      setUrl(urlParam);
      setAutoAnalyzeTriggered(true);
      // Small delay to ensure state is set
      setTimeout(() => {
        analyze(urlParam);
      }, 100);
    }
  }, [searchParams, autoAnalyzeTriggered]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tracking.trackSubmitButtonClick("url");
    analyze(url);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail.trim()) return;

    tracking.trackEmailSubscribe("homepage");
    setSubscribeStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscribeEmail.trim(), source: "homepage" }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscribeStatus("success");
        setSubscribeMessage(data.message || "You're subscribed!");
      } else {
        setSubscribeStatus("error");
        setSubscribeMessage(data.error || "Something went wrong.");
      }
    } catch {
      setSubscribeStatus("error");
      setSubscribeMessage("Failed to subscribe. Please try again.");
    }
  };

  const tryExample = (type: "news" | "tweet" | "bluesky") => {
    const exampleUrl = EXAMPLES[type];
    setUrl(exampleUrl);
    analyze(exampleUrl);
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

    // Use the actual URL that was analyzed - for image uploads this is "image-upload"
    // For URL analyses, prefer the stored analyzedUrl, then input URL, then fall back to source domain
    const shareUrl = result.analyzedUrl || url.trim() || (imagePreview ? "image-upload" : result.sourceDomain || "unknown");

    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: shareUrl,
        shareType: eventType,
        baitScoreBucket: getScoreBucket(result.score),
        topBars,
        ...metadata,
      }),
    }).catch(() => {});
  };

  // Submit feedback
  const submitFeedback = async (rating: "up" | "down", comment?: string) => {
    if (!result?.success || result.score === undefined) return;

    setFeedbackGiven(rating);
    tracking.trackFeedbackSubmitted(rating === "up" ? "positive" : "negative", !!comment);

    setShowFeedbackForm(true);

    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        rating,
        comment: comment || null,
        score: result.score,
        title: result.title,
        sourceDomain: result.sourceDomain,
        signalBreakdown: result.signalBreakdown,
      }),
    }).catch(() => {});
  };

  const submitFeedbackComment = () => {
    if (!feedbackComment.trim()) {
      setFeedbackSubmitted(true);
      setShowFeedbackForm(false);
      return;
    }

    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        rating: feedbackGiven || "down",
        comment: feedbackComment,
        score: result?.score,
        title: result?.title,
        sourceDomain: result?.sourceDomain,
        signalBreakdown: result?.signalBreakdown,
      }),
    }).catch(() => {});

    setFeedbackSubmitted(true);
    setShowFeedbackForm(false);
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
        techniqueExplanations: result.techniqueExplanations,
        sharingPatterns: result.sharingPatterns,
        shareCardSummary: result.shareCardSummary,
        shareCardBullets: result.shareCardBullets,
        // Use local base64 image (more reliable) or fall back to blob URL
        uploadedImageUrl: imagePreview || result.uploadedImageUrl,
        textPreview: result.textPreview,
        sourceUrl: result.analyzedUrl || url || undefined, // For QR code linking back
        shareUrl: getShareUrl() || undefined, // Share page URL
      });

      if (success && !silent) {
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 3000);
        trackShareEvent("share_image_success");
        tracking.trackShareCompleted("copy");
      } else if (!success && !silent) {
        // Track failed share attempts so we can see if there's a pattern
        trackShareEvent("share_image_failed");
      }
    } catch (error) {
      console.error("Failed to copy image:", error);
      // Track the error so we can see failed attempts
      trackShareEvent("share_image_error", { error: String(error).slice(0, 100) });
    }
  };

  // Click handler for share image button
  const onShareImageClick = async () => {
    trackShareEvent("share_image_clicked");
    tracking.trackShareClicked("copy");
    await handleShareImage();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50 flex flex-col">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/clearview" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-lg shadow-sm group-hover:rotate-12 transition-transform" />
              <span className="font-bold text-lg tracking-tight">RageCheck</span>
            </a>
            
            {/* Desktop Lens Toggle */}
            <div className="hidden sm:flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button 
                className="px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-700 rounded-md shadow-sm transition-all flex items-center gap-1.5"
                disabled
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                CHECK
              </button>
              <a 
                href="/clearview" 
                onClick={() => tracking.trackNavClick("clearview", "lens_toggle")}
                className="px-3 py-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all flex items-center gap-1.5"
              >
                READ
              </a>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex gap-6 text-sm font-medium text-zinc-500">
            <a href="/clearview" onClick={() => tracking.trackNavClick("clearview", "header")} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Clearview</a>
            <a href="/methodology" onClick={() => tracking.trackNavClick("methodology", "header")} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</a>
            <a href="/about" onClick={() => tracking.trackNavClick("about", "header")} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</a>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4 sm:hidden">
            {/* Mobile Lens Toggle */}
            <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button 
                className="px-2 py-1.5 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-700 rounded-md shadow-sm flex items-center gap-1"
                disabled
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                CHECK
              </button>
              <a 
                href="/clearview" 
                onClick={() => tracking.trackNavClick("clearview", "lens_toggle_mobile")}
                className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                READ
              </a>
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="px-4 py-3 space-y-1">
              <a href="/clearview" onClick={() => tracking.trackNavClick("clearview", "menu")} className="block py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Clearview</a>
              <a href="/methodology" onClick={() => tracking.trackNavClick("methodology", "menu")} className="block py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</a>
              <a href="/about" onClick={() => tracking.trackNavClick("about", "menu")} className="block py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</a>
            </div>
          </div>
        )}
      </nav>

      <div className={`flex-1 max-w-6xl mx-auto px-4 ${result && !isDemo ? 'py-6 lg:py-8' : 'py-6 sm:py-12 lg:py-24'}`}>

        {/* Hero Section - Collapses after analysis */}
        <div className={`text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ${result && !isDemo ? 'mb-8' : 'mb-10 sm:mb-20'}`}>
          {/* Hero text - hidden after analysis */}
          {(!result || isDemo) && (
            <>
              {/* Trust anchor */}
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex items-center justify-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                As seen in{" "}
                <a
                  href="https://lifehacker.com/tech/ragecheck-manipulative-language-news-articles"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => tracking.trackExternalLink("lifehacker", "hero")}
                  className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-2"
                >
                  Lifehacker
                </a>
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-4 sm:mb-6 leading-[1.1]">
                Is that post <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600">designed</span> to make you angry?
              </h1>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-6 sm:mb-10 leading-relaxed max-w-2xl mx-auto">
                Paste any article or social post. See the persuasive techniques—explained clearly.
              </p>
            </>
          )}

          {/* Search Input */}
          <form
            onSubmit={handleSubmit}
            onPaste={handlePaste}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative ${result && !isDemo ? 'max-w-xl' : 'max-w-2xl'} mx-auto ${isDragging ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-2xl' : ''}`}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-50 bg-indigo-500/10 border-2 border-dashed border-indigo-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-indigo-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold">Drop screenshot here</p>
                </div>
              </div>
            )}

            {/* Image error message */}
            {imageError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm text-center">
                {imageError}
              </div>
            )}

            {imagePreview && (
              <div className="mb-6 relative animate-in fade-in zoom-in duration-300">
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-lg">
                  <img src={imagePreview} alt="Screenshot preview" className="w-full max-h-64 object-contain" />
                  <button type="button" onClick={clearImage} className="absolute top-3 right-3 p-1.5 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-full transition-colors backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <button type="button" onClick={() => { tracking.trackSubmitButtonClick("image"); analyzeImage(); }} disabled={loading} className="mt-4 w-full px-6 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg hover:shadow-xl disabled:opacity-70">
                  {loading ? "Scanning Image..." : "Analyze Screenshot"}
                </button>
              </div>
            )}

            {!imagePreview && (
              <>
                {/* Mobile: Two options - URL first, screenshot second */}
                <div className="sm:hidden space-y-3">
                  {/* URL input with paste button and submit */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={async () => {
                        tracking.trackPasteButtonClick();
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                            setUrl(text);
                          }
                        } catch {
                          // Clipboard access denied - user can paste manually
                        }
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      title="Paste from clipboard"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste a URL..."
                      className="w-full pl-12 pr-20 py-4 bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 rounded-2xl text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={loading || !url.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : "Go"}
                    </button>
                  </div>

                  {/* Screenshot button - secondary */}
                  <label
                    htmlFor="image-upload-mobile"
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-medium text-sm cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Or upload a screenshot
                    <input
                      id="image-upload-mobile"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>

                </div>

                {/* Desktop: Original inline design */}
                <div className="hidden sm:block relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                  <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-xl transition-shadow ring-1 ring-zinc-200 dark:ring-zinc-800 group-focus-within:ring-zinc-300 dark:group-focus-within:ring-zinc-700">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste URL or image (article, tweet, meme)..."
                      className="flex-1 w-full pl-6 pr-4 py-5 bg-transparent border-0 focus:ring-0 text-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                      required
                    />
                    <div className="pr-3 flex items-center gap-3">
                      <label
                        htmlFor="image-upload-desktop"
                        className="p-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 flex-shrink-0"
                        title="Upload screenshot"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                          id="image-upload-desktop"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={loading || !url.trim()}
                        className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-base font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-w-[120px]"
                      >
                        {loading ? (
                          <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          "Analyze"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </form>

          {/* Language selector */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <label htmlFor="language-select" className="text-zinc-500 dark:text-zinc-400">
              Results in:
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => { setLanguage(e.target.value); tracking.trackLanguageSelected(e.target.value); }}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-700 dark:text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">English</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
              <option value="German">Deutsch</option>
              <option value="Portuguese">Português</option>
              <option value="Italian">Italiano</option>
              <option value="Dutch">Nederlands</option>
              <option value="Polish">Polski</option>
              <option value="Russian">Русский</option>
              <option value="Japanese">日本語</option>
              <option value="Korean">한국어</option>
              <option value="Chinese">中文</option>
              <option value="Arabic">العربية</option>
              <option value="Hindi">हिन्दी</option>
              <option value="Turkish">Türkçe</option>
            </select>
          </div>
        </div>

        {/* Live Headlines Section */}
        {(!result || isDemo) && (
          <div className="mt-10 sm:mt-16 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block"></span>
                Analyze Trending Headlines
              </h2>
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
                        tracking.trackTrendingHeadlineClicked(headline.title, i);
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
                      <div className="mt-4 self-start inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg group-hover:bg-indigo-700 transition-colors shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Analyze
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-500">Could not load live headlines.</p>
                </div>
              )}
            </div>

            {/* High Rage Headlines Section - Hidden until populated
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                  High Rage Headlines
                </h3>
                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Headlines scored by AI for manipulative language. Click to analyze.
              </p>
              <HighRageHeadlines
                limit={10}
                onHeadlineClick={(headlineUrl) => {
                  setUrl(headlineUrl);
                  analyze(headlineUrl);
                }}
              />
            </div>
            */}

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
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg group-hover:bg-indigo-700 transition-colors shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analyze
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Subscription CTA */}
            <div className="max-w-md mx-auto mt-12">
              {subscribeStatus === "success" ? (
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{subscribeMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    Get alerted when we launch new features
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={subscribeStatus === "loading"}
                    />
                    <button
                      type="submit"
                      disabled={subscribeStatus === "loading" || !subscribeEmail.trim()}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {subscribeStatus === "loading" ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        "Subscribe"
                      )}
                    </button>
                  </div>
                  {subscribeStatus === "error" && (
                    <p className="text-sm text-rose-600 dark:text-rose-400 text-center">{subscribeMessage}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-xl mx-auto mt-12 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 shadow-2xl text-center">
              <div className="inline-block relative mb-8">
                 <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
                 <svg className="relative animate-spin h-10 w-10 text-indigo-600 mx-auto" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Analyzing Patterns</h3>
              <p className="text-zinc-500 mb-8">Our models are scanning for manipulative framing...</p>

              <div className="space-y-4 max-w-sm mx-auto">
                {Object.entries(SIGNAL_LABELS).map(([key, label], index) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-xs font-medium text-zinc-400 w-32 text-right">{label}</span>
                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full animate-shimmer"
                        style={{
                          width: '100%',
                          animationDelay: `${index * 150}ms`,
                          opacity: 0.6
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Section - hide demo on mobile so users see search bar first */}
        {result && !loading && (
          <div className={`animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 mt-12 ${isDemo ? 'hidden sm:block' : ''}`}>

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

            {!result.success ? (
              <div className="max-w-xl mx-auto p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-center text-rose-700 dark:text-rose-300">
                <svg className="w-12 h-12 mx-auto mb-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-bold text-lg mb-1">Analysis Failed</p>
                <p className="mb-4">{result.error}</p>
                <div className="pt-4 border-t border-rose-200 dark:border-rose-800">
                  <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">
                    Some sites block content extraction. Try one of these instead:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <label
                      htmlFor="error-image-upload"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 rounded-xl font-medium cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Screenshot
                      <input
                        id="error-image-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <>
              {/* Simple share bar */}
              <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-zinc-400">
                    {activeFilter ? `Filtering: ${SIGNAL_LABELS[activeFilter as keyof SignalBreakdown]}` : "Showing all detected patterns"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      setUrl("");
                      setIsDemo(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Analyze New
                  </button>

                  {/* Share Button */}
                  {!isDemo && (
                    <button
                      onClick={onShareImageClick}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm ${
                        imageCopied
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                          : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                      }`}
                    >
                      {imageCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share
                        </>
                      )}
                    </button>
                  )}
                </div>
                {!isDemo && result?.success && result.score !== undefined && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        tracking.trackShareToTwitter();
                        trackShareEvent("Share X");
                        const shareUrl = getShareUrl();
                        const text = `RageCheck score: ${result.score}/100 for ${result.sourceDomain || "this content"}.\n\nBreakdown:`;
                        window.open(buildXIntentUrl(text, shareUrl), "_blank");
                      }}
                      className="p-2 rounded-lg bg-black text-white hover:opacity-90 transition-opacity"
                      title="Share to X"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </button>
                    <button
                      onClick={() => {
                        tracking.trackShareToBluesky();
                        trackShareEvent("Share Bluesky");
                        const shareUrl = getShareUrl();
                        const text = `Ran this through RageCheck. Score: ${result.score}/100 for ${result.sourceDomain || "this content"}.\n\n${shareUrl}`;
                        window.open(buildBlueskyIntentUrl(text), "_blank");
                      }}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:opacity-90 transition-opacity"
                      title="Share to Bluesky"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 568 501"><path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 503.222 453.32 441.497 574.806 321.895 449.291 295.436 408.682c-4.614-7.08-6.78-10.403-11.436-17.809-4.655 7.406-6.822 10.73-11.435 17.809-26.46 40.609-146.062 166.124-207.787 44.638-33.222-64.76-4-129.52 110.875-149.07C109.933 315.634 36.053 297.154 15.778 224.701 9.945 203.859 0 75.492 0 58.146 0-28.906 76.135-1.612 123.121 33.664Z" /></svg>
                    </button>
                    <button
                      onClick={() => {
                        tracking.trackShareToFacebook();
                        trackShareEvent("Share Facebook");
                        window.open(buildFacebookShareUrl(getShareUrl()), "_blank");
                      }}
                      className="p-2 rounded-lg bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
                      title="Share to Facebook"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </button>
                    <button
                      onClick={() => {
                        tracking.trackShareToLinkedIn();
                        trackShareEvent("Share LinkedIn");
                        window.open(buildLinkedInShareUrl(getShareUrl()), "_blank");
                      }}
                      className="p-2 rounded-lg bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
                      title="Share to LinkedIn"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Assessment & Capture */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit flex flex-col gap-6">
                <BentoCard title="Assessment">
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

                    {/* Summary */}
                    {result.shareCardSummary && (
                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full text-left">
                        <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          {result.shareCardSummary}
                        </p>
                      </div>
                    )}

                    {result.llmEnhanced && result.techniqueExplanations && result.techniqueExplanations.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full text-left">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                          Techniques Detected
                        </h4>
                        <div className="space-y-3">
                          {result.techniqueExplanations.map((technique, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 flex-shrink-0" />
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
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 flex-shrink-0" />
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-snug">{pattern}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conversation Shape */}
                    {conversationShape && (
                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full text-left">
                        <div className="space-y-3">
                          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {conversationShape.displayLabel}
                          </p>
                          {conversationShape.microSignals.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {conversationShape.microSignals.map((signal, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                  <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                                  <span>{signal}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </BentoCard>

                {/* Antidote Card: Only show for high rage content */}
                {!isDemo && result?.success && result.score !== undefined && result.score >= 70 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                          Tired of the noise?
                        </h3>
                        <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4 leading-relaxed">
                          This content is designed to trigger you (Score: {result.score}/100). Read the neutral, fact-first version of this story in ClearView.
                        </p>
                        <a 
                          href={`/clearview?url=${encodeURIComponent(result.analyzedUrl || url || "")}`}
                          onClick={() => tracking.trackNavClick("clearview", "antidote_card")}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                          Open in ClearView Reader
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Capture - only show after successful real analysis */}
                {!isDemo && result?.success && (
                <div className="bg-zinc-900 dark:bg-zinc-100 rounded-2xl p-6 shadow-lg border border-zinc-800 dark:border-zinc-200">
                  {emailSubscribed ? (
                    <div className="flex items-center gap-3 text-emerald-400 dark:text-emerald-600">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       <p className="font-bold">You&apos;re in. Talk soon.</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-white dark:text-zinc-900 mb-1">Stay sharp</h3>
                      <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-4 leading-relaxed">
                        How this week&apos;s most viral posts push emotional buttons.
                      </p>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setEmailError(null);
                          setEmailSubscribing(true);
                          const email = (e.target as HTMLFormElement).email.value;
                          try {
                            const res = await fetch("/api/subscribe", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              setEmailSubscribed(true);
                            } else {
                              setEmailError(data.error || "Something went wrong");
                            }
                          } catch {
                            setEmailError("Failed to subscribe.");
                          } finally {
                            setEmailSubscribing(false);
                          }
                        }}
                        className="flex flex-col gap-3"
                      >
                        <input
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          required
                          disabled={emailSubscribing}
                          className="w-full px-4 py-2.5 bg-zinc-800 dark:bg-zinc-200 border border-zinc-700 dark:border-zinc-300 rounded-lg text-sm text-white dark:text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={emailSubscribing}
                          className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-md"
                        >
                          {emailSubscribing ? "..." : "Subscribe"}
                        </button>
                      </form>
                      {emailError && (
                        <p className="text-xs text-rose-400 mt-2 font-medium">{emailError}</p>
                      )}
                    </>
                  )}
                </div>
                )}
                </div>

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
                          &ldquo;{result.contextNotes || "This content exhibits multiple patterns associated with manipulative framing."}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                      {result.signalBreakdown && Object.entries(result.signalBreakdown).map(([key, value]) => (
                         <div
                          key={key}
                          className={`cursor-pointer hover:opacity-80 transition-opacity ${activeFilter && activeFilter !== key ? 'opacity-30' : ''}`}
                          onClick={() => {
                            const newFilter = activeFilter === key ? null : key;
                            setActiveFilter(newFilter);
                            tracking.trackFilterClick(newFilter || "clear");
                          }}
                         >
                           <SignalBar 
                             label={SIGNAL_LABELS[key as keyof SignalBreakdown]} 
                             value={value} 
                             description={SIGNAL_DESCRIPTIONS[key as keyof SignalBreakdown]}
                           />
                         </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* Highlighted Text */}
                  <BentoCard title={result.sourceDomain?.match(/twitter|x\.com|bsky|threads|truthsocial/) ? "Social Context" : "Key Excerpts"} className="flex-1">
                    <div className="relative">
                      <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {result.sourceDomain?.match(/twitter|x\.com|bsky|threads|truthsocial/) ? (
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
                    {!isDemo && (
                      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            tracking.trackShareToTwitter();
                            trackShareEvent("Share X");
                            const shareUrl = getShareUrl();
                            const text = `RageCheck score: ${result.score}/100 for ${result.sourceDomain || "this content"}.\n\nBreakdown:`;
                            window.open(buildXIntentUrl(text, shareUrl), "_blank");
                          }}
                          className="p-1.5 rounded-md bg-black text-white hover:opacity-90 transition-opacity"
                          title="Share to X"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </button>
                        <button
                          onClick={() => {
                            tracking.trackShareToBluesky();
                            trackShareEvent("Share Bluesky");
                            const shareUrl = getShareUrl();
                            const text = `Ran this through RageCheck. Score: ${result.score}/100 for ${result.sourceDomain || "this content"}.\n\n${shareUrl}`;
                            window.open(buildBlueskyIntentUrl(text), "_blank");
                          }}
                          className="p-1.5 rounded-md bg-blue-500 text-white hover:opacity-90 transition-opacity"
                          title="Share to Bluesky"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 568 501"><path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 503.222 453.32 441.497 574.806 321.895 449.291 295.436 408.682c-4.614-7.08-6.78-10.403-11.436-17.809-4.655 7.406-6.822 10.73-11.435 17.809-26.46 40.609-146.062 166.124-207.787 44.638-33.222-64.76-4-129.52 110.875-149.07C109.933 315.634 36.053 297.154 15.778 224.701 9.945 203.859 0 75.492 0 58.146 0-28.906 76.135-1.612 123.121 33.664Z" /></svg>
                        </button>
                        <button
                          onClick={() => {
                            tracking.trackShareToFacebook();
                            trackShareEvent("Share Facebook");
                            window.open(buildFacebookShareUrl(getShareUrl()), "_blank");
                          }}
                          className="p-1.5 rounded-md bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
                          title="Share to Facebook"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </button>
                        <button
                          onClick={() => {
                            tracking.trackShareToLinkedIn();
                            trackShareEvent("Share LinkedIn");
                            window.open(buildLinkedInShareUrl(getShareUrl()), "_blank");
                          }}
                          className="p-1.5 rounded-md bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
                          title="Share to LinkedIn"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        </button>
                        <button
                          onClick={onShareImageClick}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                            imageCopied
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {imageCopied ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Done!
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                              Share
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </BentoCard>
                </div>
              </div>

              {/* Minimal Feedback */}
              {!isDemo && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  {feedbackSubmitted ? (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Thanks for your feedback</span>
                  ) : showFeedbackForm ? (
                    <div className="flex items-center gap-2 max-w-md w-full">
                      <input
                        type="text"
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder={feedbackGiven === "up" ? "What would make this more useful?" : "What could be better?"}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                        maxLength={500}
                        autoFocus
                      />
                      <button
                        onClick={submitFeedbackComment}
                        className="px-3 py-1.5 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackSubmitted(true);
                          setShowFeedbackForm(false);
                        }}
                        className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        Skip
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Helpful?</span>
                      <button
                        onClick={() => { tracking.trackFeedbackThumbClick("up"); submitFeedback("up"); }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          feedbackGiven === "up"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "text-zinc-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                        }`}
                        title="Yes, accurate"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { tracking.trackFeedbackThumbClick("down"); submitFeedback("down"); }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          feedbackGiven === "down"
                            ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                            : "text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        }`}
                        title="Not quite"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              )}



              {/* Support link */}
              <div className="text-center mt-6">
                <p className="text-sm text-zinc-400">
                  RageCheck is free and ad-free. If you find it useful, consider{" "}
                  <a
                    href="https://buy.stripe.com/4gM8wQ8Xq8xU8gw9HvgEg00"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => tracking.trackExternalLink("stripe_donate", "results")}
                    className="text-indigo-500 hover:text-indigo-400 underline underline-offset-2"
                  >
                    supporting its development
                  </a>.
                </p>
              </div>


              </>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 mt-auto">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <a href="/clearview" onClick={() => tracking.trackNavClick("clearview", "footer")} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">ClearView</a>
          <span className="hidden sm:inline">·</span>
          <a href="/about" onClick={() => tracking.trackNavClick("about", "footer")} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</a>
          <span className="hidden sm:inline">·</span>
          <a href="/methodology" onClick={() => tracking.trackNavClick("methodology", "footer")} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</a>
          <span className="hidden sm:inline">·</span>
          <a href="mailto:hello@ragecheck.com" onClick={() => tracking.trackExternalLink("email", "footer")} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Contact</a>
        </div>
      </footer>

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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      <AttributionSurvey
        storagePrefix="ragecheck"
        ready={!!result && !loading}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <HomeContent />
    </Suspense>
  );
}

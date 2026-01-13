"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { getScoreBucket } from "@/lib/share";
import { SIGNAL_LABELS } from "@/lib/shareCard";
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
  shareCardSummary?: string;
  image?: string;
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
                       <span>Enemy Construction</span>
                       <span>85%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 w-[85%] rounded-full"></div>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                       <span>Emotional Arousal</span>
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

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(DEMO_RESULT);
  const [isDemo, setIsDemo] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageCopied, setImageCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [errorReported, setErrorReported] = useState(false);

  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: document.referrer || null }),
    }).catch(() => {});

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
    };
    reader.readAsDataURL(file);
  }, []);

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

  const analyze = async (targetUrl: string) => {
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
        body: JSON.stringify({ url: targetUrl.trim() }),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyze(url);
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

  // Submit feedback
  const submitFeedback = async (rating: "up" | "down", comment?: string) => {
    if (!result?.success || result.score === undefined) return;

    setFeedbackGiven(rating);
    if (rating === "down") {
      setShowFeedbackForm(true);
    } else {
      setFeedbackSubmitted(true);
    }

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
        rating: "down",
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

      <div className={`max-w-6xl mx-auto px-4 ${result && !isDemo ? 'py-6 lg:py-8' : 'py-12 lg:py-24'}`}>
        
        {/* Hero Section - Collapses after analysis */}
        <div className={`text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ${result && !isDemo ? 'mb-8' : 'mb-20'}`}>
          {/* Hero text - hidden after analysis */}
          {(!result || isDemo) && (
            <>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-6 leading-[1.1]">
                Is that post <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600">designed</span> to make you angry?
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                Detect engagement bait in news and social media.
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
                <button type="button" onClick={analyzeImage} disabled={loading} className="mt-4 w-full px-6 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg hover:shadow-xl disabled:opacity-70">
                  {loading ? "Scanning Image..." : "Analyze Screenshot"}
                </button>
              </div>
            )}

            {!imagePreview && (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-xl transition-shadow ring-1 ring-zinc-200 dark:ring-zinc-800 group-focus-within:ring-zinc-300 dark:group-focus-within:ring-zinc-700">
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a URL or screenshot..." className="flex-1 w-full pl-6 pr-4 py-5 bg-transparent border-0 focus:ring-0 text-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400" required />
                  <div className="pr-3 flex items-center gap-3">
                    <label htmlFor="image-upload" className="p-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700" title="Upload screenshot">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <input id="image-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageSelect} className="hidden" />
                    </label>
                    <button type="submit" disabled={loading || !url.trim()} className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-base font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]">
                      {loading ? <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : "Analyze"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!imagePreview && (!result || isDemo) && (
              <div className="mt-6 space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-500">
                  <span>Try an example:</span>
                  <button type="button" onClick={() => tryExample("news")} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-xs">News Article</button>
                  <button type="button" onClick={() => tryExample("tweet")} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-xs">Viral Tweet</button>
                  <button type="button" onClick={() => tryExample("bluesky")} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-xs">Bluesky Post</button>
                </div>
                <p className="text-xs text-zinc-400 text-center hidden sm:block">
                  Or paste a screenshot (⌘V) or drag & drop an image
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Live Headlines Section */}
        {(!result || isDemo) && (
          <div className="mt-24 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                  {/* Simple Share Button */}
                  {!isDemo && (
                    <button
                      onClick={onShareImageClick}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        imageCopied
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {imageCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
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
                          &ldquo;{result.contextNotes || "This content exhibits multiple patterns associated with manipulative framing."}&rdquo;
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
                      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
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
                              Copied!
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

              {/* Prominent Feedback Section */}
              {!isDemo && (
                <div className="mt-10 max-w-2xl mx-auto">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 md:p-8 text-center">
                    {feedbackSubmitted ? (
                      <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                          Thanks for your feedback!
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Your input helps us improve RageCheck for everyone.
                        </p>
                      </div>
                    ) : showFeedbackForm ? (
                      <div className="animate-in fade-in duration-300">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                          What could be better?
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                          Was the score too high, too low, or something else?
                        </p>
                        <textarea
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="The score seems too high because... / I expected... / The analysis missed..."
                          className="w-full p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          rows={3}
                          maxLength={500}
                          autoFocus
                        />
                        <p className="text-xs text-zinc-400 mt-1 text-right">{feedbackComment.length}/500</p>
                        <div className="flex gap-3 mt-4 justify-center">
                          <button
                            onClick={submitFeedbackComment}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                          >
                            Submit Feedback
                          </button>
                          <button
                            onClick={() => {
                              setFeedbackSubmitted(true);
                              setShowFeedbackForm(false);
                            }}
                            className="px-6 py-2.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                          Was this analysis accurate?
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                          Your feedback helps us improve
                        </p>
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => submitFeedback("up")}
                            className={`group flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                              feedbackGiven === "up"
                                ? "bg-green-500 text-white scale-105"
                                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 border border-zinc-200 dark:border-zinc-700 hover:border-green-300 dark:hover:border-green-700"
                            }`}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            Yes, accurate
                          </button>
                          <button
                            onClick={() => submitFeedback("down")}
                            className={`group flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                              feedbackGiven === "down"
                                ? "bg-rose-500 text-white scale-105"
                                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700"
                            }`}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                            Not quite
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";

interface Highlight {
  start: number;
  end: number;
  category: string;
  text: string;
}

interface SignalBreakdown {
  loadedLanguage: number;
  absolutist: number;
  threatPanic: number;
  usVsThem: number;
  engagementBait: number;
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
}

const EXAMPLE_URL = "https://www.bbc.com/news/world-us-canada-68416845";

const SIGNAL_LABELS: Record<keyof SignalBreakdown, string> = {
  loadedLanguage: "Loaded Language",
  absolutist: "Absolutist Phrasing",
  threatPanic: "Threat & Panic",
  usVsThem: "Us-vs-Them Framing",
  engagementBait: "Engagement Bait",
};

// Professional Palette: Rose, Indigo, Emerald, Amber, Slate
const CATEGORY_COLORS: Record<string, string> = {
  loadedLanguage: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
  absolutist: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
  threatPanic: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
  usVsThem: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  engagementBait: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
};

function BentoCard({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6 flex-1">{children}</div>
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
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-56 h-32" viewBox="0 0 100 55">
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
        {/* Simple needle */}
        <line
          x1="50" y1="50" x2="50" y2="15"
          stroke="currentColor"
          strokeWidth="2"
          className="text-zinc-800 dark:text-zinc-200 transition-transform duration-1000 ease-out"
          style={{ transformOrigin: '50px 50px', transform: `rotate(${rotation}deg)` }}
        />
        <circle cx="50" cy="50" r="2" fill="currentColor" className="text-zinc-800 dark:text-zinc-200" />
      </svg>
      <div className="text-center -mt-6">
        <span className={`text-5xl font-bold tracking-tight ${getTextColor(score)}`}>
          {score}
        </span>
        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide mt-1">
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
        <span className="text-xs font-mono text-zinc-500">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
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
    return <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm whitespace-pre-wrap">{text}</p>;
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
        className={`${CATEGORY_COLORS[h.category] || "bg-yellow-100 text-yellow-800"} px-0.5 rounded cursor-help transition-all hover:ring-1 ring-current`}
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
    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm whitespace-pre-wrap font-serif sm:font-sans">{elements}</p>
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
  // Extract handle from title (e.g., "Tweet by @username")
  const handleMatch = title.match(/@([a-zA-Z0-9_.-]+)/);
  const handle = handleMatch ? handleMatch[1] : "user";
  const displayName = handle; // Simplification since we don't have separate display name

  const isTwitter = sourceDomain.includes("twitter.com") || sourceDomain.includes("x.com");
  const isBluesky = sourceDomain.includes("bsky.app");
  const isThreads = sourceDomain.includes("threads.net");
  const isTruthSocial = sourceDomain.includes("truthsocial.com");

  return (
    <div className="mx-auto max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Social Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg
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

      {/* Content */}
      <div className="text-[15px] leading-normal text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap mb-3">
        <HighlightedText 
          text={text} 
          highlights={highlights} 
          filterCategory={activeFilter} 
        />
      </div>

      {/* Image Attachment */}
      {image && (
        <div className="mb-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <img src={image} alt="Post attachment" className="w-full h-auto object-cover max-h-80" />
        </div>
      )}

      {/* Fake Metrics */}      <div className="flex items-center gap-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-zinc-500 text-sm">
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

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const analyze = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setResult(null);
    setActiveFilter(null);

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

  const tryExample = () => {
    setUrl(EXAMPLE_URL);
    analyze(EXAMPLE_URL);
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

  const copyShareCard = () => {
    if (!result?.success || result.score === undefined) return;
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!result?.success || result.score === undefined) return;
    const shareUrl = getShareUrl();
    const shareData = {
      title: `RageCheck: ${result.score}/100`,
      text: `${result.title || "Content"} scored ${result.score}/100 for manipulative patterns`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error - fall back to copy
        copyShareCard();
      }
    } else {
      copyShareCard();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Navigation / Brand */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">RageCheck</span>
          </div>
          <div className="flex gap-4 text-sm font-medium text-zinc-500">
            <a href="/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</a>
            <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">
            Analyze content for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600">manipulative patterns</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            RageCheck uses linguistic analysis to detect loaded language, fear-mongering, and outrage bait in news and media.
          </p>

          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
            <div className="relative group">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-lg blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
               <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste an article URL to analyze..."
                    className="flex-1 w-full px-4 py-4 bg-transparent border-0 focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                    required
                  />
                  <div className="pr-2">
                    <button
                      type="submit"
                      disabled={loading || !url.trim()}
                      className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyzing
                        </span>
                      ) : "Analyze"}
                    </button>
                  </div>
               </div>
            </div>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={tryExample}
                className="text-xs font-medium text-zinc-500 hover:text-indigo-600 transition-colors"
              >
                Try an example article →
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {!result.success ? (
              <div className="max-w-xl mx-auto p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-center text-sm text-rose-700 dark:text-rose-300">
                <p className="font-medium">{result.error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Score & Context Card */}
                <BentoCard className="md:col-span-4" title="Risk Assessment">
                  <div className="flex flex-col items-center justify-center text-center">
                    <ScoreGauge score={result.score!} label={result.label!} />

                    <div className="mt-8 space-y-4 w-full">
                       <div className="grid grid-cols-2 gap-2 text-center text-xs text-zinc-500">
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100">{result.sourceDomain}</span>
                            Source
                          </div>
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100">{result.llmEnhanced ? "AI + Rules" : "Rules Only"}</span>
                            Method
                          </div>
                       </div>
                    </div>

                    {/* Techniques Detected - in sidebar */}
                    {result.llmEnhanced && result.techniqueExplanations && result.techniqueExplanations.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full text-left">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                          Techniques Detected
                        </h4>
                        <div className="space-y-2">
                          {result.techniqueExplanations.map((technique, i) => (
                            <div key={i} className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded border border-zinc-100 dark:border-zinc-800">
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{technique}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Why This Spreads - in sidebar */}
                    {result.llmEnhanced && result.sharingPatterns && result.sharingPatterns.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full text-left">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                          Why This Spreads
                        </h4>
                        <div className="space-y-2">
                          {result.sharingPatterns.map((pattern, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                                {i + 1}
                              </span>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{pattern}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Engagement Economics callout - shows on high scores */}
                    {result.score && result.score >= 50 && (
                      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                          <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Engagement Economics
                          </h4>
                          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            High-scoring content often performs well algorithmically because outrage drives engagement. Consider whether sharing amplifies a message you actually endorse.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer note */}
                    <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 w-full">
                      <p className="text-xs text-zinc-400 leading-snug text-center">
                        RageCheck measures the density of manipulative linguistic patterns relative to neutral reporting.
                      </p>
                    </div>
                  </div>
                </BentoCard>

                {/* Analysis Breakdown */}
                <div className="md:col-span-8 flex flex-col gap-6">
                  {/* Top Row: Title & Signals */}
                  <BentoCard>
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded uppercase tracking-widest">
                             {result.sourceDomain}
                        </span>
                        {result.llmEnhanced && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded uppercase tracking-widest">
                              AI Enhanced
                            </span>
                        )}
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mb-4">
                        {result.title}
                      </h2>
                      
                      {/* Dominant Signal Banner */}
                      {result.signalBreakdown && (
                        (() => {
                           const dominantEntry = Object.entries(result.signalBreakdown).reduce((a, b) => a[1] > b[1] ? a : b);
                           const dominantSignal = dominantEntry[0] as keyof SignalBreakdown;
                           const dominantValue = dominantEntry[1];
                           
                           if (dominantValue > 40) {
                             return (
                               <div className={`p-4 rounded-lg border-l-4 mb-6 ${
                                 dominantValue > 70 ? 'bg-rose-50 border-rose-500 dark:bg-rose-900/10' : 'bg-amber-50 border-amber-500 dark:bg-amber-900/10'
                               }`}>
                                 <h3 className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-zinc-100">
                                   <span className="text-2xl">⚠️</span>
                                   High Levels of {SIGNAL_LABELS[dominantSignal]}
                                 </h3>
                                 <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                                   {result.reasons?.[0] || `Significant density of ${SIGNAL_LABELS[dominantSignal].toLowerCase()} detected.`}
                                 </p>
                               </div>
                             );
                           }
                           return null;
                        })()
                      )}

                      <p className="text-sm text-zinc-500 italic border-l-2 border-zinc-200 pl-4 py-1">
                        &ldquo;{result.contextNotes || "This content exhibits multiple patterns associated with manipulative framing."}&rdquo;
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
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

                  {/* Bottom Row: Highlights */}
                  <BentoCard title={result.sourceDomain?.match(/twitter|x\.com|bsky|threads|truthsocial/) ? "Analysis Target" : "Key Excerpts"} className="flex-1 min-h-[300px]">
                    <div className="relative h-full">
                      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {result.sourceDomain?.match(/twitter|x\.com|bsky|threads|truthsocial/) ? (
                                                      <SocialPostCard 
                                                         title={result.title || ""}
                                                         text={result.textPreview || ""}
                                                         highlights={result.highlights || []}
                                                         sourceDomain={result.sourceDomain || ""}
                                                         activeFilter={activeFilter}
                                                         image={result.image}
                                                      />                        ) : (
                          <HighlightedText
                            text={result.textPreview || ""}
                            highlights={result.highlights || []}
                            filterCategory={activeFilter}
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                       <span className="text-xs text-zinc-400">
                         {activeFilter ? `Showing "${SIGNAL_LABELS[activeFilter as keyof SignalBreakdown]}" only` : "Showing all detected patterns"}
                       </span>
                       <div className="flex items-center gap-3">
                         <button
                           onClick={copyShareCard}
                           className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                         >
                           {copied ? "Copied!" : "Copy Link"}
                         </button>
                         <button
                           onClick={handleShare}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                         >
                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                           </svg>
                           Share
                         </button>
                       </div>
                    </div>
                  </BentoCard>
                </div>


              </div>
            )}
          </div>
        )}

      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 4px;
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

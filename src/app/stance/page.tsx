"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import * as tracking from "@/lib/tracking";
import { type StanceAnalysis } from "@/lib/stance/types";
import { AnalysisResult } from "@/components/stance/AnalysisResult";

interface StanceResult {
  id: string;
  analysis: StanceAnalysis;
  analyzedAt: string;
}

interface Headline {
  source: string;
  lean: string;
  color: string;
  title: string;
  url: string;
  publishedAt: string;
}

const LEAN_COLORS: Record<string, string> = {
  "Far Right": "bg-red-600 text-white",
  "Right": "bg-red-400 text-white",
  "Center": "bg-zinc-500 text-white",
  "Left": "bg-blue-400 text-white",
  "Far Left": "bg-blue-600 text-white",
};

const CURATED_TWEETS = [
  {
    source: "@TuckerCarlson",
    lean: "Far Right",
    title: '"The U.S. could be on the verge of civil war..."',
    url: "https://x.com/TuckerCarlson/status/1976082862878367967",
    image: "https://unavatar.io/twitter/TuckerCarlson",
  },
  {
    source: "@FoxNews",
    lean: "Right",
    title: '"President Trump reacts to the deadly ICE-involved shooting in Minneapolis..."',
    url: "https://x.com/FoxNews/status/2009002750810411250",
    image: "https://unavatar.io/twitter/FoxNews",
  },
  {
    source: "@MayorFrey",
    lean: "Center",
    title: '"The presence of federal immigration enforcement agents is causing chaos..."',
    url: "https://x.com/MayorFrey/status/2008945355925364762",
    image: "https://unavatar.io/twitter/MayorFrey",
  },
  {
    source: "@AOC",
    lean: "Left",
    title: '"Members of Congress have legal authority to enter ICE facilities..."',
    url: "https://x.com/AOC/status/1921269087398765013",
    image: "https://unavatar.io/twitter/AOC",
  },
  {
    source: "@BernieSanders",
    lean: "Far Left",
    title: `"Trump's authoritarianism in real time: Conduct massive illegal raids..."`,
    url: "https://x.com/BernieSanders/status/1931727686952526003",
    image: "https://unavatar.io/twitter/BernieSanders",
  },
];

export default function StancePage() {
  const [url, setUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StanceResult | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);

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

  // ---- Image handling ----
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) { setImagePreview(null); return; }
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { setImageError("Please upload a JPEG, PNG, GIF, or WebP image"); setImagePreview(null); return; }
    if (file.size > 5 * 1024 * 1024) { setImageError("Image too large (max 5MB)"); setImagePreview(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setImagePreview(ev.target?.result as string); setUrl(""); setPasteText(""); };
    reader.readAsDataURL(file);
  };
  const clearImage = () => { setImagePreview(null); setImageError(null); const fi = document.getElementById("stance-img") as HTMLInputElement; if (fi) fi.value = ""; };
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;
        if (file.size > 5 * 1024 * 1024) { setImageError("Image too large (max 5MB)"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => { setImagePreview(ev.target?.result as string); setUrl(""); setPasteText(""); setImageError(null); };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.types.includes("Files")) setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    const file = files[0];
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { setImageError("Please drop a JPEG, PNG, GIF, or WebP image"); return; }
    if (file.size > 5 * 1024 * 1024) { setImageError("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setImagePreview(ev.target?.result as string); setUrl(""); setPasteText(""); setImageError(null); };
    reader.readAsDataURL(file);
  }, []);

  // ---- Analysis ----
  const doAnalyze = async (body: Record<string, string>) => {
    setLoading(true); setError(null); setResult(null);
    tracking.trackInteraction("stance", "analysis_started", Object.keys(body)[0]);
    try {
      const res = await fetch("/api/stance/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Analysis failed"); return; }
      setResult(data.result);
      // Wait for React to render the result component
      setTimeout(() => {
        const resultElement = document.getElementById("analysis-result");
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
             window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
      tracking.trackInteraction("stance", "analysis_completed", data.result.analysis.posture.primary);
    } catch { setError("Failed to connect. Please try again."); }
    finally { setLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreview) doAnalyze({ image: imagePreview });
    else if (inputMode === "text" && pasteText.trim()) doAnalyze({ text: pasteText.trim() });
    else if (url.trim()) doAnalyze({ url: url.trim() });
  };

  return (
    <div className="min-h-screen bg-[#0a0a10] text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50 sticky top-0 z-50 bg-[#0a0a10]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/stance" onClick={() => setResult(null)} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                </svg>
                </div>
                <h1 className="text-lg font-bold tracking-wide">
                <span className="text-violet-400">Stance</span>
                </h1>
            </Link>
            <span className="text-[10px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Experimental
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition-colors">RageCheck</Link>
            <Link href="/defensecheck" className="hover:text-zinc-300 transition-colors">DefenseCheck</Link>
            <Link href="/stance/about" className="hover:text-zinc-300 transition-colors">About</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        {!result && (
          <div className="text-center space-y-3 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              What is this content <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">really doing?</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Full 8-stage rhetorical analysis — posture, defense patterns, persuasion techniques, predicted effects, and actionable interventions.
            </p>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} onPaste={handlePaste} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          className={`relative max-w-2xl mx-auto transition-all duration-300 ${isDragging ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-[#0a0a10] rounded-2xl scale-105" : ""} ${result ? "hidden" : ""}`}>
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-violet-500/10 border-2 border-dashed border-violet-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <p className="text-violet-400 font-bold text-lg">Drop screenshot to analyze</p>
            </div>
          )}
          {imageError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">{imageError}</div>}
          {imagePreview && (
            <div className="mb-6 relative">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800 shadow-2xl">
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-contain" />
                <button type="button" onClick={clearImage} className="absolute top-3 right-3 p-1.5 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-full transition-colors backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <button type="button" onClick={() => doAnalyze({ image: imagePreview })} disabled={loading}
                className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-bold text-lg hover:from-violet-400 hover:to-violet-500 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20">
                {loading ? "Analyzing..." : "Analyze Screenshot"}
              </button>
            </div>
          )}
          {!imagePreview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setInputMode("url")} 
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${inputMode === "url" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-500 hover:text-zinc-300"}`}>URL</button>
                <button type="button" onClick={() => setInputMode("text")} 
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${inputMode === "text" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-500 hover:text-zinc-300"}`}>Paste Text</button>
                <span className="text-zinc-600 text-xs ml-1">or drop/paste a screenshot</span>
              </div>
              {inputMode === "url" ? (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                  <div className="relative flex items-center bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 group-focus-within:ring-zinc-700">
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste URL or image (tweet, article, meme)..."
                      className="flex-1 w-full pl-6 pr-4 py-5 bg-transparent border-0 focus:ring-0 focus:outline-none text-lg text-zinc-100 placeholder-zinc-500" />
                    <div className="pr-3 flex items-center gap-3">
                      <label htmlFor="stance-img" className="p-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors bg-zinc-800 rounded-xl hover:bg-zinc-700 flex-shrink-0" title="Upload screenshot">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <input id="stance-img" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageSelect} className="hidden" />
                      </label>
                      <button type="submit" disabled={loading || !url.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl text-base font-bold hover:from-violet-400 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[120px] shadow-lg shadow-violet-500/20">
                        {loading ? <Spinner /> : "Analyze"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 group-focus-within:ring-zinc-700">
                    <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste a message, tweet, email, article text..."
                      rows={6} maxLength={15000} className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none rounded-2xl p-5 text-base text-zinc-100 placeholder-zinc-500 resize-y" />
                    <div className="flex items-center justify-between px-5 pb-4">
                      <span className="text-xs text-zinc-600">{pasteText.length.toLocaleString()} / 15,000</span>
                      <button type="submit" disabled={loading || !pasteText.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl text-sm font-bold hover:from-violet-400 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20">
                        {loading ? <Spinner /> : "Analyze"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {loading && !result && (
             <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-in fade-in duration-500">
                <Spinner size="large" />
                <p className="text-zinc-500 animate-pulse">Deconstructing rhetoric...</p>
             </div>
        )}

        {/* Trending Headlines */}
        {!result && !loading && (
          <div className="max-w-5xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-8 bg-violet-500 rounded-full inline-block"></span>
              <h3 className="text-lg font-bold text-zinc-100">Analyze Trending Headlines</h3>
            </div>
            {headlinesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-32 animate-pulse" />
                ))}
              </div>
            ) : headlines.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {headlines.map((headline, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      tracking.trackInteraction("stance", "headline_clicked", headline.title);
                      setUrl(headline.url);
                      doAnalyze({ url: headline.url });
                    }}
                    disabled={loading}
                    className="group flex flex-col justify-between text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-violet-500/50 hover:shadow-md hover:shadow-violet-500/5 transition-all h-full disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          {headline.source}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${LEAN_COLORS[headline.lean] || "bg-gray-400 text-white"}`}>
                          {headline.lean}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-200 line-clamp-3 leading-snug group-hover:text-violet-400 transition-colors">
                        {headline.title}
                      </p>
                    </div>
                    <div className="mt-4 self-start inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg group-hover:bg-violet-500 transition-colors shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analyze
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                <p className="text-zinc-500 text-sm">Could not load live headlines.</p>
              </div>
            )}

            {/* Viral on Social Media */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Viral on Social Media
                </h3>
                <div className="h-px flex-1 bg-zinc-800"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {CURATED_TWEETS.map((tweet, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      tracking.trackInteraction("stance", "tweet_clicked", tweet.source);
                      setUrl(tweet.url);
                      doAnalyze({ url: tweet.url });
                    }}
                    disabled={loading}
                    className="group text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-violet-500/50 hover:shadow-md hover:shadow-violet-500/5 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={tweet.image}
                        alt={tweet.source}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-zinc-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${tweet.source.slice(1)}&background=random`;
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-100">{tweet.source}</span>
                        <span className={`text-[9px] w-fit font-medium px-1.5 py-px rounded ${LEAN_COLORS[tweet.lean] || "bg-gray-400 text-white"}`}>
                          {tweet.lean}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed group-hover:text-violet-400 transition-colors">
                      {tweet.title}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg group-hover:bg-violet-500 transition-colors shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analyze
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

        {/* ===== RESULTS ===== */}
        {result && (
            <div id="analysis-result">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setResult(null)} className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Analyze Another
                    </button>
                    <span className="text-xs text-zinc-600 font-mono">ID: {result.id}</span>
                </div>
                <AnalysisResult result={result} />
            </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/50 mt-16 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-600 gap-4">
            <div className="flex flex-col gap-1">
                <span className="font-semibold text-zinc-500">Stance by RageCheck</span>
                <span>Uncovering rhetorical manipulation since 2026.</span>
            </div>
          <div className="flex gap-6">
            <Link href="/stance/about" className="hover:text-zinc-400 transition-colors">Methodology</Link>
            <Link href="/" className="hover:text-zinc-400 transition-colors">RageCheck</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Spinner({ size = "small" }: { size?: "small" | "large" }) {
    const dims = size === "large" ? "h-12 w-12" : "h-4 w-4";
  return (
    <svg className={`animate-spin ${dims} mx-auto`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
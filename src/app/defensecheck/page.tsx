"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { SocialShareBar } from "@/components/SocialShareBar";
import { getDefenseCheckShareText } from "@/lib/share/defenseCheckShareText";
import * as tracking from "@/lib/tracking";
import {
  DefenseCategory,
  CATEGORY_META,
  type DetectedPattern,
  type AlternativeReading,
  type InputType,
} from "@/lib/defensecheck/types";

interface DefenseCheckResult {
  id: string;
  score: number;
  scoreLabel: string;
  patterns: DetectedPattern[];
  alternativeReading: AlternativeReading;
  overallAssessment: string;
  inputType: InputType;
  analyzedAt: string;
}

const MAX_TEXT_LENGTH = 15000;

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
    title: "\"The U.S. could be on the verge of civil war...\"",
    url: "https://x.com/TuckerCarlson/status/1976082862878367967",
    image: "https://unavatar.io/twitter/TuckerCarlson",
  },
  {
    source: "@FoxNews",
    lean: "Right",
    title: "\"President Trump reacts to the deadly ICE-involved shooting in Minneapolis...\"",
    url: "https://x.com/FoxNews/status/2009002750810411250",
    image: "https://unavatar.io/twitter/FoxNews",
  },
  {
    source: "@MayorFrey",
    lean: "Center",
    title: "\"The presence of federal immigration enforcement agents is causing chaos...\"",
    url: "https://x.com/MayorFrey/status/2008945355925364762",
    image: "https://unavatar.io/twitter/MayorFrey",
  },
  {
    source: "@AOC",
    lean: "Left",
    title: "\"Members of Congress have legal authority to enter ICE facilities...\"",
    url: "https://x.com/AOC/status/1921269087398765013",
    image: "https://unavatar.io/twitter/AOC",
  },
  {
    source: "@BernieSanders",
    lean: "Far Left",
    title: "\"Trump's authoritarianism in real time: Conduct massive illegal raids...\"",
    url: "https://x.com/BernieSanders/status/1931727686952526003",
    image: "https://unavatar.io/twitter/BernieSanders",
  },
];

export default function DefenseCheckPage() {
  const [url, setUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DefenseCheckResult | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
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

  // ---- Image handling (same patterns as RageCheck) ----

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
      setPasteText("");
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageError(null);
    const fileInput = document.getElementById("dc-image-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

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
          setPasteText("");
          setImageError(null);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

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
      setPasteText("");
      setImageError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  // ---- Analysis ----

  const analyzeImage = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedCategories(new Set());
    tracking.trackInteraction("defensecheck", "analysis_started", "image");

    try {
      const res = await fetch("/api/defensecheck/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Analysis failed");
        return;
      }
      setResult(data.result);
      window.scrollTo({ top: 0, behavior: "smooth" });
      tracking.trackInteraction("defensecheck", "analysis_completed", undefined, data.result.score);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedCategories(new Set());
    clearImage();
    tracking.trackInteraction("defensecheck", "analysis_started", "url");

    try {
      const res = await fetch("/api/defensecheck/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Analysis failed");
        return;
      }
      setResult(data.result);
      window.scrollTo({ top: 0, behavior: "smooth" });
      tracking.trackInteraction("defensecheck", "analysis_completed", undefined, data.result.score);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async () => {
    if (!pasteText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedCategories(new Set());
    clearImage();
    tracking.trackInteraction("defensecheck", "analysis_started", "text");

    try {
      const res = await fetch("/api/defensecheck/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Analysis failed");
        return;
      }
      setResult(data.result);
      window.scrollTo({ top: 0, behavior: "smooth" });
      tracking.trackInteraction("defensecheck", "analysis_completed", undefined, data.result.score);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreview) {
      analyzeImage();
    } else if (inputMode === "text" && pasteText.trim()) {
      analyzeText();
    } else if (url.trim()) {
      analyzeUrl(url);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const shareUrl = result
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/defensecheck/share?id=${result.id}`
    : "";
  const shareTexts = result
    ? getDefenseCheckShareText(result, shareUrl)
    : null;

  return (
    <div className="min-h-screen bg-[#0c0c12] text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-wide">
              <span className="text-teal-400">Defense</span>Check
            </h1>
            <span className="text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Experimental
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition-colors">RageCheck</Link>
            <Link href="/clearview" className="hover:text-zinc-300 transition-colors">ClearView</Link>
            <Link href="/defensecheck/about" className="hover:text-zinc-300 transition-colors">About</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        {!result && (
          <div className="text-center space-y-3 pt-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Is that response <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600">actually defensive?</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Paste any message, URL, or screenshot. We&apos;ll identify defensive rhetoric patterns — one plausible reading, not a diagnosis.
            </p>
          </div>
        )}

        {/* Input Section */}
        <form
          onSubmit={handleSubmit}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative max-w-2xl mx-auto ${isDragging ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-[#0c0c12] rounded-2xl" : ""}`}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-teal-500/10 border-2 border-dashed border-teal-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-teal-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-teal-400 font-bold">Drop screenshot here</p>
              </div>
            </div>
          )}

          {/* Image error */}
          {imageError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {imageError}
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="mb-6 relative">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800">
                <img src={imagePreview} alt="Screenshot preview" className="w-full max-h-64 object-contain" />
                <button type="button" onClick={clearImage} className="absolute top-3 right-3 p-1.5 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-full transition-colors backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <button
                type="button"
                onClick={analyzeImage}
                disabled={loading}
                className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold text-lg hover:from-teal-400 hover:to-teal-500 transition-all disabled:opacity-50"
              >
                {loading ? "Analyzing Screenshot..." : "Analyze Screenshot"}
              </button>
            </div>
          )}

          {/* Input modes (when no image) */}
          {!imagePreview && (
            <div className="space-y-3">
              {/* Mode toggle */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setInputMode("url")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    inputMode === "url"
                      ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    inputMode === "text"
                      ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Paste Text
                </button>
                <span className="text-zinc-600 text-xs ml-1">or drop/paste a screenshot</span>
              </div>

              {inputMode === "url" ? (
                /* URL input — matches RageCheck style */
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                  <div className="relative flex items-center bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 group-focus-within:ring-zinc-700">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste URL or image (tweet, email, article)..."
                      className="flex-1 w-full pl-6 pr-4 py-5 bg-transparent border-0 focus:ring-0 focus:outline-none text-lg text-zinc-100 placeholder-zinc-500"
                    />
                    <div className="pr-3 flex items-center gap-3">
                      <label
                        htmlFor="dc-image-upload"
                        className="p-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors bg-zinc-800 rounded-xl hover:bg-zinc-700 flex-shrink-0"
                        title="Upload screenshot"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                          id="dc-image-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={loading || !url.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-base font-bold hover:from-teal-400 hover:to-teal-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[120px]"
                      >
                        {loading ? (
                          <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : "Analyze"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Paste text mode */
                <div className="space-y-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 group-focus-within:ring-zinc-700">
                      <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder="Paste a message, email, conversation excerpt, or text..."
                        rows={6}
                        maxLength={MAX_TEXT_LENGTH}
                        className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none rounded-2xl p-5 text-base text-zinc-100 placeholder-zinc-500 resize-y"
                      />
                      <div className="flex items-center justify-between px-5 pb-4">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="dc-image-upload-text"
                            className="p-2 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors bg-zinc-800 rounded-lg hover:bg-zinc-700"
                            title="Upload screenshot"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <input
                              id="dc-image-upload-text"
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-600">
                            {pasteText.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="submit"
                          disabled={loading || !pasteText.trim()}
                          className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-bold hover:from-teal-400 hover:to-teal-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : "Analyze"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Trending Headlines */}
        {!result && (
          <div className="max-w-4xl mx-auto mt-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-8 bg-teal-500 rounded-full inline-block"></span>
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
                      tracking.trackInteraction("defensecheck", "headline_clicked", headline.title);
                      setUrl(headline.url);
                      analyzeUrl(headline.url);
                    }}
                    disabled={loading}
                    className="group flex flex-col justify-between text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-teal-500/50 hover:shadow-md hover:shadow-teal-500/5 transition-all h-full disabled:opacity-50"
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
                      <p className="text-sm font-semibold text-zinc-200 line-clamp-3 leading-snug group-hover:text-teal-400 transition-colors">
                        {headline.title}
                      </p>
                    </div>
                    <div className="mt-4 self-start inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg group-hover:bg-teal-500 transition-colors shadow-sm">
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
                      tracking.trackInteraction("defensecheck", "tweet_clicked", tweet.source);
                      setUrl(tweet.url);
                      analyzeUrl(tweet.url);
                    }}
                    disabled={loading}
                    className="group text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-teal-500/50 hover:shadow-md hover:shadow-teal-500/5 transition-all disabled:opacity-50"
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
                    <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed group-hover:text-teal-400 transition-colors">
                      {tweet.title}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg group-hover:bg-teal-500 transition-colors shadow-sm">
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

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Score Gauge */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
              <ScoreGauge score={result.score} />
              <p className="mt-4 text-lg font-semibold text-zinc-200">
                {result.scoreLabel}
              </p>
              <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wider">
                Defensive rhetoric score
              </p>
            </div>

            {/* Interpretive Disclaimer */}
            <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4 flex gap-3">
              <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-teal-300/80">
                This is one plausible reading of the text. Defensive language
                can have many explanations — stress, communication style,
                cultural context, or the nature of the conversation itself.
              </p>
            </div>

            {/* Category Breakdown */}
            {result.patterns.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                  Patterns Detected
                </h3>
                <div className="space-y-3">
                  {result.patterns.map((pattern, i) => {
                    const meta = CATEGORY_META[pattern.category as DefenseCategory];
                    const isExpanded = expandedCategories.has(pattern.category);
                    return (
                      <div key={i} className="border border-zinc-800 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCategory(pattern.category)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-zinc-800/30 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold" style={{ color: meta?.color || "#14b8a6" }}>
                                {meta?.label || pattern.category}
                              </span>
                              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                                {Math.round(pattern.confidence * 100)}% confidence
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${(pattern.severity / 10) * 100}%`,
                                    backgroundColor: meta?.color || "#14b8a6",
                                  }}
                                />
                              </div>
                              <span className="text-xs text-zinc-500 w-8 text-right">{pattern.severity}/10</span>
                            </div>
                          </div>
                          <svg
                            className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Evidence</p>
                              <blockquote className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border-l-2" style={{ borderColor: meta?.color || "#14b8a6" }}>
                                &ldquo;{pattern.evidence}&rdquo;
                              </blockquote>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Explanation</p>
                              <p className="text-sm text-zinc-400">{pattern.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No patterns */}
            {result.patterns.length === 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                <p className="text-zinc-400">
                  No significant defensive rhetoric patterns were detected in this text.
                </p>
              </div>
            )}

            {/* Alternative Reading */}
            <div className="bg-zinc-900/50 border border-teal-500/20 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Another Way to Read This
              </h3>
              <p className="text-sm text-zinc-300">{result.alternativeReading.summary}</p>
              {result.alternativeReading.factors.length > 0 && (
                <ul className="space-y-1.5 ml-4">
                  {result.alternativeReading.factors.map((factor, i) => (
                    <li key={i} className="text-sm text-zinc-400 list-disc">{factor}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Overall Assessment */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-2">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Overall Assessment</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{result.overallAssessment}</p>
            </div>

            {/* Share */}
            {shareTexts && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Share This Analysis</h3>
                <SocialShareBar
                  url={shareUrl}
                  xText={shareTexts.xText}
                  blueskyText={shareTexts.blueskyText}
                  nativeText={shareTexts.nativeText}
                  nativeTitle={shareTexts.nativeTitle}
                  context="defensecheck"
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-zinc-600">
          <span>DefenseCheck by RageCheck</span>
          <div className="flex gap-4">
            <Link href="/defensecheck/about" className="hover:text-zinc-400 transition-colors">Methodology</Link>
            <Link href="/" className="hover:text-zinc-400 transition-colors">RageCheck</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Score Gauge Component
function ScoreGauge({ score }: { score: number }) {
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 25) return "#2dd4bf";
    if (s <= 50) return "#14b8a6";
    if (s <= 75) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="inline-flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path d="M 10 110 A 80 80 0 0 1 190 110" fill="none" stroke="#27272a" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M 10 110 A 80 80 0 0 1 190 110" fill="none" stroke={getColor(score)} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${progress} ${circumference}`} className="transition-all duration-1000 ease-out" />
        <text x="100" y="95" textAnchor="middle" fill={getColor(score)} fontSize="42" fontWeight="bold">{score}</text>
        <text x="100" y="115" textAnchor="middle" fill="#71717a" fontSize="12">/ 100</text>
      </svg>
    </div>
  );
}

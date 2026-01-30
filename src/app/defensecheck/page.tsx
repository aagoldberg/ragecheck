"use client";

import { useState, useCallback } from "react";
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

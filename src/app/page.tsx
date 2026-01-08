"use client";

import { useState } from "react";

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
}

const EXAMPLE_URL = "https://www.bbc.com/news/world-us-canada-68416845";

const SIGNAL_LABELS: Record<keyof SignalBreakdown, string> = {
  loadedLanguage: "Loaded Language",
  absolutist: "Certainty/Absolutist",
  threatPanic: "Threat/Panic Framing",
  usVsThem: "Us-vs-Them",
  engagementBait: "Engagement Bait",
};

const CATEGORY_COLORS: Record<string, string> = {
  loadedLanguage: "bg-red-200 dark:bg-red-900",
  absolutist: "bg-purple-200 dark:bg-purple-900",
  threatPanic: "bg-orange-200 dark:bg-orange-900",
  usVsThem: "bg-blue-200 dark:bg-blue-900",
  engagementBait: "bg-yellow-200 dark:bg-yellow-900",
};

function SignalBar({ label, value }: { label: string; value: number }) {
  const getBarColor = (val: number) => {
    if (val < 33) return "bg-green-500";
    if (val < 66) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-600 dark:text-zinc-400 w-40 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(value)} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm text-zinc-500 w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights: Highlight[];
}) {
  if (!highlights || highlights.length === 0) {
    return <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{text}</p>;
  }

  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
  const elements: React.ReactNode[] = [];
  let lastEnd = 0;

  sortedHighlights.forEach((h, i) => {
    if (h.start > lastEnd) {
      elements.push(
        <span key={`text-${i}`}>{text.substring(lastEnd, h.start)}</span>
      );
    }
    elements.push(
      <mark
        key={`highlight-${i}`}
        className={`${CATEGORY_COLORS[h.category] || "bg-yellow-200"} px-0.5 rounded`}
        title={h.category}
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
    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{elements}</p>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const getBgColor = () => {
    if (score <= 33) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score <= 66) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl ${getBgColor()}`}>
      <span className="text-4xl font-bold">{score}</span>
      <div className="flex flex-col">
        <span className="text-sm opacity-75">out of 100</span>
        <span className="font-semibold">{label}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const analyze = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
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

  const copyShareCard = () => {
    if (!result?.success || result.score === undefined) return;
    const text = `BaitCheck score: ${result.score}/100 - ${result.sourceDomain}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            BaitCheck
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Detect outrage-bait patterns in media
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a URL (article, blog, post...)"
              className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={tryExample}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try an example
            </button>
          </div>
        </form>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {!result.success ? (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  {result.error || "Failed to analyze URL"}
                </p>
                {result.sourceDomain && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Domain: {result.sourceDomain}
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Title & Domain */}
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {result.title}
                  </h2>
                  <p className="text-sm text-zinc-500">{result.sourceDomain}</p>
                </div>

                {/* Score */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Outrage Likelihood
                      </h3>
                      {result.llmEnhanced && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
                          AI Enhanced
                        </span>
                      )}
                    </div>
                    <ScoreBadge score={result.score!} label={result.label!} />
                  </div>
                  <button
                    onClick={copyShareCard}
                    className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy share card"}
                  </button>
                </div>

                {/* Context Notes (from LLM) */}
                {result.contextNotes && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <span className="font-medium">Context: </span>
                      {result.contextNotes}
                    </p>
                  </div>
                )}

                {/* Reasons */}
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                    Why
                  </h3>
                  <ul className="space-y-2">
                    {result.reasons?.map((reason, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="text-zinc-400 mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Signal Breakdown */}
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                    Signal Breakdown
                  </h3>
                  <div className="space-y-3">
                    {result.signalBreakdown &&
                      Object.entries(result.signalBreakdown).map(([key, value]) => (
                        <SignalBar
                          key={key}
                          label={SIGNAL_LABELS[key as keyof SignalBreakdown]}
                          value={value}
                        />
                      ))}
                  </div>
                </div>

                {/* Highlighted Text */}
                {result.textPreview && (
                  <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                      Extracted Text (with flagged phrases)
                    </h3>
                    <div className="max-h-64 overflow-y-auto">
                      <HighlightedText
                        text={result.textPreview}
                        highlights={result.highlights?.filter(
                          (h) => h.start < 500
                        ) || []}
                      />
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    This tool flags common outrage-bait patterns. It may be wrong.
                    Use judgment.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-zinc-500">
          <p>BaitCheck - Pattern detector for manipulative outrage framing</p>
        </footer>
      </div>
    </div>
  );
}

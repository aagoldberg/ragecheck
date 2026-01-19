"use client";

import { useState, useEffect } from "react";

interface ScoredHeadline {
  id: number;
  url: string;
  title: string;
  description?: string;
  source: string;
  lean: string;
  score?: number;
  summary?: string;
  analysis?: string;
  topic?: string;
  category?: string;
  signalBreakdown?: {
    arousal: number;
    enemy_construction: number;
    moral_condemnation: number;
    simplification: number;
    call_to_conflict: number;
  };
  // RSS metadata
  author?: string;
  imageUrl?: string;
  rssCategories?: string[];
  scoredAt?: string;
}

// Color mapping for political lean
const leanColors: Record<string, { bg: string; text: string; border: string }> = {
  "Far Left": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
  "Left": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  "Center-Left": { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
  "Center": { bg: "bg-gray-100 dark:bg-gray-800/50", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-700" },
  "Center-Right": { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  "Right": { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  "Far Right": { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-200 dark:border-fuchsia-800" },
};

function getScoreColor(score: number): string {
  if (score >= 70) return "text-red-600 dark:text-red-400";
  if (score >= 50) return "text-orange-600 dark:text-orange-400";
  if (score >= 30) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 30) return "bg-yellow-500";
  return "bg-green-500";
}

interface Props {
  onHeadlineClick?: (url: string) => void;
  limit?: number;
}

export function HighRageHeadlines({ onHeadlineClick, limit = 20 }: Props) {
  const [headlines, setHeadlines] = useState<ScoredHeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHeadlines() {
      try {
        const response = await fetch("/api/headlines/scored");
        const data = await response.json();

        if (data.success) {
          setHeadlines(data.headlines.slice(0, limit));
        } else {
          setError(data.error || "Failed to load headlines");
        }
      } catch (err) {
        setError("Failed to fetch headlines");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchHeadlines();
  }, [limit]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>{error}</p>
      </div>
    );
  }

  if (headlines.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>No scored headlines yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {headlines.map((headline) => {
        const colors = leanColors[headline.lean] || leanColors["Center"];
        const score = headline.score || 0;

        return (
          <div
            key={headline.id}
            onClick={() => onHeadlineClick?.(headline.url)}
            className={`group relative rounded-xl border ${colors.border} bg-white dark:bg-zinc-900 hover:shadow-md transition-all cursor-pointer overflow-hidden`}
          >
            <div className="flex">
              {/* Image thumbnail */}
              {headline.imageUrl && (
                <div className="w-24 sm:w-32 flex-shrink-0">
                  <img
                    src={headline.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-4 min-w-0">
                {/* Score badge */}
                <div className="absolute -top-2 -right-2 flex items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getScoreBg(score)}`}>
                    {score}
                  </div>
                </div>

                {/* Source, lean, author, and category */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                    {headline.source}
                  </span>
                  <span className="text-xs text-zinc-400">{headline.lean}</span>
                  {headline.author && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      by {headline.author}
                    </span>
                  )}
                  {headline.category && (
                    <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      {headline.category.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-8 line-clamp-2">
                  {headline.title}
                </h3>

                {/* Analysis (preferred) or Summary */}
                {(headline.analysis || headline.summary) && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {headline.analysis || headline.summary}
                  </p>
                )}

                {/* Score bar */}
                <div className="mt-3 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBg(score)} transition-all`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact version for sidebar or smaller displays
export function HighRageHeadlinesCompact({ onHeadlineClick, limit = 10 }: Props) {
  const [headlines, setHeadlines] = useState<ScoredHeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHeadlines() {
      try {
        const response = await fetch("/api/headlines/scored");
        const data = await response.json();
        if (data.success) {
          setHeadlines(data.headlines.slice(0, limit));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHeadlines();
  }, [limit]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
        ))}
      </div>
    );
  }

  if (headlines.length === 0) return null;

  return (
    <div className="space-y-2">
      {headlines.map((headline, index) => {
        const score = headline.score || 0;
        return (
          <div
            key={headline.id}
            onClick={() => onHeadlineClick?.(headline.url)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${getScoreBg(score)}`}>
              {score}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {headline.title}
              </p>
              <p className="text-xs text-zinc-500">{headline.source}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

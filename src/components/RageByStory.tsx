"use client";

import { useState, useEffect } from "react";

interface ScoredHeadline {
  id: number;
  url: string;
  title: string;
  source: string;
  lean: string;
  score?: number;
  analysis?: string;
  signalBreakdown?: {
    arousal: number;
    enemy_construction: number;
    moral_condemnation: number;
    simplification: number;
    call_to_conflict: number;
  };
  imageUrl?: string;
  storySlug?: string;
  storyLabel?: string;
}

interface FramingExamples {
  divisionWords: string[];
  emotionWords: string[];
  moralWords: string[];
  conflictWords: string[];
  simplificationNote: string;
}

interface StoryGroup {
  slug: string;
  label: string;
  headlines: ScoredHeadline[];
  avgScore: number;
  topSignal: string;
  framingExamples?: FramingExamples;
}

// Format word lists for display (e.g., "word1," "word2," "word3")
function formatWordList(words: string[]): string {
  if (words.length === 0) return "";
  return words.map(w => `"${w}"`).join(", ");
}

// Format division words as opposing pairs when possible
function formatDivisionWords(words: string[]): string {
  if (words.length === 0) return "";
  if (words.length === 2) {
    return `"${words[0]}" vs "${words[1]}"`;
  }
  return words.map(w => `"${w}"`).join(", ");
}

// Pattern types for ranking (maps to signal breakdown)
type PatternType = "division" | "emotion" | "moral" | "conflict" | "simplification";

interface RankedPattern {
  type: PatternType;
  score: number;
  hasContent: boolean;
}

// Get patterns ranked by signal strength for a story
function getRankedPatterns(
  headlines: ScoredHeadline[],
  fe?: FramingExamples
): RankedPattern[] {
  // Calculate total signal scores across all headlines
  const totals = {
    division: 0,      // enemy_construction
    emotion: 0,       // arousal
    moral: 0,         // moral_condemnation
    conflict: 0,      // call_to_conflict
    simplification: 0 // simplification
  };

  for (const h of headlines) {
    if (h.signalBreakdown) {
      totals.division += h.signalBreakdown.enemy_construction;
      totals.emotion += h.signalBreakdown.arousal;
      totals.moral += h.signalBreakdown.moral_condemnation;
      totals.conflict += h.signalBreakdown.call_to_conflict;
      totals.simplification += h.signalBreakdown.simplification;
    }
  }

  // Build ranked list with content availability
  const patterns: RankedPattern[] = [
    {
      type: "division",
      score: totals.division,
      hasContent: (fe?.divisionWords?.length || 0) > 0
    },
    {
      type: "emotion",
      score: totals.emotion,
      hasContent: (fe?.emotionWords?.length || 0) > 0
    },
    {
      type: "moral",
      score: totals.moral,
      hasContent: (fe?.moralWords?.length || 0) > 0
    },
    {
      type: "conflict",
      score: totals.conflict,
      hasContent: (fe?.conflictWords?.length || 0) > 0
    },
    {
      type: "simplification",
      score: totals.simplification,
      hasContent: !!fe?.simplificationNote
    }
  ];

  // Sort by score descending, then filter to only those with content
  return patterns
    .sort((a, b) => b.score - a.score)
    .filter(p => p.hasContent);
}

interface Props {
  onHeadlineClick?: (url: string) => void;
  minArticles?: number;
}

export function RageByStory({ onHeadlineClick, minArticles = 1 }: Props) {
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchStories() {
      try {
        const response = await fetch("/api/headlines/cluster");
        const data = await response.json();

        if (data.success) {
          // Filter to only stories with enough articles
          const filtered = data.stories.filter((s: StoryGroup) => s.headlines.length >= minArticles);
          setStories(filtered);
          // Auto-expand first 3 stories
          setExpandedStories(new Set(filtered.slice(0, 3).map((s: StoryGroup) => s.slug)));
        } else {
          setError(data.error || "Failed to load stories");
        }
      } catch (err) {
        setError("Failed to fetch stories");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [minArticles]);

  const toggleStory = (slug: string) => {
    setExpandedStories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
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

  if (stories.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>No stories clustered yet. Run the clustering job first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => {
        const isExpanded = expandedStories.has(story.slug);
        const fe = story.framingExamples;
        const rankedPatterns = getRankedPatterns(story.headlines, fe);

        return (
          <div
            key={story.slug}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
          >
            {/* Story card - always visible */}
            <div className="p-4">
              {/* Story title */}
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                {story.label}
              </h3>

              {/* Framing analysis */}
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">
                  How this story is being framed
                </p>
                <p className="mb-2 text-zinc-500 dark:text-zinc-400">
                  Across {story.headlines.length} articles, coverage tends to:
                </p>
                <ul className="space-y-2 ml-1">
                  {rankedPatterns.map((pattern) => {
                    if (pattern.type === "division" && fe?.divisionWords) {
                      return (
                        <li key="division">
                          <span className="text-zinc-400">•</span>{" "}
                          <span>Divide people into opposing sides</span>
                          <p className="ml-4 text-xs text-zinc-500 dark:text-zinc-500">
                            (e.g., {formatDivisionWords(fe.divisionWords)})
                          </p>
                        </li>
                      );
                    }
                    if (pattern.type === "emotion" && fe?.emotionWords) {
                      return (
                        <li key="emotion">
                          <span className="text-zinc-400">•</span>{" "}
                          <span>Use charged language that heightens emotion</span>
                          <p className="ml-4 text-xs text-zinc-500 dark:text-zinc-500">
                            (e.g., {formatWordList(fe.emotionWords)})
                          </p>
                        </li>
                      );
                    }
                    if (pattern.type === "moral" && fe?.moralWords) {
                      return (
                        <li key="moral">
                          <span className="text-zinc-400">•</span>{" "}
                          <span>Express moral judgment or outrage</span>
                          <p className="ml-4 text-xs text-zinc-500 dark:text-zinc-500">
                            (e.g., {formatWordList(fe.moralWords)})
                          </p>
                        </li>
                      );
                    }
                    if (pattern.type === "conflict" && fe?.conflictWords) {
                      return (
                        <li key="conflict">
                          <span className="text-zinc-400">•</span>{" "}
                          <span>Incite action or confrontation</span>
                          <p className="ml-4 text-xs text-zinc-500 dark:text-zinc-500">
                            (e.g., {formatWordList(fe.conflictWords)})
                          </p>
                        </li>
                      );
                    }
                    if (pattern.type === "simplification" && fe?.simplificationNote) {
                      return (
                        <li key="simplification">
                          <span className="text-zinc-400">•</span>{" "}
                          <span>Reduce a complex situation into heroes vs villains</span>
                          <p className="ml-4 text-xs text-zinc-500 dark:text-zinc-500">
                            ({fe.simplificationNote})
                          </p>
                        </li>
                      );
                    }
                    return null;
                  })}
                  {rankedPatterns.length === 0 && (
                    <li className="text-zinc-400 italic">
                      No specific framing patterns extracted yet.
                    </li>
                  )}
                </ul>
              </div>

              {/* Expandable headlines section */}
              <button
                onClick={() => toggleStory(story.slug)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                {isExpanded ? "Hide headlines" : "See headlines using these patterns"}
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expanded headlines list - simple, no grouping */}
            {isExpanded && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                {story.headlines.slice(0, 10).map((headline) => (
                  <div
                    key={headline.id}
                    onClick={() => onHeadlineClick?.(headline.url)}
                    className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
                  >
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                      {headline.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {headline.source}
                    </p>
                  </div>
                ))}
                {story.headlines.length > 10 && (
                  <div className="px-4 py-2 text-xs text-zinc-400">
                    + {story.headlines.length - 10} more articles
                  </div>
                )}
              </div>
            )}

            {/* Quiet prompt */}
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
              <p className="text-xs text-zinc-400 italic">
                What&apos;s missing from this coverage?
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

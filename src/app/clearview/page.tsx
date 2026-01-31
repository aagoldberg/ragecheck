"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import * as tracking from "@/lib/tracking";
import { SocialShareBar } from "@/components/SocialShareBar";
import {
  getClearviewStoryShareText,
  getClearviewBriefingShareText,
} from "@/lib/share/clearviewShareText";
import AttributionSurvey from "@/components/AttributionSurvey";

// --- Types ---

interface SourceAnalysis {
  name: string;
  lean: string;
  title: string;
  url: string;
  framing: string;
  manipulationTechniques: string[];
}

interface Perspective {
  lean: string;
  viewpoint: string;
}

interface ExpertConsensus {
  type: "scientific" | "legal" | "historical" | "economic" | "intelligence" | "statistical" | "professional" | "international" | "none";
  exists: boolean;
  statement?: string;
  confidenceLevel: "high" | "moderate" | "low" | "contested";
  sources?: (string | { name: string; articleUrl: string; articleName: string })[];
  dissent?: string;
}

interface FactualDispute {
  claim: string;
  leftPosition: string;
  rightPosition: string;
  evidenceStatus: "supported" | "mixed" | "unsupported" | "misleading";
}

interface WhyItMatters {
  left: {
    coreValue: string;
    motivation: string;
    stance: "offensive" | "defensive" | "mobilizing";
    emotionalAppeal: string;
  };
  right: {
    coreValue: string;
    motivation: string;
    stance: "offensive" | "defensive" | "mobilizing";
    emotionalAppeal: string;
  };
  bottomLine: string;
}

interface DeeperAnalysis {
  unstatedConcerns: {
    left: string[];
    right: string[];
  };
  economicDimension?: string;
  culturalDimension?: string;
  politicalGame: string;
  whatGetsIgnored?: string;
}

interface StoryCluster {
  id: string;
  topic: string;
  summary: string;
  whatHappened?: string;
  sources: SourceAnalysis[];
  perspectives: Perspective[];
  keyTakeaway: string;
  expertConsensus?: ExpertConsensus;
  debateType?: "factual" | "policy" | "values" | "mixed";
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: FactualDispute[];
  whyItMatters?: WhyItMatters;
  deeperAnalysis?: DeeperAnalysis;
}

interface ArchivedBriefing {
  stories: StoryCluster[];
  generatedAt: string;
}

// --- Constants & Utils ---

const LEAN_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "Far Left": { color: "text-blue-700 dark:text-blue-200", bg: "bg-blue-100 dark:bg-blue-900/40", border: "border-blue-200 dark:border-blue-800", label: "Far Left" },
  "Left": { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", label: "Left" },
  "Center": { color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800", border: "border-zinc-200 dark:border-zinc-700", label: "Center" },
  "Right": { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800", label: "Right" },
  "Far Right": { color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-900/40", border: "border-rose-200 dark:border-rose-800", label: "Far Right" },
};

function getLeanConfig(lean: string) {
  return LEAN_CONFIG[lean] || LEAN_CONFIG["Center"];
}

// --- Components ---

function BiasBadge({ lean }: { lean: string }) {
  const config = getLeanConfig(lean);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color} border ${config.border}`}>
      {lean}
    </span>
  );
}

function BiasSpectrum({ sources }: { sources: SourceAnalysis[] }) {
  const counts = { left: 0, center: 0, right: 0 };
  sources.forEach(s => {
    const lean = s.lean.toLowerCase();
    if (lean.includes("left")) counts.left++;
    else if (lean.includes("right")) counts.right++;
    else counts.center++;
  });

  const total = sources.length;
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1.5 w-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <div style={{ width: `${(counts.left / total) * 100}%` }} className="bg-blue-500" />
        <div style={{ width: `${(counts.center / total) * 100}%` }} className="bg-zinc-400" />
        <div style={{ width: `${(counts.right / total) * 100}%` }} className="bg-rose-500" />
      </div>
      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{total} Sources</span>
    </div>
  );
}

function EvidenceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    supported: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", label: "Supported" },
    mixed: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", label: "Mixed" },
    unsupported: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-400", label: "Unsupported" },
    misleading: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", label: "Misleading" },
  };
  const c = config[status] || config.mixed;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function ExpertConsensusBox({ consensus }: { consensus?: ExpertConsensus }) {
  if (!consensus || consensus.type === "none" || !consensus.exists) return null;

  const typeConfig: Record<string, { icon: string; label: string }> = {
    scientific: { icon: "🔬", label: "Scientific Consensus" },
    legal: { icon: "⚖️", label: "Legal Consensus" },
    historical: { icon: "📜", label: "Historical Consensus" },
    economic: { icon: "📊", label: "Economic Consensus" },
    intelligence: { icon: "🔍", label: "Intelligence Assessment" },
    statistical: { icon: "📈", label: "Statistical Evidence" },
    professional: { icon: "👔", label: "Professional Standards" },
    international: { icon: "🌐", label: "International Consensus" },
  };

  const typeInfo = typeConfig[consensus.type] || { icon: "📋", label: "Expert Consensus" };

  return (
    <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50 w-8 h-8 flex items-center justify-center rounded-full">
            {typeInfo.icon}
        </span>
        <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                    {typeInfo.label}
                </h4>
                {consensus.confidenceLevel && (
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        consensus.confidenceLevel === 'high' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        consensus.confidenceLevel === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                        {consensus.confidenceLevel} Confidence
                    </span>
                )}
            </div>
          
            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                {consensus.statement}
            </p>

            {consensus.sources && consensus.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide self-center mr-1">Sources:</span>
                    {consensus.sources.map((src, i) => (
                        typeof src === "string" ? (
                            <span key={i} className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                {src}
                            </span>
                        ) : (
                            <a key={i} href={src.articleUrl} target="_blank" rel="noopener noreferrer" title={src.articleName} className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                                {src.name}
                            </a>
                        )
                    ))}
                </div>
            )}

            {consensus.dissent && (
                <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/20">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Notable Dissent:</span> {consensus.dissent}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: StoryCluster }) {
  const [deeperExpanded, setDeeperExpanded] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  const leftPerspective = (story.perspectives || []).find(p => p.lean.toLowerCase().includes("left"));
  const rightPerspective = (story.perspectives || []).find(p => p.lean.toLowerCase().includes("right"));

  const shareUrl = `/clearview/share?story=${story.id}&topic=${encodeURIComponent(story.topic)}`;
  const shareTexts = getClearviewStoryShareText(
    {
      topic: story.topic,
      leftViewpoint: leftPerspective?.viewpoint,
      rightViewpoint: rightPerspective?.viewpoint,
    },
    typeof window !== "undefined" ? `${window.location.origin}${shareUrl}` : shareUrl
  );

  // Split whatHappened or summary into bullet points (by sentence)
  const factText = story.whatHappened || story.summary || "";
  const factBullets = factText
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 10)
    .slice(0, 4);

  return (
    <article id={`story-${story.id}`} className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-shadow hover:shadow-md">

      {/* Meta Header */}
      <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-bold uppercase tracking-widest">
            {story.debateType || "Top Story"}
          </span>
        </div>
        <BiasSpectrum sources={story.sources} />
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
          {story.topic}
        </h2>

        {/* What Happened - Bulleted */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            What Happened
          </h3>
          <ul className="space-y-1.5">
            {factBullets.map((bullet, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-[7px] flex-shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* The Divide - Left | Right */}
        <div className="grid md:grid-cols-2 gap-4">
          {leftPerspective && (() => {
            const sentences = leftPerspective.viewpoint.split(/(?<=[.!?])\s+/);
            const thesis = sentences[0] || "";
            const rest = sentences.slice(1).join(" ");
            const leftSources = story.sources
              .filter(s => s.lean.toLowerCase().includes("left"))
              .map(s => s.name);
            return (
              <div className="pl-4 py-2 border-l-4 border-blue-500">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300 mb-2">
                  Left View
                </h4>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  {thesis}
                </p>
                {rest && (
                  <p className="text-xs text-blue-800/70 dark:text-blue-300/70 leading-relaxed">
                    {rest}
                  </p>
                )}
                {leftSources.length > 0 && (
                  <p className="text-[10px] text-blue-500/70 dark:text-blue-400/50 mt-2">
                    {leftSources.join(", ")}
                  </p>
                )}
              </div>
            );
          })()}
          {rightPerspective && (() => {
            const sentences = rightPerspective.viewpoint.split(/(?<=[.!?])\s+/);
            const thesis = sentences[0] || "";
            const rest = sentences.slice(1).join(" ");
            const rightSources = story.sources
              .filter(s => s.lean.toLowerCase().includes("right"))
              .map(s => s.name);
            return (
              <div className="pl-4 py-2 border-l-4 border-rose-500">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300 mb-2">
                  Right View
                </h4>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-1">
                  {thesis}
                </p>
                {rest && (
                  <p className="text-xs text-rose-800/70 dark:text-rose-300/70 leading-relaxed">
                    {rest}
                  </p>
                )}
                {rightSources.length > 0 && (
                  <p className="text-[10px] text-rose-500/70 dark:text-rose-400/50 mt-2">
                    {rightSources.join(", ")}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Factual Disputes - Promoted to primary view */}
        {story.factualDisputes && story.factualDisputes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Factual Disputes
            </h3>
            <div className="space-y-3">
              {story.factualDisputes.map((dispute, i) => (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">&ldquo;{dispute.claim}&rdquo;</p>
                    <EvidenceStatusBadge status={dispute.evidenceStatus} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="pl-3 border-l-2 border-blue-400">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-blue-400 dark:text-blue-500">Left</span>
                      <span className="text-sm leading-snug text-blue-700 dark:text-blue-400">{dispute.leftPosition}</span>
                    </div>
                    <div className="pl-3 border-l-2 border-rose-400">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-rose-400 dark:text-rose-500">Right</span>
                      <span className="text-sm leading-snug text-rose-700 dark:text-rose-400">{dispute.rightPosition}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Line - Promoted to main view */}
        {story.whyItMatters?.bottomLine && (
          <p className="text-sm text-zinc-700 dark:text-zinc-300 border-l-2 border-amber-400 pl-4 leading-relaxed">
            <span className="font-bold text-amber-600 dark:text-amber-400">Bottom line: </span>{story.whyItMatters.bottomLine}
          </p>
        )}

        {/* Expert Consensus - In main view */}
        <ExpertConsensusBox consensus={story.expertConsensus} />

        {/* Share Bar */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <SocialShareBar
            url={shareUrl}
            xText={shareTexts.xText}
            blueskyText={shareTexts.blueskyText}
            nativeText={shareTexts.nativeText}
            nativeTitle={shareTexts.nativeTitle}
            context={`story-${story.id}`}
          />
        </div>
      </div>

      {/* Go Deeper Button */}
      <button
        onClick={() => setDeeperExpanded(!deeperExpanded)}
        className="w-full py-4 px-6 bg-indigo-50/50 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between group hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            {deeperExpanded ? "Less" : "Go Deeper"}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Motivations, common ground, what gets ignored
          </span>
        </div>
        <svg className={`w-4 h-4 text-indigo-500 transition-transform ${deeperExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Deeper Analysis - Collapsible */}
      {deeperExpanded && (
        <div className="p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 space-y-6 animate-in slide-in-from-top-2">

          {/* Why Each Side Cares - Simplified */}
          {story.whyItMatters && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Why Each Side Cares</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-500">♥</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{story.whyItMatters.left.coreValue}</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {story.whyItMatters.left.motivation}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-rose-500">♥</span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{story.whyItMatters.right.coreValue}</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {story.whyItMatters.right.motivation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Common Ground */}
          {story.commonGround && story.commonGround.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Common Ground</h4>
              <ul className="space-y-2">
                {story.commonGround.map((item, i) => (
                  <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What Gets Ignored */}
          {story.deeperAnalysis?.whatGetsIgnored && (
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">What Gets Ignored</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {story.deeperAnalysis.whatGetsIgnored}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sources Section */}
      <button
        onClick={() => setSourcesExpanded(!sourcesExpanded)}
        className="w-full py-4 px-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Sources
          </span>
          <span className="text-sm text-zinc-400">
            {story.sources.length} articles analyzed
          </span>
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${sourcesExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {sourcesExpanded && (
        <div className="p-6 md:p-8 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {story.sources.map((source, i) => (
              <div
                key={i}
                className="group/source p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{source.name}</span>
                  <BiasBadge lean={source.lean} />
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover/source:text-indigo-600 dark:group-hover/source:text-indigo-400 line-clamp-2">
                    {source.title}
                  </p>
                </a>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                  <span className="text-zinc-400 font-medium">Framing:</span> {source.framing}
                </p>
                <a
                  href={`/?url=${encodeURIComponent(source.url)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analyze
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

    </article>
  );
}

function LoadingState() {
  const [step, setStep] = useState(0);
  const steps = [
    "Scouring 50+ diverse news sources...",
    "Clustering today's top stories...",
    "Extracting core factual consensus...",
    "Analyzing framing differences (Left vs. Right)...",
    "Identifying manipulative techniques...",
    "Finalizing cross-spectrum briefing..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="space-y-8 text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Analyzing
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white transition-all duration-500 ease-in-out h-8">
            {steps[step]}
          </h3>
        </div>

        <div className="relative h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 pt-12">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-4 text-left">
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-8 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-40 w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ClearviewPage() {
  const [stories, setStories] = useState<StoryCluster[]>([]);
  const [archived, setArchived] = useState<ArchivedBriefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [subscribeMessage, setSubscribeMessage] = useState("");

  useEffect(() => {
    fetch("/api/clearview")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStories(data.stories);
          setGeneratedAt(data.generatedAt);
          setArchived(data.archived || []);
        } else {
          setError(data.error || "Failed to load analysis");
        }
      })
      .catch(() => {
        setError("Failed to connect to server");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    tracking.trackEmailSubscribe("clearview");
    setSubscribeStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "clearview" }),
      });
      const data = await res.json();

      if (data.success) {
        tracking.trackEmailSubscribeSuccess("clearview");
        setSubscribeStatus("success");
        setSubscribeMessage(data.alreadySubscribed ? "You're already subscribed!" : "You're in! Watch for your first briefing.");
        setEmail("");
      } else {
        setSubscribeStatus("error");
        setSubscribeMessage(data.error || "Something went wrong");
      }
    } catch {
      setSubscribeStatus("error");
      setSubscribeMessage("Failed to subscribe. Please try again.");
    }
  };

  // Scroll to story hash after stories load
  const scrollToHash = useCallback(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && stories.length > 0) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [stories]);

  useEffect(() => {
    scrollToHash();
  }, [scrollToHash]);

  // Track page visit with UTM params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source");
    const utmMedium = urlParams.get("utm_medium");
    const utmCampaign = urlParams.get("utm_campaign");
    const utmContent = urlParams.get("utm_content");
    const utmTerm = urlParams.get("utm_term");

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: document.referrer || null,
        pagePath: "/clearview",
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
      }),
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-lg tracking-tight">RageCheck</span>
          </Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Analyzer
            </Link>
            <span className="text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white">ClearView</span>
          </div>
        </div>
      </nav>

      {/* AI Experiment Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
            <span className="font-semibold">ClearView is an experiment.</span> We&apos;re testing whether AI can help cut through media spin by showing you the same story from different angles. It&apos;s not perfect — treat it as a starting point, not the final word.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <header className="relative pt-24 pb-20 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Daily Briefing Analysis
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.05]">
                What actually happened. <br/>
                <span className="text-zinc-400 dark:text-zinc-500">Minus the spin.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                We synthesize today's top stories from across the political spectrum to extract core facts and reveal framing differences.
            </p>

            {generatedAt && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   Updated {new Date(generatedAt).toLocaleDateString()} at {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {stories.length > 0 && (() => {
                  const briefingUrl = "/clearview/share?type=briefing";
                  const briefingTexts = getClearviewBriefingShareText(
                    stories.length,
                    typeof window !== "undefined" ? `${window.location.origin}${briefingUrl}` : briefingUrl
                  );
                  return (
                    <div className="flex justify-center">
                      <SocialShareBar
                        url={briefingUrl}
                        xText={briefingTexts.xText}
                        blueskyText={briefingTexts.blueskyText}
                        nativeText={briefingTexts.nativeText}
                        nativeTitle={briefingTexts.nativeTitle}
                        context="briefing"
                        compact
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Email Subscription */}
            <div className="pt-8 max-w-md mx-auto">
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
                    Get the daily briefing delivered to your inbox
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={subscribeStatus === "loading"}
                    />
                    <button
                      type="submit"
                      disabled={subscribeStatus === "loading" || !email.trim()}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {subscribeStatus === "loading" ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Subscribe
                        </>
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
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        
        {loading && <LoadingState />}

        {error && (
          <div className="text-center py-20 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/20">
            <h3 className="text-lg font-bold text-rose-900 dark:text-rose-400">Failed to sync news</h3>
            <p className="text-rose-600/60 dark:text-rose-400/60 mt-2 mb-6 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-bold text-sm hover:opacity-90"
            >
              Retry Sync
            </button>
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
           <div className="text-center py-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
              <div className="text-4xl mb-4">🗞️</div>
              <h3 className="text-xl font-bold mb-2">Quiet News Cycle</h3>
              <p className="text-zinc-500 max-w-sm mx-auto">We're monitoring sources for significant cross-spectrum coverage. Check back shortly.</p>
           </div>
        )}

        {!loading && !error && stories.length > 0 && (
          <div className="space-y-16">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        {/* Archived Briefings - filtered to exclude topics already covered */}
        {!loading && !error && archived.length > 0 && (() => {
          // Get current story topics for deduplication
          const currentTopics = new Set(stories.map(s => s.topic.toLowerCase().trim()));

          // Filter archived briefings to only show unique stories
          const filteredArchived = archived.map(briefing => ({
            ...briefing,
            stories: briefing.stories.filter(story =>
              !currentTopics.has(story.topic.toLowerCase().trim())
            )
          })).filter(briefing => briefing.stories.length > 0);

          if (filteredArchived.length === 0) return null;

          return (
            <div className="mt-24 pt-16 border-t border-zinc-200 dark:border-zinc-800">
              <div className="space-y-20">
                {filteredArchived.map((briefing, briefingIndex) => (
                  <div key={briefingIndex} className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full">
                        {new Date(briefing.generatedAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    </div>

                    <div className="space-y-12 opacity-75 hover:opacity-100 transition-opacity">
                      {briefing.stories.map((story) => (
                        <StoryCard key={story.id} story={story} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <footer className="mt-32 pt-12 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
                RageCheck Intelligence Engine • Analyzing 50+ Global Outlets
            </p>
            <div className="flex justify-center gap-6">
                <Link href="/clearview/methodology" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Methodology</Link>
                <Link href="/clearview/about" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">About ClearView</Link>
                <Link href="/" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">RageCheck Analyzer</Link>
            </div>
        </footer>

      </main>

      <AttributionSurvey />
    </div>
  );
}
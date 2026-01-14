"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  sources?: string[];
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
  whatHappened: string;
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
                        <span key={i} className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                            {src}
                        </span>
                    ))}
                </div>
            )}

            {consensus.dissent && (
                <div className="mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/20">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Notable Dissent:</span> {consensus.dissent}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function StanceBadge({ stance }: { stance: string }) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    offensive: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", icon: "→" },
    defensive: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", icon: "⊙" },
    mobilizing: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", icon: "◉" },
  };
  const c = config[stance] || config.defensive;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${c.bg} ${c.text}`}>
      <span>{c.icon}</span>
      {stance === "offensive" ? "Pushing" : stance === "defensive" ? "Defending" : "Rallying"}
    </span>
  );
}

function WhyItMattersBox({ whyItMatters }: { whyItMatters?: WhyItMatters }) {
  if (!whyItMatters) return null;

  return (
    <div className="p-5 bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/50 dark:to-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Why Each Side Cares
      </h3>

      {/* Bottom Line - The Real Fight */}
      <div className="mb-5 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
          <span className="text-amber-600 dark:text-amber-400 font-bold">The real fight:</span> {whyItMatters.bottomLine}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Left Side */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Why the Left Cares
            </h4>
            <StanceBadge stance={whyItMatters.left.stance} />
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm mt-0.5">♥</span>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Core Value:</span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300">{whyItMatters.left.coreValue}</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-5 border-l-2 border-blue-200 dark:border-blue-800">
              {whyItMatters.left.motivation}
            </p>

            <div className="flex items-center gap-1.5 pl-5">
              <span className="text-[10px] font-bold text-zinc-400">Activates:</span>
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                {whyItMatters.left.emotionalAppeal}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Why the Right Cares
            </h4>
            <StanceBadge stance={whyItMatters.right.stance} />
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-rose-500 text-sm mt-0.5">♥</span>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Core Value:</span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300">{whyItMatters.right.coreValue}</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-5 border-l-2 border-rose-200 dark:border-rose-800">
              {whyItMatters.right.motivation}
            </p>

            <div className="flex items-center gap-1.5 pl-5">
              <span className="text-[10px] font-bold text-zinc-400">Activates:</span>
              <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">
                {whyItMatters.right.emotionalAppeal}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeeperAnalysisBox({ deeperAnalysis }: { deeperAnalysis?: DeeperAnalysis }) {
  if (!deeperAnalysis) return null;

  return (
    <div className="p-5 bg-gradient-to-br from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 rounded-xl border border-orange-200/50 dark:border-orange-900/30">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        The Deeper Game
      </h3>

      {/* Political Game - The Main Event */}
      <div className="mb-5 p-4 bg-white/80 dark:bg-zinc-900/80 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <span className="font-bold text-orange-600 dark:text-orange-400">How it&apos;s being exploited:</span> {deeperAnalysis.politicalGame}
        </p>
      </div>

      {/* Unstated Concerns - Two Columns */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Left Unstated */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            What the Left Won&apos;t Say
          </h4>
          <ul className="space-y-1.5">
            {deeperAnalysis.unstatedConcerns.left.map((concern, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="text-blue-400 mt-1">•</span>
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Unstated */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            What the Right Won&apos;t Say
          </h4>
          <ul className="space-y-1.5">
            {deeperAnalysis.unstatedConcerns.right.map((concern, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="text-rose-400 mt-1">•</span>
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Economic & Cultural Dimensions */}
      <div className="space-y-3">
        {deeperAnalysis.economicDimension && (
          <div className="flex items-start gap-2">
            <span className="text-emerald-500 text-sm mt-0.5">$</span>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Economic Reality:</span>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{deeperAnalysis.economicDimension}</p>
            </div>
          </div>
        )}

        {deeperAnalysis.culturalDimension && (
          <div className="flex items-start gap-2">
            <span className="text-purple-500 text-sm mt-0.5">◈</span>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Cultural Undercurrent:</span>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{deeperAnalysis.culturalDimension}</p>
            </div>
          </div>
        )}

        {deeperAnalysis.whatGetsIgnored && (
          <div className="flex items-start gap-2">
            <span className="text-zinc-400 text-sm mt-0.5">⊘</span>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">What Gets Ignored:</span>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{deeperAnalysis.whatGetsIgnored}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: StoryCluster }) {
  const [expanded, setExpanded] = useState(false);

  const leftPerspective = story.perspectives.find(p => p.lean.toLowerCase().includes("left"));
  const rightPerspective = story.perspectives.find(p => p.lean.toLowerCase().includes("right"));

  return (
    <article className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      
      {/* Meta Header */}
      <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-bold uppercase tracking-widest">
            {story.debateType || "Top Story"}
          </span>
        </div>
        <BiasSpectrum sources={story.sources} />
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
          {story.topic}
        </h2>

        {/* Facts Box */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
             The Core Facts
           </h3>
           <p className="text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed">
             {story.whatHappened}
           </p>
        </div>

        {/* Perspectives */}
        <div className="grid md:grid-cols-2 gap-6">
          {leftPerspective && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Left Focus</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-2 border-blue-500/20 pl-4">
                "{leftPerspective.viewpoint}"
              </p>
            </div>
          )}
          {rightPerspective && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Right Focus</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-2 border-rose-500/20 pl-4">
                "{rightPerspective.viewpoint}"
              </p>
            </div>
          )}
        </div>

        <ExpertConsensusBox consensus={story.expertConsensus} />

        <WhyItMattersBox whyItMatters={story.whyItMatters} />

        <DeeperAnalysisBox deeperAnalysis={story.deeperAnalysis} />
      </div>

      {/* Expand Bar */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full py-4 px-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-4">
           <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Analysis</span>
           <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
             {story.keyTakeaway}
           </span>
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 space-y-10 animate-in slide-in-from-top-2">
            
            {/* Common Ground & Disputes */}
            <div className="grid md:grid-cols-2 gap-10">
                {story.commonGround && story.commonGround.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Common Ground</h4>
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
                
                {story.factualDisputes && story.factualDisputes.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Factual Disputes</h4>
                        <div className="space-y-3">
                            {story.factualDisputes.map((dispute, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">"{dispute.claim}"</p>
                                        <EvidenceStatusBadge status={dispute.evidenceStatus} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded">
                                            {dispute.leftPosition}
                                        </div>
                                        <div className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/20 p-2 rounded">
                                            {dispute.rightPosition}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sources */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Source Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {story.sources.map((source, i) => (
                        <div
                            key={i}
                            className="group/source p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
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
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover/source:text-indigo-600 dark:group-hover/source:text-indigo-400">
                                    {source.title}
                                </p>
                            </a>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
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

  // Track page visit
  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: document.referrer || null,
        pagePath: "/clearview"
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
              <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 Updated {new Date(generatedAt).toLocaleDateString()} at {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
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
    </div>
  );
}
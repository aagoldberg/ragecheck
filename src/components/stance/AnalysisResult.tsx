import Link from "next/link";
import { SocialShareBar } from "@/components/SocialShareBar";
import {
  DEFENSE_TAG_LABELS,
  POSTURE_META,
  type DefenseTag,
  type Posture,
  type StanceResult,
} from "@/lib/stance/types";
import { DefenseScoreGauge } from "./DefenseScoreGauge";
import { EffectGauge } from "./EffectGauge";
import { PostureBadge } from "./PostureBadge";
import { StanceSection } from "./StanceSection";
import { getStanceShareText } from "@/lib/share/stanceShareText";

interface AnalysisResultProps {
  result: StanceResult;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const a = result.analysis;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/stance/share?id=${result.id}`
      : "";
  const shareTexts = getStanceShareText(a, shareUrl);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. HERO SUMMARY & SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <StanceSection
          title="Analysis Summary"
          variant="hero"
          className="md:col-span-2 flex flex-col justify-center"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <PostureBadge posture={a.posture.primary} />
              {a.posture.secondary
                ?.filter((s) => s.weight > 0.2)
                .map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900/40 text-zinc-400"
                  >
                    {POSTURE_META[s.label as Posture]?.label || s.label} (
                    {Math.round(s.weight * 100)}%)
                  </span>
                ))}
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800/80 border border-zinc-700/50 px-2 py-0.5 rounded uppercase tracking-widest ml-auto">
                {a.summary.primary_mode}
              </span>
            </div>
            
            <p className="text-lg text-zinc-100 leading-relaxed font-medium">
              {a.summary.neutral_summary}
            </p>

            {a.summary.top_claims.length > 0 && (
              <div className="pt-4 border-t border-zinc-700/30">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-black">
                  Core Claims Detected
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {a.summary.top_claims.map((c, i) => (
                    <div key={i} className="text-sm text-zinc-300 flex gap-3 leading-snug bg-zinc-900/30 p-2 rounded-lg border border-zinc-800/50">
                      <span className="text-violet-500 font-bold shrink-0">#</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </StanceSection>

        <StanceSection title="Defense Score" className="flex flex-col items-center justify-center bg-zinc-900/50">
             <DefenseScoreGauge score={a.defense_module.overall_defense_score_raw} />
        </StanceSection>
      </div>

       {/* 2. PREDICTED EFFECTS */}
       {a.predicted_effects && (
        <StanceSection
          title="Predicted Effects"
          badge={a.predicted_effects.confidence}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <EffectGauge
              label="Escalation"
              value={a.predicted_effects.escalation_likelihood}
            />
            <EffectGauge
              label="Polarization"
              value={a.predicted_effects.polarization_push}
            />
            <EffectGauge
              label="Belief Closure"
              value={a.predicted_effects.belief_closure}
            />
            <EffectGauge
              label="Virality"
              value={a.predicted_effects.virality_language_only}
            />
          </div>
          <p className="text-sm text-zinc-300 bg-zinc-800/30 p-4 rounded-lg border border-zinc-800/50">
            {a.predicted_effects.why}
          </p>
          {a.predicted_effects.likely_reply_dynamics && (
            <div className="flex gap-2 items-start text-xs text-zinc-500 mt-2 px-1">
              <span className="text-zinc-400 font-semibold whitespace-nowrap">
                Likely reply dynamics:
              </span>
              <span>{a.predicted_effects.likely_reply_dynamics}</span>
            </div>
          )}
        </StanceSection>
      )}

      {/* 3. INTERVENTIONS (Moved Up) */}
      {a.interventions && (
        <StanceSection title="Reader Interventions" variant="action">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {a.interventions.self_check_questions?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3 font-bold">
                  Ask Yourself
                </p>
                <ul className="space-y-2">
                    {a.interventions.self_check_questions.map((q, i) => (
                    <li key={i} className="text-sm text-zinc-200 bg-zinc-800/60 rounded-lg p-3 border-l-4 border-violet-500/40">
                        {q}
                    </li>
                    ))}
                </ul>
              </div>
            )}
            
            {a.interventions.response_templates?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3 font-bold">
                  Non-Hostile Responses
                </p>
                <ul className="space-y-2">
                    {a.interventions.response_templates.map((t, i) => (
                    <li key={i} className="text-sm text-zinc-300 bg-zinc-800/60 rounded-lg p-3 font-mono border-l-4 border-zinc-600">
                        "{t}"
                    </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          
          {a.interventions.sharing_caution && (
            <div className="mt-4 flex gap-3 items-start bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
              <svg
                className="w-5 h-5 text-amber-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                {a.interventions.sharing_caution}
              </p>
            </div>
          )}
        </StanceSection>
      )}

      {/* 4. DETAILED BREAKDOWN (Defense, Rhetoric, Vulnerabilities) */}
      <div className="space-y-6">
        {/* Defense Module */}
        {a.defense_module.tags.length > 0 && (
          <StanceSection
            title="Defense Patterns"
            badge={`${a.defense_module.overall_defense_score_raw}/100`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {a.defense_module.tags
                .filter((t) => t.intensity > 0)
                .map((tag, i) => (
                  <div
                    key={i}
                    className="bg-zinc-800/30 rounded-lg p-4 space-y-3 border border-zinc-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-teal-400">
                        {DEFENSE_TAG_LABELS[tag.tag as DefenseTag] || tag.tag}
                      </span>
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {tag.confidence}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-500 transition-all"
                          style={{ width: `${(tag.intensity / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-8 text-right">
                        {tag.intensity}/10
                      </span>
                    </div>
                    {tag.evidence_spans?.slice(0, 2).map((ev, j) => (
                      <blockquote
                        key={j}
                        className="text-xs text-zinc-400 bg-zinc-900/50 rounded p-2.5 border-l-2 border-teal-500/40 italic"
                      >
                        "{ev.quote}"
                      </blockquote>
                    ))}
                  </div>
                ))}
            </div>
          </StanceSection>
        )}

        {/* Rhetorical Techniques */}
        {a.rhetorical_techniques?.length > 0 && (
          <StanceSection title="Rhetorical Techniques">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {a.rhetorical_techniques.map((tech, i) => (
                <div
                  key={i}
                  className="bg-zinc-800/30 rounded-lg p-4 space-y-2 border border-zinc-800/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-orange-400">
                      {tech.technique}
                    </span>
                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                      {tech.confidence}
                    </span>
                  </div>
                  {tech.evidence_spans?.slice(0, 2).map((ev, j) => (
                    <blockquote
                      key={j}
                      className="text-xs text-zinc-400 bg-zinc-900/50 rounded p-2.5 border-l-2 border-orange-500/40 italic"
                    >
                      "{ev.quote}"{" "}
                      <span className="text-zinc-500 not-italic block mt-1 text-[10px]">
                        — {ev.explanation}
                      </span>
                    </blockquote>
                  ))}
                </div>
              ))}
            </div>
          </StanceSection>
        )}

        {/* Vulnerability Hypotheses */}
        {a.vulnerability_hypotheses && (
          <StanceSection
            title="Reader Assumptions"
            badge={a.vulnerability_hypotheses.confidence}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    {a.vulnerability_hypotheses.assumed_beliefs?.length > 0 && (
                    <div className="mb-4">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
                        Assumed Beliefs
                        </p>
                        <ul className="space-y-2">
                        {a.vulnerability_hypotheses.assumed_beliefs.map((b, i) => (
                            <li key={i} className="text-sm text-zinc-400 flex gap-2">
                            <span className="text-amber-400 mt-1 text-xs">●</span>
                            {b}
                            </li>
                        ))}
                        </ul>
                    </div>
                    )}
                    
                     {a.vulnerability_hypotheses.invited_identity && (
                    <div>
                         <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
                        Invited Identity
                        </p>
                         <p className="text-sm text-zinc-300 bg-zinc-800/30 p-3 rounded-lg border border-zinc-800/50">
                        {a.vulnerability_hypotheses.invited_identity}
                        </p>
                    </div>
                    )}
                </div>

                {a.vulnerability_hypotheses.rewarded_assumptions?.length > 0 && (
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
                    Rewarded Assumptions
                    </p>
                    <ul className="space-y-2">
                    {a.vulnerability_hypotheses.rewarded_assumptions.map(
                        (r, i) => (
                        <li key={i} className="text-sm text-zinc-400 flex gap-2">
                            <span className="text-amber-400 mt-1 text-xs">●</span>
                            {r}
                        </li>
                        )
                    )}
                    </ul>
                </div>
                )}
            </div>
          </StanceSection>
        )}
      </div>

      {/* 5. CALIBRATION & LIMITS */}
      {a.calibration &&
        (a.calibration.context_notes?.length > 0 ||
          a.calibration.failure_modes?.length > 0) && (
          <StanceSection title="Calibration & Limits">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {a.calibration.context_notes?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
                    Missing Context
                  </p>
                  <ul className="space-y-1">
                    {a.calibration.context_notes.map((n, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex gap-2">
                        <span className="text-zinc-500">•</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {a.calibration.failure_modes?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
                    Possible Failure Modes
                  </p>
                  <ul className="space-y-1">
                    {a.calibration.failure_modes.map((f, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex gap-2">
                        <span className="text-zinc-500">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </StanceSection>
        )}

      {/* 6. ACTION FOOTER */}
      <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-zinc-800/50">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/defensecheck"
            className="text-xs font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg px-4 py-2 hover:bg-teal-500/20 transition-colors"
          >
            Deep-dive Defense Patterns &rarr;
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2 hover:bg-orange-500/20 transition-colors"
          >
            Check Rage Score &rarr;
          </Link>
        </div>
        
        {shareTexts && (
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Share</span>
                <SocialShareBar
                    url={shareUrl}
                    xText={shareTexts.xText}
                    blueskyText={shareTexts.blueskyText}
                    nativeText={shareTexts.nativeText}
                    nativeTitle={shareTexts.nativeTitle}
                    context="stance"
                    compact={true}
                />
            </div>
        )}
      </div>
    </div>
  );
}

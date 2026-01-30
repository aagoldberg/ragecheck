"use client";

import Link from "next/link";
import { POSTURE_META, DEFENSE_TAG_LABELS, type Posture, type DefenseTag } from "@/lib/stance/types";

const postures = Object.keys(POSTURE_META) as Posture[];
const defenseTags = Object.keys(DEFENSE_TAG_LABELS) as DefenseTag[];

export default function StanceAboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a10] text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <Link href="/stance" className="text-lg font-bold tracking-wide">
              <span className="text-violet-400">Stance</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-xs text-zinc-500">
            <Link href="/stance" className="hover:text-zinc-300 transition-colors">
              Analyzer
            </Link>
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              RageCheck
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            About Stance
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            Stance performs a full 8-stage rhetorical analysis of any text,
            identifying what the content is doing socially, how it achieves that
            effect linguistically, and what it is likely to cause if accepted or
            shared.
          </p>
        </div>

        {/* What this tool is NOT */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-red-400">
            What This Tool is NOT
          </h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex gap-2">
              <span className="text-red-400 mt-0.5">&#x2717;</span>
              <span>
                <strong className="text-zinc-300">Not a fact-checker.</strong>{" "}
                Stance does not verify whether claims are true or false. It
                analyzes how language functions rhetorically.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 mt-0.5">&#x2717;</span>
              <span>
                <strong className="text-zinc-300">Not a mind-reader.</strong>{" "}
                We do not attribute motives, intent, or mental states to
                authors. All analysis is based on observable language patterns.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 mt-0.5">&#x2717;</span>
              <span>
                <strong className="text-zinc-300">Not definitive.</strong>{" "}
                Results represent one interpretive reading. Context, sarcasm,
                cultural factors, and missing information can all change the
                assessment.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 mt-0.5">&#x2717;</span>
              <span>
                <strong className="text-zinc-300">Not a weapon.</strong>{" "}
                This tool is designed for understanding rhetoric and building
                media literacy — not for &ldquo;winning&rdquo; arguments or
                discrediting people.
              </span>
            </li>
          </ul>
        </div>

        {/* The 8 Stages */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">The 8 Analysis Stages</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Stance uses Claude (by Anthropic) to perform a structured 8-stage
            analysis. Each stage builds on the previous, moving from literal
            content through rhetorical mechanics to predicted effects and
            practical interventions.
          </p>

          <div className="grid gap-3">
            {[
              { n: 1, title: "Literal Compression", desc: "Neutral summary, explicit claims, and primary mode (fact, opinion, call to action, or mixed)." },
              { n: 2, title: "Posture Analysis", desc: "What the content is doing socially — the dominant communicative stance, with quoted evidence." },
              { n: 3, title: "Defense Module", desc: "Belief-protective language patterns: denial, rationalization, projection, epistemic closure, and more." },
              { n: 4, title: "Rhetorical Techniques", desc: "Persuasion mechanics: loaded framing, absolutist language, emotional triggers, evidence theater." },
              { n: 5, title: "Reader Assumptions", desc: "What beliefs the content assumes the reader holds, what identity it invites, what assumptions it rewards." },
              { n: 6, title: "Predicted Effects", desc: "Language-based predictions for escalation, polarization, belief closure, and virality." },
              { n: 7, title: "Reader Interventions", desc: "Practical tools: self-check questions, non-hostile response templates, and sharing cautions." },
              { n: 8, title: "Calibration & Limits", desc: "Explicit flags for missing context, sarcasm risk, failure modes, and what would change the assessment." },
            ].map((stage) => (
              <div
                key={stage.n}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-violet-400">{stage.n}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-violet-400">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-zinc-500">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Posture Types */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">10 Posture Types</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Stage 2 identifies the primary communicative posture — what the content
            is doing socially, independent of its truth value.
          </p>
          <div className="grid gap-3">
            {postures.map((p) => {
              const meta = POSTURE_META[p];
              return (
                <div
                  key={p}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex gap-3 items-center"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div>
                    <span className="text-sm font-semibold" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">{meta.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Defense Tags */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">8 Defense Tags</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Stage 3 evaluates belief-protective language patterns. Each tag is
            rated on intensity (0-10), with confidence levels and alternative
            explanations. The overall defense score (0-100) is a weighted
            composite.
          </p>
          <div className="grid gap-2">
            {defenseTags.map((tag) => (
              <div
                key={tag}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex gap-3 items-center"
              >
                <div className="w-1 h-6 rounded-full bg-teal-500 flex-shrink-0" />
                <span className="text-sm font-medium text-teal-400">
                  {DEFENSE_TAG_LABELS[tag]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring & Effects */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Predicted Effects Scoring</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Stage 6 estimates four language-based metrics (0-100), each with
            confidence levels and explanations. These are predictions based solely
            on rhetoric, not network effects or audience size.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-1">
              <h4 className="font-semibold text-zinc-300">Escalation</h4>
              <p className="text-xs text-zinc-500">Likelihood the language will intensify conflict if engaged with.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-1">
              <h4 className="font-semibold text-zinc-300">Polarization</h4>
              <p className="text-xs text-zinc-500">How much the language pushes toward us-vs-them framing.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-1">
              <h4 className="font-semibold text-zinc-300">Belief Closure</h4>
              <p className="text-xs text-zinc-500">Degree to which the language discourages updating beliefs.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-1">
              <h4 className="font-semibold text-zinc-300">Virality</h4>
              <p className="text-xs text-zinc-500">Shareability based on rhetoric alone, not platform mechanics.</p>
            </div>
          </div>
        </div>

        {/* Interpretive Framing */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Interpretive Framing</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Every Stance analysis follows strict interpretive rules:
          </p>
          <ul className="space-y-2 text-sm text-zinc-400 ml-4 list-disc">
            <li>We only analyze what is observable in the text provided</li>
            <li>Every label is supported by quoted evidence</li>
            <li>Alternative explanations and uncertainty are always included</li>
            <li>If context is missing (sarcasm, quoting, memes, threads), the analysis says so and reduces confidence</li>
            <li>We do not attribute motives, claim truth or falsity, or diagnose people</li>
          </ul>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Stage 8 (Calibration) explicitly flags what context is missing and what
            additional information would materially change the assessment.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-zinc-600">
          <span>Stance by RageCheck</span>
          <div className="flex gap-4">
            <Link href="/stance" className="hover:text-zinc-400 transition-colors">
              Analyzer
            </Link>
            <Link href="/defensecheck" className="hover:text-zinc-400 transition-colors">
              DefenseCheck
            </Link>
            <Link href="/" className="hover:text-zinc-400 transition-colors">
              RageCheck
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

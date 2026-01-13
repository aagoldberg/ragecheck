"use client";

import { useState } from "react";
import { AsymmetricValueOutput } from "@/lib/asymmetricValue/types";

interface AsymmetricValuePanelProps {
  data: AsymmetricValueOutput;
}

// ============================================
// ICONS
// ============================================

function ForecastIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function HeatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  );
}

function VerifyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function FingerprintIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function ActionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ============================================
// ACCORDION BLOCK
// ============================================

interface BlockProps {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  explainItems: string[];
  accentColor?: string;
}

function Block({ icon, title, badge, children, explainItems, accentColor = "indigo" }: BlockProps) {
  const [expanded, setExpanded] = useState(false);

  const colorClasses: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    indigo: {
      border: "border-indigo-200 dark:border-indigo-800",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      text: "text-indigo-700 dark:text-indigo-300",
      icon: "text-indigo-500 dark:text-indigo-400",
    },
    amber: {
      border: "border-amber-200 dark:border-amber-800",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-700 dark:text-amber-300",
      icon: "text-amber-500 dark:text-amber-400",
    },
    emerald: {
      border: "border-emerald-200 dark:border-emerald-800",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: "text-emerald-500 dark:text-emerald-400",
    },
    rose: {
      border: "border-rose-200 dark:border-rose-800",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      text: "text-rose-700 dark:text-rose-300",
      icon: "text-rose-500 dark:text-rose-400",
    },
    purple: {
      border: "border-purple-200 dark:border-purple-800",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-700 dark:text-purple-300",
      icon: "text-purple-500 dark:text-purple-400",
    },
    blue: {
      border: "border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-300",
      icon: "text-blue-500 dark:text-blue-400",
    },
  };

  const colors = colorClasses[accentColor] || colorClasses.indigo;

  return (
    <div className={`border rounded-xl overflow-hidden ${colors.border}`}>
      <div className={`p-4 ${colors.bg}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${colors.icon}`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-sm font-bold uppercase tracking-wide ${colors.text}`}>
                {title}
              </h3>
              {badge}
            </div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Explain accordion */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 transition-colors"
      >
        <span>Explain</span>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && (
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
          <ul className="space-y-1.5">
            {explainItems.map((item, i) => (
              <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <span className="text-zinc-400 mt-0.5">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================
// VERIFICATION CHECK ITEM
// ============================================

function VerificationCheckItem({
  label,
  status,
  detail,
}: {
  label: string;
  status: "yes" | "no" | "partial" | "unknown";
  detail: string;
}) {
  const statusConfig = {
    yes: { icon: "checkmark", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    no: { icon: "x", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30" },
    partial: { icon: "minus", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
    unknown: { icon: "?", color: "text-zinc-500 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${config.bg} ${config.color}`}>
        {status === "yes" && "!"}
        {status === "no" && "X"}
        {status === "partial" && "~"}
        {status === "unknown" && "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{detail}</div>
      </div>
    </div>
  );
}

// ============================================
// HEAT VS EVIDENCE BAR
// ============================================

function HeatEvidenceBar({ heat, evidence }: { heat: number; evidence: number }) {
  const delta = heat - evidence;
  const warningActive = delta >= 25;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-rose-600 dark:text-rose-400">Heat</span>
            <span className="font-bold">{heat}</span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all"
              style={{ width: `${heat}%` }}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Evidence</span>
            <span className="font-bold">{evidence}</span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${evidence}%` }}
            />
          </div>
        </div>
      </div>
      {warningActive && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">Heat &gt; Evidence</span>
          <span className="text-xs text-amber-700 dark:text-amber-300">
            Emotional intensity exceeds factual grounding by {delta} points
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AsymmetricValuePanel({ data }: AsymmetricValuePanelProps) {
  const {
    forecast,
    heat_vs_evidence,
    verification_checks,
    incentive_fingerprint,
    narrative_template,
    low_regret_action,
  } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Asymmetric Value</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Forecast + verification + action in 10 seconds
          </p>
        </div>
      </div>

      {/* Block 1: Forecast */}
      <Block
        icon={<ForecastIcon />}
        title="Forecast"
        badge={
          <span
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
              forecast.confidence === "high"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                : forecast.confidence === "medium"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {forecast.confidence} confidence
          </span>
        }
        accentColor={forecast.type === "neutral" ? "emerald" : "indigo"}
        explainItems={[
          `Forecast type: ${forecast.type.replace(/_/g, " ")}`,
          "Based on detected language patterns and emotional signals",
          "Higher confidence = stronger pattern match in content structure",
          forecast.type !== "neutral"
            ? "This doesn't mean the content is false - it means the framing is optimized for reaction"
            : "Low manipulation signals detected in this content",
        ]}
      >
        <p className="font-medium">{forecast.text}</p>
      </Block>

      {/* Block 2: Heat vs Evidence */}
      <Block
        icon={<HeatIcon />}
        title="Manipulation ROI"
        badge={
          heat_vs_evidence.warning_active ? (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {heat_vs_evidence.warning_label}
            </span>
          ) : null
        }
        accentColor={heat_vs_evidence.warning_active ? "amber" : "emerald"}
        explainItems={[
          `Heat score (${heat_vs_evidence.heat_score}): Measures emotional intensity, urgency, and arousal`,
          `Evidence score (${heat_vs_evidence.evidence_score}): Measures factual grounding and substantive claims`,
          `Delta: ${heat_vs_evidence.delta >= 0 ? "+" : ""}${heat_vs_evidence.delta} (Heat minus Evidence)`,
          "Delta >= 25 triggers a warning - high emotion with low substance",
          "This metric helps identify content designed to provoke rather than inform",
        ]}
      >
        <HeatEvidenceBar heat={heat_vs_evidence.heat_score} evidence={heat_vs_evidence.evidence_score} />
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">{heat_vs_evidence.interpretation}</p>
      </Block>

      {/* Block 3: Verification Shortcut */}
      <Block
        icon={<VerifyIcon />}
        title="Verification Shortcut"
        accentColor="blue"
        explainItems={[
          "Three quick checks before engaging with or sharing content",
          "Primary source = original document, video, or direct statement",
          "Date context = when did this actually happen?",
          "Counter-evidence = have you seen the other side?",
          "Each check based on what's present (or missing) in the content",
        ]}
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 -my-1">
          {verification_checks.map((check, i) => (
            <VerificationCheckItem key={i} {...check} />
          ))}
        </div>
      </Block>

      {/* Block 4: Incentive Fingerprint */}
      <Block
        icon={<FingerprintIcon />}
        title="Incentive Fingerprint"
        accentColor="purple"
        explainItems={[
          `Primary drivers detected: ${incentive_fingerprint.primary_drivers.map((d) => d.replace(/_/g, " ")).join(", ") || "none"}`,
          "Every viral content has an incentive structure - what does it want from you?",
          "Who benefits when you engage? The original poster, a cause, an algorithm?",
          "This isn't about intent - it's about structural optimization",
          "Knowing the incentive helps you decide if you want to participate",
        ]}
      >
        <p className="font-medium">{incentive_fingerprint.text}</p>
        {incentive_fingerprint.beneficiary && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 italic">
            When it works: {incentive_fingerprint.beneficiary}
          </p>
        )}
      </Block>

      {/* Block 5: Narrative Template (conditional) */}
      {narrative_template && (
        <Block
          icon={<TemplateIcon />}
          title="Narrative Template"
          badge={
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              {Math.round(narrative_template.confidence * 100)}% match
            </span>
          }
          accentColor="purple"
          explainItems={[
            `Template detected: ${narrative_template.name}`,
            "Viral content often follows recognizable patterns or 'templates'",
            "These templates have been refined over time to maximize engagement",
            "Recognizing the template helps you see past the specific content",
            "Templates aren't inherently bad - but awareness helps critical thinking",
          ]}
        >
          <p>
            <span className="font-bold capitalize">{narrative_template.name}</span>
            {" - "}
            {narrative_template.description}
          </p>
        </Block>
      )}

      {/* Block 6: Low-Regret Action */}
      <Block
        icon={<ActionIcon />}
        title="Low-Regret Action"
        badge={
          <span
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
              low_regret_action.priority === "high"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                : low_regret_action.priority === "medium"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            }`}
          >
            {low_regret_action.priority} priority
          </span>
        }
        accentColor={
          low_regret_action.priority === "high"
            ? "rose"
            : low_regret_action.priority === "medium"
            ? "amber"
            : "emerald"
        }
        explainItems={[
          "The single most useful thing to do before engaging",
          "Based on what's missing or concerning in this content",
          "Low-regret = unlikely to backfire regardless of whether content is true",
          low_regret_action.reason,
          "Taking this action costs little but can prevent embarrassment or harm",
        ]}
      >
        <p className="text-base font-bold text-zinc-900 dark:text-white">
          {low_regret_action.action}
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{low_regret_action.reason}</p>
      </Block>
    </div>
  );
}

export default AsymmetricValuePanel;

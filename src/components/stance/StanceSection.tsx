import { ReactNode } from "react";

interface StanceSectionProps {
  title: string;
  badge?: string | number;
  children: ReactNode;
  variant?: "default" | "hero" | "action";
  className?: string;
}

export function StanceSection({
  title,
  badge,
  children,
  variant = "default",
  className = "",
}: StanceSectionProps) {
  const styles = {
    default: "bg-zinc-900/50 border-zinc-800",
    hero: "bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700 shadow-lg shadow-black/20",
    action: "bg-violet-500/5 border-violet-500/20 shadow-lg shadow-violet-500/5",
  };

  const titleStyles = {
    default: "text-zinc-300",
    hero: "text-zinc-100",
    action: "text-violet-400",
  };

  return (
    <div
      className={`${styles[variant]} border rounded-xl p-6 space-y-4 ${className}`}
    >
      <div className="flex items-center gap-2">
        <h3
          className={`text-sm font-bold uppercase tracking-wider ${titleStyles[variant]}`}
        >
          {title}
        </h3>
        {badge !== undefined && (
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded font-mono">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

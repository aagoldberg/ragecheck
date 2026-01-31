export function DefenseScoreGauge({ score }: { score: number }) {
  // Score is 0-100.
  // Low score (good) = green
  // High score (bad/defensive) = red
  const color = score <= 30 ? "#22c55e" : score <= 60 ? "#f59e0b" : "#ef4444";
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#27272a"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 263.89} 263.89`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
            Score
          </span>
        </div>
      </div>
      <p className="text-xs text-zinc-400 text-center max-w-[150px]">
        {score > 60 
          ? "Highly Defensive" 
          : score > 30 
            ? "Moderately Defensive" 
            : "Low Defensiveness"}
      </p>
    </div>
  );
}

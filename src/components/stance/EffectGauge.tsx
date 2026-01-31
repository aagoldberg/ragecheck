export function EffectGauge({ label, value }: { label: string; value: number }) {
  const color = value <= 30 ? "#22c55e" : value <= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
      <div className="relative w-14 h-14 mx-auto mb-2">
        <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="#27272a"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 150.8} 150.8`}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

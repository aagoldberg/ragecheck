import { POSTURE_META, type Posture } from "@/lib/stance/types";

export function PostureBadge({ posture }: { posture: string }) {
  const meta = POSTURE_META[posture as Posture];
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
      style={{
        borderColor: meta?.color || "#8b5cf6",
        backgroundColor: `${meta?.color || "#8b5cf6"}15`,
      }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: meta?.color || "#8b5cf6" }}
      />
      <span
        className="text-sm font-bold"
        style={{ color: meta?.color || "#8b5cf6" }}
      >
        {meta?.label || posture}
      </span>
    </div>
  );
}

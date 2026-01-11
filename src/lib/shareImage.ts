// Canvas-based share image generator for social media
// Optimized for virality: hook line + score + top bars + triggers

import { getHookLine, getTriggersLine, SIGNAL_SHORT_LABELS } from "@/lib/share";
import type { SignalBreakdown } from "@/lib/score";

export interface ShareImageData {
  score: number;
  title: string;
  domain: string;
  signalBreakdown: SignalBreakdown;
}

export type ImageSize = "x" | "bluesky";

const SIZE_CONFIGS: Record<ImageSize, { width: number; height: number }> = {
  x: { width: 1200, height: 675 },      // 16:9 for X
  bluesky: { width: 1200, height: 630 }, // Slightly shorter for Bluesky
};

function getScoreColor(score: number): string {
  if (score <= 33) return "#10b981"; // green
  if (score <= 66) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function getScoreLabel(score: number): string {
  if (score <= 33) return "Low Risk";
  if (score <= 66) return "Borderline";
  return "High Bait";
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function generateShareImage(
  data: ShareImageData,
  format: "jpeg" | "png" = "jpeg",
  size: ImageSize = "x"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const { width, height } = SIZE_CONFIGS[size];
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#18181b"); // zinc-900
    gradient.addColorStop(1, "#09090b"); // zinc-950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle pattern overlay
    ctx.fillStyle = "rgba(255,255,255,0.015)";
    for (let i = 0; i < width; i += 50) {
      for (let j = 0; j < height; j += 50) {
        if ((i + j) % 100 === 0) {
          ctx.fillRect(i, j, 25, 25);
        }
      }
    }

    const scoreColor = getScoreColor(data.score);

    // === HOOK LINE (top, prominent) ===
    const { hookLine, topSignals } = getHookLine(data.score, data.signalBreakdown);

    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(hookLine, width / 2, 50);

    // === SCORE GAUGE (centered) ===
    const centerX = width / 2;
    const centerY = 260;
    const radius = 100;

    // Glow effect
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.5,
      centerX, centerY, radius * 1.4
    );
    glowGradient.addColorStop(0, scoreColor + "30");
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Score arc background
    ctx.strokeStyle = "#3f3f46"; // zinc-700
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.stroke();

    // Score arc progress
    const progress = data.score / 100;
    const startAngle = 0.75 * Math.PI;
    const endAngle = startAngle + progress * 1.5 * Math.PI;
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();

    // Score number
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(data.score), centerX, centerY - 8);

    // Score label
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "600 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("BAIT SCORE", centerX, centerY + 38);

    // Risk level badge
    const label = getScoreLabel(data.score);
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    const badgeWidth = ctx.measureText(label).width + 28;
    drawRoundedRect(ctx, centerX - badgeWidth / 2, centerY + 60, badgeWidth, 30, 15);
    ctx.fillStyle = scoreColor + "25";
    ctx.fill();
    ctx.fillStyle = scoreColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, centerX, centerY + 75);

    // === TOP BARS (always show top 3) ===
    const sortedSignals = (Object.keys(data.signalBreakdown) as (keyof SignalBreakdown)[])
      .map(key => ({ key, value: data.signalBreakdown[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3); // Always show top 3 bars

    if (sortedSignals.length > 0) {
      const barsStartY = 400;
      const barHeight = 10;
      const barSpacing = 50;
      const barWidth = 500;
      const barsX = (width - barWidth) / 2;

      sortedSignals.forEach((signal, i) => {
        const barY = barsStartY + i * barSpacing;

        // Label
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "500 14px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(SIGNAL_SHORT_LABELS[signal.key], barsX, barY - 8);

        // Percentage
        ctx.textAlign = "right";
        ctx.fillText(`${signal.value}%`, barsX + barWidth, barY - 8);

        // Bar background
        drawRoundedRect(ctx, barsX, barY, barWidth, barHeight, 5);
        ctx.fillStyle = "#3f3f46";
        ctx.fill();

        // Bar fill
        const fillWidth = (signal.value / 100) * barWidth;
        if (fillWidth > 0) {
          drawRoundedRect(ctx, barsX, barY, Math.max(fillWidth, 10), barHeight, 5);
          const barColor = signal.value > 66 ? "#ef4444" : signal.value > 33 ? "#f59e0b" : "#10b981";
          ctx.fillStyle = barColor;
          ctx.fill();
        }
      });
    }

    // === TRIGGERS LINE ===
    const triggersLine = getTriggersLine(topSignals);
    if (triggersLine) {
      ctx.fillStyle = "#71717a";
      ctx.font = "500 16px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(triggersLine, width / 2, height - 100);
    }

    // === FOOTER ===
    const footerY = height - 45;

    // RageCheck logo
    ctx.fillStyle = "#fafafa";
    drawRoundedRect(ctx, 60, footerY - 12, 24, 24, 6);
    ctx.fill();

    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("RageCheck", 94, footerY);

    // URL (right side)
    ctx.textAlign = "right";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "500 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("ragecheck.app", width - 60, footerY);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate image"));
        }
      },
      format === "png" ? "image/png" : "image/jpeg",
      format === "png" ? undefined : 0.95
    );
  });
}

export async function downloadShareImage(
  data: ShareImageData,
  filename?: string,
  size: ImageSize = "x"
): Promise<void> {
  const blob = await generateShareImage(data, "jpeg", size);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `ragecheck-${data.score}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyShareImageToClipboard(
  data: ShareImageData,
  size: ImageSize = "x"
): Promise<boolean> {
  try {
    // Clipboard API requires PNG format
    const blob = await generateShareImage(data, "png", size);
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

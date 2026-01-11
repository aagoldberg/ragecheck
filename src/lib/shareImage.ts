// Canvas-based share image generator for social media
// Optimized for virality: source + title + hook line + score + top bars

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

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (ctx.measureText(truncated + "...").width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "...";
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
    const padding = 60;

    // === ROW 1: Source badge + Hook line ===
    const { hookLine, topSignals } = getHookLine(data.score, data.signalBreakdown);

    // Source badge (top left)
    ctx.fillStyle = "#27272a";
    ctx.font = "600 14px system-ui, -apple-system, sans-serif";
    const domainText = data.domain.toUpperCase().slice(0, 20);
    const domainWidth = Math.min(ctx.measureText(domainText).width + 20, 200);
    drawRoundedRect(ctx, padding, 45, domainWidth, 28, 6);
    ctx.fill();
    ctx.fillStyle = "#a1a1aa";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(domainText, padding + 10, 59);

    // Hook line (top right area)
    ctx.fillStyle = scoreColor;
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(hookLine, width - padding, 59);

    // === ROW 2: Article title (2 lines max) ===
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const titleMaxWidth = width - padding * 2;
    const words = data.title.split(" ");
    let line = "";
    let titleY = 100;
    const lineHeight = 42;
    let lineCount = 0;
    const maxLines = 2;

    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > titleMaxWidth && line !== "") {
        ctx.fillText(line.trim(), padding, titleY);
        line = word + " ";
        titleY += lineHeight;
        lineCount++;
        if (lineCount >= maxLines) {
          // Truncate last line
          line = truncateText(ctx, line.trim(), titleMaxWidth);
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (lineCount < maxLines && line.trim()) {
      ctx.fillText(line.trim(), padding, titleY);
    }

    // === LEFT SIDE: Score gauge ===
    const gaugeX = 180;
    const gaugeY = 340;
    const radius = 90;

    // Glow effect
    const glowGradient = ctx.createRadialGradient(
      gaugeX, gaugeY, radius * 0.5,
      gaugeX, gaugeY, radius * 1.3
    );
    glowGradient.addColorStop(0, scoreColor + "25");
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Score arc background
    ctx.strokeStyle = "#3f3f46";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.stroke();

    // Score arc progress
    const progress = data.score / 100;
    const startAngle = 0.75 * Math.PI;
    const endAngle = startAngle + progress * 1.5 * Math.PI;
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, radius, startAngle, endAngle);
    ctx.stroke();

    // Score number
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(data.score), gaugeX, gaugeY - 5);

    // Score label
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "600 14px system-ui, -apple-system, sans-serif";
    ctx.fillText("BAIT SCORE", gaugeX, gaugeY + 35);

    // Risk level badge
    const label = getScoreLabel(data.score);
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    const badgeWidth = ctx.measureText(label).width + 20;
    drawRoundedRect(ctx, gaugeX - badgeWidth / 2, gaugeY + 52, badgeWidth, 24, 12);
    ctx.fillStyle = scoreColor + "25";
    ctx.fill();
    ctx.fillStyle = scoreColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, gaugeX, gaugeY + 64);

    // === RIGHT SIDE: Top 3 bars ===
    const barsX = 340;
    const barsWidth = width - barsX - padding;
    const barsStartY = 250;
    const barHeight = 10;
    const barSpacing = 55;

    const sortedSignals = (Object.keys(data.signalBreakdown) as (keyof SignalBreakdown)[])
      .map(key => ({ key, value: data.signalBreakdown[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    sortedSignals.forEach((signal, i) => {
      const barY = barsStartY + i * barSpacing;

      // Label
      ctx.fillStyle = "#e4e4e7";
      ctx.font = "600 16px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(SIGNAL_SHORT_LABELS[signal.key], barsX, barY - 10);

      // Percentage
      ctx.fillStyle = "#a1a1aa";
      ctx.textAlign = "right";
      ctx.fillText(`${signal.value}%`, barsX + barsWidth, barY - 10);

      // Bar background
      drawRoundedRect(ctx, barsX, barY, barsWidth, barHeight, 5);
      ctx.fillStyle = "#3f3f46";
      ctx.fill();

      // Bar fill
      const fillWidth = (signal.value / 100) * barsWidth;
      if (fillWidth > 0) {
        drawRoundedRect(ctx, barsX, barY, Math.max(fillWidth, 10), barHeight, 5);
        const barColor = signal.value > 66 ? "#ef4444" : signal.value > 33 ? "#f59e0b" : "#10b981";
        ctx.fillStyle = barColor;
        ctx.fill();
      }
    });

    // === TRIGGERS LINE ===
    const triggersLine = getTriggersLine(topSignals);
    if (triggersLine) {
      ctx.fillStyle = "#71717a";
      ctx.font = "500 14px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(triggersLine, barsX, barsStartY + 3 * barSpacing + 10);
    }

    // === FOOTER ===
    const footerY = height - 40;

    // RageCheck logo
    ctx.fillStyle = "#fafafa";
    drawRoundedRect(ctx, padding, footerY - 10, 20, 20, 5);
    ctx.fill();

    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("RageCheck", padding + 28, footerY);

    // URL (right side)
    ctx.textAlign = "right";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "500 14px system-ui, -apple-system, sans-serif";
    ctx.fillText("ragecheck.app", width - padding, footerY);

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

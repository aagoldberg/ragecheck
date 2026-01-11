// Canvas-based share image generator matching the server-rendered design
// Features: speedometer, all 5 signal bars with percentages

import { getScoreColor } from "@/lib/shareCard";
import type { SignalBreakdown } from "@/lib/score";

export interface ShareImageData {
  score: number;
  title: string;
  domain: string;
  signalBreakdown: SignalBreakdown;
}

export type ImageSize = "x" | "bluesky";

const SIZE_CONFIGS: Record<ImageSize, { width: number; height: number }> = {
  x: { width: 1200, height: 675 },
  bluesky: { width: 1200, height: 630 },
};

// Signal bar labels
const SIGNAL_LABELS: Record<string, string> = {
  arousal: "Emotional Arousal",
  enemy_construction: "Enemy Construction",
  moral_condemnation: "Moral Condemnation",
  simplification: "Oversimplification",
  call_to_conflict: "Call-to-Conflict",
};

// Get bar color based on value
function getBarColor(value: number): string {
  if (value >= 60) return "#ef4444"; // red
  if (value >= 30) return "#f59e0b"; // amber
  return "#22c55e"; // green
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) {
        let lastLine = lines[lines.length - 1];
        while (ctx.measureText(lastLine + "...").width > maxWidth && lastLine.length > 0) {
          lastLine = lastLine.slice(0, -1);
        }
        lines[lines.length - 1] = lastLine + "...";
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

export function generateShareImage(
  data: ShareImageData,
  format: "jpeg" | "png" = "png",
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
    const padding = 48;

    const scoreColor = getScoreColor(data.score);

    // Truncate title
    const maxTitleLength = 80;
    const displayTitle = data.title.length > maxTitleLength
      ? data.title.slice(0, maxTitleLength - 3) + "..."
      : data.title;

    // Convert signal breakdown to array
    const barsArray = [
      { key: "arousal", label: SIGNAL_LABELS.arousal, value: data.signalBreakdown.arousal },
      { key: "enemy_construction", label: SIGNAL_LABELS.enemy_construction, value: data.signalBreakdown.enemy_construction },
      { key: "moral_condemnation", label: SIGNAL_LABELS.moral_condemnation, value: data.signalBreakdown.moral_condemnation },
      { key: "simplification", label: SIGNAL_LABELS.simplification, value: data.signalBreakdown.simplification },
      { key: "call_to_conflict", label: SIGNAL_LABELS.call_to_conflict, value: data.signalBreakdown.call_to_conflict },
    ];

    // === BACKGROUND ===
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, width, height);

    // === HEADER ===
    // Logo box
    ctx.fillStyle = "#18181b";
    ctx.fillRect(padding, padding, 32, 32);

    // RageCheck text
    ctx.fillStyle = "#18181b";
    ctx.font = "700 24px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("RageCheck", padding + 44, padding + 16);

    // Domain
    ctx.fillStyle = "#71717a";
    ctx.font = "500 18px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(data.domain, width - padding, padding + 16);

    // === TITLE ===
    ctx.fillStyle = "#18181b";
    ctx.font = "700 32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const titleY = padding + 64;
    const titleLines = wrapText(ctx, displayTitle, width - padding * 2, 2);
    const titleLineHeight = 38;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, padding, titleY + i * titleLineHeight);
    });

    // === MAIN CONTENT AREA ===
    const contentY = titleY + titleLines.length * titleLineHeight + 32;
    const speedometerWidth = 280;
    const barsX = padding + speedometerWidth + 48;
    const barsWidth = width - barsX - padding;

    // === SPEEDOMETER ===
    const speedoCenterX = padding + speedometerWidth / 2;
    const speedoCenterY = contentY + 130;
    const speedoRadius = 90;

    // Draw background arc
    ctx.beginPath();
    ctx.arc(speedoCenterX, speedoCenterY, speedoRadius, Math.PI * 1.25, Math.PI * -0.25, false);
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw colored progress arc
    const progressAngle = Math.PI * 1.25 + (data.score / 100) * Math.PI * 1.5;
    ctx.beginPath();
    ctx.arc(speedoCenterX, speedoCenterY, speedoRadius, Math.PI * 1.25, progressAngle, false);
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw needle
    const needleAngle = Math.PI * 1.25 + (data.score / 100) * Math.PI * 1.5 - Math.PI / 2;
    const needleLength = 70;
    ctx.save();
    ctx.translate(speedoCenterX, speedoCenterY);
    ctx.rotate(needleAngle);
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-2, -needleLength, 4, needleLength);
    ctx.restore();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(speedoCenterX, speedoCenterY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#18181b";
    ctx.fill();

    // Score number
    ctx.fillStyle = scoreColor;
    ctx.font = "900 64px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(String(data.score), speedoCenterX, speedoCenterY + 20);

    // "Bait Score" label
    ctx.fillStyle = "#71717a";
    ctx.font = "700 14px system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "0.1em";
    ctx.fillText("BAIT SCORE", speedoCenterX, speedoCenterY + 90);

    // === SIGNAL BARS ===
    const barHeight = 12;
    const barGap = 16;
    const labelHeight = 24;
    const totalBarHeight = labelHeight + 6 + barHeight;
    const barsStartY = contentY + 20;

    barsArray.forEach((bar, i) => {
      const barY = barsStartY + i * (totalBarHeight + barGap);

      // Label
      ctx.fillStyle = "#3f3f46";
      ctx.font = "600 16px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(bar.label, barsX, barY);

      // Percentage
      ctx.fillStyle = "#18181b";
      ctx.font = "700 16px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${bar.value}%`, barsX + barsWidth, barY);

      // Bar background
      const barBgY = barY + labelHeight + 6;
      ctx.fillStyle = "#e4e4e7";
      ctx.beginPath();
      ctx.roundRect(barsX, barBgY, barsWidth, barHeight, 6);
      ctx.fill();

      // Bar fill
      const fillWidth = (bar.value / 100) * barsWidth;
      if (fillWidth > 0) {
        ctx.fillStyle = getBarColor(bar.value);
        ctx.beginPath();
        ctx.roundRect(barsX, barBgY, fillWidth, barHeight, 6);
        ctx.fill();
      }
    });

    // === FOOTER ===
    const footerY = height - padding - 20;

    // Divider line
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, footerY - 24);
    ctx.lineTo(width - padding, footerY - 24);
    ctx.stroke();

    // Footer text
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "400 14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("ragecheck.app", padding, footerY);

    ctx.textAlign = "right";
    ctx.fillText("AI-powered emotional manipulation analysis", width - padding, footerY);

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
  const blob = await generateShareImage(data, "png", size);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `ragecheck-${data.score}.png`;
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

// Canvas-based share image generator matching the server-rendered design
// Features: compact gauge, signal bars, analysis insights

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
  enemy_construction: "Enemy Framing",
  moral_condemnation: "Moral Outrage",
  simplification: "Oversimplification",
  call_to_conflict: "Call to Conflict",
};

// Get bar color based on value
function getBarColor(value: number): string {
  if (value >= 60) return "#ef4444"; // red
  if (value >= 30) return "#f59e0b"; // amber
  return "#22c55e"; // green
}

// Generate analysis insights based on the data
function getAnalysisInsights(baitScore: number, bars: { key: string; value: number }[]): string[] {
  const insights: string[] = [];
  const sorted = [...bars].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const second = sorted[1];

  if (baitScore >= 70) {
    if (top.key === "arousal" && top.value >= 50) {
      insights.push("Uses emotionally charged language to provoke reaction");
    } else if (top.key === "enemy_construction" && top.value >= 50) {
      insights.push("Frames groups as threats or enemies");
    } else if (top.key === "moral_condemnation" && top.value >= 50) {
      insights.push("Appeals to moral outrage over factual analysis");
    } else {
      insights.push("Multiple manipulation patterns detected");
    }
  } else if (baitScore >= 40) {
    insights.push("Some emotional framing present");
  } else {
    insights.push("Relatively balanced presentation");
  }

  if (second && second.value >= 30 && insights.length < 2) {
    const secondLabel = SIGNAL_LABELS[second.key] || second.key;
    insights.push(`Notable ${secondLabel.toLowerCase()} detected`);
  }

  return insights.slice(0, 2);
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
    const maxTitleLength = 90;
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

    // Get analysis insights
    const insights = getAnalysisInsights(data.score, barsArray);

    // Get top drivers
    const topDrivers = [...barsArray].sort((a, b) => b.value - a.value).slice(0, 2);

    // === BACKGROUND ===
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // === HEADER ===
    // Logo box
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.roundRect(padding, 40, 28, 28, 4);
    ctx.fill();

    // RageCheck text
    ctx.fillStyle = "#18181b";
    ctx.font = "700 20px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("RageCheck", padding + 38, 54);

    // Domain
    ctx.fillStyle = "#71717a";
    ctx.font = "500 16px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(data.domain, width - padding, 54);

    // === TITLE ===
    ctx.fillStyle = "#18181b";
    ctx.font = "700 26px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const titleY = 88;
    const titleLines = wrapText(ctx, displayTitle, width - padding * 2, 2);
    const titleLineHeight = 34;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, padding, titleY + i * titleLineHeight);
    });

    // === LAYOUT CONSTANTS ===
    const contentY = titleY + titleLines.length * titleLineHeight + 24;
    const leftColWidth = 320;
    const rightColX = padding + leftColWidth + 40;
    const rightColWidth = width - rightColX - padding;

    // === LEFT COLUMN: Score + Analysis ===

    // Score box background
    ctx.fillStyle = "#f4f4f5";
    ctx.beginPath();
    ctx.roundRect(padding, contentY, leftColWidth, 82, 12);
    ctx.fill();

    // Mini gauge
    const gaugeX = padding + 60;
    const gaugeY = contentY + 56;
    const gaugeRadius = 32;

    // Background arc
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, gaugeRadius, Math.PI * 1.25, Math.PI * -0.25, false);
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Colored arc
    const progressAngle = Math.PI * 1.25 + (data.score / 100) * Math.PI * 1.5;
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, gaugeRadius, Math.PI * 1.25, progressAngle, false);
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Score number
    ctx.fillStyle = scoreColor;
    ctx.font = "900 42px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(String(data.score), padding + 120, contentY + 35);

    // "Bait Score" label
    ctx.fillStyle = "#71717a";
    ctx.font = "700 11px system-ui, -apple-system, sans-serif";
    ctx.fillText("BAIT SCORE", padding + 120, contentY + 62);

    // Analysis section
    const analysisY = contentY + 102;
    ctx.fillStyle = "#71717a";
    ctx.font = "700 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("ANALYSIS", padding, analysisY);

    // Analysis insights
    ctx.font = "400 14px system-ui, -apple-system, sans-serif";
    insights.forEach((insight, i) => {
      const insightY = analysisY + 22 + i * 24;

      // Bullet
      ctx.fillStyle = scoreColor;
      ctx.fillText("•", padding, insightY);

      // Text
      ctx.fillStyle = "#3f3f46";
      ctx.fillText(insight, padding + 16, insightY);
    });

    // Top driver tags
    const tagsY = analysisY + 22 + insights.length * 24 + 16;
    let tagX = padding;
    topDrivers.forEach((driver) => {
      const label = driver.label.replace("Emotional ", "");
      ctx.font = "600 12px system-ui, -apple-system, sans-serif";
      const tagWidth = ctx.measureText(label).width + 24;

      // Tag background
      ctx.fillStyle = scoreColor + "15";
      ctx.beginPath();
      ctx.roundRect(tagX, tagsY, tagWidth, 28, 6);
      ctx.fill();

      // Tag border
      ctx.strokeStyle = scoreColor + "40";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tag text
      ctx.fillStyle = scoreColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, tagX + tagWidth / 2, tagsY + 14);

      tagX += tagWidth + 8;
    });

    // === RIGHT COLUMN: Signal Bars ===
    ctx.fillStyle = "#71717a";
    ctx.font = "700 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("SIGNAL BREAKDOWN", rightColX, contentY);

    const barsStartY = contentY + 24;
    const barRowHeight = 36;

    barsArray.forEach((bar, i) => {
      const rowY = barsStartY + i * barRowHeight;

      // Label
      ctx.fillStyle = "#52525b";
      ctx.font = "500 13px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(bar.label, rightColX, rowY + 12);

      // Bar background
      const barX = rightColX + 140;
      const barWidth = rightColWidth - 180;
      ctx.fillStyle = "#e4e4e7";
      ctx.beginPath();
      ctx.roundRect(barX, rowY + 7, barWidth, 10, 5);
      ctx.fill();

      // Bar fill
      const fillWidth = (bar.value / 100) * barWidth;
      if (fillWidth > 0) {
        ctx.fillStyle = getBarColor(bar.value);
        ctx.beginPath();
        ctx.roundRect(barX, rowY + 7, fillWidth, 10, 5);
        ctx.fill();
      }

      // Percentage
      ctx.fillStyle = "#18181b";
      ctx.font = "700 13px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${bar.value}%`, rightColX + rightColWidth, rowY + 12);
    });

    // === FOOTER ===
    const footerY = height - 40;

    // Divider line
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, footerY - 16);
    ctx.lineTo(width - padding, footerY - 16);
    ctx.stroke();

    // Footer text
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "400 12px system-ui, -apple-system, sans-serif";
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

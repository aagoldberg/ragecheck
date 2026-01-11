// Canvas-based share image generator matching the "Scientific Report" design
// Features: Monospace header, high-contrast title, precision data footer

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
    
    // Scientific Palette
    const getColors = (s: number) => {
      if (s <= 33) return { main: "#10b981", text: "#047857" }; // Emerald
      if (s <= 66) return { main: "#f59e0b", text: "#b45309" }; // Amber
      return { main: "#ef4444", text: "#b91c1c" }; // Red
    };

    const getRiskLabel = (s: number) => {
      if (s <= 33) return "LOW_RISK_DETECTED";
      if (s <= 66) return "MEDIUM_RISK_DETECTED";
      return "HIGH_RISK_DETECTED";
    };

    const colors = getColors(data.score);
    const riskLabel = getRiskLabel(data.score);
    const date = new Date().toISOString().split("T")[0];
    const reportId = Math.random().toString(36).substring(7).toUpperCase();

    // === BACKGROUND & FRAME ===
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    
    // Thick Frame
    const frameWidth = 24;
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(frameWidth/2, frameWidth/2, width - frameWidth, height - frameWidth);

    const contentPadding = 60;
    
    // === HEADER (Monospace) ===
    ctx.font = "500 24px monospace, 'Courier New', Courier";
    ctx.fillStyle = "#71717a";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    const headerY = contentPadding + frameWidth;
    ctx.fillText("RAGECHECK_ANALYSIS_V1", contentPadding + frameWidth, headerY);
    
    ctx.textAlign = "center";
    ctx.fillText(`ID: ${reportId}`, width / 2, headerY);
    
    ctx.textAlign = "right";
    ctx.fillText(`DATE: ${date}`, width - (contentPadding + frameWidth), headerY);

    // Header Divider Line
    const dividerY = headerY + 40;
    ctx.beginPath();
    ctx.moveTo(contentPadding + frameWidth, dividerY);
    ctx.lineTo(width - (contentPadding + frameWidth), dividerY);
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 2;
    ctx.stroke();

    // === MAIN CONTENT ===
    // Source Tag
    const sourceY = dividerY + 40;
    const sourceText = `SOURCE: ${data.domain.toUpperCase()}`;
    ctx.font = "700 24px system-ui, -apple-system, sans-serif";
    const sourceWidth = ctx.measureText(sourceText).width + 32;
    
    ctx.fillStyle = "#f4f4f5";
    ctx.beginPath();
    ctx.roundRect(contentPadding + frameWidth, sourceY, sourceWidth, 44, 4);
    ctx.fill();
    
    ctx.fillStyle = "#52525b";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(sourceText, contentPadding + frameWidth + 16, sourceY + 22);

    // Title
    const titleY = sourceY + 70;
    ctx.fillStyle = "#18181b";
    ctx.font = "900 56px system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "top";
    
    const maxTitleWidth = width - (contentPadding * 2 + frameWidth * 2);
    const titleLines = wrapText(ctx, data.title, maxTitleWidth, 3);
    const lineHeight = 64;
    
    titleLines.forEach((line, i) => {
      ctx.fillText(line, contentPadding + frameWidth, titleY + (i * lineHeight));
    });

    // === FOOTER (Data Dashboard) ===
    const footerY = height - (contentPadding + frameWidth) - 100;
    
    // Footer Divider
    ctx.beginPath();
    ctx.moveTo(contentPadding + frameWidth, footerY - 32);
    ctx.lineTo(width - (contentPadding + frameWidth), footerY - 32);
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Left: Manipulation Index (Score)
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    // Label
    ctx.font = "500 20px monospace, 'Courier New', Courier";
    ctx.fillStyle = "#71717a";
    ctx.fillText("MANIPULATION_INDEX", contentPadding + frameWidth, footerY);
    
    // Number
    const scoreY = footerY + 30;
    ctx.font = "900 96px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = colors.text;
    const scoreTextWidth = ctx.measureText(String(data.score)).width;
    ctx.fillText(String(data.score), contentPadding + frameWidth, scoreY);
    
    // "/ 100"
    ctx.font = "600 32px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("/ 100", contentPadding + frameWidth + scoreTextWidth + 16, scoreY + 54);

    // Right: Classification Badge
    ctx.textAlign = "right";
    
    // Label
    ctx.font = "500 20px monospace, 'Courier New', Courier";
    ctx.fillStyle = "#71717a";
    ctx.fillText("CLASSIFICATION", width - (contentPadding + frameWidth), footerY);
    
    // Badge
    const badgeY = scoreY + 10;
    ctx.font = "700 32px monospace, 'Courier New', Courier";
    const badgeTextWidth = ctx.measureText(riskLabel).width + 64;
    
    ctx.fillStyle = colors.main;
    ctx.beginPath();
    ctx.roundRect(width - (contentPadding + frameWidth) - badgeTextWidth, badgeY, badgeTextWidth, 70, 4);
    ctx.fill();
    
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(riskLabel, width - (contentPadding + frameWidth) - 32, badgeY + 35);

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
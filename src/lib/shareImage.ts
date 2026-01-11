// Canvas-based share image generator matching the new server-rendered design
// Features: massive hook line, quoted title, score sticker, driver tags

import { getDeterministicHookLine, getTopDrivers, getScoreColor, getAccentColor } from "@/lib/shareCard";
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

const SIGNAL_LABELS: Record<string, string> = {
  arousal: "Arousal",
  enemy_construction: "Enemy Framing",
  moral_condemnation: "Moral Outrage",
  simplification: "Oversimplification",
  call_to_conflict: "Call-to-Conflict",
};

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
        // Truncate last line
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
    const padding = 64;

    // Get design data
    const topDrivers = getTopDrivers(data.signalBreakdown);
    const hookLine = getDeterministicHookLine(data.score, topDrivers);
    const scoreColor = getScoreColor(data.score);
    const accentColor = getAccentColor(data.score);

    // Truncate title
    const maxTitleLength = 100;
    const displayTitle = data.title.length > maxTitleLength
      ? data.title.slice(0, maxTitleLength - 3) + "..."
      : data.title;

    // === BACKGROUND ===
    ctx.fillStyle = "#09090b"; // Matte black
    ctx.fillRect(0, 0, width, height);

    // === HEADER: RAGECHECK / EMOTIONAL ANALYSIS | DOMAIN ===
    ctx.font = "500 20px monospace";
    ctx.textBaseline = "middle";

    // Left side: RAGECHECK / EMOTIONAL ANALYSIS
    ctx.textAlign = "left";
    ctx.fillStyle = "#e4e4e7";
    ctx.font = "700 20px monospace";
    ctx.fillText("RAGECHECK", padding, padding + 10);

    const rageCheckWidth = ctx.measureText("RAGECHECK").width;
    ctx.fillStyle = "#71717a";
    ctx.font = "500 20px monospace";
    ctx.fillText(" / EMOTIONAL ANALYSIS", padding + rageCheckWidth, padding + 10);

    // Right side: DOMAIN
    ctx.textAlign = "right";
    ctx.fillStyle = "#71717a";
    ctx.fillText(data.domain.toUpperCase(), width - padding, padding + 10);

    // === MAIN: MASSIVE HOOK LINE ===
    const hookY = padding + 80;
    ctx.fillStyle = "#fafafa";
    ctx.font = "900 88px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Wrap hook line if needed (max 2 lines)
    const hookLines = wrapText(ctx, hookLine.toUpperCase(), width - padding * 2, 2);
    const hookLineHeight = 80;

    hookLines.forEach((line, i) => {
      ctx.fillText(line, padding, hookY + i * hookLineHeight);
    });

    // === ARTICLE TITLE (quoted, below hook) ===
    const titleY = hookY + hookLines.length * hookLineHeight + 36;
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "500 32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Wrap title (max 2 lines)
    const quotedTitle = `"${displayTitle}"`;
    const titleLines = wrapText(ctx, quotedTitle, (width - padding * 2) * 0.9, 2);
    const titleLineHeight = 42;

    titleLines.forEach((line, i) => {
      ctx.fillText(line, padding, titleY + i * titleLineHeight);
    });

    // === FOOTER: SCORE STICKER (left) + DRIVER TAGS (right) ===
    const footerY = height - padding - 100;

    // --- Score Sticker (rotated) ---
    ctx.save();
    const stickerX = padding + 60;
    const stickerY = footerY + 50;

    // Rotate around sticker center
    ctx.translate(stickerX, stickerY);
    ctx.rotate(-4 * Math.PI / 180); // -4 degrees

    // Sticker background
    const stickerWidth = 130;
    const stickerHeight = 110;
    ctx.fillStyle = scoreColor;
    ctx.fillRect(-stickerWidth/2, -stickerHeight/2, stickerWidth, stickerHeight);

    // White border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(-stickerWidth/2, -stickerHeight/2, stickerWidth, stickerHeight);

    // Shadow effect
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(-stickerWidth/2 + 8, -stickerHeight/2 + 8, stickerWidth, stickerHeight);

    // "BAIT SCORE" label
    ctx.fillStyle = "#000000";
    ctx.font = "800 14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BAIT SCORE", 0, -25);

    // Score number
    ctx.font = "900 56px system-ui, -apple-system, sans-serif";
    ctx.fillText(String(data.score), 0, 20);

    ctx.restore();

    // --- Driver Tags (right side) ---
    ctx.textAlign = "right";
    let tagX = width - padding;
    const tagY = footerY + 50;
    const tagPadding = { x: 24, y: 12 };
    const tagGap = 16;

    // Draw tags from right to left
    topDrivers.slice(0, 2).reverse().forEach((driver) => {
      const label = driver.label.replace("Emotional ", "");
      ctx.font = "700 22px system-ui, -apple-system, sans-serif";
      const textWidth = ctx.measureText(label).width;
      const tagWidth = textWidth + tagPadding.x * 2 + 30; // +30 for warning icon space
      const tagHeight = 44;

      // Tag background (pill shape)
      const tagLeft = tagX - tagWidth;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      drawRoundedRect(ctx, tagLeft, tagY - tagHeight/2, tagWidth, tagHeight, tagHeight/2);
      ctx.fill();

      // Tag border
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, tagLeft, tagY - tagHeight/2, tagWidth, tagHeight, tagHeight/2);
      ctx.stroke();

      // Tag text with warning icon
      ctx.fillStyle = accentColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("⚠ " + label.toUpperCase(), tagLeft + tagPadding.x, tagY);

      tagX = tagLeft - tagGap;
    });

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

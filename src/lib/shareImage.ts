// Canvas-based share image generator matching the Landing Page "Bento" Design
// Features: Clean modern UI, soft borders, rounded aesthetic

import { getScoreColor } from "@/lib/shareCard";
import type { SignalBreakdown } from "@/lib/score";

export interface ShareImageData {
  score: number;
  title: string;
  domain: string;
  signalBreakdown: SignalBreakdown;
  techniqueExplanations?: string[];
  sharingPatterns?: string[];
  shareCardSummary?: string;
  uploadedImageUrl?: string;
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

// Helper to load an image from URL
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export async function generateShareImage(
  data: ShareImageData,
  format: "jpeg" | "png" = "png",
  size: ImageSize = "x"
): Promise<Blob> {
  // Load uploaded image if available
  let uploadedImg: HTMLImageElement | null = null;
  if (data.uploadedImageUrl) {
    try {
      uploadedImg = await loadImage(data.uploadedImageUrl);
    } catch (e) {
      console.warn("Failed to load uploaded image for share card:", e);
    }
  }

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

    // Landing Page Palette
    const getColors = (s: number) => {
      if (s <= 33) return { main: "#10b981", bg: "#ecfdf5", text: "#065f46" }; // Emerald
      if (s <= 66) return { main: "#f59e0b", bg: "#fffbeb", text: "#92400e" }; // Amber
      return { main: "#f43f5e", bg: "#fff1f2", text: "#9f1239" }; // Rose
    };

    const colors = getColors(data.score);
    const riskLabel = data.score > 66 ? "High Risk" : data.score > 33 ? "Medium Risk" : "Low Risk";

    // === BACKGROUND (Zinc-50) ===
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, width, height);

    // === BENTO CARD ===
    const cardPadding = 60;
    const cardX = 40;
    const cardY = 40;
    const cardW = width - 80;
    const cardH = height - 80;

    // Card Shadow
    ctx.shadowColor = "rgba(0,0,0,0.05)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    // Card Body
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#e4e4e7"; // zinc-200
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 32);
    ctx.fill();
    ctx.shadowColor = "transparent"; // Reset shadow for strokes/text
    ctx.stroke();

    const innerX = cardX + cardPadding;
    const innerY = cardY + cardPadding;
    const innerW = cardW - (cardPadding * 2);

    // === HEADER ===
    // Brand
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, 32, 32, 8);
    ctx.fill();

    ctx.font = "700 28px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#18181b";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("RageCheck", innerX + 44, innerY + 18);

    // Domain Pill (hide "unknown" for image uploads with image)
    const showDomain = data.domain && data.domain !== "unknown";
    if (showDomain) {
      ctx.font = "600 20px system-ui, -apple-system, sans-serif";
      const domainText = data.domain;
      const domainWidth = ctx.measureText(domainText).width + 40;

      ctx.fillStyle = "#f4f4f5"; // zinc-100
      ctx.beginPath();
      ctx.roundRect(innerX + innerW - domainWidth, innerY, domainWidth, 40, 20);
      ctx.fill();

      ctx.fillStyle = "#52525b"; // zinc-600
      ctx.textAlign = "center";
      ctx.fillText(domainText, innerX + innerW - (domainWidth/2), innerY + 22);
    }

    // === CONTENT AREA (Image or Title) ===
    const contentY = innerY + 80;
    let insightsY: number;

    if (uploadedImg) {
      // Draw uploaded image thumbnail
      const imgMaxW = 280;
      const imgMaxH = 220;

      // Calculate dimensions maintaining aspect ratio
      const imgRatio = uploadedImg.width / uploadedImg.height;
      let imgW = imgMaxW;
      let imgH = imgW / imgRatio;
      if (imgH > imgMaxH) {
        imgH = imgMaxH;
        imgW = imgH * imgRatio;
      }

      const imgX = innerX;
      const imgY = contentY;

      // Draw rounded image
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 16);
      ctx.clip();
      ctx.drawImage(uploadedImg, imgX, imgY, imgW, imgH);
      ctx.restore();

      // Draw border
      ctx.strokeStyle = "#e4e4e7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 16);
      ctx.stroke();

      // Title next to image (or below if image is wide)
      const textX = imgX + imgW + 32;
      const textMaxW = innerW - imgW - 32;

      ctx.fillStyle = "#18181b";
      ctx.font = "700 32px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Use shareCardSummary or a default headline
      const headline = data.shareCardSummary || "Analyzed for manipulation patterns";
      const headlineLines = wrapText(ctx, headline, textMaxW, 3);
      headlineLines.forEach((line, i) => {
        ctx.fillText(line, textX, contentY + (i * 40));
      });

      insightsY = contentY + imgH + 24;
    } else {
      // Original title layout
      const titleY = contentY;
      ctx.fillStyle = "#18181b";
      ctx.font = "800 56px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const titleLines = wrapText(ctx, data.title, innerW, 2);
      const lineHeight = 68;

      titleLines.forEach((line, i) => {
        ctx.fillText(line, innerX, titleY + (i * lineHeight));
      });

      insightsY = titleY + (titleLines.length * lineHeight) + 40;
    }

    // === FORENSIC INSIGHTS (The "Why") ===
    
    // Only show if we have data
    const points = [
        ...(data.techniqueExplanations || []).slice(0, 1),
        ...(data.sharingPatterns || []).slice(0, 1)
    ];

    if (points.length > 0) {
        points.forEach((point, i) => {
            const pointY = insightsY + (i * 40);
            
            // Bullet styling
            ctx.fillStyle = colors.main;
            ctx.beginPath();
            ctx.arc(innerX + 6, pointY + 12, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Text
            ctx.font = "500 24px system-ui, -apple-system, sans-serif";
            ctx.fillStyle = "#3f3f46"; // zinc-700
            
            // Truncate
            let text = point;
            if (ctx.measureText(text).width > innerW - 30) {
                 while (ctx.measureText(text + "...").width > innerW - 30 && text.length > 0) {
                    text = text.slice(0, -1);
                 }
                 text += "...";
            }
            ctx.fillText(text, innerX + 24, pointY);
        });
    }

    // === FOOTER ===
    const footerY = cardY + cardH - cardPadding;
    
    // Divider
    ctx.strokeStyle = "#f4f4f5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(innerX, footerY - 80);
    ctx.lineTo(innerX + innerW, footerY - 80);
    ctx.stroke();

    // Score Group
    const scoreGroupY = footerY - 40;
    
    // Mini Gauge Ring
    const gaugeSize = 80;
    const gaugeX = innerX + 40;
    const gaugeY = scoreGroupY;
    
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    
    // Background Arc
    ctx.strokeStyle = colors.bg;
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, 32, 0, Math.PI * 2);
    ctx.stroke();
    
    // Active Arc
    ctx.strokeStyle = colors.main;
    ctx.beginPath();
    const endAngle = (Math.PI * 2) * (data.score / 100) - (Math.PI / 2);
    ctx.arc(gaugeX, gaugeY, 32, -Math.PI / 2, endAngle);
    ctx.stroke();
    
    // Score Text inside gauge
    ctx.font = "800 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = colors.main;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(data.score), gaugeX, gaugeY + 2);

    // Text Label next to gauge
    ctx.textAlign = "left";
    ctx.fillStyle = "#a1a1aa"; // zinc-400
    ctx.font = "600 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("BAIT SCORE", innerX + 100, scoreGroupY - 12);
    
    ctx.fillStyle = "#18181b"; // zinc-900
    ctx.font = "700 32px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${data.score} / 100`, innerX + 100, scoreGroupY + 16);

    // Verdict Badge (Right Aligned)
    ctx.font = "700 24px system-ui, -apple-system, sans-serif";
    const badgeTextWidth = ctx.measureText(riskLabel).width;
    const badgePaddingX = 32;
    const badgeW = badgeTextWidth + (badgePaddingX * 2);
    const badgeH = 56;
    const badgeX = innerX + innerW - badgeW;
    const badgeYStart = scoreGroupY - (badgeH / 2);

    ctx.fillStyle = colors.bg;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeYStart, badgeW, badgeH, 16);
    ctx.fill();

    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.fillText(riskLabel, badgeX + (badgeW/2), scoreGroupY + 2);

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
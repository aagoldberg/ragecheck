// Canvas-based share image generator matching the "Bait vs Check" Split Design
// Left: The Content (Mock Post) | Right: The Analysis (Dark Mode)

import QRCode from "qrcode";
import { SIGNAL_LABELS } from "@/lib/shareCard";
import type { SignalBreakdown } from "@/lib/score";

export interface ShareImageData {
  score: number;
  title: string;
  domain: string;
  signalBreakdown: SignalBreakdown;
  techniqueExplanations?: string[];
  sharingPatterns?: string[];
  shareCardSummary?: string;
  shareCardBullets?: string[]; // Short punchy bullets for share card (5-8 words each)
  uploadedImageUrl?: string;
  textPreview?: string; // For social posts, show the actual content instead of title
  sourceUrl?: string; // Original URL for QR code
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

// Helper for rounded rectangles
function roundRect(
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

  // Generate QR code if we have a source URL
  let qrImg: HTMLImageElement | null = null;
  if (data.sourceUrl) {
    try {
      const qrUrl = `https://ragecheck.com?url=${encodeURIComponent(data.sourceUrl)}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 80,
        margin: 0,
        color: { dark: "#ffffff", light: "#00000000" }, // White QR on transparent
      });
      qrImg = await loadImage(qrDataUrl);
    } catch (e) {
      console.warn("Failed to generate QR code:", e);
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

    // Determine Risk/Colors
    const getColors = (s: number) => {
      if (s <= 33) return { main: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.5)", text: "#6ee7b7" }; // Emerald
      if (s <= 66) return { main: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.5)", text: "#fcd34d" }; // Amber
      return { main: "#f43f5e", bg: "rgba(244, 63, 94, 0.15)", border: "rgba(244, 63, 94, 0.5)", text: "#fca5a5" }; // Rose
    };

    const colors = getColors(data.score);
    const riskLabel = data.score > 66 ? "High" : data.score > 33 ? "Medium" : "Low";

    // === BACKGROUNDS ===
    // Left side (White)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width / 2, height);
    
    // Right side (Dark Zinc)
    ctx.fillStyle = "#18181b"; // zinc-950
    ctx.fillRect(width / 2, 0, width / 2, height);

    // === RIGHT SIDE: THE CHECK (Analysis) ===
    const rightX = width / 2;
    const padding = 64;
    const contentWidth = (width / 2) - (padding * 2);
    const centerX = rightX + (width / 4);

    // Subtle Glow (Top Right)
    const gradient = ctx.createRadialGradient(width, 0, 0, width, 0, 600);
    gradient.addColorStop(0, colors.bg);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(rightX, 0, width / 2, height);

    // 1. Logo
    const logoY = padding;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, rightX + padding, logoY, 24, 24, 6);
    ctx.fill();
    ctx.font = "600 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#e4e4e7";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("RageCheck", rightX + padding + 36, logoY + 12);

    // 2. Score Badge
    const badgeY = logoY + 60;
    ctx.font = "700 20px system-ui, -apple-system, sans-serif";
    const badgeText = `EMOTIONAL INTENSITY - ${riskLabel.toUpperCase()}`;
    const badgeTextWidth = ctx.measureText(badgeText).width;
    const badgeHeight = 48;
    const badgeWidth = badgeTextWidth + 48; // text + padding

    // Badge Background
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    roundRect(ctx, rightX + padding, badgeY, badgeWidth, badgeHeight, 24);
    ctx.fill();
    ctx.stroke();

    // Badge Text (Centered)
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, rightX + padding + (badgeWidth / 2), badgeY + (badgeHeight / 2));
    ctx.textAlign = "left"; // Reset to left for subsequent elements

    // 3. Main Statement (Detected Pattern)
    const statementY = badgeY + badgeHeight + 50;

    // Label: "DETECTED PATTERN"
    ctx.font = "700 16px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = colors.main; // Match badge color
    ctx.fillText("DETECTED PATTERN", rightX + padding, statementY);

    // Value: For LOW scores show "None", otherwise show top signal
    let topSignal = "None";
    if (data.score > 33 && data.signalBreakdown) {
       const entries = Object.entries(data.signalBreakdown);
       if (entries.length > 0) {
         const top = entries.sort((a, b) => b[1] - a[1])[0];
         topSignal = SIGNAL_LABELS[top[0] as keyof SignalBreakdown] || "Anger";
       }
    }

    ctx.font = "900 64px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    const signalLines = wrapText(ctx, topSignal, contentWidth, 2);

    signalLines.forEach((line, i) => {
        ctx.fillText(line, rightX + padding, statementY + 40 + (i * 72));
    });

    // 4. Bullet Points (Insights) - prefer short shareCardBullets, fall back to verbose explanations
    const allInsights = data.shareCardBullets && data.shareCardBullets.length > 0
      ? data.shareCardBullets.slice(0, 3)
      : [
          ...(data.techniqueExplanations || []),
          ...(data.sharingPatterns || [])
        ].slice(0, 3);

    const bulletsY = statementY + 40 + (signalLines.length * 72) + 20;
    const ctaY = height - padding;
    
    if (allInsights.length > 0) {
        let currentBulletY = bulletsY;
        allInsights.forEach((point, i) => {
            if (currentBulletY > ctaY - 40) return;

            ctx.fillStyle = colors.main;
            ctx.beginPath();
            ctx.arc(rightX + padding + 5, currentBulletY + 14, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.font = "500 24px system-ui, -apple-system, sans-serif";
            ctx.fillStyle = "#d4d4d8";
            
            const pointLines = wrapText(ctx, point, contentWidth - 30, 2);
            pointLines.forEach((line, j) => {
                if (currentBulletY + (j * 32) > ctaY - 40) return;
                ctx.fillText(line, rightX + padding + 24, currentBulletY + (j * 32) + 14);
            });
            
            currentBulletY += (pointLines.length * 32) + 12;
        });
    }

    // 5. CTA
    ctx.font = "500 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("See through it at ", rightX + padding, ctaY);
    
    const prefixWidth = ctx.measureText("See through it at ").width;
    ctx.font = "700 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ragecheck.com", rightX + padding + prefixWidth, ctaY);
    
    ctx.fillStyle = colors.main;
    ctx.fillRect(rightX + padding + prefixWidth, ctaY + 8, ctx.measureText("ragecheck.com").width, 3);

    // 6. QR Code (bottom right corner)
    if (qrImg) {
      const qrSize = 64;
      const qrX = width - padding - qrSize;
      const qrY = height - padding - qrSize + 12; // Align with CTA baseline
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }


    // === LEFT SIDE: THE BAIT ===
    const leftWidth = width / 2;

    if (uploadedImg) {
      // Show the actual uploaded image
      const imgPadding = 32;
      const maxW = leftWidth - (imgPadding * 2);
      const maxH = height - (imgPadding * 2);

      // Calculate dimensions maintaining aspect ratio
      const imgRatio = uploadedImg.width / uploadedImg.height;
      let drawW = maxW;
      let drawH = drawW / imgRatio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * imgRatio;
      }

      // Center the image
      const drawX = (leftWidth - drawW) / 2;
      const drawY = (height - drawH) / 2;

      // Draw with rounded corners
      ctx.save();
      roundRect(ctx, drawX, drawY, drawW, drawH, 16);
      ctx.clip();
      ctx.drawImage(uploadedImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Border
      ctx.strokeStyle = "#e4e4e7";
      ctx.lineWidth = 2;
      roundRect(ctx, drawX, drawY, drawW, drawH, 16);
      ctx.stroke();
    } else {
      // Show content cleanly for URL analyses
      const contentPadding = 48;
      const contentWidth = leftWidth - (contentPadding * 2);

      // Source domain pill at top
      ctx.font = "600 18px system-ui, -apple-system, sans-serif";
      const displayDomain = data.domain.replace(/^www\./, "").split('/')[0];
      const domainText = displayDomain || "source";
      const pillWidth = ctx.measureText(domainText).width + 32;
      const pillHeight = 36;
      const pillY = contentPadding;

      ctx.fillStyle = "#f4f4f5";
      roundRect(ctx, contentPadding, pillY, pillWidth, pillHeight, 18);
      ctx.fill();

      ctx.fillStyle = "#52525b";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(domainText, contentPadding + 16, pillY + pillHeight / 2);

      // Title/headline - centered vertically in remaining space
      // For social posts, use textPreview (actual content) instead of title
      const socialDomains = ["x.com", "twitter.com", "bsky.app", "facebook.com", "instagram.com", "reddit.com", "threads.net"];
      const isSocialPost = socialDomains.some(d => data.domain.includes(d));
      ctx.font = "500 42px system-ui, -apple-system, sans-serif";
      const bodyText = (isSocialPost && data.textPreview) ? data.textPreview : data.title;
      const bodyLines = wrapText(ctx, bodyText, contentWidth, 10);
      const lineHeight = 50;
      const bodyHeight = bodyLines.length * lineHeight;

      // Center the title block vertically (below the pill)
      const availableHeight = height - pillY - pillHeight - contentPadding - 40;
      const titleStartY = pillY + pillHeight + 40 + (availableHeight - bodyHeight) / 2;

      ctx.fillStyle = "#18181b";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      bodyLines.forEach((line, i) => {
        ctx.fillText(line, contentPadding, titleStartY + (i * lineHeight));
      });
    }


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

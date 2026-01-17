// Canvas-based share image generator matching the "Bait vs Check" Split Design
// Left: The Content (Mock Post) | Right: The Analysis (Dark Mode)

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
      console.log("Loading uploaded image for share card:", data.uploadedImageUrl.substring(0, 100));
      uploadedImg = await loadImage(data.uploadedImageUrl);
      console.log("Successfully loaded image:", uploadedImg.width, "x", uploadedImg.height);
    } catch (e) {
      console.warn("Failed to load uploaded image for share card:", e);
    }
  } else {
    console.log("No uploadedImageUrl provided for share card");
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

    // Subtle Glow (Top Right)
    const gradient = ctx.createRadialGradient(width, 0, 0, width, 0, 600);
    gradient.addColorStop(0, colors.bg);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(rightX, 0, width / 2, height);

    // 1. Logo
    const logoY = padding + 20;
    // Icon
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, rightX + padding, logoY, 24, 24, 6);
    ctx.fill();
    // Text
    ctx.font = "600 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#e4e4e7"; // zinc-200
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("RageCheck", rightX + padding + 36, logoY + 12);

    // 2. Score Badge
    const badgeY = logoY + 60;
    ctx.font = "700 20px system-ui, -apple-system, sans-serif";
    const badgeText = `EMOTIONAL INTENSITY - ${riskLabel.toUpperCase()}`;
    const badgeTextWidth = ctx.measureText(badgeText).width;
    const badgeHeight = 48;
    const badgeWidth = badgeTextWidth + 60; // text + dot + padding

    // Badge Background
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    roundRect(ctx, rightX + padding, badgeY, badgeWidth, badgeHeight, 100);
    ctx.fill();
    ctx.stroke();

    // Dot
    ctx.fillStyle = colors.main;
    ctx.beginPath();
    ctx.arc(rightX + padding + 24, badgeY + (badgeHeight/2), 6, 0, Math.PI * 2);
    ctx.fill();

    // Badge Text
    ctx.fillStyle = colors.text;
    ctx.fillText(badgeText, rightX + padding + 44, badgeY + (badgeHeight/2));

    // 3. Main Statement
    const statementY = badgeY + badgeHeight + 40;
    ctx.font = "900 48px system-ui, -apple-system, sans-serif";
    
    // Determine Top Signal for dynamic headline
    let topSignal = "Anger";
    if (data.signalBreakdown) {
       const entries = Object.entries(data.signalBreakdown);
       if (entries.length > 0) {
         const top = entries.sort((a, b) => b[1] - a[1])[0];
         topSignal = SIGNAL_LABELS[top[0] as keyof SignalBreakdown] || "Anger";
       }
    }
    
    // Gradient Text
    const gradientText = ctx.createLinearGradient(0, statementY, 0, statementY + 120);
    gradientText.addColorStop(0, "#ffffff");
    gradientText.addColorStop(1, "#a1a1aa");
    ctx.fillStyle = gradientText;
    
    const statement = `This post is optimized for ${topSignal}.`;
    const statementLines = wrapText(ctx, statement, contentWidth, 3);
    
    statementLines.forEach((line, i) => {
        ctx.fillText(line, rightX + padding, statementY + (i * 56) + 24);
    });

    // 4. Bullet Points (Insights)
    // Combine technique explanations and sharing patterns
    const allInsights = [
        ...(data.techniqueExplanations || []),
        ...(data.sharingPatterns || [])
    ].slice(0, 3);

    const bulletsY = statementY + (statementLines.length * 56) + 40;
    
    if (allInsights.length > 0) {
        allInsights.forEach((point, i) => {
            const pointY = bulletsY + (i * 40);
            
            // Dot
            ctx.fillStyle = colors.main;
            ctx.beginPath();
            ctx.arc(rightX + padding + 5, pointY + 5, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Text
            ctx.font = "500 24px system-ui, -apple-system, sans-serif";
            ctx.fillStyle = "#e4e4e7"; // zinc-200
            
            // Truncate
            let text = point;
            if (ctx.measureText(text).width > contentWidth - 30) {
                 while (ctx.measureText(text + "...").width > contentWidth - 30 && text.length > 0) {
                    text = text.slice(0, -1);
                 }
                 text += "...";
            }
            ctx.fillText(text, rightX + padding + 24, pointY + 12); // baseline adjustment
        });
    }

    // 5. CTA
    const ctaY = height - padding - 20;
    ctx.font = "500 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a1a1aa"; // zinc-400
    ctx.fillText("See through it at ", rightX + padding, ctaY);
    
    const prefixWidth = ctx.measureText("See through it at ").width;
    ctx.font = "700 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ragecheck.com", rightX + padding + prefixWidth, ctaY);
    
    // Underline
    ctx.fillStyle = colors.main;
    ctx.fillRect(rightX + padding + prefixWidth, ctaY + 8, ctx.measureText("ragecheck.com").width, 3);


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
      ctx.font = "700 48px system-ui, -apple-system, sans-serif";
      const titleText = data.title.length > 120 ? data.title.substring(0, 117) + "..." : data.title;
      const titleLines = wrapText(ctx, titleText, contentWidth, 5);
      const lineHeight = 58;
      const titleBlockHeight = titleLines.length * lineHeight;

      // Center the title block vertically (below the pill)
      const availableHeight = height - pillY - pillHeight - contentPadding - 40;
      const titleStartY = pillY + pillHeight + 40 + (availableHeight - titleBlockHeight) / 2;

      ctx.fillStyle = "#18181b";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      titleLines.forEach((line, i) => {
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

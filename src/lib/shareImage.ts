// Canvas-based share image generator matching the "Bait vs Check" Split Design
// Left: The Content (Mock Post) | Right: The Analysis (Dark Mode)

import qrcode from "qrcode-generator";
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
  shareUrl?: string; // Share page URL for QR code
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

  // Generate QR code if we have a source URL or share URL
  let qrImg: HTMLImageElement | null = null;
  const targetUrl = data.shareUrl || (data.sourceUrl ? `https://ragecheck.com?url=${encodeURIComponent(data.sourceUrl)}&ref=qr` : "https://ragecheck.com");
  
  if (typeof window !== "undefined") {
    try {
      const qr = qrcode(0, "M"); // Type 0 = auto, Error correction M
      qr.addData(targetUrl);
      qr.make();
      // Create image data URL - cellSize 4 gives good resolution
      const dataUrl = qr.createDataURL(4, 0);
      qrImg = await loadImage(dataUrl);
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
    // Left side (White) - 40%
    const splitRatio = 0.4;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width * splitRatio, height);
    
    // Right side (Dark Zinc) - 60%
    ctx.fillStyle = "#18181b"; // zinc-950
    ctx.fillRect(width * splitRatio, 0, width * (1 - splitRatio), height);

    // === RIGHT SIDE: THE CHECK (Analysis) ===
    const rightX = width * splitRatio;
    const rightWidth = width * (1 - splitRatio);
    const padding = 64;
    
    // QR Config
    const qrBoxSize = 200;
    const qrSize = 180;
    const qrPadding = 10;
    
    // Content width must account for QR code at bottom to avoid overlap
    const fullContentWidth = rightWidth - (padding * 2);
    const constrainedWidth = fullContentWidth - qrBoxSize - 20;

    // Subtle Glow (Top Right)
    const gradient = ctx.createRadialGradient(width, 0, 0, width, 0, 600);
    gradient.addColorStop(0, colors.bg);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(rightX, 0, rightWidth, height);

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
    const badgeWidth = badgeTextWidth + 48;

    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    roundRect(ctx, rightX + padding, badgeY, badgeWidth, badgeHeight, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, rightX + padding + (badgeWidth / 2), badgeY + (badgeHeight / 2));
    ctx.textAlign = "left";

    // 3. Main Statement
    const statementY = badgeY + badgeHeight + 40;
    
    // Label: "DETECTED PATTERN"
    ctx.font = "700 16px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a1a1aa"; // Zinc-400 for metadata
    ctx.textBaseline = "top"; // Ensure consistent positioning
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
    const signalLines = wrapText(ctx, topSignal, fullContentWidth, 2);

    signalLines.forEach((line, i) => {
        ctx.fillText(line, rightX + padding, statementY + 24 + (i * 72));
    });

    // 6. QR Code "Sticker" (Bottom Right)
    if (qrImg) {
      const qrBoxWidth = 200;
      const qrBoxHeight = 240; // Optimized height
      
      const qrBoxX = width - padding - qrBoxWidth + 20; 
      const qrBoxY = height - padding - qrBoxHeight + 20;

      // White Background Box
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, 16);
      ctx.fill();

      // Draw QR code inside the box (Top with padding)
      const qrImgX = qrBoxX + (qrBoxWidth - qrSize) / 2;
      const qrImgY = qrBoxY + 12;
      ctx.drawImage(qrImg, qrImgX, qrImgY, qrSize, qrSize);

      // Label below QR (Centered in remaining space)
      ctx.font = "700 18px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#18181b"; // Dark text on white
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Scan for details", qrBoxX + (qrBoxWidth / 2), qrBoxY + 216);
      ctx.textAlign = "left"; // Reset
    }

    // 5. Bullet Points (Constrained Width)
    const allInsights = data.shareCardBullets && data.shareCardBullets.length > 0
      ? data.shareCardBullets.slice(0, 3)
      : [
          ...(data.techniqueExplanations || []),
          ...(data.sharingPatterns || [])
        ].slice(0, 3);

    const bulletsY = statementY + 20 + (signalLines.length * 72) + 20;
    const ctaY = height - padding;
    
    if (allInsights.length > 0) {
        // Use top baseline for multi-line bullet text for easier calculation
        ctx.textBaseline = "top";
        
        let currentBulletY = bulletsY;
        allInsights.forEach((point, i) => {
            // Check vertical overlap with QR area start (approx height - padding - qrBoxSize)
            const qrTopY = height - padding - qrBoxSize;
            if (currentBulletY > qrTopY && constrainedWidth < 100) return; // Should not happen with current layout

            ctx.fillStyle = colors.main;
            ctx.beginPath();
            ctx.arc(rightX + padding + 5, currentBulletY + 10, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.font = "500 24px system-ui, -apple-system, sans-serif";
            ctx.fillStyle = "#d4d4d8";
            
            // Wrap text to constrained width to avoid hitting QR
            const pointLines = wrapText(ctx, point, constrainedWidth, 2);
            pointLines.forEach((line, j) => {
                ctx.fillText(line, rightX + padding + 24, currentBulletY + (j * 32));
            });
            
            currentBulletY += (pointLines.length * 32) + 16;
        });
    }

    // 5. CTA
    // Reset to alphabetic baseline for standard footer alignment
    ctx.textBaseline = "alphabetic";
    
    ctx.font = "500 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("See through it at ", rightX + padding, ctaY);
    
    const prefixWidth = ctx.measureText("See through it at ").width;
    ctx.font = "700 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ragecheck.com", rightX + padding + prefixWidth, ctaY);
    
    ctx.fillStyle = colors.main;
    ctx.fillRect(rightX + padding + prefixWidth, ctaY + 6, ctx.measureText("ragecheck.com").width, 3);


    // === LEFT SIDE: THE BAIT ===
    const leftWidth = width * splitRatio;

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
      const contentPadding = 32;
      const contentWidth = leftWidth - (contentPadding * 2);

      // Check if it's a social post
      const socialDomains = ["x.com", "twitter.com", "bsky.app", "facebook.com", "instagram.com", "reddit.com", "threads.net"];
      const isSocialPost = socialDomains.some(d => data.domain.includes(d));
      const isTwitter = data.domain.includes("x.com") || data.domain.includes("twitter.com");
      const isBluesky = data.domain.includes("bsky.app");

      if (isSocialPost && data.textPreview) {
        // === SOCIAL POST CARD DESIGN ===
        const cardPadding = 24;
        const cardMargin = 24;
        const cardWidth = leftWidth - (cardMargin * 2);
        const cardX = cardMargin;

        // Extract username from title (e.g., "Tweet by @MayorFrey" or "Post by @username")
        let username = "User";
        let handle = "@user";
        const titleMatch = data.title.match(/(?:Tweet|Post|Skeet)\s+by\s+@?(\w+)/i);
        if (titleMatch) {
          username = titleMatch[1];
          handle = `@${titleMatch[1]}`;
        } else if (data.title.includes("@")) {
          const atMatch = data.title.match(/@(\w+)/);
          if (atMatch) {
            username = atMatch[1];
            handle = `@${atMatch[1]}`;
          }
        }

        // Calculate card height based on content
        ctx.font = "400 28px system-ui, -apple-system, sans-serif";
        const postLines = wrapText(ctx, data.textPreview, cardWidth - (cardPadding * 2), 8);
        const postLineHeight = 36;
        const postHeight = postLines.length * postLineHeight;
        const headerHeight = 60; // Avatar + name area
        const cardHeight = Math.min(height - (cardMargin * 2), cardPadding * 2 + headerHeight + postHeight + 20);
        const cardY = (height - cardHeight) / 2;

        // Card background with shadow effect
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        roundRect(ctx, cardX + 4, cardY + 4, cardWidth, cardHeight, 16);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
        ctx.fill();

        // Card border
        ctx.strokeStyle = "#e4e4e7";
        ctx.lineWidth = 1;
        roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
        ctx.stroke();

        // Avatar circle
        const avatarSize = 48;
        const avatarX = cardX + cardPadding;
        const avatarY = cardY + cardPadding;

        ctx.fillStyle = "#18181b";
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Avatar letter
        ctx.font = "700 24px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(username[0].toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2);

        // Username and handle
        const nameX = avatarX + avatarSize + 12;
        const nameY = avatarY + 14;

        ctx.font = "700 22px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#18181b";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(username, nameX, nameY);

        ctx.font = "400 18px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#71717a";
        ctx.fillText(handle, nameX, nameY + 26);

        // Platform logo (X/Twitter or Bluesky)
        const logoX = cardX + cardWidth - cardPadding - 24;
        const logoY = avatarY + 12;

        if (isTwitter) {
          // X logo
          ctx.font = "700 28px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = "#18181b";
          ctx.textAlign = "center";
          ctx.fillText("𝕏", logoX + 12, logoY + 14);
        } else if (isBluesky) {
          // Bluesky butterfly (simplified)
          ctx.fillStyle = "#0085ff";
          ctx.beginPath();
          ctx.arc(logoX + 12, logoY + 12, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = "700 16px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("☁", logoX + 12, logoY + 12);
        }

        // Post content
        const postY = avatarY + avatarSize + 16;
        ctx.font = "400 28px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#18181b";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        postLines.forEach((line, i) => {
          ctx.fillText(line, cardX + cardPadding, postY + (i * postLineHeight));
        });

      } else {
        // === ARTICLE/NEWS CARD DESIGN ===
        // Source domain pill at top
        ctx.font = "600 18px system-ui, -apple-system, sans-serif";
        const displayDomain = data.domain.replace(/^www\./, "").split('/')[0];
        const domainText = displayDomain || "source";
        const pillWidth = ctx.measureText(domainText).width + 32;
        const pillHeight = 36;
        const pillY = contentPadding + 16;

        ctx.fillStyle = "#f4f4f5";
        roundRect(ctx, contentPadding, pillY, pillWidth, pillHeight, 18);
        ctx.fill();

        ctx.fillStyle = "#52525b";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(domainText, contentPadding + 16, pillY + pillHeight / 2);

        // Title/headline - centered vertically in remaining space
        ctx.font = "500 42px system-ui, -apple-system, sans-serif";
        const bodyLines = wrapText(ctx, data.title, contentWidth, 10);
        const lineHeight = 50;
        const bodyHeight = bodyLines.length * lineHeight;

        // Center the title block vertically (below the pill)
        const availableHeight = height - pillY - pillHeight - contentPadding - 40;
        const titleStartY = pillY + pillHeight + (availableHeight - bodyHeight) / 2 - 20;

        ctx.fillStyle = "#18181b";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        bodyLines.forEach((line, i) => {
          ctx.fillText(line, contentPadding, titleStartY + (i * lineHeight));
        });
      }
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

// Check if we're on a mobile device
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Check if Web Share API supports files
function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) return false;
  // Check if sharing files is supported
  return navigator.canShare({
    files: [new File(["test"], "test.png", { type: "image/png" })],
  });
}

// Check if clipboard write with images is supported
async function canWriteImageToClipboard(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard || !navigator.clipboard.write) return false;
  // ClipboardItem is not available on all browsers
  if (typeof ClipboardItem === "undefined") return false;
  return true;
}

export async function copyShareImageToClipboard(
  data: ShareImageData,
  size: ImageSize = "x"
): Promise<boolean> {
  try {
    const blob = await generateShareImage(data, "png", size);

    // On mobile, prefer Web Share API which works better
    if (isMobile() && canShareFiles()) {
      const file = new File([blob], "ragecheck-result.png", { type: "image/png" });
      await navigator.share({
        files: [file],
        title: "RageCheck Analysis",
        text: `Emotional Intensity Score: ${data.score}/100`,
      });
      return true;
    }

    // Desktop: try clipboard API
    if (await canWriteImageToClipboard()) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      return true;
    }

    // Fallback: download the image
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ragecheck-${data.score}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Share failed:", error);
    // If share was cancelled by user, still return false gracefully
    return false;
  }
}
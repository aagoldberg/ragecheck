/**
 * Sharecard Renderer
 *
 * Generates shareable image cards with 3 style variants:
 * 1. Respectful Share - Neutral, informative tone
 * 2. Group Sanity Check - Collaborative, "let's verify together"
 * 3. Direct Warning - Clear alert, still not insulting
 *
 * Target: 1200x630 (OpenGraph standard)
 * Max text: 240 characters visible
 */

import { SharecardContent, SharecardOutput, SharecardVariant } from "./types";

// ============================================
// CONSTANTS
// ============================================

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const SAFE_MARGIN = 60;

const COLORS = {
  // Backgrounds by variant
  bg: {
    respectful_share: "#F8FAFC", // Slate 50
    group_sanity_check: "#FEF3C7", // Amber 100
    direct_warning: "#FEE2E2", // Rose 100
  },
  // Accent colors
  accent: {
    respectful_share: "#6366F1", // Indigo 500
    group_sanity_check: "#F59E0B", // Amber 500
    direct_warning: "#EF4444", // Rose 500
  },
  // Text
  text: {
    primary: "#18181B", // Zinc 900
    secondary: "#71717A", // Zinc 500
    muted: "#A1A1AA", // Zinc 400
  },
  // Bars
  heat: "#F43F5E", // Rose 500
  evidence: "#10B981", // Emerald 500
  barBg: "#E4E4E7", // Zinc 200
};

// ============================================
// CANVAS RENDERING
// ============================================

export interface SharecardRenderOptions {
  variant: SharecardVariant;
  content: SharecardContent;
}

/**
 * Render a sharecard to a canvas element
 */
export async function renderSharecardToCanvas(
  canvas: HTMLCanvasElement,
  options: SharecardRenderOptions
): Promise<void> {
  const { variant, content } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const bgColor = COLORS.bg[variant];
  const accentColor = COLORS.accent[variant];

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Left accent bar
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 8, CARD_HEIGHT);

  // Hook line (main message)
  ctx.fillStyle = COLORS.text.primary;
  ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(content.hook, SAFE_MARGIN, SAFE_MARGIN);

  // Heat and Evidence bars
  const barY = SAFE_MARGIN + 80;
  const barWidth = 300;
  const barHeight = 24;
  const barGap = 16;

  // Heat bar
  ctx.fillStyle = COLORS.text.secondary;
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("HEAT", SAFE_MARGIN, barY);

  ctx.fillStyle = COLORS.barBg;
  ctx.fillRect(SAFE_MARGIN + 80, barY - 2, barWidth, barHeight);

  const heatValue = parseInt(content.heat_display) || 0;
  ctx.fillStyle = COLORS.heat;
  ctx.fillRect(SAFE_MARGIN + 80, barY - 2, (barWidth * heatValue) / 100, barHeight);

  ctx.fillStyle = COLORS.text.primary;
  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(content.heat_display, SAFE_MARGIN + 80 + barWidth + 12, barY);

  // Evidence bar
  const evidenceY = barY + barHeight + barGap;
  ctx.fillStyle = COLORS.text.secondary;
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("EVIDENCE", SAFE_MARGIN, evidenceY);

  ctx.fillStyle = COLORS.barBg;
  ctx.fillRect(SAFE_MARGIN + 80, evidenceY - 2, barWidth, barHeight);

  const evidenceValue = parseInt(content.evidence_display) || 0;
  ctx.fillStyle = COLORS.evidence;
  ctx.fillRect(SAFE_MARGIN + 80, evidenceY - 2, (barWidth * evidenceValue) / 100, barHeight);

  ctx.fillStyle = COLORS.text.primary;
  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(content.evidence_display, SAFE_MARGIN + 80 + barWidth + 12, evidenceY);

  // Verification flag (right side, pill style)
  const flagY = barY + 10;
  const flagX = CARD_WIDTH - SAFE_MARGIN - 280;

  ctx.fillStyle = accentColor + "20"; // 20% opacity
  roundRect(ctx, flagX, flagY, 280, 56, 12);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  roundRect(ctx, flagX, flagY, 280, 56, 12);
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("VERIFICATION FLAG", flagX + 16, flagY + 18);

  ctx.fillStyle = COLORS.text.primary;
  ctx.font = "600 16px system-ui, -apple-system, sans-serif";
  ctx.fillText(content.verification_flag, flagX + 16, flagY + 38);

  // Divider line
  const dividerY = CARD_HEIGHT - 180;
  ctx.strokeStyle = COLORS.text.muted + "40";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SAFE_MARGIN, dividerY);
  ctx.lineTo(CARD_WIDTH - SAFE_MARGIN, dividerY);
  ctx.stroke();

  // Low-regret action box
  const actionY = dividerY + 24;
  ctx.fillStyle = COLORS.text.secondary;
  ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("BEFORE YOU ENGAGE", SAFE_MARGIN, actionY);

  ctx.fillStyle = COLORS.text.primary;
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.fillText(content.low_regret_action, SAFE_MARGIN, actionY + 28);

  // Footer
  const footerY = CARD_HEIGHT - SAFE_MARGIN - 20;

  // RageCheck logo placeholder (circle)
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(SAFE_MARGIN + 16, footerY + 8, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("R", SAFE_MARGIN + 16, footerY + 13);
  ctx.textAlign = "left";

  // Footer text
  ctx.fillStyle = COLORS.text.secondary;
  ctx.font = "600 16px system-ui, -apple-system, sans-serif";
  ctx.fillText(content.footer_domain, SAFE_MARGIN + 44, footerY + 12);

  // Source domain (right side)
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.text.muted;
  ctx.font = "500 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(`Source: ${content.footer_source}`, CARD_WIDTH - SAFE_MARGIN, footerY + 12);
  ctx.textAlign = "left";
}

/**
 * Helper: Draw rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
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

/**
 * Generate sharecard as a Blob
 */
export async function generateSharecardBlob(
  options: SharecardRenderOptions
): Promise<Blob> {
  // Create offscreen canvas
  const canvas = document.createElement("canvas");
  await renderSharecardToCanvas(canvas, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Copy sharecard to clipboard
 */
export async function copySharecardToClipboard(
  options: SharecardRenderOptions
): Promise<boolean> {
  try {
    const blob = await generateSharecardBlob(options);
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch (error) {
    console.error("Failed to copy sharecard:", error);
    return false;
  }
}

/**
 * Download sharecard as PNG
 */
export async function downloadSharecard(
  options: SharecardRenderOptions,
  filename: string = "ragecheck-sharecard.png"
): Promise<void> {
  const blob = await generateSharecardBlob(options);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ============================================
// TEXT-ONLY EXPORT (for platforms without image)
// ============================================

export interface SharecardTextExport {
  variant: SharecardVariant;
  fullText: string;
  twitterText: string;
  blueskyText: string;
}

export function getSharecardText(
  content: SharecardContent,
  resultUrl: string
): SharecardTextExport {
  const { variant, hook, verification_flag, low_regret_action, footer_source } = content;

  // Full text version
  const fullText = `${hook}\n\nHeat: ${content.heat_display} | Evidence: ${content.evidence_display}\nFlag: ${verification_flag}\nAction: ${low_regret_action}\n\n${resultUrl}`;

  // Twitter version (shorter)
  const twitterText = `${hook}\n\n${verification_flag}\n${resultUrl}`;

  // Bluesky version
  const blueskyText = `${hook}\n\nRageCheck on ${footer_source}:\n${resultUrl}`;

  return {
    variant,
    fullText,
    twitterText,
    blueskyText,
  };
}

// ============================================
// VARIANT SELECTOR
// ============================================

export interface VariantInfo {
  id: SharecardVariant;
  name: string;
  description: string;
  tone: string;
}

export const VARIANT_INFO: VariantInfo[] = [
  {
    id: "respectful_share",
    name: "Respectful Share",
    description: "Neutral, informative tone",
    tone: "I found this worth checking",
  },
  {
    id: "group_sanity_check",
    name: "Group Sanity Check",
    description: "Collaborative verification",
    tone: "Let's verify this together",
  },
  {
    id: "direct_warning",
    name: "Direct Warning",
    description: "Clear alert, not insulting",
    tone: "Heads up on this one",
  },
];

/**
 * Get recommended variant based on content
 */
export function getRecommendedVariant(
  heat_score: number,
  evidence_score: number
): SharecardVariant {
  const delta = heat_score - evidence_score;

  if (delta >= 40) {
    return "direct_warning";
  }
  if (delta >= 20) {
    return "group_sanity_check";
  }
  return "respectful_share";
}

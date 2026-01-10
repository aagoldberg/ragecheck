// Canvas-based share image generator for Twitter/social media

interface ShareImageData {
  score: number;
  title: string;
  domain: string;
  signalBreakdown: {
    arousal: number;
    enemy_construction: number;
    moral_condemnation: number;
    simplification: number;
    call_to_conflict: number;
  };
}

const SIGNAL_LABELS: Record<string, string> = {
  arousal: "Emotional Arousal",
  enemy_construction: "Enemy Construction",
  moral_condemnation: "Moral Condemnation",
  simplification: "Oversimplification",
  call_to_conflict: "Call-to-Conflict",
};

function getScoreColor(score: number): string {
  if (score <= 33) return "#10b981"; // green
  if (score <= 66) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function getScoreLabel(score: number): string {
  if (score <= 33) return "Low";
  if (score <= 66) return "Medium";
  return "High";
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

export function generateShareImage(data: ShareImageData, format: "jpeg" | "png" = "jpeg"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    // Twitter optimal image size
    const width = 1200;
    const height = 628;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#18181b"); // zinc-900
    gradient.addColorStop(1, "#09090b"); // zinc-950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle pattern overlay
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        if ((i + j) % 80 === 0) {
          ctx.fillRect(i, j, 20, 20);
        }
      }
    }

    // Score circle background
    const scoreColor = getScoreColor(data.score);
    const centerX = 200;
    const centerY = height / 2;
    const radius = 120;

    // Glow effect
    const glowGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 1.5);
    glowGradient.addColorStop(0, scoreColor + "40");
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Score arc background
    ctx.strokeStyle = "#3f3f46"; // zinc-700
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.stroke();

    // Score arc progress
    const progress = data.score / 100;
    const startAngle = 0.75 * Math.PI;
    const endAngle = startAngle + progress * 1.5 * Math.PI;
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();

    // Score number
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(data.score), centerX, centerY - 10);

    // Score label
    ctx.fillStyle = "#a1a1aa"; // zinc-400
    ctx.font = "600 18px system-ui, -apple-system, sans-serif";
    ctx.fillText("BAIT SCORE", centerX, centerY + 45);

    // Risk level badge
    const label = getScoreLabel(data.score);
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    const badgeWidth = ctx.measureText(label).width + 24;
    drawRoundedRect(ctx, centerX - badgeWidth / 2, centerY + 70, badgeWidth, 28, 14);
    ctx.fillStyle = scoreColor + "30";
    ctx.fill();
    ctx.fillStyle = scoreColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, centerX, centerY + 84);

    // Right side content
    const contentX = 380;
    const contentWidth = width - contentX - 60;

    // Domain badge
    ctx.fillStyle = "#27272a"; // zinc-800
    drawRoundedRect(ctx, contentX, 80, Math.min(ctx.measureText(data.domain.toUpperCase()).width + 24, 200), 32, 6);
    ctx.fill();
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "600 12px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(data.domain.toUpperCase().slice(0, 25), contentX + 12, 96);

    // Title
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Word wrap title
    const words = data.title.split(" ");
    let line = "";
    let y = 130;
    const maxWidth = contentWidth;
    const lineHeight = 40;
    let lineCount = 0;
    const maxLines = 3;

    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== "") {
        ctx.fillText(line.trim(), contentX, y);
        line = word + " ";
        y += lineHeight;
        lineCount++;
        if (lineCount >= maxLines) {
          line = line.trim().slice(0, -3) + "...";
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (lineCount < maxLines && line.trim()) {
      ctx.fillText(line.trim(), contentX, y);
    }

    // Signal bars
    const barsY = 280;
    const barHeight = 8;
    const barSpacing = 50;
    const barWidth = contentWidth - 100;
    const signals = [
      { key: "arousal", value: data.signalBreakdown.arousal },
      { key: "enemy_construction", value: data.signalBreakdown.enemy_construction },
      { key: "moral_condemnation", value: data.signalBreakdown.moral_condemnation },
      { key: "simplification", value: data.signalBreakdown.simplification },
      { key: "call_to_conflict", value: data.signalBreakdown.call_to_conflict },
    ];

    signals.forEach((signal, i) => {
      const signalY = barsY + i * barSpacing;

      // Label
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "500 14px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(SIGNAL_LABELS[signal.key], contentX, signalY - 6);

      // Percentage
      ctx.textAlign = "right";
      ctx.fillText(`${signal.value}%`, contentX + barWidth, signalY - 6);

      // Bar background
      drawRoundedRect(ctx, contentX, signalY, barWidth, barHeight, 4);
      ctx.fillStyle = "#3f3f46";
      ctx.fill();

      // Bar fill
      const fillWidth = (signal.value / 100) * barWidth;
      if (fillWidth > 0) {
        drawRoundedRect(ctx, contentX, signalY, Math.max(fillWidth, 8), barHeight, 4);
        const barColor = signal.value > 66 ? "#ef4444" : signal.value > 33 ? "#f59e0b" : "#10b981";
        ctx.fillStyle = barColor;
        ctx.fill();
      }
    });

    // Footer
    const footerY = height - 50;

    // RageCheck logo/text
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Logo square
    ctx.fillStyle = "#fafafa";
    drawRoundedRect(ctx, 60, footerY - 12, 24, 24, 6);
    ctx.fill();

    ctx.fillStyle = "#fafafa";
    ctx.fillText("RageCheck", 94, footerY);

    // Tagline
    ctx.fillStyle = "#71717a"; // zinc-500
    ctx.font = "400 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("See what reactions it's built to trigger", 220, footerY);

    // URL
    ctx.textAlign = "right";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "500 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("ragecheck.app", width - 60, footerY);

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

export async function downloadShareImage(data: ShareImageData, filename?: string): Promise<void> {
  const blob = await generateShareImage(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `ragecheck-${data.score}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyShareImageToClipboard(data: ShareImageData): Promise<boolean> {
  try {
    // Clipboard API requires PNG format
    const blob = await generateShareImage(data, "png");
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

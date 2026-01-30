import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { extractContent } from "@/lib/extract";
import { STANCE_SYSTEM_PROMPT, buildStanceUserPrompt } from "@/lib/stance/prompt";
import { saveStanceAnalysis } from "@/lib/db";
import type { StanceAnalysis, StanceResult } from "@/lib/stance/types";

export const maxDuration = 90;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function hashInput(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function detectContentType(text: string, mode: string): string {
  if (mode === "image") return "screenshot_text";
  if (text.length < 300) return "tweet";
  if (text.length > 3000) return "article";
  return "other";
}

async function extractTextFromImage(imageData: string): Promise<string> {
  if (!client) throw new Error("Analysis service not configured");

  const response = await client.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageData.startsWith("data:image/png")
                ? "image/png"
                : imageData.startsWith("data:image/gif")
                  ? "image/gif"
                  : imageData.startsWith("data:image/webp")
                    ? "image/webp"
                    : "image/jpeg",
              data: imageData.split(",")[1],
            },
          },
          {
            type: "text",
            text: "Extract ALL text visible in this image. Include usernames, post content, replies, timestamps, and any other visible text. Reproduce the text as faithfully as possible, preserving the structure of the conversation. If there are multiple messages or posts, separate them clearly. Output ONLY the extracted text, nothing else.",
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  if (!text || text.length < 10) {
    throw new Error("Could not extract enough text from this image.");
  }

  return text;
}

function parseAndValidate(responseText: string): StanceAnalysis {
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
  const parsed = JSON.parse(jsonStr);

  // Validate critical fields exist
  if (!parsed.summary || !parsed.posture || !parsed.defense_module) {
    throw new Error("Missing required analysis fields");
  }

  // Clamp numeric fields
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, typeof v === "number" ? Math.round(v) : 0));

  if (parsed.predicted_effects) {
    parsed.predicted_effects.escalation_likelihood = clamp(parsed.predicted_effects.escalation_likelihood, 0, 100);
    parsed.predicted_effects.polarization_push = clamp(parsed.predicted_effects.polarization_push, 0, 100);
    parsed.predicted_effects.belief_closure = clamp(parsed.predicted_effects.belief_closure, 0, 100);
    parsed.predicted_effects.virality_language_only = clamp(parsed.predicted_effects.virality_language_only, 0, 100);
  }

  if (parsed.defense_module) {
    parsed.defense_module.overall_defense_score_raw = clamp(parsed.defense_module.overall_defense_score_raw, 0, 100);
    if (Array.isArray(parsed.defense_module.tags)) {
      for (const tag of parsed.defense_module.tags) {
        tag.intensity = clamp(tag.intensity, 0, 10);
      }
    }
  }

  return parsed as StanceAnalysis;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, url, image } = body;

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Analysis service not configured" },
        { status: 500 }
      );
    }

    let inputText: string;
    let inputMode: string;

    // ---- IMAGE MODE ----
    if (image && typeof image === "string") {
      inputMode = "image";

      if (!image.startsWith("data:image/")) {
        return NextResponse.json(
          { success: false, error: "Invalid image format" },
          { status: 400 }
        );
      }

      const base64Data = image.split(",")[1];
      if (base64Data && base64Data.length * 0.75 > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { success: false, error: "Image too large (max 5MB)" },
          { status: 400 }
        );
      }

      try {
        inputText = await extractTextFromImage(image);
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Failed to extract text from image",
          },
          { status: 422 }
        );
      }
    }
    // ---- URL MODE ----
    else if (url && typeof url === "string") {
      inputMode = "url";

      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid URL format" },
          { status: 400 }
        );
      }

      const extracted = await extractContent(url);
      if (!extracted.success || !extracted.text) {
        return NextResponse.json(
          { success: false, error: extracted.error || "Failed to extract content from URL" },
          { status: 422 }
        );
      }

      inputText = extracted.text.slice(0, 15000);

      if (inputText.length < 20) {
        return NextResponse.json(
          { success: false, error: "Could not extract enough text from that URL" },
          { status: 422 }
        );
      }
    }
    // ---- TEXT MODE ----
    else if (text && typeof text === "string") {
      inputMode = "text";
      inputText = text.trim();

      if (inputText.length < 10) {
        return NextResponse.json(
          { success: false, error: "Text is too short to analyze" },
          { status: 400 }
        );
      }

      if (inputText.length > 15000) {
        inputText = inputText.slice(0, 15000);
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Text, URL, or image is required" },
        { status: 400 }
      );
    }

    const contentType = detectContentType(inputText, inputMode);

    // Call Claude
    const response = await client.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 8192,
      system: STANCE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildStanceUserPrompt(inputText, contentType) }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let analysis: StanceAnalysis;
    try {
      analysis = parseAndValidate(responseText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse analysis response" },
        { status: 500 }
      );
    }

    // Save to DB
    const inputHash = hashInput(inputText);
    let analysisId: string;
    try {
      analysisId = await saveStanceAnalysis(
        inputHash,
        inputText.slice(0, 5000),
        inputMode,
        analysis as unknown as Record<string, unknown>,
        analysis.posture.primary,
        analysis.defense_module.overall_defense_score_raw
      );
    } catch {
      analysisId = crypto.randomUUID();
    }

    const result: StanceResult = {
      id: analysisId,
      analysis,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Stance analyze error:", error);
    return NextResponse.json(
      { success: false, error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

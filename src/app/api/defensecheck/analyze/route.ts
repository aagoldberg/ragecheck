import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { extractContent } from "@/lib/extract";
import { DEFENSECHECK_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/defensecheck/prompt";
import { normalizeScore, getScoreLabel, validateAndCleanPatterns } from "@/lib/defensecheck/scoring";
import { saveDefenseCheckAnalysis } from "@/lib/db";
import type { AlternativeReading, DefenseCheckResult, InputType } from "@/lib/defensecheck/types";

export const maxDuration = 60;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function hashInput(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/**
 * Use Claude Vision to extract text from an image, then analyze for defensive rhetoric.
 */
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
    throw new Error(
      "Could not extract enough text from this image. Try uploading a screenshot with visible text content."
    );
  }

  return text;
}

function parseClaudeResponse(responseText: string) {
  // Handle markdown-wrapped JSON
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
  return JSON.parse(jsonStr);
}

function buildResult(parsed: Record<string, unknown>) {
  const patterns = validateAndCleanPatterns(parsed.patterns);
  const score = normalizeScore(patterns);
  const scoreLabel = getScoreLabel(score);

  const alternativeReading: AlternativeReading =
    parsed.alternativeReading && typeof parsed.alternativeReading === "object"
      ? {
          summary:
            ((parsed.alternativeReading as Record<string, unknown>)
              .summary as string) || "No alternative reading provided.",
          factors: Array.isArray(
            (parsed.alternativeReading as Record<string, unknown>).factors
          )
            ? ((parsed.alternativeReading as Record<string, unknown>)
                .factors as string[])
            : [],
        }
      : { summary: "No alternative reading provided.", factors: [] };

  const overallAssessment =
    typeof parsed.overallAssessment === "string"
      ? parsed.overallAssessment
      : "Analysis complete.";

  const validInputTypes = ["confrontation", "explanation", "narrative", "other"];
  const inputType: InputType = validInputTypes.includes(
    parsed.inputType as string
  )
    ? (parsed.inputType as InputType)
    : "other";

  return { patterns, score, scoreLabel, alternativeReading, overallAssessment, inputType };
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
            error:
              error instanceof Error
                ? error.message
                : "Failed to extract text from image",
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
          {
            success: false,
            error: extracted.error || "Failed to extract content from URL",
          },
          { status: 422 }
        );
      }

      inputText = extracted.text.slice(0, 15000);

      if (inputText.length < 20) {
        return NextResponse.json(
          {
            success: false,
            error: "Could not extract enough text from that URL",
          },
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

    // Call Claude for defensive rhetoric analysis
    const response = await client.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 4096,
      system: DEFENSECHECK_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(inputText) }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let parsed: Record<string, unknown>;
    try {
      parsed = parseClaudeResponse(responseText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse analysis response" },
        { status: 500 }
      );
    }

    const { patterns, score, scoreLabel, alternativeReading, overallAssessment, inputType } =
      buildResult(parsed);

    // Save to DB
    const inputHash = hashInput(inputText);
    const resultData = {
      patterns,
      alternativeReading,
      overallAssessment,
      inputType,
      scoreLabel,
    };

    let analysisId: string;
    try {
      analysisId = await saveDefenseCheckAnalysis(
        inputHash,
        inputText.slice(0, 5000),
        inputMode,
        resultData,
        score
      );
    } catch {
      analysisId = crypto.randomUUID();
    }

    const result: DefenseCheckResult = {
      id: analysisId,
      score,
      scoreLabel,
      patterns,
      alternativeReading,
      overallAssessment,
      inputType,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("DefenseCheck analyze error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Analysis failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

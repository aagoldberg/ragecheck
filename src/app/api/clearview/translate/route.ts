import { NextRequest, NextResponse } from "next/server";
import {
  getCachedTranslation,
  saveClearviewTranslation,
  getClearviewBriefingById,
  initClearviewTranslationTable,
} from "@/lib/db";
import { translateClearviewStories } from "@/lib/llm";

export const maxDuration = 120;

const SUPPORTED_LANGUAGES = [
  "Spanish", "French", "German", "Portuguese", "Italian",
  "Dutch", "Polish", "Russian", "Japanese", "Korean",
  "Chinese", "Arabic", "Hindi", "Turkish",
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const language = searchParams.get("language");
  const briefingIdStr = searchParams.get("briefingId");

  if (!language || !briefingIdStr) {
    return NextResponse.json(
      { success: false, error: "Missing language or briefingId parameter" },
      { status: 400 }
    );
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return NextResponse.json(
      { success: false, error: `Unsupported language: ${language}` },
      { status: 400 }
    );
  }

  const briefingId = parseInt(briefingIdStr, 10);
  if (isNaN(briefingId)) {
    return NextResponse.json(
      { success: false, error: "Invalid briefingId" },
      { status: 400 }
    );
  }

  try {
    await initClearviewTranslationTable();

    // Check cache first
    const cached = await getCachedTranslation(briefingId, language);
    if (cached) {
      return NextResponse.json({ success: true, stories: cached, cached: true });
    }

    // Fetch the English briefing
    const briefing = await getClearviewBriefingById(briefingId);
    if (!briefing || briefing.stories.length === 0) {
      return NextResponse.json(
        { success: false, error: "Briefing not found or stale" },
        { status: 404 }
      );
    }

    // Translate via LLM
    const translated = await translateClearviewStories(briefing.stories, language);
    if (!translated) {
      return NextResponse.json(
        { success: false, error: "Translation failed" },
        { status: 500 }
      );
    }

    // Cache the translation
    await saveClearviewTranslation(briefingId, language, translated, briefing.generatedAt);

    return NextResponse.json({ success: true, stories: translated, cached: false });
  } catch (error) {
    console.error("Translate endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Translation failed" },
      { status: 500 }
    );
  }
}

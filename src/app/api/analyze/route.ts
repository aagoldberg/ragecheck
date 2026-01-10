import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/lib/extract";
import { analyzeText, SignalBreakdown, Highlight } from "@/lib/score";
import { enhanceWithLLM, isLLMAvailable, analyzeImageWithVision } from "@/lib/llm";
import { logAnalysis, getCachedAnalysis } from "@/lib/db";

// Extend function timeout for slow sites
export const maxDuration = 60; // 60 seconds

export interface AnalyzeResponse {
  success: boolean;
  error?: string;
  score?: number;
  label?: "Low" | "Medium" | "High";
  reasons?: string[];
  highlights?: Highlight[];
  signalBreakdown?: SignalBreakdown;
  title?: string;
  sourceDomain?: string;
  textPreview?: string;
  llmEnhanced?: boolean;
  contextNotes?: string;
  image?: string;
  sharingPatterns?: string[];
  techniqueExplanations?: string[];
  cached?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function getLabel(score: number): "Low" | "Medium" | "High" {
  if (score <= 33) return "Low";
  if (score <= 66) return "Medium";
  return "High";
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body = await request.json();
    const { url, image } = body;

    // Capture visitor info from headers
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || null;
    const userAgent = request.headers.get("user-agent") || null;
    const country = request.headers.get("x-vercel-ip-country") || null;

    // Handle image upload
    if (image && typeof image === "string") {
      // Validate image format
      if (!image.startsWith("data:image/")) {
        return NextResponse.json(
          { success: false, error: "Invalid image format" },
          { status: 400 }
        );
      }

      // Check approximate size (base64 is ~4/3 larger than binary)
      const base64Data = image.split(",")[1];
      if (base64Data && base64Data.length * 0.75 > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { success: false, error: "Image too large (max 5MB)" },
          { status: 400 }
        );
      }

      // Analyze with Vision API
      const result = await analyzeImageWithVision(image);

      if (!result.success) {
        logAnalysis({
          url: "image-upload",
          sourceDomain: "image",
          success: false,
          error: result.error || "Failed to analyze image",
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
          country: country || undefined,
        });

        return NextResponse.json(
          { success: false, error: result.error || "Failed to analyze image" },
          { status: 422 }
        );
      }

      // Log successful image analysis
      logAnalysis({
        url: "image-upload",
        sourceDomain: result.platform || "image",
        score: result.score,
        label: result.label,
        llmEnhanced: true,
        signalBreakdown: result.signalBreakdown,
        success: true,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        country: country || undefined,
      });

      return NextResponse.json({
        success: true,
        score: result.score,
        label: result.label,
        reasons: result.reasons,
        highlights: result.highlights,
        signalBreakdown: result.signalBreakdown,
        title: "Uploaded Screenshot",
        sourceDomain: result.platform || "image",
        textPreview: result.extractedText,
        llmEnhanced: true,
        sharingPatterns: result.sharingPatterns,
        techniqueExplanations: result.techniqueExplanations,
      });
    }

    // Handle URL analysis (existing logic)
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL or image is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check cache first (results from last 24 hours)
    const cached = await getCachedAnalysis(url);
    if (cached) {
      console.log(`Cache hit for ${url}`);
      return NextResponse.json({
        success: true,
        score: cached.score,
        label: cached.label as "Low" | "Medium" | "High",
        reasons: cached.reasons.length > 0 ? cached.reasons : ["Analysis based on detected patterns"],
        highlights: cached.highlights as Highlight[],
        signalBreakdown: cached.signalBreakdown,
        title: cached.title || "Article Analysis",
        sourceDomain: cached.sourceDomain,
        textPreview: cached.textPreview || "",
        llmEnhanced: cached.llmEnhanced,
        contextNotes: cached.contextNotes || undefined,
        cached: true,
      });
    }

    // Extract content from URL
    const extracted = await extractContent(url);

    if (!extracted.success) {
      // Log failed extraction
      logAnalysis({
        url,
        sourceDomain: extracted.sourceDomain,
        success: false,
        error: extracted.error || "Failed to extract content",
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        country: country || undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: extracted.error || "Failed to extract content",
          sourceDomain: extracted.sourceDomain,
        },
        { status: 422 }
      );
    }

    // Analyze the text with rules
    const ruleAnalysis = analyzeText(extracted.text);

    // Create a preview of the text (limit to 5000 chars to avoid payload issues)
    const textPreview = extracted.text.length > 5000
      ? extracted.text.substring(0, 5000) + "..."
      : extracted.text;

    // Try to enhance with LLM if available
    let finalScore = ruleAnalysis.score;
    let finalReasons = ruleAnalysis.reasons;
    let llmEnhanced = false;
    let contextNotes: string | undefined;
    let sharingPatterns: string[] | undefined;
    let techniqueExplanations: string[] | undefined;

    if (isLLMAvailable()) {
      const llmResult = await enhanceWithLLM({
        text: extracted.text,
        title: extracted.title,
        ruleBasedScore: ruleAnalysis.score,
        signalBreakdown: ruleAnalysis.signalBreakdown,
        highlights: ruleAnalysis.highlights,
      });

      if (llmResult) {
        finalScore = llmResult.adjustedScore;
        finalReasons = llmResult.reasons;
        contextNotes = llmResult.contextNotes;
        sharingPatterns = llmResult.sharingPatterns;
        techniqueExplanations = llmResult.techniqueExplanations;
        llmEnhanced = true;
      }
    }

    const label = getLabel(finalScore);

    // Log successful analysis with full data for caching
    logAnalysis({
      url,
      sourceDomain: extracted.sourceDomain,
      score: finalScore,
      label,
      llmEnhanced,
      signalBreakdown: ruleAnalysis.signalBreakdown,
      success: true,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      country: country || undefined,
      title: extracted.title,
      reasons: finalReasons,
      highlights: ruleAnalysis.highlights,
      contextNotes,
      textPreview,
    });

    return NextResponse.json({
      success: true,
      score: finalScore,
      label,
      reasons: finalReasons,
      highlights: ruleAnalysis.highlights,
      signalBreakdown: ruleAnalysis.signalBreakdown,
      title: extracted.title,
      sourceDomain: extracted.sourceDomain,
      textPreview,
      llmEnhanced,
      contextNotes,
      image: extracted.image,
      sharingPatterns,
      techniqueExplanations,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

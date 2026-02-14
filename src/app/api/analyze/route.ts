import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/lib/extract";
import { analyzeText, SignalBreakdown, Highlight } from "@/lib/score";
import { enhanceWithLLM, isLLMAvailable, analyzeImageWithVision } from "@/lib/llm";
import { logAnalysis, getCachedAnalysis } from "@/lib/db";
import { saveFailedImage, saveUploadedImage } from "@/lib/blob";

// Extend function timeout for slow sites
export const maxDuration = 60; // 60 seconds

// CORS headers for browser extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Helper to add CORS headers to response
function jsonResponse(data: AnalyzeResponse, options?: { status?: number }) {
  return NextResponse.json(data, { status: options?.status || 200, headers: corsHeaders });
}

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
  shareCardSummary?: string;
  shareCardBullets?: string[];
  cached?: boolean;
  uploadedImageUrl?: string;
  analyzedUrl?: string; // Unique URL for this analysis, used for share tracking
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
    const { url, image, sessionId, language, source } = body;

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
        return jsonResponse(
          { success: false, error: "Invalid image format" },
          { status: 400 }
        );
      }

      // Check approximate size (base64 is ~4/3 larger than binary)
      const base64Data = image.split(",")[1];
      if (base64Data && base64Data.length * 0.75 > MAX_IMAGE_SIZE) {
        return jsonResponse(
          { success: false, error: "Image too large (max 5MB)" },
          { status: 400 }
        );
      }

      // Analyze with Vision API
      const result = await analyzeImageWithVision(image, language);

      if (!result.success) {
        // Save failed image to blob storage for diagnosis
        const failedImageUrl = await saveFailedImage(image, result.error || "Unknown error");
        // Use blob URL if available, otherwise generate a unique ID for this upload
        const uniqueUrl = failedImageUrl || `image-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        await logAnalysis({
          url: uniqueUrl,
          sourceDomain: "image",
          success: false,
          error: result.error || "Failed to analyze image",
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
          country: country || undefined,
          failedImageUrl: failedImageUrl || undefined,
          sessionId: sessionId || undefined,
          language: language || undefined,
        });

        return jsonResponse(
          { success: false, error: result.error || "Failed to analyze image", analyzedUrl: uniqueUrl },
          { status: 422 }
        );
      }

      // Check if the image has no analyzable text content
      if (result.platform === "not_social_media" || result.platform === "no_text_content") {
        const uniqueUrl = `image-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await logAnalysis({
          url: uniqueUrl,
          sourceDomain: result.platform,
          success: false,
          error: "Image has no text content to analyze",
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
          country: country || undefined,
          sessionId: sessionId || undefined,
          language: language || undefined,
        });

        return jsonResponse(
          {
            success: false,
            error: "This image doesn't have text content to analyze. Please upload a screenshot of a social media post, meme with text, or news headline.",
            analyzedUrl: uniqueUrl,
          },
          { status: 422 }
        );
      }

      // Save successful image to blob storage
      const imageUrl = await saveUploadedImage(image, "uploads");
      // Use blob URL for unique identification, or generate one if save failed
      const uniqueUrl = imageUrl || `image-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Log successful image analysis
      await logAnalysis({
        url: uniqueUrl,
        sourceDomain: result.platform || "image",
        score: result.score,
        label: result.label,
        llmEnhanced: true,
        signalBreakdown: result.signalBreakdown,
        success: true,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        country: country || undefined,
        failedImageUrl: imageUrl || undefined, // Reusing this field for all uploaded images
        sessionId: sessionId || undefined,
        language: language || undefined,
      });

      return jsonResponse({
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
        shareCardSummary: result.shareCardSummary,
        shareCardBullets: result.shareCardBullets,
        uploadedImageUrl: imageUrl || undefined,
        analyzedUrl: uniqueUrl, // For share tracking
      });
    }

    // Handle URL analysis (existing logic) or direct text from extension
    const directText = body.text && typeof body.text === "string" ? body.text.trim() : null;

    if (!url && !directText) {
      return jsonResponse(
        { success: false, error: "URL, text, or image is required" },
        { status: 400 }
      );
    }

    // If we have a URL, validate it
    if (url && typeof url === "string") {
      try {
        new URL(url);
      } catch {
        if (!directText) {
          return jsonResponse(
            { success: false, error: "Invalid URL format" },
            { status: 400 }
          );
        }
        // Invalid URL but we have text — continue with text-only
      }
    }

    const forceReanalyze = body.force === true;
    const effectiveUrl = (url && typeof url === "string") ? url : `text-${Date.now()}`;

    // Check cache first (results from last 24 hours) unless force re-analyze
    // Only cache by URL when we have one, skip cache for text-only
    const cached = (!forceReanalyze && url) ? await getCachedAnalysis(url) : null;
    if (cached) {
      console.log(`Cache hit for ${url}`);

      // Log cache hit as a completion so funnel metrics are accurate
      await logAnalysis({
        url: effectiveUrl,
        sourceDomain: cached.sourceDomain,
        score: cached.score,
        label: cached.label,
        llmEnhanced: cached.llmEnhanced,
        signalBreakdown: cached.signalBreakdown,
        success: true,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        country: country || undefined,
        sessionId: sessionId || undefined,
        title: cached.title || undefined,
        reasons: cached.reasons,
        highlights: cached.highlights,
        contextNotes: cached.contextNotes || undefined,
        textPreview: cached.textPreview || undefined,
        sharingPatterns: cached.sharingPatterns || undefined,
        techniqueExplanations: cached.techniqueExplanations || undefined,
        shareCardSummary: cached.shareCardSummary || undefined,
        shareCardBullets: cached.shareCardBullets || undefined,
        language: language || undefined,
      });

      return jsonResponse({
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
        sharingPatterns: cached.sharingPatterns,
        techniqueExplanations: cached.techniqueExplanations,
        shareCardSummary: cached.shareCardSummary || undefined,
        shareCardBullets: cached.shareCardBullets || undefined,
        cached: true,
      });
    }

    // Get content: use direct text from extension, or extract from URL
    let extractedText: string;
    let extractedTitle: string;
    let extractedSourceDomain: string;
    let extractedImage: string | undefined;

    if (directText) {
      // Text provided directly by browser extension (DOM-extracted)
      extractedText = directText;
      extractedTitle = directText.slice(0, 100);
      try {
        extractedSourceDomain = new URL(effectiveUrl).hostname;
      } catch {
        extractedSourceDomain = "extension";
      }
    } else {
      // Extract content from URL (server-side fetch)
      const extracted = await extractContent(url);

      if (!extracted.success) {
        // Log failed extraction
        await logAnalysis({
          url: effectiveUrl,
          sourceDomain: extracted.sourceDomain,
          success: false,
          error: extracted.error || "Failed to extract content",
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
          country: country || undefined,
          sessionId: sessionId || undefined,
          language: language || undefined,
        });

        return jsonResponse(
          {
            success: false,
            error: extracted.error || "Failed to extract content",
            sourceDomain: extracted.sourceDomain,
          },
          { status: 422 }
        );
      }

      extractedText = extracted.text;
      extractedTitle = extracted.title;
      extractedSourceDomain = extracted.sourceDomain;
      extractedImage = extracted.image;
    }

    // Analyze the text with rules
    const ruleAnalysis = analyzeText(extractedText);

    // Create a preview of the text (limit to 5000 chars to avoid payload issues)
    const textPreview = extractedText.length > 5000
      ? extractedText.substring(0, 5000) + "..."
      : extractedText;

    // Try to enhance with LLM if available
    let finalScore = ruleAnalysis.score;
    let finalReasons = ruleAnalysis.reasons;
    let llmEnhanced = false;
    let contextNotes: string | undefined;
    let sharingPatterns: string[] | undefined;
    let techniqueExplanations: string[] | undefined;
    let shareCardSummary: string | undefined;
    let shareCardBullets: string[] | undefined;
    let topic: string | undefined;
    let contentType: string | undefined;
    let sourceType: string | undefined;

    if (isLLMAvailable()) {
      const llmResult = await enhanceWithLLM({
        text: extractedText,
        title: extractedTitle,
        ruleBasedScore: ruleAnalysis.score,
        signalBreakdown: ruleAnalysis.signalBreakdown,
        highlights: ruleAnalysis.highlights,
        language,
        useCompactModel: source === "extension",
      });

      if (llmResult) {
        finalScore = llmResult.adjustedScore;
        finalReasons = llmResult.reasons;
        contextNotes = llmResult.contextNotes;
        sharingPatterns = llmResult.sharingPatterns;
        techniqueExplanations = llmResult.techniqueExplanations;
        shareCardSummary = llmResult.shareCardSummary;
        shareCardBullets = llmResult.shareCardBullets;
        topic = llmResult.topic;
        contentType = llmResult.contentType;
        sourceType = llmResult.sourceType;
        llmEnhanced = true;
      }
    }

    const label = getLabel(finalScore);

    // Log successful analysis with full data for caching
    await logAnalysis({
      url: effectiveUrl,
      sourceDomain: extractedSourceDomain,
      score: finalScore,
      label,
      llmEnhanced,
      signalBreakdown: ruleAnalysis.signalBreakdown,
      success: true,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      country: country || undefined,
      title: extractedTitle,
      reasons: finalReasons,
      highlights: ruleAnalysis.highlights,
      contextNotes,
      textPreview,
      sharingPatterns,
      techniqueExplanations,
      shareCardSummary,
      topic,
      contentType,
      sourceType,
      sessionId: sessionId || undefined,
      language: language || undefined,
    });

    return jsonResponse({
      success: true,
      score: finalScore,
      label,
      reasons: finalReasons,
      highlights: ruleAnalysis.highlights,
      signalBreakdown: ruleAnalysis.signalBreakdown,
      title: extractedTitle,
      sourceDomain: extractedSourceDomain,
      textPreview,
      llmEnhanced,
      contextNotes,
      image: extractedImage,
      sharingPatterns,
      techniqueExplanations,
      shareCardSummary,
      shareCardBullets,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return jsonResponse(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

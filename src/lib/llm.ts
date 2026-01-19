import Anthropic from "@anthropic-ai/sdk";
import { SignalBreakdown, Highlight } from "./score";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface LLMAnalysis {
  adjustedScore: number;
  reasons: string[];
  contextNotes?: string;
  sharingPatterns?: string[];
  techniqueExplanations?: string[];
  shareCardSummary?: string;
  shareCardBullets?: string[]; // Short punchy bullets for share card (5-8 words each)
  // Content categorization
  topic?: string;
  contentType?: string;
  sourceType?: string;
}

const SYSTEM_PROMPT = `You are an expert at detecting outrage bait and manipulative framing in media. Your job is to analyze text and identify patterns designed to provoke emotional reactions rather than inform.

You are NOT a fact-checker or political bias detector. You detect MANIPULATION TACTICS regardless of political leaning.

Key patterns to look for:
1. **Loaded Language**: Emotionally charged words meant to provoke (insults, dehumanization, inflammatory adjectives)
2. **Us-vs-Them Framing**: Creating in-group/out-group divisions, tribal language
3. **Threat/Panic Framing**: Fear-mongering, catastrophizing, existential threats
4. **Absolutist Language**: "Always", "never", "everyone knows" - black-and-white thinking
5. **Engagement Bait**: Clickbait phrases, calls to share, "you won't believe"

IMPORTANT CONTEXT CONSIDERATIONS:
- Quoting someone else's outrage is different from expressing outrage
- Reporting on a controversial topic neutrally should score LOW
- Academic or analytical discussion of extremism should score LOW
- The same words can be manipulative or neutral depending on context

Respond in JSON format only.`;

interface AnalysisRequest {
  text: string;
  title: string;
  ruleBasedScore: number;
  signalBreakdown: SignalBreakdown;
  highlights: Highlight[];
  language?: string; // Optional language for response (e.g., "Spanish", "French")
}

export async function enhanceWithLLM(
  request: AnalysisRequest
): Promise<LLMAnalysis | null> {
  if (!client) {
    return null;
  }

  // Truncate text to save tokens (keep first 3000 chars)
  const truncatedText =
    request.text.length > 3000
      ? request.text.substring(0, 3000) + "..."
      : request.text;

  // Build context about rule-based findings
  const ruleContext = `
Rule-based analysis found:
- Emotional Arousal: ${request.signalBreakdown.arousal}/100
- Enemy Construction: ${request.signalBreakdown.enemy_construction}/100
- Moral Condemnation: ${request.signalBreakdown.moral_condemnation}/100
- Oversimplification: ${request.signalBreakdown.simplification}/100
- Call-to-Conflict: ${request.signalBreakdown.call_to_conflict}/100
- Overall rule-based score: ${request.ruleBasedScore}/100

Flagged phrases: ${request.highlights.slice(0, 10).map((h) => `"${h.text}"`).join(", ")}
`;

  const userPrompt = `Analyze this content for outrage bait patterns:

TITLE: ${request.title}

CONTENT:
${truncatedText}

${ruleContext}

Consider:
1. Is the flagged language being USED manipulatively, or is it being REPORTED/QUOTED/DISCUSSED academically?
2. Are there manipulation tactics the rules missed?
3. What's the overall intent - to inform or to provoke?

shareCardBullets format:
- 5-10 words each, concise but descriptive
- Describe the tactic or what makes the content good/bad
- For LOW scores (≤33): describe journalistic quality, e.g. "Quotes multiple sources directly", "Presents conflicting views neutrally"
- For MEDIUM/HIGH: describe the manipulation, e.g. "Uses scary numbers to amplify threat", "Appeals to insider expertise"

Respond with this exact JSON structure:
{
  "adjustedScore": <number 0-100>,
  "reasons": [<3-5 bullet points explaining the score>],
  "contextNotes": "<optional: note if rule-based score was misleading>",
  "sharingPatterns": [<2-3 reasons why people share this, plain language>],
  "techniqueExplanations": [<2-3 things to notice about how it's written, plain language>],
  "shareCardBullets": [<2-3 NOUN PHRASES, 3-7 words each, NO VERBS>],
  "topic": "<politics|health|technology|business|entertainment|sports|science|crime|culture_wars|environment|education|other>",
  "contentType": "<news_article|opinion|social_post|blog|press_release|satire|academic|other>",
  "sourceType": "<mainstream_news|tabloid|partisan_outlet|independent_blog|social_media|wire_service|government|corporate|other>"
}${request.language ? `

IMPORTANT: Write ALL text fields (reasons, contextNotes, sharingPatterns, techniqueExplanations, shareCardBullets) in ${request.language}. The JSON keys must remain in English, but all values should be in ${request.language}.` : ""}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract text from response
    const content = response.content[0];
    if (content.type !== "text") {
      return null;
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      adjustedScore: Math.min(100, Math.max(0, parsed.adjustedScore)),
      reasons: parsed.reasons || [],
      contextNotes: parsed.contextNotes,
      sharingPatterns: parsed.sharingPatterns || [],
      techniqueExplanations: parsed.techniqueExplanations || [],
      shareCardSummary: parsed.shareCardSummary,
      shareCardBullets: parsed.shareCardBullets || [],
      topic: parsed.topic || undefined,
      contentType: parsed.contentType || undefined,
      sourceType: parsed.sourceType || undefined,
    };
  } catch (error) {
    console.error("LLM analysis failed:", error);
    return null;
  }
}

export function isLLMAvailable(): boolean {
  return client !== null;
}

export interface ImageAnalysisResult {
  success: boolean;
  error?: string;
  extractedText?: string;
  platform?: string;
  score?: number;
  label?: "Low" | "Medium" | "High";
  signalBreakdown?: SignalBreakdown;
  reasons?: string[];
  highlights?: Highlight[];
  sharingPatterns?: string[];
  techniqueExplanations?: string[];
  shareCardSummary?: string;
  shareCardBullets?: string[];
}

const IMAGE_ANALYSIS_PROMPT = `You are analyzing an image for outrage bait and manipulation patterns. This could be:
- A screenshot of a social media post (Twitter/X, Facebook, Instagram, TikTok, Reddit, etc.)
- A meme with text overlay
- A news headline or article screenshot
- Any image containing text meant to provoke emotional reactions

Your task is to:
1. EXTRACT all visible text from the image (post content, meme text, headlines, usernames, comments, etc.)
2. IDENTIFY the type: social media platform name, "meme", "news", or "unknown"
3. ANALYZE the content for outrage bait and manipulation patterns - consider how the TEXT and IMAGE work TOGETHER. A meme's manipulation often comes from the combination (e.g., unflattering photo + inflammatory caption, or image that adds context making text more provocative)

IMPORTANT: If the image has NO readable text or is just a photo without any text overlay, you MUST still respond with valid JSON. Set extractedText to describe what you see, platform to "no_text_content", score to 0, and reasons explaining there is no text to analyze.

Key patterns to detect:
- **Loaded Language**: Emotionally charged words meant to provoke
- **Us-vs-Them Framing**: Creating in-group/out-group divisions
- **Threat/Panic Framing**: Fear-mongering, catastrophizing
- **Absolutist Language**: "Always", "never", "everyone knows"
- **Engagement Bait**: Clickbait phrases, calls to share

IMPORTANT: You are detecting MANIPULATION TACTICS, not political bias. Score the manipulation level regardless of the political viewpoint.

shareCardBullets format:
- 5-10 words each, concise but descriptive
- Describe the tactic or what makes the content good/bad
- For LOW scores (≤33): describe quality, e.g. "Quotes multiple sources directly"
- For MEDIUM/HIGH: describe manipulation, e.g. "Uses scary numbers to amplify threat"

Respond with this exact JSON structure:
{
  "extractedText": "<all visible text from the image>",
  "platform": "<detected platform>",
  "score": <number 0-100>,
  "signalBreakdown": {
    "arousal": <0-100>,
    "enemy_construction": <0-100>,
    "moral_condemnation": <0-100>,
    "simplification": <0-100>,
    "call_to_conflict": <0-100>
  },
  "reasons": [<3-5 bullet points explaining the score>],
  "highlights": [{"text": "<phrase>", "category": "<category>"}],
  "sharingPatterns": [<2-3 reasons why people share this>],
  "techniqueExplanations": [<2-3 things to notice about how it's written>],
  "shareCardBullets": [<2-3 NOUN PHRASES, 3-7 words each, NO VERBS>]
}`;

export async function analyzeImageWithVision(
  imageBase64: string,
  language?: string
): Promise<ImageAnalysisResult> {
  if (!client) {
    return { success: false, error: "LLM not available" };
  }

  // Extract media type and base64 data from data URL (more flexible regex)
  const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+-]+)(?:;[^;,]+)*;base64,(.+)$/);
  if (!match) {
    console.error("Image format regex failed. Prefix:", imageBase64.substring(0, 50));
    return { success: false, error: "Invalid image format - could not parse data URL" };
  }

  let mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const base64Data = match[2];

  // Normalize media type (some browsers use image/jpg)
  if (mediaType === "image/jpg" as string) {
    mediaType = "image/jpeg";
  }

  // Validate media type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(mediaType)) {
    console.error("Unsupported image type:", mediaType);
    return { success: false, error: `Unsupported image type: ${mediaType}` };
  }

  // Validate base64 data exists and isn't too short
  if (!base64Data || base64Data.length < 100) {
    console.error("Base64 data too short or missing");
    return { success: false, error: "Image data is invalid or empty" };
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: "Analyze this social media screenshot for outrage bait patterns. " + IMAGE_ANALYSIS_PROMPT + (language ? `\n\nIMPORTANT: Write ALL text fields (extractedText can stay as-is from the image, but reasons, sharingPatterns, techniqueExplanations, shareCardBullets) in ${language}. The JSON keys must remain in English, but all values should be in ${language}.` : ""),
            },
          ],
        },
      ],
    });

    // Extract text from response
    const content = response.content[0];
    if (content.type !== "text") {
      console.error("Unexpected response type:", content.type);
      return { success: false, error: "Unexpected response format from AI" };
    }

    // Check if model declined to analyze (content policy)
    const responseText = content.text.toLowerCase();
    if (
      responseText.includes("i cannot") ||
      responseText.includes("i can't") ||
      responseText.includes("i'm unable") ||
      responseText.includes("i am unable") ||
      responseText.includes("not able to analyze") ||
      responseText.includes("cannot process") ||
      responseText.includes("inappropriate") ||
      (responseText.includes("sorry") && !responseText.includes("{"))
    ) {
      console.log("Model declined to analyze content:", content.text.substring(0, 200));
      return {
        success: false,
        error: "This content contains material that cannot be analyzed. Try a different image."
      };
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from response:", content.text.substring(0, 200));
      return { success: false, error: "Failed to parse AI analysis response" };
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw:", jsonMatch[0].substring(0, 200));
      return { success: false, error: "Invalid JSON in AI response" };
    }

    const score = Math.min(100, Math.max(0, parsed.score || 0));

    return {
      success: true,
      extractedText: parsed.extractedText || "",
      platform: parsed.platform || "unknown",
      score,
      label: score <= 33 ? "Low" : score <= 66 ? "Medium" : "High",
      signalBreakdown: {
        arousal: Math.min(100, Math.max(0, parsed.signalBreakdown?.arousal || 0)),
        enemy_construction: Math.min(100, Math.max(0, parsed.signalBreakdown?.enemy_construction || 0)),
        moral_condemnation: Math.min(100, Math.max(0, parsed.signalBreakdown?.moral_condemnation || 0)),
        simplification: Math.min(100, Math.max(0, parsed.signalBreakdown?.simplification || 0)),
        call_to_conflict: Math.min(100, Math.max(0, parsed.signalBreakdown?.call_to_conflict || 0)),
      },
      reasons: parsed.reasons || [],
      highlights: (parsed.highlights || []).map((h: { text: string; category: string }) => ({
        text: h.text,
        category: h.category as Highlight["category"],
        start: 0,
        end: h.text.length,
      })),
      sharingPatterns: parsed.sharingPatterns || [],
      techniqueExplanations: parsed.techniqueExplanations || [],
      shareCardSummary: parsed.shareCardSummary,
      shareCardBullets: parsed.shareCardBullets || [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Image analysis failed:", errorMessage, error);

    // Check for content policy errors from the API
    const lowerError = errorMessage.toLowerCase();
    if (
      lowerError.includes("content") ||
      lowerError.includes("policy") ||
      lowerError.includes("safety") ||
      lowerError.includes("harmful") ||
      lowerError.includes("inappropriate") ||
      lowerError.includes("violat")
    ) {
      return {
        success: false,
        error: "This content contains material that cannot be analyzed. Try a different image."
      };
    }

    return { success: false, error: `Analysis failed: ${errorMessage}` };
  }
}

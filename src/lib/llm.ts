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

Respond with this exact JSON structure:
{
  "adjustedScore": <number 0-100, adjust rule-based score based on context>,
  "reasons": [<3-5 concise bullet points explaining the score>],
  "contextNotes": "<optional: note if rule-based score was misleading due to context>",
  "sharingPatterns": [<2-3 reasons why content like this tends to spread, e.g. "Validates pre-existing fears about X", "Creates strong in-group identification", "Outrage drives more engagement than nuance">],
  "techniqueExplanations": [<2-3 specific manipulation techniques used, with brief explanations, e.g. "Fear appeal: Uses threat of harm to bypass rational evaluation", "Loaded framing: Describes neutral facts using emotionally charged language">],
  "shareCardSummary": "<ONE punchy 8-12 word sentence summarizing the manipulation verdict for social sharing, e.g. 'Uses fear framing to bypass critical thinking' or 'Straightforward reporting with minimal emotional spin'>"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
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
}

const IMAGE_ANALYSIS_PROMPT = `You are analyzing a screenshot of a social media post or article. Your task is to:

1. EXTRACT all visible text from the image (post content, username, comments, etc.)
2. IDENTIFY the platform (Twitter/X, Facebook, Instagram, TikTok, Reddit, Threads, Bluesky, news article, or "unknown")
3. ANALYZE the content for outrage bait and manipulation patterns

Key patterns to detect:
- **Loaded Language**: Emotionally charged words meant to provoke
- **Us-vs-Them Framing**: Creating in-group/out-group divisions
- **Threat/Panic Framing**: Fear-mongering, catastrophizing
- **Absolutist Language**: "Always", "never", "everyone knows"
- **Engagement Bait**: Clickbait phrases, calls to share

IMPORTANT: You are detecting MANIPULATION TACTICS, not political bias. Score the manipulation level regardless of the political viewpoint.

Respond with this exact JSON structure:
{
  "extractedText": "<all visible text from the image>",
  "platform": "<detected platform>",
  "score": <number 0-100, where 0=neutral/informative, 100=extreme outrage bait>,
  "signalBreakdown": {
    "arousal": <0-100>,
    "enemy_construction": <0-100>,
    "moral_condemnation": <0-100>,
    "simplification": <0-100>,
    "call_to_conflict": <0-100>
  },
  "reasons": [<3-5 concise bullet points explaining the score>],
  "highlights": [{"text": "<problematic phrase>", "category": "<signal category>"}],
  "sharingPatterns": [<2-3 reasons why this content spreads>],
  "techniqueExplanations": [<2-3 specific manipulation techniques used>],
  "shareCardSummary": "<ONE punchy 8-12 word sentence summarizing the verdict for social sharing>"
}`;

export async function analyzeImageWithVision(
  imageBase64: string
): Promise<ImageAnalysisResult> {
  if (!client) {
    return { success: false, error: "LLM not available" };
  }

  // Extract media type and base64 data from data URL
  const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return { success: false, error: "Invalid image format" };
  }

  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const base64Data = match[2];

  // Validate media type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(mediaType)) {
    return { success: false, error: "Unsupported image type" };
  }

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
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
              text: "Analyze this social media screenshot for outrage bait patterns. " + IMAGE_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text from response
    const content = response.content[0];
    if (content.type !== "text") {
      return { success: false, error: "Unexpected response format" };
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Failed to parse analysis" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
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
    };
  } catch (error) {
    console.error("Image analysis failed:", error);
    return { success: false, error: "Failed to analyze image" };
  }
}

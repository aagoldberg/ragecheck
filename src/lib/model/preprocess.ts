// Text preprocessing utilities for ragebait analysis

import { PreprocessedText } from "./types";

/**
 * Split text into sentences
 */
export function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences.length > 0 ? sentences : [text];
}

/**
 * Tokenize text into words
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Calculate ratio of ALL CAPS words (3+ chars) to total words
 */
export function calculateCapsRatio(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length >= 3);
  if (words.length === 0) return 0;

  const capsWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w));
  return capsWords.length / words.length;
}

/**
 * Count specific punctuation marks
 */
export function countPunctuation(text: string): {
  exclamations: number;
  questions: number;
  intensity: number;
} {
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;

  // Intensity: multiple punctuation in a row (!!, ?!, etc.)
  const multiPunct = (text.match(/[!?]{2,}/g) || []).length;
  const intensity = exclamations + questions + (multiPunct * 2);

  return { exclamations, questions, intensity };
}

// Max text length for analysis (prevents crashes on very long articles)
const MAX_TEXT_LENGTH = 15000; // ~2,500 words - keeps analysis fast

/**
 * Full preprocessing pipeline
 */
export function preprocess(text: string): PreprocessedText {
  // Truncate very long text to prevent performance issues
  const truncatedText = text.length > MAX_TEXT_LENGTH
    ? text.substring(0, MAX_TEXT_LENGTH)
    : text;

  const sentences = splitSentences(truncatedText);
  const tokens = tokenize(truncatedText);
  const capsRatio = calculateCapsRatio(truncatedText);
  const punct = countPunctuation(truncatedText);

  return {
    original: truncatedText,
    lowercase: truncatedText.toLowerCase(),
    sentences,
    tokens,
    wordCount: tokens.length,
    capsRatio,
    exclamationCount: punct.exclamations,
    questionCount: punct.questions,
    punctuationIntensity: punct.intensity,
  };
}

/**
 * Find all matches of patterns in text, returning matched strings
 */
export function findPatternMatches(
  text: string,
  patterns: (string | RegExp)[]
): string[] {
  const matches: string[] = [];
  const lowerText = text.toLowerCase();

  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      const lowerPattern = pattern.toLowerCase();
      let idx = 0;
      let matchCount = 0;
      const maxMatches = 20; // Limit matches per pattern to prevent slowdown

      while ((idx = lowerText.indexOf(lowerPattern, idx)) !== -1 && matchCount < maxMatches) {
        // Check word boundaries
        const before = idx === 0 ? " " : lowerText[idx - 1];
        const after = idx + lowerPattern.length >= lowerText.length
          ? " "
          : lowerText[idx + lowerPattern.length];

        if (/[\s\.,;:!?"'()\[\]{}<>\/\-]/.test(before) &&
            /[\s\.,;:!?"'()\[\]{}<>\/\-]/.test(after)) {
          matches.push(text.substring(idx, idx + lowerPattern.length));
          matchCount++;
        }
        idx += lowerPattern.length; // Skip past current match for efficiency
      }
    } else {
      // Use exec with limit for regex patterns
      const globalRegex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      let match;
      let matchCount = 0;
      const maxMatches = 20;

      while ((match = globalRegex.exec(text)) !== null && matchCount < maxMatches) {
        matches.push(match[0]);
        matchCount++;
      }
    }
  }

  return [...new Set(matches)]; // Dedupe
}

/**
 * Count pattern matches in text
 */
export function countPatternMatches(
  text: string,
  patterns: (string | RegExp)[]
): number {
  return findPatternMatches(text, patterns).length;
}

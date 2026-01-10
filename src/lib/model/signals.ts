// Individual signal detection modules
// Each signal returns a 0-1 score and evidence

import { SignalResult, PreprocessedText } from "./types";
import { findPatternMatches } from "./preprocess";
import * as lexicons from "./lexicons";

// Helper: score based on both absolute count and density
// More aggressive thresholds since ragebait typically uses multiple tactics
function scoreMatches(matches: string[], wordCount: number, countThreshold: number = 1): number {
  if (matches.length === 0) return 0;
  // Count-based: more aggressive scoring
  // 1 match = 0.7, 2 matches = 0.9, 3+ = 1.0
  const countScore = matches.length >= countThreshold + 2 ? 1.0 :
                     matches.length >= countThreshold + 1 ? 0.9 :
                     matches.length >= countThreshold ? 0.7 : 0;
  // Density-based for longer texts (higher multiplier for short ragebait)
  const density = matches.length / Math.max(wordCount, 1);
  const densityScore = Math.min(1, density * 50);
  return Math.max(countScore, densityScore);
}

// ============================================
// AROUSAL SIGNALS
// ============================================

export function detectEmotionLexicon(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.EMOTION_ANGER_FEAR_DISGUST);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectUrgencyWords(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.URGENCY_WORDS);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectPunctuationIntensity(prep: PreprocessedText): SignalResult {
  // Strong scoring for caps and exclamation abuse
  let score01 = 0;
  const evidence: string[] = [];

  // Caps ratio: >20% all caps is high
  if (prep.capsRatio > 0.3) {
    score01 = Math.max(score01, 1.0);
    evidence.push(`${Math.round(prep.capsRatio * 100)}% ALL CAPS`);
  } else if (prep.capsRatio > 0.15) {
    score01 = Math.max(score01, 0.7);
    evidence.push(`${Math.round(prep.capsRatio * 100)}% ALL CAPS`);
  } else if (prep.capsRatio > 0.05) {
    score01 = Math.max(score01, 0.4);
    evidence.push(`${Math.round(prep.capsRatio * 100)}% ALL CAPS`);
  }

  // Exclamation marks
  if (prep.exclamationCount >= 3) {
    score01 = Math.max(score01, 0.8);
    evidence.push(`${prep.exclamationCount} exclamation marks`);
  } else if (prep.exclamationCount >= 2) {
    score01 = Math.max(score01, 0.5);
    evidence.push(`${prep.exclamationCount} exclamation marks`);
  } else if (prep.exclamationCount >= 1) {
    score01 = Math.max(score01, 0.3);
  }

  // Multiple question marks
  if (prep.questionCount >= 3) {
    score01 = Math.max(score01, 0.6);
    evidence.push(`${prep.questionCount} question marks`);
  }

  return {
    score01,
    evidence,
    debug: { capsRatio: prep.capsRatio, exclamations: prep.exclamationCount },
  };
}

export function detectIntensifiers(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.INTENSIFIERS);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

// ============================================
// ENEMY CONSTRUCTION SIGNALS
// ============================================

export function detectGroupGeneralizations(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.GROUP_GENERALIZATIONS);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectMaliciousIntent(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.MALICIOUS_INTENT_PATTERNS);
  // Any match is significant for this signal
  const score01 = matches.length >= 2 ? 1.0 : matches.length >= 1 ? 0.6 : 0;

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectDehumanization(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.DEHUMANIZATION_TERMS);
  // Dehumanization is very serious - any match is high
  const score01 = matches.length >= 2 ? 1.0 : matches.length >= 1 ? 0.7 : 0;

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectScapegoating(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.SCAPEGOAT_PATTERNS);
  const score01 = matches.length >= 2 ? 1.0 : matches.length >= 1 ? 0.6 : 0;

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

// ============================================
// MORAL CONDEMNATION SIGNALS
// ============================================

export function detectMoralJudgment(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.MORAL_JUDGMENT_TERMS);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectPurityContamination(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.PURITY_CONTAMINATION);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectBetrayalFraming(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.BETRAYAL_FRAMING);
  const score01 = matches.length >= 2 ? 1.0 : matches.length >= 1 ? 0.5 : 0;

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

// ============================================
// SIMPLIFICATION SIGNALS
// ============================================

export function detectAbsolutistTerms(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.ABSOLUTIST_TERMS);
  const score01 = scoreMatches(matches, prep.wordCount, 3);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectFalseDilemma(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.FALSE_DILEMMA_PATTERNS);
  const score01 = matches.length >= 2 ? 1.0 : matches.length >= 1 ? 0.6 : 0;

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectCausalOversimplification(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.CAUSAL_OVERSIMPLIFICATION);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectRepetition(prep: PreprocessedText): SignalResult {
  const words = prep.tokens;
  const trigrams: Map<string, number> = new Map();

  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1);
  }

  const repeated = [...trigrams.entries()]
    .filter(([_, count]) => count > 1)
    .map(([phrase, count]) => `"${phrase}" (${count}x)`);

  const score01 = repeated.length >= 2 ? 0.8 : repeated.length >= 1 ? 0.4 : 0;

  return {
    score01,
    evidence: repeated.slice(0, 3),
    debug: { repeatedCount: repeated.length },
  };
}

// ============================================
// CALL-TO-CONFLICT SIGNALS
// ============================================

export function detectReplyBait(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.REPLY_BAIT_TEMPLATES);
  // Reply bait templates are very specific - any match is significant
  const score01 = matches.length >= 3 ? 1.0 : matches.length >= 2 ? 0.8 : matches.length >= 1 ? 0.5 : 0;

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectRhetoricalQuestionDensity(prep: PreprocessedText): SignalResult {
  const questions = prep.sentences.filter(s => s.trim().endsWith("?"));
  const rhetoricalPatterns = [
    /^(how|why|what|when|where|who) (is|are|can|could|do|does|did|would|should)/i,
    /^(can you|do you|would you|should we)/i,
    /isn't it|aren't they|don't you|can't we/i,
  ];

  const rhetorical = questions.filter(q =>
    rhetoricalPatterns.some(p => p.test(q))
  );

  const score01 = rhetorical.length >= 2 ? 0.8 : rhetorical.length >= 1 ? 0.4 : 0;

  return {
    score01,
    evidence: rhetorical.slice(0, 3),
    debug: { rhetoricalCount: rhetorical.length, totalQuestions: questions.length },
  };
}

export function detectSecondPersonProvocation(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.SECOND_PERSON_PROVOCATION);
  const score01 = matches.length >= 2 ? 1.0 : matches.length >= 1 ? 0.6 : 0;

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

// ============================================
// MODIFIER SIGNALS
// ============================================

export function detectAttributionVerbs(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.ATTRIBUTION_VERBS);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectHedging(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.HEDGING_TERMS);
  const score01 = scoreMatches(matches, prep.wordCount, 2);

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectMultiPerspective(prep: PreprocessedText): SignalResult {
  const matches = findPatternMatches(prep.original, lexicons.MULTI_PERSPECTIVE_MARKERS);
  const score01 = matches.length >= 2 ? 0.8 : matches.length >= 1 ? 0.4 : 0;

  return {
    score01,
    evidence: matches.slice(0, 5),
    debug: { matchCount: matches.length },
  };
}

export function detectQuotations(prep: PreprocessedText): SignalResult {
  const quotes = prep.original.match(/"[^"]+"/g) || [];
  const score01 = quotes.length >= 3 ? 0.8 : quotes.length >= 2 ? 0.5 : quotes.length >= 1 ? 0.3 : 0;

  return {
    score01,
    evidence: quotes.slice(0, 3).map(q => q.length > 50 ? q.slice(0, 47) + "..." : q),
    debug: { quoteCount: quotes.length },
  };
}

export function detectInformationDensity(prep: PreprocessedText): SignalResult {
  const namedEntities: string[] = [];
  for (const sentence of prep.sentences) {
    const words = sentence.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      if (/^[A-Z][a-z]+/.test(words[i])) {
        namedEntities.push(words[i]);
      }
    }
  }

  const numbers = prep.original.match(/\d+\.?\d*%?/g) || [];
  const links = prep.original.match(/https?:\/\/\S+|www\.\S+/g) || [];

  // Count-based scoring
  const entityScore = namedEntities.length >= 3 ? 0.4 : namedEntities.length >= 1 ? 0.2 : 0;
  const numberScore = numbers.length >= 3 ? 0.4 : numbers.length >= 1 ? 0.2 : 0;
  const linkScore = links.length >= 1 ? 0.2 : 0;

  const score01 = Math.min(1, entityScore + numberScore + linkScore);

  const evidence: string[] = [];
  if (namedEntities.length > 0) evidence.push(`${namedEntities.length} named entities`);
  if (numbers.length > 0) evidence.push(`${numbers.length} numbers/stats`);
  if (links.length > 0) evidence.push(`${links.length} links`);

  return {
    score01,
    evidence,
    debug: { namedEntities: namedEntities.length, numbers: numbers.length, links: links.length },
  };
}

export function detectAnalyticStructure(prep: PreprocessedText): SignalResult {
  const sentenceCount = prep.sentences.length;
  const avgSentenceLength = prep.wordCount / Math.max(sentenceCount, 1);

  // Score based on structure
  let score01 = 0;
  if (sentenceCount >= 5 && avgSentenceLength >= 15) {
    score01 = 0.8;
  } else if (sentenceCount >= 3 && avgSentenceLength >= 12) {
    score01 = 0.5;
  } else if (sentenceCount >= 2) {
    score01 = 0.2;
  }

  const evidence: string[] = [];
  if (sentenceCount > 3) evidence.push(`${sentenceCount} sentences`);
  if (avgSentenceLength > 15) evidence.push(`avg ${Math.round(avgSentenceLength)} words/sentence`);

  return {
    score01,
    evidence,
    debug: { sentenceCount, avgSentenceLength },
  };
}

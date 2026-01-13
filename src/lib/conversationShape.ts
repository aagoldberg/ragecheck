/**
 * Conversation Shape Detection
 *
 * Maps detected techniques and triggers to a canonical conversation shape label.
 * Uses outcome-focused, neutral language - like a weather report.
 */

export type ConversationShapeLabel =
  | "splits_sides"
  | "invites_pileon"
  | "endless_arguing"
  | "rewards_stance"
  | "spreads_burns"
  | "stays_informational";

export interface ConversationShape {
  label: ConversationShapeLabel;
  displayLabel: string;
  explanation: string;
  microSignals: string[];
}

// Canonical labels with their display text
const SHAPE_LABELS: Record<ConversationShapeLabel, string> = {
  splits_sides: "This splits people into sides",
  invites_pileon: "This invites a pile-on",
  endless_arguing: "This turns into endless arguing",
  rewards_stance: "This rewards taking a strong stance",
  spreads_burns: "This spreads fast, then burns out",
  stays_informational: "This stays mostly informational",
};

const SHAPE_EXPLANATIONS: Record<ConversationShapeLabel, string> = {
  splits_sides:
    "People tend to pick a team and dig in. Each side talks mostly to itself.",
  invites_pileon:
    "There's a clear target, and criticism tends to snowball fast.",
  endless_arguing:
    "Comments go in circles. People talk past each other without anyone changing their mind.",
  rewards_stance:
    "The strongest takes get the most attention, whether or not they're right.",
  spreads_burns:
    "Gets shared a lot at first, then fades once the emotional charge wears off.",
  stays_informational:
    "Replies tend to stay on topic and focus on the actual facts.",
};

interface SignalBreakdown {
  arousal: number;
  enemy_construction: number;
  moral_condemnation: number;
  simplification: number;
  call_to_conflict: number;
}

interface DetectionInput {
  signalBreakdown: SignalBreakdown;
  techniqueExplanations?: string[];
  sharingPatterns?: string[];
  score?: number;
}

/**
 * Detect conversation shape from analysis signals
 *
 * Priority order:
 * 1. High enemy construction + moral condemnation → splits_sides
 * 2. High call to conflict + enemy construction → invites_pileon
 * 3. High simplification + moderate arousal → endless_arguing
 * 4. High moral condemnation + moderate conflict → rewards_stance
 * 5. High arousal + low evidence patterns → spreads_burns
 * 6. Low overall signals → stays_informational
 */
export function detectConversationShape(input: DetectionInput): ConversationShape {
  const { signalBreakdown, techniqueExplanations = [], sharingPatterns = [], score = 0 } = input;
  const techniques = techniqueExplanations.join(" ").toLowerCase();
  const patterns = sharingPatterns.join(" ").toLowerCase();
  const combined = techniques + " " + patterns;

  // Helper to check for keywords
  const hasKeyword = (keywords: string[]) =>
    keywords.some((k) => combined.includes(k.toLowerCase()));

  // Calculate composite scores
  const threatIdentityScore =
    signalBreakdown.enemy_construction * 0.4 +
    signalBreakdown.moral_condemnation * 0.4 +
    signalBreakdown.arousal * 0.2;

  const pileonScore =
    signalBreakdown.call_to_conflict * 0.5 +
    signalBreakdown.enemy_construction * 0.3 +
    signalBreakdown.moral_condemnation * 0.2;

  const arguingScore =
    signalBreakdown.simplification * 0.4 +
    signalBreakdown.moral_condemnation * 0.3 +
    signalBreakdown.arousal * 0.3;

  const stanceScore =
    signalBreakdown.moral_condemnation * 0.5 +
    signalBreakdown.enemy_construction * 0.3 +
    signalBreakdown.call_to_conflict * 0.2;

  const viralBurnScore =
    signalBreakdown.arousal * 0.5 +
    signalBreakdown.call_to_conflict * 0.3 +
    signalBreakdown.simplification * 0.2;

  // Build micro-signals based on what's detected
  const buildMicroSignals = (shape: ConversationShapeLabel): string[] => {
    const signals: string[] = [];

    if (shape === "splits_sides") {
      if (signalBreakdown.enemy_construction >= 40)
        signals.push("Sets up an 'us vs them'");
      if (signalBreakdown.moral_condemnation >= 40)
        signals.push("Makes it feel like a moral issue");
      if (signalBreakdown.arousal >= 50 || hasKeyword(["threat", "fear", "danger"]))
        signals.push("Plays up a sense of threat");
      if (hasKeyword(["identity", "group", "tribe", "real"]))
        signals.push("Ties into group identity");
    }

    if (shape === "invites_pileon") {
      if (signalBreakdown.call_to_conflict >= 40)
        signals.push("Points at someone to criticize");
      if (hasKeyword(["outrage", "unacceptable", "disgrace"]))
        signals.push("Frames it as outrageous");
      if (signalBreakdown.enemy_construction >= 40)
        signals.push("Paints a clear villain");
      if (hasKeyword(["punish", "accountable", "consequences"]))
        signals.push("Hints that 'something should be done'");
    }

    if (shape === "endless_arguing") {
      if (signalBreakdown.simplification >= 40)
        signals.push("Flattens a complex issue");
      if (hasKeyword(["status", "signal", "virtue"]))
        signals.push("Rewards strong opinions over nuance");
      if (signalBreakdown.moral_condemnation >= 30)
        signals.push("Turns it into a right-vs-wrong debate");
    }

    if (shape === "rewards_stance") {
      if (signalBreakdown.moral_condemnation >= 50)
        signals.push("Rewards being sure of yourself");
      if (hasKeyword(["identity", "stand", "believe"]))
        signals.push("Makes your take feel like your identity");
      if (signalBreakdown.simplification >= 40)
        signals.push("Favors bold, simple positions");
    }

    if (shape === "spreads_burns") {
      if (signalBreakdown.arousal >= 60)
        signals.push("High emotional charge");
      if (hasKeyword(["urgent", "breaking", "just in"]))
        signals.push("Feels urgent to share now");
      if (hasKeyword(["fear", "shocking", "unbelievable"]))
        signals.push("Novelty grabs attention");
    }

    if (shape === "stays_informational") {
      if (signalBreakdown.arousal < 30)
        signals.push("Low emotional heat");
      if (signalBreakdown.simplification < 30)
        signals.push("Keeps the nuance intact");
      if (score !== undefined && score < 35)
        signals.push("Not trying hard to persuade");
    }

    // Return top 3 signals
    return signals.slice(0, 3);
  };

  // Decision logic - check in priority order
  let selectedShape: ConversationShapeLabel;

  // Check for low overall signals first (informational)
  if (
    score < 30 &&
    signalBreakdown.arousal < 30 &&
    signalBreakdown.enemy_construction < 25 &&
    signalBreakdown.call_to_conflict < 25
  ) {
    selectedShape = "stays_informational";
  }
  // High enemy construction + moral condemnation → splits sides
  else if (
    threatIdentityScore >= 50 &&
    signalBreakdown.enemy_construction >= 35 &&
    signalBreakdown.moral_condemnation >= 30
  ) {
    selectedShape = "splits_sides";
  }
  // High call to conflict + enemy construction → pile-on
  else if (
    pileonScore >= 50 &&
    signalBreakdown.call_to_conflict >= 40 &&
    (hasKeyword(["punish", "accountable", "villain", "disgrace"]) ||
      signalBreakdown.enemy_construction >= 40)
  ) {
    selectedShape = "invites_pileon";
  }
  // High arousal + urgency keywords → spreads fast, burns out
  else if (
    viralBurnScore >= 55 &&
    signalBreakdown.arousal >= 50 &&
    (hasKeyword(["urgent", "breaking", "fear", "shocking"]) ||
      signalBreakdown.simplification >= 40)
  ) {
    selectedShape = "spreads_burns";
  }
  // High moral condemnation + identity → rewards stance
  else if (
    stanceScore >= 45 &&
    signalBreakdown.moral_condemnation >= 40 &&
    (hasKeyword(["identity", "stand", "believe", "values"]) ||
      signalBreakdown.enemy_construction >= 30)
  ) {
    selectedShape = "rewards_stance";
  }
  // Moderate signals with simplification → endless arguing
  else if (
    arguingScore >= 40 &&
    signalBreakdown.simplification >= 35 &&
    score >= 30
  ) {
    selectedShape = "endless_arguing";
  }
  // High arousal without clear pattern → spreads fast
  else if (viralBurnScore >= 45 && signalBreakdown.arousal >= 45) {
    selectedShape = "spreads_burns";
  }
  // Default based on highest composite
  else {
    const scores = [
      { shape: "splits_sides" as const, score: threatIdentityScore },
      { shape: "invites_pileon" as const, score: pileonScore },
      { shape: "endless_arguing" as const, score: arguingScore },
      { shape: "rewards_stance" as const, score: stanceScore },
      { shape: "spreads_burns" as const, score: viralBurnScore },
    ];

    const highest = scores.reduce((a, b) => (a.score > b.score ? a : b));

    if (highest.score >= 35) {
      selectedShape = highest.shape;
    } else {
      selectedShape = "stays_informational";
    }
  }

  return {
    label: selectedShape,
    displayLabel: SHAPE_LABELS[selectedShape],
    explanation: SHAPE_EXPLANATIONS[selectedShape],
    microSignals: buildMicroSignals(selectedShape),
  };
}

/**
 * Get structured output for API
 */
export function getConversationShapeJSON(shape: ConversationShape) {
  return {
    conversation_shape_label: shape.label,
    conversation_shape_display: shape.displayLabel,
    conversation_shape_explanation: shape.explanation,
    conversation_shape_signals: shape.microSignals,
  };
}

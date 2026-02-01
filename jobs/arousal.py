"""
SideLines Arousal Scorer (Python port)

Fast lexicon-based arousal scoring for social media posts.
Pure Python, no dependencies. Matches TypeScript output from src/lib/sidelines/arousal.ts.
"""

from __future__ import annotations

import re
from typing import Any

# =============================================================================
# LEXICONS (from src/lib/model/lexicons.ts)
# =============================================================================

EMOTION_ANGER_FEAR_DISGUST = [
    # Anger
    "furious", "enraged", "outraged", "livid", "seething", "infuriated",
    "incensed", "irate", "wrathful", "apoplectic", "angry", "rage", "raging",
    "hate", "hateful", "hatred", "despise", "loathe",
    "frustrated", "frustrating", "frustration", "annoyed", "annoying",
    "fed up", "sick of", "tired of", "had enough",
    # Fear
    "terrified", "terrifying", "horrified", "horrifying", "frightening",
    "alarming", "chilling", "nightmarish", "harrowing", "scary", "afraid",
    "dangerous", "threat", "threatening", "deadly", "worried", "concerning",
    # Disgust
    "disgusting", "disgusted", "revolting", "repulsive", "sickening",
    "nauseating", "vile", "loathsome", "repugnant", "abhorrent", "gross",
    "awful", "horrible", "horrendous", "appalling", "pathetic", "ridiculous",
    # Destruction/violence
    "destroy", "destroying", "destroyed", "destruction",
    "attack", "attacking", "attacked", "attacks",
    "war", "fight", "fighting", "battle",
]

URGENCY_WORDS = [
    "now", "immediately", "urgent", "urgently", "breaking", "just in",
    "shocking", "unacceptable", "unbelievable", "incredible", "outrageous",
    "must see", "must read", "must watch", "can't wait", "right now",
    "this just happened", "happening now", "developing",
    "act now", "before it's too late", "time is running out",
    "crisis", "emergency", "critical", "dire", "desperate",
    "spread the word", "share this", "share before",
]

INTENSIFIERS = [
    "literally", "absolutely", "completely", "totally", "utterly",
    "insane", "insanely", "crazy", "incredibly", "extremely",
    "unbelievably", "shockingly", "disgustingly", "horrifically",
    "massively", "hugely", "enormously", "monumentally",
]

MORAL_JUDGMENT_TERMS = [
    "evil", "wicked", "sinful", "immoral", "corrupt", "corrupted",
    "traitor", "traitors", "treason", "treasonous", "treachery",
    "disgrace", "disgraceful", "shameful", "shameless",
    "despicable", "deplorable", "reprehensible", "inexcusable",
    "unforgivable", "criminal", "criminals", "villains",
]

PURITY_CONTAMINATION = [
    "poison", "poisoning", "poisoned", "toxic", "toxicity",
    "infect", "infecting", "infected", "infection", "infectious",
    "rot", "rotting", "rotten", "decay", "decaying",
    "corrupt", "corrupting", "corrupted", "corruption",
    "pollute", "polluted", "polluting", "pollution", "contaminate", "contaminated",
    "taint", "tainted", "defile", "defiled", "desecrate",
    "filth", "filthy", "dirty", "unclean", "impure",
]

ABSOLUTIST_TERMS = [
    "always", "never", "everyone", "no one", "nobody",
    "everyone knows", "no one is talking about",
    "all of them", "none of them", "every single",
    "without exception", "in every case",
    "the only", "only way", "no other", "nothing else",
    "100%", "zero", "impossible", "guaranteed",
    "everything", "nothing", "entire", "complete",
    "forever", "won't stop", "can't stop", "don't stop",
    "totally", "completely", "absolutely", "entirely",
    "only choice", "no choice", "no alternative",
]

DEHUMANIZATION_TERMS = [
    "vermin", "rats", "roaches", "cockroaches", "parasites", "pests",
    "infestation", "plague", "disease", "cancer", "tumor",
    "animals", "beasts", "monsters", "demons", "devils",
    "scum", "filth", "trash", "garbage", "waste",
    "subhuman", "inhuman", "less than human",
    "slaves", "sheep", "sheeple", "zombies", "puppets",
    "brainwashed", "mindless", "idiots", "morons", "fools",
]

# Component weights (sum = 1.0)
WEIGHTS = {
    "emotion_anger_fear_disgust": 0.25,
    "urgency": 0.15,
    "intensifiers": 0.10,
    "moral_judgment": 0.15,
    "purity_contamination": 0.10,
    "dehumanization": 0.15,
    "absolutist": 0.10,
}

# Word boundary characters for pattern matching
_BOUNDARY_RE = re.compile(r'[\s.,;:!?"\'()\[\]{}<>/\-]')


# =============================================================================
# PREPROCESSING (from src/lib/model/preprocess.ts)
# =============================================================================


def tokenize(text: str) -> list[str]:
    """Tokenize text into words (matches TypeScript tokenize)."""
    lowered = text.lower()
    cleaned = re.sub(r"[^\w\s'\-]", " ", lowered)
    return [t for t in cleaned.split() if t]


def count_punctuation(text: str) -> dict[str, int]:
    """Count punctuation marks (matches TypeScript countPunctuation)."""
    exclamations = text.count("!")
    questions = text.count("?")
    multi_punct = len(re.findall(r"[!?]{2,}", text))
    intensity = exclamations + questions + (multi_punct * 2)
    return {
        "exclamations": exclamations,
        "questions": questions,
        "intensity": intensity,
    }


def find_pattern_matches(text: str, patterns: list[str]) -> list[str]:
    """
    Find all matches of patterns in text with word-boundary checking.
    Returns deduplicated list of matched strings.
    Matches TypeScript findPatternMatches for string patterns.
    """
    matches: list[str] = []
    seen: set[str] = set()
    lower_text = text.lower()
    max_matches = 20

    for pattern in patterns:
        lower_pattern = pattern.lower()
        idx = 0
        match_count = 0

        while match_count < max_matches:
            idx = lower_text.find(lower_pattern, idx)
            if idx == -1:
                break

            # Check word boundaries
            before = " " if idx == 0 else lower_text[idx - 1]
            end_idx = idx + len(lower_pattern)
            after = " " if end_idx >= len(lower_text) else lower_text[end_idx]

            if _BOUNDARY_RE.match(before) and _BOUNDARY_RE.match(after):
                matched = text[idx:end_idx]
                if matched not in seen:
                    matches.append(matched)
                    seen.add(matched)
                match_count += 1

            idx += len(lower_pattern)

    return matches


# =============================================================================
# SCORING (from src/lib/sidelines/arousal.ts)
# =============================================================================


def score_component(text: str, tokens: list[str], lexicon: list[str]) -> float:
    """Score a single component: proportion of matched tokens capped at 1.0."""
    matches = find_pattern_matches(text, lexicon)
    if not tokens:
        return 0.0

    match_count = len(matches)
    if match_count == 0:
        return 0.0
    if match_count == 1:
        return 0.3
    if match_count == 2:
        return 0.5
    if match_count == 3:
        return 0.7

    # Density-based for 4+ matches
    density = match_count / len(tokens)
    return min(1.0, 0.7 + density * 5)


def compute_arousal(text: str) -> dict[str, Any]:
    """
    Compute arousal score for a single text.
    Returns {"score": float, "breakdown": dict} matching TypeScript output.
    """
    if not text or not text.strip():
        return {
            "score": 0,
            "breakdown": {
                "emotionAngerFearDisgust": 0,
                "urgency": 0,
                "intensifiers": 0,
                "moralJudgment": 0,
                "purityContamination": 0,
                "dehumanization": 0,
                "absolutist": 0,
            },
        }

    tokens = tokenize(text)
    punct = count_punctuation(text)

    breakdown = {
        "emotionAngerFearDisgust": score_component(text, tokens, EMOTION_ANGER_FEAR_DISGUST),
        "urgency": score_component(text, tokens, URGENCY_WORDS),
        "intensifiers": score_component(text, tokens, INTENSIFIERS),
        "moralJudgment": score_component(text, tokens, MORAL_JUDGMENT_TERMS),
        "purityContamination": score_component(text, tokens, PURITY_CONTAMINATION),
        "dehumanization": score_component(text, tokens, DEHUMANIZATION_TERMS),
        "absolutist": score_component(text, tokens, ABSOLUTIST_TERMS),
    }

    # Weighted sum
    score = (
        breakdown["emotionAngerFearDisgust"] * WEIGHTS["emotion_anger_fear_disgust"]
        + breakdown["urgency"] * WEIGHTS["urgency"]
        + breakdown["intensifiers"] * WEIGHTS["intensifiers"]
        + breakdown["moralJudgment"] * WEIGHTS["moral_judgment"]
        + breakdown["purityContamination"] * WEIGHTS["purity_contamination"]
        + breakdown["dehumanization"] * WEIGHTS["dehumanization"]
        + breakdown["absolutist"] * WEIGHTS["absolutist"]
    )

    # Punctuation boost: heavy exclamation/ALL CAPS adds up to 0.1
    punct_boost = min(0.1, punct["intensity"] * 0.01)
    score = min(1.0, score + punct_boost)

    # ALL CAPS boost
    words = [w for w in text.split() if len(w) >= 3]
    caps_words = [w for w in words if w == w.upper() and re.search(r"[A-Z]", w)]
    if words:
        caps_ratio = len(caps_words) / len(words)
        if caps_ratio > 0.3:
            score = min(1.0, score + 0.05)

    return {
        "score": round(score * 10000) / 10000,
        "breakdown": breakdown,
    }

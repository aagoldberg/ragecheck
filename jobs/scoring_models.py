"""
Transformer-based scoring models for post analysis.

Loads 3 ONNX models at import time:
  1. Emotion detection (j-hartmann/emotion-english-distilroberta-base)
  2. Toxicity detection (unitary/toxic-bert)
  3. Irony detection (cardiffnlp/twitter-roberta-base-irony)

Provides batch scoring via score_batch(texts) -> list[dict].
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import numpy as np

log = logging.getLogger(__name__)

MODELS_DIR = os.environ.get("MODELS_DIR", "/app/models")

# Russell's circumplex arousal weights
AROUSAL_WEIGHTS = {
    "anger": 0.95,
    "disgust": 0.60,
    "fear": 0.85,
    "joy": 0.70,
    "neutral": 0.05,
    "sadness": 0.20,
    "surprise": 0.80,
}

# Module-level singletons
_emotion_session = None
_toxicity_session = None
_irony_session = None

_emotion_tokenizer = None
_toxicity_tokenizer = None
_irony_tokenizer = None

_emotion_labels: dict[int, str] = {}
_toxicity_labels: dict[int, str] = {}
_irony_labels: dict[int, str] = {}

MODELS_LOADED = False


def _load_model(name: str):
    """Load an ONNX model, its tokenizer, and label mapping."""
    import onnxruntime as ort
    from tokenizers import Tokenizer

    model_dir = os.path.join(MODELS_DIR, name)
    onnx_path = os.path.join(model_dir, "model.onnx")
    config_path = os.path.join(model_dir, "config.json")

    if not os.path.exists(onnx_path):
        raise FileNotFoundError(f"ONNX model not found: {onnx_path}")

    # Load ONNX session
    session = ort.InferenceSession(
        onnx_path,
        providers=["CPUExecutionProvider"],
    )

    # Load tokenizer - try tokenizer.json first (fast tokenizer), fall back
    tokenizer_json = os.path.join(model_dir, "tokenizer.json")
    if os.path.exists(tokenizer_json):
        tokenizer = Tokenizer.from_file(tokenizer_json)
    else:
        raise FileNotFoundError(f"tokenizer.json not found in {model_dir}")

    # Load id2label from config.json
    labels = {}
    if os.path.exists(config_path):
        with open(config_path) as f:
            config = json.load(f)
        id2label = config.get("id2label", {})
        labels = {int(k): v for k, v in id2label.items()}

    return session, tokenizer, labels


def _init_models():
    """Initialize all 3 models. Called once at module load."""
    global _emotion_session, _toxicity_session, _irony_session
    global _emotion_tokenizer, _toxicity_tokenizer, _irony_tokenizer
    global _emotion_labels, _toxicity_labels, _irony_labels
    global MODELS_LOADED

    try:
        log.info("Loading scoring models from %s...", MODELS_DIR)

        _emotion_session, _emotion_tokenizer, _emotion_labels = _load_model("emotion")
        log.info("  Emotion model loaded (%d labels)", len(_emotion_labels))

        _toxicity_session, _toxicity_tokenizer, _toxicity_labels = _load_model("toxicity")
        log.info("  Toxicity model loaded (%d labels)", len(_toxicity_labels))

        _irony_session, _irony_tokenizer, _irony_labels = _load_model("irony")
        log.info("  Irony model loaded (%d labels)", len(_irony_labels))

        MODELS_LOADED = True
        log.info("All scoring models loaded successfully")

    except Exception as e:
        log.warning("Scoring models not available: %s", e)
        MODELS_LOADED = False


def _softmax(logits: np.ndarray) -> np.ndarray:
    """Compute softmax along last axis."""
    exp = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    return exp / np.sum(exp, axis=-1, keepdims=True)


def _sigmoid(logits: np.ndarray) -> np.ndarray:
    """Compute sigmoid (for multi-label models like toxic-bert)."""
    return 1.0 / (1.0 + np.exp(-logits))


def _batch_tokenize(tokenizer, texts: list[str], max_length: int = 512) -> tuple[np.ndarray, np.ndarray]:
    """Batch tokenize texts and return padded input_ids + attention_mask."""
    tokenizer.enable_truncation(max_length=max_length)
    tokenizer.enable_padding(length=None)  # pad to longest in batch

    encodings = tokenizer.encode_batch(texts)

    input_ids = np.array([e.ids for e in encodings], dtype=np.int64)
    attention_mask = np.array([e.attention_mask for e in encodings], dtype=np.int64)

    return input_ids, attention_mask


def _run_emotion(texts: list[str]) -> list[dict[str, float]]:
    """Run emotion model on a batch of texts.

    Returns list of dicts mapping emotion label -> probability.
    """
    if not _emotion_session or not _emotion_tokenizer:
        return [{}] * len(texts)

    input_ids, attention_mask = _batch_tokenize(_emotion_tokenizer, texts)

    logits = _emotion_session.run(
        ["logits"],
        {"input_ids": input_ids, "attention_mask": attention_mask},
    )[0]

    probs = _softmax(logits)
    results = []
    for i in range(len(texts)):
        result = {}
        for j in range(probs.shape[1]):
            label = _emotion_labels.get(j, f"label_{j}")
            result[label] = round(float(probs[i, j]), 4)
        results.append(result)
    return results


def _run_toxicity(texts: list[str]) -> list[dict[str, float]]:
    """Run toxicity model on a batch of texts.

    Returns list of dicts mapping toxicity label -> probability.
    toxic-bert uses sigmoid (multi-label), not softmax.
    """
    if not _toxicity_session or not _toxicity_tokenizer:
        return [{}] * len(texts)

    input_ids, attention_mask = _batch_tokenize(_toxicity_tokenizer, texts)

    logits = _toxicity_session.run(
        ["logits"],
        {"input_ids": input_ids, "attention_mask": attention_mask},
    )[0]

    probs = _sigmoid(logits)
    results = []
    for i in range(len(texts)):
        result = {}
        for j in range(probs.shape[1]):
            label = _toxicity_labels.get(j, f"label_{j}")
            result[label] = round(float(probs[i, j]), 4)
        results.append(result)
    return results


def _run_irony(texts: list[str]) -> list[float]:
    """Run irony model on a batch of texts.

    Returns list of irony probabilities.
    """
    if not _irony_session or not _irony_tokenizer:
        return [0.0] * len(texts)

    input_ids, attention_mask = _batch_tokenize(_irony_tokenizer, texts)

    logits = _irony_session.run(
        ["logits"],
        {"input_ids": input_ids, "attention_mask": attention_mask},
    )[0]

    probs = _softmax(logits)

    # Find the irony label index
    irony_idx = None
    for idx, label in _irony_labels.items():
        if "irony" in label.lower() and "non" not in label.lower():
            irony_idx = idx
            break

    if irony_idx is None:
        # Fallback: assume last index is irony
        irony_idx = probs.shape[1] - 1

    return [round(float(probs[i, irony_idx]), 4) for i in range(len(texts))]


def _compute_arousal(emotions: dict[str, float]) -> float:
    """Compute arousal from emotion probabilities using Russell's circumplex model."""
    arousal = 0.0
    for label, weight in AROUSAL_WEIGHTS.items():
        arousal += emotions.get(label, 0.0) * weight
    return round(arousal, 4)


def _compute_valence(emotions: dict[str, float]) -> float:
    """Compute valence from emotion probabilities, normalized to 0-1."""
    raw = (
        emotions.get("joy", 0.0)
        + emotions.get("surprise", 0.0) * 0.5
        - emotions.get("anger", 0.0)
        - emotions.get("fear", 0.0)
        - emotions.get("disgust", 0.0)
        - emotions.get("sadness", 0.0) * 0.5
    )
    # raw ranges roughly from -1 to +1, normalize to 0-1
    normalized = (raw + 1.0) / 2.0
    return round(max(0.0, min(1.0, normalized)), 4)


def score_batch(texts: list[str]) -> list[dict[str, Any]]:
    """Score a batch of texts with all 3 models.

    Returns list of signal dicts, one per text. Each dict has:
      - arousal: float (0-1)
      - valence: float (0-1)
      - dominant_emotion: str
      - emotions: dict[str, float]
      - toxicity: dict with score, type, breakdown
      - irony: float (0-1)
    """
    if not MODELS_LOADED:
        raise RuntimeError("Scoring models not loaded")

    if not texts:
        return []

    # Run all 3 models
    emotion_results = _run_emotion(texts)
    toxicity_results = _run_toxicity(texts)
    irony_results = _run_irony(texts)

    signals = []
    for i in range(len(texts)):
        emotions = emotion_results[i]

        # Derive arousal and valence from emotions
        arousal = _compute_arousal(emotions)
        valence = _compute_valence(emotions)

        # Dominant emotion
        dominant_emotion = max(emotions, key=emotions.get) if emotions else "neutral"

        # Toxicity
        tox_breakdown = toxicity_results[i]
        tox_score = max(tox_breakdown.values()) if tox_breakdown else 0.0
        tox_type = max(tox_breakdown, key=tox_breakdown.get) if tox_breakdown else None
        # Only report type if above threshold
        if tox_score < 0.3:
            tox_type = None

        # Irony
        irony = irony_results[i]

        signals.append({
            "emotions": emotions,
            "arousal": arousal,
            "valence": valence,
            "dominant_emotion": dominant_emotion,
            "toxicity": {
                "score": round(tox_score, 4),
                "type": tox_type,
                "breakdown": tox_breakdown,
            },
            "irony": irony,
        })

    return signals


# Auto-initialize on import
_init_models()

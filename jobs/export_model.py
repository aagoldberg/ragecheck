"""
Export HuggingFace transformer models to ONNX format.

Run during Docker build stage only. Downloads 3 models, exports each to ONNX,
and saves tokenizer + config for runtime inference.

Usage:
    python export_model.py
"""

import json
import os
import shutil

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

MODELS = [
    ("j-hartmann/emotion-english-distilroberta-base", "emotion"),
    ("unitary/toxic-bert", "toxicity"),
    ("cardiffnlp/twitter-roberta-base-irony", "irony"),
]

OUTPUT_DIR = "/app/models"


def export_model(model_name: str, output_name: str) -> None:
    """Download a HuggingFace model and export to ONNX."""
    out_path = os.path.join(OUTPUT_DIR, output_name)
    os.makedirs(out_path, exist_ok=True)

    print(f"Downloading {model_name}...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    model.eval()

    # Save tokenizer files for runtime (tokenizers library can load these)
    tokenizer.save_pretrained(out_path)

    # Save config.json for id2label mapping
    config = model.config.to_dict()
    with open(os.path.join(out_path, "config.json"), "w") as f:
        json.dump(config, f, indent=2)

    # Create dummy input for ONNX export
    dummy_input = tokenizer(
        "This is a sample sentence for export.",
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=128,
    )

    input_names = ["input_ids", "attention_mask"]
    output_names = ["logits"]

    onnx_path = os.path.join(out_path, "model.onnx")
    print(f"Exporting {output_name} to ONNX...")

    torch.onnx.export(
        model,
        (dummy_input["input_ids"], dummy_input["attention_mask"]),
        onnx_path,
        input_names=input_names,
        output_names=output_names,
        dynamic_axes={
            "input_ids": {0: "batch", 1: "seq"},
            "attention_mask": {0: "batch", 1: "seq"},
            "logits": {0: "batch"},
        },
        opset_version=14,
        do_constant_folding=True,
    )

    # Verify export
    file_size = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"  {output_name}: {file_size:.1f} MB")

    # Clean up PyTorch model files (keep only ONNX + tokenizer + config)
    for fname in os.listdir(out_path):
        if fname in ("model.safetensors", "pytorch_model.bin", "model.bin"):
            os.remove(os.path.join(out_path, fname))


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for model_name, output_name in MODELS:
        export_model(model_name, output_name)

    print(f"\nAll models exported to {OUTPUT_DIR}/")
    for _, name in MODELS:
        model_dir = os.path.join(OUTPUT_DIR, name)
        files = os.listdir(model_dir)
        print(f"  {name}/: {', '.join(sorted(files))}")


if __name__ == "__main__":
    main()

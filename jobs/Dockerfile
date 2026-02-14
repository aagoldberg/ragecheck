# Stage 1: Export HuggingFace models to ONNX
FROM python:3.12-slim AS exporter

WORKDIR /app

RUN pip install --no-cache-dir \
    transformers torch --index-url https://download.pytorch.org/whl/cpu \
    onnx onnxruntime sentencepiece protobuf

COPY export_model.py .
RUN python export_model.py

# Stage 2: Runtime (lean — no PyTorch/transformers)
FROM python:3.12-slim

WORKDIR /app

# Install build deps for igraph/leidenalg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ cmake libxml2-dev zlib1g-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-models.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-models.txt

# Copy ONNX models from exporter stage
COPY --from=exporter /app/models /app/models

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.12-slim

WORKDIR /app

# Install build deps for igraph/leidenalg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ cmake libxml2-dev zlib1g-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

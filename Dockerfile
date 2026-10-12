# syntax=docker/dockerfile:1
# ==============================================================================
# BioPulse AI - Production Django Backend Dockerfile
# Optimized for Azure Container Apps Consumption (Python 3.11, Gunicorn, ML/OCR)
# ==============================================================================

FROM python:3.11-slim-bookworm

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend:/app:/app/machine-learning/PCOS-ML \
    PORT=8000

WORKDIR /app

# Install system dependencies for Tesseract OCR, OpenCV, OpenMP, and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pre-install CPU-only PyTorch and torchvision to avoid 1.5GB+ GPU CUDA bloat
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir "torch>=2.2.0" "torchvision>=0.17.0" --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
COPY backend/requirements.txt /app/backend-requirements.txt
RUN pip install --no-cache-dir -r /app/backend-requirements.txt

# Copy backend code and machine-learning models/pipelines
COPY backend /app/backend
COPY machine-learning /app/machine-learning

# Create unprivileged service user and ensure directory ownership
RUN useradd --create-home --shell /bin/bash appuser && \
    mkdir -p /app/backend/staticfiles /app/backend/media && \
    chmod +x /app/backend/docker-entrypoint.sh && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Container healthcheck against BioPulse API root health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/ || exit 1

# Execute startup entrypoint (runs migrations in /app/backend before launching Gunicorn)
ENTRYPOINT ["/app/backend/docker-entrypoint.sh"]


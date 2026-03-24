FROM python:3.11-slim

WORKDIR /app

# Dependències del sistema per a PaddleOCR (cv2, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY paddle_ocr_batch.py .

# Pre-descarregar els models PaddleOCR durant el build (no en runtime)
RUN PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True python3 -c \
    "from paddleocr import PaddleOCR; PaddleOCR(lang='es')" \
    2>/dev/null || true

ENTRYPOINT ["python3", "paddle_ocr_batch.py"]

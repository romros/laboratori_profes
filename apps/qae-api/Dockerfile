FROM node:22-alpine

# Tesseract CLI natiu + dades català i castellà
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-cat \
    tesseract-ocr-data-spa

WORKDIR /app

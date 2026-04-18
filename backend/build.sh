#!/bin/bash
set -e

# Install system dependencies (tesseract for OCR)
apt-get update && apt-get install -y tesseract-ocr 2>/dev/null || echo "[WARN] Could not install tesseract-ocr (may not have apt access)"

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
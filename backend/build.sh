#!/bin/bash

pip install -r requirements.txt
apt-get install -y tesseract-ocr 2>dev/null || true
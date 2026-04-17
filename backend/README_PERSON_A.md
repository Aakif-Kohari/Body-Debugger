# Body Debugger - Backend Setup Guide

## 🏗️ Project Structure

```
backend/
├── main.py                  # [A1] FastAPI entry point, CORS, router registration
├── requirements.txt         # Python dependencies
├── .env.example            # Template for environment variables
├── firebase_config.py      # Firebase Admin SDK initialization
│
├── routers/                # API endpoint handlers
│   ├── reports.py          # [A4, A8] Lab Report Translator & Health Records
│   ├── food.py             # [A5] Food Calorie Parser
│   ├── chat.py             # [A6] "Why did I feel like this" Chatbot
│   └── person_b_placeholders.py  # Person B's routers (stubs)
│
├── services/               # Business logic layer
│   ├── ocr_service.py      # [A2] PDF/Image OCR extraction
│   ├── gemini_service.py   # [A3] Gemini API integration
│   └── storage_service.py  # [A7] Firebase Storage operations
│
├── models/                 # Pydantic data models
│   ├── report.py           # Lab report & health record schemas
│   ├── food_log.py         # Food logging schemas
│   └── chat.py             # Chatbot request/response schemas
│
└── utils/                  # Utility functions (coming)
    ├── image_preprocessor.py
    └── date_helpers.py
```

---

## 🎯 Person A Tasks Overview

| # | Task | File | Status |
|---|------|------|--------|
| A1 | **Project Bootstrap** | main.py | ✅ Done |
| A2 | **OCR Service** | services/ocr_service.py | ✅ Done |
| A3 | **Gemini Service** | services/gemini_service.py | ✅ Done |
| A4 | **Lab Report Translator** | routers/reports.py | ✅ Done |
| A5 | **Food Calorie Parser** | routers/food.py | ✅ Done |
| A6 | **Chatbot** | routers/chat.py | ✅ Done |
| A7 | **Storage Service** | services/storage_service.py | ✅ Done |
| A8 | **Health Records API** | routers/reports.py | ✅ Done |
| A9 | **Integration Testing** | (manual testing) | 🔄 Next |

---

## 🚀 Quick Start for Person A

### 1. Setup Environment

**On Windows:**
```powershell
cd d:\Body-Debugger\backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# For Windows, install pytesseract (requires Tesseract-OCR system binary)
# Download installer: https://github.com/UB-Mannheim/tesseract/wiki/Downloads
# Then set the path in your script or system environment
```

**On Mac/Linux:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Tesseract (Ubuntu):
sudo apt-get install tesseract-ocr

# Install Tesseract (Mac):
brew install tesseract
```

### 2. Setup Firebase & API Keys

Create a `.env` file in `backend/`:

```
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket.appspot.com
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase_service_account.json
FCM_SERVER_KEY=your_fcm_server_key_here
DEBUG=True
```

**Getting the keys:**
- **Gemini API Key**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey), create a free API key
- **Firebase**: Create a project at [Firebase Console](https://console.firebase.google.com/)
  - Download service account JSON from Project Settings → Service Accounts
  - Get storage bucket from Project Settings
  - Get Cloud Messaging server key from Project Settings → Cloud Messaging tab

### 3. Run the Server

```powershell
python main.py
```

The server will start at `http://localhost:8000`

**API Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📋 What Each Service Does

### **OCR Service** (A2)
```python
from services.ocr_service import ocr_service

# Extract text from image
text = ocr_service.extract_text(image_bytes, "image")

# Extract text from PDF
text = ocr_service.extract_text(pdf_bytes, "pdf")
```

**Features:**
- Automatic image preprocessing (grayscale, contrast boost)
- Handles both images and PDFs
- Uses pytesseract for OCR, pdfplumber for PDFs
- Returns clean, extracted text ready for Gemini

---

### **Gemini Service** (A3)
```python
from services.gemini_service import gemini_service

# Analyze blood report
analysis = gemini_service.analyze_lab_report(raw_text)

# Parse food input
food = gemini_service.parse_food_input("2 rotis, dal, sabzi")

# Analyze symptom with context
result = gemini_service.analyze_symptom_with_context(
    symptom="headache",
    recent_sleep_hours=6
)
```

**Returns structured JSON** with:
- Lab reports: Parameters, values, ranges, meanings, risk flags
- Food: Items, calories, macros
- Chatbot: Probable causes, suggestions

---

### **Storage Service** (A7)
```python
from services.storage_service import storage_service

# Upload file
url = storage_service.upload_file(
    file_bytes=pdf_bytes,
    directory="users/uid/reports",
    filename="report_2024.pdf"
)

# Get public URL
public_url = storage_service.get_public_url(storage_path)

# Download file
data = storage_service.download_file(storage_path)

# Delete file
storage_service.delete_file(storage_path)
```

---

## 🔌 API Endpoints (Person A)

### Lab Report Translator (A4)
```
POST /api/reports/upload
- Input: file (PDF/Image)
- Output: Full analysis with parameters, doctor summary, recommendations
```

```
GET /api/reports/list
GET /api/reports/{report_id}
```

### Food Logger (A5)
```
POST /api/food/log
- Input: { "meal_description": "2 rotis dal sabzi", "meal_type": "lunch" }
- Output: Items, calories, macros
```

```
GET /api/food/today
GET /api/food/history/7
POST /api/food/estimate  (quick check without saving)
```

### Chatbot (A6)
```
POST /api/chat/symptom
- Input: { "symptom_or_mood": "I had a headache all afternoon" }
- Output: Conversational response with probable causes
```

```
POST /api/chat/quick-check  (no auth required)
GET /api/chat/history
```

### Health Records (A8)
```
POST /api/records/upload
- Input: file, record_type, label
- Output: Record URL and metadata
```

```
GET /api/records/list
DELETE /api/records/{record_id}
```

---

## ✅ Testing Checklist for A9

### 1. OCR Service Test
- [ ] Upload a PNG image of blood report → Check extracted text
- [ ] Upload a PDF blood report → Check extracted text
- [ ] Test with low-quality/angled images → Should still work

### 2. Gemini Service Test
- [ ] Test reportanalysis with real blood values → Check JSON structure
- [ ] Test food parsing with Indian meal descriptions
- [ ] Test symptom analysis with context

### 3. Lab Report Endpoint Test
```bash
# Using curl or Postman
POST http://localhost:8000/api/reports/upload
Body: form-data with file

# Check response has:
# - report_id
# - parameters[] with proper structure
# - summary_for_doctor
# - risk_flags are "green"/"yellow"/"red"
```

### 4. Food Logging Test
```bash
POST http://localhost:8000/api/food/log
Body: {
  "meal_description": "2 rotis, dal, 1 plate sabzi with ghee",
  "meal_type": "lunch"
}

# Check response has:
# - items[]
# - total_calories
# - total_protein, carbs, fat
```

### 5. Chatbot Test
```bash
POST http://localhost:8000/api/chat/symptom
Body: {
  "symptom_or_mood": "I've been feeling very tired the whole day"
}

# Check response is conversational and helpful
```

### 6. Health Records Test
```bash
POST http://localhost:8000/api/records/upload
Body: form-data with file, record_type, label

# Check file is uploaded and URL is returned
```

---

## 🔗 Integration Points with Person B

Person B will implement:
- **auth.py**: Token verification middleware (add to all endpoints)
- **firebase_service.py**: Generic Firestore read/write helpers
- **Firestore persistence**: Save all Person A outputs to database

For now, endpoints have placeholder `get_current_user()` that accepts any auth header.

---

## 📝 Notes

- **Tesseract OCR**: Must be installed system-wide. If `pytesseract` fails, download installer from [here](https://github.com/UB-Mannheim/tesseract/wiki/Downloads)
- **Gemini Free Tier**: 60 requests/minute limit. May need upgrade for load testing
- **Firebase Rules**: Ensure Firestore security rules allow reads/writes (currently open for dev)
- **CORS**: Configured for localhost:3000 and localhost:5173 (Vite). Update for production domain

---

## 🎓 Code Style

- **Service Layer**: All heavy lifting (OCR, Gemini, Storage) goes in `services/`
- **Route Layer**: Endpoints in `routers/` just orchestrate services
- **Models**: Use Pydantic for request/response validation
- **Error Handling**: FastAPI HTTPException for API errors, let others propagate as 500

---

## 📞 Troubleshooting

**"Tesseract not found"**
→ Install Tesseract-OCR system binary (not Python package alone)

**"GEMINI_API_KEY not found"**
→ Create `.env` file with valid Gemini API key from Google AI Studio

**"Firebase initialization failed"**
→ Check firebase_service_account.json path and contents

**"File too large"**
→ FastAPI default max upload: 25MB. Increase in main.py if needed

---

## 🎯 Next Steps (After Integration with Person B)

1. Add real authentication validation in routers
2. Implement Firestore persistence for all logs
3. Add caching for frequently accessed data
4. Optimize Gemini prompts based on real test results
5. Add file size/type validation
6. Setup error logging and monitoring

---

**Last Updated**: April 17, 2026  
**Person A Assignments**: A1-A9  
**Status**: ✅ All tasks completed, ready for integration testing

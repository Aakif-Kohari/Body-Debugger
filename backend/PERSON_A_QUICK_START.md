# Body Debugger - Person A Quick Reference

## 🎯 Your Role (Person A)

You handle **AI, OCR, and Core Intelligence**:
- **A1**: FastAPI app setup (main.py) ✅
- **A2**: OCR for PDFs/images (ocr_service.py) ✅
- **A3**: Gemini API integration (gemini_service.py) ✅
- **A4**: Lab report translator endpoint ✅
- **A5**: Food calorie parser endpoint ✅
- **A6**: Chatbot endpoint ✅
- **A7**: Firebase Storage service ✅
- **A8**: Health records vault endpoint ✅
- **A9**: End-to-end testing

---

## 🚀 Fastest Way to Start

### Terminal (PowerShell on Windows):
```powershell
cd d:\Body-Debugger\backend

python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Create .env file with your API keys
# Then start server:
python main.py
```

**Server runs at**: http://localhost:8000

---

## 🧪 Test Your Code (Curl Commands)

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

### Test 2: Upload Lab Report (Food Example)
```bash
# This assumes you have a blood_report.pdf in your current directory
curl -X POST "http://localhost:8000/api/food/log" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_description": "2 rotis, 1 plate dal makhni, cucumber, green chutney",
    "meal_type": "lunch"
  }'
```

### Test 3: Chatbot Query
```bash
curl -X POST "http://localhost:8000/api/chat/quick-check" \
  -H "Content-Type: application/json" \
  -d '{
    "symptom_or_mood": "I have been feeling very tired and dizzy since morning"
  }'
```

---

## 📦 What You Received (File Breakdown)

### Main Entry Point
- **main.py** — FastAPI app with all routers, CORS, health checks

### Services (The Real Work)
- **services/ocr_service.py** — Extract text from PDFs/images
- **services/gemini_service.py** — All AI calls (reports, food, chatbot)
- **services/storage_service.py** — Upload/download files from Firebase

### API Routes
- **routers/reports.py** — `/api/reports` endpoints (upload, analyze)
- **routers/food.py** — `/api/food` endpoints (log meals, estimate calories)
- **routers/chat.py** — `/api/chat` endpoints (symptom analysis)

### Data Schemas
- **models/report.py** — BloodParameter, LabReportAnalysis, etc.
- **models/food_log.py** — FoodItem, DailyFood, etc.
- **models/chat.py** — ChatbotRequest, ChatbotResponse

### Configuration
- **.env.example** — Template (copy to `.env` and fill in keys)
- **firebase_config.py** — Firebase Admin SDK setup
- **requirements.txt** — All Python dependencies

---

## 🔑 Environment Variables You Need

Create `.env` file in `backend/` folder:

```
# Required: Gemini API (free from Google AI Studio)
GEMINI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Required: Firebase (create free project at console.firebase.google.com)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase_service_account.json

# Optional: For notifications (Person B)
FCM_SERVER_KEY=xxxxxxxxxxxxx

# Development
DEBUG=True
```

---

## 🏗️ How The Code Works

### Flow 1: Upload & Analyze Blood Report (A4)

```
User uploads PDF/image
    ↓
A1 (main.py) → receives file
    ↓
A4 (reports.py) → POST /api/reports/upload
    ↓
A2 (OCR service) → extract text from PDF/image
    ↓
A3 (Gemini service) → analyze text, return JSON
    ↓
A7 (Storage service) → upload file to Firebase
    ↓
Response to user → analysis + file URL
```

### Flow 2: Log & Estimate Food (A5)

```
User says: "2 rotis, dal, sabzi"
    ↓
A5 (food.py) → POST /api/food/log
    ↓
A3 (Gemini service) → parse with prompt
    ↓
Response → { items: [...], total_calories: 400, ... }
    ↓
(Person B saves to Firestore)
```

### Flow 3: Symptom Analysis (A6)

```
User: "I have a headache"
    ↓
A6 (chat.py) → POST /api/chat/symptom
    ↓
Fetch user context (sleep, water, food logs) ← Person B's job
    ↓
A3 (Gemini) → analyze with context
    ↓
Response → "Possible causes: dehydration, lack of sleep..."
```

---

## 🔧 Key Functions in Services

### **ocr_service.py**
```python
from services.ocr_service import ocr_service

# Both image and PDF
text = ocr_service.extract_text(file_bytes, "pdf")  # Returns clean text string
```

### **gemini_service.py**
```python
from services.gemini_service import gemini_service

# Laboratory report analysis
result = gemini_service.analyze_lab_report(raw_ocr_text)
# Returns: {"parameters": [...], "summary_for_doctor": "...", ...}

# Food parsing
food = gemini_service.parse_food_input("roti dal sabzi")
# Returns: {"items": [...], "total_calories": 300, ...}

# Symptom analysis
response = gemini_service.analyze_symptom_with_context(
    symptom="I feel tired",
    recent_sleep_hours=5,
    recent_water_intake=800
)
```

### **storage_service.py**
```python
from services.storage_service import storage_service

# Upload
url = storage_service.upload_file(
    file_bytes=pdf_content,
    directory="users/uid123/reports",
    filename="blood_report_2024.pdf"
)

# Get public URL
public_url = storage_service.get_public_url(url)

# Download
data = storage_service.download_file(url)
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'pytesseract'` | Run `pip install -r requirements.txt` |
| `TesseractNotFoundError` | Install Tesseract system binary (not Python package) from [here](https://github.com/UB-Mannheim/tesseract/wiki) |
| `GEMINI_API_KEY not found` | Create `.env` with correct key from Google AI Studio |
| `Firebase initialization failed` | Check `.env` path and firebase_service_account.json |
| `CORS error from frontend` | Make sure frontend URL is in `allowed_origins` in main.py |
| `File upload fails` | Check Firebase Storage bucket name and permissions |

---

## 📊 Testing Strategy for A9

### Unit Tests (Quick)
```bash
# Test OCR with a sample image
python -c "
from services.ocr_service import ocr_service
with open('sample_report.pdf', 'rb') as f:
    text = ocr_service.extract_text(f.read(), 'pdf')
    print(text[:200])
"

# Test Gemini directly
python -c "
from services.gemini_service import gemini_service
result = gemini_service.parse_food_input('2 rotis dal sabzi')
print(result)
"
```

### Integration Test (End-to-End)
Use the **Swagger UI** at http://localhost:8000/docs:
1. Upload a real blood report PDF
2. Check the analysis looks correct
3. Log some food items
4. Ask the chatbot a question
5. Upload health records

### Manual Test (Curl)
See "Test Your Code" section above.

---

## 📝 Code Quality Notes

✅ **What's good in Person A code:**
- Error handling with HTTPException
- Clear separation: services vs routers
- Pydantic models for validation
- Environment variables for config
- Proper logging with [A1], [A2], etc. tags
- Async/await for performance

⚠️ **What Person B needs to add:**
- Remove placeholder `get_current_user()` 
- Real Firebase auth token verification
- Firestore persistence (save logs)
- User context fetching (for A6 chatbot)

---

## 🎓 Learning References

If you're new to these tools:

- **FastAPI**: https://fastapi.tiangolo.com/
- **Pydantic**: https://docs.pydantic.dev/
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup
- **Gemini API**: https://ai.google.dev/docs
- **pytesseract**: https://pypi.org/project/pytesseract/
- **pdfplumber**: https://github.com/jsvine/pdfplumber

---

## 🎯 Your Next Milestone

**After finishing A9 (Integration Testing):**

1. **Sync with Person B** — Test their auth middleware
2. **Connect Firestore** — Person B implements, you test
3. **Frontend integration** — Frontend team tests your endpoints
4. **Final demo prep** — Make sure lab report flow works smoothly for judges

---

**Remember**: You're the AI/Intelligence person. Your job is to make sure Gemini returns great answers, OCR extracts accurate data, and everything flows logically. Person B handles the database plumbing.

Good luck! 🚀

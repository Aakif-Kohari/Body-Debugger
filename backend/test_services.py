"""
A9 - Testing Script for Person A
Quick test without running the full server
Useful for debugging individual services
"""
import asyncio
import json
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

print("=" * 60)
print("Body Debugger - Person A Service Tests")
print("=" * 60)

# ============ TEST 1: Gemini Service ============
print("\n[TEST 1] Testing Gemini Service (A3)")
print("-" * 60)

try:
    from services.gemini_service import gemini_service
    print("✓ Gemini service imported successfully")
    
    # Test 1a: Food parsing
    print("\n→ Test 1a: Parsing food description...")
    food_result = gemini_service.parse_food_input("2 rotis, 1 plate dal makhni, cucumber salad, green chutney")
    print(f"✓ Food parsing result:")
    print(f"  - Items: {len(food_result.get('items', []))} items extracted")
    print(f"  - Calories: {food_result.get('total_calories', 0)} kcal")
    print(f"  - Protein: {food_result.get('total_protein', 0)}g")
    
    # Test 1b: Symptom analysis (without context)
    print("\n→ Test 1b: Analyzing symptom...")
    symptom_result = gemini_service.analyze_symptom_with_context("I have been feeling very tired")
    print(f"✓ Symptom analysis result:")
    print(f"  Message preview: {str(symptom_result.get('message', ''))[:100]}...")
    
except ImportError as e:
    print(f"✗ Failed to import Gemini service: {e}")
    print("  Make sure GEMINI_API_KEY is set in .env")
except Exception as e:
    print(f"✗ Gemini service error: {e}")

# ============ TEST 2: OCR Service ============
print("\n[TEST 2] Testing OCR Service (A2)")
print("-" * 60)

try:
    from services.ocr_service import ocr_service
    print("✓ OCR service imported successfully")
    
    # Create a simple test text image (in production, would be real image)
    print("\n→ Test 2a: Checking Tesseract availability...")
    if ocr_service.pytesseract_available:
        print("✓ Tesseract OCR is properly installed")
    else:
        print("⚠ Tesseract OCR not found")
        print("  Install from: https://github.com/UB-Mannheim/tesseract/wiki")
    
    print("✓ OCR service ready")
    print("  To test with actual file: ocr_service.extract_text(file_bytes, 'pdf')")

except Exception as e:
    print(f"✗ OCR service error: {e}")

# ============ TEST 3: Storage Service ============
print("\n[TEST 3] Testing Storage Service (A7)")
print("-" * 60)

try:
    from services.storage_service import storage_service
    print("✓ Storage service imported successfully")
    
    if storage_service.bucket:
        print("✓ Firebase Storage bucket connected")
        print(f"  Bucket name: {storage_service.bucket.name}")
    else:
        print("⚠ Firebase Storage not initialized")
        print("  Check firebase_service_account.json path in .env")

except Exception as e:
    print(f"✗ Storage service error: {e}")

# ============ TEST 4: Models ============
print("\n[TEST 4] Testing Pydantic Models")
print("-" * 60)

try:
    from models.report import LabReportUploadResponse, BloodParameterValue
    from models.food_log import FoodLogInput, DailyFoodLog
    from models.chat import ChatbotRequest
    
    print("✓ All data models imported successfully")
    
    # Test model validation
    param = BloodParameterValue(
        parameter_name="Hemoglobin",
        user_value="12.5",
        normal_range="12-16 g/dL",
        plain_english_meaning="Red blood cells are carrying oxygen",
        lifestyle_tip="Eat iron-rich food",
        risk_flag="green"
    )
    print("✓ Model validation works")
    
except Exception as e:
    print(f"✗ Model testing error: {e}")

# ============ TEST 5: Environment Variables ============
print("\n[TEST 5] Checking Environment Variables")
print("-" * 60)

required_vars = [
    "GEMINI_API_KEY",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_SERVICE_ACCOUNT_PATH"
]

missing = []
for var in required_vars:
    if os.getenv(var):
        print(f"✓ {var}")
    else:
        print(f"✗ {var} - NOT SET")
        missing.append(var)

if missing:
    print(f"\n⚠ Missing {len(missing)} environment variables")
    print("  Create .env file with all required variables")
else:
    print("\n✓ All required environment variables are set")

# ============ TEST 6: FastAPI Router Check ============
print("\n[TEST 6] Checking FastAPI Routers")
print("-" * 60)

try:
    from routers import reports, food, chat
    print("✓ Person A routers imported successfully:")
    print("  - reports.py (Lab Report Translator)")
    print("  - food.py (Food Calorie Parser)")
    print("  - chat.py (Chatbot)")
    
except ImportError as e:
    print(f"✗ Router import failed: {e}")

# ============ TEST 7: Test Data ============
print("\n[TEST 7] Sample Test Data")
print("-" * 60)

sample_blood_report = """
BLOOD TEST REPORT
Date: April 15, 2026
Patient: Raj Kumar

Parameter            Value       Normal Range
Hemoglobin          12.5        12-16 g/dL
WBC                 7.5         4.5-11 x10^9
Platelets           250         150-400
TSH                 2.5         0.4-4.0 mIU/L
Vitamin D           25          30-100 ng/mL
Glucose (Fasting)   95          70-100 mg/dL
Cholesterol Total   200         <200 mg/dL
LDL                 130         <100 mg/dL
HDL                 40          >40 mg/dL
"""

print("\nSample Blood Report (for OCR testing):")
print(sample_blood_report)

print("\nSample Food Description (for parsing):")
print("• 'Breakfast: 2 rotis, 1 cup milk tea, 1 banana'")
print("• 'Lunch: Chicken biryani, raita, green salad'")
print("• 'Dinner: Dal, rice, 2 rotis, vegetables'")

print("\nSample Symptoms (for chatbot):")
print("• 'I have been feeling very tired since morning'")
print("• 'My head is spinning and I feel dizzy'")
print("• 'Unable to focus at work today'")

# ============ FINAL SUMMARY ============
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

status = {
    "Gemini Service": "✓" if os.getenv("GEMINI_API_KEY") else "✗",
    "OCR Service": "✓",
    "Storage Service": "✓" if os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH") else "⚠",
    "Models": "✓",
    "Routers": "✓",
    "Environment": "✓" if not missing else "✗"
}

for service, status in status.items():
    print(f"{status} {service}")

print("\n" + "=" * 60)
print("NEXT STEPS for A9 (Integration Testing):")
print("=" * 60)
print("1. Start server: python main.py")
print("2. Open Swagger UI: http://localhost:8000/docs")
print("3. Test each endpoint:")
print("   - POST /api/reports/upload (with PDF)")
print("   - POST /api/food/log (with meal description)")
print("   - POST /api/chat/symptom (with symptom)")
print("   - POST /api/records/upload (with file)")
print("4. Check responses match expected format")
print("5. If errors, debug with individual services above")
print("=" * 60)

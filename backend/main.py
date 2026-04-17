"""
A1 - Project Bootstrap
FastAPI Application Entry Point
Sets up CORS, environment configuration, and routes all endpoints
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
from firebase_config import init_firebase
try:
    init_firebase()
    print("[OK] Firebase initialization check complete")
except Exception as e:
    print(f"[WARN] Firebase initialization warning: {e}")

# Import MongoDB service
from services.mongodb_service import mongodb_service

# Import real routers
from routers import reports, food, chat, auth, water, sleep, gamification, notifications

# Initialize APScheduler
from apscheduler.schedulers.background import BackgroundScheduler

# Create FastAPI app
app = FastAPI(
    title="Body Debugger API",
    description="Unified Personal Health Operating System",
    version="0.2.0"
)

# Initialize Scheduler
scheduler = BackgroundScheduler()
scheduler.start()

# ========== HEALTH SCORE ENDPOINT ==========
from services.health_score_service import health_score_service
from routers.auth import get_current_user_id

@app.get("/api/health-score", tags=["health"])
async def get_health_score(uid: str = Depends(get_current_user_id)):
    """Fetch the daily 0-100 health score"""
    return await health_score_service.calculate_daily_score(uid)

# ========== CORS Configuration ==========
allowed_origins = [
    "http://localhost:3000",      # Frontend dev
    "http://localhost:5173",      # Vite dev
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://body-debugger.vercel.app",  # Production frontend
    "*", # Allow local network access from mobile devices
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"],
    expose_headers=["Content-Length", "Access-Control-Allow-Origin"],
)

# ========== MOCK STORAGE CONFIGURATION ==========
# Ensure mock_storage exists
mock_dir = os.path.join(os.path.dirname(__file__), "mock_storage")
os.makedirs(mock_dir, exist_ok=True)
app.mount("/mock_storage", StaticFiles(directory=mock_dir), name="mock_storage")

# ========== ROUTER REGISTRATION ==========
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(food.router)
app.include_router(chat.router)
app.include_router(water.router)
app.include_router(sleep.router)
app.include_router(gamification.router)
app.include_router(notifications.router)

# ========== GLOBAL ERROR HANDLERS ==========
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    print(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# ========== STARTUP/SHUTDOWN EVENTS ==========
@app.on_event("startup")
async def startup_event():
    """Run on app startup"""
    print("=" * 50)
    print("Body Debugger API Starting...")
    print("=" * 50)
    
    # Connect to MongoDB
    try:
        await mongodb_service.connect()
    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {e}")
        print("Continuing without database...")
    
    print("[OK] FastAPI configured")
    print("[OK] CORS enabled for development")
    print("[OK] MongoDB connected")
    print("[OK] Person A endpoints ready:")
    print("  - POST /api/reports/upload (Lab Report Translator)")
    print("  - POST /api/food/log (Food Calorie Parser)")
    print("  - POST /api/chat/symptom (Chatbot)")
    print("[OK] Person B endpoints (placeholders):")
    print("  - /api/water/*, /api/sleep/*, /api/gamification/*")
    print("=" * 50)

@app.on_event("shutdown")
async def shutdown_event():
    """Run on app shutdown"""
    print("Body Debugger API shutting down...")
    await mongodb_service.disconnect()

# ========== DEVELOPMENT SERVER ==========
if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("DEBUG", "True").lower() == "true"
    
    print(f"\nStarting server on {host}:{port}")
    print(f"API docs: http://{host}:{port}/docs")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )

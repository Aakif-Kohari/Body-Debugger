"""
A1 - Project Bootstrap
FastAPI Application Entry Point
Sets up CORS, environment configuration, and routes all endpoints
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
from firebase_config import init_firebase
try:
    init_firebase()
    print("✓ Firebase initialized successfully")
except Exception as e:
    print(f"⚠ Firebase initialization warning: {e}")

# Import routers
from routers import reports, food, chat
from routers.person_b_placeholders import (
    water_router,
    sleep_router,
    gamification_router,
    auth_router,
    notifications_router
)

# Create FastAPI app
app = FastAPI(
    title="Body Debugger API",
    description="Unified Personal Health Operating System",
    version="0.1.0"
)

# ========== CORS Configuration ==========
allowed_origins = [
    "http://localhost:3000",      # Frontend dev
    "http://localhost:5173",      # Vite dev
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://body-debugger.vercel.app",  # Production frontend (update with actual domain)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== HEALTH CHECK ENDPOINT ==========
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Body Debugger API",
        "version": "0.1.0"
    }

@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API info"""
    return {
        "message": "Body Debugger API - Unified Personal Health OS",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# ========== PERSON A ROUTERS ==========
# A4 & A8 - Lab Report Translator & Health Records
app.include_router(reports.router)

# A5 - Food Calorie Parser
app.include_router(food.router)

# A6 - Chatbot
app.include_router(chat.router)

# ========== PERSON B ROUTERS (PLACEHOLDERS) ==========
# B3 - Water Logging
app.include_router(water_router)

# B4 - Sleep Logging
app.include_router(sleep_router)

# B9 - Gamification
app.include_router(gamification_router)

# B10 - Auth & Profile
app.include_router(auth_router)

# B6 - Notifications
app.include_router(notifications_router)

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
    print("🚀 Body Debugger API Starting...")
    print("=" * 50)
    print("✓ FastAPI configured")
    print("✓ CORS enabled for development")
    print("✓ Person A endpoints ready:")
    print("  - POST /api/reports/upload (Lab Report Translator)")
    print("  - POST /api/food/log (Food Calorie Parser)")
    print("  - POST /api/chat/symptom (Chatbot)")
    print("✓ Person B endpoints (placeholders):")
    print("  - /api/water/*, /api/sleep/*, /api/gamification/*")
    print("=" * 50)

@app.on_event("shutdown")
async def shutdown_event():
    """Run on app shutdown"""
    print("🛑 Body Debugger API shutting down...")

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

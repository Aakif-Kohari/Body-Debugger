"""
Person B - Placeholder Routers
These will be implemented by Person B
"""
from fastapi import APIRouter, HTTPException

# ==================== WATER ROUTER (B3) ====================
water_router = APIRouter(prefix="/api/water", tags=["water"])

@water_router.post("/log")
async def log_water():
    return {"message": "Person B will implement"}

@water_router.get("/today")
async def get_today_water():
    return {"water_logs": []}

# ==================== SLEEP ROUTER (B4) ====================
sleep_router = APIRouter(prefix="/api/sleep", tags=["sleep"])

@sleep_router.post("/log")
async def log_sleep():
    return {"message": "Person B will implement"}

@sleep_router.get("/history")
async def get_sleep_history():
    return {"sleep_logs": []}

# ==================== GAMIFICATION ROUTER (B9) ====================
gamification_router = APIRouter(prefix="/api/gamification", tags=["gamification"])

@gamification_router.get("/points")
async def get_points():
    return {"points": 0, "streak": 0}

@gamification_router.get("/leaderboard")
async def get_leaderboard():
    return {"leaderboard": []}

# ==================== AUTH ROUTER (B10) ====================
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

@auth_router.post("/profile")
async def create_profile():
    return {"message": "Person B will implement"}

@auth_router.get("/profile")
async def get_profile():
    return {"profile": {}}

# ==================== NOTIFICATIONS ROUTER (B6) ====================
notifications_router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@notifications_router.post("/register-fcm-token")
async def register_fcm_token():
    return {"status": "registered"}

@notifications_router.post("/test-notification")
async def test_notification():
    return {"status": "sent"}

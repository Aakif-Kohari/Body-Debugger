"""
Person B - Authentication Router Implementation
Complete authentication system with JWT tokens
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from services.mongodb_service import mongodb_service

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: int = None
    health_goals: list[str] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# ==================== AUTH ROUTER (B10) ====================
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@auth_router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserRegister):
    """Register new user"""
    try:
        # Check if user already exists
        existing_user = await mongodb_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")

        # Hash password
        hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())

        # Create user
        user_id = await mongodb_service.create_user({
            "email": user_data.email,
            "password_hash": hashed_password.decode('utf-8'),
            "name": user_data.name,
            "age": user_data.age,
            "health_goals": user_data.health_goals
        })

        # Create access token
        access_token = create_access_token(data={"sub": user_id})

        # Get user data (without password)
        user = await mongodb_service.get_user(user_id)
        user_data = {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "age": user.get("age"),
            "health_goals": user.get("health_goals", [])
        }

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@auth_router.post("/login", response_model=TokenResponse)
async def login_user(user_data: UserLogin):
    """Login user"""
    try:
        # Get user by email
        user = await mongodb_service.get_user_by_email(user_data.email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Verify password
        if not bcrypt.checkpw(user_data.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Create access token
        access_token = create_access_token(data={"sub": user["_id"]})

        # Return user data (without password)
        user_data = {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "age": user.get("age"),
            "health_goals": user.get("health_goals", [])
        }

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@auth_router.get("/profile")
async def get_user_profile(user_id: str = Depends(verify_token)):
    """Get current user profile"""
    try:
        user = await mongodb_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "age": user.get("age"),
            "health_goals": user.get("health_goals", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@auth_router.put("/profile")
async def update_user_profile(profile_data: dict, user_id: str = Depends(verify_token)):
    """Update user profile"""
    try:
        await mongodb_service.update_user(user_id, profile_data)
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@auth_router.post("/logout")
async def logout_user():
    """Logout user (client-side token removal)"""
    return {"message": "Logged out successfully"}

# ==================== WATER ROUTER (B3) ====================
water_router = APIRouter(prefix="/api/water", tags=["water"])

@water_router.post("/log")
async def log_water(water_data: dict, user_id: str = Depends(verify_token)):
    """Log water intake"""
    try:
        await mongodb_service.save_water_log(user_id, water_data)
        return {"message": "Water logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log water: {str(e)}")

@water_router.get("/today")
async def get_today_water(user_id: str = Depends(verify_token)):
    """Get today's water logs"""
    try:
        logs = await mongodb_service.get_water_logs_today(user_id)
        return {"water_logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get water logs: {str(e)}")

# ==================== SLEEP ROUTER (B4) ====================
sleep_router = APIRouter(prefix="/api/sleep", tags=["sleep"])

@sleep_router.post("/log")
async def log_sleep(sleep_data: dict, user_id: str = Depends(verify_token)):
    """Log sleep data"""
    try:
        await mongodb_service.save_sleep_log(user_id, datetime.now().strftime("%Y-%m-%d"), sleep_data)
        return {"message": "Sleep logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log sleep: {str(e)}")

@sleep_router.get("/history")
async def get_sleep_history(days: int = 7, user_id: str = Depends(verify_token)):
    """Get sleep history"""
    try:
        logs = await mongodb_service.get_sleep_logs(user_id, days)
        return {"sleep_logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sleep history: {str(e)}")

# ==================== GAMIFICATION ROUTER (B9) ====================
gamification_router = APIRouter(prefix="/api/gamification", tags=["gamification"])

@gamification_router.get("/points")
async def get_points(user_id: str = Depends(verify_token)):
    """Get user points and streak"""
    try:
        points_data = await mongodb_service.get_user_points(user_id)
        return points_data or {"points": 0, "streak": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get points: {str(e)}")

@gamification_router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get leaderboard"""
    try:
        leaderboard = await mongodb_service.get_leaderboard(limit)
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")

# ==================== NOTIFICATIONS ROUTER (B6) ====================
notifications_router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@notifications_router.post("/register-fcm-token")
async def register_fcm_token(token_data: dict, user_id: str = Depends(verify_token)):
    """Register FCM token for push notifications"""
    try:
        await mongodb_service.save_fcm_token(user_id, token_data.get("token"))
        return {"status": "registered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register token: {str(e)}")

@notifications_router.post("/test-notification")
async def test_notification(user_id: str = Depends(verify_token)):
    """Send test notification"""
    try:
        # This would integrate with Firebase Cloud Messaging
        return {"status": "sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

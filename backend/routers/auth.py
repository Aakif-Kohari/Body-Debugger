from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from services.mongodb_service import mongodb_service

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "nexus-bio-os-secret-key-sync-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days for better UX

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Pydantic Models for Auth
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: Optional[int] = None
    health_goals: List[str] = Field(default_factory=list, alias="healthGoals")

    class Config:
        populate_by_name = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# ========== HELPER FUNCTIONS ==========

def create_access_token(data: dict):
    """Create JWT token with expiration"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def verify_token_dep(token: str = Depends(lambda x: x)): # Placeholder for dependency
    # This will be replaced by the real dependency once wiring is complete
    pass

# Real Dependency for other routers to use
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT and return user ID (uid)"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid session token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")

# ========== AUTH ENDPOINTS ==========

@router.post("/register", response_model=TokenResponse)
async def register_user(data: UserRegister):
    """Register a new user and return access token"""
    try:
        # Check if user exists
        existing = await mongodb_service.get_user_by_email(data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Identity already registered")

        # Hash password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(data.password.encode('utf-8'), salt)

        # Create user in MongoDB
        # Note: We let create_user generate the ID
        user_id = await mongodb_service.create_user({
            "email": data.email,
            "password_hash": hashed.decode('utf-8'),
            "name": data.name,
            "age": data.age,
            "health_goals": data.health_goals
        })

        # Generate Token
        access_token = create_access_token({"sub": user_id})

        # Get the new user doc
        user = await mongodb_service.get_user(user_id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["_id"],
                "email": user["email"],
                "name": user["name"],
                "healthGoals": user.get("health_goals", [])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=TokenResponse)
async def login_user(data: UserLogin):
    """Authenticate user and return access token"""
    try:
        user = await mongodb_service.get_user_by_email(data.email)
        if not user or not user.get("password_hash"):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Verify password
        if not bcrypt.checkpw(data.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate Token
        access_token = create_access_token({"sub": str(user["_id"])})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "healthGoals": user.get("health_goals", [])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Identity verification failed")

@router.get("/profile")
async def get_profile(uid: str = Depends(get_current_user_id)):
    """Fetch current user profile details"""
    user = await mongodb_service.get_user(uid)
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found")
    
    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "age": user.get("age"),
        "health_goals": user.get("health_goals", [])
    }

@router.put("/profile")
async def update_profile(data: dict, uid: str = Depends(get_current_user_id)):
    """Update user profile metadata"""
    await mongodb_service.update_user(uid, data)
    return {"status": "success"}

@router.post("/logout")
async def logout():
    """Client handles logout by clearing token"""
    return {"status": "success"}

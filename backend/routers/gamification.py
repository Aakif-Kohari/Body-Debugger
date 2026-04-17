from fastapi import APIRouter, Depends, HTTPException
from typing import List
from routers.auth import get_current_user_id
from services.mongodb_service import mongodb_service

router = APIRouter(prefix="/api/gamification", tags=["gamification"])

@router.get("/points")
async def get_user_points(uid: str = Depends(get_current_user_id)):
    """Fetch user points, streaks, and health ranking"""
    try:
        data = await mongodb_service.get_user_points(uid)
        return data or {"points": 0, "streak": 0, "level": 1}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Fetch the top users by health points"""
    try:
        leaderboard = await mongodb_service.get_leaderboard(limit)
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from routers.auth import get_current_user_id
from services.mongodb_service import mongodb_service
from services.gamification_service import gamification_service
from bson import ObjectId

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


def _serialize(doc: dict) -> dict:
    """Convert MongoDB ObjectId fields to strings for JSON serialization."""
    if doc is None:
        return {}
    result = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            result[k] = str(v)
        else:
            result[k] = v
    return result


@router.get("/points")
async def get_user_points(uid: str = Depends(get_current_user_id)):
    """Fetch user points, level, rank and XP progress"""
    try:
        data = await mongodb_service.get_user_points(uid)
        if not data:
            return {"points": 0, "streak": 0, "level": 1, "rank": "Novice", "next_level_at": 500, "points_to_next": 500}
        
        # Calculate level info via gamification service
        status = await gamification_service.get_user_status(uid)
        clean = _serialize(data)
        clean.update(status)  # merge calculated fields
        return clean
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Fetch the top users by health points"""
    try:
        leaderboard = await mongodb_service.get_leaderboard(limit)
        return {"leaderboard": [_serialize(entry) for entry in leaderboard]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from routers.auth import get_current_user_id
from services.mongodb_service import mongodb_service

router = APIRouter(prefix="/api/sleep", tags=["sleep"])

class SleepLog(BaseModel):
    bedtime: str # ISO format
    wake_time: str # ISO format

@router.post("/log")
async def log_sleep(data: SleepLog, uid: str = Depends(get_current_user_id)):
    """Log sleep duration and quality"""
    try:
        start = datetime.fromisoformat(data.bedtime)
        end = datetime.fromisoformat(data.wake_time)
        duration = (end - start).total_seconds() / 3600 # hours
        
        log_entry = {
            "bedtime": data.bedtime,
            "wake_time": data.wake_time,
            "duration_hours": round(duration, 2),
            "date": start.strftime("%Y-%m-%d")
        }
        
        await mongodb_service.save_sleep_log(uid, log_entry["date"], log_entry)
        
        # Award Points
        from services.gamification_service import gamification_service
        await gamification_service.award_points(uid, "sleep_log")
        
        return {"status": "success", "duration": log_entry["duration_hours"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_sleep_history(days: int = 7, uid: str = Depends(get_current_user_id)):
    """Get sleep logs for the last X days"""
    try:
        user = await mongodb_service.get_user(uid)
        custom_goals = user.get("custom_goals", {}) if user else {}
        goal_hours = custom_goals.get("sleep_hours") or 8

        logs = await mongodb_service.get_sleep_logs(uid, num_days=days)
        return {
            "logs": logs,
            "average_duration": round(sum([l.get("duration_hours", 0) for l in logs]) / len(logs), 2) if logs else 0,
            "goal_hours": goal_hours
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

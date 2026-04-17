from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from routers.auth import get_current_user_id
from services.mongodb_service import mongodb_service
from utils.serializer import serialize_docs

router = APIRouter(prefix="/api/water", tags=["water"])

class WaterLog(BaseModel):
    amount_ml: int
    time: Optional[str] = None # ISO format or just for today

@router.post("/log")
async def log_water(data: WaterLog, uid: str = Depends(get_current_user_id)):
    """Log water intake for the user"""
    try:
        log_entry = {
            "amount_ml": data.amount_ml,
            "timestamp": data.time or datetime.now().isoformat()
        }
        await mongodb_service.save_water_log(uid, log_entry)
        
        # Award Points
        from services.gamification_service import gamification_service
        await gamification_service.award_points(uid, "water_log")
        
        return {"status": "success", "message": f"Logged {data.amount_ml}ml"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/today")
async def get_today_water(uid: str = Depends(get_current_user_id)):
    """Get total water logged today and history of logs"""
    try:
        user = await mongodb_service.get_user(uid)
        custom_goals = user.get("custom_goals", {}) if user else {}
        goal_ml = custom_goals.get("water_ml") or custom_goals.get("water_target") or 3000

        logs = await mongodb_service.get_water_logs_today(uid)
        serialized_logs = serialize_docs(logs)
        total = sum([log.get("amount_ml", 0) for log in logs])
        return {
            "total_ml": total,
            "total_glasses": round(total / 250),
            "logs": serialized_logs,
            "goal_ml": goal_ml
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

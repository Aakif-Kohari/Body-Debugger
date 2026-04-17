from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from routers.auth import get_current_user_id
from services.mongodb_service import mongodb_service

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
        return {"status": "success", "message": f"Logged {data.amount_ml}ml"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/today")
async def get_today_water(uid: str = Depends(get_current_user_id)):
    """Get total water logged today and history of logs"""
    try:
        logs = await mongodb_service.get_water_logs_today(uid)
        total = sum([log.get("amount_ml", 0) for log in logs])
        return {
            "total_ml": total,
            "logs": logs,
            "goal_ml": 3000 # Default target
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

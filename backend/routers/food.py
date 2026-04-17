"""
A5 - Food Calorie Parser Router
Handles natural language meal input and nutritional breakdown
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional

from services.gemini_service import gemini_service
from services.mongodb_service import mongodb_service
from models.food_log import FoodLogInput, FoodLogResponse, FoodItemBreakdown
from routers.auth import get_current_user_id
from utils.serializer import serialize_docs

router = APIRouter(prefix="/api/food", tags=["food"])

class FoodLogRequest(BaseModel):
    """Request to log food"""
    meal_description: str
    meal_type: Optional[str] = None  # "breakfast", "lunch", "dinner"
    date: Optional[str] = None

@router.post("/log", response_model=dict)
async def log_food(
    request: FoodLogRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    A5 - Log food intake with natural language input
    """
    try:
        if not request.meal_description or len(request.meal_description.strip()) < 2:
            raise HTTPException(status_code=400, detail="Please describe what you ate")
        
        if request.meal_type not in ["breakfast", "lunch", "dinner", "snack"]:
            raise HTTPException(status_code=400, detail="Invalid meal type. Use breakfast, lunch, dinner, or snack")
        
        print(f"[A5] Parsing food: {request.meal_description}")
        
        # Call Gemini to parse the food
        try:
            parsed_data = gemini_service.parse_food_input(request.meal_description)
        except ValueError as ve:
            print(f"[A5] User input rejected: {str(ve)}")
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            print(f"[A5] Groq parsing error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to analyze food: {str(e)}")
        
        # Format response
        response = {
            "meal_type": request.meal_type,
            "meal_description": request.meal_description,
            "date": request.date or datetime.now().strftime("%Y-%m-%d"),
            "items": parsed_data.get("items", []),
            "total_calories": parsed_data.get("total_calories", 0),
            "total_protein": parsed_data.get("total_protein", 0),
            "total_carbs": parsed_data.get("total_carbs", 0),
            "total_fat": parsed_data.get("total_fat", 0),
            "status": "success"
        }
        
        print(f"[A5] Food logged: {response['total_calories']} calories")
        
        # Save to MongoDB
        try:
            log_date = request.date or datetime.now().strftime("%Y-%m-%d")
            await mongodb_service.save_food_log(
                uid=user_id,
                date=log_date,
                food_data=response
            )
            print(f"[A5] Food log saved to MongoDB")
            
            # Award points
            from services.gamification_service import gamification_service
            await gamification_service.award_points(user_id, "food_log")
        except Exception as e:
            print(f"[A5] Warning: MongoDB save failed: {str(e)}")
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[A5] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/today")
async def get_today_food(
    date: str = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get today's complete food log (breakfast, lunch, dinner)
    Retrieves from MongoDB
    """
    try:
        target_date = date if date else datetime.now().strftime("%Y-%m-%d")
        logs = await mongodb_service.get_food_logs(user_id, target_date)
        
        # Organize by meal type — serialize each log to handle ObjectIds
        def _serialize_logs(logs_list):
            return serialize_docs(logs_list)
        
        organized = {
            "date": target_date,
            "breakfast": _serialize_logs([l for l in logs if l.get("meal_type") == "breakfast"]),
            "lunch": _serialize_logs([l for l in logs if l.get("meal_type") == "lunch"]),
            "dinner": _serialize_logs([l for l in logs if l.get("meal_type") == "dinner"]),
            "snacks": _serialize_logs([l for l in logs if l.get("meal_type") == "snack"]),
            "total_calories": sum(log.get("total_calories", 0) for log in logs),
            "total_protein": sum(log.get("total_protein", 0) for log in logs),
            "total_carbs": sum(log.get("total_carbs", 0) for log in logs),
            "total_fat": sum(log.get("total_fat", 0) for log in logs),
            "status": "success"
        }
        return organized
    except Exception as e:
        print(f"[A5] Error fetching today's food: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch food logs: {str(e)}")

@router.get("/history/{num_days}")
async def get_food_history(
    num_days: int = 7,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get food logs for past N days
    Retrieves from MongoDB
    """
    try:
        if num_days < 1 or num_days > 90:
            raise HTTPException(status_code=400, detail="num_days must be between 1 and 90")
        
        logs = await mongodb_service.get_food_history(user_id, num_days)
        
        # Aggregate by date — serialize each log to handle ObjectIds
        by_date = {}
        for log in serialize_docs(logs):
            date = log.get("date")
            if date not in by_date:
                by_date[date] = []
            by_date[date].append(log)
        
        return {
            "user_id": user_id,
            "num_days": num_days,
            "data": by_date,
            "total_logs": len(logs),
            "status": "success"
        }
    except Exception as e:
        print(f"[A5] Error fetching food history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.post("/estimate")
async def estimate_calories_route(request: FoodLogRequest):
    """
    Estimate calories for food without logging
    Just analyze, don't save. Renamed to avoid conflicts.
    """
    try:
        if not request.meal_description or len(request.meal_description.strip()) < 2:
            raise HTTPException(status_code=400, detail="Please describe the food")
        
        parsed_data = gemini_service.parse_food_input(request.meal_description)
        
        return {
            "meal_description": request.meal_description,
            "items": parsed_data.get("items", []),
            "total_calories": parsed_data.get("total_calories", 0),
            "total_protein": parsed_data.get("total_protein", 0),
            "total_carbs": parsed_data.get("total_carbs", 0),
            "total_fat": parsed_data.get("total_fat", 0),
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Estimation failed: {str(e)}")

@router.delete("/{log_id}")
async def delete_food_route(
    log_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a specific food log by its ID
    """
    try:
        success = await mongodb_service.delete_food_log(user_id, log_id)
        if not success:
            raise HTTPException(status_code=404, detail="Food log not found or already deleted")
        return {"status": "success", "message": "Food log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

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

router = APIRouter(prefix="/api/food", tags=["food"])

# Placeholder for auth dependency
def get_current_user(authorization: str = None) -> str:
    """Placeholder for Firebase auth verification"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return "user_id_placeholder"

class FoodLogRequest(BaseModel):
    """Request to log food"""
    meal_description: str
    meal_type: str  # "breakfast", "lunch", "dinner"
    date: Optional[str] = None

@router.post("/log", response_model=dict)
async def log_food(
    request: FoodLogRequest,
    user_id: str = Depends(get_current_user)
):
    """
    A5 - Log food intake with natural language input
    
    Example: "2 rotis, dal, sabzi with ghee, half plate"
    Response: Breaks down items with calories and macros
    
    1. Accept natural language food description
    2. Parse with Gemini API
    3. Return structured breakdown
    4. Save to Firestore (Person B will implement)
    """
    try:
        if not request.meal_description or len(request.meal_description.strip()) < 2:
            raise HTTPException(status_code=400, detail="Please describe what you ate")
        
        if request.meal_type not in ["breakfast", "lunch", "dinner"]:
            raise HTTPException(status_code=400, detail="Invalid meal type. Use breakfast, lunch, or dinner")
        
        print(f"[A5] Parsing food: {request.meal_description}")
        
        # Call Gemini to parse the food
        try:
            parsed_data = gemini_service.parse_food_input(request.meal_description)
        except Exception as e:
            print(f"[A5] Gemini parsing error: {str(e)}")
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
        except Exception as e:
            print(f"[A5] Warning: MongoDB save failed: {str(e)}")
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[A5] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/today")
async def get_today_food(user_id: str = Depends(get_current_user)):
    """
    Get today's complete food log (breakfast, lunch, dinner)
    Retrieves from MongoDB
    """
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        logs = await mongodb_service.get_food_logs(user_id, today)
        
        # Organize by meal type
        organized = {
            "date": today,
            "breakfast": [log for log in logs if log.get("meal_type") == "breakfast"],
            "lunch": [log for log in logs if log.get("meal_type") == "lunch"],
            "dinner": [log for log in logs if log.get("meal_type") == "dinner"],
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
    user_id: str = Depends(get_current_user)
):
    """
    Get food logs for past N days
    Retrieves from MongoDB
    """
    try:
        if num_days < 1 or num_days > 90:
            raise HTTPException(status_code=400, detail="num_days must be between 1 and 90")
        
        logs = await mongodb_service.get_food_history(user_id, num_days)
        
        # Aggregate by date
        by_date = {}
        for log in logs:
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
async def estimate_calories(request: FoodLogRequest):
    """
    Estimate calories for food without logging
    Just analyze, don't save
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

@router.get("/history/{num_days}")
async def get_food_history(
    num_days: int = 7,
    user_id: str = Depends(get_current_user)
):
    """
    Get food logs for the last N days
    """
    if num_days > 30:
        raise HTTPException(status_code=400, detail="Max 30 days at a time")
    
    return {
        "num_days": num_days,
        "logs": [],
        "message": "Firestore integration pending - Person B task"
    }

@router.post("/estimate")
async def estimate_calories(request: FoodLogRequest):
    """
    Quick calorie estimation without saving
    Useful for quick checks
    """
    try:
        parsed = gemini_service.parse_food_input(request.meal_description)
        return {
            "meal_description": request.meal_description,
            "estimated_calories": parsed.get("total_calories", 0),
            "items": parsed.get("items", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

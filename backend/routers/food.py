"""
A5 - Food Calorie Parser Router
Handles natural language meal input and nutritional breakdown
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from services.gemini_service import gemini_service
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
        
        # Save to Firestore (Person B will implement)
        # firestore.save_food_log(user_id, response)
        
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
    Person B will implement Firestore query
    """
    return {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "breakfast": [],
        "lunch": [],
        "dinner": [],
        "total_calories": 0,
        "message": "Firestore integration pending - Person B task"
    }

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

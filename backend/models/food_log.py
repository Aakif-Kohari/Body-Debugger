from pydantic import BaseModel
from typing import List
from datetime import datetime

class FoodItemBreakdown(BaseModel):
    """Breakdown of a single food item"""
    item_name: str
    quantity: str
    calories: float
    protein_grams: float
    carbs_grams: float
    fat_grams: float

class FoodLogInput(BaseModel):
    """Natural language food input"""
    meal_description: str  # e.g., "2 rotis, dal, sabzi"
    meal_type: str  # "breakfast", "lunch", "dinner"
    date: datetime = None  # Defaults to today

class FoodLogResponse(BaseModel):
    """Response after parsing food input"""
    meal_type: str
    items: List[FoodItemBreakdown]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float

class DailyFoodLog(BaseModel):
    """Complete daily food log"""
    date: str
    breakfast: List[FoodItemBreakdown] = []
    lunch: List[FoodItemBreakdown] = []
    dinner: List[FoodItemBreakdown] = []
    total_calories: float = 0.0

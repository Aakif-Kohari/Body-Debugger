from services.mongodb_service import mongodb_service
from datetime import datetime

class HealthScoreService:
    async def calculate_daily_score(self, uid: str):
        """
        Calculate a 0-100 health score based on today's logs
        Hydration (25%) + Sleep (25%) + Food (25%) + Labs (25%)
        """
        try:
            # 1. Hydration Score (0-25)
            # Target: 3000ml = 25 pts
            water_logs = await mongodb_service.get_water_logs_today(uid)
            total_water = sum([l.get("amount_ml", 0) for l in water_logs])
            water_score = min(25, (total_water / 3000) * 25)
            
            # 2. Sleep Score (0-25)
            # Target: 8h = 25 pts
            sleep_logs = await mongodb_service.get_sleep_logs(uid, num_days=1)
            total_sleep = sum([l.get("duration_hours", 0) for l in sleep_logs])
            sleep_score = min(25, (total_sleep / 8) * 25)
            
            # 3. Food Logging Score (0-25)
            # 3 meals = 25 pts
            food_logs = await mongodb_service.get_food_history(uid, num_days=1)
            food_score = min(25, (len(food_logs) / 3) * 25)
            
            # 4. Lab/Static Score (0-25)
            # If they have at least one lab report analyzed = 25 pts
            reports = await mongodb_service.get_lab_reports(uid)
            lab_score = 25 if reports else 10 # Base 10 if no reports yet
            
            total_score = round(water_score + sleep_score + food_score + lab_score)
            
            return {
                "total": total_score,
                "breakdown": {
                    "hydration": round(water_score, 1),
                    "sleep": round(sleep_score, 1),
                    "nutrition": round(food_score, 1),
                    "clinical": round(lab_score, 1)
                },
                "status": "synchronized" if total_score > 70 else "calibrating"
            }
        except Exception as e:
            print(f"Health score calculation error: {e}")
            return {"total": 0, "error": str(e)}

health_score_service = HealthScoreService()

"""
A9 - Gamification Service
Logic for awarding points, calculating streaks, and managing health levels
"""
from services.mongodb_service import mongodb_service
from datetime import datetime

class GamificationService:
    """Service to manage user health points and gamification"""
    
    # Point Values
    POINTS_MAP = {
        "food_log": 50,
        "water_log": 10,
        "sleep_log": 40,
        "lab_report": 200,
        "symptom_check": 30
    }

    async def award_points(self, uid: str, event_type: str):
        """Award points to a user based on an event"""
        points = self.POINTS_MAP.get(event_type, 10)
        try:
            await mongodb_service.update_points(uid, points)
            print(f"[GAMIFY] Awarded {points} points to {uid} for {event_type}")
            return points
        except Exception as e:
            print(f"[GAMIFY] Error awarding points: {e}")
            return 0

    async def get_user_status(self, uid: str):
        """Calculate user level and current status"""
        data = await mongodb_service.get_user_points(uid)
        if not data:
            return {"points": 0, "level": 1, "streak": 0, "rank": "Novice"}

        points = data.get("points", 0)
        
        # Level Logic: Every 500 points = 1 level
        level = (points // 500) + 1
        
        # Rankings
        ranks = ["Novice", "Health Seeker", "Vitality Master", "Elite Human", "Anti-Gravity Legend"]
        rank_idx = min(level - 1, len(ranks) - 1)
        
        return {
            "points": points,
            "level": level,
            "rank": ranks[rank_idx],
            "next_level_at": level * 500,
            "points_to_next": (level * 500) - points
        }

# Singleton instance
gamification_service = GamificationService()

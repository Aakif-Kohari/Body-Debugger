from fastapi import APIRouter, Depends, HTTPException
from typing import List
from routers.auth import get_current_user_id
from services.mongodb_service import mongodb_service
from services.gamification_service import gamification_service
from services.health_score_service import health_score_service
from services.gemini_service import gemini_service
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

@router.get("/time-machine")
async def get_time_machine_forecast(uid: str = Depends(get_current_user_id)):
    """Generate predictive futures based on current habits"""
    try:
        # Pull latest Health Score
        score_data = await health_score_service.calculate_daily_score(uid)
        score = score_data.get('total_score', 50)
        
        # Pull Sleep
        sleep_logs = await mongodb_service.get_sleep_logs(uid, num_days=7)
        avg_sleep = round(sum(l.get('duration_hours', 0) for l in sleep_logs) / len(sleep_logs), 1) if sleep_logs else 0

        # Pull Real Caloric Average (replacing the 2000 stub)
        from datetime import datetime, timedelta
        calorie_total = 0
        calorie_days = 0
        for days_ago in range(7):
            d = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            food_logs = await mongodb_service.get_food_logs(uid, d)
            if food_logs:
                calorie_total += sum(l.get("total_calories", 0) for l in food_logs)
                calorie_days += 1
        avg_calories = round(calorie_total / calorie_days) if calorie_days else 0

        # Pull Lab Reports — all of them, extract key biomarkers
        raw_lab_reports = await mongodb_service.get_lab_reports(uid)
        lab_summary = []
        for report in raw_lab_reports[:8]:
            analysis = report.get("analysis", {})
            if not analysis:
                continue
            
            # Primary fields
            findings = analysis.get("key_findings", [])
            abnormal = analysis.get("abnormal_values", [])
            
            # Fallback: If primary fields are missing, extract from parameters list
            if not findings and "parameters" in analysis:
                for p in analysis["parameters"]:
                    if p.get("risk_flag") in ("yellow", "red"):
                        findings.append(f"{p.get('parameter_name')}: {p.get('user_value')} ({p.get('risk_flag')} flag)")
            
            date = report.get("uploaded_at", "")[:10] if report.get("uploaded_at") else "Unknown date"
            if findings or abnormal:
                lab_summary.append({
                    "date": date,
                    "key_findings": findings[:5] if isinstance(findings, list) else [],
                    "abnormal_values": abnormal[:5] if isinstance(abnormal, list) else []
                })

        # Build payload for Gemini
        health_data = {
            'health_score': score,
            'average_sleep': avg_sleep,
            'average_calories': avg_calories,
            'lab_reports': lab_summary,
            'total_reports': len(raw_lab_reports)
        }
        
        forecast = gemini_service.generate_time_machine_forecast(health_data)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/digital-twin")
async def get_digital_twin(uid: str = Depends(get_current_user_id)):
    """Calculates organ-specific bio-status based on real-time logs"""
    try:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Gather context
        sleep_logs = await mongodb_service.get_sleep_logs(uid, num_days=1)
        sleep_hours = sleep_logs[0].get('duration_hours', 0) if sleep_logs else 0
        
        food_logs = await mongodb_service.get_food_logs(uid, today)
        calories = sum(l.get("total_calories", 0) for l in food_logs)
        
        water_doc = await mongodb_service.db.water_logs.find_one({"user_id": uid, "date": today})
        water_ml = water_doc.get("total_ml", 0) if water_doc else 0
        
        # Fetch Gamification Data 
        user_points = await mongodb_service.db.gamification.find_one({"user_id": uid})
        xp = user_points.get("points", 0) if user_points else 0

        # Organ Status Engine — Simple, friendly language for all users
        twin = {
            "Brain":   {"status": "OPTIMAL", "reason": "Your brain is well-rested and sharp today! ✅", "color": "#10b981"},
            "Lungs":   {"status": "OPTIMAL", "reason": "Your breathing and energy feel good.", "color": "#10b981"},
            "Heart":   {"status": "OPTIMAL", "reason": "Your heart health looks steady today.", "color": "#10b981"},
            "Liver":   {"status": "OPTIMAL", "reason": "Your body is flushing out toxins well — keep drinking water!", "color": "#10b981"},
            "Stomach": {"status": "OPTIMAL", "reason": "Your digestion and hydration are on track.", "color": "#10b981"},
            "Joints":  {"status": "OPTIMAL", "reason": "Your body feels active and mobile.", "color": "#10b981"}
        }
        
        # Brain Logic
        if sleep_hours == 0:
            twin["Brain"] = {"status": "UNKNOWN", "reason": "You haven't logged your sleep today. We can't scan your brain yet!", "color": "#a8a29e"}
        elif sleep_hours < 5:
            twin["Brain"] = {"status": "CRITICAL", "reason": f"Only {sleep_hours} hours of sleep — your brain is running on empty. You may feel foggy, irritable, and have trouble focusing.", "color": "#ef4444"}
        elif sleep_hours < 7:
            twin["Brain"] = {"status": "WARNING", "reason": f"You slept {sleep_hours} hours, a little less than ideal. Try to get 7–9 hours for a sharper mind.", "color": "#eab308"}
            
        # Stomach Logic
        if water_ml == 0:
            twin["Stomach"] = {"status": "UNKNOWN", "reason": "No food or water logged yet today. Log your meals and water to scan your stomach.", "color": "#a8a29e"}
        elif water_ml < 1000 and calories > 2500:
            twin["Stomach"] = {"status": "CRITICAL", "reason": "You ate a lot but drank very little water. Your stomach is under serious stress — drink water now!", "color": "#ef4444"}
        elif water_ml < 1500:
            twin["Stomach"] = {"status": "WARNING", "reason": f"You've only had {water_ml}ml of water. You're dehydrated — your digestion will slow down.", "color": "#eab308"}
        elif calories > 3000:
            twin["Stomach"] = {"status": "WARNING", "reason": "You've had a heavy eating day. Give your stomach time to digest and avoid late-night snacks.", "color": "#eab308"}
            
        # Heart Logic
        if calories > 3500:
            twin["Heart"] = {"status": "WARNING", "reason": "Very high calorie day! Too much rich food regularly can put strain on your heart. Try to balance tomorrow.", "color": "#eab308"}

        # Liver Logic
        if water_ml > 0 and water_ml < 1200:
            twin["Liver"] = {"status": "WARNING", "reason": "Low water intake means your liver can't flush waste properly. Drink more water to help it recover.", "color": "#eab308"}
            
        # Joints Logic
        if xp < 100:
            twin["Joints"] = {"status": "WARNING", "reason": "You haven't been very active yet. Your joints and muscles may feel stiff. Try a short walk or stretch!", "color": "#eab308"}

        # Save snapshot to DB so chatbot can reference it
        twin_snapshot = {
            "user_id": uid,
            "updated_at": datetime.now().isoformat(),
            "organs": twin,
            "context": {"sleep_hours": sleep_hours, "water_ml": water_ml, "calories": calories, "xp": xp}
        }
        await mongodb_service.db.digital_twin_snapshots.update_one(
            {"user_id": uid},
            {"$set": twin_snapshot},
            upsert=True
        )
            
        return {"organs": twin}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

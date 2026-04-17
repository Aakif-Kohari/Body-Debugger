"""
A6 - "Why Did I Feel Like This" Chatbot Router
Conversational AI that connects symptoms to user's health logs
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict

from services.gemini_service import gemini_service
from services.mongodb_service import mongodb_service
from models.chat import ChatbotRequest, ChatbotResponse
from routers.auth import get_current_user_id
from utils.serializer import serialize_docs

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatContextData(BaseModel):
    """Context data from user's recent health logs"""
    sleep_hours: Optional[float] = None
    water_intake_ml: Optional[float] = None
    recent_food: Optional[List[str]] = None
    last_blood_report_values: Optional[Dict[str, str]] = None

@router.post("/symptom", response_model=dict)
async def analyze_symptom(
    request: ChatbotRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    A6 - "Why did I feel like this" Chatbot
    
    User describes a symptom or mood, AI analyzes it with context from their health logs:
    - Recent sleep hours
    - Water intake
    - Recent meals
    - Latest lab report values
    
    Returns conversational explanation and suggestions
    
    Example Input: "I had a headache all afternoon"
    Example Output: Probable causes + lifestyle suggestions
    """
    try:
        symptom = request.symptom.strip()
        
        if not symptom or len(symptom) < 3:
            raise HTTPException(status_code=400, detail="Please describe your symptom or mood")
        
        print(f"[A6] Analyzing symptom: {symptom}")
        
        # Fetch user's recent health logs from MongoDB
        try:
            raw_user  = await mongodb_service.get_user(user_id)
            raw_food  = await mongodb_service.get_food_history(user_id, num_days=1)
            raw_sleep = await mongodb_service.get_sleep_logs(user_id, num_days=1)
            raw_reports = await mongodb_service.get_lab_reports(user_id)
            
            recent_food    = serialize_docs(raw_food or [])
            recent_sleep   = serialize_docs(raw_sleep or [])
            recent_reports = serialize_docs(raw_reports or [])
            
            user_profile = {
                "age": raw_user.get("age") if raw_user else None,
                "goals": raw_user.get("health_goals", []) if raw_user else []
            }
            
            # Extract context data — food items must be strings for Gemini
            food_items = []
            for log in recent_food:
                for item in log.get("items", []):
                    if isinstance(item, dict):
                        food_items.append(item.get("name", str(item)))
                    elif isinstance(item, str):
                        food_items.append(item)
            
            sleep_hours = recent_sleep[0].get("duration_hours") if recent_sleep else None
            report_values = recent_reports[0].get("analysis") if recent_reports else None
            
            context_data = {
                "user_profile": user_profile,
                "sleep_hours": sleep_hours,
                "water_intake_ml": None,
                "recent_food": food_items,
                "last_blood_report_values": report_values
            }
        except Exception as e:
            print(f"[A6] Warning: Could not fetch context from MongoDB: {str(e)}")
            context_data = {
                "user_profile": None,
                "sleep_hours": None,
                "water_intake_ml": None,
                "recent_food": None,
                "last_blood_report_values": None
            }
        
        try:
            # Call Gemini with symptom analysis
            result = gemini_service.analyze_symptom_with_context(
                symptom=symptom,
                user_profile=context_data.get("user_profile"),
                recent_sleep_hours=context_data.get("sleep_hours"),
                recent_water_intake=context_data.get("water_intake_ml"),
                recent_food_items=context_data.get("recent_food"),
                recent_report_values=context_data.get("last_blood_report_values")
            )
        except Exception as e:
            print(f"[A6] Gemini error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
        
        # Format response
        response = {
            "symptom": symptom,
            "response": result.get("message"),         # alias for frontend
            "assistant_message": result.get("message"),
            "context_used": {
                "has_sleep_data": context_data.get("sleep_hours") is not None,
                "has_water_data": context_data.get("water_intake_ml") is not None,
                "has_food_data": bool(context_data.get("recent_food")),
                "has_report_data": context_data.get("last_blood_report_values") is not None
            },
            "status": "success"
        }
        
        # Save chat message to MongoDB
        try:
            await mongodb_service.save_chat_message(
                uid=user_id,
                message_data={
                    "symptom": symptom,
                    "response": result.get("message"),
                    "context": context_data
                }
            )
            print(f"[A6] Chat message saved to MongoDB")
        except Exception as e:
            print(f"[A6] Warning: MongoDB save failed: {str(e)}")
        
        print(f"[A6] Symptom analysis complete")
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[A6] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/quick-check")
async def quick_symptom_check(request: ChatbotRequest):
    """
    Quick symptom check without user context
    Anonymous endpoint for quick Q&A
    """
    try:
        symptom = (request.symptom or "").strip()
        
        if not symptom:
            raise HTTPException(status_code=400, detail="Please describe your symptom")
        
        # Simplified Gemini call without health context
        prompt = f"""A user is experiencing: "{symptom}"
        
Provide a brief, empathetic response (2-3 sentences) about what might be causing this
and what they could try. Keep it conversational and encouraging.
Do NOT provide medical diagnosis. Suggest consulting a doctor if serious."""
        
        try:
            message = gemini_service.ask_gemini(prompt)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        return {
            "symptom": symptom,
            "response": message,
            "requires_doctor": "serious" in symptom.lower() or "pain" in symptom.lower()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_chat_history(
    limit: int = 20,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get user's chat history
    Retrieves from MongoDB
    """
    try:
        if limit < 1 or limit > 100:
            limit = 20
        
        messages = await mongodb_service.get_chat_history(user_id, limit)
        
        return {
            "messages": serialize_docs(messages),
            "limit": limit,
            "total": len(messages),
            "status": "success"
        }
    except Exception as e:
        print(f"[A6] Error fetching chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

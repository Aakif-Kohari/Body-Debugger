from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.firebase_service import firebase_service
from routers.auth import get_current_user_id
from services.mongodb_service import mongodb_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class FCMToken(BaseModel):
    token: str

@router.post("/register-fcm-token")
async def register_fcm_token(data: FCMToken, uid: str = Depends(get_current_user_id)):
    """Save the browser's FCM token for future push notifications"""
    try:
        await mongodb_service.save_fcm_token(uid, data.token)
        return {"status": "success", "message": "Token registered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-nudge")
async def test_notification(uid: str = Depends(get_current_user_id)):
    """Send a test push notification to the registered device"""
    try:
        user = await mongodb_service.get_user(uid)
        token = user.get("fcm_token")
        if not token:
            raise HTTPException(status_code=400, detail="No FCM token registered for this user")
            
        firebase_service.send_push_notification(
            token=token,
            title="Nexus OS Test",
            body="Your neural health sync is functional.",
            data={"type": "test"}
        )
        return {"status": "sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

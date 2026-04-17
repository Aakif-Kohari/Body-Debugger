import firebase_admin
from firebase_admin import auth, messaging
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

security = HTTPBearer()

class FirebaseService:
    def __init__(self):
        self.auth = auth
        self.messaging = messaging

    def verify_token(self, credentials: HTTPAuthorizationCredentials = Depends(security)):
        """
        Verifies the Firebase ID token sent from the client.
        Extracts the UID and user info.
        """
        try:
            token = credentials.credentials
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid or expired Firebase token: {str(e)}"
            )

    def send_push_notification(self, token: str, title: str, body: str, data: dict = None):
        """Sends a push notification to a specific FCM token"""
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            token=token,
            data=data or {}
        )
        try:
            response = messaging.send(message)
            return response
        except Exception as e:
            print(f"Error sending FCM message: {e}")
            return None

firebase_service = FirebaseService()

# Common dependency to get user ID
def get_current_user_id(token_data: dict = Depends(firebase_service.verify_token)):
    return token_data.get("uid")

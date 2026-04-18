import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
def init_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        # Try JSON string from env first (for Render/cloud hosting)
        json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if json_str:
            cred_dict = json.loads(json_str)
            cred = credentials.Certificate(cred_dict)
        else:
            # Fall back to file path for local dev
            path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase_service_account.json")
            if not os.path.exists(path):
                print(f"[WARN] Firebase service account file not found at {path}")
                print("[WARN] Firebase features will be disabled.")
                return None
            cred = credentials.Certificate(path)
        
        app = firebase_admin.initialize_app(
            cred,
            {
                'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET")
            }
        )
        return app
    else:
        return firebase_admin.get_app()

# Initialize Firebase on module import
try:
    init_firebase()
except Exception as e:
    print(f"Warning: Firebase initialization failed: {e}")
    print("This is expected during development if service account file is not set up yet.")

# Helper functions to get Firebase services
def get_firestore_db():
    """Get Firestore database instance"""
    return firestore.client()

def get_storage_bucket():
    """Get Firebase Storage bucket"""
    return storage.bucket()

def get_auth():
    """Get Firebase Auth"""
    return auth

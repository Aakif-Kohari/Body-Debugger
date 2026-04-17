import os
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
def init_firebase():
    """Initialize Firebase Admin SDK"""
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase_service_account.json")
    
    if not os.path.exists(service_account_path):
        print(f"[WARN] Firebase service account file not found at {service_account_path}")
        print("[WARN] Firebase features will be disabled.")
        return None
    
    if not firebase_admin._apps:
        cred = credentials.Certificate(service_account_path)
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

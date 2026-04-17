"""
MongoDB Service
Handles all database operations for Body Debugger
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class MongoDBService:
    """Service for MongoDB operations"""
    
    def __init__(self):
        """Initialize MongoDB connection"""
        self.client = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            mongodb_url = os.getenv("MONGODB_URL")
            if not mongodb_url:
                raise ValueError("MONGODB_URL not found in .env")
            
            self.client = AsyncIOMotorClient(mongodb_url)
            self.db = self.client.body_debugger
            
            # Test connection
            await self.client.admin.command('ping')
            print("[OK] MongoDB connected successfully")
        except Exception as e:
            print(f"[ERROR] MongoDB connection failed: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            print("[OK] MongoDB disconnected")
    
    # ========== USER OPERATIONS ==========
    async def create_user(self, user_data: dict):
        """Create new user profile"""
        try:
            user_doc = {
                "_id": user_data.get("_id") or f"user_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_data['email'][:5]}",
                "email": user_data.get("email"),
                "password_hash": user_data.get("password_hash"),
                "name": user_data.get("name"),
                "age": user_data.get("age"),
                "health_goals": user_data.get("health_goals", []),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            result = await self.db.users.insert_one(user_doc)
            return user_doc["_id"]
        except Exception as e:
            print(f"Error creating user: {e}")
            raise
    
    async def get_user(self, uid: str):
        """Get user profile"""
        try:
            user = await self.db.users.find_one({"_id": uid})
            return user
        except Exception as e:
            print(f"Error getting user: {e}")
            raise
    
    async def get_user_by_email(self, email: str):
        """Get user by email"""
        try:
            user = await self.db.users.find_one({"email": email})
            return user
        except Exception as e:
            print(f"Error getting user by email: {e}")
            raise
    
    async def update_user(self, uid: str, update_data: dict):
        """Update user profile"""
        try:
            update_data["updated_at"] = datetime.now().isoformat()
            result = await self.db.users.update_one(
                {"_id": uid},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating user: {e}")
            raise
    
    # ========== FOOD LOG OPERATIONS ==========
    async def save_food_log(self, uid: str, date: str, food_data: dict):
        """Save food log for a user"""
        try:
            log = {
                "user_id": uid,
                "date": date,
                "meal_type": food_data.get("meal_type"),
                "meal_description": food_data.get("meal_description"),
                "items": food_data.get("items", []),
                "total_calories": food_data.get("total_calories", 0),
                "total_protein": food_data.get("total_protein", 0),
                "total_carbs": food_data.get("total_carbs", 0),
                "total_fat": food_data.get("total_fat", 0),
                "created_at": datetime.now().isoformat()
            }
            result = await self.db.food_logs.insert_one(log)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving food log: {e}")
            raise
    
    async def get_food_logs(self, uid: str, date: str):
        """Get food logs for a specific date"""
        try:
            logs = await self.db.food_logs.find({
                "user_id": uid,
                "date": date
            }).to_list(length=None)
            return logs
        except Exception as e:
            print(f"Error getting food logs: {e}")
            raise
    
    async def get_food_history(self, uid: str, num_days: int = 7):
        """Get food logs for past N days"""
        try:
            logs = await self.db.food_logs.find({
                "user_id": uid
            }).sort("date", -1).to_list(length=num_days)
            return logs
        except Exception as e:
            print(f"Error getting food history: {e}")
            raise
    
    async def delete_food_log(self, uid: str, log_id: str):
        """Delete a food log for a user"""
        try:
            # Need to convert string id to ObjectId
            from bson.objectid import ObjectId
            result = await self.db.food_logs.delete_one({
                "_id": ObjectId(log_id),
                "user_id": uid
            })
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting food log: {e}")
            raise

    
    # ========== CHAT HISTORY OPERATIONS ==========
    async def save_chat_message(self, uid: str, message_data: dict):
        """Save chat message"""
        try:
            chat = {
                "user_id": uid,
                "symptom": message_data.get("symptom"),
                "response": message_data.get("response"),
                "context": message_data.get("context"),
                "created_at": datetime.now().isoformat()
            }
            result = await self.db.chat_history.insert_one(chat)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving chat: {e}")
            raise
    
    async def get_chat_history(self, uid: str, limit: int = 20):
        """Get user's chat history"""
        try:
            messages = await self.db.chat_history.find({
                "user_id": uid
            }).sort("created_at", -1).to_list(length=limit)
            return messages
        except Exception as e:
            print(f"Error getting chat history: {e}")
            raise
    
    # ========== SLEEP LOG OPERATIONS ==========
    async def save_sleep_log(self, uid: str, date: str, sleep_data: dict):
        """Save sleep log"""
        try:
            sleep = {
                "user_id": uid,
                "date": date,
                "bedtime": sleep_data.get("bedtime"),
                "wake_time": sleep_data.get("wake_time"),
                "duration_hours": sleep_data.get("duration_hours"),
                "quality": sleep_data.get("quality"),
                "created_at": datetime.now().isoformat()
            }
            result = await self.db.sleep_logs.insert_one(sleep)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving sleep log: {e}")
            raise
    
    async def get_sleep_logs(self, uid: str, num_days: int = 7):
        """Get sleep logs for past N days"""
        try:
            logs = await self.db.sleep_logs.find({
                "user_id": uid
            }).sort("date", -1).to_list(length=num_days)
            return logs
        except Exception as e:
            print(f"Error getting sleep logs: {e}")
            raise
    
    async def delete_sleep_log(self, uid: str, log_id: str):
        """Delete a sleep log"""
        try:
            from bson.objectid import ObjectId
            result = await self.db.sleep_logs.delete_one({
                "_id": ObjectId(log_id),
                "user_id": uid
            })
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting sleep log: {e}")
            raise
    
    # ========== WATER LOG OPERATIONS ==========
    async def save_water_log(self, uid: str, water_data: dict):
        """Save water log"""
        try:
            log = {
                "user_id": uid,
                "amount_ml": water_data.get("amount_ml", 250),
                "timestamp": water_data.get("timestamp") or datetime.now().isoformat()
            }
            result = await self.db.water_logs.insert_one(log)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving water log: {e}")
            raise
    
    async def get_water_logs_today(self, uid: str):
        """Get today's water logs"""
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            logs = await self.db.water_logs.find({
                "user_id": uid,
                "timestamp": {"$regex": f"^{today}"}
            }).to_list(length=None)
            return logs
        except Exception as e:
            print(f"Error getting water logs: {e}")
            raise
    
    # ========== FCM TOKEN OPERATIONS ==========
    async def save_fcm_token(self, uid: str, token: str):
        """Save FCM token for push notifications"""
        try:
            result = await self.db.fcm_tokens.update_one(
                {"user_id": uid},
                {
                    "$set": {
                        "token": token,
                        "updated_at": datetime.now().isoformat()
                    }
                },
                upsert=True
            )
            return result.modified_count > 0 or result.upserted_id is not None
        except Exception as e:
            print(f"Error saving FCM token: {e}")
            raise
    
    async def get_health_records(self, uid: str):
        """Get all health records for user"""
        try:
            records = await self.db.health_records.find({
                "user_id": uid
            }).sort("created_at", -1).to_list(length=None)
            return records
        except Exception as e:
            print(f"Error getting health records: {e}")
            raise

    async def save_health_record(self, uid: str, record_data: dict):
        """Save health record metadata"""
        try:
            record = {
                "user_id": uid,
                "record_type": record_data.get("record_type"),
                "label": record_data.get("label"),
                "file_url": record_data.get("file_url"),
                "created_at": datetime.now().isoformat()
            }
            result = await self.db.health_records.insert_one(record)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving health record: {e}")
            raise
    
    # ========== LAB REPORTS OPERATIONS ==========
    async def save_lab_report(self, uid: str, report_data: dict):
        """Save lab report analysis"""
        try:
            report = {
                "user_id": uid,
                "report_id": report_data.get("report_id"),
                "file_url": report_data.get("file_url"),
                "analysis": report_data.get("analysis"),
                "uploaded_at": datetime.now().isoformat()
            }
            result = await self.db.lab_reports.insert_one(report)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving lab report: {e}")
            raise
    
    async def get_lab_reports(self, uid: str):
        """Get all lab reports for user"""
        try:
            reports = await self.db.lab_reports.find({
                "user_id": uid
            }).sort("uploaded_at", -1).to_list(length=None)
            return reports
        except Exception as e:
            print(f"Error getting lab reports: {e}")
            raise
    
    # ========== GAMIFICATION OPERATIONS ==========
    async def update_points(self, uid: str, points: int):
        """Update user points"""
        try:
            result = await self.db.gamification.update_one(
                {"user_id": uid},
                {
                    "$inc": {"points": points},
                    "$set": {"updated_at": datetime.now().isoformat()}
                },
                upsert=True
            )
            return result.modified_count > 0 or result.upserted_id is not None
        except Exception as e:
            print(f"Error updating points: {e}")
            raise
    
    async def get_user_points(self, uid: str):
        """Get user's points and streak"""
        try:
            user_points = await self.db.gamification.find_one({"user_id": uid})
            return user_points
        except Exception as e:
            print(f"Error getting points: {e}")
            raise
    
    async def get_leaderboard(self, limit: int = 10):
        """Get top users by points"""
        try:
            users = await self.db.gamification.find({}).sort("points", -1).to_list(length=limit)
            return users
        except Exception as e:
            print(f"Error getting leaderboard: {e}")
            raise


    async def delete_lab_report(self, uid: str, report_id: str):
        """Delete a lab report analysis"""
        try:
            result = await self.db.lab_reports.delete_one({
                "user_id": uid,
                "report_id": report_id
            })
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting report: {e}")
            raise

    async def delete_health_record(self, uid: str, record_id: str):
        """Delete a health record metadata"""
        try:
            # First find it to get file_url
            from bson import ObjectId
            query = {"user_id": uid, "_id": ObjectId(record_id) if len(record_id) == 24 else record_id}
            record = await self.db.health_records.find_one(query)
            
            result = await self.db.health_records.delete_one(query)
            return result.deleted_count > 0, record.get("file_url") if record else None
        except Exception as e:
            print(f"Error deleting record: {e}")
            raise

# Create singleton instance
mongodb_service = MongoDBService()

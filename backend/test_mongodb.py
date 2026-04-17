"""
Test MongoDB Connection
Run this to verify MongoDB is working
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def test_mongodb():
    """Test MongoDB connection"""
    mongodb_url = os.getenv("MONGODB_URL")
    
    if not mongodb_url:
        print("❌ MONGODB_URL not found in .env")
        return
    
    print(f"🔌 Testing connection to MongoDB...")
    print(f"URL: {mongodb_url[:50]}...")  # Show first 50 chars for security
    
    try:
        # Create client
        client = AsyncIOMotorClient(mongodb_url)
        
        # Test ping
        await client.admin.command('ping')
        print("✅ MongoDB Connected Successfully!")
        
        # List databases
        db_list = await client.list_database_names()
        print(f"📚 Databases: {db_list}")
        
        # Get body_debugger database
        db = client.body_debugger
        collections = await db.list_collection_names()
        print(f"📦 Collections in body_debugger: {collections if collections else 'None yet'}")
        
        client.close()
        print("✓ Connection closed")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"\n💡 Troubleshooting tips:")
        print("   1. Check IP is whitelisted: https://cloud.mongodb.com/")
        print("   2. Wait 1-2 minutes after adding IP")
        print("   3. Verify username and password are correct")
        print("   4. Check cluster is running")
        print("   5. Check internet connection")

if __name__ == "__main__":
    asyncio.run(test_mongodb())

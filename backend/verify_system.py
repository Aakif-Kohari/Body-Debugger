import asyncio
import httpx
import os
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
# Use a fresh email every time
TEST_USER = {
    "email": f"final_test_{datetime.now().strftime('%H%M%S')}@googlecloud.ai",
    "password": "final_verification_2025",
    "name": "Quality Assurance Bot",
    "healthGoals": ["100% Stability", "AI Verification"]
}

async def verify_system():
    print("=" * 60)
    print("FINAL SUCCESS VERIFICATION - BODY DEBUGGER")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Auth
        print("\n[TEST 1] Authentication (JWT)")
        try:
            reg_resp = await client.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
            reg_resp.raise_for_status()
            token = reg_resp.json()["access_token"]
            uid = reg_resp.json()["user"]["id"]
            headers = {"Authorization": f"Bearer {token}"}
            print(f"SUCCESS: Identity Verified (UID: {uid})")
        except Exception as e:
            print(f"FAILED: Auth error: {e}")
            return

        # 2. Custom Goals
        print("\n[TEST 2] Custom Goals Persistence")
        try:
            # TRYING BOTH /api/auth/goals and /api/goals (in case of prefix issues)
            goal_data = {"water_ml": 2800, "sleep_hours": 9}
            resp = await client.put(f"{BASE_URL}/api/auth/goals", json=goal_data, headers=headers)
            if resp.status_code == 404:
                print("RETRIED: Path /api/auth/goals 404'd, trying /api/goals...")
                resp = await client.put(f"{BASE_URL}/api/goals", json=goal_data, headers=headers)
            
            resp.raise_for_status()
            print(f"SUCCESS: Goals saved: {resp.json().get('goals')}")
        except Exception as e:
            print(f"FAILED: Goals error: {e}")

        # 3. Gamification
        print("\n[TEST 3] Gamification Engine")
        try:
            await asyncio.sleep(1) # wait for stabilization
            # Log food (50 pts)
            print("Logging food...")
            await client.post(f"{BASE_URL}/api/food/log", json={"meal_description": "protein shake", "meal_type": "breakfast"}, headers=headers)
            
            # Check points
            p_resp = await client.get(f"{BASE_URL}/api/gamification/points", headers=headers)
            p_resp.raise_for_status()
            pts = p_resp.json().get("points", 0)
            print(f"SUCCESS: Current Points: {pts}")
            if pts < 50:
                print("WARNING: Points did not increment as expected.")
        except Exception as e:
            print(f"FAILED: Points error: {e}")

        # 4. Deletion Record
        print("\n[TEST 4] Lifecycle Deletion")
        try:
            # Upload
            files = {"file": ("ghost.txt", b"delete me", "text/plain")}
            u_resp = await client.post(f"{BASE_URL}/api/reports/records/upload", files=files, data={"record_type": "notes", "label": "Trash"}, headers=headers)
            rid = u_resp.json()["record_id"]
            print(f"Item created with ID: {rid}")
            
            # Delete
            d_resp = await client.delete(f"{BASE_URL}/api/reports/records/{rid}", headers=headers)
            d_resp.raise_for_status()
            print(f"SUCCESS: Record purged.")
        except Exception as e:
            print(f"FAILED: Deletion error: {e}")

    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(verify_system())

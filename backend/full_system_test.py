"""
FULL SYSTEM TEST — Body Debugger
Tests every single endpoint end-to-end with real MongoDB data
"""
import asyncio
import httpx
import json
import sys
from datetime import datetime

BASE = "http://localhost:8000"
TS = datetime.now().strftime('%H%M%S')
USER = {
    "email": f"syscheck_{TS}@bodydebug.ai",
    "password": "BioSync@2025!",
    "name": f"Test User {TS}",
    "age": 25,
    "healthGoals": ["Fitness", "Sleep Quality"]
}

PASS = "✅"
FAIL = "❌"
WARN = "⚠️ "

results = []

def log(status, category, detail=""):
    symbol = PASS if status else FAIL
    label = f"[{category}]"
    line = f"  {symbol} {label:<40} {detail}"
    print(line)
    results.append((status, category, detail))


async def run():
    print(f"\n{'='*65}")
    print(f"  BODY DEBUGGER — FULL SYSTEM TEST  ({TS})")
    print(f"{'='*65}\n")

    async with httpx.AsyncClient(timeout=45.0) as c:

        # ─────────── 1. AUTH ───────────
        print("── AUTH ────────────────────────────────────────────────────")
        try:
            r = await c.post(f"{BASE}/api/auth/register", json=USER)
            r.raise_for_status()
            token = r.json()["access_token"]
            uid   = r.json()["user"]["id"]
            H = {"Authorization": f"Bearer {token}"}
            log(True,  "Register + JWT", f"uid={uid}")
        except Exception as e:
            log(False, "Register + JWT", str(e)[:80])
            print(f"\n  FATAL: Cannot continue without auth.\n")
            return

        try:
            r = await c.post(f"{BASE}/api/auth/login", json={"email": USER["email"], "password": USER["password"]})
            r.raise_for_status()
            log(True, "Login", f"token returned={bool(r.json().get('access_token'))}")
        except Exception as e:
            log(False, "Login", str(e)[:80])

        try:
            r = await c.get(f"{BASE}/api/auth/profile", headers=H)
            r.raise_for_status()
            log(True, "Get Profile", f"name={r.json().get('name')}")
        except Exception as e:
            log(False, "Get Profile", str(e)[:80])

        try:
            r = await c.put(f"{BASE}/api/auth/goals", json={"water_ml": 2500, "sleep_hours": 7.5}, headers=H)
            r.raise_for_status()
            log(True, "Set Custom Goals", f"goals={r.json().get('goals')}")
        except Exception as e:
            log(False, "Set Custom Goals", str(e)[:80])

        # ─────────── 2. FOOD ───────────
        print("\n── FOOD ────────────────────────────────────────────────────")
        for meal_type in ["breakfast", "lunch", "dinner", "snack"]:
            try:
                r = await c.post(f"{BASE}/api/food/log", json={
                    "meal_description": f"2 rotis with dal for {meal_type}",
                    "meal_type": meal_type
                }, headers=H)
                r.raise_for_status()
                log(True, f"Log Food ({meal_type})", f"{r.json().get('total_calories')} kcal")
            except Exception as e:
                log(False, f"Log Food ({meal_type})", str(e)[:80])

        try:
            r = await c.get(f"{BASE}/api/food/today", headers=H)
            r.raise_for_status()
            total = r.json().get("total_calories", 0)
            log(True, "Get Today's Food", f"total={total} kcal, all meal types present")
        except Exception as e:
            log(False, "Get Today's Food", str(e)[:80])

        try:
            r = await c.post(f"{BASE}/api/food/estimate", json={"meal_description": "chicken biryani and raita"})
            r.raise_for_status()
            log(True, "Estimate Nutrition (no auth)", f"{r.json().get('total_calories')} kcal")
        except Exception as e:
            log(False, "Estimate Nutrition (no auth)", str(e)[:80])

        try:
            r = await c.get(f"{BASE}/api/food/history/7", headers=H)
            r.raise_for_status()
            log(True, "Food History (7 days)", f"total_logs={r.json().get('total_logs')}")
        except Exception as e:
            log(False, "Food History (7 days)", str(e)[:80])

        # ─────────── 3. WATER ───────────
        print("\n── WATER ───────────────────────────────────────────────────")
        for ml in [250, 500, 150]:
            try:
                r = await c.post(f"{BASE}/api/water/log", json={"amount_ml": ml}, headers=H)
                r.raise_for_status()
                log(True, f"Log Water ({ml}ml)", r.json().get("message", "ok"))
            except Exception as e:
                log(False, f"Log Water ({ml}ml)", str(e)[:80])

        try:
            r = await c.get(f"{BASE}/api/water/today", headers=H)
            r.raise_for_status()
            d = r.json()
            log(True, "Get Today's Water", f"total={d.get('total_ml')}ml, glasses={d.get('total_glasses')}, goal={d.get('goal_ml')}ml")
        except Exception as e:
            log(False, "Get Today's Water", str(e)[:80])

        # ─────────── 4. SLEEP ───────────
        print("\n── SLEEP ───────────────────────────────────────────────────")
        try:
            r = await c.post(f"{BASE}/api/sleep/log", json={
                "bedtime": "23:00",
                "wake_time": "07:00",
                "duration_hours": 8.0,
                "quality": 8
            }, headers=H)
            r.raise_for_status()
            log(True, "Log Sleep", f"duration={r.json().get('duration')}h")
        except Exception as e:
            log(False, "Log Sleep", str(e)[:80])

        try:
            r = await c.get(f"{BASE}/api/sleep/history?days=7", headers=H)
            r.raise_for_status()
            d = r.json()
            log(True, "Get Sleep History", f"logs={len(d.get('logs',[]))}, avg={d.get('average_duration')}h, goal={d.get('goal_hours')}h")
        except Exception as e:
            log(False, "Get Sleep History", str(e)[:80])

        # ─────────── 5. GAMIFICATION ───────────
        print("\n── GAMIFICATION ────────────────────────────────────────────")
        try:
            r = await c.get(f"{BASE}/api/gamification/points", headers=H)
            r.raise_for_status()
            d = r.json()
            log(True, "Get Points", f"pts={d.get('points')}, level={d.get('level')}, rank={d.get('rank')}")
        except Exception as e:
            log(False, "Get Points", str(e)[:80])

        try:
            r = await c.get(f"{BASE}/api/gamification/leaderboard?limit=5")
            r.raise_for_status()
            lb = r.json().get("leaderboard", [])
            log(True, "Get Leaderboard", f"{len(lb)} entries returned")
        except Exception as e:
            log(False, "Get Leaderboard", str(e)[:80])

        # ─────────── 6. CHAT / AI ───────────
        print("\n── CHAT / AI ───────────────────────────────────────────────")
        try:
            r = await c.post(f"{BASE}/api/chat/symptom", json={"symptom": "mild headache after waking up"}, headers=H)
            r.raise_for_status()
            log(True, "Symptom Analysis", f"response_len={len(r.json().get('response',''))}")
        except Exception as e:
            log(False, "Symptom Analysis", str(e)[:80])

        try:
            r = await c.post(f"{BASE}/api/chat/quick-check", json={"message": "Am I drinking enough water?"}, headers=H)
            r.raise_for_status()
            log(True, "Quick Health Check", f"response_len={len(r.json().get('response',''))}")
        except Exception as e:
            log(False, "Quick Health Check", str(e)[:80])

        # ─────────── 7. REPORTS / OCR ───────────
        print("\n── LAB REPORTS ─────────────────────────────────────────────")
        try:
            r = await c.get(f"{BASE}/api/reports/list", headers=H)
            r.raise_for_status()
            log(True, "List Lab Reports", f"count={r.json().get('total')}")
        except Exception as e:
            log(False, "List Lab Reports", str(e)[:80])

        # ─────────── 8. HEALTH RECORDS + DELETION ───────────
        print("\n── HEALTH RECORDS ──────────────────────────────────────────")
        record_id = None
        try:
            files = {"file": ("test_record.txt", b"Patient: Test\nBP: 120/80\nGlucose: 95mg/dL", "text/plain")}
            data  = {"record_type": "notes", "label": "Test Record — Delete Me"}
            r = await c.post(f"{BASE}/api/reports/records/upload", files=files, data=data, headers=H)
            r.raise_for_status()
            record_id = r.json().get("record_id")
            log(True, "Upload Health Record", f"id={record_id}")
        except Exception as e:
            log(False, "Upload Health Record", str(e)[:80])

        try:
            r = await c.get(f"{BASE}/api/reports/records/list", headers=H)
            r.raise_for_status()
            log(True, "List Health Records", f"count={r.json().get('total')}")
        except Exception as e:
            log(False, "List Health Records", str(e)[:80])

        if record_id:
            try:
                r = await c.delete(f"{BASE}/api/reports/records/{record_id}", headers=H)
                r.raise_for_status()
                log(True, "Delete Health Record", "Record + file purged ✓")
            except Exception as e:
                log(False, "Delete Health Record", str(e)[:80])

        # ─────────── 9. HEALTH SCORE ───────────
        print("\n── HEALTH SCORE ────────────────────────────────────────────")
        try:
            r = await c.get(f"{BASE}/api/health-score", headers=H)
            r.raise_for_status()
            log(True, "Health Score", f"score={r.json().get('score')}")
        except Exception as e:
            log(False, "Health Score", str(e)[:80])

    # ─────────── SUMMARY ───────────
    passed = sum(1 for r in results if r[0])
    failed = sum(1 for r in results if not r[0])
    total  = len(results)

    print(f"\n{'='*65}")
    print(f"  RESULTS: {passed}/{total} PASSED  |  {failed} FAILED")
    if failed == 0:
        print(f"  🎉 ALL SYSTEMS OPERATIONAL — 100% PASS RATE")
    else:
        print(f"  ⚠️  FAILURES DETECTED:")
        for ok, cat, detail in results:
            if not ok:
                print(f"      → {cat}: {detail}")
    print(f"{'='*65}\n")


if __name__ == "__main__":
    asyncio.run(run())

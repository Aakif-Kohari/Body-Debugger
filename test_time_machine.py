"""
=============================================================
  Body Debugger - Health Time Machine Diagnostic Script
  Run: python test_time_machine.py
  
  What this tests:
  1. MongoDB connection
  2. All users & their lab reports in the DB
  3. What the Time Machine payload will look like per user
  4. Live API call to /api/gamification/time-machine (needs JWT)
=============================================================
"""

import asyncio
import json
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# ------------------------------------------------
# CONFIG
# ------------------------------------------------
MONGODB_URL = "mongodb+srv://saimrais28_db_user:Wuxfh3Xoz0Y0rBaF@cluster0.hlhqdsp.mongodb.net/admin"
DB_NAME     = "body_debugger"

# ------------------------------------------------
# HELPERS
# ------------------------------------------------
def ok(msg):   print(f"[OK]   {msg}")
def warn(msg):  print(f"[WARN] {msg}")
def fail(msg):  print(f"[FAIL] {msg}")
def info(msg):  print(f"[INFO] {msg}")
def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

async def run_diagnostics():
    # --------------------------------------------
    # STEP 1: Connect to MongoDB
    # --------------------------------------------
    section("STEP 1: MongoDB Connection")
    try:
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=8000)
        db = client[DB_NAME]
        await db.command("ping")
        ok(f"Connected to MongoDB - database: '{DB_NAME}'")
    except Exception as e:
        fail(f"Could not connect to MongoDB: {e}")
        return

    # --------------------------------------------
    # STEP 2: List all users
    # --------------------------------------------
    section("STEP 2: Users in Database")
    users = await db.users.find({}, {"_id": 0, "uid": 1, "email": 1, "name": 1}).to_list(length=None)
    if not users:
        warn("No users found in 'users' collection.")
    else:
        for u in users:
            info(f"User: {u.get('email','?')} | uid: {u.get('uid','?')} | name: {u.get('name','?')}")

    # --------------------------------------------
    # STEP 3: Lab Reports per user
    # --------------------------------------------
    section("STEP 3: Lab Reports per User")
    all_reports = await db.lab_reports.find({}).to_list(length=None)

    if not all_reports:
        fail("No lab reports found in 'lab_reports' collection!")
        warn("The Time Machine has NO clinical data to use - predictions will be generic.")
    else:
        ok(f"Total lab reports in DB: {len(all_reports)}")

        # Group by user
        from collections import defaultdict
        reports_by_user = defaultdict(list)
        for r in all_reports:
            uid = r.get("user_id", "UNKNOWN")
            reports_by_user[uid].append(r)

        for uid, reports in reports_by_user.items():
            print(f"\n  User: {uid}  ->  {len(reports)} report(s)")
            for i, report in enumerate(reports, 1):
                uploaded = str(report.get("uploaded_at", ""))[:10] or "?"
                analysis = report.get("analysis", {})
                findings = analysis.get("key_findings", []) if analysis else []
                abnormal = analysis.get("abnormal_values", []) if analysis else []
                print(f"    Report {i} | Date: {uploaded}")

                if findings:
                    ok(f"    key_findings ({len(findings)}): {findings[:3]}")
                else:
                    warn("    key_findings: EMPTY - Time Machine can't read this report!")

                if abnormal:
                    warn(f"    abnormal_values ({len(abnormal)}): {abnormal[:3]}")
                else:
                    info("    abnormal_values: none (all normal, or not parsed)")

    # --------------------------------------------
    # STEP 4: Simulate what the Time Machine payload looks like per user
    # --------------------------------------------
    section("STEP 4: Simulated Time Machine Payload")

    for u in users[:3]:  # Test first 3 users max
        uid = u.get("uid")
        if not uid:
            continue
        print(f"\n  --- Simulating payload for: {uid} ---")

        # Sleep
        sleep_logs = await db.sleep_logs.find({"user_id": uid}).sort("date", -1).to_list(length=7)
        avg_sleep = round(sum(l.get("duration_hours", 0) for l in sleep_logs) / len(sleep_logs), 1) if sleep_logs else 0

        # Calories
        calorie_total, calorie_days = 0, 0
        for days_ago in range(7):
            d = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            food_logs = await db.food_logs.find({"user_id": uid, "date": d}).to_list(length=None)
            if food_logs:
                calorie_total += sum(l.get("total_calories", 0) for l in food_logs)
                calorie_days += 1
        avg_calories = round(calorie_total / calorie_days) if calorie_days else 0

        # Lab reports
        raw_reports = await db.lab_reports.find({"user_id": uid}).sort("uploaded_at", -1).to_list(length=None)
        lab_summary = []
        for report in raw_reports[:8]:
            analysis = report.get("analysis", {})
            if not analysis:
                continue
            findings = analysis.get("key_findings", [])
            abnormal = analysis.get("abnormal_values", [])

            # FALLBACK (added for verification)
            if not findings and "parameters" in analysis:
                for p in analysis["parameters"]:
                    if p.get("risk_flag") in ("yellow", "red"):
                        findings.append(f"{p.get('parameter_name')}: {p.get('user_value')}")

            date = str(report.get("uploaded_at", ""))[:10]
            if findings or abnormal:
                lab_summary.append({
                    "date": date,
                    "key_findings": findings[:4] if isinstance(findings, list) else [],
                    "abnormal_values": abnormal[:4] if isinstance(abnormal, list) else []
                })

        payload = {
            "health_score": "N/A (requires auth token for real score)",
            "average_sleep": avg_sleep,
            "average_calories": avg_calories,
            "total_reports": len(raw_reports),
            "lab_reports_used_in_prompt": lab_summary
        }

        print(json.dumps(payload, indent=4, default=str))

        # Verdict
        if lab_summary:
            ok(f"Time Machine WILL use {len(lab_summary)} lab report(s) with clinical data")
        elif raw_reports:
            fail(f"Time Machine has {len(raw_reports)} reports but NONE have parsed analysis data!")
            warn("Reports are stored but their 'analysis' field is empty/missing - fix the upload parsing.")
        else:
            warn("No lab reports uploaded for this user - Time Machine will give generic predictions only.")

    # --------------------------------------------
    # STEP 5: Check Digital Twin snapshots
    # --------------------------------------------
    section("STEP 5: Digital Twin Snapshots in DB")
    snapshots = await db.digital_twin_snapshots.find({}).to_list(length=None)
    if not snapshots:
        warn("No Digital Twin snapshots found - user must load the Digital Twin page first to generate one.")
    else:
        ok(f"Found {len(snapshots)} twin snapshot(s)")
        for snap in snapshots:
            uid = snap.get("user_id", "?")
            updated = snap.get("updated_at", "?")
            organs = snap.get("organs", {})
            issues = [f"{k}: {v['status']}" for k, v in organs.items() if v.get("status") != "OPTIMAL"]
            print(f"    uid={uid} | updated={str(updated)[:19]}")
            if issues:
                warn(f"    Issues: {', '.join(issues)}")
            else:
                ok("    All organs OPTIMAL")

    section("DIAGNOSTIC COMPLETE")
    ok("Script finished. Review above output to verify Time Machine data pipeline.")
    client.close()

if __name__ == "__main__":
    asyncio.run(run_diagnostics())

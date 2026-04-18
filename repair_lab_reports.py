"""
=============================================================
  Body Debugger - Lab Report Data Repair Script
  Run: python repair_lab_reports.py
  
  What this does:
  1. Scans all lab reports in MongoDB.
  2. If 'key_findings' is missing but 'parameters' list exists:
     - Extracts all abnormal markers (yellow/red flags).
     - Populates 'key_findings' and 'abnormal_values'.
     - Updates the document in the database.
=============================================================
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# ------------------------------------------------
# CONFIG
# ------------------------------------------------
MONGODB_URL = "mongodb+srv://saimrais28_db_user:Wuxfh3Xoz0Y0rBaF@cluster0.hlhqdsp.mongodb.net/admin"
DB_NAME     = "body_debugger"

async def repair_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    print(f"Scanning 'lab_reports' collection for missing clinical summaries...")
    
    cursor = db.lab_reports.find({})
    count = 0
    updated = 0
    
    async for report in cursor:
        rid = report.get("report_id", "Unknown")
        uid = report.get("user_id", "Unknown")
        analysis = report.get("analysis", {})
        
        # Check if already has findings or if they are empty
        findings = analysis.get("key_findings")
        if isinstance(findings, list) and len(findings) > 0:
            continue # Already repaired or correctly analyzed
            
        count += 1
        parameters = analysis.get("parameters", [])
        
        if not parameters:
            print(f"  [-] Report {rid} has no parameters to extract from. Skipping.")
            continue
            
        # Extract findings
        findings = []
        abnormal = []
        
        for p in parameters:
            flag = p.get("risk_flag", "green")
            name = p.get("parameter_name", "Unknown")
            val  = p.get("user_value", "N/A")
            
            if flag in ("yellow", "red"):
                findings.append(f"{name} is {flag} ({val})")
                abnormal.append(f"{name}: {val} [{flag.upper()}]")
        
        if not findings:
            findings = ["All biomarkers within normal range."]
            
        # Update DB
        res = await db.lab_reports.update_one(
            {"_id": report["_id"]},
            {
                "$set": {
                    "analysis.key_findings": findings,
                    "analysis.abnormal_values": abnormal
                }
            }
        )
        
        if res.modified_count > 0:
            print(f"  [+] Repaired Report {rid} for User {uid}")
            updated += 1
            
    print(f"\nRepair complete!")
    print(f"Total reports analyzed: {count}")
    print(f"Total reports repaired: {updated}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(repair_data())

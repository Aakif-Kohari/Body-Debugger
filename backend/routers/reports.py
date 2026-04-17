"""
A4 & A8 - Lab Report Translator & Health Records Router
Handles report upload, analysis, and health record management
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List
import io
import json
from datetime import datetime
import uuid

from services.ocr_service import ocr_service
from services.gemini_service import gemini_service
from services.storage_service import storage_service
from models.report import (
    LabReportUploadResponse,
    LabReportAnalysis,
    BloodParameterValue,
    HealthRecordUpload,
    HealthRecordResponse
)

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Placeholder for auth dependency - will be provided by Person B
def get_current_user(authorization: str = None) -> str:
    """Placeholder for Firebase auth verification"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Person B will implement actual token verification
    return "user_id_placeholder"

# ========== A4: LAB REPORT TRANSLATOR ==========

@router.post("/upload", response_model=dict)
async def upload_lab_report(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    A4 - Upload and analyze a blood lab report
    
    1. Accept file upload (image or PDF)
    2. Extract text using OCR service
    3. Analyze with Gemini API
    4. Save to Firestore
    5. Return structured analysis
    """
    try:
        # Read file bytes
        file_bytes = await file.read()
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Determine file type
        filename = file.filename.lower()
        if filename.endswith('.pdf'):
            file_type = 'pdf'
        elif filename.endswith(('.jpg', '.jpeg', '.png')):
            file_type = 'image'
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, JPG, or PNG")
        
        # Step 1: Extract text using OCR
        print(f"[A4] Extracting text from {file_type}...")
        try:
            raw_text = ocr_service.extract_text(file_bytes, file_type)
            if not raw_text or len(raw_text.strip()) < 10:
                raise HTTPException(
                    status_code=400, 
                    detail="Could not extract meaningful text from file. Try a clearer image."
                )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"OCR failed: {str(e)}")
        
        # Step 2: Analyze with Gemini
        print(f"[A4] Analyzing report with Gemini...")
        try:
            analysis_data = gemini_service.analyze_lab_report(raw_text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
        
        # Step 3: Upload file to Firebase Storage
        print(f"[A4] Uploading file to Firebase Storage...")
        try:
            report_id = str(uuid.uuid4())[:8]
            storage_path = storage_service.upload_file(
                file_bytes, 
                directory=f"users/{user_id}/reports",
                filename=f"{report_id}_{filename}",
                content_type=file.content_type
            )
            file_url = storage_service.get_public_url(storage_path)
        except Exception as e:
            print(f"Warning: File upload failed: {str(e)}")
            file_url = None
        
        # Step 4: Save analysis to Firestore (Person B will implement this)
        # For now, return the analysis
        print(f"[A4] Report analysis complete. ID: {report_id}")
        
        # Build response
        response = {
            "report_id": report_id,
            "uploaded_at": datetime.now().isoformat(),
            "file_url": file_url,
            "raw_text_preview": raw_text[:200] + ("..." if len(raw_text) > 200 else ""),
            "analysis": analysis_data,
            "status": "success"
        }
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[A4] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/list")
async def list_reports(user_id: str = Depends(get_current_user)):
    """
    List all reports for the current user
    (Person B will implement Firestore query)
    """
    return {
        "reports": [],
        "message": "Firestore integration pending - Person B task"
    }

@router.get("/{report_id}")
async def get_report(report_id: str, user_id: str = Depends(get_current_user)):
    """
    Get a specific report's analysis
    (Person B will implement Firestore query)
    """
    return {
        "report_id": report_id,
        "message": "Firestore integration pending - Person B task"
    }

# ========== A8: HEALTH RECORDS VAULT ==========

@router.post("/records/upload", response_model=dict)
async def upload_health_record(
    file: UploadFile = File(...),
    record_type: str = Form(...),  # "prescription", "report", "notes", etc.
    label: str = Form(...),         # User-friendly name
    user_id: str = Depends(get_current_user)
):
    """
    A8 - Upload a health record (prescription, past report, doctor notes)
    """
    try:
        file_bytes = await file.read()
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Validate file type (documents and images only)
        allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}
        filename = file.filename.lower()
        ext = None
        for allowed in allowed_extensions:
            if filename.endswith(allowed):
                ext = allowed
                break
        
        if not ext:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Upload to Firebase Storage
        record_id = str(uuid.uuid4())[:8]
        storage_path = storage_service.upload_file(
            file_bytes,
            directory=f"users/{user_id}/records",
            filename=f"{record_id}_{record_type}_{filename}",
            content_type=file.content_type
        )
        file_url = storage_service.get_public_url(storage_path)
        
        # Save metadata to Firestore (Person B will implement)
        response = {
            "record_id": record_id,
            "type": record_type,
            "label": label,
            "file_url": file_url,
            "uploaded_at": datetime.now().isoformat(),
            "status": "success"
        }
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/records/list")
async def list_health_records(user_id: str = Depends(get_current_user)):
    """
    List all health records for the user
    """
    return {
        "records": [],
        "message": "Firestore integration pending - Person B task"
    }

@router.delete("/records/{record_id}")
async def delete_health_record(record_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete a health record
    """
    return {
        "message": "Firestore integration pending - Person B task"
    }

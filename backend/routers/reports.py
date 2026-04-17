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
from services.mongodb_service import mongodb_service
from models.report import (
    LabReportUploadResponse,
    LabReportAnalysis,
    BloodParameterValue,
    HealthRecordUpload,
    HealthRecordResponse
)
from routers.auth import get_current_user_id
from utils.serializer import serialize_doc, serialize_docs

router = APIRouter(prefix="/api/reports", tags=["reports"])

# ========== A4: LAB REPORT TRANSLATOR ==========

@router.post("/upload", response_model=dict)
async def upload_lab_report(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
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
        
        # Step 4: Save analysis to MongoDB
        try:
            await mongodb_service.save_lab_report(
                uid=user_id,
                report_data={
                    "report_id": report_id,
                    "file_url": file_url,
                    "analysis": analysis_data
                }
            )
            print(f"[A4] Report metadata saved to MongoDB")
            
            # Award points
            from services.gamification_service import gamification_service
            await gamification_service.award_points(user_id, "lab_report")
        except Exception as e:
            print(f"[A4] Warning: MongoDB save failed: {str(e)}")
        
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
async def list_reports(user_id: str = Depends(get_current_user_id)):
    """
    List all reports for the current user
    Retrieves from MongoDB
    """
    try:
        reports = await mongodb_service.get_lab_reports(user_id)
        
        return {
            "reports": serialize_docs(reports),
            "total": len(reports),
            "status": "success"
        }
    except Exception as e:
        print(f"[A4] Error fetching reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

@router.get("/{report_id}")
async def get_report(report_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Get a specific report's analysis
    Retrieves from MongoDB
    """
    try:
        # Get all reports for user and find the matching one
        reports = await mongodb_service.get_lab_reports(user_id)
        report = next((r for r in reports if r.get("report_id") == report_id), None)
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "report": serialize_doc(report),
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[A4] Error fetching report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch report: {str(e)}")

# ========== A8: HEALTH RECORDS VAULT ==========

@router.post("/records/upload", response_model=dict)
async def upload_health_record(
    file: UploadFile = File(...),
    record_type: str = Form(...),  # "prescription", "report", "notes", etc.
    label: str = Form(...),         # User-friendly name
    user_id: str = Depends(get_current_user_id)
):
    """
    A8 - Upload a health record (prescription, past report, doctor notes)
    """
    try:
        file_bytes = await file.read()
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Validate file type (documents and images only)
        allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt', '.csv'}
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
        
        # Save metadata to MongoDB
        try:
            mongo_id = await mongodb_service.save_health_record(
                uid=user_id,
                record_data={
                    "record_type": record_type,
                    "label": label,
                    "file_url": file_url
                }
            )
            print(f"[A8] Health record saved to MongoDB with ID: {mongo_id}")
        except Exception as e:
            print(f"[A8] Warning: MongoDB save failed: {str(e)}")
            mongo_id = record_id
        
        response = {
            "record_id": mongo_id,
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
async def list_health_records(user_id: str = Depends(get_current_user_id)):
    """
    List all health records for the user
    Retrieves from MongoDB
    """
    try:
        records = await mongodb_service.get_health_records(user_id)
        
        return {
            "records": serialize_docs(records),
            "total": len(records),
            "status": "success"
        }
    except Exception as e:
        print(f"[A8] Error fetching records: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch records: {str(e)}")

@router.delete("/records/{record_id}")
async def delete_health_record(record_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Delete a health record permanently
    """
    try:
        # Delete from MongoDB and get the file URL
        success, file_url = await mongodb_service.delete_health_record(user_id, record_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Health record not found")
        
        # Clean up the file from storage
        if file_url:
            storage_service.delete_file(file_url)
            
        return {"status": "success", "message": "Record and associated file deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[A8] Deletion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

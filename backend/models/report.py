from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Lab Report Models
class BloodParameterValue(BaseModel):
    """Individual blood parameter result"""
    parameter_name: str
    user_value: str
    normal_range: str
    plain_english_meaning: str
    lifestyle_tip: str
    risk_flag: str  # "green", "yellow", "red"

class LabReportAnalysis(BaseModel):
    """Complete lab report analysis from Gemini"""
    parameters: List[BloodParameterValue]
    summary_for_doctor: str
    overall_health_assessment: str
    recommendations: List[str]

class LabReportUploadResponse(BaseModel):
    """Response after uploading and analyzing a lab report"""
    report_id: str
    uploaded_at: datetime
    file_url: str
    analysis: LabReportAnalysis
    
class ReportListResponse(BaseModel):
    """List of user's reports"""
    reports: List[dict]

class HealthRecordUpload(BaseModel):
    """Health record file upload"""
    record_type: str  # "prescription", "report", "notes", etc.
    label: str  # User-friendly name
    
class HealthRecordResponse(BaseModel):
    """Response for uploaded health record"""
    record_id: str
    type: str
    file_url: str
    label: str
    uploaded_at: datetime

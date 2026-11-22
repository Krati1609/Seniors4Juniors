from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AdminSeniorVerificationRequest(BaseModel):
    is_verified: bool
    notes: Optional[str] = Field(default="", max_length=500)

class AdminContentActionRequest(BaseModel):
    action: str = Field(..., pattern=r'^(delete|hide|restore)$')
    reason: Optional[str] = Field(default="", max_length=500)

class AdminReportResolveRequest(BaseModel):
    status: str = Field(..., pattern=r'^(resolved|dismissed)$')
    action_taken: str = Field(..., min_length=3, max_length=500)

class AuditLogResponse(BaseModel):
    id: str
    admin_id: str
    admin_email: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Dict[str, Any]
    timestamp: str

class AdminStatsResponse(BaseModel):
    total_users: int
    total_juniors: int
    total_seniors: int
    verified_seniors: int
    pending_senior_verifications: int
    total_questions: int
    total_answers: int
    total_communities: int
    total_job_trends: int
    pending_reports: int

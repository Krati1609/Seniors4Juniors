from pydantic import BaseModel, Field
from typing import Optional

class ReportCreate(BaseModel):
    target_type: str = Field(..., pattern=r'^(question|answer|user|post)$')
    target_id: str
    reason: str = Field(..., min_length=5, max_length=500)
    details: Optional[str] = Field(default="", max_length=1000)

class ReportResponse(BaseModel):
    id: str
    reported_by: str
    reported_by_name: str
    target_type: str
    target_id: str
    target_title_or_snippet: Optional[str] = ""
    reason: str
    details: Optional[str] = ""
    status: str  # 'pending', 'resolved', 'dismissed'
    action_taken: Optional[str] = None
    created_at: str

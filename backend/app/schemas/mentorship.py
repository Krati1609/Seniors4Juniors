from pydantic import BaseModel, Field
from typing import Optional, List

class MentorshipSlotCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)  # e.g., "Mock Interview - DSA & System Design" or "Resume Review"
    session_type: str = Field(..., pattern=r'^(mentorship|mock_interview|both)$')
    day_of_week: str = Field(..., min_length=3, max_length=20)  # e.g., "Saturday", "Sunday"
    time_slot: str = Field(..., min_length=3, max_length=50)    # e.g., "6:00 PM - 7:00 PM IST"
    description: Optional[str] = Field(default="", max_length=1000)

class MentorshipSlotResponse(BaseModel):
    id: str
    senior_id: str
    senior_name: str
    senior_role: str
    senior_branch: str
    senior_college: str
    senior_verified: bool
    average_rating: float = 0.0
    ratings_count: int = 0
    title: str
    session_type: str
    day_of_week: str
    time_slot: str
    description: Optional[str] = ""
    is_active: bool = True
    created_at: str

class SessionRequestCreate(BaseModel):
    slot_id: str
    date_requested: str  # e.g. "2026-11-28"
    topic_notes: str = Field(..., min_length=10, max_length=1000)
    resume_link: Optional[str] = Field(default="", max_length=500)

class SessionStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r'^(confirmed|rejected|completed|cancelled)$')
    meeting_link: Optional[str] = Field(default=None, max_length=500)

class SeniorFeedbackSubmit(BaseModel):
    technical_score: int = Field(..., ge=1, le=10)
    communication_score: int = Field(..., ge=1, le=10)
    strengths: str = Field(..., min_length=5, max_length=2000)
    areas_for_improvement: str = Field(..., min_length=5, max_length=2000)
    recommended_resources: Optional[str] = Field(default="", max_length=1000)

class JuniorReviewSubmit(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: str = Field(..., min_length=5, max_length=1000)

class MentorshipSessionResponse(BaseModel):
    id: str
    slot_id: str
    slot_title: str
    session_type: str
    senior_id: str
    senior_name: str
    junior_id: str
    junior_name: str
    date_requested: str
    time_slot: str
    topic_notes: str
    resume_link: Optional[str] = ""
    meeting_link: Optional[str] = ""
    status: str  # 'pending', 'confirmed', 'rejected', 'completed', 'cancelled'
    senior_feedback: Optional[dict] = None
    junior_review: Optional[dict] = None
    created_at: str
    updated_at: Optional[str] = None

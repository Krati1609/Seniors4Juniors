from pydantic import BaseModel, Field
from typing import Optional, List

class RoundDetail(BaseModel):
    round_number: int = Field(..., ge=1, le=10)
    round_name: str = Field(..., min_length=2, max_length=100)  # e.g. "Online Assessment", "Technical Round 1", "HR Round"
    question_types: List[str] = Field(..., min_length=1)        # e.g. ["DSA", "System Design", "OS", "Behavioral"]
    questions_asked: str = Field(..., min_length=5, max_length=3000)
    tips: Optional[str] = Field(default="", max_length=1000)

class InterviewExperienceCreate(BaseModel):
    company: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., min_length=2, max_length=100)
    year: int = Field(..., ge=2020, le=2030)
    number_of_rounds: int = Field(..., ge=1, le=10)
    difficulty: str = Field(..., pattern=r'^(Easy|Medium|Hard|Very Hard)$')
    outcome: str = Field(..., pattern=r'^(Selected|Rejected|Waitlisted|Offered)$')
    overall_experience: str = Field(..., min_length=10, max_length=5000)
    rounds: List[RoundDetail] = Field(..., min_length=1)

class InterviewExperienceResponse(BaseModel):
    id: str
    senior_id: str
    senior_name: str
    senior_branch: str
    college_name: str
    company: str
    role: str
    year: int
    number_of_rounds: int
    difficulty: str
    outcome: str
    overall_experience: str
    rounds: List[RoundDetail]
    views_count: int = 0
    created_at: str

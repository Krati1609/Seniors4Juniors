from pydantic import BaseModel, Field
from typing import Optional, List

class JobTrendCreate(BaseModel):
    company: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., min_length=2, max_length=100)
    package_range: str = Field(..., min_length=2, max_length=100)  # e.g., "12 - 18 LPA", "40k/month"
    skills: List[str] = Field(..., min_length=1)
    eligibility: str = Field(..., min_length=3, max_length=500)   # e.g., "B.Tech CSE/IT, CGPA >= 7.5"
    deadline: str = Field(...)                                   # Date string e.g., "2026-12-15"
    category: str = Field(..., pattern=r'^(internship|full-time|hackathon)$')
    application_link: Optional[str] = Field(default="", max_length=500)
    description: Optional[str] = Field(default="", max_length=2000)

class JobTrendResponse(BaseModel):
    id: str
    company: str
    role: str
    package_range: str
    skills: List[str]
    eligibility: str
    deadline: str
    category: str
    application_link: Optional[str] = ""
    description: Optional[str] = ""
    posted_by: str
    posted_by_name: str
    college_name: str
    created_at: str

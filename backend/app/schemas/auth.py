from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
import re

class JuniorRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    college_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    roll_number: str = Field(..., min_length=1, max_length=50)
    enrollment_number: str = Field(..., min_length=1, max_length=50)
    branch: str = Field(..., min_length=2, max_length=100)
    college_year: int = Field(..., ge=1, le=5)
    current_semester: int = Field(..., ge=1, le=10)
    interests: Optional[List[str]] = Field(default_factory=list)
    career_goals: Optional[str] = Field(default="", max_length=500)

    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v) or not re.search(r'\d', v):
            raise ValueError('Password must contain at least one letter and one number')
        return v

class SeniorRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    college_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    roll_number: str = Field(..., min_length=1, max_length=50)
    enrollment_number: str = Field(..., min_length=1, max_length=50)
    branch: str = Field(..., min_length=2, max_length=100)
    college_year: int = Field(..., ge=2, le=5)
    current_semester: int = Field(..., ge=3, le=10)
    areas_of_expertise: Optional[List[str]] = Field(default_factory=list)
    placement_history: Optional[str] = Field(default="", max_length=500)
    mentorship_available: bool = Field(default=True)

    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v) or not re.search(r'\d', v):
            raise ValueError('Password must contain at least one letter and one number')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator('new_password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v) or not re.search(r'\d', v):
            raise ValueError('Password must contain at least one letter and one number')
        return v

class UserResponse(BaseModel):
    id: str
    full_name: str
    college_name: str
    email: str
    roll_number: str
    enrollment_number: str
    branch: str
    college_year: int
    current_semester: int
    role: str  # 'junior', 'senior', 'admin'
    is_verified: bool
    email_verified: bool
    bio: Optional[str] = ""
    interests: Optional[List[str]] = []
    career_goals: Optional[str] = ""
    areas_of_expertise: Optional[List[str]] = []
    placement_history: Optional[str] = ""
    mentorship_available: Optional[bool] = False
    answers_count: Optional[int] = 0
    net_upvotes: Optional[int] = 0
    average_rating: Optional[float] = 0.0
    ratings_count: Optional[int] = 0
    followers_count: Optional[int] = 0
    created_at: Optional[str] = None

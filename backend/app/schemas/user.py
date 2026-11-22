from pydantic import BaseModel, Field
from typing import Optional, List

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    branch: Optional[str] = Field(None, min_length=2, max_length=100)
    current_semester: Optional[int] = Field(None, ge=1, le=10)
    bio: Optional[str] = Field(None, max_length=500)
    # Junior specific
    interests: Optional[List[str]] = None
    career_goals: Optional[str] = Field(None, max_length=500)
    # Senior specific
    areas_of_expertise: Optional[List[str]] = None
    placement_history: Optional[str] = Field(None, max_length=500)
    mentorship_available: Optional[bool] = None

class PublicUserProfile(BaseModel):
    id: str
    full_name: str
    college_name: str
    role: str
    branch: str
    college_year: int
    current_semester: int
    is_verified: bool
    bio: Optional[str] = ""
    # Junior fields
    interests: Optional[List[str]] = []
    career_goals: Optional[str] = ""
    # Senior fields
    areas_of_expertise: Optional[List[str]] = []
    placement_history: Optional[str] = ""
    mentorship_available: Optional[bool] = False
    answers_count: Optional[int] = 0
    net_upvotes: Optional[int] = 0
    average_rating: Optional[float] = 0.0
    ratings_count: Optional[int] = 0
    followers_count: Optional[int] = 0
    is_following: Optional[bool] = False
    created_at: Optional[str] = None

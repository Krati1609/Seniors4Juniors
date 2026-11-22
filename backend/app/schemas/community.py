from pydantic import BaseModel, Field
from typing import Optional, List

class CommunityCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    category: str = Field(..., min_length=2, max_length=50)  # e.g., 'placements', 'academics', 'coding', 'clubs'
    is_private: bool = Field(default=False)

class CommunityResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    college_name: str
    created_by: str
    creator_name: str
    is_private: bool
    members_count: int = 1
    posts_count: int = 0
    is_member: Optional[bool] = False
    user_role: Optional[str] = None  # 'owner', 'moderator', 'member'
    created_at: str

class CommunityPostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=250)
    content: str = Field(..., min_length=5, max_length=5000)

class CommunityCommentCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=1500)

class CommunityCommentResponse(BaseModel):
    id: str
    post_id: str
    author_id: str
    author_name: str
    author_role: str
    content: str
    created_at: str

class CommunityPostResponse(BaseModel):
    id: str
    community_id: str
    author_id: str
    author_name: str
    author_role: str
    title: str
    content: str
    comments_count: int = 0
    comments: Optional[List[CommunityCommentResponse]] = []
    created_at: str

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AnswerCreate(BaseModel):
    content: str = Field(..., min_length=10, max_length=10000)

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=1500)

class CommentResponse(BaseModel):
    id: str
    answer_id: str
    author_id: str
    author_name: str
    author_role: str
    content: str
    created_at: str

class VoteRequest(BaseModel):
    value: int = Field(..., ge=-1, le=1)  # 1 for upvote, -1 for downvote, 0 to revoke

class AnswerResponse(BaseModel):
    id: str
    question_id: str
    senior_id: str
    senior_name: str
    senior_role: str
    senior_branch: str
    senior_year: int
    senior_verified: bool
    content: str
    upvotes: int = 0
    downvotes: int = 0
    net_votes: int = 0
    user_vote: Optional[int] = 0  # current user's vote (1, -1, or 0)
    is_best_answer: bool = False
    comments_count: int = 0
    comments: Optional[List[CommentResponse]] = []
    created_at: str
    updated_at: Optional[str] = None

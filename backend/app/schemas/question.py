from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class QuestionCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=250)
    content: str = Field(..., min_length=10, max_length=5000)
    tags: List[str] = Field(..., min_length=1, max_length=8)
    is_anonymous: bool = Field(default=False)

class QuestionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=250)
    content: Optional[str] = Field(None, min_length=10, max_length=5000)
    tags: Optional[List[str]] = Field(None, min_length=1, max_length=8)

class QuestionResponse(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    is_anonymous: bool
    asker_id: Optional[str] = None
    asker_name: Optional[str] = None
    asker_role: Optional[str] = None
    asker_branch: Optional[str] = None
    college_name: str
    created_at: str
    updated_at: Optional[str] = None
    answers_count: int = 0
    top_answer: Optional[Dict[str, Any]] = None
    best_answer_id: Optional[str] = None
    is_bookmarked: Optional[bool] = False
    views_count: int = 0

class QuestionListResponse(BaseModel):
    questions: List[QuestionResponse]
    total: int
    page: int
    limit: int
    has_more: bool

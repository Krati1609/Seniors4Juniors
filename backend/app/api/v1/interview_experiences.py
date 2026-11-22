from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, get_current_senior, get_optional_user, verify_csrf
from app.core.sanitizer import sanitize_plain_text, sanitize_text, validate_object_id
from app.schemas.interview_experience import (
    InterviewExperienceCreate, InterviewExperienceResponse, RoundDetail
)

router = APIRouter(prefix="/interview-experiences", tags=["Interview Experiences"])

def format_interview_response(exp: dict) -> InterviewExperienceResponse:
    rounds = [
        RoundDetail(
            round_number=r.get("round_number", 1),
            round_name=r.get("round_name", ""),
            question_types=r.get("question_types", []),
            questions_asked=r.get("questions_asked", ""),
            tips=r.get("tips", "")
        ) for r in exp.get("rounds", [])
    ]
    return InterviewExperienceResponse(
        id=str(exp["_id"]),
        senior_id=str(exp.get("senior_id")),
        senior_name=exp.get("senior_name", "Senior"),
        senior_branch=exp.get("senior_branch", ""),
        college_name=exp.get("college_name", ""),
        company=exp.get("company", ""),
        role=exp.get("role", ""),
        year=exp.get("year", 2026),
        number_of_rounds=exp.get("number_of_rounds", len(rounds)),
        difficulty=exp.get("difficulty", "Medium"),
        outcome=exp.get("outcome", "Selected"),
        overall_experience=exp.get("overall_experience", ""),
        rounds=rounds,
        views_count=exp.get("views_count", 0),
        created_at=exp.get("created_at").isoformat() if exp.get("created_at") else ""
    )

@router.get("", response_model=List[InterviewExperienceResponse])
async def list_interview_experiences(
    company: Optional[str] = None,
    role: Optional[str] = None,
    year: Optional[int] = None,
    difficulty: Optional[str] = None,
    outcome: Optional[str] = None,
    college_scope: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """List interview experiences with company, role, year, and difficulty filters."""
    db = get_database()
    query = {"is_deleted": {"$ne": True}}
    
    if current_user and current_user.get("role") != "admin":
        query["college_name"] = current_user["college_name"]
    elif college_scope:
        query["college_name"] = college_scope
        
    if company:
        query["company"] = {"$regex": company, "$options": "i"}
    if role:
        query["role"] = {"$regex": role, "$options": "i"}
    if year:
        query["year"] = year
    if difficulty:
        query["difficulty"] = difficulty
    if outcome:
        query["outcome"] = outcome
        
    cursor = db.interview_experiences.find(query).sort("created_at", -1).limit(50)
    exp_docs = await cursor.to_list(length=50)
    return [format_interview_response(e) for e in exp_docs]

@router.post("", response_model=InterviewExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_interview_experience(
    payload: InterviewExperienceCreate,
    current_senior: dict = Depends(get_current_senior),
    _csrf: None = Depends(verify_csrf)
):
    """Seniors publish interview experiences."""
    db = get_database()
    
    clean_rounds = []
    for r in payload.rounds:
        clean_rounds.append({
            "round_number": r.round_number,
            "round_name": sanitize_plain_text(r.round_name),
            "question_types": [sanitize_plain_text(q) for q in r.question_types],
            "questions_asked": sanitize_text(r.questions_asked),
            "tips": sanitize_text(r.tips) if r.tips else ""
        })
        
    new_exp = {
        "senior_id": current_senior["id"],
        "senior_name": current_senior.get("full_name", "Senior"),
        "senior_branch": current_senior.get("branch", ""),
        "college_name": current_senior["college_name"],
        "company": sanitize_plain_text(payload.company),
        "role": sanitize_plain_text(payload.role),
        "year": payload.year,
        "number_of_rounds": payload.number_of_rounds,
        "difficulty": payload.difficulty,
        "outcome": payload.outcome,
        "overall_experience": sanitize_text(payload.overall_experience),
        "rounds": clean_rounds,
        "views_count": 0,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.interview_experiences.insert_one(new_exp)
    new_exp["_id"] = result.inserted_id
    
    return format_interview_response(new_exp)

@router.get("/{exp_id}", response_model=InterviewExperienceResponse)
async def get_interview_experience_detail(exp_id: str):
    """Get single interview experience detail and increment views."""
    oid = validate_object_id(exp_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found.")
        
    db = get_database()
    exp = await db.interview_experiences.find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found.")
        
    await db.interview_experiences.update_one({"_id": oid}, {"$inc": {"views_count": 1}})
    exp["views_count"] = exp.get("views_count", 0) + 1
    
    return format_interview_response(exp)

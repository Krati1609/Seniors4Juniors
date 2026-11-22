from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, get_optional_user, verify_csrf
from app.core.sanitizer import sanitize_plain_text, sanitize_text, validate_object_id
from app.schemas.job_trend import JobTrendCreate, JobTrendResponse

router = APIRouter(prefix="/job-trends", tags=["Job Trends"])

def format_job_trend_response(j: dict) -> JobTrendResponse:
    return JobTrendResponse(
        id=str(j["_id"]),
        company=j.get("company", ""),
        role=j.get("role", ""),
        package_range=j.get("package_range", ""),
        skills=j.get("skills", []),
        eligibility=j.get("eligibility", ""),
        deadline=j.get("deadline", ""),
        category=j.get("category", "full-time"),
        application_link=j.get("application_link", ""),
        description=j.get("description", ""),
        posted_by=str(j.get("posted_by")),
        posted_by_name=j.get("posted_by_name", "Senior"),
        college_name=j.get("college_name", ""),
        created_at=j.get("created_at").isoformat() if j.get("created_at") else ""
    )

@router.get("", response_model=List[JobTrendResponse])
async def list_job_trends(
    category: Optional[str] = None,
    search: Optional[str] = None,
    college_scope: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """List job trends with category and search filters."""
    db = get_database()
    query = {"is_deleted": {"$ne": True}}
    
    if current_user and current_user.get("role") != "admin":
        # Grouped by college or platform-wide listings
        query["$or"] = [
            {"college_name": current_user["college_name"]},
            {"college_name": "All Colleges"}
        ]
    elif college_scope:
        query["college_name"] = college_scope
        
    if category:
        query["category"] = category.lower()
        
    if search:
        search_clean = sanitize_plain_text(search)
        sub_or = [
            {"company": {"$regex": search_clean, "$options": "i"}},
            {"role": {"$regex": search_clean, "$options": "i"}},
            {"skills": {"$in": [search_clean]}}
        ]
        if "$or" in query:
            query["$and"] = [{"$or": query["$or"]}, {"$or": sub_or}]
            del query["$or"]
        else:
            query["$or"] = sub_or
            
    cursor = db.job_trends.find(query).sort("created_at", -1).limit(50)
    job_docs = await cursor.to_list(length=50)
    
    return [format_job_trend_response(j) for j in job_docs]

@router.post("", response_model=JobTrendResponse, status_code=status.HTTP_201_CREATED)
async def create_job_trend(
    payload: JobTrendCreate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Post an internship, full-time opportunity, or hackathon alert."""
    db = get_database()
    
    clean_skills = [sanitize_plain_text(s) for s in payload.skills if s.strip()]
    new_job = {
        "company": sanitize_plain_text(payload.company),
        "role": sanitize_plain_text(payload.role),
        "package_range": sanitize_plain_text(payload.package_range),
        "skills": clean_skills,
        "eligibility": sanitize_text(payload.eligibility),
        "deadline": sanitize_plain_text(payload.deadline),
        "category": payload.category.lower(),
        "application_link": sanitize_plain_text(payload.application_link),
        "description": sanitize_text(payload.description),
        "posted_by": current_user["id"],
        "posted_by_name": current_user.get("full_name", "Student"),
        "college_name": current_user["college_name"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.job_trends.insert_one(new_job)
    new_job["_id"] = result.inserted_id
    
    return format_job_trend_response(new_job)

@router.delete("/{job_id}")
async def delete_job_trend(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Delete job trend post (author or admin)."""
    oid = validate_object_id(job_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
        
    db = get_database()
    job = await db.job_trends.find_one({"_id": oid})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
        
    if job.get("posted_by") != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")
        
    await db.job_trends.update_one({"_id": oid}, {"$set": {"is_deleted": True}})
    return {"message": "Job listing deleted successfully."}

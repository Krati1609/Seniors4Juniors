from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, verify_csrf
from app.core.sanitizer import sanitize_plain_text, sanitize_text, validate_object_id
from app.schemas.report import ReportCreate, ReportResponse

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    payload: ReportCreate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """File a report against inappropriate questions, answers, community posts, or users."""
    oid = validate_object_id(payload.target_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid target ID.")
        
    db = get_database()
    snippet = ""
    
    # Grab snippet for admin context
    if payload.target_type == "question":
        doc = await db.questions.find_one({"_id": oid})
        if doc:
            snippet = doc.get("title", "")
    elif payload.target_type == "answer":
        doc = await db.answers.find_one({"_id": oid})
        if doc:
            snippet = doc.get("content", "")[:100]
    elif payload.target_type == "user":
        doc = await db.users.find_one({"_id": oid})
        if doc:
            snippet = f"{doc.get('full_name')} ({doc.get('email')})"
    elif payload.target_type == "post":
        doc = await db.community_posts.find_one({"_id": oid})
        if doc:
            snippet = doc.get("title", "")
            
    new_report = {
        "reported_by": current_user["id"],
        "reported_by_name": current_user.get("full_name", "User"),
        "target_type": payload.target_type,
        "target_id": payload.target_id,
        "target_title_or_snippet": snippet,
        "reason": sanitize_plain_text(payload.reason),
        "details": sanitize_text(payload.details) if payload.details else "",
        "status": "pending",
        "action_taken": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.reports.insert_one(new_report)
    new_report["_id"] = result.inserted_id
    
    return ReportResponse(
        id=str(new_report["_id"]),
        reported_by=new_report["reported_by"],
        reported_by_name=new_report["reported_by_name"],
        target_type=new_report["target_type"],
        target_id=new_report["target_id"],
        target_title_or_snippet=new_report["target_title_or_snippet"],
        reason=new_report["reason"],
        details=new_report["details"],
        status=new_report["status"],
        action_taken=new_report["action_taken"],
        created_at=new_report["created_at"].isoformat()
    )

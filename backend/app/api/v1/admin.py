from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_admin, verify_csrf
from app.core.sanitizer import sanitize_plain_text, validate_object_id
from app.schemas.admin import (
    AdminSeniorVerificationRequest, AdminReportResolveRequest,
    AuditLogResponse, AdminStatsResponse
)
from app.schemas.user import PublicUserProfile
from app.schemas.report import ReportResponse
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(current_admin: dict = Depends(get_current_admin)):
    """Retrieve comprehensive platform metrics for admin dashboard."""
    db = get_database()
    
    total_users = await db.users.count_documents({})
    total_juniors = await db.users.count_documents({"role": "junior"})
    total_seniors = await db.users.count_documents({"role": "senior"})
    verified_seniors = await db.users.count_documents({"role": "senior", "is_verified": True})
    pending_verifications = await db.users.count_documents({"role": "senior", "is_verified": False, "verification_pending": True})
    
    total_questions = await db.questions.count_documents({"is_deleted": {"$ne": True}})
    total_answers = await db.answers.count_documents({"is_deleted": {"$ne": True}})
    total_communities = await db.communities.count_documents({"is_deleted": {"$ne": True}})
    total_job_trends = await db.job_trends.count_documents({"is_deleted": {"$ne": True}})
    pending_reports = await db.reports.count_documents({"status": "pending"})
    
    return AdminStatsResponse(
        total_users=total_users,
        total_juniors=total_juniors,
        total_seniors=total_seniors,
        verified_seniors=verified_seniors,
        pending_senior_verifications=pending_verifications,
        total_questions=total_questions,
        total_answers=total_answers,
        total_communities=total_communities,
        total_job_trends=total_job_trends,
        pending_reports=pending_reports
    )

@router.get("/seniors/pending", response_model=List[PublicUserProfile])
async def list_pending_seniors(current_admin: dict = Depends(get_current_admin)):
    """List seniors awaiting verification."""
    db = get_database()
    cursor = db.users.find({
        "role": "senior",
        "is_verified": False
    }).sort("created_at", -1)
    
    seniors = await cursor.to_list(length=100)
    return [
        PublicUserProfile(
            id=str(s["_id"]),
            full_name=s.get("full_name", ""),
            college_name=s.get("college_name", ""),
            role="senior",
            branch=s.get("branch", ""),
            college_year=s.get("college_year", 3),
            current_semester=s.get("current_semester", 5),
            is_verified=False,
            bio=s.get("bio", ""),
            areas_of_expertise=s.get("areas_of_expertise", []),
            placement_history=s.get("placement_history", ""),
            mentorship_available=s.get("mentorship_available", False),
            answers_count=s.get("answers_count", 0),
            net_upvotes=s.get("net_upvotes", 0),
            average_rating=s.get("average_rating", 0.0),
            ratings_count=s.get("ratings_count", 0),
            followers_count=s.get("followers_count", 0),
            created_at=s.get("created_at").isoformat() if s.get("created_at") else None
        ) for s in seniors
    ]

@router.put("/seniors/{senior_id}/verify")
async def verify_senior_status(
    senior_id: str,
    payload: AdminSeniorVerificationRequest,
    current_admin: dict = Depends(get_current_admin),
    _csrf: None = Depends(verify_csrf)
):
    """Admin approves or revokes Verified badge on a senior's profile."""
    oid = validate_object_id(senior_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found.")
        
    db = get_database()
    senior = await db.users.find_one({"_id": oid, "role": "senior"})
    if not senior:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found.")
        
    await db.users.update_one(
        {"_id": oid},
        {"$set": {
            "is_verified": payload.is_verified,
            "verification_pending": False,
            "verified_by_admin": current_admin["email"],
            "verification_updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Also update verified badge on senior's existing answers and mentorship slots
    await db.answers.update_many({"senior_id": senior_id}, {"$set": {"senior_verified": payload.is_verified}})
    await db.mentorship_slots.update_many({"senior_id": senior_id}, {"$set": {"senior_verified": payload.is_verified}})
    
    # Audit log
    action_label = "VERIFY_SENIOR" if payload.is_verified else "REJECT_SENIOR_VERIFICATION"
    await audit_service.log_action(
        admin_id=current_admin["id"],
        admin_email=current_admin["email"],
        action=action_label,
        target_type="user",
        target_id=senior_id,
        details={"senior_name": senior.get("full_name"), "notes": payload.notes, "is_verified": payload.is_verified}
    )
    
    # Notify senior
    notif_msg = "Congratulations! Your senior profile has been verified with the official Verified Badge." if payload.is_verified else "Your senior verification request was reviewed."
    await notification_service.create_notification(
        recipient_id=senior_id,
        sender_id=current_admin["id"],
        sender_name="Platform Administration",
        title="🎓 Profile Verification Update",
        message=notif_msg,
        notification_type="system",
        link=f"/profile/{senior_id}"
    )
    
    return {"message": f"Senior verification status updated to {payload.is_verified}."}

@router.get("/users")
async def list_all_users(
    role: Optional[str] = None,
    college: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin)
):
    """List platform users with filtering."""
    db = get_database()
    query = {}
    if role:
        query["role"] = role
    if college:
        query["college_name"] = {"$regex": college, "$options": "i"}
    if search:
        search_clean = sanitize_plain_text(search)
        query["$or"] = [
            {"full_name": {"$regex": search_clean, "$options": "i"}},
            {"email": {"$regex": search_clean, "$options": "i"}},
            {"roll_number": {"$regex": search_clean, "$options": "i"}}
        ]
        
    skip = (page - 1) * limit
    total = await db.users.count_documents(query)
    cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    return {
        "users": [
            {
                "id": str(u["_id"]),
                "full_name": u.get("full_name", ""),
                "email": u.get("email", ""),
                "college_name": u.get("college_name", ""),
                "role": u.get("role", "junior"),
                "branch": u.get("branch", ""),
                "college_year": u.get("college_year", 1),
                "is_verified": u.get("is_verified", False),
                "is_active": u.get("is_active", True),
                "created_at": u.get("created_at").isoformat() if u.get("created_at") else None
            } for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit
    }

@router.put("/users/{user_id}/status")
async def toggle_user_active_status(
    user_id: str,
    active: bool = Query(...),
    current_admin: dict = Depends(get_current_admin),
    _csrf: None = Depends(verify_csrf)
):
    """Activate or deactivate user account."""
    oid = validate_object_id(user_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    db = get_database()
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    if user.get("role") == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate admin accounts.")
        
    await db.users.update_one({"_id": oid}, {"$set": {"is_active": active}})
    
    if not active:
        # Revoke tokens immediately
        await db.refresh_tokens.delete_many({"user_id": user_id})
        
    await audit_service.log_action(
        admin_id=current_admin["id"],
        admin_email=current_admin["email"],
        action="DEACTIVATE_USER" if not active else "ACTIVATE_USER",
        target_type="user",
        target_id=user_id,
        details={"user_email": user.get("email"), "new_active_status": active}
    )
    
    return {"message": f"User status set to active={active}."}

@router.get("/reports", response_model=List[ReportResponse])
async def list_reports(
    status_filter: Optional[str] = Query(None, pattern=r'^(pending|resolved|dismissed)$'),
    current_admin: dict = Depends(get_current_admin)
):
    """Retrieve reported items for moderation."""
    db = get_database()
    query = {}
    if status_filter:
        query["status"] = status_filter
        
    cursor = db.reports.find(query).sort("created_at", -1).limit(100)
    reports = await cursor.to_list(length=100)
    
    return [
        ReportResponse(
            id=str(r["_id"]),
            reported_by=r.get("reported_by", ""),
            reported_by_name=r.get("reported_by_name", "User"),
            target_type=r.get("target_type", ""),
            target_id=r.get("target_id", ""),
            target_title_or_snippet=r.get("target_title_or_snippet", ""),
            reason=r.get("reason", ""),
            details=r.get("details", ""),
            status=r.get("status", "pending"),
            action_taken=r.get("action_taken"),
            created_at=r.get("created_at").isoformat() if r.get("created_at") else ""
        ) for r in reports
    ]

@router.put("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    payload: AdminReportResolveRequest,
    current_admin: dict = Depends(get_current_admin),
    _csrf: None = Depends(verify_csrf)
):
    """Resolve or dismiss report and execute appropriate content action."""
    oid = validate_object_id(report_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
        
    db = get_database()
    report = await db.reports.find_one({"_id": oid})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
        
    await db.reports.update_one(
        {"_id": oid},
        {"$set": {
            "status": payload.status,
            "action_taken": payload.action_taken,
            "resolved_by": current_admin["email"],
            "resolved_at": datetime.now(timezone.utc)
        }}
    )
    
    await audit_service.log_action(
        admin_id=current_admin["id"],
        admin_email=current_admin["email"],
        action="RESOLVE_REPORT",
        target_type="report",
        target_id=report_id,
        details={"status": payload.status, "action_taken": payload.action_taken, "target_type": report.get("target_type")}
    )
    
    return {"message": "Report status updated."}

@router.delete("/content/{content_type}/{content_id}")
async def admin_remove_content(
    content_type: str,
    content_id: str,
    current_admin: dict = Depends(get_current_admin),
    _csrf: None = Depends(verify_csrf)
):
    """Admin moderation tool: Remove violating questions, answers, community posts, or job trends."""
    oid = validate_object_id(content_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid content ID.")
        
    db = get_database()
    collection = None
    if content_type == "question":
        collection = db.questions
    elif content_type == "answer":
        collection = db.answers
    elif content_type == "post":
        collection = db.community_posts
    elif content_type == "job_trend":
        collection = db.job_trends
    elif content_type == "community":
        collection = db.communities
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported content type '{content_type}'.")
        
    await collection.update_one({"_id": oid}, {"$set": {"is_deleted": True, "deleted_by_admin": current_admin["email"]}})
    
    await audit_service.log_action(
        admin_id=current_admin["id"],
        admin_email=current_admin["email"],
        action="REMOVE_CONTENT",
        target_type=content_type,
        target_id=content_id,
        details={"content_type": content_type}
    )
    
    return {"message": f"{content_type.capitalize()} content removed by administrator."}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin)
):
    """Retrieve immutable administrator audit trail."""
    db = get_database()
    cursor = db.audit_logs.find({}).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    return [
        AuditLogResponse(
            id=str(log["_id"]),
            admin_id=log.get("admin_id", ""),
            admin_email=log.get("admin_email", ""),
            action=log.get("action", ""),
            target_type=log.get("target_type", ""),
            target_id=log.get("target_id"),
            details=log.get("details", {}),
            timestamp=log.get("timestamp").isoformat() if log.get("timestamp") else ""
        ) for log in logs
    ]

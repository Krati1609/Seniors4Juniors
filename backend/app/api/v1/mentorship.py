from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, get_current_senior, get_current_junior, get_optional_user, verify_csrf
from app.core.sanitizer import sanitize_plain_text, sanitize_text, validate_object_id
from app.schemas.mentorship import (
    MentorshipSlotCreate, MentorshipSlotResponse,
    SessionRequestCreate, SessionStatusUpdate,
    SeniorFeedbackSubmit, JuniorReviewSubmit,
    MentorshipSessionResponse
)
from app.services.notification_service import notification_service

router = APIRouter(prefix="/mentorship", tags=["Mentorship & Mock Interviews"])

def format_slot_response(s: dict, senior: dict = None) -> MentorshipSlotResponse:
    return MentorshipSlotResponse(
        id=str(s["_id"]),
        senior_id=str(s.get("senior_id")),
        senior_name=s.get("senior_name", "Senior"),
        senior_role="senior",
        senior_branch=s.get("senior_branch", ""),
        senior_college=s.get("senior_college", ""),
        senior_verified=s.get("senior_verified", False),
        average_rating=senior.get("average_rating", 0.0) if senior else s.get("average_rating", 0.0),
        ratings_count=senior.get("ratings_count", 0) if senior else s.get("ratings_count", 0),
        title=s.get("title", ""),
        session_type=s.get("session_type", "both"),
        day_of_week=s.get("day_of_week", ""),
        time_slot=s.get("time_slot", ""),
        description=s.get("description", ""),
        is_active=s.get("is_active", True),
        created_at=s.get("created_at").isoformat() if s.get("created_at") else ""
    )

def format_session_response(s: dict) -> MentorshipSessionResponse:
    return MentorshipSessionResponse(
        id=str(s["_id"]),
        slot_id=str(s.get("slot_id")),
        slot_title=s.get("slot_title", "Mentorship Session"),
        session_type=s.get("session_type", "mentorship"),
        senior_id=str(s.get("senior_id")),
        senior_name=s.get("senior_name", "Senior"),
        junior_id=str(s.get("junior_id")),
        junior_name=s.get("junior_name", "Junior"),
        date_requested=s.get("date_requested", ""),
        time_slot=s.get("time_slot", ""),
        topic_notes=s.get("topic_notes", ""),
        resume_link=s.get("resume_link", ""),
        meeting_link=s.get("meeting_link", ""),
        status=s.get("status", "pending"),
        senior_feedback=s.get("senior_feedback"),
        junior_review=s.get("junior_review"),
        created_at=s.get("created_at").isoformat() if s.get("created_at") else "",
        updated_at=s.get("updated_at").isoformat() if s.get("updated_at") else None
    )

@router.get("/slots", response_model=List[MentorshipSlotResponse])
async def list_available_slots(
    session_type: Optional[str] = None,
    college_scope: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """List available mentorship and mock interview slots offered by seniors."""
    db = get_database()
    query = {"is_active": True}
    
    if current_user and current_user.get("role") != "admin":
        query["senior_college"] = current_user["college_name"]
    elif college_scope:
        query["senior_college"] = college_scope
        
    if session_type:
        query["$or"] = [{"session_type": session_type}, {"session_type": "both"}]
        
    cursor = db.mentorship_slots.find(query).sort("created_at", -1).limit(50)
    slot_docs = await cursor.to_list(length=50)
    
    # Fetch senior stats to ensure fresh rating display
    senior_ids = [validate_object_id(s["senior_id"]) for s in slot_docs if validate_object_id(s["senior_id"])]
    seniors_map = {}
    if senior_ids:
        s_cursor = db.users.find({"_id": {"$in": senior_ids}})
        async for s in s_cursor:
            seniors_map[str(s["_id"])] = s
            
    result = []
    for s in slot_docs:
        s_obj = seniors_map.get(str(s.get("senior_id")))
        result.append(format_slot_response(s, s_obj))
    return result

@router.post("/slots", response_model=MentorshipSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_mentorship_slot(
    payload: MentorshipSlotCreate,
    current_senior: dict = Depends(get_current_senior),
    _csrf: None = Depends(verify_csrf)
):
    """Seniors post their availability for mentorship or mock interviews."""
    db = get_database()
    
    new_slot = {
        "senior_id": current_senior["id"],
        "senior_name": current_senior.get("full_name", "Senior"),
        "senior_branch": current_senior.get("branch", ""),
        "senior_college": current_senior["college_name"],
        "senior_verified": current_senior.get("is_verified", False),
        "title": sanitize_plain_text(payload.title),
        "session_type": payload.session_type,
        "day_of_week": sanitize_plain_text(payload.day_of_week),
        "time_slot": sanitize_plain_text(payload.time_slot),
        "description": sanitize_text(payload.description),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.mentorship_slots.insert_one(new_slot)
    new_slot["_id"] = result.inserted_id
    
    return format_slot_response(new_slot, current_senior)

@router.delete("/slots/{slot_id}")
async def delete_mentorship_slot(
    slot_id: str,
    current_senior: dict = Depends(get_current_senior),
    _csrf: None = Depends(verify_csrf)
):
    """Deactivate or remove a mentorship slot."""
    oid = validate_object_id(slot_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found.")
        
    db = get_database()
    slot = await db.mentorship_slots.find_one({"_id": oid, "senior_id": current_senior["id"]})
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found or unauthorized.")
        
    await db.mentorship_slots.delete_one({"_id": oid})
    return {"message": "Mentorship slot removed."}

@router.post("/sessions/request", response_model=MentorshipSessionResponse, status_code=status.HTTP_201_CREATED)
async def request_session(
    payload: SessionRequestCreate,
    current_junior: dict = Depends(get_current_junior),
    _csrf: None = Depends(verify_csrf)
):
    """Juniors request a mentorship or mock interview session."""
    slot_oid = validate_object_id(payload.slot_id)
    if not slot_oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentorship slot not found.")
        
    db = get_database()
    slot = await db.mentorship_slots.find_one({"_id": slot_oid, "is_active": True})
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This slot is no longer available.")
        
    new_session = {
        "slot_id": payload.slot_id,
        "slot_title": slot.get("title", "Mentorship Session"),
        "session_type": slot.get("session_type", "mentorship"),
        "senior_id": slot["senior_id"],
        "senior_name": slot.get("senior_name", "Senior"),
        "junior_id": current_junior["id"],
        "junior_name": current_junior.get("full_name", "Junior"),
        "college_name": current_junior["college_name"],
        "date_requested": sanitize_plain_text(payload.date_requested),
        "time_slot": slot.get("time_slot", ""),
        "topic_notes": sanitize_text(payload.topic_notes),
        "resume_link": sanitize_plain_text(payload.resume_link),
        "meeting_link": "",
        "status": "pending",
        "senior_feedback": None,
        "junior_review": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None
    }
    
    result = await db.mentorship_sessions.insert_one(new_session)
    new_session["_id"] = result.inserted_id
    
    # Notify senior of session request
    await notification_service.create_notification(
        recipient_id=str(slot["senior_id"]),
        sender_id=current_junior["id"],
        sender_name=current_junior.get("full_name", "A junior"),
        title="📅 New Mentorship / Mock Interview Request",
        message=f"{current_junior.get('full_name')} requested a session for '{slot.get('title')}' on {payload.date_requested}.",
        notification_type="session_request",
        link="/mentorship"
    )
    
    return format_session_response(new_session)

@router.get("/sessions", response_model=List[MentorshipSessionResponse])
async def list_my_sessions(current_user: dict = Depends(get_current_user)):
    """List all mentorship sessions involving the current user (as junior or senior)."""
    db = get_database()
    user_id = current_user["id"]
    query = {"$or": [{"junior_id": user_id}, {"senior_id": user_id}]}
    
    cursor = db.mentorship_sessions.find(query).sort("created_at", -1)
    sessions = await cursor.to_list(length=50)
    return [format_session_response(s) for s in sessions]

@router.put("/sessions/{session_id}/status", response_model=MentorshipSessionResponse)
async def update_session_status(
    session_id: str,
    payload: SessionStatusUpdate,
    current_senior: dict = Depends(get_current_senior),
    _csrf: None = Depends(verify_csrf)
):
    """Senior accepts/confirms session (providing Meet/Zoom link), rejects, or completes."""
    oid = validate_object_id(session_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        
    db = get_database()
    session = await db.mentorship_sessions.find_one({"_id": oid, "senior_id": current_senior["id"]})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or unauthorized.")
        
    update_data = {
        "status": payload.status,
        "updated_at": datetime.now(timezone.utc)
    }
    if payload.meeting_link is not None:
        update_data["meeting_link"] = sanitize_plain_text(payload.meeting_link)
        
    await db.mentorship_sessions.update_one({"_id": oid}, {"$set": update_data})
    updated = await db.mentorship_sessions.find_one({"_id": oid})
    
    # Notify junior of status update
    status_label = "Confirmed" if payload.status == "confirmed" else ("Completed" if payload.status == "completed" else "Updated")
    await notification_service.create_notification(
        recipient_id=str(session["junior_id"]),
        sender_id=current_senior["id"],
        sender_name=current_senior.get("full_name", "Senior"),
        title=f"Session {status_label}",
        message=f"{current_senior.get('full_name')} updated your session status to '{payload.status}'.",
        notification_type="session_confirmed",
        link="/mentorship"
    )
    
    return format_session_response(updated)

@router.post("/sessions/{session_id}/feedback", response_model=MentorshipSessionResponse)
async def submit_senior_feedback(
    session_id: str,
    payload: SeniorFeedbackSubmit,
    current_senior: dict = Depends(get_current_senior),
    _csrf: None = Depends(verify_csrf)
):
    """Senior submits performance feedback for the junior."""
    oid = validate_object_id(session_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        
    db = get_database()
    session = await db.mentorship_sessions.find_one({"_id": oid, "senior_id": current_senior["id"]})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        
    feedback_dict = {
        "technical_score": payload.technical_score,
        "communication_score": payload.communication_score,
        "strengths": sanitize_text(payload.strengths),
        "areas_for_improvement": sanitize_text(payload.areas_for_improvement),
        "recommended_resources": sanitize_text(payload.recommended_resources),
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.mentorship_sessions.update_one(
        {"_id": oid},
        {"$set": {"senior_feedback": feedback_dict, "status": "completed", "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Notify junior
    await notification_service.create_notification(
        recipient_id=str(session["junior_id"]),
        sender_id=current_senior["id"],
        sender_name=current_senior.get("full_name", "Senior"),
        title="📝 Performance Feedback Received",
        message=f"{current_senior.get('full_name')} submitted feedback for your mock interview / mentorship session.",
        notification_type="session_confirmed",
        link="/mentorship"
    )
    
    updated = await db.mentorship_sessions.find_one({"_id": oid})
    return format_session_response(updated)

@router.post("/sessions/{session_id}/review", response_model=MentorshipSessionResponse)
async def submit_junior_review(
    session_id: str,
    payload: JuniorReviewSubmit,
    current_junior: dict = Depends(get_current_junior),
    _csrf: None = Depends(verify_csrf)
):
    """Junior rates and reviews the senior after a session."""
    oid = validate_object_id(session_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        
    db = get_database()
    session = await db.mentorship_sessions.find_one({"_id": oid, "junior_id": current_junior["id"]})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        
    if session.get("junior_review"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already reviewed this session.")
        
    review_dict = {
        "rating": payload.rating,
        "review": sanitize_text(payload.review),
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.mentorship_sessions.update_one(
        {"_id": oid},
        {"$set": {"junior_review": review_dict, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Recompute senior's average rating and ratings_count
    senior_id = session["senior_id"]
    all_reviews_cursor = db.mentorship_sessions.find({"senior_id": senior_id, "junior_review": {"$ne": None}})
    total_rating = 0
    count = 0
    async for rev in all_reviews_cursor:
        if rev.get("junior_review") and "rating" in rev["junior_review"]:
            total_rating += rev["junior_review"]["rating"]
            count += 1
            
    avg_rating = round(total_rating / count, 2) if count > 0 else 0.0
    await db.users.update_one(
        {"_id": ObjectId(senior_id)},
        {"$set": {"average_rating": avg_rating, "ratings_count": count}}
    )
    
    # Notify senior
    await notification_service.create_notification(
        recipient_id=str(senior_id),
        sender_id=current_junior["id"],
        sender_name=current_junior.get("full_name", "Junior"),
        title=f"⭐ New {payload.rating}-Star Review Received!",
        message=f"{current_junior.get('full_name')} rated your mentorship session {payload.rating}/5 stars.",
        notification_type="session_confirmed",
        link="/mentorship"
    )
    
    updated = await db.mentorship_sessions.find_one({"_id": oid})
    return format_session_response(updated)

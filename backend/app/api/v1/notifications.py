from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, verify_csrf
from app.core.sanitizer import validate_object_id
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(current_user: dict = Depends(get_current_user)):
    """Retrieve notifications for the authenticated user."""
    db = get_database()
    cursor = db.notifications.find({"recipient_id": current_user["id"]}).sort("created_at", -1).limit(50)
    notifs = await cursor.to_list(length=50)
    
    return [
        NotificationResponse(
            id=str(n["_id"]),
            recipient_id=n.get("recipient_id", ""),
            sender_id=n.get("sender_id"),
            sender_name=n.get("sender_name", ""),
            title=n.get("title", ""),
            message=n.get("message", ""),
            notification_type=n.get("notification_type", ""),
            link=n.get("link"),
            read=n.get("read", False),
            created_at=n.get("created_at").isoformat() if n.get("created_at") else ""
        ) for n in notifs
    ]

@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications."""
    db = get_database()
    count = await db.notifications.count_documents({"recipient_id": current_user["id"], "read": False})
    return {"unread_count": count}

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Mark a specific notification as read."""
    oid = validate_object_id(notification_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        
    db = get_database()
    await db.notifications.update_one(
        {"_id": oid, "recipient_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read."}

@router.put("/mark-all-read")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Mark all notifications for current user as read."""
    db = get_database()
    await db.notifications.update_many(
        {"recipient_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read."}

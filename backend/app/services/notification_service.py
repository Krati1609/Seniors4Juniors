from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.core.database import get_database

class NotificationService:
    @staticmethod
    async def create_notification(
        recipient_id: str,
        sender_id: Optional[str],
        sender_name: str,
        title: str,
        message: str,
        notification_type: str,  # 'answer', 'upvote', 'session_request', 'session_confirmed', 'community'
        link: Optional[str] = None
    ):
        """Create a notification for a user."""
        if recipient_id == sender_id:
            # Don't notify oneself
            return
        
        db = get_database()
        notification = {
            "recipient_id": str(recipient_id),
            "sender_id": str(sender_id) if sender_id else None,
            "sender_name": sender_name,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "link": link,
            "read": False,
            "created_at": datetime.now(timezone.utc)
        }
        await db.notifications.insert_one(notification)

notification_service = NotificationService()

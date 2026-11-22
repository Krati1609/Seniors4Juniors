from pydantic import BaseModel
from typing import Optional

class NotificationResponse(BaseModel):
    id: str
    recipient_id: str
    sender_id: Optional[str] = None
    sender_name: str
    title: str
    message: str
    notification_type: str
    link: Optional[str] = None
    read: bool
    created_at: str

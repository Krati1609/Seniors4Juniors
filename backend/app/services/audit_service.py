from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.core.database import get_database

class AuditService:
    @staticmethod
    async def log_action(
        admin_id: str,
        admin_email: str,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Record an immutable admin action for audit and compliance."""
        db = get_database()
        log_entry = {
            "admin_id": str(admin_id),
            "admin_email": admin_email,
            "action": action,
            "target_type": target_type,
            "target_id": str(target_id) if target_id else None,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc)
        }
        await db.audit_logs.insert_one(log_entry)

audit_service = AuditService()

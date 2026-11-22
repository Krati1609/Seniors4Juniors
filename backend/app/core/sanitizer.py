import bleach
import re
from bson import ObjectId
from typing import Any, Optional

# Allow safe text formatting tags only for rich content if needed, otherwise clean tags
ALLOWED_TAGS = ['b', 'i', 'u', 'em', 'strong', 'code', 'pre', 'p', 'br', 'ul', 'ol', 'li', 'blockquote']
ALLOWED_ATTRIBUTES = {}

def sanitize_text(text: Optional[str], strip: bool = True) -> str:
    """Sanitize user-provided text to eliminate XSS vectors."""
    if not text:
        return ""
    # Clean HTML tags and attributes
    cleaned = bleach.clean(
        text,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=strip
    )
    return cleaned.strip()

def sanitize_plain_text(text: Optional[str]) -> str:
    """Strict plain-text cleaner that strips all HTML tags."""
    if not text:
        return ""
    cleaned = bleach.clean(text, tags=[], attributes={}, strip=True)
    return cleaned.strip()

OBJECT_ID_PATTERN = re.compile(r'^[0-9a-fA-F]{24}$')

def validate_object_id(id_str: Any) -> Optional[ObjectId]:
    """Validate and convert string to BSON ObjectId safely against NoSQL injection."""
    if not id_str or not isinstance(id_str, (str, ObjectId)):
        return None
    if isinstance(id_str, ObjectId):
        return id_str
    if OBJECT_ID_PATTERN.match(id_str):
        try:
            return ObjectId(id_str)
        except Exception:
            return None
    return None

def safe_str(val: Any) -> str:
    """Safely coerce any value to clean string."""
    if val is None:
        return ""
    return sanitize_plain_text(str(val))

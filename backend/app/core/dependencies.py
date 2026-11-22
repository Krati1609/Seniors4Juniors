from fastapi import Request, HTTPException, status, Depends
from typing import Optional, Dict, Any
from bson import ObjectId
from app.core.config import settings
from app.core.security import decode_token
from app.core.database import get_database

async def verify_csrf(request: Request):
    """CSRF protection dependency for state-changing HTTP methods."""
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("X-CSRF-Token")
        
        # In API / headless requests, check CSRF token consistency
        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            # Allow fallback if bearer authorization header is explicitly present (non-cookie clients)
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                return
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing or mismatch. Please refresh the page and try again."
            )

async def get_current_user(request: Request) -> Dict[str, Any]:
    """Retrieve and validate the current authenticated user from cookie or authorization header."""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    payload = decode_token(token, settings.JWT_SECRET_KEY)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
        
    db = get_database()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
        
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")
        
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")
        
    # Convert _id to string for clean serialization
    user["id"] = str(user["_id"])
    return user

async def get_optional_user(request: Request) -> Optional[Dict[str, Any]]:
    """Retrieve current user if logged in, else return None without raising an exception."""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def get_current_junior(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Enforce that current user has the junior role."""
    if current_user.get("role") != "junior":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: This action is exclusively available for Juniors."
        )
    return current_user

async def get_current_senior(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Enforce that current user has the senior role."""
    if current_user.get("role") != "senior":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: This action is exclusively available for Seniors."
        )
    return current_user

async def get_current_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Enforce that current user has the admin role."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Administrator privileges required."
        )
    return current_user

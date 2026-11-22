from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import secrets

from app.core.config import settings
from app.core.database import get_database
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token,
    set_auth_cookies, clear_auth_cookies, generate_csrf_token
)
from app.core.limiter import limiter
from app.core.sanitizer import sanitize_plain_text, sanitize_text
from app.core.dependencies import get_current_user
from app.schemas.auth import (
    JuniorRegisterRequest, SeniorRegisterRequest,
    LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UserResponse
)
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_response(user_doc: dict) -> dict:
    """Format MongoDB user document to standard user response dict."""
    return {
        "id": str(user_doc["_id"]),
        "full_name": user_doc.get("full_name", ""),
        "college_name": user_doc.get("college_name", ""),
        "email": user_doc.get("email", ""),
        "roll_number": user_doc.get("roll_number", ""),
        "enrollment_number": user_doc.get("enrollment_number", ""),
        "branch": user_doc.get("branch", ""),
        "college_year": user_doc.get("college_year", 1),
        "current_semester": user_doc.get("current_semester", 1),
        "role": user_doc.get("role", "junior"),
        "is_verified": user_doc.get("is_verified", False),
        "email_verified": user_doc.get("email_verified", False),
        "bio": user_doc.get("bio", ""),
        "interests": user_doc.get("interests", []),
        "career_goals": user_doc.get("career_goals", ""),
        "areas_of_expertise": user_doc.get("areas_of_expertise", []),
        "placement_history": user_doc.get("placement_history", ""),
        "mentorship_available": user_doc.get("mentorship_available", False),
        "answers_count": user_doc.get("answers_count", 0),
        "net_upvotes": user_doc.get("net_upvotes", 0),
        "average_rating": user_doc.get("average_rating", 0.0),
        "ratings_count": user_doc.get("ratings_count", 0),
        "followers_count": user_doc.get("followers_count", 0),
        "created_at": user_doc.get("created_at").isoformat() if user_doc.get("created_at") else None
    }

@router.get("/csrf")
async def get_csrf_token(response: Response):
    """Retrieve or generate CSRF token."""
    csrf_token = generate_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/"
    )
    return {"csrf_token": csrf_token}

@router.post("/register/junior", status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register_junior(request: Request, response: Response, payload: JuniorRegisterRequest):
    """Register a new Junior student."""
    db = get_database()
    email_clean = payload.email.lower().strip()
    
    # Check if email is already registered
    existing_user = await db.users.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    verification_token = secrets.token_urlsafe(32)
    new_user = {
        "full_name": sanitize_plain_text(payload.full_name),
        "college_name": sanitize_plain_text(payload.college_name),
        "email": email_clean,
        "password_hash": get_password_hash(payload.password),
        "roll_number": sanitize_plain_text(payload.roll_number),
        "enrollment_number": sanitize_plain_text(payload.enrollment_number),
        "branch": sanitize_plain_text(payload.branch),
        "college_year": payload.college_year,
        "current_semester": payload.current_semester,
        "role": "junior",
        "is_verified": False,
        "email_verified": True,  # Auto-verified in local development mode
        "verification_token": verification_token,
        "interests": [sanitize_plain_text(i) for i in payload.interests] if payload.interests else [],
        "career_goals": sanitize_text(payload.career_goals),
        "bio": "",
        "answers_count": 0,
        "net_upvotes": 0,
        "average_rating": 0.0,
        "ratings_count": 0,
        "followers_count": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)
    new_user["_id"] = result.inserted_id
    
    # Send verification email notification
    email_service.send_verification_email(email_clean, verification_token, payload.full_name)
    
    # Create tokens and set cookies
    user_claims = {
        "sub": user_id,
        "email": email_clean,
        "role": "junior",
        "college_name": new_user["college_name"]
    }
    access_token = create_access_token(user_claims)
    refresh_token, jti, expire = create_refresh_token(user_claims)
    
    await db.refresh_tokens.insert_one({
        "jti": jti,
        "user_id": user_id,
        "expires_at": expire,
        "created_at": datetime.now(timezone.utc)
    })
    
    existing_csrf = request.cookies.get("csrf_token")
    set_auth_cookies(response, access_token, refresh_token, csrf_token=existing_csrf)
    return {"message": "Junior registration successful.", "user": format_user_response(new_user)}

@router.post("/register/senior", status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register_senior(request: Request, response: Response, payload: SeniorRegisterRequest):
    """Register a new Senior student. Profile verified via college email or admin review."""
    db = get_database()
    email_clean = payload.email.lower().strip()
    
    existing_user = await db.users.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    verification_token = secrets.token_urlsafe(32)
    # Check if college email is recognized (.edu, .ac.in, etc.) for initial badge recommendation
    is_college_domain = any(email_clean.endswith(d) for d in [".edu", ".ac.in", ".edu.in", ".college.edu"])
    
    new_user = {
        "full_name": sanitize_plain_text(payload.full_name),
        "college_name": sanitize_plain_text(payload.college_name),
        "email": email_clean,
        "password_hash": get_password_hash(payload.password),
        "roll_number": sanitize_plain_text(payload.roll_number),
        "enrollment_number": sanitize_plain_text(payload.enrollment_number),
        "branch": sanitize_plain_text(payload.branch),
        "college_year": payload.college_year,
        "current_semester": payload.current_semester,
        "role": "senior",
        "is_verified": False,  # Seniors must be verified by admin or email flow
        "verification_pending": True,
        "email_verified": True,
        "verification_token": verification_token,
        "areas_of_expertise": [sanitize_plain_text(a) for a in payload.areas_of_expertise] if payload.areas_of_expertise else [],
        "placement_history": sanitize_text(payload.placement_history),
        "mentorship_available": payload.mentorship_available,
        "bio": "",
        "answers_count": 0,
        "net_upvotes": 0,
        "average_rating": 0.0,
        "ratings_count": 0,
        "followers_count": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)
    new_user["_id"] = result.inserted_id
    
    email_service.send_verification_email(email_clean, verification_token, payload.full_name)
    
    user_claims = {
        "sub": user_id,
        "email": email_clean,
        "role": "senior",
        "college_name": new_user["college_name"]
    }
    access_token = create_access_token(user_claims)
    refresh_token, jti, expire = create_refresh_token(user_claims)
    
    await db.refresh_tokens.insert_one({
        "jti": jti,
        "user_id": user_id,
        "expires_at": expire,
        "created_at": datetime.now(timezone.utc)
    })
    
    existing_csrf = request.cookies.get("csrf_token")
    set_auth_cookies(response, access_token, refresh_token, csrf_token=existing_csrf)
    return {
        "message": "Senior registration successful. Your profile verification is pending review.",
        "user": format_user_response(new_user)
    }

@router.post("/login")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(request: Request, response: Response, payload: LoginRequest):
    """Authenticate user with brute-force lockout protection and issue session cookies."""
    db = get_database()
    email_clean = payload.email.lower().strip()
    
    # Check brute-force lockout
    attempt_record = await db.login_attempts.find_one({"email": email_clean})
    now = datetime.now(timezone.utc)
    
    if attempt_record and attempt_record.get("locked_until"):
        locked_until = attempt_record["locked_until"]
        if locked_until > now:
            remaining_mins = int((locked_until - now).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Account temporarily locked. Try again in {remaining_mins} minutes."
            )
            
    user = await db.users.find_one({"email": email_clean})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        # Increment failed login attempts
        attempts = (attempt_record.get("failed_attempts", 0) + 1) if attempt_record else 1
        locked_until = None
        if attempts >= settings.MAX_LOGIN_ATTEMPTS:
            locked_until = now + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            
        await db.login_attempts.update_one(
            {"email": email_clean},
            {"$set": {"failed_attempts": attempts, "last_attempt": now, "locked_until": locked_until}},
            upsert=True
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support."
        )
        
    # Reset failed login attempts on successful login
    await db.login_attempts.delete_one({"email": email_clean})
    
    user_id = str(user["_id"])
    user_claims = {
        "sub": user_id,
        "email": email_clean,
        "role": user.get("role", "junior"),
        "college_name": user.get("college_name", "")
    }
    
    access_token = create_access_token(user_claims)
    refresh_token, jti, expire = create_refresh_token(user_claims)
    
    # Store refresh token jti
    await db.refresh_tokens.insert_one({
        "jti": jti,
        "user_id": user_id,
        "expires_at": expire,
        "created_at": datetime.now(timezone.utc)
    })
    
    existing_csrf = request.cookies.get("csrf_token")
    set_auth_cookies(response, access_token, refresh_token, csrf_token=existing_csrf)
    return {
        "message": "Login successful.",
        "user": format_user_response(user)
    }

@router.post("/refresh")
async def refresh_tokens(request: Request, response: Response):
    """Rotate refresh token and issue new short-lived access token."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided.")
        
    payload = decode_token(refresh_token, settings.JWT_REFRESH_SECRET_KEY)
    if not payload or payload.get("type") != "refresh":
        clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")
        
    jti = payload.get("jti")
    user_id = payload.get("sub")
    db = get_database()
    
    # Verify token exists and is not revoked
    stored_token = await db.refresh_tokens.find_one({"jti": jti, "user_id": user_id})
    if not stored_token:
        # Revoke all tokens for this user if reuse is detected
        await db.refresh_tokens.delete_many({"user_id": user_id})
        clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked.")
        
    # Revoke old refresh token (Token Rotation)
    await db.refresh_tokens.delete_one({"jti": jti})
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_active", True):
        clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found or deactivated.")
        
    user_claims = {
        "sub": user_id,
        "email": user["email"],
        "role": user["role"],
        "college_name": user.get("college_name", "")
    }
    
    new_access_token = create_access_token(user_claims)
    new_refresh_token, new_jti, expire = create_refresh_token(user_claims)
    
    await db.refresh_tokens.insert_one({
        "jti": new_jti,
        "user_id": user_id,
        "expires_at": expire,
        "created_at": datetime.now(timezone.utc)
    })
    
    existing_csrf = request.cookies.get("csrf_token")
    set_auth_cookies(response, new_access_token, new_refresh_token, csrf_token=existing_csrf)
    return {"message": "Token refreshed successfully.", "user": format_user_response(user)}

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Revoke refresh token and wipe authentication cookies."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        payload = decode_token(refresh_token, settings.JWT_REFRESH_SECRET_KEY)
        if payload and "jti" in payload:
            db = get_database()
            await db.refresh_tokens.delete_one({"jti": payload["jti"]})
            
    clear_auth_cookies(response)
    return {"message": "Logged out successfully."}

@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve details of the authenticated user."""
    return {"user": format_user_response(current_user)}

@router.get("/verify-email")
async def verify_email(token: str):
    """Verify user's email address via link token."""
    db = get_database()
    user = await db.users.find_one({"verification_token": token})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification link.")
        
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True, "verification_token": None}}
    )
    return {"message": "Email address verified successfully! You may now sign in."}

@router.post("/forgot-password")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def forgot_password(request: Request, payload: ForgotPasswordRequest):
    """Send a password reset token link."""
    db = get_database()
    email_clean = payload.email.lower().strip()
    user = await db.users.find_one({"email": email_clean})
    
    # Always return success message to avoid user enumeration
    if user:
        reset_token = secrets.token_urlsafe(32)
        reset_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"reset_token": reset_token, "reset_token_expires": reset_expiry}}
        )
        email_service.send_password_reset_email(email_clean, reset_token, user.get("full_name", "User"))
        
    return {"message": "If an account with that email exists, a password reset link has been dispatched."}

@router.post("/reset-password")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def reset_password(request: Request, payload: ResetPasswordRequest):
    """Reset user password using token."""
    db = get_database()
    user = await db.users.find_one({"reset_token": payload.token})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")
        
    expires = user.get("reset_token_expires")
    if not expires or expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired.")
        
    new_hash = get_password_hash(payload.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password_hash": new_hash},
            "$unset": {"reset_token": "", "reset_token_expires": ""}
        }
    )
    # Revoke all existing refresh tokens for security
    await db.refresh_tokens.delete_many({"user_id": str(user["_id"])})
    return {"message": "Password reset successfully. Please log in with your new credentials."}

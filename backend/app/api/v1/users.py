from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, get_optional_user, verify_csrf
from app.core.sanitizer import sanitize_plain_text, sanitize_text, validate_object_id
from app.schemas.user import UserProfileUpdate, PublicUserProfile

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/seniors", response_model=List[PublicUserProfile])
async def list_seniors(
    branch: Optional[str] = None,
    expertise: Optional[str] = None,
    verified_only: bool = False,
    college_scope: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """List seniors with filters, scoped by college by default."""
    db = get_database()
    query = {"role": "senior", "is_active": True}
    
    # College scoping
    if current_user and current_user.get("role") != "admin":
        query["college_name"] = current_user["college_name"]
    elif college_scope:
        query["college_name"] = college_scope
        
    if branch:
        query["branch"] = {"$regex": f"^{branch}$", "$options": "i"}
    if expertise:
        query["areas_of_expertise"] = {"$regex": expertise, "$options": "i"}
    if verified_only:
        query["is_verified"] = True
        
    cursor = db.users.find(query).sort([("is_verified", -1), ("average_rating", -1), ("answers_count", -1)]).limit(50)
    seniors = await cursor.to_list(length=50)
    
    # Check follow status if logged in
    followed_ids = set()
    if current_user:
        follows_cursor = db.follows.find({"follower_id": current_user["id"]})
        async for f in follows_cursor:
            followed_ids.add(f["followed_senior_id"])
            
    result = []
    for s in seniors:
        s_id = str(s["_id"])
        result.append(PublicUserProfile(
            id=s_id,
            full_name=s.get("full_name", ""),
            college_name=s.get("college_name", ""),
            role="senior",
            branch=s.get("branch", ""),
            college_year=s.get("college_year", 3),
            current_semester=s.get("current_semester", 5),
            is_verified=s.get("is_verified", False),
            bio=s.get("bio", ""),
            areas_of_expertise=s.get("areas_of_expertise", []),
            placement_history=s.get("placement_history", ""),
            mentorship_available=s.get("mentorship_available", False),
            answers_count=s.get("answers_count", 0),
            net_upvotes=s.get("net_upvotes", 0),
            average_rating=s.get("average_rating", 0.0),
            ratings_count=s.get("ratings_count", 0),
            followers_count=s.get("followers_count", 0),
            is_following=s_id in followed_ids,
            created_at=s.get("created_at").isoformat() if s.get("created_at") else None
        ))
    return result

@router.get("/{user_id}", response_model=PublicUserProfile)
async def get_user_profile(
    user_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Retrieve public profile of a user (Junior or Senior)."""
    oid = validate_object_id(user_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    db = get_database()
    user = await db.users.find_one({"_id": oid, "is_active": True})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    is_following = False
    if current_user and str(user["_id"]) != current_user["id"]:
        follow_record = await db.follows.find_one({
            "follower_id": current_user["id"],
            "followed_senior_id": str(user["_id"])
        })
        is_following = bool(follow_record)
        
    return PublicUserProfile(
        id=str(user["_id"]),
        full_name=user.get("full_name", ""),
        college_name=user.get("college_name", ""),
        role=user.get("role", "junior"),
        branch=user.get("branch", ""),
        college_year=user.get("college_year", 1),
        current_semester=user.get("current_semester", 1),
        is_verified=user.get("is_verified", False),
        bio=user.get("bio", ""),
        interests=user.get("interests", []),
        career_goals=user.get("career_goals", ""),
        areas_of_expertise=user.get("areas_of_expertise", []),
        placement_history=user.get("placement_history", ""),
        mentorship_available=user.get("mentorship_available", False),
        answers_count=user.get("answers_count", 0),
        net_upvotes=user.get("net_upvotes", 0),
        average_rating=user.get("average_rating", 0.0),
        ratings_count=user.get("ratings_count", 0),
        followers_count=user.get("followers_count", 0),
        is_following=is_following,
        created_at=user.get("created_at").isoformat() if user.get("created_at") else None
    )

@router.put("/profile/me")
async def update_my_profile(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Update current user profile information."""
    db = get_database()
    update_data = {}
    
    if payload.full_name is not None:
        update_data["full_name"] = sanitize_plain_text(payload.full_name)
    if payload.branch is not None:
        update_data["branch"] = sanitize_plain_text(payload.branch)
    if payload.current_semester is not None:
        update_data["current_semester"] = payload.current_semester
    if payload.bio is not None:
        update_data["bio"] = sanitize_text(payload.bio)
        
    if current_user.get("role") == "junior":
        if payload.interests is not None:
            update_data["interests"] = [sanitize_plain_text(i) for i in payload.interests]
        if payload.career_goals is not None:
            update_data["career_goals"] = sanitize_text(payload.career_goals)
            
    if current_user.get("role") == "senior":
        if payload.areas_of_expertise is not None:
            update_data["areas_of_expertise"] = [sanitize_plain_text(a) for a in payload.areas_of_expertise]
        if payload.placement_history is not None:
            update_data["placement_history"] = sanitize_text(payload.placement_history)
        if payload.mentorship_available is not None:
            update_data["mentorship_available"] = payload.mentorship_available
            
    if not update_data:
        return {"message": "No fields to update."}
        
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    return {"message": "Profile updated successfully.", "user": updated_user}

@router.post("/{senior_id}/follow")
async def toggle_follow_senior(
    senior_id: str,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Follow or unfollow a senior."""
    if senior_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself.")
        
    oid = validate_object_id(senior_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found.")
        
    db = get_database()
    senior = await db.users.find_one({"_id": oid, "role": "senior"})
    if not senior:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found.")
        
    existing = await db.follows.find_one({
        "follower_id": current_user["id"],
        "followed_senior_id": senior_id
    })
    
    if existing:
        # Unfollow
        await db.follows.delete_one({"_id": existing["_id"]})
        await db.users.update_one({"_id": oid}, {"$inc": {"followers_count": -1}})
        return {"following": False, "message": f"Unfollowed {senior.get('full_name')}."}
    else:
        # Follow
        await db.follows.insert_one({
            "follower_id": current_user["id"],
            "followed_senior_id": senior_id,
            "created_at": datetime.now(timezone.utc)
        })
        await db.users.update_one({"_id": oid}, {"$inc": {"followers_count": 1}})
        return {"following": True, "message": f"Now following {senior.get('full_name')}."}

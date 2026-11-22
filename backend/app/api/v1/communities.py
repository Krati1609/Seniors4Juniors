from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, get_optional_user, verify_csrf
from app.core.sanitizer import sanitize_plain_text, sanitize_text, validate_object_id
from app.schemas.community import (
    CommunityCreate, CommunityResponse,
    CommunityPostCreate, CommunityPostResponse,
    CommunityCommentCreate, CommunityCommentResponse
)
from app.services.notification_service import notification_service

router = APIRouter(prefix="/communities", tags=["Communities"])

def format_community_response(c: dict, is_member: bool = False, user_role: str = None) -> CommunityResponse:
    return CommunityResponse(
        id=str(c["_id"]),
        name=c.get("name", ""),
        description=c.get("description", ""),
        category=c.get("category", "General"),
        college_name=c.get("college_name", ""),
        created_by=str(c.get("created_by")),
        creator_name=c.get("creator_name", "Student"),
        is_private=c.get("is_private", False),
        members_count=c.get("members_count", 1),
        posts_count=c.get("posts_count", 0),
        is_member=is_member,
        user_role=user_role,
        created_at=c.get("created_at").isoformat() if c.get("created_at") else ""
    )

@router.get("", response_model=List[CommunityResponse])
async def list_communities(
    category: Optional[str] = None,
    search: Optional[str] = None,
    college_scope: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """List communities with filters, scoped by college by default."""
    db = get_database()
    query = {"is_deleted": {"$ne": True}}
    
    if current_user and current_user.get("role") != "admin":
        query["college_name"] = current_user["college_name"]
    elif college_scope:
        query["college_name"] = college_scope
        
    if category:
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    if search:
        search_clean = sanitize_plain_text(search)
        query["$or"] = [
            {"name": {"$regex": search_clean, "$options": "i"}},
            {"description": {"$regex": search_clean, "$options": "i"}}
        ]
        
    cursor = db.communities.find(query).sort([("members_count", -1), ("created_at", -1)]).limit(50)
    comm_docs = await cursor.to_list(length=50)
    
    member_roles = {}
    if current_user:
        comm_ids = [str(c["_id"]) for c in comm_docs]
        m_cursor = db.community_members.find({"user_id": current_user["id"], "community_id": {"$in": comm_ids}})
        async for m in m_cursor:
            member_roles[m["community_id"]] = m.get("role", "member")
            
    result = []
    for c in comm_docs:
        c_id = str(c["_id"])
        is_m = c_id in member_roles
        u_role = member_roles.get(c_id)
        result.append(format_community_response(c, is_member=is_m, user_role=u_role))
        
    return result

@router.post("", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(
    payload: CommunityCreate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Create a new college community (creates creator as Owner)."""
    db = get_database()
    name_clean = sanitize_plain_text(payload.name)
    
    # Check duplicate name within the same college
    existing = await db.communities.find_one({
        "name": {"$regex": f"^{name_clean}$", "$options": "i"},
        "college_name": current_user["college_name"],
        "is_deleted": {"$ne": True}
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A community with this name already exists in your college.")
        
    new_comm = {
        "name": name_clean,
        "description": sanitize_text(payload.description),
        "category": sanitize_plain_text(payload.category),
        "college_name": current_user["college_name"],
        "created_by": current_user["id"],
        "creator_name": current_user.get("full_name", "Student"),
        "is_private": payload.is_private,
        "members_count": 1,
        "posts_count": 0,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.communities.insert_one(new_comm)
    comm_id = str(result.inserted_id)
    new_comm["_id"] = result.inserted_id
    
    # Add creator as owner
    await db.community_members.insert_one({
        "community_id": comm_id,
        "user_id": current_user["id"],
        "role": "owner",
        "joined_at": datetime.now(timezone.utc)
    })
    
    return format_community_response(new_comm, is_member=True, user_role="owner")

@router.get("/{community_id}", response_model=CommunityResponse)
async def get_community_detail(
    community_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Retrieve community overview."""
    oid = validate_object_id(community_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found.")
        
    db = get_database()
    c = await db.communities.find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found.")
        
    is_member = False
    user_role = None
    if current_user:
        membership = await db.community_members.find_one({"community_id": community_id, "user_id": current_user["id"]})
        if membership:
            is_member = True
            user_role = membership.get("role", "member")
            
    return format_community_response(c, is_member=is_member, user_role=user_role)

@router.post("/{community_id}/join")
async def join_or_leave_community(
    community_id: str,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Join or leave a community."""
    oid = validate_object_id(community_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found.")
        
    db = get_database()
    c = await db.communities.find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found.")
        
    existing = await db.community_members.find_one({"community_id": community_id, "user_id": current_user["id"]})
    if existing:
        if existing.get("role") == "owner":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The owner cannot leave the community. Transfer ownership first.")
        await db.community_members.delete_one({"_id": existing["_id"]})
        await db.communities.update_one({"_id": oid}, {"$inc": {"members_count": -1}})
        return {"joined": False, "message": f"You left '{c.get('name')}'."}
    else:
        await db.community_members.insert_one({
            "community_id": community_id,
            "user_id": current_user["id"],
            "role": "member",
            "joined_at": datetime.now(timezone.utc)
        })
        await db.communities.update_one({"_id": oid}, {"$inc": {"members_count": 1}})
        return {"joined": True, "message": f"You joined '{c.get('name')}'."}

@router.get("/{community_id}/posts", response_model=List[CommunityPostResponse])
async def list_community_posts(
    community_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """List posts inside a community."""
    oid = validate_object_id(community_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found.")
        
    db = get_database()
    c = await db.communities.find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found.")
        
    # If private community, ensure membership
    if c.get("is_private"):
        if not current_user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This community is private. Please log in.")
        if current_user.get("role") != "admin":
            is_m = await db.community_members.find_one({"community_id": community_id, "user_id": current_user["id"]})
            if not is_m:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This is a private community. You must join to see posts.")
                
    cursor = db.community_posts.find({"community_id": community_id, "is_deleted": {"$ne": True}}).sort("created_at", -1).limit(50)
    post_docs = await cursor.to_list(length=50)
    
    result = []
    for p in post_docs:
        p_id = str(p["_id"])
        c_cursor = db.community_comments.find({"post_id": p_id, "is_deleted": {"$ne": True}}).sort("created_at", 1)
        comment_docs = await c_cursor.to_list(length=20)
        comments = [
            CommunityCommentResponse(
                id=str(com["_id"]),
                post_id=p_id,
                author_id=str(com["author_id"]),
                author_name=com.get("author_name", "Student"),
                author_role=com.get("author_role", "junior"),
                content=com.get("content", ""),
                created_at=com.get("created_at").isoformat() if com.get("created_at") else ""
            ) for com in comment_docs
        ]
        result.append(CommunityPostResponse(
            id=p_id,
            community_id=community_id,
            author_id=str(p["author_id"]),
            author_name=p.get("author_name", "Member"),
            author_role=p.get("author_role", "junior"),
            title=p.get("title", ""),
            content=p.get("content", ""),
            comments_count=p.get("comments_count", 0),
            comments=comments,
            created_at=p.get("created_at").isoformat() if p.get("created_at") else ""
        ))
    return result

@router.post("/{community_id}/posts", response_model=CommunityPostResponse, status_code=status.HTTP_201_CREATED)
async def create_community_post(
    community_id: str,
    payload: CommunityPostCreate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Create a post inside a community (must be member or admin)."""
    oid = validate_object_id(community_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found.")
        
    db = get_database()
    c = await db.communities.find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found.")
        
    if current_user.get("role") != "admin":
        is_m = await db.community_members.find_one({"community_id": community_id, "user_id": current_user["id"]})
        if not is_m:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of this community to create posts.")
            
    new_post = {
        "community_id": community_id,
        "author_id": current_user["id"],
        "author_name": current_user.get("full_name", "Member"),
        "author_role": current_user.get("role", "junior"),
        "title": sanitize_plain_text(payload.title),
        "content": sanitize_text(payload.content),
        "comments_count": 0,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.community_posts.insert_one(new_post)
    new_post["_id"] = result.inserted_id
    
    await db.communities.update_one({"_id": oid}, {"$inc": {"posts_count": 1}})
    
    return CommunityPostResponse(
        id=str(new_post["_id"]),
        community_id=community_id,
        author_id=current_user["id"],
        author_name=new_post["author_name"],
        author_role=new_post["author_role"],
        title=new_post["title"],
        content=new_post["content"],
        comments_count=0,
        comments=[],
        created_at=new_post["created_at"].isoformat()
    )

@router.post("/posts/{post_id}/comments", response_model=CommunityCommentResponse, status_code=status.HTTP_201_CREATED)
async def create_post_comment(
    post_id: str,
    payload: CommunityCommentCreate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Add discussion comment to a community post."""
    p_oid = validate_object_id(post_id)
    if not p_oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        
    db = get_database()
    post = await db.community_posts.find_one({"_id": p_oid, "is_deleted": {"$ne": True}})
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        
    new_comm = {
        "post_id": post_id,
        "author_id": current_user["id"],
        "author_name": current_user.get("full_name", "Member"),
        "author_role": current_user.get("role", "junior"),
        "content": sanitize_plain_text(payload.content),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.community_comments.insert_one(new_comm)
    new_comm["_id"] = result.inserted_id
    
    await db.community_posts.update_one({"_id": p_oid}, {"$inc": {"comments_count": 1}})
    
    # Notify author
    if post.get("author_id") != current_user["id"]:
        await notification_service.create_notification(
            recipient_id=str(post["author_id"]),
            sender_id=current_user["id"],
            sender_name=current_user.get("full_name", "Member"),
            title="Discussion in Community",
            message=f"{current_user.get('full_name')} replied to '{post.get('title', '')[:40]}...'",
            notification_type="community",
            link=f"/communities/{post['community_id']}"
        )
        
    return CommunityCommentResponse(
        id=str(new_comm["_id"]),
        post_id=post_id,
        author_id=current_user["id"],
        author_name=new_comm["author_name"],
        author_role=new_comm["author_role"],
        content=new_comm["content"],
        created_at=new_comm["created_at"].isoformat()
    )

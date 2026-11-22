from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, get_optional_user, verify_csrf
from app.core.sanitizer import sanitize_plain_text, sanitize_text, validate_object_id
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse
from app.core.limiter import limiter
from app.core.config import settings

router = APIRouter(prefix="/questions", tags=["Questions"])

def format_question_response(q: dict, is_bookmarked: bool = False, top_answer: dict = None) -> QuestionResponse:
    asker_id = None if q.get("is_anonymous") else str(q.get("asker_id"))
    asker_name = "Anonymous Junior" if q.get("is_anonymous") else q.get("asker_name", "Student")
    asker_role = None if q.get("is_anonymous") else q.get("asker_role")
    asker_branch = None if q.get("is_anonymous") else q.get("asker_branch")
    
    return QuestionResponse(
        id=str(q["_id"]),
        title=q.get("title", ""),
        content=q.get("content", ""),
        tags=q.get("tags", []),
        is_anonymous=q.get("is_anonymous", False),
        asker_id=asker_id,
        asker_name=asker_name,
        asker_role=asker_role,
        asker_branch=asker_branch,
        college_name=q.get("college_name", ""),
        created_at=q.get("created_at").isoformat() if q.get("created_at") else "",
        updated_at=q.get("updated_at").isoformat() if q.get("updated_at") else None,
        answers_count=q.get("answers_count", 0),
        top_answer=top_answer,
        best_answer_id=str(q["best_answer_id"]) if q.get("best_answer_id") else None,
        is_bookmarked=is_bookmarked,
        views_count=q.get("views_count", 0)
    )

@router.get("", response_model=QuestionListResponse)
async def list_questions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    tag: Optional[str] = None,
    branch: Optional[str] = None,
    sort: str = Query("newest", pattern=r'^(newest|most_upvoted|unanswered)$'),
    search: Optional[str] = None,
    college_scope: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Retrieve questions feed with filters and infinite scroll pagination."""
    db = get_database()
    skip = (page - 1) * limit
    filter_query = {"is_deleted": {"$ne": True}}
    
    # College scoping: prioritize current user's college
    if current_user and current_user.get("role") != "admin":
        filter_query["college_name"] = current_user["college_name"]
    elif college_scope:
        filter_query["college_name"] = college_scope
        
    if tag:
        filter_query["tags"] = {"$regex": f"^{tag}$", "$options": "i"}
    if branch:
        filter_query["asker_branch"] = {"$regex": f"^{branch}$", "$options": "i"}
    if search:
        search_clean = sanitize_plain_text(search)
        filter_query["$or"] = [
            {"title": {"$regex": search_clean, "$options": "i"}},
            {"content": {"$regex": search_clean, "$options": "i"}},
            {"tags": {"$in": [search_clean]}}
        ]
    if sort == "unanswered":
        filter_query["answers_count"] = 0
        
    # Sorting
    if sort == "most_upvoted":
        sort_spec = [("net_votes", -1), ("created_at", -1)]
    elif sort == "unanswered":
        sort_spec = [("created_at", -1)]
    else:
        sort_spec = [("created_at", -1)]
        
    total = await db.questions.count_documents(filter_query)
    cursor = db.questions.find(filter_query).sort(sort_spec).skip(skip).limit(limit)
    question_docs = await cursor.to_list(length=limit)
    
    # Check bookmarks for logged in user
    bookmarked_ids = set()
    if current_user:
        bm_cursor = db.bookmarks.find({"user_id": current_user["id"]})
        async for bm in bm_cursor:
            bookmarked_ids.add(bm["question_id"])
            
    # For each question, find its top/best answer for rich feed display
    questions = []
    for q in question_docs:
        q_id = str(q["_id"])
        top_ans = None
        if q.get("answers_count", 0) > 0:
            top_ans_doc = await db.answers.find_one(
                {"question_id": q_id, "is_deleted": {"$ne": True}},
                sort=[("is_best_answer", -1), ("net_votes", -1), ("created_at", -1)]
            )
            if top_ans_doc:
                top_ans = {
                    "id": str(top_ans_doc["_id"]),
                    "senior_name": top_ans_doc.get("senior_name", "Senior"),
                    "senior_branch": top_ans_doc.get("senior_branch", ""),
                    "senior_verified": top_ans_doc.get("senior_verified", False),
                    "content_snippet": top_ans_doc.get("content", "")[:180] + ("..." if len(top_ans_doc.get("content", "")) > 180 else ""),
                    "net_votes": top_ans_doc.get("net_votes", 0),
                    "is_best_answer": top_ans_doc.get("is_best_answer", False)
                }
        questions.append(format_question_response(q, is_bookmarked=(q_id in bookmarked_ids), top_answer=top_ans))
        
    return QuestionListResponse(
        questions=questions,
        total=total,
        page=page,
        limit=limit,
        has_more=(skip + len(questions) < total)
    )

@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def create_question(
    request: Request,
    payload: QuestionCreate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Post a new question with tags, college grouping, and optional anonymity."""
    db = get_database()
    
    clean_tags = [sanitize_plain_text(t).lower() for t in payload.tags if t.strip()]
    if not clean_tags:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one valid tag is required.")
        
    new_question = {
        "title": sanitize_plain_text(payload.title),
        "content": sanitize_text(payload.content),
        "tags": clean_tags,
        "is_anonymous": payload.is_anonymous,
        "asker_id": current_user["id"],
        "asker_name": current_user.get("full_name", ""),
        "asker_role": current_user.get("role", "junior"),
        "asker_branch": current_user.get("branch", ""),
        "college_name": current_user["college_name"],
        "answers_count": 0,
        "views_count": 0,
        "net_votes": 0,
        "best_answer_id": None,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None
    }
    
    result = await db.questions.insert_one(new_question)
    new_question["_id"] = result.inserted_id
    
    return format_question_response(new_question, is_bookmarked=False)

@router.get("/bookmarks", response_model=List[QuestionResponse])
async def list_bookmarks(current_user: dict = Depends(get_current_user)):
    """Retrieve all questions bookmarked by current user."""
    db = get_database()
    cursor = db.bookmarks.find({"user_id": current_user["id"]}).sort("created_at", -1)
    bookmark_docs = await cursor.to_list(length=100)
    
    q_ids = [validate_object_id(b["question_id"]) for b in bookmark_docs if validate_object_id(b["question_id"])]
    if not q_ids:
        return []
        
    q_cursor = db.questions.find({"_id": {"$in": q_ids}, "is_deleted": {"$ne": True}})
    questions = await q_cursor.to_list(length=100)
    
    return [format_question_response(q, is_bookmarked=True) for q in questions]

@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question_detail(
    question_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Retrieve detailed question information and increment view counter."""
    oid = validate_object_id(question_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    db = get_database()
    question = await db.questions.find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    # Increment views count
    await db.questions.update_one({"_id": oid}, {"$inc": {"views_count": 1}})
    question["views_count"] = question.get("views_count", 0) + 1
    
    is_bookmarked = False
    if current_user:
        bm = await db.bookmarks.find_one({"user_id": current_user["id"], "question_id": question_id})
        is_bookmarked = bool(bm)
        
    return format_question_response(question, is_bookmarked=is_bookmarked)

@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    payload: QuestionUpdate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Update question (author only)."""
    oid = validate_object_id(question_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    db = get_database()
    q = await db.questions.find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    if q.get("asker_id") != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own questions.")
        
    update_data = {"updated_at": datetime.now(timezone.utc)}
    if payload.title is not None:
        update_data["title"] = sanitize_plain_text(payload.title)
    if payload.content is not None:
        update_data["content"] = sanitize_text(payload.content)
    if payload.tags is not None:
        update_data["tags"] = [sanitize_plain_text(t).lower() for t in payload.tags if t.strip()]
        
    await db.questions.update_one({"_id": oid}, {"$set": update_data})
    updated = await db.questions.find_one({"_id": oid})
    return format_question_response(updated)

@router.delete("/{question_id}")
async def delete_question(
    question_id: str,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Delete a question (author or admin)."""
    oid = validate_object_id(question_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    db = get_database()
    q = await db.questions.find_one({"_id": oid})
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    if q.get("asker_id") != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")
        
    await db.questions.update_one({"_id": oid}, {"$set": {"is_deleted": True}})
    return {"message": "Question deleted successfully."}

@router.post("/{question_id}/bookmark")
async def toggle_bookmark(
    question_id: str,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Save or remove a question from bookmarks."""
    oid = validate_object_id(question_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    db = get_database()
    existing = await db.bookmarks.find_one({
        "user_id": current_user["id"],
        "question_id": question_id
    })
    
    if existing:
        await db.bookmarks.delete_one({"_id": existing["_id"]})
        return {"bookmarked": False, "message": "Question removed from bookmarks."}
    else:
        await db.bookmarks.insert_one({
            "user_id": current_user["id"],
            "question_id": question_id,
            "created_at": datetime.now(timezone.utc)
        })
        return {"bookmarked": True, "message": "Question added to bookmarks."}

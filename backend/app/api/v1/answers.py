from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.dependencies import get_current_user, get_current_senior, get_optional_user, verify_csrf
from app.core.sanitizer import sanitize_plain_text, sanitize_text, validate_object_id
from app.schemas.answer import AnswerCreate, AnswerResponse, CommentCreate, CommentResponse, VoteRequest
from app.services.notification_service import notification_service

router = APIRouter(tags=["Answers"])

def format_answer_response(ans: dict, user_vote: int = 0, comments: list = None) -> AnswerResponse:
    upvotes = ans.get("upvotes", 0)
    downvotes = ans.get("downvotes", 0)
    net_votes = ans.get("net_votes", upvotes - downvotes)
    
    return AnswerResponse(
        id=str(ans["_id"]),
        question_id=str(ans["question_id"]),
        senior_id=str(ans["senior_id"]),
        senior_name=ans.get("senior_name", "Senior"),
        senior_role=ans.get("senior_role", "senior"),
        senior_branch=ans.get("senior_branch", ""),
        senior_year=ans.get("senior_year", 3),
        senior_verified=ans.get("senior_verified", False),
        content=ans.get("content", ""),
        upvotes=upvotes,
        downvotes=downvotes,
        net_votes=net_votes,
        user_vote=user_vote,
        is_best_answer=ans.get("is_best_answer", False),
        comments_count=ans.get("comments_count", 0),
        comments=comments or [],
        created_at=ans.get("created_at").isoformat() if ans.get("created_at") else "",
        updated_at=ans.get("updated_at").isoformat() if ans.get("updated_at") else None
    )

@router.get("/questions/{question_id}/answers", response_model=List[AnswerResponse])
async def list_answers(
    question_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """List answers for a question, sorted with best answer first, then highest net votes."""
    oid = validate_object_id(question_id)
    if not oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    db = get_database()
    cursor = db.answers.find(
        {"question_id": question_id, "is_deleted": {"$ne": True}}
    ).sort([("is_best_answer", -1), ("net_votes", -1), ("created_at", 1)])
    
    answer_docs = await cursor.to_list(length=100)
    
    # Check current user's votes on these answers
    user_votes = {}
    if current_user:
        ans_ids = [str(a["_id"]) for a in answer_docs]
        vote_cursor = db.votes.find({"user_id": current_user["id"], "answer_id": {"$in": ans_ids}})
        async for v in vote_cursor:
            user_votes[v["answer_id"]] = v.get("value", 0)
            
    result = []
    for a in answer_docs:
        a_id = str(a["_id"])
        # Fetch comments for this answer
        c_cursor = db.comments.find({"answer_id": a_id, "is_deleted": {"$ne": True}}).sort("created_at", 1)
        comment_docs = await c_cursor.to_list(length=50)
        comments = [
            CommentResponse(
                id=str(c["_id"]),
                answer_id=a_id,
                author_id=str(c["author_id"]),
                author_name=c.get("author_name", "User"),
                author_role=c.get("author_role", "junior"),
                content=c.get("content", ""),
                created_at=c.get("created_at").isoformat() if c.get("created_at") else ""
            ) for c in comment_docs
        ]
        
        result.append(format_answer_response(
            a,
            user_vote=user_votes.get(a_id, 0),
            comments=comments
        ))
        
    return result

@router.post("/questions/{question_id}/answers", response_model=AnswerResponse, status_code=status.HTTP_201_CREATED)
async def create_answer(
    question_id: str,
    payload: AnswerCreate,
    current_senior: dict = Depends(get_current_senior),
    _csrf: None = Depends(verify_csrf)
):
    """Seniors post answers to questions."""
    q_oid = validate_object_id(question_id)
    if not q_oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    db = get_database()
    question = await db.questions.find_one({"_id": q_oid, "is_deleted": {"$ne": True}})
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    new_answer = {
        "question_id": question_id,
        "senior_id": current_senior["id"],
        "senior_name": current_senior.get("full_name", ""),
        "senior_role": "senior",
        "senior_branch": current_senior.get("branch", ""),
        "senior_year": current_senior.get("college_year", 3),
        "senior_verified": current_senior.get("is_verified", False),
        "content": sanitize_text(payload.content),
        "upvotes": 0,
        "downvotes": 0,
        "net_votes": 0,
        "is_best_answer": False,
        "comments_count": 0,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None
    }
    
    result = await db.answers.insert_one(new_answer)
    new_answer["_id"] = result.inserted_id
    
    # Update question answer count
    await db.questions.update_one({"_id": q_oid}, {"$inc": {"answers_count": 1}})
    # Update senior's stats
    await db.users.update_one({"_id": ObjectId(current_senior["id"])}, {"$inc": {"answers_count": 1}})
    
    # Notify question asker
    if question.get("asker_id"):
        await notification_service.create_notification(
            recipient_id=str(question["asker_id"]),
            sender_id=current_senior["id"],
            sender_name=current_senior.get("full_name", "A senior"),
            title="New Answer on Your Question",
            message=f"{current_senior.get('full_name')} answered: '{question.get('title', '')[:50]}...'",
            notification_type="answer",
            link=f"/questions/{question_id}"
        )
        
    return format_answer_response(new_answer)

@router.post("/answers/{answer_id}/vote")
async def vote_answer(
    answer_id: str,
    payload: VoteRequest,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Upvote or downvote an answer (one vote per user, changeable)."""
    a_oid = validate_object_id(answer_id)
    if not a_oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found.")
        
    db = get_database()
    answer = await db.answers.find_one({"_id": a_oid, "is_deleted": {"$ne": True}})
    if not answer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found.")
        
    user_id = current_user["id"]
    existing_vote = await db.votes.find_one({"user_id": user_id, "answer_id": answer_id})
    old_value = existing_vote.get("value", 0) if existing_vote else 0
    new_value = payload.value  # 1, -1, or 0 (revoke)
    
    if old_value == new_value:
        return {"net_votes": answer.get("net_votes", 0), "user_vote": new_value}
        
    # Calculate vote diffs
    upvote_diff = 0
    downvote_diff = 0
    
    if old_value == 1:
        upvote_diff -= 1
    elif old_value == -1:
        downvote_diff -= 1
        
    if new_value == 1:
        upvote_diff += 1
    elif new_value == -1:
        downvote_diff += 1
        
    net_diff = (upvote_diff - downvote_diff)
    
    # Update or delete vote record
    if new_value == 0:
        if existing_vote:
            await db.votes.delete_one({"_id": existing_vote["_id"]})
    else:
        await db.votes.update_one(
            {"user_id": user_id, "answer_id": answer_id},
            {"$set": {"value": new_value, "updated_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        
    # Update answer counters
    await db.answers.update_one(
        {"_id": a_oid},
        {
            "$inc": {
                "upvotes": upvote_diff,
                "downvotes": downvote_diff,
                "net_votes": net_diff
            }
        }
    )
    
    # Update senior's total net upvotes stats
    await db.users.update_one(
        {"_id": ObjectId(answer["senior_id"])},
        {"$inc": {"net_upvotes": net_diff}}
    )
    
    # Update question's top net_votes cache if needed
    await db.questions.update_one(
        {"_id": ObjectId(answer["question_id"])},
        {"$inc": {"net_votes": net_diff}}
    )
    
    # Send notification on upvote
    if new_value == 1 and answer["senior_id"] != user_id:
        await notification_service.create_notification(
            recipient_id=str(answer["senior_id"]),
            sender_id=user_id,
            sender_name=current_user.get("full_name", "A student"),
            title="Upvote on Your Answer",
            message=f"{current_user.get('full_name')} upvoted your answer.",
            notification_type="upvote",
            link=f"/questions/{answer['question_id']}"
        )
        
    updated_answer = await db.answers.find_one({"_id": a_oid})
    return {
        "answer_id": answer_id,
        "upvotes": updated_answer.get("upvotes", 0),
        "downvotes": updated_answer.get("downvotes", 0),
        "net_votes": updated_answer.get("net_votes", 0),
        "user_vote": new_value
    }

@router.post("/answers/{answer_id}/best")
async def mark_best_answer(
    answer_id: str,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """The question asker marks an answer as the 'Best Answer'."""
    a_oid = validate_object_id(answer_id)
    if not a_oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found.")
        
    db = get_database()
    answer = await db.answers.find_one({"_id": a_oid, "is_deleted": {"$ne": True}})
    if not answer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found.")
        
    question = await db.questions.find_one({"_id": ObjectId(answer["question_id"])})
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
        
    # Only asker or admin can mark best answer
    if question.get("asker_id") != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the author who asked the question can select the best answer.")
        
    # Clear existing best answer on this question if any
    await db.answers.update_many(
        {"question_id": answer["question_id"]},
        {"$set": {"is_best_answer": False}}
    )
    
    # Mark this answer as best
    await db.answers.update_one({"_id": a_oid}, {"$set": {"is_best_answer": True}})
    await db.questions.update_one({"_id": ObjectId(answer["question_id"])}, {"$set": {"best_answer_id": answer_id}})
    
    # Notify the senior
    await notification_service.create_notification(
        recipient_id=str(answer["senior_id"]),
        sender_id=current_user["id"],
        sender_name=current_user.get("full_name", "Student"),
        title="🌟 Marked as Best Answer!",
        message=f"Your answer to '{question.get('title', '')[:50]}' was selected as the Best Answer!",
        notification_type="answer",
        link=f"/questions/{answer['question_id']}"
    )
    
    return {"message": "Best answer marked successfully.", "best_answer_id": answer_id}

@router.post("/answers/{answer_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    answer_id: str,
    payload: CommentCreate,
    current_user: dict = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf)
):
    """Add follow-up or comment on an answer."""
    a_oid = validate_object_id(answer_id)
    if not a_oid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found.")
        
    db = get_database()
    answer = await db.answers.find_one({"_id": a_oid, "is_deleted": {"$ne": True}})
    if not answer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found.")
        
    new_comment = {
        "answer_id": answer_id,
        "author_id": current_user["id"],
        "author_name": current_user.get("full_name", "User"),
        "author_role": current_user.get("role", "junior"),
        "content": sanitize_plain_text(payload.content),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.comments.insert_one(new_comment)
    new_comment["_id"] = result.inserted_id
    
    await db.answers.update_one({"_id": a_oid}, {"$inc": {"comments_count": 1}})
    
    # Notify senior who wrote the answer
    if answer["senior_id"] != current_user["id"]:
        await notification_service.create_notification(
            recipient_id=str(answer["senior_id"]),
            sender_id=current_user["id"],
            sender_name=current_user.get("full_name", "Student"),
            title="Follow-up on Your Answer",
            message=f"{current_user.get('full_name')} commented on your answer.",
            notification_type="answer",
            link=f"/questions/{answer['question_id']}"
        )
        
    return CommentResponse(
        id=str(new_comment["_id"]),
        answer_id=answer_id,
        author_id=current_user["id"],
        author_name=new_comment["author_name"],
        author_role=new_comment["author_role"],
        content=new_comment["content"],
        created_at=new_comment["created_at"].isoformat()
    )

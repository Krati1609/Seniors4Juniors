import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force mock mode for test execution
from app.core.config import settings
settings.MONGODB_URL = "mock"

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
import mongomock_motor

from app.core.database import db_instance, connect_to_mongo
from app.main import app

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await connect_to_mongo()
    yield

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_full_application_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        
        # 1. Fetch CSRF token
        csrf_res = await ac.get("/api/v1/auth/csrf")
        assert csrf_res.status_code == 200
        csrf_token = csrf_res.json()["csrf_token"]
        headers = {"X-CSRF-Token": csrf_token}

        # 2. Register Junior student
        junior_payload = {
            "full_name": "Aanya Gupta",
            "college_name": "IIT Bombay",
            "email": "aanya.junior@iitb.ac.in",
            "password": "Password123!",
            "roll_number": "24001001",
            "enrollment_number": "ENR2401",
            "branch": "Computer Science",
            "college_year": 1,
            "current_semester": 1,
            "interests": ["DSA", "Web Development"],
            "career_goals": "Top tech internship"
        }
        res_jr = await ac.post("/api/v1/auth/register/junior", json=junior_payload, headers=headers)
        assert res_jr.status_code == 201
        assert res_jr.json()["user"]["role"] == "junior"
        junior_id = res_jr.json()["user"]["id"]

        # 3. Post a question as Junior
        q_payload = {
            "title": "How to prepare for Google summer internship OA?",
            "content": "Looking for advice on LeetCode patterns and graph algorithms.",
            "tags": ["internships", "google", "dsa"],
            "is_anonymous": False
        }
        res_q = await ac.post("/api/v1/questions", json=q_payload, headers=headers)
        assert res_q.status_code == 201
        q_id = res_q.json()["id"]
        assert res_q.json()["title"] == q_payload["title"]

        # 4. Register Senior student
        senior_payload = {
            "full_name": "Rohan Verma",
            "college_name": "IIT Bombay",
            "email": "rohan.senior@iitb.ac.in",
            "password": "Password123!",
            "roll_number": "21002005",
            "enrollment_number": "ENR2105",
            "branch": "Computer Science",
            "college_year": 4,
            "current_semester": 7,
            "areas_of_expertise": ["Graph Algorithms", "System Design"],
            "placement_history": "Placed at Google (SWE L3)",
            "mentorship_available": True
        }
        res_sr = await ac.post("/api/v1/auth/register/senior", json=senior_payload, headers=headers)
        assert res_sr.status_code == 201
        senior_id = res_sr.json()["user"]["id"]
        assert res_sr.json()["user"]["is_verified"] is False

        # 5. Senior answers the question
        ans_payload = {
            "content": "Focus on Graph BFS/DFS, Union Find, and Dynamic Programming. Solve Neetcode 150."
        }
        res_ans = await ac.post(f"/api/v1/questions/{q_id}/answers", json=ans_payload, headers=headers)
        assert res_ans.status_code == 201
        ans_id = res_ans.json()["id"]

        # 6. Senior creates a mentorship availability slot
        slot_payload = {
            "title": "DSA Mock Interview - Graphs & Trees",
            "session_type": "mock_interview",
            "day_of_week": "Saturday",
            "time_slot": "5:00 PM - 6:00 PM IST",
            "description": "Live coding over Google Meet"
        }
        res_slot = await ac.post("/api/v1/mentorship/slots", json=slot_payload, headers=headers)
        assert res_slot.status_code == 201
        slot_id = res_slot.json()["id"]

        # 7. Switch to Junior login
        login_res = await ac.post("/api/v1/auth/login", json={"email": "aanya.junior@iitb.ac.in", "password": "Password123!"}, headers=headers)
        assert login_res.status_code == 200

        # 8. Junior upvotes the senior's answer
        res_vote = await ac.post(f"/api/v1/answers/{ans_id}/vote", json={"value": 1}, headers=headers)
        assert res_vote.status_code == 200
        assert res_vote.json()["net_votes"] == 1

        # 9. Junior marks Best Answer
        res_best = await ac.post(f"/api/v1/answers/{ans_id}/best", headers=headers)
        assert res_best.status_code == 200

        # 10. Junior comments on answer
        res_comment = await ac.post(f"/api/v1/answers/{ans_id}/comments", json={"content": "Thank you bhaiya! Bookmarked."}, headers=headers)
        assert res_comment.status_code == 201

        # 11. Junior books a mentorship session slot
        req_payload = {
            "slot_id": slot_id,
            "date_requested": "2026-11-28",
            "topic_notes": "Practicing graph cycles and Dijkstra",
            "resume_link": "https://drive.google.com/test-resume"
        }
        res_book = await ac.post("/api/v1/mentorship/sessions/request", json=req_payload, headers=headers)
        assert res_book.status_code == 201
        session_id = res_book.json()["id"]

        # 12. Switch back to Senior login to confirm session
        await ac.post("/api/v1/auth/login", json={"email": "rohan.senior@iitb.ac.in", "password": "Password123!"}, headers=headers)
        res_conf = await ac.put(f"/api/v1/mentorship/sessions/{session_id}/status", json={"status": "confirmed", "meeting_link": "https://meet.google.com/abc-xyz"}, headers=headers)
        assert res_conf.status_code == 200
        assert res_conf.json()["status"] == "confirmed"

        # 13. Senior submits performance feedback
        fb_payload = {
            "technical_score": 9,
            "communication_score": 8,
            "strengths": "Great intuition and edge case handling",
            "areas_for_improvement": "State complexity before writing code",
            "recommended_resources": "Practice Topo Sort"
        }
        res_fb = await ac.post(f"/api/v1/mentorship/sessions/{session_id}/feedback", json=fb_payload, headers=headers)
        assert res_fb.status_code == 200
        assert res_fb.json()["status"] == "completed"

        # 14. Switch back to Junior to rate and review Senior
        await ac.post("/api/v1/auth/login", json={"email": "aanya.junior@iitb.ac.in", "password": "Password123!"}, headers=headers)
        rev_payload = {
            "rating": 5,
            "review": "Incredible mock session! Very realistic and constructive."
        }
        res_rev = await ac.post(f"/api/v1/mentorship/sessions/{session_id}/review", json=rev_payload, headers=headers)
        assert res_rev.status_code == 200
        assert res_rev.json()["junior_review"]["rating"] == 5

        # 15. Check Senior profile reflects rating
        res_prof = await ac.get(f"/api/v1/users/{senior_id}")
        assert res_prof.status_code == 200
        assert res_prof.json()["average_rating"] == 5.0
        assert res_prof.json()["ratings_count"] == 1

        # 16. Test Admin flows
        from app.core.security import get_password_hash
        admin_doc = {
            "full_name": "Dean Admin",
            "email": "dean@seniors4juniors.edu",
            "password_hash": get_password_hash("AdminPass123!"),
            "college_name": "IIT Bombay",
            "roll_number": "ADM01",
            "enrollment_number": "ENRADM01",
            "branch": "Admin",
            "college_year": 5,
            "current_semester": 10,
            "role": "admin",
            "is_verified": True,
            "email_verified": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        await db_instance.db.users.insert_one(admin_doc)

        admin_login = await ac.post("/api/v1/auth/login", json={"email": "dean@seniors4juniors.edu", "password": "AdminPass123!"}, headers=headers)
        assert admin_login.status_code == 200

        res_ver = await ac.put(f"/api/v1/admin/seniors/{senior_id}/verify", json={"is_verified": True, "notes": "Approved by Dean"}, headers=headers)
        assert res_ver.status_code == 200

        res_prof_verified = await ac.get(f"/api/v1/users/{senior_id}")
        assert res_prof_verified.json()["is_verified"] is True

        audit_res = await ac.get("/api/v1/admin/audit-logs")
        assert audit_res.status_code == 200
        assert len(audit_res.json()) > 0
        assert audit_res.json()[0]["action"] == "VERIFY_SENIOR"

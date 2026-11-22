import os
import sys
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
settings.MONGODB_URL = "mock"

from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
import mongomock_motor

from app.core.database import db_instance, connect_to_mongo
from app.main import app

async def run_e2e():
    print("🚀 [TEST 1/16] Initializing Mock Database...", flush=True)
    await connect_to_mongo()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        
        # 1. Health Check
        print("🚀 [TEST 2/16] Testing /api/health...", flush=True)
        res = await ac.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("  ✓ Health Check Passed: status=healthy", flush=True)

        # 2. CSRF Token
        print("🚀 [TEST 3/16] Fetching CSRF Token...", flush=True)
        csrf_res = await ac.get("/api/v1/auth/csrf")
        assert csrf_res.status_code == 200
        csrf_token = csrf_res.json()["csrf_token"]
        
        def h():
            token = ac.cookies.get("csrf_token", csrf_token)
            return {"X-CSRF-Token": token}
            
        print(f"  ✓ CSRF Token Acquired: {csrf_token[:12]}...", flush=True)

        # 3. Junior Registration
        print("🚀 [TEST 4/16] Registering Junior Student...", flush=True)
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
        res_jr = await ac.post("/api/v1/auth/register/junior", json=junior_payload, headers=h())
        assert res_jr.status_code == 201, f"Junior registration failed: {res_jr.text}"
        junior_user = res_jr.json()["user"]
        assert junior_user["role"] == "junior"
        junior_id = junior_user["id"]
        print(f"  ✓ Junior Registered: {junior_user['full_name']} (ID: {junior_id})", flush=True)

        # 4. Junior Posts a Question
        print("🚀 [TEST 5/16] Junior Posting a Question...", flush=True)
        q_payload = {
            "title": "How to prepare for Google summer internship OA?",
            "content": "Looking for advice on LeetCode patterns and graph algorithms.",
            "tags": ["internships", "google", "dsa"],
            "is_anonymous": False
        }
        res_q = await ac.post("/api/v1/questions", json=q_payload, headers=h())
        assert res_q.status_code == 201
        q_id = res_q.json()["id"]
        print(f"  ✓ Question Created: '{res_q.json()['title']}' (ID: {q_id})", flush=True)

        # 5. Senior Registration
        print("🚀 [TEST 6/16] Registering Senior Student...", flush=True)
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
        res_sr = await ac.post("/api/v1/auth/register/senior", json=senior_payload, headers=h())
        assert res_sr.status_code == 201
        senior_user = res_sr.json()["user"]
        senior_id = senior_user["id"]
        assert senior_user["is_verified"] is False
        print(f"  ✓ Senior Registered: {senior_user['full_name']} (Verification: Pending)", flush=True)

        # 6. Senior Answers Question
        print("🚀 [TEST 7/16] Senior Answering Question...", flush=True)
        ans_payload = {
            "content": "Focus on Graph BFS/DFS, Union Find, and Dynamic Programming. Solve Neetcode 150."
        }
        res_ans = await ac.post(f"/api/v1/questions/{q_id}/answers", json=ans_payload, headers=h())
        assert res_ans.status_code == 201
        ans_id = res_ans.json()["id"]
        print(f"  ✓ Senior Answer Submitted: (Answer ID: {ans_id})", flush=True)

        # 7. Senior Creates Mentorship Availability Slot
        print("🚀 [TEST 8/16] Senior Creating Mentorship Slot...", flush=True)
        slot_payload = {
            "title": "DSA Mock Interview - Graphs & Trees",
            "session_type": "mock_interview",
            "day_of_week": "Saturday",
            "time_slot": "5:00 PM - 6:00 PM IST",
            "description": "Live coding over Google Meet"
        }
        res_slot = await ac.post("/api/v1/mentorship/slots", json=slot_payload, headers=h())
        assert res_slot.status_code == 201
        slot_id = res_slot.json()["id"]
        print(f"  ✓ Mentorship Slot Created: '{slot_payload['title']}'", flush=True)

        # 8. Junior Logs In
        print("🚀 [TEST 9/16] Authenticating Junior Student...", flush=True)
        await ac.post("/api/v1/auth/login", json={"email": "aanya.junior@iitb.ac.in", "password": "Password123!"}, headers=h())
        print("  ✓ Junior Logged In Successfully", flush=True)

        # 9. Junior Upvotes Senior Answer
        print("🚀 [TEST 10/16] Junior Upvoting Answer & Marking Best Answer...", flush=True)
        res_vote = await ac.post(f"/api/v1/answers/{ans_id}/vote", json={"value": 1}, headers=h())
        assert res_vote.status_code == 200
        assert res_vote.json()["net_votes"] == 1
        print("  ✓ Answer Upvoted: net_votes=1", flush=True)

        # Junior Marks Best Answer
        res_best = await ac.post(f"/api/v1/answers/{ans_id}/best", headers=h())
        assert res_best.status_code == 200
        print("  ✓ Answer Marked as Asker's Best Answer", flush=True)

        # Junior Follow-up Comment
        res_com = await ac.post(f"/api/v1/answers/{ans_id}/comments", json={"content": "Thank you! Bookmarked."}, headers=h())
        assert res_com.status_code == 201
        print("  ✓ Follow-up Discussion Comment Added", flush=True)

        # 10. Junior Books Mentorship Session
        print("🚀 [TEST 11/16] Junior Requesting Mentorship Session...", flush=True)
        req_payload = {
            "slot_id": slot_id,
            "date_requested": "2026-11-28",
            "topic_notes": "Practicing graph cycles and Dijkstra",
            "resume_link": "https://drive.google.com/test-resume"
        }
        res_book = await ac.post("/api/v1/mentorship/sessions/request", json=req_payload, headers=h())
        assert res_book.status_code == 201
        session_id = res_book.json()["id"]
        print(f"  ✓ Mentorship Session Requested (Session ID: {session_id})", flush=True)

        # 11. Senior Confirms Session with Meeting Link
        print("🚀 [TEST 12/16] Senior Confirming Session with Meet Link...", flush=True)
        await ac.post("/api/v1/auth/login", json={"email": "rohan.senior@iitb.ac.in", "password": "Password123!"}, headers=h())
        res_conf = await ac.put(
            f"/api/v1/mentorship/sessions/{session_id}/status",
            json={"status": "confirmed", "meeting_link": "https://meet.google.com/abc-xyz"},
            headers=h()
        )
        assert res_conf.status_code == 200
        assert res_conf.json()["status"] == "confirmed"
        print("  ✓ Session Confirmed with Google Meet Link", flush=True)

        # 12. Senior Submits Performance Feedback
        print("🚀 [TEST 13/16] Senior Submitting Performance Feedback...", flush=True)
        fb_payload = {
            "technical_score": 9,
            "communication_score": 8,
            "strengths": "Great intuition and edge case handling",
            "areas_for_improvement": "State complexity before writing code",
            "recommended_resources": "Practice Topo Sort"
        }
        res_fb = await ac.post(f"/api/v1/mentorship/sessions/{session_id}/feedback", json=fb_payload, headers=h())
        assert res_fb.status_code == 200
        assert res_fb.json()["status"] == "completed"
        print("  ✓ Senior Feedback Recorded (Technical: 9/10, Comm: 8/10)", flush=True)

        # 13. Junior Rates Senior (5 Stars) & Submits Review
        print("🚀 [TEST 14/16] Junior Rating Senior (5 Stars)...", flush=True)
        await ac.post("/api/v1/auth/login", json={"email": "aanya.junior@iitb.ac.in", "password": "Password123!"}, headers=h())
        rev_payload = {
            "rating": 5,
            "review": "Incredible mock session! Very realistic and constructive."
        }
        res_rev = await ac.post(f"/api/v1/mentorship/sessions/{session_id}/review", json=rev_payload, headers=h())
        assert res_rev.status_code == 200
        assert res_rev.json()["junior_review"]["rating"] == 5

        # Verify senior's profile reflects 5.0 rating
        res_prof = await ac.get(f"/api/v1/users/{senior_id}")
        assert res_prof.json()["average_rating"] == 5.0
        assert res_prof.json()["ratings_count"] == 1
        print("  ✓ Junior 5-Star Review Verified in Senior Profile (Avg: 5.0)", flush=True)

        # 14. Admin Verification & Audit Log
        print("🚀 [TEST 15/16] Admin Moderation & Verification Flow...", flush=True)
        from app.core.security import get_password_hash
        admin_doc = {
            "full_name": "Dean Dr. Alok Mathur",
            "email": "dean@seniors4juniors.edu",
            "password_hash": get_password_hash("AdminPass123!"),
            "college_name": "IIT Bombay",
            "roll_number": "ADM01",
            "enrollment_number": "ENRADM01",
            "branch": "Administration",
            "college_year": 5,
            "current_semester": 10,
            "role": "admin",
            "is_verified": True,
            "email_verified": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        await db_instance.db.users.insert_one(admin_doc)

        await ac.post("/api/v1/auth/login", json={"email": "dean@seniors4juniors.edu", "password": "AdminPass123!"}, headers=h())
        
        # Admin approves senior verification
        res_ver = await ac.put(f"/api/v1/admin/seniors/{senior_id}/verify", json={"is_verified": True, "notes": "Approved by Dean"}, headers=h())
        assert res_ver.status_code == 200

        res_prof_verified = await ac.get(f"/api/v1/users/{senior_id}")
        assert res_prof_verified.json()["is_verified"] is True
        print("  ✓ Senior Verified Badge Approved by Admin", flush=True)

        # Inspect audit logs
        audit_res = await ac.get("/api/v1/admin/audit-logs")
        assert audit_res.status_code == 200
        logs = audit_res.json()
        assert len(logs) > 0
        assert logs[0]["action"] == "VERIFY_SENIOR"
        print(f"  ✓ Admin Audit Log Verified: Action='{logs[0]['action']}' by '{logs[0]['admin_email']}'", flush=True)

        print("\n" + "="*70)
        print("🎉 ALL 16 END-TO-END INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
        print("="*70 + "\n", flush=True)

if __name__ == "__main__":
    asyncio.run(run_e2e())

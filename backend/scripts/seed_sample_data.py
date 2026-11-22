import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from app.core.config import settings
from app.core.security import get_password_hash

async def seed_sample_data():
    print(f"Connecting to MongoDB at {settings.MONGODB_URL} (Database: {settings.DATABASE_NAME})...")
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]

    try:
        await client.admin.command('ping')
    except Exception as e:
        print(f"\n❌ Error: Could not connect to MongoDB at {settings.MONGODB_URL}.")
        print("Please ensure MongoDB is running locally (`mongod` or Docker: `docker run -p 27017:27017 -d mongo`),")
        print("or specify a valid remote MongoDB Atlas URI in backend/.env (MONGODB_URL=...).")
        print(f"Details: {e}\n")
        client.close()
        return

    college = "Indian Institute of Technology, Bombay"
    now = datetime.now(timezone.utc)

    print("\n--- Seeding Sample Juniors and Seniors ---")
    
    # 1. Sample Seniors
    senior_1 = {
        "full_name": "Aarav Sharma",
        "email": "aarav.senior@iitb.ac.in",
        "password_hash": get_password_hash("SeniorPass123!"),
        "college_name": college,
        "roll_number": "210050012",
        "enrollment_number": "ENR-21-CSE-012",
        "branch": "Computer Science & Engineering",
        "college_year": 4,
        "current_semester": 7,
        "role": "senior",
        "is_verified": True,
        "email_verified": True,
        "bio": "Final year CSE student. Placed at Google as Software Engineer. Passionate about Distributed Systems and Competitive Programming (Candidate Master on CF).",
        "areas_of_expertise": ["Data Structures & Algorithms", "System Design", "C++", "Google Interview Prep"],
        "placement_history": "Received offers from Google (SWE FTE), Microsoft (Intern), and Uber.",
        "mentorship_available": True,
        "answers_count": 4,
        "net_upvotes": 42,
        "average_rating": 4.9,
        "ratings_count": 8,
        "followers_count": 19,
        "is_active": True,
        "created_at": now - timedelta(days=60)
    }

    senior_2 = {
        "full_name": "Priya Patel",
        "email": "priya.senior@iitb.ac.in",
        "password_hash": get_password_hash("SeniorPass123!"),
        "college_name": college,
        "roll_number": "220040045",
        "enrollment_number": "ENR-22-EE-045",
        "branch": "Electrical Engineering",
        "college_year": 3,
        "current_semester": 5,
        "role": "senior",
        "is_verified": True,
        "email_verified": True,
        "bio": "3rd Year EE switching to FinTech & Quant. Goldman Sachs Summer Analyst incoming. Active mentor for non-CS students breaking into software.",
        "areas_of_expertise": ["Quant Finance", "Python", "DSA for Non-CS", "Resume Review"],
        "placement_history": "Goldman Sachs Summer Analyst (2025)",
        "mentorship_available": True,
        "answers_count": 3,
        "net_upvotes": 28,
        "average_rating": 5.0,
        "ratings_count": 5,
        "followers_count": 14,
        "is_active": True,
        "created_at": now - timedelta(days=45)
    }

    # 2. Sample Juniors
    junior_1 = {
        "full_name": "Ananya Gupta",
        "email": "ananya.junior@iitb.ac.in",
        "password_hash": get_password_hash("JuniorPass123!"),
        "college_name": college,
        "roll_number": "240050089",
        "enrollment_number": "ENR-24-CSE-089",
        "branch": "Computer Science & Engineering",
        "college_year": 1,
        "current_semester": 2,
        "role": "junior",
        "is_verified": False,
        "email_verified": True,
        "bio": "Freshman enthusiastic about Web3, Machine Learning, and algorithms. Looking for guidance on 2nd year internships.",
        "interests": ["Full-Stack Development", "Competitive Programming", "Open Source"],
        "career_goals": "Aspiring to crack an off-campus FAANG internship and build innovative dev tools.",
        "answers_count": 0,
        "net_upvotes": 0,
        "average_rating": 0.0,
        "ratings_count": 0,
        "followers_count": 2,
        "is_active": True,
        "created_at": now - timedelta(days=30)
    }

    junior_2 = {
        "full_name": "Vikram Malhotra",
        "email": "vikram.junior@iitb.ac.in",
        "password_hash": get_password_hash("JuniorPass123!"),
        "college_name": college,
        "roll_number": "230020033",
        "enrollment_number": "ENR-23-ME-033",
        "branch": "Mechanical Engineering",
        "college_year": 2,
        "current_semester": 3,
        "role": "junior",
        "is_verified": False,
        "email_verified": True,
        "bio": "Sophomore in Mechanical engineering exploring software development and robotics.",
        "interests": ["Robotics", "Python", "Data Structures"],
        "career_goals": "Transitioning to Autonomous Vehicle Software Engineering.",
        "answers_count": 0,
        "net_upvotes": 0,
        "average_rating": 0.0,
        "ratings_count": 0,
        "followers_count": 1,
        "is_active": True,
        "created_at": now - timedelta(days=20)
    }

    # Upsert users
    users_to_seed = [
        ("aarav.senior@iitb.ac.in", senior_1),
        ("priya.senior@iitb.ac.in", senior_2),
        ("ananya.junior@iitb.ac.in", junior_1),
        ("vikram.junior@iitb.ac.in", junior_2)
    ]

    user_ids = {}
    for email, udoc in users_to_seed:
        existing = await db.users.find_one({"email": email})
        if existing:
            user_ids[email] = str(existing["_id"])
            await db.users.update_one({"email": email}, {"$set": udoc})
            print(f"✓ Updated user: {udoc['full_name']} ({email})")
        else:
            res = await db.users.insert_one(udoc)
            user_ids[email] = str(res.inserted_id)
            print(f"✓ Inserted user: {udoc['full_name']} ({email})")

    # 3. Questions
    print("\n--- Seeding Questions & Answers ---")
    q1_doc = {
        "title": "How should a 2nd year student realistically prepare for Google / Microsoft summer internships?",
        "content": "I am in my 3rd semester right now. My current rating on LeetCode is around 1600. What topics are most heavily tested in the on-campus OA and technical rounds? How should I balance CP, projects, and maintaining a high CGPA?",
        "tags": ["internships", "dsa", "google", "placements"],
        "is_anonymous": False,
        "asker_id": user_ids["ananya.junior@iitb.ac.in"],
        "asker_name": "Ananya Gupta",
        "asker_role": "junior",
        "asker_branch": "Computer Science & Engineering",
        "college_name": college,
        "answers_count": 1,
        "views_count": 154,
        "net_votes": 18,
        "best_answer_id": None,
        "is_deleted": False,
        "created_at": now - timedelta(days=12)
    }
    
    q1_existing = await db.questions.find_one({"title": q1_doc["title"]})
    if q1_existing:
        q1_id = str(q1_existing["_id"])
    else:
        res = await db.questions.insert_one(q1_doc)
        q1_id = str(res.inserted_id)
    print("✓ Seeded Question 1: Internship Preparation Strategy")

    # Answer for Q1 by Senior Aarav
    ans1_doc = {
        "question_id": q1_id,
        "senior_id": user_ids["aarav.senior@iitb.ac.in"],
        "senior_name": "Aarav Sharma",
        "senior_role": "senior",
        "senior_branch": "Computer Science & Engineering",
        "senior_year": 4,
        "senior_verified": True,
        "content": """Here is the exact blueprint I followed when I cleared Google's SWE internship:

1. **DSA Topics Breakdown (Priority Order)**:
   - Graph Algorithms (BFS, DFS, Dijkstra, Topo Sort, Union-Find) - Tested in 80% of Google rounds.
   - Dynamic Programming (1D, 2D, DP on trees, knapsack variants).
   - Trees & Binary Search (Binary Search on Answer is a favorite).
   - Sliding Window & Two Pointers.

2. **LeetCode Strategy**:
   - Don't just solve random problems. Solve by pattern (e.g., Striver's SDE Sheet or NeetCode 150).
   - Reach 1800+ contest rating before the hiring season kicks off in August.

3. **Projects & CGPA**:
   - Keep CGPA >= 8.0 to safely clear every company shortlist.
   - Build 1 deep, production-grade project (e.g., a distributed cache or real-time websocket tool) instead of 5 trivial todo apps.

Feel free to book a mock interview with me before the season starts!""",
        "upvotes": 19,
        "downvotes": 0,
        "net_votes": 19,
        "is_best_answer": True,
        "comments_count": 1,
        "is_deleted": False,
        "created_at": now - timedelta(days=10)
    }

    ans1_existing = await db.answers.find_one({"question_id": q1_id, "senior_id": user_ids["aarav.senior@iitb.ac.in"]})
    if ans1_existing:
        ans1_id = str(ans1_existing["_id"])
    else:
        res = await db.answers.insert_one(ans1_doc)
        ans1_id = str(res.inserted_id)

    # Set as best answer
    await db.questions.update_one({"_id": ObjectId(q1_id)}, {"$set": {"best_answer_id": ans1_id}})

    # Comment on Answer
    await db.comments.update_one(
        {"answer_id": ans1_id},
        {"$set": {
            "answer_id": ans1_id,
            "author_id": user_ids["ananya.junior@iitb.ac.in"],
            "author_name": "Ananya Gupta",
            "author_role": "junior",
            "content": "Thank you so much Aarav bhaiya! This is immensely helpful. I will book a mock slot soon.",
            "is_deleted": False,
            "created_at": now - timedelta(days=9)
        }},
        upsert=True
    )

    # Question 2 by Vikram
    q2_doc = {
        "title": "Can non-CS branches (Mechanical / Electrical) sit for top tier software and quant placements?",
        "content": "As a Mechanical sophomore, how many tech companies allow non-circuital branches during campus placements? What extra steps should I take to get past the resume screening?",
        "tags": ["branch-choice", "placements", "career"],
        "is_anonymous": True,
        "asker_id": user_ids["vikram.junior@iitb.ac.in"],
        "asker_name": "Anonymous Junior",
        "asker_role": "junior",
        "asker_branch": "Mechanical Engineering",
        "college_name": college,
        "answers_count": 1,
        "views_count": 98,
        "net_votes": 12,
        "best_answer_id": None,
        "is_deleted": False,
        "created_at": now - timedelta(days=7)
    }
    q2_existing = await db.questions.find_one({"title": q2_doc["title"]})
    if q2_existing:
        q2_id = str(q2_existing["_id"])
    else:
        res = await db.questions.insert_one(q2_doc)
        q2_id = str(res.inserted_id)

    # Answer for Q2 by Priya
    ans2_doc = {
        "question_id": q2_id,
        "senior_id": user_ids["priya.senior@iitb.ac.in"],
        "senior_name": "Priya Patel",
        "senior_role": "senior",
        "senior_branch": "Electrical Engineering",
        "senior_year": 3,
        "senior_verified": True,
        "content": "Speaking from personal experience in Electrical: Yes! More than 70% of software firms and nearly all high-frequency trading (HFT) and quant firms allow non-CS students provided you have a solid CGPA (preferably >= 8.5) and good math/coding fundamentals. Don't let your branch discourage you!",
        "upvotes": 12,
        "downvotes": 0,
        "net_votes": 12,
        "is_best_answer": True,
        "comments_count": 0,
        "is_deleted": False,
        "created_at": now - timedelta(days=6)
    }
    ans2_existing = await db.answers.find_one({"question_id": q2_id, "senior_id": user_ids["priya.senior@iitb.ac.in"]})
    if ans2_existing:
        ans2_id = str(ans2_existing["_id"])
    else:
        res = await db.answers.insert_one(ans2_doc)
        ans2_id = str(res.inserted_id)
    await db.questions.update_one({"_id": ObjectId(q2_id)}, {"$set": {"best_answer_id": ans2_id}})

    # 4. Communities
    print("\n--- Seeding Communities ---")
    comm_1 = {
        "name": "Competitive Programming & DSA Club",
        "description": "Daily LeetCode discussions, Codeforces contest analysis, and interview problem-solving group for all batches.",
        "category": "Coding & Tech",
        "college_name": college,
        "created_by": user_ids["aarav.senior@iitb.ac.in"],
        "creator_name": "Aarav Sharma",
        "is_private": False,
        "members_count": 4,
        "posts_count": 1,
        "is_deleted": False,
        "created_at": now - timedelta(days=40)
    }
    comm_1_res = await db.communities.update_one(
        {"name": comm_1["name"], "college_name": college},
        {"$set": comm_1},
        upsert=True
    )
    comm_1_doc = await db.communities.find_one({"name": comm_1["name"], "college_name": college})
    comm_1_id = str(comm_1_doc["_id"])

    # Add community post
    await db.community_posts.update_one(
        {"title": "Weekly LeetCode Hard Walkthrough: Segment Trees & Fenwick Trees"},
        {"$set": {
            "community_id": comm_1_id,
            "author_id": user_ids["aarav.senior@iitb.ac.in"],
            "author_name": "Aarav Sharma",
            "author_role": "senior",
            "title": "Weekly LeetCode Hard Walkthrough: Segment Trees & Fenwick Trees",
            "content": "Hey everyone, this Saturday at 5 PM IST I'm running a live walkthrough solving 3 classic Range Query problems. Come with pen and paper!",
            "comments_count": 1,
            "is_deleted": False,
            "created_at": now - timedelta(days=2)
        }},
        upsert=True
    )

    # 5. Job Trends
    print("\n--- Seeding Job Trends ---")
    jobs = [
        {
            "company": "Google",
            "role": "Software Engineering Summer Intern (2026)",
            "package_range": "₹1.25L - ₹1.5L / month stipend",
            "skills": ["C++", "Java", "Python", "Data Structures", "Algorithms"],
            "eligibility": "B.Tech pre-final year students (CSE, EE, MnC, Mech). Minimum CGPA: 7.5",
            "deadline": "2026-12-15",
            "category": "internship",
            "application_link": "https://careers.google.com/students",
            "description": "Work with world-class engineering teams building distributed scale systems. 10-12 weeks duration in Bangalore or Hyderabad.",
            "posted_by": user_ids["aarav.senior@iitb.ac.in"],
            "posted_by_name": "Aarav Sharma",
            "college_name": college,
            "is_deleted": False,
            "created_at": now - timedelta(days=3)
        },
        {
            "company": "Microsoft",
            "role": "Software Engineer (Full-Time)",
            "package_range": "45 - 52 LPA CTC",
            "skills": ["Algorithms", "System Design", "Cloud Computing", "C# / Java"],
            "eligibility": "Graduating batch of 2026. All engineering disciplines with CGPA >= 7.0.",
            "deadline": "2026-11-30",
            "category": "full-time",
            "application_link": "https://careers.microsoft.com",
            "description": "Full-time campus hiring drive for Azure Core, Teams, and Office 365 divisions.",
            "posted_by": user_ids["priya.senior@iitb.ac.in"],
            "posted_by_name": "Priya Patel",
            "college_name": college,
            "is_deleted": False,
            "created_at": now - timedelta(days=5)
        },
        {
            "company": "Flipkart",
            "role": "Flipkart GRiD 7.0 Robotics & E-Commerce Challenge",
            "package_range": "Cash Prizes worth ₹10 Lakhs + PPIs",
            "skills": ["Computer Vision", "Reinforcement Learning", "Web Dev"],
            "eligibility": "Open to all engineering students, 1st to 4th year.",
            "deadline": "2026-12-05",
            "category": "hackathon",
            "application_link": "https://unstop.com/hackathons/flipkart-grid",
            "description": "National level engineering challenge with direct pre-placement interview opportunities.",
            "posted_by": user_ids["aarav.senior@iitb.ac.in"],
            "posted_by_name": "Aarav Sharma",
            "college_name": college,
            "is_deleted": False,
            "created_at": now - timedelta(days=4)
        }
    ]

    for j in jobs:
        await db.job_trends.update_one(
            {"company": j["company"], "role": j["role"]},
            {"$set": j},
            upsert=True
        )
    print("✓ Seeded 3 Job Trends (Internship, Full-Time, Hackathon)")

    # 6. Interview Experiences
    print("\n--- Seeding Interview Experiences ---")
    int_exp = {
        "senior_id": user_ids["aarav.senior@iitb.ac.in"],
        "senior_name": "Aarav Sharma",
        "senior_branch": "Computer Science & Engineering",
        "college_name": college,
        "company": "Google",
        "role": "Software Engineer (L3)",
        "year": 2026,
        "number_of_rounds": 4,
        "difficulty": "Hard",
        "outcome": "Selected",
        "overall_experience": "Google's interview was by far the cleanest and most transparent hiring experience. Every interviewer focused on edge case analysis, clean code modularity, and time/space complexity derivation.",
        "rounds": [
            {
                "round_number": 1,
                "round_name": "Online Assessment (OA)",
                "question_types": ["DSA", "Strings", "Graphs"],
                "questions_asked": "2 questions in 60 minutes. Q1 was a variation of Dijkstra on a 2D grid with cost states. Q2 was string hashing/KMP with palindrome constraints.",
                "tips": "Practice on Codeforces Div2 C/D level to ensure speed."
            },
            {
                "round_number": 2,
                "round_name": "Technical Round 1",
                "question_types": ["Binary Trees", "Recursion", "Optimizations"],
                "questions_asked": "Lowest Common Ancestor in a ternary tree with node values satisfying a custom heap property. Follow up: Handle streaming queries.",
                "tips": "Always speak aloud while whiteboarding. Communicate trade-offs before writing a single line of code."
            },
            {
                "round_number": 3,
                "round_name": "Technical Round 2",
                "question_types": ["Dynamic Programming", "Memoization"],
                "questions_asked": "Multi-dimensional DP problem involving scheduling tasks with cool-down periods and energy constraints.",
                "tips": "Write unit test cases at the bottom of your Google Doc."
            },
            {
                "round_number": 4,
                "round_name": "Googliness & Leadership",
                "question_types": ["Behavioral", "Teamwork", "Ethics"],
                "questions_asked": "Tell me about a time you had a technical disagreement with a team member. How did you handle project deadlines slipping?",
                "tips": "Use the STAR method (Situation, Task, Action, Result) cleanly."
            }
        ],
        "views_count": 210,
        "is_deleted": False,
        "created_at": now - timedelta(days=15)
    }

    await db.interview_experiences.update_one(
        {"company": int_exp["company"], "role": int_exp["role"]},
        {"$set": int_exp},
        upsert=True
    )
    print("✓ Seeded Multi-Round Google Interview Experience")

    # 7. Mentorship Slots & Completed Session
    print("\n--- Seeding Mentorship Availability Slots & Sessions ---")
    slot_1 = {
        "senior_id": user_ids["aarav.senior@iitb.ac.in"],
        "senior_name": "Aarav Sharma",
        "senior_branch": "Computer Science & Engineering",
        "senior_college": college,
        "senior_verified": True,
        "title": "DSA Mock Interview & Code Review",
        "session_type": "mock_interview",
        "day_of_week": "Saturday",
        "time_slot": "5:00 PM - 6:00 PM IST",
        "description": "45-min live coding problem over Google Meet + 15-min deep performance critique and optimization tips.",
        "is_active": True,
        "created_at": now - timedelta(days=20)
    }
    slot_res = await db.mentorship_slots.update_one(
        {"title": slot_1["title"], "senior_id": user_ids["aarav.senior@iitb.ac.in"]},
        {"$set": slot_1},
        upsert=True
    )
    slot_doc = await db.mentorship_slots.find_one({"title": slot_1["title"], "senior_id": user_ids["aarav.senior@iitb.ac.in"]})
    slot_id = str(slot_doc["_id"])

    # Completed session with feedback & review
    session_sample = {
        "slot_id": slot_id,
        "slot_title": "DSA Mock Interview & Code Review",
        "session_type": "mock_interview",
        "senior_id": user_ids["aarav.senior@iitb.ac.in"],
        "senior_name": "Aarav Sharma",
        "junior_id": user_ids["ananya.junior@iitb.ac.in"],
        "junior_name": "Ananya Gupta",
        "college_name": college,
        "date_requested": "2026-11-18",
        "time_slot": "5:00 PM - 6:00 PM IST",
        "topic_notes": "Practicing graph traversal and dynamic programming. Want to check my communication during problem solving.",
        "resume_link": "https://drive.google.com/sample-resume",
        "meeting_link": "https://meet.google.com/xyz-abcd-qrs",
        "status": "completed",
        "senior_feedback": {
            "technical_score": 9,
            "communication_score": 8,
            "strengths": "Great intuition for Graph BFS and clean naming conventions. Handled edge cases promptly.",
            "areas_for_improvement": "Spend slightly more time stating the time complexity before coding rather than calculating at the end.",
            "recommended_resources": "Practice Topo Sort variations on LeetCode.",
            "submitted_at": (now - timedelta(days=2)).isoformat()
        },
        "junior_review": {
            "rating": 5,
            "review": "Aarav bhaiya gave outstanding, honest feedback! The mock felt exactly like a real Google interview. Highly recommended!",
            "submitted_at": (now - timedelta(days=1)).isoformat()
        },
        "created_at": now - timedelta(days=4),
        "updated_at": now - timedelta(days=1)
    }

    await db.mentorship_sessions.update_one(
        {"slot_id": slot_id, "junior_id": user_ids["ananya.junior@iitb.ac.in"]},
        {"$set": session_sample},
        upsert=True
    )
    print("✓ Seeded Completed Mentorship Session with Feedback & 5-Star Review")

    print("\n=======================================================")
    print(" SAMPLE DATA SEEDING COMPLETE!")
    print(" Users available for immediate login:")
    print("  • Junior: ananya.junior@iitb.ac.in | JuniorPass123!")
    print("  • Junior: vikram.junior@iitb.ac.in | JuniorPass123!")
    print("  • Senior: aarav.senior@iitb.ac.in   | SeniorPass123! (Verified)")
    print("  • Senior: priya.senior@iitb.ac.in   | SeniorPass123! (Verified)")
    print("=======================================================\n")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_sample_data())

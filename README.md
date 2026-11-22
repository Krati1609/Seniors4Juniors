# Seniors4Juniors (S4J) 🎓

A college-niche Q&A and mentorship platform where juniors get answers, interview experiences, and mock interviews from verified seniors of their own college.

## Screenshots
<!-- Add 3-4 images: home feed, question page, senior profile, mentorship booking -->

## Features
- **College-scoped Q&A:** tagged questions, optional anonymity, upvote/downvote, best answer
- **Home feed:** infinite scroll with a job trends sidebar
- **Communities:** public or private groups with discussions
- **Job trends and interview experiences:** filterable by company, role, and type
- **Mentorship and mock interviews:** slot booking, meeting links, feedback, 5-star reviews
- **Admin panel:** three individual admin logins, senior verification, moderation, audit logs

## Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router
- **Backend:** FastAPI (async), Pydantic v2
- **Database:** MongoDB Atlas (Motor driver)

## Security
- httpOnly cookie auth with refresh token rotation
- CSRF protection, login lockout, rate limiting
- Input sanitization against XSS and NoSQL injection
- Role-based access control and college-level data scoping

## Roles
- **Junior:** asks questions, joins communities, books sessions
- **Senior:** answers questions, posts interview experiences, offers mentorship
- **Admin:** verifies seniors, moderates content

## Getting Started

**Prerequisites:** Node.js 18+, Python 3.10+, a MongoDB Atlas cluster

1. **Backend**
   ```
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
   Copy `.env.example` to `.env` and set `MONGODB_URL` to your Atlas connection string.
   ```
   python scripts/seed_admins.py
   python scripts/seed_sample_data.py
   python -m uvicorn app.main:app --reload --port 8000
   ```
   API docs: http://localhost:8000/docs

2. **Frontend** (new terminal)
   ```
   cd frontend
   npm install
   npm run dev
   ```
   App: http://localhost:5173

Seed scripts create fictional demo accounts. Change all default passwords before any deployment.

## Team
- Your Name (GitHub link)
- Teammate 2
- Teammate 3

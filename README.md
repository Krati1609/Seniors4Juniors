# Seniors4Juniors (S4J) 🎓

> **A Quora-style, college-niche Q&A, community, and mentorship platform connecting juniors with verified seniors of the same college.**

[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_+_Motor-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/Tests-16%2F16_E2E_Passed-success)](#testing--verification)

---

## 📋 Table of Contents
1. [Overview & Key Features](#overview--key-features)
2. [Tech Stack](#tech-stack)
3. [Design System & Palette Tokens](#design-system--palette-tokens)
4. [Security Architecture](#security-architecture)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Pre-Seeded Credentials](#pre-seeded-credentials)
7. [Step-by-Step Setup & Installation](#step-by-step-setup--installation)
   - [Prerequisites](#prerequisites)
   - [1. Database Configuration (MongoDB)](#1-database-configuration-mongodb)
   - [2. Backend Setup](#2-backend-setup)
   - [3. Seeding Database (Admins & Sample Data)](#3-seeding-database-admins--sample-data)
   - [4. Frontend Setup](#4-frontend-setup)
8. [Testing & Verification](#testing--verification)
9. [Project Directory Layout](#project-directory-layout)

---

## 🌟 Overview & Key Features

**Seniors4Juniors** bridges the gap between college juniors and experienced seniors within the same campus. Juniors gain verified guidance on placements, competitive programming, research, and campus life, while seniors build mentorship portfolios and share interview experiences.

### Core Modules:
- ❓ **College-Scoped Q&A**: Juniors ask questions with tags (`placements`, `dsa`, `internships`, etc.) and optional anonymity. Answers are authored by seniors, upvoted/downvoted, and askers can mark a **Best Answer**.
- 📰 **Campus Home Feed**: Infinite-scroll feed combining Q&A, trending campus job opportunities, and verified senior highlights.
- 👥 **Campus Communities**: Create, join, and participate in public or private interest groups (e.g., *IITB Competitive Coding Club*, *Robotics & Embedded Systems*).
- 💼 **Job Trends & Campus Drives**: Curated hiring updates (internships, full-time, hackathons) with package ranges, eligibility criteria, skills, and deadlines.
- 🎯 **Multi-Round Interview Experiences**: Comprehensive interview archives detailing round-by-round question types, topics, difficulty levels, and outcomes (Google, Microsoft, Goldman Sachs, etc.).
- 🤝 **Mentorship & Mock Interviews**: Seniors declare available time slots; juniors request bookings. Sessions feature video meeting links (Google Meet/Zoom), post-session technical & communication scores from seniors, and 5-star junior ratings.
- 🛡️ **Comprehensive Admin Panel**: Role-based access for 3 individual administrators to approve/reject senior verifications, moderate content, handle user reports, and monitor immutable audit logs.
- 🔔 **Real-Time In-App Notifications**: Instant notifications for answers, votes, session approvals, and reports.
- 🚩 **Moderation & Reporting**: Community-driven reporting system for questions, answers, posts, and users.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 with custom CSS variables & theme tokens
- **Icons**: Lucide React
- **API Client**: Axios with `withCredentials: true`, automatic CSRF token injection, and 401 token refresh interceptors
- **Theme**: Dark and Light mode support with seamless toggle

### Backend
- **Framework**: Python 3.10+ / FastAPI (fully asynchronous)
- **Database Driver**: Motor (Async MongoDB driver) + PyMongo + `mongomock_motor` fallback
- **Validation**: Pydantic v2 schemas for all requests and responses
- **Security & Cryptography**: Passlib (bcrypt) password hashing, PyJWT (HS256)
- **Rate Limiting**: Slowapi (token bucket rate limiter with remote IP resolution)
- **Content Sanitization**: Bleach HTML sanitization for XSS prevention and safe BSON casting against NoSQL injection

### Database
- **Engine**: MongoDB 6.0+ (supports local instance or MongoDB Atlas cluster)

---

## 🎨 Design System & Palette Tokens

The design adheres to accessible (WCAG AA compliant) color tokens:

| Token Name | Hex Code | Role | Description |
| :--- | :--- | :--- | :--- |
| **Marine Blue** | `#0B3C5D` | Primary | Navbar, headings, primary buttons, links, brand accent |
| **Crimson Red** | `#D92626` | Accent | CTAs, notification badges, downvotes, reports, alert states |
| **Warm Butter Yellow** | `#F7D070` | Highlight | Surface cards, banners, "Verified" badge, "Best Answer" badge |
| **Off-White (Light)** | `#F8FAFC` | Surface Light | Clean page background in light mode |
| **Near-Black (Dark)** | `#0F172A` | Surface Dark | High-contrast dark mode surface |

---

## 🔒 Security Architecture

Security is implemented at every layer:

1. **HttpOnly Cookie Authentication**:
   - Short-lived Access Token (15 min) stored in `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookies.
   - Long-lived Refresh Token (7 days) stored in a separate `httpOnly` cookie.
2. **Refresh Token Rotation & Revocation**:
   - Every refresh generates a unique `jti` (JWT ID).
   - If a revoked token is re-submitted, all active sessions for that user are immediately revoked (theft detection).
3. **Double-Submit CSRF Protection**:
   - `csrf_token` cookie paired with `X-CSRF-Token` header validation on all state-changing endpoints (`POST`, `PUT`, `DELETE`, `PATCH`).
4. **Brute-Force Lockout**:
   - Tracked per email address. 5 failed login attempts trigger an automatic 15-minute account lockout.
5. **NoSQL Injection Prevention**:
   - All query filters use explicit Pydantic-validated fields and `validate_object_id()` safe BSON casting. Raw request payloads are never passed directly to Mongo queries.
6. **XSS Sanitization**:
   - All rich-text inputs are sanitized through `bleach` allowing only safe HTML formatting (`b`, `i`, `code`, `pre`, `p`, `ul`, `li`).
7. **Security Headers**:
   - Automatic injection of `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy`.

---

## 👥 User Roles & Permissions

| Feature / Action | Junior | Senior | Admin |
| :--- | :---: | :---: | :---: |
| Ask Questions (Public/Anonymous) | ✅ | ✅ | ✅ |
| Answer Questions | ❌ | ✅ | ✅ |
| Upvote / Downvote Answers | ✅ | ✅ | ✅ |
| Mark Best Answer (Question Asker) | ✅ | ✅ | ✅ |
| Book Mentorship / Mock Interview | ✅ | ❌ | ❌ |
| Create Availability Slots & Mentor | ❌ | ✅ | ❌ |
| Submit Performance Feedback | ❌ | ✅ | ❌ |
| Rate & Review Senior (1-5 Stars) | ✅ | ❌ | ❌ |
| Post Interview Experiences | ❌ | ✅ | ✅ |
| Create Communities & Post | ✅ | ✅ | ✅ |
| Post Job Trends | ❌ | ✅ | ✅ |
| Verify / Reject Seniors | ❌ | ❌ | ✅ |
| Moderate Reports & Ban Users | ❌ | ❌ | ✅ |
| Access Admin Audit Logs | ❌ | ❌ | ✅ |

---

## 🔑 Pre-Seeded Credentials

Run the seed scripts to populate these accounts:

### 1. Admin Accounts (3 Individual Logins)
| Role / Designation | Email | Password | College |
| :--- | :--- | :--- | :--- |
| **Dean Dr. Alok Mathur** | `admin1@seniors4juniors.edu` | `Admin1SecurePassword!` | IIT Bombay |
| **Prof. Meera Sen** | `admin2@seniors4juniors.edu` | `Admin2SecurePassword!` | IIT Bombay |
| **Kavita Rao (Placement Lead)** | `admin3@seniors4juniors.edu` | `Admin3SecurePassword!` | IIT Bombay |

### 2. Sample Seniors (Pre-Verified with Ratings)
| Name | Email | Password | Expertise / Details |
| :--- | :--- | :--- | :--- |
| **Aarav Sharma** | `aarav.senior@iitb.ac.in` | `SeniorPass123!` | Google SWE, DSA, System Design |
| **Priya Patel** | `priya.senior@iitb.ac.in` | `SeniorPass123!` | Goldman Sachs Quant, Python, FinTech |

### 3. Sample Juniors
| Name | Email | Password | College Year / Interests |
| :--- | :--- | :--- | :--- |
| **Ananya Gupta** | `ananya.junior@iitb.ac.in` | `JuniorPass123!` | 1st Year CSE, Web Dev, DSA |
| **Kabir Mehta** | `kabir.junior@iitb.ac.in` | `JuniorPass123!` | 2nd Year Mechanical, Robotics |

---

## 🚀 Step-by-Step Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0+ (check via `node -v`)
- **Python**: v3.10+ (check via `python --version`)
- **MongoDB**: Local Community Server (v6.0+) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

### 1. Database Configuration (MongoDB)

#### Option A: Local MongoDB (Default)
Start MongoDB on default port `27017`:
```bash
# Windows (if installed as service, it starts automatically):
net start MongoDB

# Linux / macOS:
sudo systemctl start mongod

# Or via Docker:
docker run -d -p 27017:27017 --name seniors4juniors-mongo mongo:latest
```

#### Option B: MongoDB Atlas (Remote Cloud)
In `backend/.env`, set your connection URI:
```env
MONGODB_URL="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/seniors4juniors?retryWrites=true&w=majority"
```

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   # Copy example environment configuration
   cp .env.example .env
   ```
   *(The default `.env` is configured for local development out of the box).*

---

### 3. Seeding Database (Admins & Sample Data)

With your virtual environment active and MongoDB running, execute the seed scripts:

1. **Seed the 3 Administrator accounts**:
   ```bash
   python scripts/seed_admins.py
   ```
   *Output confirmation:*
   ```text
   ✓ Created new Admin: Dean Dr. Alok Mathur <admin1@seniors4juniors.edu>
   ✓ Created new Admin: Prof. Meera Sen <admin2@seniors4juniors.edu>
   ✓ Created new Admin: Kavita Rao <admin3@seniors4juniors.edu>
   ```

2. **Seed sample questions, verified seniors, communities, and job trends**:
   ```bash
   python scripts/seed_sample_data.py
   ```
   *Output confirmation:*
   ```text
   ✓ Seeded Senior: Aarav Sharma (Google SWE)
   ✓ Seeded Senior: Priya Patel (Goldman Sachs)
   ✓ Seeded Juniors: Ananya Gupta & Kabir Mehta
   ✓ Seeded Questions, Answers, Comments, and Best Answer Badges
   ✓ Seeded Campus Communities: "IITB Coding Club", "Robotics & AI Society"
   ✓ Seeded Job Trends & Placement Drive listings
   ✓ Seeded Multi-Round Interview Experiences
   ✓ Seeded Completed Mentorship Session with 5-Star Rating
   ```

3. **Start the FastAPI Backend Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *Backend interactive OpenAPI documentation will be accessible at:* `http://localhost:8000/docs`

---

### 4. Frontend Setup

1. **Open a new terminal window and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to: **`http://localhost:5173`**

---

## 🧪 Testing & Verification

### Running the End-to-End Integration Suite (16 Automated Tests)
The comprehensive test suite covers all user and admin journeys end-to-end:
```bash
# From backend directory with venv active:
python tests/run_e2e_test.py
```

*Test Coverage Includes:*
- Health check & API readiness
- Double-submit CSRF cookie & header acquisition
- Junior student registration & verification token issuance
- Junior posting tagged question (with optional anonymity)
- Senior student registration with pending verification status
- Senior answering junior's question
- Senior declaring mentorship availability slots
- Junior authentication & cookie session management
- Junior upvoting senior answer & marking best answer
- Follow-up comments & discussion threads
- Junior scheduling mentorship & mock interview session
- Senior confirming session with meeting link (Google Meet)
- Senior submitting post-session performance feedback (technical & communication scores)
- Junior submitting 5-star rating and detailed review
- Automatic update of Senior profile stats and average rating
- Admin login, senior profile verification badge approval, and audit log generation

### Running Pytest Suite
```bash
pytest tests/test_full_suite.py -v
```

### Building Frontend for Production
```bash
cd frontend
npm run build
```

---

## 📁 Project Directory Layout

```text
Seniors4Juniors/
├── .env.example                     # Root environment configuration reference
├── README.md                        # Complete project documentation & guide
│
├── backend/                         # FastAPI Backend Application
│   ├── app/
│   │   ├── api/v1/                  # API Endpoints (Version 1)
│   │   │   ├── admin.py             # Admin verification, moderation & audit logs
│   │   │   ├── answers.py           # Senior answers, votes, best answer marking
│   │   │   ├── auth.py              # Login, Junior/Senior register, token refresh
│   │   │   ├── communities.py       # Campus communities & discussion posts
│   │   │   ├── interview_experiences.py # Multi-round interview archives
│   │   │   ├── job_trends.py        # Campus placement drives & hiring trends
│   │   │   ├── mentorship.py        # Slots, booking, meet links, feedback, reviews
│   │   │   ├── notifications.py     # In-app notifications
│   │   │   ├── questions.py         # Questions feed, filters, search & bookmarks
│   │   │   ├── reports.py           # Content reporting system
│   │   │   ├── router.py            # Central FastAPI API router
│   │   │   └── users.py             # User profiles, statistics & follow graph
│   │   ├── core/                    # Core Infrastructure & Security
│   │   │   ├── config.py            # Pydantic Settings & environment validation
│   │   │   ├── database.py          # Async Motor client & index management
│   │   │   ├── dependencies.py      # RBAC, CSRF & authentication guards
│   │   │   ├── limiter.py           # Slowapi rate limiter instance
│   │   │   ├── sanitizer.py         # Bleach XSS cleaner & NoSQL injection guards
│   │   │   └── security.py          # Password hashing, JWT & cookie management
│   │   ├── schemas/                 # Pydantic V2 Request / Response Models
│   │   ├── services/                # Business Services
│   │   │   ├── audit_service.py     # Immutable administrator audit logger
│   │   │   ├── email_service.py     # Email verification & password reset handler
│   │   │   └── notification_service.py # In-app notification dispatcher
│   │   └── main.py                  # FastAPI application entry & middleware
│   ├── scripts/
│   │   ├── seed_admins.py           # Seeds 3 individual Admin accounts
│   │   └── seed_sample_data.py      # Seeds realistic campus questions, answers, etc.
│   ├── tests/
│   │   ├── run_e2e_test.py          # 16-step end-to-end integration test runner
│   │   └── test_full_suite.py       # Pytest test suite
│   ├── .env                         # Active local environment configuration
│   ├── .env.example                 # Example backend environment variables
│   └── requirements.txt             # Python backend dependencies
│
└── frontend/                        # React 19 + Vite Frontend Application
    ├── public/                      # Static assets & favicons
    ├── src/
    │   ├── api/
    │   │   └── client.js            # Axios client with credentials & CSRF headers
    │   ├── components/              # Reusable UI Components
    │   │   ├── BestAnswerBadge.jsx  # Yellow "Best Answer" badge
    │   │   ├── Footer.jsx           # Clean campus footer
    │   │   ├── LoadingSpinner.jsx   # Async loading spinner
    │   │   ├── Navbar.jsx           # Responsive header with mobile drawer & search
    │   │   ├── NotificationBell.jsx # Notification dropdown & counter
    │   │   ├── ProtectedRoute.jsx   # Role-based route guard (Junior, Senior, Admin)
    │   │   ├── ReportModal.jsx      # Content reporting modal
    │   │   ├── ThemeToggle.jsx      # Light / Dark mode toggle switch
    │   │   └── VerifiedBadge.jsx    # Yellow "Verified" badge for seniors
    │   ├── context/
    │   │   ├── AuthContext.jsx      # Global authentication & user state
    │   │   └── ThemeContext.jsx     # Dark / Light theme state manager
    │   ├── pages/                   # Application Pages & Views
    │   │   ├── AdminDashboardPage.jsx      # Admin verification & moderation panel
    │   │   ├── AdminLoginPage.jsx          # Dedicated administrator login
    │   │   ├── AskQuestionPage.jsx         # Question creation with tags & anonymity
    │   │   ├── BookmarksPage.jsx           # Saved questions view
    │   │   ├── CommunitiesPage.jsx         # Campus communities directory
    │   │   ├── CommunityDetailPage.jsx     # Community discussions & post creation
    │   │   ├── ForgotPasswordPage.jsx      # Password reset request flow
    │   │   ├── HomeFeedPage.jsx            # Infinite-scroll Q&A + Job Trends feed
    │   │   ├── InterviewExperiencesPage.jsx # Multi-round interview archives
    │   │   ├── JobTrendsPage.jsx           # Campus placement drives & internships
    │   │   ├── JuniorSignupPage.jsx        # Junior-specific registration flow
    │   │   ├── LoginPage.jsx               # Student login flow
    │   │   ├── MentorshipPage.jsx          # Mentorship booking & session reviews
    │   │   ├── NotificationsPage.jsx       # Full notifications page
    │   │   ├── ProfilePage.jsx             # Public & private user profiles
    │   │   ├── QuestionDetailPage.jsx      # Question view, answers, voting & comments
    │   │   ├── ResetPasswordPage.jsx       # Password reset token submission
    │   │   ├── SeniorSignupPage.jsx        # Senior-specific registration flow
    │   │   ├── SeniorsDirectoryPage.jsx    # Campus verified seniors directory
    │   │   └── VerifyEmailPage.jsx         # Email verification confirmation
    │   ├── App.jsx                  # React Router v7 routes configuration
    │   ├── index.css                # Tailwind CSS v4 variables & brand tokens
    │   └── main.jsx                 # React root renderer
    ├── package.json                 # Node.js dependencies & scripts
    └── vite.config.js               # Vite config with API proxy & Tailwind plugin
```

---

## 📜 License & Acknowledgments
Built with ❤️ for collegiate peer mentorship. All rights reserved.

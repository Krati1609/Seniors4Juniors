from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.questions import router as questions_router
from app.api.v1.answers import router as answers_router
from app.api.v1.communities import router as communities_router
from app.api.v1.job_trends import router as job_trends_router
from app.api.v1.interview_experiences import router as interview_experiences_router
from app.api.v1.mentorship import router as mentorship_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.reports import router as reports_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(questions_router)
api_router.include_router(answers_router)
api_router.include_router(communities_router)
api_router.include_router(job_trends_router)
api_router.include_router(interview_experiences_router)
api_router.include_router(mentorship_router)
api_router.include_router(notifications_router)
api_router.include_router(reports_router)
api_router.include_router(admin_router)

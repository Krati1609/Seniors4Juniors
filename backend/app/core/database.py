from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_instance = Database()

async def connect_to_mongo():
    """Establish async connection to MongoDB and ensure essential indexes."""
    try:
        if settings.MONGODB_URL.startswith("mock") or settings.MONGODB_URL == "memory":
            try:
                import mongomock_motor
                logger.info("Initializing in-memory mock MongoDB...")
                db_instance.client = mongomock_motor.AsyncMongoMockClient()
                db_instance.db = db_instance.client[settings.DATABASE_NAME]
                logger.info(f"Successfully initialized in-memory database '{settings.DATABASE_NAME}'.")
                return
            except ImportError:
                pass

        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Verify connection
        await db_instance.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database '{settings.DATABASE_NAME}'.")
        
        await create_indexes()
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB at {settings.MONGODB_URL}: {e}")
        # In case server is not running locally during development, provide mock fallback
        try:
            import mongomock_motor
            logger.info("Falling back to local in-memory MongoDB client for uninterrupted development...")
            db_instance.client = mongomock_motor.AsyncMongoMockClient()
            db_instance.db = db_instance.client[settings.DATABASE_NAME]
            logger.info("In-memory MongoDB active.")
        except Exception as mock_err:
            logger.error(f"Could not initialize fallback mock: {mock_err}")

async def close_mongo_connection():
    """Close MongoDB connection gracefully."""
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        try:
            db_instance.client.close()
        except Exception:
            pass
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    """Return database handle."""
    if db_instance.db is None:
        raise RuntimeError("Database client is not initialized. Please ensure connect_to_mongo() was executed.")
    return db_instance.db

async def create_indexes():
    """Create indexes for performance, uniqueness, and security."""
    db = db_instance.db
    if db is None:
        return
    try:
        # Users indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index([("college_name", 1), ("role", 1)])
        await db.users.create_index("is_verified")
        
        # Refresh tokens indexes with TTL
        await db.refresh_tokens.create_index("jti", unique=True)
        await db.refresh_tokens.create_index("user_id")
        await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)
        
        # Questions indexes
        await db.questions.create_index([("college_name", 1), ("created_at", -1)])
        await db.questions.create_index([("tags", 1)])
        await db.questions.create_index("asker_id")
        
        # Answers indexes
        await db.answers.create_index([("question_id", 1), ("created_at", -1)])
        await db.answers.create_index("senior_id")
        
        # Comments indexes
        await db.comments.create_index([("answer_id", 1), ("created_at", 1)])
        
        # Votes indexes
        await db.votes.create_index([("user_id", 1), ("answer_id", 1)], unique=True)
        
        # Bookmarks indexes
        await db.bookmarks.create_index([("user_id", 1), ("question_id", 1)], unique=True)
        
        # Communities
        await db.communities.create_index([("name", 1), ("college_name", 1)], unique=True)
        await db.community_members.create_index([("community_id", 1), ("user_id", 1)], unique=True)
        await db.community_posts.create_index([("community_id", 1), ("created_at", -1)])
        await db.community_comments.create_index([("post_id", 1), ("created_at", 1)])
        
        # Job trends
        await db.job_trends.create_index([("college_name", 1), ("deadline", -1)])
        await db.job_trends.create_index("category")
        
        # Interview experiences
        await db.interview_experiences.create_index([("college_name", 1), ("created_at", -1)])
        await db.interview_experiences.create_index([("company", 1), ("role", 1)])
        
        # Mentorship
        await db.mentorship_slots.create_index([("senior_id", 1), ("is_active", 1)])
        await db.mentorship_sessions.create_index([("senior_id", 1), ("created_at", -1)])
        await db.mentorship_sessions.create_index([("junior_id", 1), ("created_at", -1)])
        
        # Notifications
        await db.notifications.create_index([("recipient_id", 1), ("created_at", -1)])
        await db.notifications.create_index([("recipient_id", 1), ("read", 1)])
        
        # Reports
        await db.reports.create_index([("status", 1), ("created_at", -1)])
        await db.reports.create_index("target_type")
        
        # Audit logs
        await db.audit_logs.create_index([("admin_id", 1), ("timestamp", -1)])
        
        # Follows
        await db.follows.create_index([("follower_id", 1), ("followed_senior_id", 1)], unique=True)
        
        # Brute-force login attempts
        await db.login_attempts.create_index("email", unique=True)
        
        logger.info("MongoDB indexes successfully created/verified.")
    except Exception as e:
        logger.warning(f"Error creating MongoDB indexes: {e}")

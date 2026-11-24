import asyncio
import os
import sys
from datetime import datetime, timezone

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash

ADMIN_ACCOUNTS = [
    {
        "full_name": "Krati Sharma",
        "email": "kratisharma1609@gmail.com",
        "password": "Admin1@121",
        "college_name": "LNCTS",
        "roll_number": "ADM-001",
        "enrollment_number": "0157CS241104",
        "branch": "Computer Science & Engineering",
        "college_year": 3,
        "current_semester": 5,
        "role": "admin",
        "is_verified": True,
        "email_verified": True,
        "bio": "Dean of Academic and Student Affairs. Platform Lead Administrator.",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    },
    {
        "full_name": "Khanak Shete",
        "email": "khanakshete44@gmai.com",
        "password": "Admin2@122",
        "college_name": "LNCTS",
        "roll_number": "ADM-002",
        "enrollment_number": "0157CS241100",
        "branch": "Computer Science & Engineering",
        "college_year": 3,
        "current_semester": 5,
        "role": "admin",
        "is_verified": True,
        "email_verified": True,
        "bio": "Faculty Advisor & Senior Peer Mentorship Coordinator.",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    },
    {
        "full_name": "Khushi Kumari (Placement Cell Lead)",
        "email": "jaiswalkhushi4913@gmail.com",
        "password": "Admin3@123",
        "college_name": "LNCTS",
        "roll_number": "ADM-003",
        "enrollment_number": "0157CS241101",
        "branch": "Computer Science & Engineering",
        "college_year": 3,
        "current_semester":5,
        "role": "admin",
        "is_verified": True,
        "email_verified": True,
        "bio": "Director of Campus Placements, Industry Relations & Hackathons.",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
]

async def seed_admins():
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

    print("\n--- Seeding 3 Individual Admin Accounts ---")
    for admin_data in ADMIN_ACCOUNTS:
        email = admin_data["email"]
        existing = await db.users.find_one({"email": email})
        raw_password = admin_data["password"]
        
        hashed = get_password_hash(raw_password)
        doc = admin_data.copy()
        doc["password_hash"] = hashed
        del doc["password"]

        if existing:
            await db.users.update_one({"email": email}, {"$set": doc})
            print(f"✓ Updated existing Admin: {admin_data['full_name']} <{email}>")
        else:
            await db.users.insert_one(doc)
            print(f"✓ Created new Admin: {admin_data['full_name']} <{email}>")

    print("\nAdmins successfully seeded:")
    for a in ADMIN_ACCOUNTS:
        print(f"  • Email: {a['email']} | Password: {a['password']} | Name: {a['full_name']}")
    print("------------------------------------------\n")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admins())

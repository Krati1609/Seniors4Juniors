import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Seniors4Juniors"
    API_V1_PREFIX: str = "/api/v1"
    
    # Environment & Host
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "seniors4juniors"
    
    # Security & Tokens
    JWT_SECRET_KEY: str = "super_secret_jwt_access_key_seniors4juniors_2026_x87d9a8c"
    JWT_REFRESH_SECRET_KEY: str = "super_secret_jwt_refresh_key_seniors4juniors_2026_b21f45c"
    CSRF_SECRET_KEY: str = "super_secret_csrf_key_seniors4juniors_2026_q89a01x"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Cookie Configuration
    COOKIE_SECURE: bool = False  # Set to True in production HTTPS
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Rate Limiting
    RATE_LIMIT_DEFAULT: str = "120/minute"
    RATE_LIMIT_AUTH: str = "8/minute"
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    
    # Email settings
    EMAIL_CONSOLE_MODE: bool = True
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@seniors4juniors.edu"
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Theme palette hex constants
    COLOR_MARINE_BLUE: str = "#0B3C5D"
    COLOR_CRIMSON_RED: str = "#D92626"
    COLOR_WARM_BUTTER_YELLOW: str = "#F7D070"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

"""
NetSync Backend Configuration
=============================
Application configuration using Pydantic Settings.
"""

from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NetSync API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "netsync-insecure-secret-key-change-in-production-2026-distributed"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # Database: Default to local SQLite file if PostgreSQL not provided
    DATABASE_URL: str = "sqlite:///./netsync.db"

    # Redis (Optional presence/cache)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "chrome-extension://*",
    ]

    # Networking Engine direct socket binding
    NET_ENGINE_TCP_PORT: int = 9100
    NET_ENGINE_UDP_PORT: int = 9101

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

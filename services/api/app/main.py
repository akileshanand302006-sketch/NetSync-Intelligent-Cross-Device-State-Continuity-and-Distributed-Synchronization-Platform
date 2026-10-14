"""
NetSync Backend Application Entrypoint
======================================
FastAPI application serving REST API, WebSockets, and health checks.
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
import logging

# Ensure networking engine package is discoverable
_networking_engine_path = str(Path(__file__).resolve().parent.parent.parent / "networking_engine" / "src")
if _networking_engine_path not in sys.path:
    sys.path.insert(0, _networking_engine_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # ensure models are imported for metadata creation

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("netsync.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown routines."""
    logger.info("Starting NetSync API service...")
    # Initialize SQL tables if not present
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas verified.")
    yield
    logger.info("Shutting down NetSync API service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check():
    """Health check endpoint for liveness probes."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/ready", tags=["system"])
def readiness_check():
    """Readiness probe checking database connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(Base.metadata.tables["users"].select().limit(1))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}


@app.get("/", tags=["system"])
def root():
    return {
        "message": "NetSync Intelligent Cross-Device State Continuity API",
        "docs": f"{settings.API_V1_STR}/docs",
        "version": settings.VERSION,
    }


# Include V1 API
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

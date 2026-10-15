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
from fastapi.responses import Response
from starlette.requests import Request

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import setup_structured_logging, get_logger, request_id_ctx
from app.core.metrics import metrics_registry
import app.models  # ensure models are imported for metadata creation
import uuid
import time

setup_structured_logging(level=logging.INFO)
logger = get_logger("api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown routines."""
    logger.info("Starting NetSync API service...")
    try:
        # Initialize SQL tables if not present
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas verified.")
    except Exception as e:
        logger.warning(f"Schema verification note: {e}")
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
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def correlation_and_metrics_middleware(request: Request, call_next):
    """Inject request ID, track duration, and record Prometheus metrics."""
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    token = request_id_ctx.set(req_id)
    start_time = time.perf_counter()

    metrics_registry.inc_counter("netsync_http_requests_total")

    try:
        response = await call_next(request)
        duration = time.perf_counter() - start_time
        metrics_registry.observe_histogram("netsync_http_request_duration_seconds", duration)
        response.headers["X-Request-ID"] = req_id
        return response
    finally:
        request_id_ctx.reset(token)


@app.get("/metrics", tags=["system"])
def root_metrics():
    """Prometheus / OpenMetrics root exposition endpoint."""
    return Response(
        content=metrics_registry.generate_openmetrics_text(),
        media_type="text/plain; version=0.0.4",
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

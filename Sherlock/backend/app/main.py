from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.routers import search, history


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="OSINT tool for finding social media profiles by username or face photo",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(history.router, prefix="/api/history", tags=["history"])


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "search_username": "/api/search/username",
            "search_face": "/api/search/face",
            "history": "/api/history",
        }
    }


@app.get("/api/health")
async def health_check():
    import os
    has_key = bool(os.getenv("GOOGLE_VISION_API_KEY"))
    key_preview = os.getenv("GOOGLE_VISION_API_KEY", "NOT_SET")[:8] + "..." if has_key else "NOT_SET"
    return {
        "status": "healthy",
        "version": "v2.5-strict-social-filter",
        "google_vision_key_configured": has_key,
        "key_preview": key_preview,
    }

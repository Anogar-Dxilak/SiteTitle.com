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

# CORS middleware - allow all origins for public OSINT API (including GitHub Pages)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
        "google_vision_key_configured": has_key,
        "key_preview": key_preview,
    }


@app.get("/api/test-yandex")
async def test_yandex_endpoint():
    import aiohttp
    import json
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    }
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
        try:
            async with session.get("https://yandex.com/images/", timeout=5) as r:
                return {"status": r.status, "headers": dict(r.headers), "url": str(r.url)}
        except Exception as e:
            return {"error": str(e)}

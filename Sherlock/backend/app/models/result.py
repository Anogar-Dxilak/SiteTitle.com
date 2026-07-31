from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class PlatformStatus(str, Enum):
    FOUND = "found"
    NOT_FOUND = "not_found"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    CHECKING = "checking"


class PlatformResult(BaseModel):
    """Result for a single platform check."""
    platform: str
    status: PlatformStatus
    url: Optional[str] = None
    username: Optional[str] = None
    profile_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    followers: Optional[int] = None
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None


class FaceSearchResult(BaseModel):
    """Result for a face/reverse image search."""
    source_engine: str  # yandex, google, bing
    platform: Optional[str] = "Web"
    platform_icon: Optional[str] = "🌐"
    title: Optional[str] = None
    username: Optional[str] = None
    url: str
    thumbnail_url: Optional[str] = None
    similarity_score: Optional[float] = None
    description: Optional[str] = None
    is_social_profile: bool = False


class SearchResponse(BaseModel):
    """Complete search response."""
    search_id: str
    search_type: str  # "username" or "face"
    query: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_found: int = 0
    total_checked: int = 0
    platform_results: List[PlatformResult] = []
    face_results: List[FaceSearchResult] = []
    duration_ms: Optional[int] = None


class SearchHistoryItem(BaseModel):
    """A search history entry."""
    search_id: str
    search_type: str
    query: str
    timestamp: datetime
    total_found: int
    total_checked: int

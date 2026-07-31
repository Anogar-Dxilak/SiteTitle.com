from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class SearchType(str, Enum):
    USERNAME = "username"
    FACE = "face"


class UsernameSearchRequest(BaseModel):
    """Request model for username-based search."""
    username: str = Field(..., min_length=1, max_length=100, description="Username to search for")
    platforms: Optional[List[str]] = Field(
        default=None,
        description="Specific platforms to search. If None, searches all platforms."
    )


class FaceSearchRequest(BaseModel):
    """Request model for face-based search (metadata only, file sent separately)."""
    search_engines: Optional[List[str]] = Field(
        default=None,
        description="Specific search engines to use. If None, uses all available."
    )

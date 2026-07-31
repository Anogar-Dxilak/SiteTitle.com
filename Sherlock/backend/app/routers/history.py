from fastapi import APIRouter

router = APIRouter()


# Import search history from search router
# In production, this would come from a database
def _get_history():
    from app.routers.search import search_history
    return search_history


@router.get("/")
async def get_search_history(limit: int = 20, offset: int = 0):
    """Get search history."""
    history = _get_history()
    total = len(history)
    items = history[offset:offset + limit]
    
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.delete("/")
async def clear_search_history():
    """Clear all search history."""
    history = _get_history()
    history.clear()
    return {"message": "History cleared", "total": 0}


@router.get("/stats")
async def get_search_stats():
    """Get search statistics."""
    history = _get_history()
    
    total_searches = len(history)
    username_searches = sum(1 for h in history if h.get("search_type") == "username")
    face_searches = sum(1 for h in history if h.get("search_type") == "face")
    total_found = sum(h.get("total_found", 0) for h in history)
    avg_duration = (
        sum(h.get("duration_ms", 0) for h in history) / total_searches
        if total_searches > 0
        else 0
    )
    
    return {
        "total_searches": total_searches,
        "username_searches": username_searches,
        "face_searches": face_searches,
        "total_profiles_found": total_found,
        "average_duration_ms": round(avg_duration),
    }

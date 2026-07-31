from fastapi import APIRouter, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from typing import Optional, List
import json
import os
import uuid

from app.models.search import UsernameSearchRequest
from app.models.result import SearchResponse, PlatformResult
from app.services.username_search import search_username, get_platform_list
from app.services.face_search import search_by_face
from app.config import settings


router = APIRouter()

# In-memory search history (in production, use a database)
search_history: List[dict] = []


@router.get("/platforms")
async def list_platforms():
    """Get list of all supported platforms."""
    return {
        "platforms": get_platform_list(),
        "total": len(get_platform_list()),
    }


@router.post("/username", response_model=SearchResponse)
async def search_by_username(request: UsernameSearchRequest):
    """Search for a username across social media platforms."""
    if not request.username:
        raise HTTPException(status_code=400, detail="Username is required")
    
    result = await search_username(
        username=request.username,
        platforms=request.platforms,
    )
    
    # Save to history
    search_history.insert(0, {
        "search_id": result.search_id,
        "search_type": result.search_type,
        "query": result.query,
        "timestamp": result.timestamp.isoformat(),
        "total_found": result.total_found,
        "total_checked": result.total_checked,
        "duration_ms": result.duration_ms,
    })
    
    # Keep only last 50 searches
    if len(search_history) > 50:
        search_history.pop()
    
    return result


@router.post("/face", response_model=SearchResponse)
async def search_by_face_photo(
    file: UploadFile = File(...),
    engines: Optional[str] = Form(default=None),
):
    """Search by uploading a face photo for reverse image search."""
    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Save uploaded file
    file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
    file_id = str(uuid.uuid4())[:8]
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.{file_ext}")
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Parse engines
    search_engines = None
    if engines:
        search_engines = [e.strip() for e in engines.split(",")]
    
    # Perform search and ensure temporary file is deleted afterwards for security
    try:
        result = await search_by_face(
            image_path=file_path,
            search_engines=search_engines,
        )
    finally:
        # Secure Cleanup: Delete temporary uploaded image from disk
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
    
    # Save to history
    search_history.insert(0, {
        "search_id": result.search_id,
        "search_type": result.search_type,
        "query": result.query,
        "timestamp": result.timestamp.isoformat(),
        "total_found": result.total_found,
        "total_checked": result.total_checked,
        "duration_ms": result.duration_ms,
    })
    
    return result


@router.websocket("/ws/{search_type}")
async def websocket_search(websocket: WebSocket, search_type: str):
    """
    WebSocket endpoint for real-time search results.
    Client sends: {"username": "...", "platforms": [...]} or image data
    Server sends: individual results as they come in
    """
    await websocket.accept()
    
    try:
        # Receive search request
        data = await websocket.receive_json()
        
        if search_type == "username":
            username = data.get("username", "")
            platforms = data.get("platforms")
            
            if not username:
                await websocket.send_json({"error": "Username is required"})
                await websocket.close()
                return
            
            # Send status update
            await websocket.send_json({
                "type": "status",
                "message": f"Starting search for '{username}'...",
                "total_platforms": len(platforms) if platforms else 10,
            })
            
            # Callback to send each result in real-time
            async def on_result(result: PlatformResult):
                await websocket.send_json({
                    "type": "result",
                    "data": result.model_dump(mode="json"),
                })
            
            # Run search with callback
            response = await search_username(
                username=username,
                platforms=platforms,
                callback=on_result,
            )
            
            # Send completion message
            await websocket.send_json({
                "type": "complete",
                "search_id": response.search_id,
                "total_found": response.total_found,
                "total_checked": response.total_checked,
                "duration_ms": response.duration_ms,
            })
            
            # Save to history
            search_history.insert(0, {
                "search_id": response.search_id,
                "search_type": "username",
                "query": username,
                "timestamp": response.timestamp.isoformat(),
                "total_found": response.total_found,
                "total_checked": response.total_checked,
                "duration_ms": response.duration_ms,
            })
        
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass

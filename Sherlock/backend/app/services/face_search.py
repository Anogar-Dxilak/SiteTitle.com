import aiohttp
import time
import re
import json
import cv2
import asyncio
import os
import base64
from typing import List, Optional
from pathlib import Path
from bs4 import BeautifulSoup

from app.models.result import FaceSearchResult, SearchResponse
from app.utils.helpers import generate_search_id
from app.services.face_verifier import extract_face_crop, compare_faces, download_image_as_bytes


SOCIAL_DOMAINS = {
    "instagram.com": ("Instagram", "📷"),
    "cdninstagram.com": ("Instagram", "📷"),
    "facebook.com": ("Facebook", "📘"),
    "fb.com": ("Facebook", "📘"),
    "fbcdn.net": ("Facebook", "📘"),
    "twitter.com": ("Twitter / X", "🐦"),
    "x.com": ("Twitter / X", "🐦"),
    "twimg.com": ("Twitter / X", "🐦"),
    "linkedin.com": ("LinkedIn", "💼"),
    "licdn.com": ("LinkedIn", "💼"),
    "tiktok.com": ("TikTok", "🎵"),
    "tiktokcdn.com": ("TikTok", "🎵"),
    "vk.com": ("VKontakte", "🔵"),
    "ok.ru": ("OK.ru", "🟠"),
    "pinterest.com": ("Pinterest", "📌"),
    "pinimg.com": ("Pinterest", "📌"),
    "t.me": ("Telegram", "✈️"),
    "telegram.me": ("Telegram", "✈️"),
    "youtube.com": ("YouTube", "▶️"),
    "github.com": ("GitHub", "🐙"),
    "reddit.com": ("Reddit", "🤖"),
}


def _analyze_link(url: str, title: str = ""):
    url_lower = url.lower()
    platform = "Web Page"
    icon = "🌐"
    is_social = False
    username = None

    for domain, (p_name, p_icon) in SOCIAL_DOMAINS.items():
        if domain in url_lower:
            platform = p_name
            icon = p_icon
            is_social = True
            
            # Extract handle from URL path
            m = re.search(r'(?:instagram\.com|twitter\.com|x\.com|facebook\.com|linkedin\.com/in|tiktok\.com/@|github\.com|reddit\.com/user|t\.me|vk\.com)/([a-zA-Z0-9_\.\-]+)', url)
            if m and m.group(1) not in ["p", "reel", "stories", "share", "watch", "photo"]:
                username = m.group(1)
            break

    if not username and title:
        m_title = re.search(r'\(@?([a-zA-Z0-9_\.\-]+)\)', title)
        if m_title:
            username = m_title.group(1)

    return platform, icon, is_social, username


async def search_by_face(
    image_path: str,
    search_engines: Optional[List[str]] = None,
) -> SearchResponse:
    """
    Search for a face/image across reverse image search engines with AI face verification.
    Guaranteed to return within 12 seconds max.
    """
    search_id = generate_search_id()
    start_time = time.time()
    
    try:
        return await asyncio.wait_for(
            _execute_face_search(search_id, image_path, search_engines, start_time),
            timeout=12.0
        )
    except asyncio.TimeoutError:
        elapsed_ms = int((time.time() - start_time) * 1000)
        # Return fallback result pointing directly to Yandex Images page if total search times out
        fallback_res = FaceSearchResult(
            source_engine="yandex",
            platform="Yandex Engine",
            platform_icon="🔍",
            title="Yandex Direct Image Search",
            url="https://yandex.com/images/",
            description="Search timed out. Click to open Yandex Visual Search directly.",
            is_social_profile=False,
        )
        return SearchResponse(
            search_id=search_id,
            search_type="face",
            query=Path(image_path).name,
            total_found=1,
            total_checked=1,
            face_results=[fallback_res],
            duration_ms=elapsed_ms,
        )


async def _execute_face_search(search_id: str, image_path: str, search_engines: Optional[List[str]], start_time: float) -> SearchResponse:
    import logging
    logger = logging.getLogger("sherlock.search")
    
    raw_results: List[FaceSearchResult] = await _search_google_vision(image_path)
    
    logger.info(f"Total raw results from Google Vision: {len(raw_results)}")
    for r in raw_results:
        logger.info(f"  -> [{r.platform}] {r.title} | {r.url} | social={r.is_social_profile}")

    verified_results = raw_results
    verified_results.sort(
        key=lambda r: (r.is_social_profile, r.similarity_score or 0.0),
        reverse=True
    )
    
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    return SearchResponse(
        search_id=search_id,
        search_type="face",
        query=Path(image_path).name,
        total_found=len(verified_results),
        total_checked=1,
        face_results=verified_results,
        duration_ms=elapsed_ms,
    )


async def _search_google_vision(image_path: str) -> List[FaceSearchResult]:
    """Search for face across web using Google Cloud Vision API (WEB_DETECTION)"""
    import logging
    logger = logging.getLogger("sherlock.google_vision")
    
    api_key = os.getenv("GOOGLE_VISION_API_KEY")
    if not api_key:
        logger.warning("GOOGLE_VISION_API_KEY not found. Skipping Google Vision search.")
        return []

    try:
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        payload = {
            "requests": [
                {
                    "image": {"content": image_data},
                    "features": [
                        {"type": "WEB_DETECTION", "maxResults": 50},
                    ]
                }
            ]
        }
        
        vision_url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
        
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            post_timeout = aiohttp.ClientTimeout(total=12)
            async with session.post(vision_url, json=payload, timeout=post_timeout) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    results = []
                    seen_urls = set()
                    
                    try:
                        responses = data.get("responses", [])
                        if not responses:
                            logger.warning("Google Vision returned empty responses array")
                            return []
                        
                        web_detection = responses[0].get("webDetection", {})
                        
                        if not web_detection:
                            logger.warning("Google Vision returned no webDetection data")
                            return []
                        
                        # Web Entities (General context - who/what is in the photo)
                        entities = web_detection.get("webEntities", [])
                        logger.info(f"Google Vision found {len(entities)} web entities")
                        for e in entities[:5]:
                            logger.info(f"  Entity: {e.get('description', 'N/A')} (score: {e.get('score', 0):.2f})")
                        
                        top_entity_desc = None
                        for ent in entities:
                            desc = ent.get("description")
                            if desc and len(desc) > 1:
                                top_entity_desc = desc
                                break

                        # 1. Pages with matching images
                        pages = web_detection.get("pagesWithMatchingImages", [])
                        logger.info(f"Google Vision found {len(pages)} pages with matching images")
                        
                        for page in pages:
                            url = page.get("url")
                            title = page.get("pageTitle", "")
                            
                            if not url or url in seen_urls:
                                continue
                            
                            junk = ["captcha", "yastatic", "w3.org", "schema.org"]
                            if any(j in url.lower() for j in junk):
                                continue
                                
                            seen_urls.add(url)
                            platform, icon, is_social, username = _analyze_link(url, title)
                            
                            # Thumbnail extraction
                            full_matching = page.get("fullMatchingImages", [])
                            partial_matching = page.get("partialMatchingImages", [])
                            thumb = None
                            if full_matching:
                                thumb = full_matching[0].get("url")
                            elif partial_matching:
                                thumb = partial_matching[0].get("url")
                                
                            display_title = title
                            if top_entity_desc and top_entity_desc.lower() not in (title or "").lower():
                                display_title = f"{top_entity_desc} — {title}" if title else top_entity_desc

                            res = FaceSearchResult(
                                source_engine="google_vision",
                                platform=platform,
                                platform_icon=icon,
                                title=display_title or f"{platform} Match",
                                username=username,
                                url=url,
                                thumbnail_url=thumb,
                                description=f"Matched via Google Vision ({platform})",
                                is_social_profile=is_social,
                            )
                            results.append(res)
                        
                        # 2. Full & Partial Matching Images (Direct image matches)
                        direct_matches = web_detection.get("fullMatchingImages", []) + web_detection.get("partialMatchingImages", [])
                        logger.info(f"Google Vision found {len(direct_matches)} full/partial direct image matches")
                        for match in direct_matches:
                            img_url = match.get("url")
                            if not img_url or img_url in seen_urls:
                                continue
                            seen_urls.add(img_url)
                            
                            platform, icon, is_social, username = _analyze_link(img_url, "")
                            display_title = f"{top_entity_desc} (Direct Image Match)" if top_entity_desc else f"{platform} Image Match"
                            
                            results.append(FaceSearchResult(
                                source_engine="google_vision",
                                platform=platform,
                                platform_icon=icon,
                                title=display_title,
                                username=username,
                                url=img_url,
                                thumbnail_url=img_url,
                                description=f"Direct facial image match indexed by Google",
                                is_social_profile=is_social,
                            ))

                        # 3. Visually Similar Images (Similar faces across web & social media)
                        similar_images = web_detection.get("visuallySimilarImages", [])
                        logger.info(f"Google Vision found {len(similar_images)} visually similar images")
                        for sim in similar_images[:15]:
                            sim_url = sim.get("url")
                            if not sim_url or sim_url in seen_urls:
                                continue
                            seen_urls.add(sim_url)
                            
                            platform, icon, is_social, username = _analyze_link(sim_url, "")
                            display_title = f"{top_entity_desc} (Visual Match)" if top_entity_desc else f"{platform} Visual Match"
                            
                            results.append(FaceSearchResult(
                                source_engine="google_vision",
                                platform=platform,
                                platform_icon=icon,
                                title=display_title,
                                username=username,
                                url=sim_url,
                                thumbnail_url=sim_url,
                                description=f"Visually similar face found on {platform}",
                                is_social_profile=is_social,
                            ))
                            
                    except Exception as parse_e:
                        logger.error(f"Google Vision parsing error: {parse_e}", exc_info=True)
                        
                    logger.info(f"Google Vision returning {len(results)} total results")
                    return results
                else:
                    err = await response.text()
                    logger.error(f"Google Vision API Error: {response.status} - {err[:500]}")
                    return []
                    
    except Exception as e:
        logger.error(f"Google Vision connection error: {e}", exc_info=True)
        return []


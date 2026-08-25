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


    # Check if it's a CDN or crawler domain
    is_cdn = any(cdn in url_lower for cdn in ["lookaside.", "cdn.", "fbcdn.", "twimg.", "licdn.", "tiktokcdn.", "pinimg."])

    for domain, (p_name, p_icon) in SOCIAL_DOMAINS.items():
        if domain in url_lower:
            platform = p_name
            icon = p_icon
            is_social = not is_cdn
            
            # Extract handle from genuine profile URL path (not CDN/crawler)
            if not is_cdn:
                m = re.search(r'(?:instagram\.com|twitter\.com|x\.com|facebook\.com|linkedin\.com/in|tiktok\.com/@|github\.com|reddit\.com/user|t\.me|vk\.com)/([a-zA-Z0-9_\.\-]+)', url)
                if m:
                    candidate_user = m.group(1).lower()
                    if candidate_user not in ["p", "reel", "stories", "share", "watch", "photo", "seo", "explore", "tags", "in", "pub", "feed"]:
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
    
    target_img = cv2.imread(image_path)
    target_face_feature = None
    if target_img is not None:
        target_face_feature = extract_face_crop(target_img)

    verified_results: List[FaceSearchResult] = []

    # AI Verification: filter out random people using SFace embedding matching
    if target_face_feature is not None and len(raw_results) > 0:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            
            async def verify_single_result(res: FaceSearchResult):
                if not res.thumbnail_url:
                    # Keep if social, otherwise drop
                    if res.is_social_profile:
                        verified_results.append(res)
                    return

                img_bytes = await download_image_as_bytes(res.thumbnail_url, session, timeout=4)
                if img_bytes:
                    is_match, similarity = compare_faces(target_face_feature, img_bytes)
                    res.similarity_score = round(similarity, 2)
                    
                    # SFace verification threshold (normalized score >= 0.65 or is_match)
                    if is_match or similarity >= 0.65:
                        verified_results.append(res)
                    else:
                        logger.info(f"Filtered out non-matching face ({similarity:.2f}): {res.url}")
                else:
                    # If thumbnail download failed but it's a social profile, keep with lower rank
                    if res.is_social_profile:
                        verified_results.append(res)

            tasks = [verify_single_result(r) for r in raw_results[:30]]
            await asyncio.gather(*tasks, return_exceptions=True)
    else:
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
                            return []

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
                            
                            full_matching = page.get("fullMatchingImages", [])
                            partial_matching = page.get("partialMatchingImages", [])
                            thumb = None
                            if full_matching:
                                thumb = full_matching[0].get("url")
                            elif partial_matching:
                                thumb = partial_matching[0].get("url")

                            display_title = title if title else (f"@{username}" if username else f"{platform} Profile")

                            res = FaceSearchResult(
                                source_engine="google_vision",
                                platform=platform,
                                platform_icon=icon,
                                title=display_title,
                                username=username,
                                url=url,
                                thumbnail_url=thumb,
                                description=f"Matched on {platform}",
                                is_social_profile=is_social,
                            )
                            results.append(res)
                        
                        # 2. Full & Partial Matching Images (Direct image matches)
                        direct_matches = web_detection.get("fullMatchingImages", []) + web_detection.get("partialMatchingImages", [])
                        for match in direct_matches:
                            img_url = match.get("url")
                            if not img_url or img_url in seen_urls:
                                continue
                            seen_urls.add(img_url)
                            
                            platform, icon, is_social, username = _analyze_link(img_url, "")
                            display_title = f"@{username}" if username else f"{platform} Image Match"
                            
                            results.append(FaceSearchResult(
                                source_engine="google_vision",
                                platform=platform,
                                platform_icon=icon,
                                title=display_title,
                                username=username,
                                url=img_url,
                                thumbnail_url=img_url,
                                description=f"Direct facial image match",
                                is_social_profile=is_social,
                            ))

                        # 3. Visually Similar Images
                        similar_images = web_detection.get("visuallySimilarImages", [])
                        for sim in similar_images[:15]:
                            sim_url = sim.get("url")
                            if not sim_url or sim_url in seen_urls:
                                continue
                            seen_urls.add(sim_url)
                            
                            platform, icon, is_social, username = _analyze_link(sim_url, "")
                            display_title = f"@{username}" if username else f"{platform} Visual Match"
                            
                            results.append(FaceSearchResult(
                                source_engine="google_vision",
                                platform=platform,
                                platform_icon=icon,
                                title=display_title,
                                username=username,
                                url=sim_url,
                                thumbnail_url=sim_url,
                                description=f"Visually similar face on {platform}",
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


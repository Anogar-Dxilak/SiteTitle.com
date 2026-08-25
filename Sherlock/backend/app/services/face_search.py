import aiohttp
import time
import re
import json
import cv2
import asyncio
import os
import base64
import urllib.parse
from typing import List, Optional
from pathlib import Path
from bs4 import BeautifulSoup

from app.models.result import FaceSearchResult, SearchResponse
from app.utils.helpers import generate_search_id
from app.services.face_verifier import extract_face_crop, compare_faces, download_image_as_bytes, create_optimized_face_crop


SOCIAL_DOMAINS = {
    "instagram.com": ("Instagram", "📷"),
    "facebook.com": ("Facebook", "📘"),
    "twitter.com": ("Twitter / X", "🐦"),
    "x.com": ("Twitter / X", "🐦"),
    "linkedin.com": ("LinkedIn", "💼"),
    "tiktok.com": ("TikTok", "🎵"),
    "vk.com": ("VKontakte", "🔵"),
    "ok.ru": ("OK.ru", "🟠"),
    "pinterest.com": ("Pinterest", "📌"),
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

    # Check if it's a CDN or crawler domain
    is_cdn = any(cdn in url_lower for cdn in ["lookaside.", "cdn.", "fbcdn.", "twimg.", "licdn.", "tiktokcdn.", "pinimg.", "yastatic.", "images."])

    # Extract exact domain host to prevent substring bugs (e.g. 'edebiyat.medeniyet' matching 't.me')
    try:
        parsed_uri = urllib.parse.urlparse(url)
        host = (parsed_uri.netloc or "").lower()
        if not host and "/" in url:
            host = url.split("/")[0].lower()
        host = host.split(":")[0]
    except Exception:
        host = url_lower

    for domain, (p_name, p_icon) in SOCIAL_DOMAINS.items():
        if host == domain or host.endswith("." + domain):
            platform = p_name
            icon = p_icon
            is_social = not is_cdn
            
            # Extract handle from genuine profile URL path (not CDN/crawler)
            if not is_cdn:
                m = re.search(r'(?:instagram\.com|twitter\.com|x\.com|facebook\.com|linkedin\.com/in|tiktok\.com/@|github\.com|reddit\.com/user|t\.me|vk\.com)/([a-zA-Z0-9_\.\-]+)', url)
                if m:
                    candidate_user = m.group(1).lower()
                    if candidate_user not in ["p", "reel", "stories", "share", "watch", "photo", "seo", "explore", "tags", "in", "pub", "feed", "dir", "staff", "academic", "en", "tr"]:
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
    Search for a face/image across reverse image search engines (Yandex + Google Vision)
    with SFace Deep Learning face verification. Fast and optimized.
    """
    search_id = generate_search_id()
    start_time = time.time()
    
    try:
        return await asyncio.wait_for(
            _execute_face_search(search_id, image_path, search_engines, start_time),
            timeout=35.0
        )
    except asyncio.TimeoutError:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return SearchResponse(
            search_id=search_id,
            search_type="face",
            query=Path(image_path).name,
            total_found=0,
            total_checked=2,
            face_results=[],
            duration_ms=elapsed_ms,
        )


async def _execute_face_search(search_id: str, image_path: str, search_engines: Optional[List[str]], start_time: float) -> SearchResponse:
    import logging
    logger = logging.getLogger("sherlock.search")
    
    # Generate an isolated, optimized portrait crop of the face
    search_image_path = create_optimized_face_crop(image_path)
    
    # Run both Google Vision & Yandex in parallel with fast timeouts
    results_gv, results_yx = await asyncio.gather(
        _search_google_vision(search_image_path),
        _search_yandex(search_image_path),
        return_exceptions=True
    )

    raw_results: List[FaceSearchResult] = []
    if isinstance(results_gv, list):
        raw_results.extend(results_gv)
    if isinstance(results_yx, list):
        raw_results.extend(results_yx)

    # Deduplicate by URL
    unique_results: List[FaceSearchResult] = []
    seen_urls = set()
    for r in raw_results:
        norm_url = re.sub(r'\?.*$', '', r.url).rstrip('/')
        if norm_url and norm_url not in seen_urls:
            seen_urls.add(norm_url)
            unique_results.append(r)

    logger.info(f"Total raw unique results (Google + Yandex): {len(unique_results)}")

    # Extract facial embedding of the uploaded target face
    target_img = cv2.imread(image_path)
    target_face_feature = None
    if target_img is not None:
        target_face_feature = extract_face_crop(target_img)

    verified_results: List[FaceSearchResult] = []

    # SFace AI Biometric Face Verification with Semaphore to strictly cap RAM < 120MB
    if target_face_feature is not None and len(unique_results) > 0:
        sem = asyncio.Semaphore(2)  # max 2 concurrent memory allocations
        connector = aiohttp.TCPConnector(ssl=False, limit=4)
        async with aiohttp.ClientSession(connector=connector) as session:
            
            async def verify_single_result(res: FaceSearchResult):
                if not res.thumbnail_url:
                    if res.is_social_profile:
                        verified_results.append(res)
                    return

                async with sem:
                    img_bytes = await download_image_as_bytes(res.thumbnail_url, session, timeout=2.0)
                    if img_bytes:
                        is_match, similarity = compare_faces(target_face_feature, img_bytes)
                        res.similarity_score = round(similarity, 2)
                        
                        if is_match or similarity >= 0.45:
                            verified_results.append(res)
                        elif res.is_social_profile and similarity >= 0.35:
                            verified_results.append(res)
                        del img_bytes
                    else:
                        if res.is_social_profile:
                            verified_results.append(res)

            tasks = [verify_single_result(r) for r in unique_results[:12]]
            await asyncio.gather(*tasks, return_exceptions=True)
            
            # Keep remaining social profiles
            for r in unique_results[12:]:
                if r.is_social_profile and r not in verified_results:
                    verified_results.append(r)
        
        import gc
        gc.collect()
    else:
        verified_results = unique_results

    # SADECE VE SADECE GERÇEK SOSYAL MEDYA HESAPLARI
    social_only_results = [r for r in verified_results if r.is_social_profile]

    # Sort results: Highest AI similarity social profiles first
    social_only_results.sort(
        key=lambda r: (
            1 if (r.similarity_score or 0) >= 0.50 else 0,
            r.similarity_score or 0.0
        ),
        reverse=True
    )
    
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    return SearchResponse(
        search_id=search_id,
        search_type="face",
        query=Path(image_path).name,
        total_found=len(social_only_results),
        total_checked=2,
        face_results=social_only_results,
        duration_ms=elapsed_ms,
    )


async def _search_google_vision(image_path: str) -> List[FaceSearchResult]:
    """Search for face across web using Google Cloud Vision API (WEB_DETECTION)"""
    import logging
    logger = logging.getLogger("sherlock.google_vision")
    
    api_key = os.getenv("GOOGLE_VISION_API_KEY")
    if not api_key:
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
            post_timeout = aiohttp.ClientTimeout(total=10)
            async with session.post(vision_url, json=payload, timeout=post_timeout) as response:
                if response.status == 200:
                    data = await response.json()
                    results = []
                    seen_urls = set()
                    
                    try:
                        responses = data.get("responses", [])
                        if not responses:
                            return []
                        
                        web_detection = responses[0].get("webDetection", {})
                        if not web_detection:
                            return []

                        # 1. Pages with matching images
                        pages = web_detection.get("pagesWithMatchingImages", [])
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

                            display_title = title if title else (f"@{username}" if username else f"{platform} Match")

                            results.append(FaceSearchResult(
                                source_engine="google_vision",
                                platform=platform,
                                platform_icon=icon,
                                title=display_title,
                                username=username,
                                url=url,
                                thumbnail_url=thumb,
                                description=f"Matched on {platform}",
                                is_social_profile=is_social,
                            ))
                        
                        # 2. Direct Matching Images
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
                            
                    except Exception as parse_e:
                        logger.error(f"Google Vision parsing error: {parse_e}", exc_info=True)
                        
                    return results
                else:
                    return []
                    
    except Exception as e:
        logger.error(f"Google Vision connection error: {e}", exc_info=True)
        return []


async def _search_yandex(image_path: str) -> List[FaceSearchResult]:
    """Search for face across web and social media using Yandex Visual Search."""
    import logging
    logger = logging.getLogger("sherlock.yandex")
    
    results: List[FaceSearchResult] = []
    seen_urls = set()
    
    try:
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        connector = aiohttp.TCPConnector(ssl=False)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://yandex.com/images/",
        }
        
        async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
            form = aiohttp.FormData()
            form.add_field("upfile", image_data, filename="photo.jpg", content_type="image/jpeg")
            
            params = {
                "rpt": "imageview",
                "format": "json",
                "request": json.dumps({"blocks": [{"block": "b-page_type_search-by-image__link"}]}),
            }
            
            post_timeout = aiohttp.ClientTimeout(total=8, connect=3)
            cbir_id = None
            orig_img = None

            # Step 1: Upload image to get cbir_id
            try:
                async with session.post(
                    "https://yandex.com/images/search",
                    params=params,
                    data=form,
                    timeout=post_timeout,
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        blocks = data.get("blocks", [])
                        if blocks and isinstance(blocks[0], dict) and "params" in blocks[0]:
                            cbir_id = blocks[0]["params"].get("cbirId")
                            orig_img = blocks[0]["params"].get("originalImageUrl")
            except Exception as e:
                logger.warning(f"Yandex upload error: {e}")

            if cbir_id:
                fetch_timeout = aiohttp.ClientTimeout(total=8, connect=3)
                
                # Fetch result pages (sites page and main visual search page)
                pages_to_fetch = [
                    f"https://yandex.com/images/search?rpt=imageview&cbir_id={cbir_id}&cbir_page=sites",
                    f"https://yandex.com/images/search?rpt=imageview&cbir_id={cbir_id}",
                ]
                
                async def fetch_and_parse(url):
                    try:
                        async with session.get(url, timeout=fetch_timeout) as resp:
                            if resp.status == 200:
                                html = await resp.text()
                                _parse_yandex_results(html, orig_img, results, seen_urls)
                    except Exception:
                        pass
                
                await asyncio.gather(*[fetch_and_parse(u) for u in pages_to_fetch], return_exceptions=True)

    except Exception as e:
        logger.warning(f"Yandex search error: {e}")
        
    logger.info(f"Yandex returning {len(results)} total candidate results")
    return results


def _parse_yandex_results(html: str, default_thumb: Optional[str], results: List[FaceSearchResult], seen_urls: set):
    """Parse links from Yandex visual search HTML."""
    try:
        soup = BeautifulSoup(html, "lxml")
        
        # Strategy 1: CbirSites-Item divs
        items = soup.find_all("div", class_=re.compile(r"CbirSites|CbirItem", re.IGNORECASE))
        for item in items[:30]:
            try:
                link = item.find("a", href=True)
                if not link:
                    continue
                url = link.get("href", "")
                title = link.get_text(strip=True)
                
                desc_el = item.find("div", class_=re.compile(r"Description|Snippet|Text", re.IGNORECASE))
                desc = desc_el.get_text(strip=True) if desc_el else None
                
                img_el = item.find("img")
                thumb = img_el.get("src") if img_el else default_thumb
                if thumb and thumb.startswith("//"):
                    thumb = f"https:{thumb}"
                
                _add_candidate_result(url, title, desc, thumb, results, seen_urls)
            except Exception:
                continue

        # Strategy 2: All <a> tags linking to social platforms or websites
        all_links = soup.find_all("a", href=True)
        for link in all_links:
            try:
                url = link.get("href", "")
                title = link.get_text(strip=True)
                
                # If it's an external link (starts with http, not yandex internal)
                if url.startswith("http") and not any(j in url.lower() for j in ["yandex.", "yastatic.", "captcha", "w3.org"]):
                    _add_candidate_result(url, title, None, default_thumb, results, seen_urls)
            except Exception:
                continue

    except Exception:
        pass


def _add_candidate_result(url: str, title: str, desc: Optional[str], thumb: Optional[str], results: List[FaceSearchResult], seen_urls: set):
    """Clean and add candidate result to list."""
    if not url or not url.startswith("http"):
        return
    
    # Extract clean target URL if wrapped in Yandex redirect
    if "yandex." in url and ("img_url=" in url or "url=" in url):
        parsed = urllib.parse.urlparse(url)
        qs = urllib.parse.parse_qs(parsed.query)
        if "img_url" in qs:
            url = qs["img_url"][0]
        elif "url" in qs:
            url = qs["url"][0]

    # Clean query parameters like utm
    clean_url = re.sub(r'\?utm_[^&]+(&utm_[^&]+)*', '', url).rstrip('?')
    if clean_url in seen_urls:
        return
    seen_urls.add(clean_url)
    
    platform, icon, is_social, username = _analyze_link(clean_url, title or "")
    
    display_title = title if title and len(title) > 3 else (f"@{username}" if username else f"{platform} Match")
    
    results.append(FaceSearchResult(
        source_engine="yandex",
        platform=platform,
        platform_icon=icon,
        title=display_title,
        username=username,
        url=clean_url,
        thumbnail_url=thumb,
        description=desc or f"Matched profile/page on {platform}",
        is_social_profile=is_social,
    ))

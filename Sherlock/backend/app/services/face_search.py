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
from app.services.face_verifier import extract_face_crop, compare_faces, download_image_as_bytes


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

    # Check if it's a CDN, crawler or tracking domain
    is_cdn = any(cdn in url_lower for cdn in [
        "lookaside.", "cdn.", "fbcdn.", "twimg.", "licdn.", "tiktokcdn.", 
        "pinimg.", "yastatic.", "images.", "schema.org", "w3.org", "favicon"
    ])
    if is_cdn:
        return platform, icon, False, None

    try:
        parsed_uri = urllib.parse.urlparse(url)
        host = (parsed_uri.netloc or "").lower().split(":")[0]
        path = parsed_uri.path.strip("/")
        path_parts = [p for p in path.split("/") if p]
    except Exception:
        host = url_lower
        path = ""
        path_parts = []

    # 1. LinkedIn (Profiles & Companies)
    if "linkedin.com" in host:
        if path.startswith("in/") or path.startswith("pub/"):
            platform = "LinkedIn"
            icon = "💼"
            is_social = True
            username = path_parts[1] if len(path_parts) > 1 else None
        elif path.startswith("company/"):
            platform = "LinkedIn"
            icon = "💼"
            is_social = True
            username = path_parts[1] if len(path_parts) > 1 else None

    # 2. YouTube (Channels & Videos)
    elif "youtube.com" in host or "youtu.be" in host:
        platform = "YouTube"
        icon = "▶️"
        is_social = True
        if path.startswith("@"):
            username = path_parts[0].lstrip("@")
        elif path.startswith("channel/") or path.startswith("c/") or path.startswith("user/"):
            username = path_parts[1] if len(path_parts) > 1 else None
        elif not username and title:
            clean_title = re.sub(r'\s*[-|•]\s*YouTube.*$', '', title, flags=re.IGNORECASE).strip()
            if clean_title:
                username = clean_title

    # 3. Instagram (Strict user profile, reject /p/, /reel/, /explore/, etc.)
    elif "instagram.com" in host:
        if len(path_parts) == 1 and path_parts[0].lower() not in ["p", "reel", "reels", "stories", "explore", "tv", "accounts", "direct", "about", "developer"]:
            platform = "Instagram"
            icon = "📷"
            is_social = True
            username = path_parts[0]

    # 4. Twitter / X (Strict user profile, reject /status/, /i/, /hashtag/)
    elif "twitter.com" in host or "x.com" in host:
        if len(path_parts) == 1 and path_parts[0].lower() not in ["home", "explore", "notifications", "messages", "i", "hashtag", "search", "settings"]:
            platform = "Twitter / X"
            icon = "🐦"
            is_social = True
            username = path_parts[0]

    # 5. Facebook
    elif "facebook.com" in host or "fb.com" in host:
        if len(path_parts) == 1 and path_parts[0].lower() not in ["photo", "photos", "watch", "share", "events", "groups", "pages", "help", "gaming"]:
            platform = "Facebook"
            icon = "📘"
            is_social = True
            username = path_parts[0]
        elif path.startswith("people/") or path.startswith("profile.php"):
            platform = "Facebook"
            icon = "📘"
            is_social = True
            username = path_parts[1] if len(path_parts) > 1 else None

    # 6. TikTok
    elif "tiktok.com" in host:
        if path_parts and path_parts[0].startswith("@"):
            platform = "TikTok"
            icon = "🎵"
            is_social = True
            username = path_parts[0].lstrip("@")

    # 7. Telegram (Channel or User)
    elif host == "t.me" or host == "telegram.me":
        if len(path_parts) == 1 and path_parts[0].lower() not in ["s", "share", "joinchat", "addstickers", "iv", "c"]:
            platform = "Telegram"
            icon = "✈️"
            is_social = True
            username = path_parts[0]

    # 8. GitHub (Strict user profile: exactly 1 path segment)
    elif "github.com" in host:
        if len(path_parts) == 1 and path_parts[0].lower() not in ["topics", "trending", "features", "explore", "pricing", "login", "join", "about", "pulls", "issues", "orgs"]:
            platform = "GitHub"
            icon = "🐙"
            is_social = True
            username = path_parts[0]

    # 9. VKontakte
    elif "vk.com" in host:
        if len(path_parts) == 1 and path_parts[0].lower() not in ["feed", "im", "video", "audio", "apps"]:
            platform = "VKontakte"
            icon = "🔵"
            is_social = True
            username = path_parts[0]

    # 10. Reddit
    elif "reddit.com" in host:
        if path.startswith("user/") and len(path_parts) >= 2:
            platform = "Reddit"
            icon = "🤖"
            is_social = True
            username = path_parts[1]

    # 11. Pinterest (ONLY User profile, reject /pin/, /ideas/, etc.)
    elif "pinterest." in host:
        if len(path_parts) == 1 and path_parts[0].lower() not in ["pin", "pins", "ideas", "today", "explore", "search", "topics", "settings"]:
            platform = "Pinterest"
            icon = "📌"
            is_social = True
            username = path_parts[0]

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
    
    # Use original image for visual search so Yandex matches full context and resolution
    results_gv, results_yx = await asyncio.gather(
        _search_google_vision(image_path),
        _search_yandex(image_path),
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

    # Extract facial embedding of target face for biometric verification
    target_img = cv2.imread(image_path)
    target_face_feature = None
    if target_img is not None:
        target_face_feature = extract_face_crop(target_img)

    # Filter strictly for social profiles
    social_candidates = [r for r in unique_results if r.is_social_profile]
    logger.info(f"Found {len(social_candidates)} social media candidates")

    verified_social: List[FaceSearchResult] = []
    unverified_social: List[FaceSearchResult] = []

    # Parallel fast SFace verification on social candidates (takes < 1s)
    if target_face_feature is not None and len(social_candidates) > 0:
        connector = aiohttp.TCPConnector(ssl=False, limit=8)
        async with aiohttp.ClientSession(connector=connector) as session:
            
            async def verify_single_social(res: FaceSearchResult):
                if not res.thumbnail_url:
                    unverified_social.append(res)
                    return

                try:
                    img_bytes = await download_image_as_bytes(res.thumbnail_url, session, timeout=2.0)
                    if img_bytes:
                        is_match, similarity = compare_faces(target_face_feature, img_bytes)
                        res.similarity_score = round(similarity, 2)
                        if is_match or similarity >= 0.28:
                            verified_social.append(res)
                        else:
                            unverified_social.append(res)
                        del img_bytes
                    else:
                        unverified_social.append(res)
                except Exception:
                    unverified_social.append(res)

            tasks = [verify_single_social(r) for r in social_candidates[:30]]
            await asyncio.gather(*tasks, return_exceptions=True)
        
        import gc
        gc.collect()
    else:
        verified_social = social_candidates

    # Sort verified social profiles by AI similarity
    verified_social.sort(
        key=lambda r: (
            1 if (r.similarity_score or 0) >= 0.50 else 0,
            r.similarity_score or 0.0
        ),
        reverse=True
    )

    # STRICTLY SOCIAL MEDIA ONLY (No web pages as requested)
    final_results: List[FaceSearchResult] = []
    final_results.extend(verified_social)
    for s in unverified_social:
        if s not in final_results:
            final_results.append(s)

    elapsed_ms = int((time.time() - start_time) * 1000)
    
    return SearchResponse(
        search_id=search_id,
        search_type="face",
        query=Path(image_path).name,
        total_found=len(final_results),
        total_checked=2,
        face_results=final_results,
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
                            
                            junk = ["captcha", "yastatic", "w3.org", "schema.org", "avatars.mds", "yandex.", "mc.yandex", "clck.yandex", "favicon", "cache", "webcache", "translate.", "google.com/search"]
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


async def _upload_to_temp_host(image_data: bytes, session: aiohttp.ClientSession, logger) -> Optional[str]:
    """Upload image to a temporary public image host and return the public URL."""
    
    # Method 1: freeimage.host (free, no key needed, fast)
    try:
        form = aiohttp.FormData()
        form.add_field("source", base64.b64encode(image_data).decode("utf-8"))
        form.add_field("type", "base64")
        form.add_field("action", "upload")
        
        timeout = aiohttp.ClientTimeout(total=8)
        async with session.post("https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5", data=form, timeout=timeout) as resp:
            if resp.status == 200:
                data = await resp.json()
                url = data.get("image", {}).get("url")
                if url:
                    logger.info(f"Uploaded to freeimage.host: {url}")
                    return url
    except Exception as e:
        logger.debug(f"freeimage.host upload failed: {e}")
        
    # Method 2: imgbb (fallback)
    try:
        imgbb_key = os.getenv("IMGBB_API_KEY", "")
        if imgbb_key:
            form = aiohttp.FormData()
            form.add_field("key", imgbb_key)
            form.add_field("image", base64.b64encode(image_data).decode("utf-8"))
            
            timeout = aiohttp.ClientTimeout(total=8)
            async with session.post("https://api.imgbb.com/1/upload", data=form, timeout=timeout) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    url = data.get("data", {}).get("url")
                    if url:
                        logger.info(f"Uploaded to imgbb: {url}")
                        return url
    except Exception as e:
        logger.debug(f"imgbb upload failed: {e}")
    
    # Method 3: 0x0.st (minimal paste service)
    try:
        form = aiohttp.FormData()
        form.add_field("file", image_data, filename="photo.jpg", content_type="image/jpeg")
        
        timeout = aiohttp.ClientTimeout(total=8)
        async with session.post("https://0x0.st", data=form, timeout=timeout) as resp:
            if resp.status == 200:
                url = (await resp.text()).strip()
                if url.startswith("http"):
                    logger.info(f"Uploaded to 0x0.st: {url}")
                    return url
    except Exception as e:
        logger.debug(f"0x0.st upload failed: {e}")
    
    return None

async def _search_yandex(image_path: str) -> List[FaceSearchResult]:
    """
    Search for face across web and social media using Yandex Visual Search.
    
    Uses a two-phase approach:
    1. Upload image to a temporary public host (imgbb, freeimage.host, etc.)
    2. Search on yandex.ru using the URL (to avoid the TR redirect stripping results)
       and extract results from the server-rendered React data-state JSON.
    """
    import logging
    import html as html_module
    logger = logging.getLogger("sherlock.yandex")
    
    results: List[FaceSearchResult] = []
    seen_urls: set = set()
    
    try:
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        connector = aiohttp.TCPConnector(ssl=False)
        jar = aiohttp.CookieJar(unsafe=True)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
            "DNT": "1",
        }
        
        async with aiohttp.ClientSession(connector=connector, headers=headers, cookie_jar=jar) as session:
            
            # ── Phase 1: Upload image to a temporary public host ──
            public_url = await _upload_to_temp_host(image_data, session, logger)
            if not public_url:
                logger.warning("Could not upload image to any temporary host")
                return results
                
            logger.info(f"Image uploaded to temporary host: {public_url}")
            
            # Get cookies first
            try:
                await session.get("https://yandex.ru/images/", timeout=aiohttp.ClientTimeout(total=5))
            except Exception:
                pass
            
            fetch_timeout = aiohttp.ClientTimeout(total=12, connect=4.0)
            
            # ── Phase 2: Search yandex.ru with the public URL ──
            search_params = {
                "rpt": "imageview",
                "url": public_url,
            }
            
            cbir_id = None
            
            try:
                async with session.get(
                    "https://yandex.ru/images/search",
                    params=search_params,
                    timeout=fetch_timeout,
                    allow_redirects=True,
                ) as resp:
                    if resp.status != 200:
                        logger.warning(f"Yandex URL search returned status {resp.status}")
                        return results
                    
                    html_text = await resp.text()
                    final_url = str(resp.url)
                    logger.info(f"Yandex search OK, HTML length: {len(html_text)}, final URL: {final_url}")
                    
                    # Check for CAPTCHA
                    if "showcaptcha" in html_text.lower():
                        logger.warning("Yandex returned CAPTCHA page")
                        return results
                    
                    # Extract cbir_id from URL or data-state
                    cbir_match = re.search(r'cbir_id=([^&\s"]+)', final_url)
                    if cbir_match:
                        cbir_id = cbir_match.group(1)
                    
                    # Parse data-state JSON for cbirId and initial results
                    state_blocks = re.findall(r'data-state="([^"]+)"', html_text)
                    for state_raw in state_blocks:
                        try:
                            decoded = html_module.unescape(state_raw)
                            data = json.loads(decoded)
                            initial_state = data.get("initialState", {})
                            if not initial_state:
                                continue
                            
                            # Get cbirId from cbirPreview
                            if not cbir_id:
                                cbir_preview = initial_state.get("cbirPreview", {})
                                cbir_id_val = cbir_preview.get("cbirId")
                                if cbir_id_val:
                                    cbir_id = str(cbir_id_val)
                                    logger.info(f"Extracted cbirId from data-state: {cbir_id}")
                            
                            # Parse any available sites results from the initial page
                            _extract_sites_from_state(initial_state, results, seen_urls, logger)
                            
                        except (json.JSONDecodeError, Exception):
                            continue
                    
                    # Also try HTML link fallback on the initial page
                    _parse_yandex_html_links(html_text, results, seen_urls)
                    
            except Exception as e:
                logger.warning(f"Yandex search error: {e}")
            
            # ── Step 3: Fetch dedicated sites page with cbir_id ──
            if cbir_id:
                logger.info(f"Fetching sites page with cbir_id={cbir_id}")
                
                sites_url = f"https://yandex.ru/images/search?rpt=imageview&cbir_id={cbir_id}&cbir_page=sites"
                
                try:
                    async with session.get(sites_url, timeout=fetch_timeout) as resp:
                        if resp.status == 200:
                            sites_html = await resp.text()
                            logger.info(f"Sites page HTML length: {len(sites_html)}")
                            
                            if "showcaptcha" not in sites_html.lower():
                                # Parse data-state from sites page
                                state_blocks = re.findall(r'data-state="([^"]+)"', sites_html)
                                for state_raw in state_blocks:
                                    try:
                                        decoded = html_module.unescape(state_raw)
                                        data = json.loads(decoded)
                                        initial_state = data.get("initialState", {})
                                        if initial_state:
                                            _extract_sites_from_state(initial_state, results, seen_urls, logger)
                                    except (json.JSONDecodeError, Exception):
                                        continue
                                
                                # HTML fallback
                                _parse_yandex_html_links(sites_html, results, seen_urls)
                except Exception as e:
                    logger.warning(f"Yandex sites page error: {e}")
            else:
                logger.warning("No cbir_id obtained from Yandex")
    
    except Exception as e:
        logger.warning(f"Yandex top-level search error: {e}")
    
    logger.info(f"Yandex returning {len(results)} total candidate results")
    return results




def _extract_sites_from_state(initial_state: dict, results: list, seen_urls: set, logger):
    """
    Extract Yandex search results from the initialState object.
    The key data lives in cbirSites.sites and cbirSitesList.sites arrays.
    """
    
    try:
        # Extract sites from cbirSites
        cbir_sites = initial_state.get("cbirSites", {})
        sites_list = cbir_sites.get("sites", [])
        
        # Also check cbirSitesList
        cbir_sites_list = initial_state.get("cbirSitesList", {})
        sites_list_alt = cbir_sites_list.get("sites", [])
        
        all_sites = sites_list + sites_list_alt
        
        if all_sites:
            logger.info(f"Found {len(all_sites)} sites in Yandex data-state")
            
            for site in all_sites:
                try:
                    url = site.get("url") or site.get("href") or ""
                    title = site.get("title") or site.get("domain") or ""
                    description = site.get("description") or site.get("text") or ""
                    thumb = site.get("thumb", {}).get("url") if isinstance(site.get("thumb"), dict) else site.get("thumb")
                    
                    if not url or not url.startswith("http"):
                        continue
                    
                    _add_candidate_result(url, title, description, thumb, results, seen_urls)
                except Exception:
                    continue
            
            # Also extract from serpList items if available
            serp_list = initial_state.get("serpList", {})
            serp_items = serp_list.get("items", {})
            if isinstance(serp_items, dict):
                entities = serp_items.get("entities", {})
                if isinstance(entities, dict):
                    for entity_id, entity in entities.items():
                        try:
                            snippet = entity.get("snippet", {})
                            if isinstance(snippet, dict):
                                page_url = snippet.get("url") or snippet.get("greenUrl") or ""
                                page_title = snippet.get("title") or ""
                                page_thumb = snippet.get("thumb", {}).get("url") if isinstance(snippet.get("thumb"), dict) else None
                                
                                if page_url and page_url.startswith("http"):
                                    _add_candidate_result(page_url, page_title, "", page_thumb, results, seen_urls)
                        except Exception:
                            continue
            
            # Extract from cbirSimilar thumbs
            cbir_similar = initial_state.get("cbirSimilar", {})
            similar_thumbs = cbir_similar.get("thumbs", [])
            for thumb_data in similar_thumbs:
                try:
                    if isinstance(thumb_data, dict):
                        origin_url = thumb_data.get("originUrl") or thumb_data.get("url") or ""
                        thumb_url = thumb_data.get("url") or thumb_data.get("src") or ""
                        title = thumb_data.get("title") or ""
                        
                        if origin_url and origin_url.startswith("http"):
                            _add_candidate_result(origin_url, title, "", thumb_url, results, seen_urls)
                except Exception:
                    continue
                    
    except Exception as e:
        logger.warning(f"Error parsing Yandex data-state: {e}")


def _parse_yandex_html_links(html: str, results: List[FaceSearchResult], seen_urls: set):
    """Fallback: Parse social media links from Yandex HTML using BeautifulSoup."""
    try:
        soup = BeautifulSoup(html, "lxml")
        
        # Strategy 1: CbirSites-Item divs (legacy, may still work on some pages)
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
                thumb = img_el.get("src") if img_el else None
                if thumb and thumb.startswith("//"):
                    thumb = f"https:{thumb}"
                
                _add_candidate_result(url, title, desc, thumb, results, seen_urls)
            except Exception:
                continue

        # Strategy 2: Only social platform <a> tags
        junk_domains = ["captcha", "yastatic", "w3.org", "schema.org", "avatars.mds",
                        "yandex.", "mc.yandex", "clck.yandex", "favicon", "cache",
                        "webcache", "translate.", "google.com/search", "passport.yandex"]
        
        all_links = soup.find_all("a", href=True)
        for link in all_links:
            try:
                url = link.get("href", "")
                title = link.get_text(strip=True)
                
                if url.startswith("http") and not any(j in url.lower() for j in junk_domains):
                    platform, _, is_social, _ = _analyze_link(url, title)
                    if is_social:
                        _add_candidate_result(url, title, None, None, results, seen_urls)
            except Exception:
                continue
    except Exception:
        pass


def _add_candidate_result(url: str, title: str, desc: Optional[str], thumb: Optional[str], results: List[FaceSearchResult], seen_urls: set):
    """Clean and add candidate result to list."""
    if not url or not url.startswith("http"):
        return
    
    # Extract clean target URL if wrapped in Yandex redirect
    try:
        parsed = urllib.parse.urlparse(url)
        if "yandex." in parsed.netloc:
            qs = urllib.parse.parse_qs(parsed.query)
            if "img_url" in qs:
                url = qs["img_url"][0]
            elif "url" in qs:
                url = qs["url"][0]
            elif "text" in qs and qs["text"][0].startswith("http"):
                url = qs["text"][0]
            else:
                return  # Yandex internal link without extractable target
    except Exception:
        pass

    # Clean query parameters like utm
    clean_url = re.sub(r'\?utm_[^&]+(&utm_[^&]+)*', '', url).rstrip('?')
    if clean_url in seen_urls:
        return
    seen_urls.add(clean_url)
    
    # Filter out junk URLs
    junk_patterns = ["captcha", "yastatic", "yandex.", "google.com/search", "w3.org", "schema.org"]
    if any(j in clean_url.lower() for j in junk_patterns):
        return
    
    platform, icon, is_social, username = _analyze_link(clean_url, title or "")
    if not is_social:
        return
    
    display_title = title if title and len(title) > 3 else (f"@{username}" if username else f"{platform} Profile")
    
    results.append(FaceSearchResult(
        source_engine="yandex",
        platform=platform,
        platform_icon=icon,
        title=display_title,
        username=username,
        url=clean_url,
        thumbnail_url=thumb,
        description=desc or f"Matched profile on {platform}",
        is_social_profile=is_social,
    ))

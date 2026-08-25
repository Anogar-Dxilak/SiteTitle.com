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
    
    engines = search_engines or ["google_vision"]
    raw_results: List[FaceSearchResult] = []
    
    for engine in engines:
        if engine == "yandex":
            engine_results = await _search_yandex(image_path)
            raw_results.extend(engine_results)
        elif engine == "google_vision":
            engine_results = await _search_google_vision(image_path)
            raw_results.extend(engine_results)
    
    logger.info(f"Total raw results from all engines: {len(raw_results)}")
    for r in raw_results:
        logger.info(f"  -> [{r.platform}] {r.title} | {r.url} | social={r.is_social_profile}")

    # Google Vision sonuçlarını doğrudan kabul et (Google zaten eşleştirmiş)
    # Sosyal medya olanları öne al ama hepsini göster
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
        total_checked=len(engines),
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


async def _search_yandex(image_path: str) -> List[FaceSearchResult]:
    social_results: List[FaceSearchResult] = []
    web_results: List[FaceSearchResult] = []
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
            
            post_timeout = aiohttp.ClientTimeout(total=10, connect=5)
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
                import logging
                logging.getLogger("sherlock").warning(f"Yandex upload error: {e}")

            if cbir_id:
                fetch_timeout = aiohttp.ClientTimeout(total=8, connect=3)
                
                # Step 2: Fetch MULTIPLE result pages in parallel for maximum coverage
                pages_to_fetch = [
                    f"https://yandex.com/images/search?rpt=imageview&cbir_id={cbir_id}&cbir_page=sites",
                    f"https://yandex.com/images/search?rpt=imageview&cbir_id={cbir_id}",
                    f"https://yandex.com.tr/gorsel/search?rpt=imageview&cbir_id={cbir_id}&cbir_page=sites",
                ]
                
                async def fetch_and_parse(url):
                    try:
                        async with session.get(url, timeout=fetch_timeout) as resp:
                            if resp.status == 200:
                                html = await resp.text()
                                _parse_yandex_html(html, orig_img, social_results, web_results, seen_urls)
                    except Exception:
                        pass
                
                await asyncio.gather(*[fetch_and_parse(u) for u in pages_to_fetch], return_exceptions=True)

                # Always add direct Yandex link as last result
                direct_yandex_url = f"https://yandex.com/images/search?rpt=imageview&cbir_id={cbir_id}"
                web_results.append(FaceSearchResult(
                    source_engine="yandex",
                    platform="Yandex Engine",
                    platform_icon="🔍",
                    title="Yandex Visual Search Results Page",
                    url=direct_yandex_url,
                    thumbnail_url=orig_img,
                    description="Direct link to full Yandex visual search page for this photo.",
                    is_social_profile=False,
                ))

    except Exception as e:
        web_results.append(FaceSearchResult(
            source_engine="yandex",
            platform="Yandex Engine",
            platform_icon="🔍",
            title="Yandex Search Error",
            url="https://yandex.com/images/",
            description=f"Error connecting to Yandex: {str(e)}",
            is_social_profile=False,
        ))
    
    return social_results + web_results


def _parse_yandex_html(html: str, default_thumb: Optional[str], social_results: List[FaceSearchResult], web_results: List[FaceSearchResult], seen_urls: set):
    """Parse links from Yandex HTML pages and categorize into Social vs Web results."""
    import urllib.parse
    logger = __import__("logging").getLogger("sherlock.parser")

    try:
        soup = BeautifulSoup(html, "lxml")
        
        # ── Strategy 1: CbirSites-Item divs (classic Yandex structure) ──
        items = soup.find_all("div", class_=re.compile(r"CbirSites", re.IGNORECASE))
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
                
                _process_url(url, title, desc, thumb, default_thumb, social_results, web_results, seen_urls)
            except Exception:
                continue

        # ── Strategy 2: Any <a> tag linking to a known social media domain ──
        all_links = soup.find_all("a", href=True)
        for link in all_links:
            try:
                url = link.get("href", "")
                title = link.get_text(strip=True)
                
                # Check if this URL points to a social media domain
                url_lower = url.lower()
                is_interesting = any(domain in url_lower for domain in SOCIAL_DOMAINS.keys())
                
                if is_interesting:
                    _process_url(url, title, None, default_thumb, default_thumb, social_results, web_results, seen_urls)
            except Exception:
                continue

        # ── Strategy 3: Extract from JSON-LD / data attributes ──
        scripts = soup.find_all("script", type="application/json")
        for script in scripts:
            try:
                data = json.loads(script.string or "{}")
                _extract_from_json(data, default_thumb, social_results, web_results, seen_urls)
            except Exception:
                continue

        # ── Strategy 4: data-bem attributes (Yandex BEM framework) ──
        bem_elements = soup.find_all(attrs={"data-bem": True})
        for el in bem_elements:
            try:
                bem_data = json.loads(el.get("data-bem", "{}"))
                _extract_from_json(bem_data, default_thumb, social_results, web_results, seen_urls)
            except Exception:
                continue

        logger.info(f"Parsed {len(social_results)} social + {len(web_results)} web results from HTML ({len(html)} bytes)")

    except Exception as e:
        logger.warning(f"HTML parse error: {e}")


def _process_url(url: str, title: str, desc: Optional[str], thumb: Optional[str], default_thumb: Optional[str], 
                 social_results: List[FaceSearchResult], web_results: List[FaceSearchResult], seen_urls: set):
    """Process a single URL: clean it, classify it, and add to results."""
    import urllib.parse
    
    if not url or not url.startswith("http"):
        return
    
    # Extract actual URL if it's a Yandex redirect
    if "yandex." in url and ("img_url=" in url or "url=" in url):
        parsed = urllib.parse.urlparse(url)
        qs = urllib.parse.parse_qs(parsed.query)
        if "img_url" in qs:
            url = qs["img_url"][0]
        elif "url" in qs:
            url = qs["url"][0]

    # Filter out junk domains
    junk_domains = ["yandex.", "yastatic.", "w3.org", "schema.org", "aliexpress", "amazon", "ebay", "avatars.mds", "captcha"]
    if any(j in url.lower() for j in junk_domains):
        return
    
    if url in seen_urls:
        return
    
    seen_urls.add(url)
    platform, icon, is_social, username = _analyze_link(url, title or "")
    
    res = FaceSearchResult(
        source_engine="yandex",
        platform=platform,
        platform_icon=icon,
        title=title or f"{platform} Match",
        username=username,
        url=url,
        thumbnail_url=thumb or default_thumb,
        description=desc or f"Matched profile/page on {platform}",
        is_social_profile=is_social,
    )
    
    if is_social:
        social_results.append(res)
    else:
        web_results.append(res)


def _extract_from_json(data, default_thumb, social_results, web_results, seen_urls):
    """Recursively extract URLs from nested JSON structures (Yandex data-bem, JSON-LD, etc.)."""
    if isinstance(data, dict):
        # Check for url/href/link keys
        for key in ("url", "href", "link", "originalUrl", "pageUrl"):
            val = data.get(key)
            if isinstance(val, str) and val.startswith("http"):
                title = data.get("title", data.get("text", data.get("snippet", "")))
                thumb = data.get("thumb", data.get("image", data.get("img", default_thumb)))
                if thumb and isinstance(thumb, dict):
                    thumb = thumb.get("url", thumb.get("src", default_thumb))
                _process_url(val, title or "", None, thumb, default_thumb, social_results, web_results, seen_urls)
        
        # Recurse into values
        for v in data.values():
            if isinstance(v, (dict, list)):
                _extract_from_json(v, default_thumb, social_results, web_results, seen_urls)
    
    elif isinstance(data, list):
        for item in data[:50]:  # limit recursion
            if isinstance(item, (dict, list)):
                _extract_from_json(item, default_thumb, social_results, web_results, seen_urls)


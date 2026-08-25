import aiohttp
import time
import re
import json
import cv2
import asyncio
from typing import List, Optional
from pathlib import Path
from bs4 import BeautifulSoup

from app.models.result import FaceSearchResult, SearchResponse
from app.utils.helpers import generate_search_id
from app.services.face_verifier import extract_face_crop, compare_faces, download_image_as_bytes


SOCIAL_DOMAINS = {
    "instagram.com": ("Instagram", "📷"),
    "facebook.com": ("Facebook", "📘"),
    "fb.com": ("Facebook", "📘"),
    "twitter.com": ("Twitter / X", "🐦"),
    "x.com": ("Twitter / X", "🐦"),
    "linkedin.com": ("LinkedIn", "💼"),
    "tiktok.com": ("TikTok", "🎵"),
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
    engines = search_engines or ["yandex"]
    raw_results: List[FaceSearchResult] = []
    
    for engine in engines:
        if engine == "yandex":
            engine_results = await _search_yandex(image_path)
            raw_results.extend(engine_results)
    
    verified_results: List[FaceSearchResult] = []
    
    target_img = cv2.imread(image_path)
    target_face_crop = None
    if target_img is not None:
        target_face_crop = extract_face_crop(target_img)
        if target_face_crop is None:
            target_face_crop = cv2.cvtColor(target_img, cv2.COLOR_BGR2GRAY)

    if target_face_crop is not None and len(raw_results) > 0:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            
            async def verify_single_result(res: FaceSearchResult):
                if not res.thumbnail_url:
                    verified_results.append(res)
                    return

                img_bytes = await download_image_as_bytes(res.thumbnail_url, session, timeout=3)
                if img_bytes:
                    is_match, similarity = compare_faces(target_face_crop, img_bytes)
                    res.similarity_score = similarity
                    # We keep ALL results, but assign similarity score if possible
                    verified_results.append(res)
                else:
                    verified_results.append(res)

            # Check all results but don't filter them out
            tasks = [verify_single_result(r) for r in raw_results[:15]]
            await asyncio.gather(*tasks, return_exceptions=True)
            
            # Add remaining unverified results
            for r in raw_results[15:]:
                verified_results.append(r)
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
        total_checked=len(engines),
        face_results=verified_results,
        duration_ms=elapsed_ms,
    )


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


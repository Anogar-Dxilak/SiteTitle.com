import asyncio
import aiohttp
import time
from typing import List, Optional

from app.platforms.base import BasePlatform
from app.platforms.instagram import InstagramPlatform
from app.platforms.twitter import TwitterPlatform
from app.platforms.facebook import FacebookPlatform
from app.platforms.linkedin import LinkedInPlatform
from app.platforms.tiktok import TikTokPlatform
from app.platforms.youtube import YouTubePlatform
from app.platforms.github import GitHubPlatform
from app.platforms.reddit import RedditPlatform
from app.platforms.telegram import TelegramPlatform
from app.platforms.discord import DiscordPlatform
from app.models.result import PlatformResult, SearchResponse
from app.utils.helpers import generate_search_id, sanitize_username
from app.config import settings


# All available platforms
ALL_PLATFORMS: dict[str, BasePlatform] = {
    "instagram": InstagramPlatform(),
    "twitter": TwitterPlatform(),
    "facebook": FacebookPlatform(),
    "linkedin": LinkedInPlatform(),
    "tiktok": TikTokPlatform(),
    "youtube": YouTubePlatform(),
    "github": GitHubPlatform(),
    "reddit": RedditPlatform(),
    "telegram": TelegramPlatform(),
    "discord": DiscordPlatform(),
}


def get_platform_list() -> List[dict]:
    """Get list of all supported platforms with their configs."""
    return [
        {
            "id": pid,
            "name": platform.config.name,
            "icon": platform.config.icon,
            "color": platform.config.color,
            "base_url": platform.config.base_url,
        }
        for pid, platform in ALL_PLATFORMS.items()
    ]


async def search_username(
    username: str,
    platforms: Optional[List[str]] = None,
    callback=None,
) -> SearchResponse:
    """
    Search for a username across multiple platforms concurrently.
    
    Args:
        username: The username to search for
        platforms: Optional list of specific platform IDs to search
        callback: Optional async callback function called with each result
    
    Returns:
        SearchResponse with all platform results
    """
    username = sanitize_username(username)
    search_id = generate_search_id()
    start_time = time.time()
    
    # Determine which platforms to search
    if platforms:
        selected = {
            pid: p for pid, p in ALL_PLATFORMS.items()
            if pid in platforms
        }
    else:
        selected = ALL_PLATFORMS
    
    results: List[PlatformResult] = []
    
    # Create a semaphore to limit concurrent requests
    semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_REQUESTS)
    
    async def check_platform(platform_id: str, platform: BasePlatform):
        async with semaphore:
            result = await platform.check(username, session, timeout=5)
            results.append(result)
            if callback:
                await callback(result)
    
    # Create aiohttp session and run all checks concurrently
    connector = aiohttp.TCPConnector(limit=settings.MAX_CONCURRENT_REQUESTS, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [
            check_platform(pid, platform)
            for pid, platform in selected.items()
        ]
        await asyncio.gather(*tasks, return_exceptions=True)
    
    elapsed_ms = int((time.time() - start_time) * 1000)
    found_count = sum(1 for r in results if r.status == "found")
    
    return SearchResponse(
        search_id=search_id,
        search_type="username",
        query=username,
        total_found=found_count,
        total_checked=len(results),
        platform_results=results,
        duration_ms=elapsed_ms,
    )

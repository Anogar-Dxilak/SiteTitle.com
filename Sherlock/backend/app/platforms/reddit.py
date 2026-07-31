from typing import Optional

from app.platforms.base import BasePlatform, PlatformConfig
from app.models.result import PlatformResult, PlatformStatus
import aiohttp
import time


class RedditPlatform(BasePlatform):
    """Reddit profile checker using public JSON endpoint."""
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="Reddit",
            base_url="https://www.reddit.com",
            url_pattern="https://www.reddit.com/user/{username}",
            icon="🤖",
            color="#FF4500",
        )
    
    async def check(self, username: str, session: aiohttp.ClientSession, timeout: int = 15) -> PlatformResult:
        """Override to use Reddit JSON API."""
        api_url = f"https://www.reddit.com/user/{username}/about.json"
        start_time = time.time()
        
        try:
            async with session.get(
                api_url,
                headers={
                    "User-Agent": "Sherlock-OSINT-Tool/1.0",
                },
                timeout=aiohttp.ClientTimeout(total=timeout),
                ssl=False,
            ) as response:
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                if response.status == 200:
                    data = await response.json()
                    user_data = data.get("data", {})
                    
                    if user_data.get("is_suspended"):
                        return PlatformResult(
                            platform=self.config.name,
                            status=PlatformStatus.NOT_FOUND,
                            username=username,
                            response_time_ms=elapsed_ms,
                            error_message="Account suspended",
                        )
                    
                    return PlatformResult(
                        platform=self.config.name,
                        status=PlatformStatus.FOUND,
                        url=f"https://www.reddit.com/user/{username}",
                        username=username,
                        profile_name=user_data.get("subreddit", {}).get("title"),
                        bio=user_data.get("subreddit", {}).get("public_description"),
                        avatar_url=user_data.get("icon_img", "").split("?")[0] if user_data.get("icon_img") else None,
                        followers=user_data.get("subreddit", {}).get("subscribers"),
                        response_time_ms=elapsed_ms,
                    )
                elif response.status == 404:
                    return PlatformResult(
                        platform=self.config.name,
                        status=PlatformStatus.NOT_FOUND,
                        username=username,
                        response_time_ms=elapsed_ms,
                    )
                else:
                    return PlatformResult(
                        platform=self.config.name,
                        status=PlatformStatus.ERROR,
                        username=username,
                        response_time_ms=elapsed_ms,
                        error_message=f"HTTP {response.status}",
                    )
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return PlatformResult(
                platform=self.config.name,
                status=PlatformStatus.ERROR,
                username=username,
                response_time_ms=elapsed_ms,
                error_message=str(e),
            )

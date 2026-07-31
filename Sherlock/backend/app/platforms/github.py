from typing import Optional
import json

from app.platforms.base import BasePlatform, PlatformConfig
from app.models.result import PlatformResult, PlatformStatus
import aiohttp
import time


class GitHubPlatform(BasePlatform):
    """GitHub profile checker using public API."""
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="GitHub",
            base_url="https://github.com",
            url_pattern="https://github.com/{username}",
            icon="🐙",
            color="#181717",
        )
    
    async def check(self, username: str, session: aiohttp.ClientSession, timeout: int = 15) -> PlatformResult:
        """Override to use GitHub API for better accuracy."""
        api_url = f"https://api.github.com/users/{username}"
        start_time = time.time()
        
        try:
            async with session.get(
                api_url,
                headers={
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Sherlock-OSINT-Tool",
                },
                timeout=aiohttp.ClientTimeout(total=timeout),
                ssl=False,
            ) as response:
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                if response.status == 200:
                    data = await response.json()
                    return PlatformResult(
                        platform=self.config.name,
                        status=PlatformStatus.FOUND,
                        url=f"https://github.com/{username}",
                        username=username,
                        profile_name=data.get("name"),
                        bio=data.get("bio"),
                        avatar_url=data.get("avatar_url"),
                        followers=data.get("followers"),
                        response_time_ms=elapsed_ms,
                    )
                elif response.status == 404:
                    return PlatformResult(
                        platform=self.config.name,
                        status=PlatformStatus.NOT_FOUND,
                        username=username,
                        response_time_ms=elapsed_ms,
                    )
                elif response.status == 403:
                    return PlatformResult(
                        platform=self.config.name,
                        status=PlatformStatus.RATE_LIMITED,
                        username=username,
                        response_time_ms=elapsed_ms,
                        error_message="GitHub API rate limit exceeded",
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

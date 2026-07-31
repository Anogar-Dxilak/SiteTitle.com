from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass
import aiohttp
import time

from app.models.result import PlatformResult, PlatformStatus


@dataclass
class PlatformConfig:
    """Configuration for a social media platform."""
    name: str
    base_url: str
    url_pattern: str  # e.g., "https://instagram.com/{username}"
    icon: str  # emoji or icon identifier
    color: str  # hex color for UI
    headers: Optional[dict] = None


class BasePlatform(ABC):
    """Abstract base class for platform checkers."""
    
    def __init__(self):
        self.config = self.get_config()
    
    @abstractmethod
    def get_config(self) -> PlatformConfig:
        """Return platform configuration."""
        pass
    
    def get_profile_url(self, username: str) -> str:
        """Generate profile URL from username."""
        return self.config.url_pattern.format(username=username)
    
    def get_headers(self) -> dict:
        """Return headers for HTTP requests."""
        base_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
        }
        if self.config.headers:
            base_headers.update(self.config.headers)
        return base_headers
    
    async def check(self, username: str, session: aiohttp.ClientSession, timeout: int = 5) -> PlatformResult:
        """
        Check if a username exists on this platform.
        Returns a PlatformResult.
        """
        url = self.get_profile_url(username)
        start_time = time.time()
        
        try:
            client_timeout = aiohttp.ClientTimeout(
                total=timeout,
                connect=2.5,
                sock_read=3.5
            )
            async with session.get(
                url,
                headers=self.get_headers(),
                timeout=client_timeout,
                allow_redirects=True,
                ssl=False,
            ) as response:
                elapsed_ms = int((time.time() - start_time) * 1000)
                body = await response.text()
                
                found = self.is_found(response.status, body, username)
                
                result = PlatformResult(
                    platform=self.config.name,
                    status=PlatformStatus.FOUND if found else PlatformStatus.NOT_FOUND,
                    url=url if found else None,
                    username=username,
                    response_time_ms=elapsed_ms,
                )
                
                # Try to extract extra info if found
                if found:
                    extra = self.extract_info(body)
                    if extra:
                        result.profile_name = extra.get("name")
                        result.bio = extra.get("bio")
                        result.avatar_url = extra.get("avatar")
                        result.followers = extra.get("followers")
                
                return result
                
        except aiohttp.ClientResponseError as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            if e.status == 429:
                return PlatformResult(
                    platform=self.config.name,
                    status=PlatformStatus.RATE_LIMITED,
                    username=username,
                    response_time_ms=elapsed_ms,
                    error_message="Rate limited",
                )
            return PlatformResult(
                platform=self.config.name,
                status=PlatformStatus.ERROR,
                username=username,
                response_time_ms=elapsed_ms,
                error_message=str(e),
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
    
    def is_found(self, status_code: int, body: str, username: str) -> bool:
        """
        Determine if the profile was found.
        Default: 200 status = found.
        Override in subclass for custom logic.
        """
        return status_code == 200
    
    def extract_info(self, body: str) -> Optional[dict]:
        """
        Try to extract profile info from the response body.
        Override in subclass for platform-specific extraction.
        Returns dict with keys: name, bio, avatar, followers
        """
        return None

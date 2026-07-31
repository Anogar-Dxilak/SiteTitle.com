from typing import Optional
from bs4 import BeautifulSoup

from app.platforms.base import BasePlatform, PlatformConfig


class YouTubePlatform(BasePlatform):
    """YouTube channel checker."""
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="YouTube",
            base_url="https://www.youtube.com",
            url_pattern="https://www.youtube.com/@{username}",
            icon="▶️",
            color="#FF0000",
        )
    
    def is_found(self, status_code: int, body: str, username: str) -> bool:
        if status_code == 404:
            return False
        if status_code == 200:
            lower_body = body.lower()
            not_found_indicators = [
                "this page isn't available",
                "404 not found",
            ]
            return not any(ind in lower_body for ind in not_found_indicators)
        return False
    
    def extract_info(self, body: str) -> Optional[dict]:
        try:
            soup = BeautifulSoup(body, "lxml")
            info = {}
            og_title = soup.find("meta", {"property": "og:title"})
            if og_title:
                info["name"] = og_title.get("content", "")
            og_desc = soup.find("meta", {"property": "og:description"})
            if og_desc:
                info["bio"] = og_desc.get("content", "")
            og_image = soup.find("meta", {"property": "og:image"})
            if og_image:
                info["avatar"] = og_image.get("content", "")
            return info if info else None
        except Exception:
            return None

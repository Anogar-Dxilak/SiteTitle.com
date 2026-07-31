from typing import Optional
from bs4 import BeautifulSoup

from app.platforms.base import BasePlatform, PlatformConfig


class FacebookPlatform(BasePlatform):
    """Facebook profile checker."""
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="Facebook",
            base_url="https://www.facebook.com",
            url_pattern="https://www.facebook.com/{username}",
            icon="📘",
            color="#1877F2",
        )
    
    def is_found(self, status_code: int, body: str, username: str) -> bool:
        if status_code != 200:
            return False
        lower_body = body.lower()
        not_found_indicators = [
            "page not found",
            "this content isn't available",
            "the link you followed may be broken",
        ]
        return not any(ind in lower_body for ind in not_found_indicators)
    
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

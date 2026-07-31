from typing import Optional
from bs4 import BeautifulSoup

from app.platforms.base import BasePlatform, PlatformConfig


class TwitterPlatform(BasePlatform):
    """Twitter/X profile checker."""
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="Twitter",
            base_url="https://x.com",
            url_pattern="https://x.com/{username}",
            icon="🐦",
            color="#1DA1F2",
        )
    
    def is_found(self, status_code: int, body: str, username: str) -> bool:
        if status_code == 200:
            # Check if it's not a "suspended" or "doesn't exist" page
            lower_body = body.lower()
            not_found_indicators = [
                "this account doesn't exist",
                "account suspended",
                "hmm...this page doesn't exist",
            ]
            return not any(indicator in lower_body for indicator in not_found_indicators)
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

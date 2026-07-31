from typing import Optional
from bs4 import BeautifulSoup

from app.platforms.base import BasePlatform, PlatformConfig


class InstagramPlatform(BasePlatform):
    """Instagram profile checker."""
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="Instagram",
            base_url="https://www.instagram.com",
            url_pattern="https://www.instagram.com/{username}/",
            icon="📷",
            color="#E4405F",
        )
    
    def is_found(self, status_code: int, body: str, username: str) -> bool:
        if status_code != 200:
            return False
        # Instagram returns 200 for login page redirects too
        if "login" in body.lower() and username.lower() not in body.lower():
            return False
        return True
    
    def extract_info(self, body: str) -> Optional[dict]:
        try:
            soup = BeautifulSoup(body, "lxml")
            info = {}
            # Try to get meta description
            meta_desc = soup.find("meta", {"name": "description"})
            if meta_desc:
                content = meta_desc.get("content", "")
                info["bio"] = content
            # Try og:title for name
            og_title = soup.find("meta", {"property": "og:title"})
            if og_title:
                info["name"] = og_title.get("content", "")
            # Try og:image for avatar
            og_image = soup.find("meta", {"property": "og:image"})
            if og_image:
                info["avatar"] = og_image.get("content", "")
            return info if info else None
        except Exception:
            return None

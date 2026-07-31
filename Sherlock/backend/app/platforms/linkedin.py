from typing import Optional
from bs4 import BeautifulSoup

from app.platforms.base import BasePlatform, PlatformConfig


class LinkedInPlatform(BasePlatform):
    """LinkedIn profile checker."""
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="LinkedIn",
            base_url="https://www.linkedin.com",
            url_pattern="https://www.linkedin.com/in/{username}/",
            icon="💼",
            color="#0A66C2",
        )
    
    def is_found(self, status_code: int, body: str, username: str) -> bool:
        if status_code != 200:
            return False
        lower_body = body.lower()
        not_found_indicators = [
            "page not found",
            "this linkedin page isn't available",
            "profile not found",
        ]
        return not any(ind in lower_body for ind in not_found_indicators)
    
    def extract_info(self, body: str) -> Optional[dict]:
        try:
            soup = BeautifulSoup(body, "lxml")
            info = {}
            title = soup.find("title")
            if title:
                info["name"] = title.text.split("|")[0].strip()
            og_desc = soup.find("meta", {"property": "og:description"})
            if og_desc:
                info["bio"] = og_desc.get("content", "")
            og_image = soup.find("meta", {"property": "og:image"})
            if og_image:
                info["avatar"] = og_image.get("content", "")
            return info if info else None
        except Exception:
            return None

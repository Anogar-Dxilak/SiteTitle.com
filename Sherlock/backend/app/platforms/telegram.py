from typing import Optional
from bs4 import BeautifulSoup

from app.platforms.base import BasePlatform, PlatformConfig


class TelegramPlatform(BasePlatform):
    """Telegram profile checker via t.me."""
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="Telegram",
            base_url="https://t.me",
            url_pattern="https://t.me/{username}",
            icon="✈️",
            color="#0088CC",
        )
    
    def is_found(self, status_code: int, body: str, username: str) -> bool:
        if status_code != 200:
            return False
        lower_body = body.lower()
        # Telegram shows "If you have Telegram" for valid profiles
        # and "you can contact" for existing users
        not_found_indicators = [
            "if you have <strong>telegram</strong>, you can contact",
        ]
        # Check for valid profile indicators
        found_indicators = [
            "tgme_page_title",
            "tgme_page_extra",
        ]
        has_profile = any(ind in lower_body for ind in found_indicators)
        return has_profile
    
    def extract_info(self, body: str) -> Optional[dict]:
        try:
            soup = BeautifulSoup(body, "lxml")
            info = {}
            # Profile name
            title_div = soup.find("div", class_="tgme_page_title")
            if title_div:
                info["name"] = title_div.get_text(strip=True)
            # Bio/description
            desc_div = soup.find("div", class_="tgme_page_description")
            if desc_div:
                info["bio"] = desc_div.get_text(strip=True)
            # Avatar
            photo_img = soup.find("img", class_="tgme_page_photo_image")
            if photo_img:
                info["avatar"] = photo_img.get("src", "")
            # Members/subscribers count
            extra_div = soup.find("div", class_="tgme_page_extra")
            if extra_div:
                text = extra_div.get_text(strip=True)
                # Try to parse follower count
                import re
                numbers = re.findall(r'[\d\s]+', text.replace('\xa0', ' '))
                if numbers:
                    try:
                        info["followers"] = int(numbers[0].replace(" ", ""))
                    except ValueError:
                        pass
            return info if info else None
        except Exception:
            return None

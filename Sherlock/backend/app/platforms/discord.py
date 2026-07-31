from typing import Optional

from app.platforms.base import BasePlatform, PlatformConfig
from app.models.result import PlatformResult, PlatformStatus
import aiohttp
import time


class DiscordPlatform(BasePlatform):
    """
    Discord user search.
    Discord doesn't have public profile pages by username alone.
    We check if a user exists via Discord's public lookup endpoint.
    Limited functionality — mainly checks Discord server invite usernames.
    """
    
    def get_config(self) -> PlatformConfig:
        return PlatformConfig(
            name="Discord",
            base_url="https://discord.com",
            url_pattern="https://discord.com/users/{username}",
            icon="🎮",
            color="#5865F2",
        )
    
    async def check(self, username: str, session: aiohttp.ClientSession, timeout: int = 15) -> PlatformResult:
        """
        Discord doesn't offer public profile lookup by username easily.
        We attempt to check via known public endpoints.
        """
        # Try checking via Discord's pomelo system by checking if the username
        # appears on any public search APIs or Discord-related services
        url = f"https://discordlookup.com/user/{username}"
        start_time = time.time()
        
        try:
            async with session.get(
                url,
                headers=self.get_headers(),
                timeout=aiohttp.ClientTimeout(total=timeout),
                ssl=False,
                allow_redirects=True,
            ) as response:
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                if response.status == 200:
                    body = await response.text()
                    # Check if the response contains valid user data
                    if username.lower() in body.lower() and "not found" not in body.lower():
                        return PlatformResult(
                            platform=self.config.name,
                            status=PlatformStatus.FOUND,
                            url=f"https://discord.com/users/{username}",
                            username=username,
                            response_time_ms=elapsed_ms,
                        )
                
                return PlatformResult(
                    platform=self.config.name,
                    status=PlatformStatus.NOT_FOUND,
                    username=username,
                    response_time_ms=elapsed_ms,
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

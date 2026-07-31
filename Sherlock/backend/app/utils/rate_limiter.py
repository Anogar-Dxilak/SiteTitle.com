import asyncio
import time
from collections import defaultdict


class RateLimiter:
    """
    Simple in-memory rate limiter.
    Tracks requests per domain and enforces limits.
    """
    
    def __init__(self, max_requests: int = 30, period_seconds: int = 60):
        self.max_requests = max_requests
        self.period_seconds = period_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def acquire(self, domain: str) -> bool:
        """
        Try to acquire a rate limit slot for the given domain.
        Returns True if allowed, False if rate limited.
        """
        async with self._lock:
            now = time.time()
            # Clean old entries
            self._requests[domain] = [
                t for t in self._requests[domain]
                if now - t < self.period_seconds
            ]
            
            if len(self._requests[domain]) >= self.max_requests:
                return False
            
            self._requests[domain].append(now)
            return True
    
    async def wait_and_acquire(self, domain: str, max_wait: float = 5.0) -> bool:
        """
        Wait until a rate limit slot is available, up to max_wait seconds.
        Returns True if acquired, False if timed out.
        """
        start = time.time()
        while time.time() - start < max_wait:
            if await self.acquire(domain):
                return True
            await asyncio.sleep(0.1)
        return False
    
    def get_remaining(self, domain: str) -> int:
        """Get remaining requests for a domain."""
        now = time.time()
        recent = [
            t for t in self._requests.get(domain, [])
            if now - t < self.period_seconds
        ]
        return max(0, self.max_requests - len(recent))


# Global rate limiter instance
rate_limiter = RateLimiter()

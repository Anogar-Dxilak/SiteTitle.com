import uuid
import re
from urllib.parse import urlparse


def generate_search_id() -> str:
    """Generate a unique search ID."""
    return str(uuid.uuid4())[:8]


def sanitize_username(username: str) -> str:
    """Sanitize and normalize a username."""
    # Remove leading @ if present
    username = username.lstrip("@")
    # Remove any whitespace
    username = username.strip()
    # Remove potentially dangerous characters
    username = re.sub(r'[^\w\.\-]', '', username)
    return username


def extract_domain(url: str) -> str:
    """Extract domain from a URL."""
    try:
        parsed = urlparse(url)
        return parsed.netloc or parsed.path
    except Exception:
        return url


def format_number(num: int) -> str:
    """Format a number with K/M suffixes."""
    if num >= 1_000_000:
        return f"{num / 1_000_000:.1f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.1f}K"
    return str(num)

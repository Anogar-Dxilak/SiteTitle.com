import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server
    APP_NAME: str = "Sherlock OSINT Tool"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://anogar-dxilak.github.io",
        "*",
    ]
    
    # Search Settings
    MAX_CONCURRENT_REQUESTS: int = 10
    REQUEST_TIMEOUT: int = 15  # seconds
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 30
    RATE_LIMIT_PERIOD: int = 60  # seconds
    
    # Proxy (optional)
    PROXY_URL: Optional[str] = None
    
    # SerpAPI (optional, for Google reverse image)
    SERPAPI_KEY: Optional[str] = None
    
    # Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

"""
Configuration settings for AI Services
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # API Configuration
    app_name: str = "Prepmate AI Services"
    app_version: str = "1.0.0"
    environment: str = os.getenv("ENV", "development")
    debug: bool = environment == "development"

    # Server Configuration
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    # Gemini API Configuration
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = "gemini-2.5-flash"
    gemini_temperature: float = 0.4
    gemini_max_tokens: int = 2048

    # MongoDB Configuration
    mongo_uri: str = os.getenv(
        "MONGO_URI",
        "mongodb://localhost:27017/prepmate_ai"
    )
    mongo_db_name: str = "prepmate_ai"

    # CORS Configuration
    allowed_origins: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5000"
    ]

    # Backend API Configuration
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:5000")

    # Logging Configuration
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # LLM Service Configuration
    enable_mentor_service: bool = True
    enable_practice_review_service: bool = True
    enable_interview_service: bool = True
    enable_learning_service: bool = True

    # Conversation Memory Configuration
    max_conversation_history: int = 20  # Store last N messages
    conversation_ttl_hours: int = 24 * 30  # 30 days

    # Retry Configuration
    max_retries: int = 3
    retry_delay_seconds: int = 2
    request_timeout_seconds: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


def validate_settings() -> bool:
    """Validate critical settings"""
    if not settings.gemini_api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is required"
        )
    return True

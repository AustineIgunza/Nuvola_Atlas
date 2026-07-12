"""Runtime configuration sourced from environment variables only."""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Ingestion service settings.

    Values load from environment variables or a local `.env` file. Never
    hardcode secrets in this module — Phase A of PHASES.md requires all
    credentials to source from Vercel/Forge environment configuration.
    """

    model_config = SettingsConfigDict(env_file=".env", env_prefix="INGESTION_", extra="ignore")

    laravel_base_url: str = Field(default="http://localhost:8000/api/v1")
    internal_secret: str = Field(default="dev-only-not-a-real-secret")
    daystar_feed_base: str = Field(default="")
    sentry_dsn: str = Field(default="")
    environment: str = Field(default="local")
    anomaly_z_threshold: float = Field(default=3.5)


@lru_cache
def get_settings() -> Settings:
    return Settings()

"""Runtime configuration sourced from environment variables only."""
from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Ingestion service settings.

    Values load from environment variables or a local `.env` file. Never
    hardcode secrets in this module — Phase A of PHASES.md requires all
    credentials to source from Vercel/Forge environment configuration.

    Every field is prefixed `INGESTION_` in the environment, so
    `daily_budget` reads `INGESTION_DAILY_BUDGET`.
    """

    model_config = SettingsConfigDict(env_file=".env", env_prefix="INGESTION_", extra="ignore")

    laravel_base_url: str = Field(default="http://localhost:8000/api/v1")
    internal_secret: str = Field(default="dev-only-not-a-real-secret")
    daystar_feed_base: str = Field(default="")
    sentry_dsn: str = Field(default="")
    environment: str = Field(default="local")
    anomaly_z_threshold: float = Field(default=3.5)

    # Vercel Cron signs its calls with `Authorization: Bearer $CRON_SECRET`
    # and reads that env var by its unprefixed name, so accept both spellings.
    cron_secret: str = Field(
        default="",
        validation_alias=AliasChoices("CRON_SECRET", "INGESTION_CRON_SECRET"),
    )

    # Spend guards — see app/guards.py and docs/data/internal-transport.md.
    max_payload_bytes: int = Field(default=10 * 1024 * 1024)
    max_rows_per_batch: int = Field(default=5000)
    daily_budget: int = Field(default=100_000)
    breaker_failure_threshold: int = Field(default=3)
    breaker_cooldown_seconds: int = Field(default=60)


@lru_cache
def get_settings() -> Settings:
    return Settings()

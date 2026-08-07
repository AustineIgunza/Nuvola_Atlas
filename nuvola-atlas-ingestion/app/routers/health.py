"""Health probe used by Forge, Fluid Compute, and the frontend status widget."""
from datetime import UTC, datetime

from fastapi import APIRouter

from app import __version__
from app.config import get_settings
from app.guards import get_guards

router = APIRouter(tags=["health"])


@router.get("/api/health/ingestion")
async def health_ingestion() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "nuvola-atlas-ingestion",
        "version": __version__,
        "checked_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    }


@router.get("/api/health/guards")
async def health_guards() -> dict[str, object]:
    """Live spend-guard state for the E2E telemetry sweep.

    Counters are per-instance (see app/guards.py), so on Fluid Compute this
    reports the instance that happened to serve the probe — useful for
    debugging, not for accounting.
    """
    settings = get_settings()
    guards = get_guards()
    cooldown = guards.circuit_cooldown_remaining(settings)

    return {
        "circuit_open": cooldown > 0,
        "circuit_cooldown_seconds": cooldown,
        "consecutive_failures": guards.consecutive_failures,
        "budget_day": guards.budget_day,
        "budget_used": guards.budget_used,
        "daily_budget": settings.daily_budget,
        "max_rows_per_batch": settings.max_rows_per_batch,
        "max_payload_bytes": settings.max_payload_bytes,
    }

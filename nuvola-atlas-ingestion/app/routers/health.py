"""Health probe used by Forge, Fluid Compute, and the frontend status widget."""
from datetime import datetime, timezone

from fastapi import APIRouter

from app import __version__

router = APIRouter(tags=["health"])


@router.get("/api/health/ingestion")
async def health_ingestion() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "nuvola-atlas-ingestion",
        "version": __version__,
        "checked_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

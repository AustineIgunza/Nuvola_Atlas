"""X-Internal-Secret dependency shared by every write endpoint.

Daystar → FastAPI → Laravel is a fully internal path. The X-Internal-Secret
header is the shared bearer between the FastAPI ingestion service and the
Laravel intake routes. Every write endpoint must depend on this guard.
"""
from __future__ import annotations

import hmac

from fastapi import Header, HTTPException, status

from app.config import get_settings


async def require_internal_secret(x_internal_secret: str = Header(default="")) -> None:
    expected = get_settings().internal_secret
    if not x_internal_secret or not hmac.compare_digest(x_internal_secret, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid X-Internal-Secret header",
        )

"""X-Internal-Secret dependency shared by every write endpoint.

Two hops carry ingestion traffic and they are not equally trusted:

* Daystar -> FastAPI is a third-party hop over public HTTPS. Daystar posts
  a shared bearer token in ``X-Internal-Secret`` and nothing more; we
  cannot require a university partner to implement request signing for the
  pilot.
* FastAPI -> Laravel is entirely ours, so it additionally carries an
  HMAC-SHA256 signature (see ``app.signing`` and
  ``docs/data/internal-transport.md``).

This module guards the first hop. Never log the raw header -- log the
redacted fingerprint instead.
"""
from __future__ import annotations

import hmac
import logging

from fastapi import Header, HTTPException, status

from app.config import get_settings
from app.signing import fingerprint

logger = logging.getLogger(__name__)


async def require_internal_secret(x_internal_secret: str = Header(default="")) -> None:
    expected = get_settings().internal_secret
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ingestion secret is not configured on this deployment.",
        )

    if not x_internal_secret or not hmac.compare_digest(x_internal_secret, expected):
        logger.warning(
            "rejected ingest: X-Internal-Secret mismatch (presented=%s)",
            fingerprint(x_internal_secret),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Internal-Secret header.",
        )

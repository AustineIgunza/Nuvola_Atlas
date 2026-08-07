"""HMAC-SHA256 request signing for the FastAPI -> Laravel hop.

The shared ``X-Internal-Secret`` header proves the caller knows the secret.
It does not prove the body arrived unmodified, and it replays forever if it
leaks from a proxy log. Signing closes both gaps: the signature covers the
exact bytes on the wire, and the timestamp bounds how long a captured
request stays usable.

Canonical signing string is ``{timestamp}.{raw_body}`` -- the timestamp is
inside the MAC so it cannot be rewritten to extend the replay window.
"""
from __future__ import annotations

import hashlib
import hmac
import time

SIGNATURE_PREFIX = "sha256="

# Tolerated drift between the Vercel ingestion runtime and the Forge
# droplet's clock. Wide enough that NTP jitter never causes a false 401,
# narrow enough that a captured request is stale within minutes.
MAX_CLOCK_SKEW_SECONDS = 300


def signing_string(timestamp: int, body: bytes) -> bytes:
    return f"{timestamp}.".encode() + body


def sign(secret: str, body: bytes, timestamp: int | None = None) -> tuple[int, str]:
    """Return ``(timestamp, signature)`` for a request body."""
    ts = int(time.time()) if timestamp is None else timestamp
    digest = hmac.new(secret.encode(), signing_string(ts, body), hashlib.sha256).hexdigest()
    return ts, SIGNATURE_PREFIX + digest


def verify(
    secret: str,
    body: bytes,
    timestamp: str,
    signature: str,
    *,
    now: int | None = None,
) -> bool:
    try:
        ts = int(timestamp)
    except (TypeError, ValueError):
        return False

    current = int(time.time()) if now is None else now
    if abs(current - ts) > MAX_CLOCK_SKEW_SECONDS:
        return False

    _, expected = sign(secret, body, ts)
    return hmac.compare_digest(expected, signature)


def fingerprint(value: str) -> str:
    """Redacted identifier safe to write to logs -- never log a raw secret."""
    if not value:
        return "sha256:empty"
    return "sha256:" + hashlib.sha256(value.encode()).hexdigest()[:12]

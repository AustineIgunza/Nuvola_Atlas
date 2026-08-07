"""Payload-hash deduplication for replayed batches.

Two things replay batches: the forwarder's own retry budget, and Vercel Cron
double-firing a tick. Neither should double-count a row against the daily
budget or produce a second write downstream. Keying on a SHA-256 of the raw
body means we do not have to trust the caller to send a stable batch_id.

Per-process and TTL-bounded, same tradeoff as ``app.guards``: a fast local
brake, not a distributed lock. The durable guarantee is Laravel's
``data_ingestion_logs`` table.
"""
from __future__ import annotations

import hashlib
import time
from typing import Any

# A cron that fires hourly and a retry budget that spans ~21s both fit
# comfortably inside this window.
TTL_SECONDS = 3600
MAX_ENTRIES = 512

_seen: dict[str, tuple[float, dict[str, Any]]] = {}


def payload_hash(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def lookup(digest: str) -> dict[str, Any] | None:
    _evict()
    entry = _seen.get(digest)
    return None if entry is None else entry[1]


def remember(digest: str, receipt: dict[str, Any]) -> None:
    _evict()
    if len(_seen) >= MAX_ENTRIES:
        oldest = min(_seen, key=lambda k: _seen[k][0])
        del _seen[oldest]
    _seen[digest] = (time.monotonic(), receipt)


def reset() -> None:
    _seen.clear()


def _evict() -> None:
    cutoff = time.monotonic() - TTL_SECONDS
    for digest in [k for k, (seen_at, _) in _seen.items() if seen_at < cutoff]:
        del _seen[digest]

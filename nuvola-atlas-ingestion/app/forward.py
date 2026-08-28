"""Forwarder that ships cleaned pillar readings to the Laravel /ingest
endpoint.

Batches are grouped by zone_id before forwarding so each Laravel-side
insert lands as a single per-zone atomic write. Every request carries the
shared ``X-Internal-Secret`` plus an HMAC-SHA256 signature over the exact
body bytes -- see ``app.signing`` for the construction.

Failures are collected and returned rather than raised -- the caller
decides whether to dead-letter. The FastAPI service is not the system of
record; the receipts it stores must reflect what Laravel actually
accepted, not what we hoped it would accept.
"""
from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings
from app.models.readings import PillarReading, WasrebReading
from app.signing import sign

# All WASREB indicators report on water & sanitation — the regulator has
# no other beat. Hardcoding here means the WASREB route stays simple; if
# a future regulator ships adjacent indicators, this becomes a mapping.
WASREB_PILLAR_KEY = "water_sanitation"

# One initial send plus three retries. Backoff is stepped rather than
# doubled so a Laravel deploy (which takes tens of seconds) still lands
# inside the retry window without us hammering it during the restart.
RETRY_BACKOFF_SECONDS = (1.0, 4.0, 16.0)

# A 4xx other than these means the payload itself is wrong; retrying sends
# the same bad bytes again and burns budget for nothing.
RETRYABLE_STATUS = frozenset({408, 425, 429, 500, 502, 503, 504})


@dataclass
class ForwardResult:
    zone_id: str
    ok: bool
    status_code: int
    body: dict[str, Any]
    attempts: int = 1


def _group_by_zone(rows: list[PillarReading]) -> dict[str, dict[str, float | None]]:
    grouped: dict[str, dict[str, float | None]] = {}
    for row in rows:
        bucket = grouped.setdefault(row.zone_id, {})
        bucket[row.pillar] = row.value
    return grouped


def build_signed_headers(secret: str, body: bytes) -> dict[str, str]:
    timestamp, signature = sign(secret, body)
    return {
        "X-Internal-Secret": secret,
        "X-Internal-Timestamp": str(timestamp),
        "X-Internal-Signature": signature,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def _post_with_retries(
    client: httpx.AsyncClient,
    endpoint: str,
    secret: str,
    body: bytes,
    zone_id: str,
    *,
    sleep: Any = asyncio.sleep,
) -> ForwardResult:
    last: ForwardResult | None = None

    for attempt in range(len(RETRY_BACKOFF_SECONDS) + 1):
        # Re-sign per attempt: the timestamp is inside the MAC, so a
        # signature minted before a 16s backoff would be closer to the
        # skew ceiling than it needs to be.
        headers = build_signed_headers(secret, body)
        try:
            response = await client.post(endpoint, headers=headers, content=body)
            last = ForwardResult(
                zone_id=zone_id,
                ok=200 <= response.status_code < 300,
                status_code=response.status_code,
                body=_safe_json(response),
                attempts=attempt + 1,
            )
            if last.ok or response.status_code not in RETRYABLE_STATUS:
                return last
        except httpx.HTTPError as exc:
            last = ForwardResult(
                zone_id=zone_id,
                ok=False,
                status_code=0,
                body={"error": str(exc)},
                attempts=attempt + 1,
            )

        if attempt < len(RETRY_BACKOFF_SECONDS):
            await sleep(RETRY_BACKOFF_SECONDS[attempt])

    assert last is not None
    return last


async def forward_batch(
    rows: list[PillarReading],
    settings: Settings,
    *,
    source: str = "fastapi.daystar",
    client: httpx.AsyncClient | None = None,
    sleep: Any = asyncio.sleep,
) -> list[ForwardResult]:
    if not rows:
        return []

    payloads = _group_by_zone(rows)
    endpoint = f"{settings.laravel_base_url.rstrip('/')}/ingest"

    close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=15.0)
        close_client = True

    results: list[ForwardResult] = []
    try:
        for zone_id, pillars in payloads.items():
            body = json.dumps(
                {"source": source, "zone_id": zone_id, "pillars": pillars},
                separators=(",", ":"),
                sort_keys=True,
            ).encode()
            results.append(
                await _post_with_retries(
                    client, endpoint, settings.internal_secret, body, zone_id, sleep=sleep
                )
            )
    finally:
        if close_client:
            await client.aclose()

    return results


async def forward_county_context(
    batch_id: str,
    rows: list[WasrebReading],
    settings: Settings,
    *,
    client: httpx.AsyncClient | None = None,
    sleep: Any = asyncio.sleep,
) -> ForwardResult:
    """POST county/utility readings to the Laravel intake endpoint.

    Unlike ``forward_batch``, this ships the whole batch in one request
    (the intake upserts by (county, indicator_key, vintage) so idempotency
    is on the receiver, not on the wire).
    """
    if not rows:
        return ForwardResult(zone_id="", ok=True, status_code=204, body={"written": 0})

    endpoint = f"{settings.laravel_base_url.rstrip('/')}/internal/county-context"
    payload = {
        "batch_id": batch_id,
        "rows": [
            {
                "county": r.county,
                "pillar_key": WASREB_PILLAR_KEY,
                "indicator_key": r.indicator,
                "value": r.value,
                "unit": r.unit,
                "granularity": r.granularity,
                "method": r.method,
                "source_id": r.source_id,
                "vintage": r.vintage,
                "retrieved": r.retrieved.isoformat(),
                "extraction_confidence": r.extraction_confidence,
                "page_ref": r.page_ref,
                "notes": r.notes,
            }
            for r in rows
        ],
    }
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()

    close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=15.0)
        close_client = True

    try:
        # `zone_id` is used only for logging on the retry helper; a WASREB
        # batch has no single zone, so a synthetic key identifies the run.
        return await _post_with_retries(
            client, endpoint, settings.internal_secret, body,
            zone_id=f"county-context:{batch_id}", sleep=sleep,
        )
    finally:
        if close_client:
            await client.aclose()


def _safe_json(response: httpx.Response) -> dict[str, Any]:
    # Deliberately broad: an upstream 502 from a proxy is usually an HTML
    # error page, and the receipt is more useful with the first 2KB of that
    # page in it than with a decode traceback replacing the whole result.
    try:
        parsed = response.json()
        if isinstance(parsed, dict):
            return parsed
        return {"data": parsed}
    except Exception:
        return {"text": response.text[:2000]}

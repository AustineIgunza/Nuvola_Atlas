"""Forwarder that ships cleaned indicator readings to the Laravel /ingest
endpoint.

Batches are grouped by zone_id before forwarding so each Laravel-side
insert lands as a single per-zone atomic write. The Laravel endpoint's
X-Internal-Secret guard uses the same shared secret defined in
`INGESTION_INTERNAL_SECRET` / Laravel `INGEST_INTERNAL_SECRET`.

Failures are collected and returned rather than raised — the caller
decides whether to retry or dead-letter. The FastAPI service is not the
system of record; the receipts it stores must reflect what Laravel
actually accepted, not what we hoped it would accept.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings
from app.models.indicators import IndicatorReading


@dataclass
class ForwardResult:
    zone_id: str
    ok: bool
    status_code: int
    body: dict[str, Any]


def _group_by_zone(rows: list[IndicatorReading]) -> dict[str, dict[str, float | None]]:
    grouped: dict[str, dict[str, float | None]] = {}
    for row in rows:
        bucket = grouped.setdefault(row.zone_id, {})
        bucket[row.indicator.value] = row.value
    return grouped


async def forward_batch(
    rows: list[IndicatorReading],
    settings: Settings,
    *,
    source: str = "fastapi.daystar",
    client: httpx.AsyncClient | None = None,
) -> list[ForwardResult]:
    if not rows:
        return []

    payloads = _group_by_zone(rows)
    headers = {
        "X-Internal-Secret": settings.internal_secret,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    endpoint = f"{settings.laravel_base_url.rstrip('/')}/ingest"

    close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=15.0)
        close_client = True

    results: list[ForwardResult] = []
    try:
        for zone_id, indicators in payloads.items():
            body = {
                "source": source,
                "zone_id": zone_id,
                "indicators": indicators,
            }
            try:
                response = await client.post(endpoint, headers=headers, json=body)
                results.append(
                    ForwardResult(
                        zone_id=zone_id,
                        ok=200 <= response.status_code < 300,
                        status_code=response.status_code,
                        body=_safe_json(response),
                    )
                )
            except httpx.HTTPError as exc:
                results.append(
                    ForwardResult(
                        zone_id=zone_id,
                        ok=False,
                        status_code=0,
                        body={"error": str(exc)},
                    )
                )
    finally:
        if close_client:
            await client.aclose()

    return results


def _safe_json(response: httpx.Response) -> dict[str, Any]:
    try:
        parsed = response.json()
        if isinstance(parsed, dict):
            return parsed
        return {"data": parsed}
    except Exception:  # noqa: BLE001 — defensive; any parse error returns raw text
        return {"text": response.text[:2000]}

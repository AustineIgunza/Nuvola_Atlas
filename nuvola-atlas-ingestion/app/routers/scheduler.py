"""Cron entrypoint — pulls the Daystar feed instead of waiting for a push.

Daystar publishes a drop; they do not call us. Vercel Cron (see
``vercel.json``) hits this endpoint on a schedule, we fetch whatever is at
``INGESTION_DAYSTAR_FEED_BASE``, and push it through the same clean →
detect → forward pipeline the push endpoint uses.

Vercel Cron gives at-least-once delivery, so a tick can fire twice for the
same drop. The payload hash makes the second one a no-op.
"""
from __future__ import annotations

import hmac
import logging
from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import ValidationError

from app.config import get_settings
from app.forward import forward_batch
from app.guards import get_guards
from app.idempotency import lookup, payload_hash, remember
from app.models.readings import ReadingBatch
from app.quality.clean import clean_batch
from app.security import require_internal_secret
from app.signing import fingerprint

logger = logging.getLogger(__name__)

router = APIRouter(tags=["scheduler"])

FEED_TIMEOUT_SECONDS = 30.0


async def require_cron_secret(authorization: str = Header(default="")) -> None:
    """Guard for the Vercel Cron entrypoint.

    Vercel calls cron paths with `Authorization: Bearer $CRON_SECRET`. It
    cannot set a custom header, so this path uses its own credential rather
    than the internal transport secret — and it is GET-only, read-triggered,
    and does nothing a replay could not already do.
    """
    expected = get_settings().cron_secret
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CRON_SECRET is not configured on this deployment.",
        )

    presented = authorization.removeprefix("Bearer ").strip()
    if not presented or not hmac.compare_digest(presented, expected):
        logger.warning("rejected cron tick: bad bearer (%s)", fingerprint(presented))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing cron credentials.",
        )


@router.get(
    "/api/cron/tick",
    dependencies=[Depends(require_cron_secret)],
    summary="Vercel Cron entrypoint — same work as the internal tick",
)
async def cron_tick() -> dict[str, object]:
    return await _run_tick()


@router.post(
    "/internal/scheduler/tick",
    dependencies=[Depends(require_internal_secret)],
    summary="Cron tick — pull and ingest the current Daystar drop",
)
async def tick() -> dict[str, object]:
    return await _run_tick()


async def _run_tick() -> dict[str, object]:
    settings = get_settings()
    guards = get_guards()
    now = datetime.now(UTC).isoformat().replace("+00:00", "Z")

    if not settings.daystar_feed_base:
        # Phase B is blocked on Daystar delivering a feed URL. Until then a
        # tick is a healthy no-op, not an error — cron should stay green.
        return {"status": "skipped", "reason": "no feed configured", "ticked_at": now}

    guards.check_circuit(settings)

    url = f"{settings.daystar_feed_base.rstrip('/')}/latest.json"
    async with httpx.AsyncClient(timeout=FEED_TIMEOUT_SECONDS) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            return {
                "status": "failed",
                "reason": f"feed unreachable: {exc}",
                "ticked_at": now,
            }
        raw = response.content

    digest = payload_hash(raw)
    replayed = lookup(digest)
    if replayed is not None:
        return {**replayed, "status": "duplicate", "ticked_at": now}

    try:
        batch = ReadingBatch.model_validate_json(raw)
    except ValidationError as exc:
        return {
            "status": "failed",
            "reason": "feed did not match the batch schema",
            "errors": exc.error_count(),
            "ticked_at": now,
        }

    guards.check_row_count(len(batch.readings), settings)
    guards.check_budget(len(batch.readings), settings)

    cleaning = clean_batch([r.model_dump(mode="json") for r in batch.readings])
    forwarded = await forward_batch(cleaning.cleaned, settings, source="cron.daystar")

    for result in forwarded:
        guards.record_forward_outcome(
            ok=result.ok, status_code=result.status_code, settings=settings
        )
    guards.consume_budget(len(cleaning.cleaned))

    receipt: dict[str, object] = {
        "status": "ingested",
        "batch_id": batch.batch_id,
        "payload_hash": digest,
        "accepted": len(cleaning.cleaned),
        "rejected": len(cleaning.rejected),
        "forwarded": [
            {"zone_id": f.zone_id, "ok": f.ok, "status_code": f.status_code, "attempts": f.attempts}
            for f in forwarded
        ],
        "ticked_at": now,
    }

    remember(digest, receipt)
    return receipt

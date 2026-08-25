"""Reading ingest endpoint — the front door for field batches.

Cleans the batch, runs anomaly detection, forwards the accepted rows to
the Laravel intake endpoint, and returns a receipt describing what was
accepted, rejected, forwarded, or flagged as anomalous.

Order of operations matters: the idempotency check fires before the guards
consume budget, so a replayed batch costs nothing.
"""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request

from app.config import get_settings
from app.guards import enforce_payload_size, get_guards
from app.idempotency import lookup, payload_hash, remember
from app.models.readings import ReadingBatch, WasrebBatch
from app.security import require_internal_secret
from app.services.anomaly_detector import Anomaly, detect_anomalies
from app.services.data_cleaner import clean_batch
from app.services.laravel_forwarder import forward_batch, forward_county_context

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.post(
    "/readings",
    dependencies=[Depends(require_internal_secret), Depends(enforce_payload_size)],
    summary="Accept a batch of pillar readings",
)
async def ingest_readings(batch: ReadingBatch, request: Request) -> dict[str, object]:
    settings = get_settings()
    guards = get_guards()

    digest = payload_hash(await request.body())
    replayed = lookup(digest)
    if replayed is not None:
        return {**replayed, "duplicate": True}

    guards.check_circuit(settings)
    guards.check_row_count(len(batch.readings), settings)
    guards.check_budget(len(batch.readings), settings)

    raw_rows = [r.model_dump(mode="json") for r in batch.readings]
    cleaning = clean_batch(raw_rows)

    # v0 has no persisted history, so anomaly detection short-circuits to
    # an empty result. The Phase B follow-up hydrates ``history`` from the
    # Laravel side before passing readings through.
    anomalies: list[Anomaly] = detect_anomalies(
        cleaning.cleaned,
        history={},
        z_threshold=settings.anomaly_z_threshold,
    )

    # Anomalies do not block the forward — the Laravel side stamps
    # `data_ingestion_logs.error` with an ignore-list when it rejects
    # individual rows, and the calculator excludes nulls from averages.
    # Bad rows get quarantined by rejection, not forwarding suppression.
    forwarded = await forward_batch(cleaning.cleaned, settings)

    for result in forwarded:
        guards.record_forward_outcome(
            ok=result.ok, status_code=result.status_code, settings=settings
        )
    guards.consume_budget(len(cleaning.cleaned))

    receipt: dict[str, object] = {
        "batch_id": batch.batch_id,
        "payload_hash": digest,
        "received_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "accepted": len(cleaning.cleaned),
        "rejected": len(cleaning.rejected),
        "forwarded": [
            {
                "zone_id": f.zone_id,
                "ok": f.ok,
                "status_code": f.status_code,
                "attempts": f.attempts,
            }
            for f in forwarded
        ],
        "anomalies": [
            {
                "zone_id": a.zone_id,
                "pillar": a.pillar,
                "value": a.value,
                "z_score": round(a.z_score, 3),
                "reason": a.reason,
            }
            for a in anomalies
        ],
        "rejections": cleaning.rejected,
    }

    remember(digest, receipt)
    return receipt


@router.post(
    "/wasreb",
    dependencies=[Depends(require_internal_secret), Depends(enforce_payload_size)],
    summary="Accept a batch of WASREB IMPACT county/utility readings",
)
async def ingest_wasreb(batch: WasrebBatch, request: Request) -> dict[str, object]:
    """Front door for the WASREB IMPACT dataset.

    Rows are Pydantic-validated (envelope invariants + plausibility bounds)
    before this handler is called; anything reaching here is safe to
    forward. The whole batch ships to Laravel in one request — the intake
    upserts by (county, indicator_key, vintage), so a replay of the same
    batch updates in place rather than duplicating.
    """
    settings = get_settings()
    guards = get_guards()

    digest = payload_hash(await request.body())
    replayed = lookup(digest)
    if replayed is not None:
        return {**replayed, "duplicate": True}

    guards.check_circuit(settings)
    guards.check_row_count(len(batch.readings), settings)
    guards.check_budget(len(batch.readings), settings)

    low_confidence = [
        {"utility": r.utility_name, "indicator": r.indicator}
        for r in batch.readings
        if r.extraction_confidence == "low"
    ]

    forwarded = await forward_county_context(batch.batch_id, list(batch.readings), settings)

    guards.record_forward_outcome(
        ok=forwarded.ok, status_code=forwarded.status_code, settings=settings
    )
    guards.consume_budget(len(batch.readings))

    receipt: dict[str, object] = {
        "batch_id": batch.batch_id,
        "payload_hash": digest,
        "received_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "accepted": len(batch.readings),
        # Rows named here are stored by the backend but a public consumer
        # should filter them out — parser confidence is not measurement
        # confidence, and P9 §Task 2 asks that low-confidence rows land
        # visibly rather than silently.
        "low_confidence": low_confidence,
        "forwarded": {
            "ok": forwarded.ok,
            "status_code": forwarded.status_code,
            "attempts": forwarded.attempts,
        },
    }

    remember(digest, receipt)
    return receipt

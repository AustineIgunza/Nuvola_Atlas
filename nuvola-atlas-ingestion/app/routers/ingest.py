"""Indicator ingest endpoint — the front door for Daystar batches.

Cleans the batch, runs anomaly detection, forwards the accepted rows to
the Laravel intake endpoint, and returns a receipt describing what was
accepted, rejected, forwarded, or flagged as anomalous.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.models.indicators import IndicatorBatch
from app.security import require_internal_secret
from app.services.anomaly_detector import Anomaly, detect_anomalies
from app.services.data_cleaner import clean_batch
from app.services.laravel_forwarder import forward_batch

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.post(
    "/indicators",
    dependencies=[Depends(require_internal_secret)],
    summary="Accept a Daystar indicator batch",
)
async def ingest_indicators(batch: IndicatorBatch) -> dict[str, object]:
    settings = get_settings()
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

    return {
        "batch_id": batch.batch_id,
        "received_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "accepted": len(cleaning.cleaned),
        "rejected": len(cleaning.rejected),
        "forwarded": [
            {
                "zone_id": f.zone_id,
                "ok": f.ok,
                "status_code": f.status_code,
            }
            for f in forwarded
        ],
        "anomalies": [
            {
                "zone_id": a.zone_id,
                "indicator": a.indicator,
                "value": a.value,
                "z_score": round(a.z_score, 3),
                "reason": a.reason,
            }
            for a in anomalies
        ],
        "rejections": cleaning.rejected,
    }

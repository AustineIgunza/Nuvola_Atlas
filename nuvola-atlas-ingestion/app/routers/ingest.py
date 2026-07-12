"""Indicator ingest endpoint — the front door for Daystar batches.

The endpoint cleans the batch, runs anomaly detection, and returns a
receipt describing the accepted/rejected/anomalous rows. A separate
forwarder (Phase B) will pass the accepted rows to the Laravel intake
route once the internal contract is finalised.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.models.indicators import IndicatorBatch
from app.security import require_internal_secret
from app.services.anomaly_detector import Anomaly, detect_anomalies
from app.services.data_cleaner import clean_batch

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

    # v0 has no persisted history, so we short-circuit anomaly detection to
    # an empty result. The Phase B forwarder will hydrate ``history`` from
    # the Laravel side before passing readings through.
    anomalies: list[Anomaly] = detect_anomalies(
        cleaning.cleaned,
        history={},
        z_threshold=settings.anomaly_z_threshold,
    )

    return {
        "batch_id": batch.batch_id,
        "received_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "accepted": len(cleaning.cleaned),
        "rejected": len(cleaning.rejected),
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

"""Anomaly detector — spikes and out-of-range values.

The v0 detector is a plain rolling z-score per (zone, pillar), without
pulling TensorFlow/PyTorch into the boot path — those come later once we
have real historical volume to train against.
"""
from __future__ import annotations

import math
import statistics
from collections.abc import Iterable
from dataclasses import dataclass

from app.models.readings import PillarReading


@dataclass
class Anomaly:
    zone_id: str
    pillar: str
    value: float
    z_score: float
    reason: str


def detect_anomalies(
    readings: Iterable[PillarReading],
    history: dict[tuple[str, str], list[float]],
    z_threshold: float = 3.5,
) -> list[Anomaly]:
    """Flag readings whose z-score against the zone-pillar history exceeds the threshold.

    ``history`` maps (zone_id, pillar_key) -> list of previous values.
    Zones with fewer than 3 historical points are skipped (too little
    signal to trigger).
    """
    anomalies: list[Anomaly] = []
    for r in readings:
        key = (r.zone_id, r.pillar)
        past = history.get(key, [])
        if len(past) < 3:
            continue
        mean = statistics.fmean(past)
        stdev = statistics.pstdev(past)
        if stdev == 0 or math.isnan(stdev):
            continue
        z = (r.value - mean) / stdev
        if abs(z) >= z_threshold:
            anomalies.append(
                Anomaly(
                    zone_id=r.zone_id,
                    pillar=r.pillar,
                    value=r.value,
                    z_score=z,
                    reason=(
                        f"|z|={abs(z):.2f} exceeds threshold {z_threshold} "
                        f"(mean={mean:.2f}, stdev={stdev:.2f})"
                    ),
                )
            )
    return anomalies

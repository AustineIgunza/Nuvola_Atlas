"""Anomaly detector — spikes and out-of-range values.

The v0 detector is a plain rolling z-score per (zone, indicator). This
covers the "massive errors" case in PHASES.md Phase B without pulling
TensorFlow/PyTorch into the boot path — those come later once we have
real historical volume to train against.
"""
from __future__ import annotations

import math
import statistics
from dataclasses import dataclass
from typing import Iterable

from app.models.indicators import IndicatorReading


@dataclass
class Anomaly:
    zone_id: str
    indicator: str
    value: float
    z_score: float
    reason: str


def detect_anomalies(
    readings: Iterable[IndicatorReading],
    history: dict[tuple[str, str], list[float]],
    z_threshold: float = 3.5,
) -> list[Anomaly]:
    """Flag readings whose z-score against the zone-indicator history exceeds the threshold.

    ``history`` maps (zone_id, indicator_key) -> list of previous values.
    Zones with fewer than 3 historical points are skipped (too little
    signal to trigger).
    """
    anomalies: list[Anomaly] = []
    for r in readings:
        key = (r.zone_id, r.indicator.value)
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
                    indicator=r.indicator.value,
                    value=r.value,
                    z_score=z,
                    reason=(
                        f"|z|={abs(z):.2f} exceeds threshold {z_threshold} "
                        f"(mean={mean:.2f}, stdev={stdev:.2f})"
                    ),
                )
            )
    return anomalies

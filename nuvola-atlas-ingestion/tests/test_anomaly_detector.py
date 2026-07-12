from datetime import datetime, timezone

from app.models.indicators import IndicatorKey, IndicatorReading
from app.services.anomaly_detector import detect_anomalies


def _reading(zone: str, key: IndicatorKey, value: float) -> IndicatorReading:
    return IndicatorReading(
        zone_id=zone,
        indicator=key,
        value=value,
        unit="index",
        observed_at=datetime(2026, 7, 8, tzinfo=timezone.utc),
    )


def test_flags_spike_above_threshold() -> None:
    history = {("westlands", "road_quality"): [70.0, 71.5, 72.1, 70.8, 71.2]}
    reading = _reading("westlands", IndicatorKey.road_quality, 5.0)
    anomalies = detect_anomalies([reading], history=history, z_threshold=3.5)
    assert len(anomalies) == 1
    assert anomalies[0].zone_id == "westlands"
    assert anomalies[0].z_score < -3.5


def test_ignores_reading_within_range() -> None:
    history = {("westlands", "road_quality"): [70.0, 71.5, 72.1, 70.8, 71.2]}
    reading = _reading("westlands", IndicatorKey.road_quality, 71.0)
    assert detect_anomalies([reading], history=history, z_threshold=3.5) == []


def test_skips_when_history_too_short() -> None:
    history = {("westlands", "road_quality"): [70.0]}
    reading = _reading("westlands", IndicatorKey.road_quality, 1000.0)
    assert detect_anomalies([reading], history=history, z_threshold=3.5) == []

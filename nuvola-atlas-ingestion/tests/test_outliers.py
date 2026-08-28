from datetime import UTC, datetime

from app.models.readings import PillarReading
from app.quality.outliers import detect_anomalies

HISTORY = {("westlands", "road_density"): [70.0, 71.5, 72.1, 70.8, 71.2]}


def _reading(zone: str, pillar: str, value: float) -> PillarReading:
    return PillarReading(
        zone_id=zone,
        pillar=pillar,
        value=value,
        unit="index",
        observed_at=datetime(2026, 7, 8, tzinfo=UTC),
        source="hot_osm_roads",
    )


def test_flags_spike_above_threshold() -> None:
    reading = _reading("westlands", "road_density", 5.0)
    anomalies = detect_anomalies([reading], history=HISTORY, z_threshold=3.5)
    assert len(anomalies) == 1
    assert anomalies[0].zone_id == "westlands"
    assert anomalies[0].pillar == "road_density"
    assert anomalies[0].z_score < -3.5


def test_ignores_reading_within_range() -> None:
    reading = _reading("westlands", "road_density", 71.0)
    assert detect_anomalies([reading], history=HISTORY, z_threshold=3.5) == []


def test_skips_when_history_too_short() -> None:
    history = {("westlands", "road_density"): [70.0]}
    reading = _reading("westlands", "road_density", 1000.0)
    assert detect_anomalies([reading], history=history, z_threshold=3.5) == []

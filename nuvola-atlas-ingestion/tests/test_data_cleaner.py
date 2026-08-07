from datetime import UTC

from app.services.data_cleaner import clean_batch


def test_cleans_valid_row_to_utc() -> None:
    result = clean_batch(
        [
            {
                "zone_id": "westlands",
                "indicator": "healthcare_access",
                "value": 72.4,
                "unit": "index",
                "observed_at": "2026-07-08T09:15:00+03:00",
            }
        ]
    )
    assert len(result.cleaned) == 1
    reading = result.cleaned[0]
    assert reading.observed_at.tzinfo == UTC
    assert reading.observed_at.hour == 6  # +03:00 → UTC
    assert not result.rejected


def test_rejects_unknown_indicator() -> None:
    result = clean_batch(
        [
            {
                "zone_id": "westlands",
                "indicator": "nonsense_metric",
                "value": 10,
                "observed_at": "2026-07-08T09:00:00Z",
            }
        ]
    )
    assert not result.cleaned
    assert result.rejected[0]["_reject_reason"].startswith("unknown indicator")


def test_rejects_missing_zone() -> None:
    result = clean_batch(
        [
            {
                "indicator": "road_quality",
                "value": 55,
                "observed_at": "2026-07-08T09:00:00Z",
            }
        ]
    )
    assert not result.cleaned
    assert result.rejected[0]["_reject_reason"] == "missing zone_id"


def test_rejects_bad_timestamp() -> None:
    result = clean_batch(
        [
            {
                "zone_id": "kibra",
                "indicator": "waste_management",
                "value": 30,
                "observed_at": "not-a-date",
            }
        ]
    )
    assert not result.cleaned
    assert "observed_at" in result.rejected[0]["_reject_reason"]

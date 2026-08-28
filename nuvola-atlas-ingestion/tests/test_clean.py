from datetime import UTC

from app.quality.clean import clean_batch


def row(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "zone_id": "westlands",
        "pillar": "water_sanitation",
        "value": 72.4,
        "unit": "index",
        "observed_at": "2026-07-08T09:15:00+03:00",
        "source": "knbs_census_2019",
    }
    base.update(overrides)
    return base


def test_cleans_valid_row_to_utc() -> None:
    result = clean_batch([row()])
    assert len(result.cleaned) == 1
    reading = result.cleaned[0]
    assert reading.observed_at.tzinfo == UTC
    assert reading.observed_at.hour == 6  # +03:00 → UTC
    assert reading.pillar == "water_sanitation"
    assert not result.rejected


def test_rejects_unknown_pillar() -> None:
    result = clean_batch([row(pillar="nonsense_metric")])
    assert not result.cleaned
    assert result.rejected[0]["_reject_reason"].startswith("unknown pillar")


def test_rejects_a_switched_off_pillar() -> None:
    result = clean_batch([row(pillar="safety")])
    assert not result.cleaned
    assert result.rejected[0]["_reject_reason"].startswith("switched-off pillar")


def test_rejects_missing_zone() -> None:
    result = clean_batch([row(zone_id="")])
    assert not result.cleaned
    assert result.rejected[0]["_reject_reason"] == "missing zone_id"


def test_rejects_bad_timestamp() -> None:
    result = clean_batch([row(observed_at="not-a-date")])
    assert not result.cleaned
    assert "observed_at" in result.rejected[0]["_reject_reason"]


def test_rejects_a_row_with_no_source() -> None:
    result = clean_batch([row(source="")])
    assert not result.cleaned
    assert result.rejected[0]["_reject_reason"] == "missing source"

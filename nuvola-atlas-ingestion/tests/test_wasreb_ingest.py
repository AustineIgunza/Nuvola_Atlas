"""P9 §Task 2 — /api/ingest/wasreb schema + route behaviour."""
from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app import guards as guards_module
from app import idempotency
from app.config import get_settings
from app.forward import ForwardResult
from app.main import create_app
from app.models.readings import (
    WASREB_INDICATOR_BOUNDS,
    WasrebBatch,
    WasrebReading,
)

SECRET = "test-internal-secret-value-that-is-long-enough-000"
URL = "/api/ingest/wasreb"


def _row(**over: Any) -> dict[str, Any]:
    base = {
        "county": "Nairobi",
        "utility_name": "Nairobi City Water & Sewerage Co.",
        "size_category": "Very Large",
        "indicator": "non_revenue_water",
        "value": 48.0,
        "unit": "%",
        "granularity": "utility",
        "method": "measured",
        "source_id": "wasreb_impact_17",
        "report_issue": 17,
        "vintage": "FY2023/24",
        "extraction_confidence": "high",
        "attribution": "WASREB IMPACT 17",
        "retrieved": "2026-08-24",
    }
    base.update(over)
    return base


def _batch(rows: int = 1, **over: Any) -> dict[str, Any]:
    return {
        "batch_id": f"wasreb-batch-{rows}",
        "submitted_at": "2026-08-25T00:00:00Z",
        "readings": [_row(**over) for _ in range(rows)],
    }


# --- Pydantic schema ------------------------------------------------------


def test_valid_row_round_trips():
    r = WasrebReading(**_row())
    assert r.indicator == "non_revenue_water"
    assert r.value == 48.0


def test_gap_with_value_is_rejected():
    with pytest.raises(ValidationError, match="R1 breach"):
        WasrebReading(**_row(method="gap", value=0.0))


def test_gap_with_null_value_is_accepted():
    r = WasrebReading(**_row(method="gap", value=None, source_id=None, vintage=None))
    assert r.value is None
    assert r.method == "gap"


def test_non_gap_without_source_is_rejected():
    with pytest.raises(ValidationError, match="source_id"):
        WasrebReading(**_row(source_id=None))


def test_non_gap_without_vintage_is_rejected():
    with pytest.raises(ValidationError, match="vintage"):
        WasrebReading(**_row(vintage=None))


def test_percentage_out_of_range_is_rejected():
    with pytest.raises(ValidationError, match="out of plausible range"):
        WasrebReading(**_row(indicator="non_revenue_water", value=150.0))


def test_hours_of_supply_over_24_is_rejected():
    with pytest.raises(ValidationError, match="out of plausible range"):
        WasrebReading(**_row(indicator="hours_of_supply", value=30.0, unit="hrs/day"))


def test_unknown_indicator_is_rejected():
    # Literal typing catches this — Pydantic reports "input should be one of…"
    with pytest.raises(ValidationError):
        WasrebReading(**_row(indicator="made_up_metric"))


def test_subcounty_granularity_is_rejected():
    with pytest.raises(ValidationError):
        WasrebReading(**_row(granularity="subcounty"))


def test_bounds_dict_covers_every_indicator_literal():
    # The Literal and the bounds dict are two hand-maintained lists. This
    # keeps them from drifting apart — an addition to one must land on the
    # other in the same slice.
    from typing import get_args

    literal_keys = set(get_args(WasrebReading.model_fields["indicator"].annotation))
    assert literal_keys == set(WASREB_INDICATOR_BOUNDS.keys())


def test_batch_requires_at_least_one_row():
    with pytest.raises(ValidationError):
        WasrebBatch(batch_id="empty", submitted_at="2026-08-25T00:00:00Z", readings=[])


# --- Route behaviour ------------------------------------------------------


@pytest.fixture
def make_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[Any]:
    async def fake_forward(batch_id: str, rows: Any, settings: Any, **kw: Any) -> ForwardResult:
        return ForwardResult(
            zone_id=f"county-context:{batch_id}",
            ok=True,
            status_code=200,
            body={"written": len(rows)},
        )

    def build(**env: str) -> TestClient:
        monkeypatch.setenv("INGESTION_INTERNAL_SECRET", SECRET)
        for key, value in env.items():
            monkeypatch.setenv(f"INGESTION_{key.upper()}", value)
        get_settings.cache_clear()
        guards_module.get_guards().reset()
        idempotency.reset()
        monkeypatch.setattr(
            "app.routers.ingest.forward_county_context", fake_forward
        )
        return TestClient(create_app())

    yield build
    get_settings.cache_clear()
    guards_module.get_guards().reset()
    idempotency.reset()


def test_route_rejects_missing_secret(make_client: Any) -> None:
    client = make_client()
    r = client.post(URL, json=_batch())
    assert r.status_code == 401


def test_route_accepts_valid_batch(make_client: Any) -> None:
    client = make_client()
    r = client.post(URL, json=_batch(2), headers={"X-Internal-Secret": SECRET})
    assert r.status_code == 200
    body = r.json()
    assert body["accepted"] == 2
    assert body["forwarded"]["ok"] is True
    assert body["low_confidence"] == []


def test_route_records_low_confidence_rows_in_the_receipt(make_client: Any) -> None:
    client = make_client()
    payload = _batch(2)
    payload["readings"][1]["extraction_confidence"] = "low"
    r = client.post(URL, json=payload, headers={"X-Internal-Secret": SECRET})
    assert r.status_code == 200
    low = r.json()["low_confidence"]
    assert len(low) == 1
    assert low[0]["indicator"] == "non_revenue_water"


def test_replayed_batch_is_deduplicated(make_client: Any) -> None:
    client = make_client()
    payload = _batch(1)
    h = {"X-Internal-Secret": SECRET}
    first = client.post(URL, json=payload, headers=h).json()
    second = client.post(URL, json=payload, headers=h).json()
    assert "duplicate" not in first
    assert second["duplicate"] is True
    assert second["payload_hash"] == first["payload_hash"]


def test_route_rejects_a_batch_with_any_out_of_range_row(make_client: Any) -> None:
    client = make_client()
    payload = _batch(2)
    payload["readings"][1]["value"] = 300.0  # out of range for non_revenue_water
    r = client.post(URL, json=payload, headers={"X-Internal-Secret": SECRET})
    assert r.status_code == 422
    assert "out of plausible range" in r.text

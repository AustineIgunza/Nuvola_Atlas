"""forward_county_context: single-request shipment to Laravel intake."""
from __future__ import annotations

import json
from datetime import date
from typing import Any

import httpx

from app.config import Settings
from app.forward import WASREB_PILLAR_KEY, forward_county_context
from app.models.readings import WasrebReading
from app.signing import verify

SECRET = "test-internal-secret-value-that-is-long-enough-000"


def settings() -> Settings:
    return Settings(laravel_base_url="http://laravel.test/api/v1", internal_secret=SECRET)


def _reading(**over: Any) -> WasrebReading:
    base: dict[str, Any] = {
        "county": "Nairobi",
        "utility_name": "NCWSC",
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
        "retrieved": date(2026, 8, 24),
    }
    base.update(over)
    return WasrebReading(**base)


def client_for(handler: Any) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


async def test_forwards_a_batch_in_one_request_with_expected_payload_shape() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["headers"] = request.headers
        captured["raw"] = request.content
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"success": {"data": {"written": 2}}})

    async with client_for(handler) as client:
        result = await forward_county_context(
            "batch-abc",
            [_reading(), _reading(indicator="hours_of_supply", value=7.0, unit="hrs/day")],
            settings(),
            client=client,
        )

    assert result.ok is True
    assert result.status_code == 200
    assert captured["url"].endswith("/internal/county-context")

    body = captured["body"]
    assert body["batch_id"] == "batch-abc"
    assert len(body["rows"]) == 2
    assert body["rows"][0]["pillar_key"] == WASREB_PILLAR_KEY == "water_sanitation"
    assert body["rows"][0]["indicator_key"] == "non_revenue_water"
    assert body["rows"][0]["granularity"] == "utility"
    assert body["rows"][0]["retrieved"] == "2026-08-24"

    # Signed with the same construction as forward_batch — this is a
    # regression guard, because a mismatched signature is a silent 401.
    assert captured["headers"]["X-Internal-Secret"] == SECRET
    ts = captured["headers"]["X-Internal-Timestamp"]
    sig = captured["headers"]["X-Internal-Signature"]
    assert verify(SECRET, captured["raw"], ts, sig)


async def test_empty_rows_short_circuit_without_hitting_the_wire() -> None:
    def handler(request: httpx.Request) -> httpx.Response:  # pragma: no cover
        raise AssertionError("forwarder should not call the wire for zero rows")

    async with client_for(handler) as client:
        result = await forward_county_context("empty", [], settings(), client=client)

    assert result.ok is True
    assert result.status_code == 204

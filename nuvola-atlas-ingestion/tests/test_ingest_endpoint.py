"""Endpoint-level behaviour: auth, guards, idempotency, problem envelopes."""
from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app import guards as guards_module
from app import idempotency
from app.config import get_settings
from app.main import create_app
from app.services.laravel_forwarder import ForwardResult

SECRET = "test-internal-secret-value-that-is-long-enough-000"
URL = "/api/ingest/readings"


def batch(rows: int = 1) -> dict[str, Any]:
    return {
        "batch_id": f"batch-{rows}",
        "submitted_at": "2026-08-01T00:00:00Z",
        "readings": [
            {
                "zone_id": "westlands",
                "pillar": "water_sanitation",
                "value": 80 + i,
                "unit": "index",
                "observed_at": "2026-08-01T00:00:00Z",
                "source": "knbs_census_2019",
            }
            for i in range(rows)
        ],
    }


@pytest.fixture
def make_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[Any]:
    """Builds a TestClient with env overrides and a stubbed forwarder."""

    async def fake_forward(rows: Any, settings: Any, **kwargs: Any) -> list[ForwardResult]:
        zones = {r.zone_id for r in rows}
        return [ForwardResult(zone_id=z, ok=True, status_code=202, body={}) for z in zones]

    def build(**env: str) -> TestClient:
        monkeypatch.setenv("INGESTION_INTERNAL_SECRET", SECRET)
        for key, value in env.items():
            monkeypatch.setenv(f"INGESTION_{key.upper()}", value)
        get_settings.cache_clear()
        guards_module.get_guards().reset()
        idempotency.reset()
        monkeypatch.setattr("app.routers.ingest.forward_batch", fake_forward)
        return TestClient(create_app())

    yield build
    get_settings.cache_clear()
    guards_module.get_guards().reset()
    idempotency.reset()


def test_missing_secret_is_rejected_as_problem_json(make_client: Any) -> None:
    client = make_client()
    response = client.post(URL, json=batch())

    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["status"] == 401
    assert set(body) >= {"type", "title", "status", "detail", "instance"}


def test_valid_batch_is_accepted(make_client: Any) -> None:
    client = make_client()
    response = client.post(URL, json=batch(3), headers={"X-Internal-Secret": SECRET})

    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] == 3
    assert body["forwarded"][0]["ok"] is True
    assert "payload_hash" in body


def test_replayed_batch_is_deduplicated(make_client: Any) -> None:
    client = make_client()
    payload = batch(2)
    headers = {"X-Internal-Secret": SECRET}

    first = client.post(URL, json=payload, headers=headers).json()
    second = client.post(URL, json=payload, headers=headers).json()

    assert "duplicate" not in first
    assert second["duplicate"] is True
    assert second["payload_hash"] == first["payload_hash"]
    # The replay must not have been charged a second time.
    assert guards_module.get_guards().budget_used == 2


def test_row_count_guard_returns_413(make_client: Any) -> None:
    client = make_client(max_rows_per_batch="2")
    response = client.post(URL, json=batch(3), headers={"X-Internal-Secret": SECRET})

    assert response.status_code == 413
    assert response.headers["content-type"].startswith("application/problem+json")


def test_payload_size_guard_returns_413(make_client: Any) -> None:
    client = make_client(max_payload_bytes="120")
    response = client.post(URL, json=batch(5), headers={"X-Internal-Secret": SECRET})

    assert response.status_code == 413


def test_daily_budget_guard_returns_429_with_retry_after(make_client: Any) -> None:
    client = make_client(daily_budget="3")
    headers = {"X-Internal-Secret": SECRET}

    assert client.post(URL, json=batch(3), headers=headers).status_code == 200

    response = client.post(URL, json=batch(1), headers=headers)
    assert response.status_code == 429
    assert int(response.headers["retry-after"]) > 0


def test_a_switched_off_pillar_is_rejected_at_the_schema(make_client: Any) -> None:
    client = make_client()
    payload = batch(1)
    payload["readings"][0]["pillar"] = "safety"

    response = client.post(URL, json=payload, headers={"X-Internal-Secret": SECRET})

    assert response.status_code == 422
    assert "switched off" in response.text


def test_malformed_batch_returns_a_validation_problem(make_client: Any) -> None:
    client = make_client()
    response = client.post(URL, json={"batch_id": "x"}, headers={"X-Internal-Secret": SECRET})

    assert response.status_code == 422
    body = response.json()
    assert body["type"].endswith("/validation-error")
    assert body["errors"]


def test_scheduler_tick_is_a_no_op_without_a_feed(make_client: Any) -> None:
    client = make_client(daystar_feed_base="")
    response = client.post("/internal/scheduler/tick", headers={"X-Internal-Secret": SECRET})

    assert response.status_code == 200
    assert response.json()["status"] == "skipped"


def test_scheduler_tick_requires_the_secret(make_client: Any) -> None:
    client = make_client()
    assert client.post("/internal/scheduler/tick").status_code == 401


def test_guard_health_reports_live_counters(make_client: Any) -> None:
    client = make_client(daily_budget="500")
    client.post(URL, json=batch(4), headers={"X-Internal-Secret": SECRET})

    body = client.get("/api/health/guards").json()
    assert body["budget_used"] == 4
    assert body["daily_budget"] == 500
    assert body["circuit_open"] is False

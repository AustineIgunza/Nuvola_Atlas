"""Forwarder behaviour: signed headers, retry budget, no-retry on 4xx."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx
import pytest

from app.config import Settings
from app.forward import RETRY_BACKOFF_SECONDS, forward_batch
from app.models.readings import PillarReading
from app.signing import verify

SECRET = "test-internal-secret-value-that-is-long-enough-000"


def settings() -> Settings:
    return Settings(laravel_base_url="http://laravel.test/api/v1", internal_secret=SECRET)


def reading(zone_id: str = "westlands", value: float = 82.0) -> PillarReading:
    return PillarReading(
        zone_id=zone_id,
        pillar="water_sanitation",
        value=value,
        unit="index",
        observed_at=datetime(2026, 8, 1, tzinfo=UTC),
        source="knbs_census_2019",
    )


class RecordingSleep:
    """Stands in for asyncio.sleep so retry tests stay instant."""

    def __init__(self) -> None:
        self.calls: list[float] = []

    async def __call__(self, seconds: float) -> None:
        self.calls.append(seconds)


def client_for(handler: Any) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


async def test_forwarded_request_carries_a_valid_signature() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["headers"] = request.headers
        captured["content"] = request.content
        return httpx.Response(202, json={"ok": True})

    async with client_for(handler) as client:
        results = await forward_batch([reading()], settings(), client=client)

    assert results[0].ok is True
    assert captured["headers"]["X-Internal-Secret"] == SECRET
    assert verify(
        SECRET,
        captured["content"],
        captured["headers"]["X-Internal-Timestamp"],
        captured["headers"]["X-Internal-Signature"],
    )


async def test_server_error_retries_the_full_budget_then_gives_up() -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(503, json={"error": "down"})

    sleep = RecordingSleep()
    async with client_for(handler) as client:
        results = await forward_batch([reading()], settings(), client=client, sleep=sleep)

    assert attempts == len(RETRY_BACKOFF_SECONDS) + 1
    assert results[0].ok is False
    assert results[0].attempts == attempts
    assert sleep.calls == list(RETRY_BACKOFF_SECONDS)


async def test_transient_failure_then_success_stops_retrying() -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            return httpx.Response(502, json={"error": "bad gateway"})
        return httpx.Response(202, json={"ok": True})

    sleep = RecordingSleep()
    async with client_for(handler) as client:
        results = await forward_batch([reading()], settings(), client=client, sleep=sleep)

    assert attempts == 2
    assert results[0].ok is True
    assert results[0].attempts == 2
    assert sleep.calls == [RETRY_BACKOFF_SECONDS[0]]


@pytest.mark.parametrize("status_code", [400, 401, 422])
async def test_client_errors_are_not_retried(status_code: int) -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(status_code, json={"title": "nope"})

    sleep = RecordingSleep()
    async with client_for(handler) as client:
        results = await forward_batch([reading()], settings(), client=client, sleep=sleep)

    assert attempts == 1
    assert results[0].ok is False
    assert sleep.calls == []


async def test_connection_errors_are_retried() -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        raise httpx.ConnectError("connection refused")

    sleep = RecordingSleep()
    async with client_for(handler) as client:
        results = await forward_batch([reading()], settings(), client=client, sleep=sleep)

    assert attempts == len(RETRY_BACKOFF_SECONDS) + 1
    assert results[0].status_code == 0
    assert "connection refused" in results[0].body["error"]


async def test_readings_are_grouped_into_one_request_per_zone() -> None:
    zones: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        import json

        zones.append(json.loads(request.content)["zone_id"])
        return httpx.Response(202, json={"ok": True})

    rows = [reading("westlands"), reading("starehe"), reading("westlands", 91.0)]
    async with client_for(handler) as client:
        results = await forward_batch(rows, settings(), client=client)

    assert sorted(zones) == ["starehe", "westlands"]
    assert len(results) == 2


async def test_empty_batch_short_circuits() -> None:
    assert await forward_batch([], settings()) == []


async def test_payload_is_keyed_the_way_laravel_validates_it() -> None:
    """IngestController::store validates `pillars`, keyed by registry pillar key."""
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        import json

        captured.update(json.loads(request.content))
        return httpx.Response(202, json={"ok": True})

    async with client_for(handler) as client:
        await forward_batch([reading()], settings(), client=client)

    assert captured["pillars"] == {"water_sanitation": 82.0}
    assert captured["zone_id"] == "westlands"

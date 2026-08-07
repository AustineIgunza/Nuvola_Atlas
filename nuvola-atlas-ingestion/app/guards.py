"""Spend guards for the ingestion front door.

Daystar drops arrive unattended and the service runs on metered compute, so
a malformed 400MB export or a cron stuck in a retry loop is a billing
incident before it is a data incident. Four guards bound that:

* payload size  -- a single request may not exceed ``max_payload_bytes``
* row count     -- a single batch may not exceed ``max_rows_per_batch``
* daily budget  -- rows accepted per UTC day, ``INGESTION_DAILY_BUDGET``
* circuit breaker -- consecutive Laravel 5xx open the circuit for a cooldown

State is per-process and deliberately so. On Fluid Compute each instance
keeps its own counters, which makes these a fast local brake rather than a
global quota; the authoritative accounting is the append-only
``data_ingestion_logs`` table on the Laravel side.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import UTC, datetime

import sentry_sdk
from fastapi import HTTPException, Request, status

from app.config import Settings, get_settings


class GuardTripped(HTTPException):
    """An HTTPException that also names which guard fired, for the logs."""

    def __init__(self, guard: str, status_code: int, detail: str, retry_after: int | None = None):
        headers = {"Retry-After": str(retry_after)} if retry_after is not None else None
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.guard = guard


@dataclass
class SpendGuards:
    consecutive_failures: int = 0
    opened_at: float | None = None
    budget_day: str = field(default_factory=lambda: datetime.now(UTC).strftime("%Y-%m-%d"))
    budget_used: int = 0

    def reset(self) -> None:
        self.consecutive_failures = 0
        self.opened_at = None
        self.budget_day = datetime.now(UTC).strftime("%Y-%m-%d")
        self.budget_used = 0

    # -- circuit breaker -----------------------------------------------

    def record_forward_outcome(self, *, ok: bool, status_code: int, settings: Settings) -> None:
        """Feed a Laravel response back into the breaker.

        Only 5xx and transport failures count. A 4xx means our payload was
        wrong, which says nothing about whether Laravel is healthy.
        """
        if ok or (400 <= status_code < 500):
            self.consecutive_failures = 0
            self.opened_at = None
            return

        self.consecutive_failures += 1
        if self.consecutive_failures >= settings.breaker_failure_threshold:
            self.opened_at = time.monotonic()
            _breadcrumb(
                "circuit_breaker",
                f"opened after {self.consecutive_failures} consecutive Laravel failures",
            )

    def circuit_cooldown_remaining(self, settings: Settings) -> int:
        if self.opened_at is None:
            return 0
        elapsed = time.monotonic() - self.opened_at
        remaining = settings.breaker_cooldown_seconds - elapsed
        if remaining <= 0:
            # Half-open: let the next batch through and see what happens.
            self.opened_at = None
            self.consecutive_failures = 0
            return 0
        return int(remaining) + 1

    def check_circuit(self, settings: Settings) -> None:
        remaining = self.circuit_cooldown_remaining(settings)
        if remaining:
            _breadcrumb("circuit_breaker", f"rejected while open, {remaining}s remaining")
            raise GuardTripped(
                "circuit_breaker",
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Downstream Laravel API is failing; ingestion is paused.",
                retry_after=remaining,
            )

    # -- daily budget --------------------------------------------------

    def _roll_day(self) -> None:
        today = datetime.now(UTC).strftime("%Y-%m-%d")
        if today != self.budget_day:
            self.budget_day = today
            self.budget_used = 0

    def check_budget(self, rows: int, settings: Settings) -> None:
        self._roll_day()
        if self.budget_used + rows > settings.daily_budget:
            _breadcrumb(
                "daily_budget",
                f"{self.budget_used}/{settings.daily_budget} rows used; batch of {rows} refused",
            )
            raise GuardTripped(
                "daily_budget",
                status.HTTP_429_TOO_MANY_REQUESTS,
                f"Daily ingestion budget of {settings.daily_budget} rows is exhausted.",
                retry_after=_seconds_until_utc_midnight(),
            )

    def consume_budget(self, rows: int) -> None:
        self._roll_day()
        self.budget_used += rows

    # -- batch shape ---------------------------------------------------

    def check_row_count(self, rows: int, settings: Settings) -> None:
        if rows > settings.max_rows_per_batch:
            _breadcrumb("row_count", f"batch of {rows} exceeds {settings.max_rows_per_batch}")
            raise GuardTripped(
                "row_count",
                status.HTTP_413_CONTENT_TOO_LARGE,
                f"Batch exceeds the {settings.max_rows_per_batch} row limit; split it.",
            )


_guards = SpendGuards()


def get_guards() -> SpendGuards:
    return _guards


async def enforce_payload_size(request: Request) -> None:
    """Route dependency — rejects oversized bodies before parsing them."""
    settings = get_settings()
    limit = settings.max_payload_bytes

    declared = request.headers.get("content-length", "")
    if declared.isdigit() and int(declared) > limit:
        _refuse_size(int(declared), limit)

    # Content-Length is absent on chunked uploads, so fall back to the real
    # body. Starlette caches it, so the route handler still sees it.
    body = await request.body()
    if len(body) > limit:
        _refuse_size(len(body), limit)


def _refuse_size(size: int, limit: int) -> None:
    _breadcrumb("payload_bytes", f"{size} bytes exceeds the {limit} byte limit")
    raise GuardTripped(
        "payload_bytes",
        status.HTTP_413_CONTENT_TOO_LARGE,
        f"Payload exceeds the {limit} byte limit.",
    )


def _breadcrumb(guard: str, message: str) -> None:
    sentry_sdk.add_breadcrumb(
        category="spend-guard",
        type="error",
        level="warning",
        message=message,
        data={"guard": guard},
    )


def _seconds_until_utc_midnight() -> int:
    now = datetime.now(UTC)
    midnight = now.replace(hour=23, minute=59, second=59, microsecond=0)
    return max(int((midnight - now).total_seconds()), 1)

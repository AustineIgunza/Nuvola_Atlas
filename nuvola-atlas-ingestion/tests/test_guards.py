"""Spend guard unit tests — each guard fires at its threshold and not before."""
from __future__ import annotations

import pytest

from app.config import Settings
from app.guards import GuardTripped, SpendGuards


def settings(**overrides: object) -> Settings:
    base: dict[str, object] = {
        "max_payload_bytes": 1024,
        "max_rows_per_batch": 10,
        "daily_budget": 25,
        "breaker_failure_threshold": 3,
        "breaker_cooldown_seconds": 60,
    }
    base.update(overrides)
    return Settings(**base)  # type: ignore[arg-type]


@pytest.fixture
def guards() -> SpendGuards:
    g = SpendGuards()
    g.reset()
    return g


def test_row_count_within_limit_passes(guards: SpendGuards) -> None:
    guards.check_row_count(10, settings())


def test_row_count_over_limit_is_413(guards: SpendGuards) -> None:
    with pytest.raises(GuardTripped) as exc:
        guards.check_row_count(11, settings())
    assert exc.value.status_code == 413
    assert exc.value.guard == "row_count"


def test_budget_accumulates_across_batches(guards: SpendGuards) -> None:
    cfg = settings()
    guards.check_budget(20, cfg)
    guards.consume_budget(20)

    guards.check_budget(5, cfg)
    guards.consume_budget(5)

    with pytest.raises(GuardTripped) as exc:
        guards.check_budget(1, cfg)
    assert exc.value.status_code == 429
    assert exc.value.guard == "daily_budget"
    assert "Retry-After" in (exc.value.headers or {})


def test_budget_rolls_over_on_a_new_utc_day(guards: SpendGuards) -> None:
    cfg = settings()
    guards.consume_budget(25)
    guards.budget_day = "1999-01-01"

    guards.check_budget(25, cfg)
    assert guards.budget_used == 0


def test_breaker_opens_after_consecutive_server_errors(guards: SpendGuards) -> None:
    cfg = settings()
    for _ in range(3):
        guards.record_forward_outcome(ok=False, status_code=503, settings=cfg)

    with pytest.raises(GuardTripped) as exc:
        guards.check_circuit(cfg)
    assert exc.value.status_code == 503
    assert exc.value.guard == "circuit_breaker"


def test_breaker_stays_closed_below_the_threshold(guards: SpendGuards) -> None:
    cfg = settings()
    guards.record_forward_outcome(ok=False, status_code=500, settings=cfg)
    guards.record_forward_outcome(ok=False, status_code=500, settings=cfg)

    guards.check_circuit(cfg)


def test_success_resets_the_failure_streak(guards: SpendGuards) -> None:
    cfg = settings()
    guards.record_forward_outcome(ok=False, status_code=500, settings=cfg)
    guards.record_forward_outcome(ok=False, status_code=500, settings=cfg)
    guards.record_forward_outcome(ok=True, status_code=202, settings=cfg)
    guards.record_forward_outcome(ok=False, status_code=500, settings=cfg)

    assert guards.consecutive_failures == 1
    guards.check_circuit(cfg)


def test_client_errors_do_not_open_the_breaker(guards: SpendGuards) -> None:
    cfg = settings()
    for _ in range(5):
        guards.record_forward_outcome(ok=False, status_code=422, settings=cfg)

    assert guards.consecutive_failures == 0
    guards.check_circuit(cfg)


def test_breaker_half_opens_once_the_cooldown_elapses(guards: SpendGuards) -> None:
    cfg = settings(breaker_cooldown_seconds=0)
    for _ in range(3):
        guards.record_forward_outcome(ok=False, status_code=502, settings=cfg)

    guards.check_circuit(cfg)
    assert guards.opened_at is None
    assert guards.consecutive_failures == 0

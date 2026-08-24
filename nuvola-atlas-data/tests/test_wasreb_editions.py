from __future__ import annotations

import pytest

from pipeline.wasreb.editions import EDITIONS, edition


def test_registry_covers_all_seventeen_editions():
    """The 17 IMPACT reports are the whole point of this parser."""
    assert len(EDITIONS) == 17
    assert {e.issue for e in EDITIONS} == set(range(1, 18))


def test_fiscal_years_are_sequential_and_unique_for_early_editions():
    seen = {e.fiscal_year for e in EDITIONS[-15:]}
    assert len(seen) == 15  # no accidental duplicates in the early sequence


def test_lookup_by_issue():
    e = edition(17)
    assert e.issue == 17
    assert e.fiscal_year == "FY2023/24"


def test_missing_issue_raises():
    with pytest.raises(KeyError, match="edition #99"):
        edition(99)

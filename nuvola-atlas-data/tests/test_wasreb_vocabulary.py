from __future__ import annotations

import pytest

from pipeline.wasreb.vocabulary import is_plausible, resolve_column


@pytest.mark.parametrize("header,expected_key", [
    ("Non-Revenue Water", "non_revenue_water"),
    ("NRW", "non_revenue_water"),
    ("Hours of Supply", "hours_of_supply"),
    ("Hrs of Supply", "hours_of_supply"),
    ("Metering Ratio", "metering_ratio"),
    ("Revenue Collection", "revenue_collection_eff"),
    ("O&M Cost Coverage", "om_cost_coverage"),
    ("Drinking Water Quality", "drinking_water_quality"),
    ("Staff per 1,000 Connections", "staff_per_1000_connections"),
    ("Water Coverage", "water_coverage"),
    ("Total Score", "total_score"),
    ("Personnel Expenditure", "personnel_exp_share"),
])
def test_headers_resolve(header, expected_key):
    assert resolve_column(header).key == expected_key


def test_unknown_column_raises():
    with pytest.raises(KeyError, match="Add it to"):
        resolve_column("Some Unlisted Metric")


@pytest.mark.parametrize("indicator,value,ok", [
    ("non_revenue_water", 45.0, True),
    ("non_revenue_water", 150.0, False),
    ("hours_of_supply", 20.0, True),
    ("hours_of_supply", 30.0, False),
    ("hours_of_supply", -1.0, False),
    ("drinking_water_quality", 100.0, True),
    ("total_score", 200.0, True),
    ("total_score", 250.0, False),
])
def test_is_plausible(indicator, value, ok):
    assert is_plausible(indicator, value) is ok

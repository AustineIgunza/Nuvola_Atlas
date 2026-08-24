from __future__ import annotations

import pytest

from pipeline.wasreb.vocabulary import is_plausible, resolve_column


@pytest.mark.parametrize("header,expected_key", [
    ("Non-Revenue Water", "wasreb_non_revenue_water"),
    ("NRW", "wasreb_non_revenue_water"),
    ("Hours of Supply", "wasreb_hours_of_supply"),
    ("Hrs of Supply", "wasreb_hours_of_supply"),
    ("Metering Ratio", "wasreb_metering_ratio"),
    ("Revenue Collection", "wasreb_revenue_collection"),
    ("O&M Cost Coverage", "wasreb_om_cost_coverage"),
    ("Drinking Water Quality", "wasreb_water_quality"),
    ("Staff per 1,000 Connections", "wasreb_staff_productivity"),
    ("Water Coverage", "wasreb_water_coverage"),
])
def test_headers_resolve(header, expected_key):
    assert resolve_column(header).key == expected_key


def test_unknown_column_raises():
    with pytest.raises(KeyError, match="Add it to"):
        resolve_column("Some Unlisted Metric")


@pytest.mark.parametrize("indicator,value,ok", [
    ("wasreb_non_revenue_water", 45.0, True),
    ("wasreb_non_revenue_water", 150.0, False),
    ("wasreb_hours_of_supply", 20.0, True),
    ("wasreb_hours_of_supply", 30.0, False),
    ("wasreb_hours_of_supply", -1.0, False),
    ("wasreb_water_quality", 100.0, True),
])
def test_is_plausible(indicator, value, ok):
    assert is_plausible(indicator, value) is ok

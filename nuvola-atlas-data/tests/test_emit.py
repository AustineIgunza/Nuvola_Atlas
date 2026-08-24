"""The emitter's two rules — R1 (gap => null) and R2 (county to banner)."""
from __future__ import annotations

import pytest

from pipeline.emit import EmitRuleViolation, SubcountyFeature, build_geojson
from pipeline.indicators import ProvenanceValue


def _point_geom():
    return {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]}


def _subcounty(**over):
    d = dict(
        id="nrb_westlands",
        name="Westlands",
        geometry=_point_geom(),
        centroid=(36.80, -1.27),
        pillars={},
        missing_pillars=(),
        score=None,
        last_sync_min=None,
    )
    d.update(over)
    return SubcountyFeature(**d)


def _reading(**over):
    d = dict(
        value=42.0,
        unit="pct",
        indicator="water_source_piped_share",
        granularity="subcounty",
        method="measured",
        source_id="knbs_census_2019",
        vintage="2019 census",
        retrieved="2026-08-24",
    )
    d.update(over)
    return ProvenanceValue(**d)


# ---------- R1: gap => value must be null ----------


def test_r1_gap_reading_survives_and_serialises_with_null_value():
    """A declared gap on a feature is a finding — value stays null all the way to JSON."""
    gap = _reading(value=None, method="gap", source_id=None, vintage=None)
    feat = _subcounty(pillars={"water_sanitation": gap})
    fc = build_geojson([feat])
    props = fc["features"][0]["properties"]
    assert props["pillars"]["water_sanitation"]["value"] is None
    assert props["pillars"]["water_sanitation"]["method"] == "gap"


def test_r1_construction_of_gap_with_number_raises():
    """Even before the emitter runs, ProvenanceValue refuses to hold a value on a gap."""
    with pytest.raises(ValueError):
        _reading(value=0, method="gap", source_id=None, vintage=None)


# ---------- R2: non-subcounty granularity may not sit on a feature ----------


@pytest.mark.parametrize("gran", ["county", "utility", "national"])
def test_r2_non_subcounty_on_feature_is_rejected(gran):
    reading = _reading(granularity=gran, indicator="non_revenue_water",
                        source_id="wasreb_impact_17", vintage="FY2023/24")
    feat = _subcounty(pillars={"water_sanitation": reading})
    with pytest.raises(EmitRuleViolation, match="county_context"):
        build_geojson([feat])


def test_r2_utility_reading_belongs_in_county_context():
    utility = _reading(
        granularity="utility",
        indicator="non_revenue_water",
        source_id="wasreb_impact_17",
        vintage="FY2023/24",
    )
    fc = build_geojson([_subcounty()], county_context={"water_sanitation": [utility]})
    ctx = fc["county_context"]["water_sanitation"]
    assert len(ctx) == 1
    assert ctx[0]["granularity"] == "utility"
    # And nothing bled into the feature.
    assert fc["features"][0]["properties"]["pillars"]["water_sanitation"] is None


def test_r2_subcounty_in_county_context_is_rejected():
    subcounty_reading = _reading(granularity="subcounty")
    with pytest.raises(EmitRuleViolation, match="belong on their feature"):
        build_geojson([_subcounty()], county_context={"water_sanitation": [subcounty_reading]})


# ---------- registry safety: retired pillars have no path to render ----------


def test_retired_pillar_on_feature_is_rejected():
    reading = _reading()
    feat = _subcounty(pillars={"civic_index": reading})
    with pytest.raises(EmitRuleViolation, match="retired"):
        build_geojson([feat])


def test_unknown_pillar_on_feature_is_rejected():
    reading = _reading()
    feat = _subcounty(pillars={"never_a_pillar": reading})
    with pytest.raises(EmitRuleViolation, match="unknown pillar"):
        build_geojson([feat])


def test_retired_pillar_in_county_context_is_rejected():
    reading = _reading(granularity="utility", source_id="x", vintage="y")
    with pytest.raises(EmitRuleViolation, match="retired"):
        build_geojson([_subcounty()], county_context={"safety": [reading]})


# ---------- feature-collection shape ----------


def test_all_four_pillar_slots_appear_even_when_unread():
    """Consumers can safely index every registered pillar key."""
    fc = build_geojson([_subcounty()])
    slots = fc["features"][0]["properties"]["pillars"]
    assert set(slots.keys()) == {
        "water_sanitation", "road_density", "transit_access", "electricity_access"
    }
    assert all(v is None for v in slots.values())


def test_registry_version_and_generated_at_are_present():
    fc = build_geojson([_subcounty()], generated_at="2026-08-24T00:00:00+00:00")
    assert fc["registry_version"]  # non-empty, tracks pillars.json
    assert fc["generated_at"] == "2026-08-24T00:00:00+00:00"
    assert fc["type"] == "FeatureCollection"

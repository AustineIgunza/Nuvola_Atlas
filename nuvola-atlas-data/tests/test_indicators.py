"""ProvenanceValue is where R1 (gap => null value) lives. Guard it."""
from __future__ import annotations

import pytest

from pipeline.indicators import ProvenanceValue, resolve_indicator


def _base(**over):
    d = dict(
        value=None,
        unit="pct",
        indicator="water_source_piped_share",
        granularity="subcounty",
        method="gap",
        source_id=None,
        vintage=None,
        retrieved="2026-08-24",
    )
    d.update(over)
    return d


def test_gap_with_value_is_rejected():
    with pytest.raises(ValueError, match="method='gap'"):
        ProvenanceValue(**_base(method="gap", value=0))


def test_gap_with_null_value_is_accepted():
    v = ProvenanceValue(**_base(method="gap", value=None))
    assert v.value is None
    assert v.method == "gap"


def test_measured_without_source_is_rejected():
    with pytest.raises(ValueError, match="source_id"):
        ProvenanceValue(**_base(method="measured", value=51.2, source_id=None, vintage="FY23"))


def test_measured_without_vintage_is_rejected():
    with pytest.raises(ValueError, match="vintage"):
        ProvenanceValue(**_base(method="measured", value=51.2, source_id="wasreb", vintage=None))


def test_bad_retrieval_date_is_rejected():
    with pytest.raises(ValueError):
        ProvenanceValue(**_base(retrieved="24 Aug 2026"))


def test_to_dict_keeps_null_value_but_drops_missing_optionals():
    v = ProvenanceValue(**_base(method="gap", value=None))
    out = v.to_dict()
    assert out["value"] is None       # a null value is a finding, keep it
    assert "page_ref" not in out       # optional and unset, drop
    assert "notes" not in out


def test_resolve_indicator_by_alias():
    assert resolve_indicator("piped_water_pct").key == "water_source_piped_share"


def test_resolve_indicator_unknown_raises():
    with pytest.raises(KeyError):
        resolve_indicator("made_up_metric")

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


def test_imputed_without_chain_is_rejected():
    with pytest.raises(ValueError, match="imputed_from"):
        ProvenanceValue(
            **_base(
                method="imputed",
                value=42.0,
                source_id="wasreb",
                vintage="FY23",
            )
        )


def test_imputed_with_chain_is_accepted():
    v = ProvenanceValue(
        **_base(
            method="imputed",
            value=42.0,
            source_id="wasreb",
            vintage="FY23",
            imputed_from=("water_coverage_utility",),
            confidence=60,
        )
    )
    assert v.method == "imputed"
    assert v.imputed_from == ("water_coverage_utility",)


def test_imputed_from_on_non_imputed_is_rejected():
    with pytest.raises(ValueError, match="imputed_from is only valid"):
        ProvenanceValue(
            **_base(
                method="measured",
                value=42.0,
                source_id="wasreb",
                vintage="FY23",
                imputed_from=("water_coverage_utility",),
            )
        )


def test_zone_id_on_non_subcounty_is_rejected():
    with pytest.raises(ValueError, match="zone_id"):
        ProvenanceValue(
            **_base(
                granularity="utility",
                method="measured",
                value=42.0,
                source_id="wasreb",
                vintage="FY23",
                zone_id="westlands",
            )
        )


def test_confidence_out_of_range_is_rejected():
    with pytest.raises(ValueError, match="confidence"):
        ProvenanceValue(
            **_base(
                method="measured",
                value=42.0,
                source_id="wasreb",
                vintage="FY23",
                confidence=150,
            )
        )


def test_to_dict_serialises_imputed_from_as_list():
    v = ProvenanceValue(
        **_base(
            method="imputed",
            value=42.0,
            source_id="wasreb",
            vintage="FY23",
            imputed_from=("water_coverage_utility", "population_worldpop"),
        )
    )
    out = v.to_dict()
    assert out["imputed_from"] == ["water_coverage_utility", "population_worldpop"]
    assert isinstance(out["imputed_from"], list)

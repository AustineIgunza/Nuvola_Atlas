from __future__ import annotations

import pytest

from pipeline.wasreb.extract import (
    RawReading,
    get_extractor,
    has_extractor,
    normalise_readings,
    register,
    registered_issues,
)


def _raw(**over):
    d = dict(
        utility_label="Nairobi Water",
        column_label="Non-Revenue Water",
        value=45.0,
        page_ref="p42",
        extraction_confidence="high",
    )
    d.update(over)
    return RawReading(**d)


def test_registry_registration_and_lookup():
    def fake(_p):
        return []

    register(999, fake)
    try:
        assert has_extractor(999)
        assert 999 in registered_issues()
        assert get_extractor(999) is fake
    finally:
        # keep the registry clean for the rest of the suite
        from pipeline.wasreb.extract import _REGISTRY
        _REGISTRY.pop(999, None)


def test_missing_extractor_raises_with_hint():
    with pytest.raises(KeyError, match="issue_"):
        get_extractor(9999)


def test_normalise_canonicalises_utility_and_indicator():
    (out,) = list(normalise_readings([_raw()], issue=17, fy="FY2023/24"))
    assert out.utility_id == "ncwsc"
    assert out.utility_name == "Nairobi City Water and Sewerage Company"
    assert out.county == "Nairobi"
    assert out.indicator == "wasreb_non_revenue_water"
    assert out.unit == "pct"
    assert out.report_issue == 17
    assert out.fy == "FY2023/24"
    assert out.extraction_confidence == "high"
    assert out.notes is None


def test_normalise_flags_out_of_range_as_low_confidence():
    # 150% NRW is impossible — must survive as a value, but downgraded.
    r = _raw(value=150.0, extraction_confidence="high")
    (out,) = list(normalise_readings([r], issue=17, fy="FY2023/24"))
    assert out.value == 150.0
    assert out.extraction_confidence == "low"
    assert out.notes and "out-of-range" in out.notes


def test_normalise_preserves_null_values_without_flagging():
    r = _raw(value=None, extraction_confidence="medium")
    (out,) = list(normalise_readings([r], issue=17, fy="FY2023/24"))
    assert out.value is None
    assert out.extraction_confidence == "medium"


def test_normalise_raises_on_unknown_label():
    r = _raw(utility_label="Nowhereville Water Company")
    with pytest.raises(KeyError):
        list(normalise_readings([r], issue=17, fy="FY2023/24"))

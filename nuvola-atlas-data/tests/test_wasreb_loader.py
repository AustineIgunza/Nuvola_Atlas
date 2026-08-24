from __future__ import annotations

import pytest

from pipeline.wasreb.loader import (
    LoadError,
    filter_for_county,
    iter_readings,
    load,
    summarise,
)

HEADER = (
    "utility_name,size_category,fy,indicator,value,unit,granularity,method,"
    "source_id,report_issue,vintage,extraction_confidence,attribution\n"
)


def _write_csv(tmp_path, rows: list[str]):
    p = tmp_path / "sample.csv"
    p.write_text(HEADER + "".join(rows), encoding="utf-8")
    return p


def test_loads_a_known_utility_with_full_metadata(tmp_path):
    path = _write_csv(tmp_path, [
        'Nairobi,"Very Large (>35,000 connections)",FY2023/24,'
        'non_revenue_water,48,%,utility,measured,wasreb_impact_17,'
        '17,FY2023/24,high,"WASREB IMPACT 17"\n',
    ])
    (r,) = load(path)
    assert r.utility_id == "ncwsc"           # resolver recognised Nairobi
    assert r.utility_name == "Nairobi"
    assert r.county == "Nairobi"
    assert r.indicator == "non_revenue_water"
    assert r.unit == "%"
    assert r.value == 48.0
    assert r.extraction_confidence == "high"
    assert r.fy == "FY2023/24"
    assert r.report_issue == 17
    assert r.size_category == "Very Large (>35,000 connections)"


def test_unknown_utility_passes_through_without_county(tmp_path):
    # An unmapped utility must still LOAD — the CSV is authoritative for its
    # label, and its county assignment is metadata we haven't added yet.
    path = _write_csv(tmp_path, [
        "Eldoret,\"Very Large (>35,000 connections)\",FY2023/24,"
        "water_coverage,90,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
    ])
    (r,) = load(path)
    assert r.utility_name == "Eldoret"
    assert r.county is None                   # county mapping absent → None
    assert r.utility_id == "eldoret"          # slug fallback


def test_empty_value_becomes_null(tmp_path):
    path = _write_csv(tmp_path, [
        "Nairobi,\"Very Large (>35,000 connections)\",FY2023/24,"
        "water_coverage,,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,medium,attribution\n",
    ])
    (r,) = load(path)
    assert r.value is None                    # blank cell -> null, not 0


def test_out_of_range_value_survives_but_downgrades_to_low(tmp_path):
    path = _write_csv(tmp_path, [
        "Nairobi,\"Very Large (>35,000 connections)\",FY2023/24,"
        "non_revenue_water,150,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
    ])
    (r,) = load(path)
    assert r.value == 150.0
    assert r.extraction_confidence == "low"   # 150% NRW is impossible
    assert r.notes and "out-of-range" in r.notes


def test_unknown_indicator_raises_with_row_number(tmp_path):
    path = _write_csv(tmp_path, [
        "Nairobi,\"Very Large (>35,000 connections)\",FY2023/24,"
        "made_up_metric,42,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
    ])
    with pytest.raises(LoadError, match="row 2"):
        load(path)


def test_bad_confidence_raises(tmp_path):
    path = _write_csv(tmp_path, [
        "Nairobi,\"Very Large (>35,000 connections)\",FY2023/24,"
        "water_coverage,90,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,great,attribution\n",
    ])
    with pytest.raises(LoadError, match="high\\|medium\\|low"):
        load(path)


def test_non_numeric_value_raises(tmp_path):
    path = _write_csv(tmp_path, [
        "Nairobi,\"Very Large (>35,000 connections)\",FY2023/24,"
        "water_coverage,ninety,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
    ])
    with pytest.raises(LoadError, match="non-numeric"):
        load(path)


def test_missing_required_column_raises(tmp_path):
    p = tmp_path / "bad.csv"
    p.write_text("utility_name,fy\nNairobi,FY2023/24\n", encoding="utf-8")
    with pytest.raises(LoadError, match="missing required column"):
        list(iter_readings(p))


def test_summarise_counts(tmp_path):
    path = _write_csv(tmp_path, [
        "Nairobi,\"Very Large (>35,000 connections)\",FY2023/24,"
        "non_revenue_water,48,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
        "Nairobi,\"Very Large (>35,000 connections)\",FY2023/24,"
        "hours_of_supply,7,hrs/day,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
        "Eldoret,\"Very Large (>35,000 connections)\",FY2023/24,"
        "water_coverage,,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,medium,attribution\n",
    ])
    stats = summarise(load(path))
    assert stats.total_rows == 3
    assert stats.utilities == 2               # ncwsc + eldoret
    assert stats.indicators == 3
    assert stats.null_values == 1
    assert stats.confidence_counts["high"] == 2
    assert stats.confidence_counts["medium"] == 1


def test_filter_for_county_returns_only_that_county(tmp_path):
    path = _write_csv(tmp_path, [
        "Nairobi,\"Very Large (>35,000 connections)\",FY2023/24,"
        "non_revenue_water,48,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
        "Ruiru-Juja,\"Large (10,000-35,000 connections)\",FY2023/24,"
        "water_coverage,80,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
        "Kiambu,\"Large (10,000-35,000 connections)\",FY2023/24,"
        "water_coverage,70,%,utility,measured,wasreb_impact_17,"
        "17,FY2023/24,high,attribution\n",
    ])
    nairobi = filter_for_county(load(path), "Nairobi")
    assert [r.utility_id for r in nairobi] == ["ncwsc"]

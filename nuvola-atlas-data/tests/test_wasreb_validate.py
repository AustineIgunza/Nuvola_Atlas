from __future__ import annotations

from pipeline.wasreb.extract import NormalisedReading
from pipeline.wasreb.validate import build_report


def _r(**over):
    d = dict(
        utility_id="ncwsc",
        utility_name="Nairobi City Water and Sewerage Company",
        county="Nairobi",
        fy="FY2023/24",
        indicator="wasreb_non_revenue_water",
        value=45.0,
        unit="pct",
        report_issue=17,
        page_ref="p42",
        extraction_confidence="high",
        notes=None,
    )
    d.update(over)
    return NormalisedReading(**d)


def test_counts():
    rs = [
        _r(),
        _r(indicator="wasreb_hours_of_supply", value=18.0, unit="hours_per_day"),
        _r(utility_id="ruiru_juja", utility_name="Ruiru-Juja Water and Sewerage Company",
           county="Kiambu"),
        _r(value=None, extraction_confidence="medium"),
    ]
    rep = build_report(rs, issue=17, fy="FY2023/24", failed_pages=("p13",))
    assert rep.utilities_seen == 2
    assert rep.indicators_seen == 2
    assert rep.total_readings == 4
    assert rep.null_readings == 1
    assert rep.confidence_counts["high"] == 3
    assert rep.confidence_counts["medium"] == 1
    assert rep.failed_pages == ["p13"]


def test_out_of_range_surfaces_impossible_values():
    rs = [_r(value=45.0), _r(value=150.0)]  # 150% NRW is impossible
    rep = build_report(rs, issue=17, fy="FY2023/24")
    assert len(rep.out_of_range) == 1
    oor = rep.out_of_range[0]
    assert oor.value == 150.0
    assert oor.indicator == "wasreb_non_revenue_water"


def test_report_serialises_cleanly():
    rep = build_report([_r()], issue=17, fy="FY2023/24")
    d = rep.to_dict()
    assert d["issue"] == 17
    assert isinstance(d["out_of_range"], list)

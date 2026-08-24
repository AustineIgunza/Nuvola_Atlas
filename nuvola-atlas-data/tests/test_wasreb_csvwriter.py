from __future__ import annotations

import csv

from pipeline.wasreb.csvwriter import COLUMNS, write_long_csv
from pipeline.wasreb.extract import NormalisedReading


def _reading(**over):
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


def test_column_order_is_locked():
    assert COLUMNS == (
        "utility_id", "utility_name", "county", "fy", "indicator", "value",
        "unit", "report_issue", "page_ref", "extraction_confidence", "notes",
    )


def test_round_trip(tmp_path):
    readings = [_reading(), _reading(value=None, extraction_confidence="low")]
    path = write_long_csv(readings, tmp_path / "out.csv")
    with path.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    assert len(rows) == 2
    assert rows[0]["utility_id"] == "ncwsc"
    assert rows[0]["value"] == "45.0"
    assert rows[1]["value"] == ""            # null serialises as empty, not "None"
    assert rows[1]["extraction_confidence"] == "low"

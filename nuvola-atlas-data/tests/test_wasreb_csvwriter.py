from __future__ import annotations

import csv

from pipeline.wasreb.csvwriter import COLUMNS, write_long_csv
from pipeline.wasreb.extract import NormalisedReading


def _reading(**over):
    d = dict(
        utility_id="ncwsc",
        utility_name="Nairobi",
        county="Nairobi",
        fy="FY2023/24",
        indicator="non_revenue_water",
        value=45.0,
        unit="%",
        report_issue=17,
        page_ref="",
        extraction_confidence="high",
        size_category="Very Large (>35,000 connections)",
        notes=None,
    )
    d.update(over)
    return NormalisedReading(**d)


def test_column_order_matches_the_reconciled_dataset():
    # Order matches wasreb_impact17_long.csv up through 'attribution'; the
    # trailing four columns are our own audit metadata.
    assert COLUMNS[:13] == (
        "utility_name", "size_category", "fy", "indicator", "value", "unit",
        "granularity", "method", "source_id", "report_issue", "vintage",
        "extraction_confidence", "attribution",
    )
    assert COLUMNS[13:] == ("utility_id", "county", "page_ref", "notes")


def test_round_trip(tmp_path):
    readings = [_reading(), _reading(value=None, extraction_confidence="low")]
    path = write_long_csv(readings, tmp_path / "out.csv")
    with path.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    assert len(rows) == 2
    assert rows[0]["utility_id"] == "ncwsc"
    assert rows[0]["value"] == "45.0"
    assert rows[0]["granularity"] == "utility"      # ride-along constant
    assert rows[0]["method"] == "measured"
    assert rows[0]["vintage"] == "FY2023/24"        # mirrors fy for WASREB
    assert "WASREB" in rows[0]["attribution"]
    assert rows[1]["value"] == ""                    # null -> empty, not "None"
    assert rows[1]["extraction_confidence"] == "low"

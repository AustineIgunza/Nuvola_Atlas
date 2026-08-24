from __future__ import annotations

import pytest

from pipeline.wasreb.extract import NormalisedReading
from pipeline.wasreb.spotcheck import (
    append_verdict,
    format_line,
    load_verdicts,
    sample,
)


def _readings(n: int) -> list[NormalisedReading]:
    return [
        NormalisedReading(
            utility_id=f"u{i}",
            utility_name=f"Utility {i}",
            county="Nairobi",
            fy="FY2023/24",
            indicator="non_revenue_water",
            value=float(i),
            unit="%",
            report_issue=17,
            page_ref=f"p{i}",
            extraction_confidence="high",
        )
        for i in range(n)
    ]


def test_sample_is_deterministic_for_a_seed():
    rs = _readings(100)
    a = sample(rs, n=10, seed=42)
    b = sample(rs, n=10, seed=42)
    assert [i.utility_id for i in a] == [i.utility_id for i in b]


def test_sample_is_different_between_seeds():
    rs = _readings(100)
    a = sample(rs, n=10, seed=42)
    b = sample(rs, n=10, seed=43)
    assert [i.utility_id for i in a] != [i.utility_id for i in b]


def test_sample_never_pads():
    rs = _readings(5)
    picked = sample(rs, n=30, seed=0)
    assert len(picked) == 5


def test_sample_of_empty_is_empty():
    assert sample([], n=30) == []


def test_format_line_shows_null_explicitly():
    (item,) = sample(_readings(1), n=1)
    item = item._replace(value=None) if hasattr(item, "_replace") else item
    # dataclass — rebuild rather than mutate
    from dataclasses import replace
    line = format_line(replace(item, value=None))
    assert "= null" in line


def test_verdict_round_trip(tmp_path):
    path = tmp_path / "verdicts.jsonl"
    append_verdict(path, {
        "utility_id": "ncwsc", "indicator": "non_revenue_water",
        "fy": "FY2023/24", "report_issue": 17,
        "value": 45.0, "page_ref": "p42",
        "verdict": "ok", "verifier": "austine",
        "verified_at": "2026-08-24", "notes": "cross-checked table 3.1",
    })
    (loaded,) = load_verdicts(path)
    assert loaded["verdict"] == "ok"
    assert loaded["verifier"] == "austine"


def test_verdict_rejects_missing_keys(tmp_path):
    with pytest.raises(ValueError, match="missing keys"):
        append_verdict(tmp_path / "v.jsonl", {"utility_id": "ncwsc"})


def test_verdict_rejects_bad_verdict_value(tmp_path):
    with pytest.raises(ValueError, match="ok\\|wrong\\|unclear"):
        append_verdict(tmp_path / "v.jsonl", {
            "utility_id": "x", "indicator": "y", "fy": "z", "report_issue": 1,
            "value": 0, "page_ref": "p1", "verdict": "great",
            "verifier": "x", "verified_at": "2026-08-24",
        })


def test_load_verdicts_missing_file_returns_empty(tmp_path):
    assert load_verdicts(tmp_path / "does_not_exist.jsonl") == []

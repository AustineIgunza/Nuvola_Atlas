"""Long-CSV writer for ``wasreb_impact_long.csv``.

Schema is fixed here — column order matters for reproducibility and for
anyone re-loading the file into pandas or R without column headers.
"""
from __future__ import annotations

import csv
from collections.abc import Iterable
from pathlib import Path

from pipeline.wasreb.extract import NormalisedReading

COLUMNS: tuple[str, ...] = (
    "utility_id",
    "utility_name",
    "county",
    "fy",
    "indicator",
    "value",
    "unit",
    "report_issue",
    "page_ref",
    "extraction_confidence",
    "notes",
)


def write_long_csv(readings: Iterable[NormalisedReading], path: str | Path) -> Path:
    """Write one row per reading in canonical column order."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(COLUMNS)
        for r in readings:
            writer.writerow([
                r.utility_id,
                r.utility_name,
                r.county,
                r.fy,
                r.indicator,
                "" if r.value is None else r.value,
                r.unit,
                r.report_issue,
                r.page_ref,
                r.extraction_confidence,
                r.notes or "",
            ])
    return p

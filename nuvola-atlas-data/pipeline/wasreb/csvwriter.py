"""Long-CSV writer for ``wasreb_impact_long.csv``.

Schema is fixed here — column order matches wasreb_impact17_long.csv so
the reconciled dataset round-trips through the pipeline without a rename
layer. Anyone re-loading the file into pandas or R keeps a stable header.
"""
from __future__ import annotations

import csv
from collections.abc import Iterable
from pathlib import Path

from pipeline.wasreb.extract import NormalisedReading

COLUMNS: tuple[str, ...] = (
    "utility_name",
    "size_category",
    "fy",
    "indicator",
    "value",
    "unit",
    "granularity",
    "method",
    "source_id",
    "report_issue",
    "vintage",
    "extraction_confidence",
    "attribution",
    "utility_id",
    "county",
    "page_ref",
    "notes",
)

# WASREB IMPACT rows are all utility-granularity, measured. These constants
# ride along on every emitted row rather than being duplicated on the
# NormalisedReading dataclass, which is source-format agnostic.
_GRANULARITY = "utility"
_METHOD = "measured"
_SOURCE_ID = "wasreb_impact_17"
_ATTRIBUTION = (
    "Water Services Regulatory Board (WASREB), IMPACT Report Issue 17, 2025"
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
                r.utility_name,
                r.size_category or "",
                r.fy,
                r.indicator,
                "" if r.value is None else r.value,
                r.unit,
                _GRANULARITY,
                _METHOD,
                _SOURCE_ID,
                r.report_issue,
                r.fy,           # vintage == fy for WASREB rows
                r.extraction_confidence,
                _ATTRIBUTION,
                r.utility_id,
                r.county or "",
                r.page_ref,
                r.notes or "",
            ])
    return p

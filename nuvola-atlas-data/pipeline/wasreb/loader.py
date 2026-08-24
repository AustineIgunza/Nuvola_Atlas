"""Read the reconciled WASREB IMPACT long CSV into NormalisedReading.

The externally-reconciled dataset (``wasreb_impact17_long.csv`` at repo
root) is the authoritative source for the WASREB pillar values. This
loader turns it into the pipeline's canonical record type so downstream
code (validate.py, emit.py, county_context) sees one shape regardless of
whether the reading came from a per-edition PDF extractor (P10 work) or
from the pre-reconciled long CSV.

Design choices:

- The loader is TOLERANT of unknown utility names — the CSV is
  self-authoritative for the label, and the county mapping is a metadata
  gap to close later, not a load failure. Strict resolution stays on the
  extractor path where labels come straight from a PDF.

- Values are read as-is. Plausibility gating happens in
  ``extract.normalise_readings`` (called here for consistency), which
  downgrades out-of-range to ``low`` confidence with a note rather than
  dropping.

- Rows with ``extraction_confidence == "low"`` are LOADED. Filtering
  them from public output is a downstream decision (per NAVUUNA_PROMPTS
  round 2 §P9 task 2), and dropping them here would hide the
  parser-quality signal.

- No implicit skips. A row we can't parse into a reading raises
  ``LoadError`` naming the row number, so the caller can fix the source
  rather than losing rows silently.
"""
from __future__ import annotations

import csv
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from pathlib import Path

from pipeline.wasreb.extract import ExtractionConfidence, NormalisedReading
from pipeline.wasreb.utilities import resolve_or_passthrough
from pipeline.wasreb.vocabulary import is_plausible, resolve_column

REQUIRED_COLUMNS: frozenset[str] = frozenset({
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
    "extraction_confidence",
})


class LoadError(ValueError):
    """A row could not be turned into a NormalisedReading."""


@dataclass(frozen=True)
class LoadStats:
    total_rows: int
    utilities: int
    indicators: int
    null_values: int
    confidence_counts: dict[str, int]
    out_of_range: int


def _parse_value(raw: str) -> float | None:
    """Blank cells are null. Anything else must parse as a number."""
    if raw is None or raw == "":
        return None
    try:
        return float(raw)
    except ValueError as e:
        raise LoadError(f"non-numeric value {raw!r}") from e


def _parse_confidence(raw: str) -> ExtractionConfidence:
    if raw not in {"high", "medium", "low"}:
        raise LoadError(f"extraction_confidence must be high|medium|low, got {raw!r}")
    return raw  # type: ignore[return-value]


def iter_readings(path: str | Path) -> Iterator[NormalisedReading]:
    """Stream the CSV row-by-row as NormalisedReading."""
    p = Path(path)
    with p.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        header = set(reader.fieldnames or [])
        missing = REQUIRED_COLUMNS - header
        if missing:
            raise LoadError(
                f"{p}: missing required column(s) {sorted(missing)}. "
                f"Header: {sorted(header)}"
            )

        for row_no, row in enumerate(reader, start=2):  # header is row 1
            try:
                indicator_def = resolve_column(row["indicator"])
                utility_def = resolve_or_passthrough(row["utility_name"])
                value = _parse_value(row["value"])
                confidence = _parse_confidence(row["extraction_confidence"])
                fy = row["fy"].strip()
                if not fy:
                    raise LoadError("fy is empty")
                issue = int(row["report_issue"])

                # Plausibility gate: keep the value, downgrade the flag,
                # add a note. Same policy as extract.normalise_readings so
                # downstream code doesn't have to know the origin.
                note = None
                if value is not None and not is_plausible(indicator_def.key, value):
                    flag = f"out-of-range value {value} for {indicator_def.key}"
                    if confidence != "low":
                        confidence = "low"
                        note = flag

                yield NormalisedReading(
                    utility_id=utility_def.utility_id,
                    utility_name=row["utility_name"].strip(),
                    county=utility_def.county or None,
                    fy=fy,
                    indicator=indicator_def.key,
                    value=value,
                    unit=indicator_def.unit,
                    report_issue=issue,
                    page_ref="",   # CSV rows carry no page ref; audit via manifest
                    extraction_confidence=confidence,
                    size_category=row.get("size_category") or None,
                    notes=note,
                )
            except (LoadError, KeyError, ValueError) as e:
                raise LoadError(f"{p}:row {row_no}: {e}") from e


def load(path: str | Path) -> list[NormalisedReading]:
    """Materialise the whole file. Prefer ``iter_readings`` for large inputs."""
    return list(iter_readings(path))


def summarise(readings: Iterable[NormalisedReading]) -> LoadStats:
    from collections import Counter

    rs = list(readings)
    utilities = {r.utility_id for r in rs}
    indicators = {r.indicator for r in rs}
    conf = Counter(r.extraction_confidence for r in rs)
    nulls = sum(1 for r in rs if r.value is None)
    oor = sum(
        1 for r in rs
        if r.value is not None and not is_plausible(r.indicator, r.value)
    )
    return LoadStats(
        total_rows=len(rs),
        utilities=len(utilities),
        indicators=len(indicators),
        null_values=nulls,
        confidence_counts=dict(conf),
        out_of_range=oor,
    )


def filter_for_county(
    readings: Iterable[NormalisedReading], county: str,
) -> list[NormalisedReading]:
    """Return the subset of readings for utilities in the given county.

    Used to build ``county_context`` for the Navuuna Atlas map — Nairobi
    County reads NCWSC's WASREB row and renders it in the banner ABOVE
    the sub-county bubbles (never on one).
    """
    return [r for r in readings if r.county == county]

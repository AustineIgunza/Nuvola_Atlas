"""Per-edition validation report.

Answers three questions:

    1. how many utilities and indicators were extracted?
    2. which pages failed extraction? (surfaced by the extractor)
    3. any values outside a plausible range?

Output is one dict per edition. Pipeline callers can print, JSON-dump,
or roll them up — this module doesn't opine on presentation.
"""
from __future__ import annotations

from collections import Counter
from collections.abc import Iterable
from dataclasses import asdict, dataclass, field
from typing import Any

from pipeline.wasreb.extract import NormalisedReading
from pipeline.wasreb.vocabulary import is_plausible


@dataclass(frozen=True)
class OutOfRange:
    utility_id: str
    indicator: str
    value: float
    page_ref: str


@dataclass
class EditionReport:
    issue: int
    fy: str
    utilities_seen: int
    indicators_seen: int
    total_readings: int
    null_readings: int
    confidence_counts: dict[str, int] = field(default_factory=dict)
    out_of_range: list[OutOfRange] = field(default_factory=list)
    failed_pages: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["out_of_range"] = [asdict(o) for o in self.out_of_range]
        return d


def build_report(
    readings: Iterable[NormalisedReading],
    *,
    issue: int,
    fy: str,
    failed_pages: Iterable[str] = (),
) -> EditionReport:
    rs = list(readings)
    utilities = {r.utility_id for r in rs}
    indicators = {r.indicator for r in rs}
    confidence = Counter(r.extraction_confidence for r in rs)
    nulls = sum(1 for r in rs if r.value is None)

    oor: list[OutOfRange] = []
    for r in rs:
        if r.value is None:
            continue
        if not is_plausible(r.indicator, r.value):
            oor.append(OutOfRange(
                utility_id=r.utility_id,
                indicator=r.indicator,
                value=r.value,
                page_ref=r.page_ref,
            ))

    return EditionReport(
        issue=issue,
        fy=fy,
        utilities_seen=len(utilities),
        indicators_seen=len(indicators),
        total_readings=len(rs),
        null_readings=nulls,
        confidence_counts=dict(confidence),
        out_of_range=oor,
        failed_pages=list(failed_pages),
    )

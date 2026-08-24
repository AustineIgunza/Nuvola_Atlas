"""Extractor protocol + registry.

One extractor per edition. They register themselves at import time by
calling ``register(issue, extractor)``. That means the CLI doesn't have
to know about individual editions; it just walks ``EDITIONS`` and looks
each one up.

An extractor is a callable that takes a path to the downloaded PDF and
yields ``RawReading`` objects — flat records untouched by the canonical
vocabulary. The vocabulary + utility resolvers are applied *after*, in
``normalise_readings``, so a bug in one extractor doesn't corrupt the
canonical layer.
"""
from __future__ import annotations

from collections.abc import Callable, Iterable, Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Final, Literal

from pipeline.wasreb.utilities import resolve_utility
from pipeline.wasreb.vocabulary import is_plausible, resolve_column

ExtractionConfidence = Literal["high", "medium", "low"]


@dataclass(frozen=True)
class RawReading:
    """One utility/column value as pulled from the PDF, pre-normalisation.

    ``utility_label`` and ``column_label`` are the raw strings from the
    report — the resolver turns them into canonical ids downstream.
    """

    utility_label: str
    column_label: str
    value: float | None
    page_ref: str                         # e.g. "p42", "p42:row-7"
    extraction_confidence: ExtractionConfidence
    notes: str | None = None


@dataclass(frozen=True)
class NormalisedReading:
    """A RawReading after canonical-vocabulary + utility resolution.

    ``size_category`` mirrors WASREB's own tiering (Very Large / Large /
    Medium / Small / Private). Kept as a free-text string so a new tier
    or a rewording doesn't force a schema migration — the loader carries
    whatever the source file says.

    ``county`` may be ``None`` for a utility whose county mapping is not
    yet in ``pipeline.wasreb.utilities``. The reconciled CSV is
    self-authoritative for utility_name and indicator, so a missing county
    is a metadata gap to fill later, not a load failure.

    ``page_ref`` is empty for CSV-sourced readings — the audit reference
    is the source file + row number, tracked separately on the manifest.
    """

    utility_id: str
    utility_name: str
    county: str | None
    fy: str
    indicator: str                        # canonical key
    value: float | None
    unit: str
    report_issue: int
    page_ref: str
    extraction_confidence: ExtractionConfidence
    size_category: str | None = None
    notes: str | None = None


Extractor = Callable[[Path], Iterable[RawReading]]


_REGISTRY: Final[dict[int, Extractor]] = {}


def register(issue: int, extractor: Extractor) -> Extractor:
    """Decorator-friendly registration. Second call for an issue overrides."""
    _REGISTRY[issue] = extractor
    return extractor


def has_extractor(issue: int) -> bool:
    return issue in _REGISTRY


def get_extractor(issue: int) -> Extractor:
    if issue not in _REGISTRY:
        raise KeyError(
            f"no extractor registered for IMPACT issue #{issue}. "
            f"Add pipeline.wasreb.extractors.issue_{issue:02d} and register it."
        )
    return _REGISTRY[issue]


def registered_issues() -> tuple[int, ...]:
    return tuple(sorted(_REGISTRY))


def normalise_readings(
    raws: Iterable[RawReading], *, issue: int, fy: str,
) -> Iterator[NormalisedReading]:
    """Apply the vocabulary + utility resolvers to a stream of raw readings.

    Anything the resolvers reject raises loudly with the offending label
    named — that is the whole point of the resolver layer. Values outside
    a plausible range are downgraded to ``low`` confidence with a note,
    not dropped, because a wrong number in the source is a finding the
    downstream open publication should show flagged rather than hide.
    """
    for raw in raws:
        indicator = resolve_column(raw.column_label)
        utility = resolve_utility(raw.utility_label)

        confidence: ExtractionConfidence = raw.extraction_confidence
        note = raw.notes
        if raw.value is not None and not is_plausible(indicator.key, raw.value):
            confidence = "low"
            flag = f"out-of-range value {raw.value} for {indicator.key}"
            note = f"{note}; {flag}" if note else flag

        yield NormalisedReading(
            utility_id=utility.utility_id,
            utility_name=utility.display_name,
            county=utility.county,
            fy=fy,
            indicator=indicator.key,
            value=raw.value,
            unit=indicator.unit,
            report_issue=issue,
            page_ref=raw.page_ref,
            extraction_confidence=confidence,
            notes=note,
        )

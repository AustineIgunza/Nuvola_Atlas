"""Column-header -> canonical indicator resolver + plausible-value ranges.

Every column WASREB reports on a utility line maps into one of the keys
below. Ranges are used by validate.py to flag physically impossible
values (a percentage above 100, hours per day above 24) — the ranges are
generous on purpose; they exist to catch parser errors, not to opine on
utility performance.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class WasrebIndicator:
    key: str                # matches pipeline.indicators.INDICATORS keys
    display_name: str
    unit: str
    lo: float | None        # inclusive lower bound of plausible range
    hi: float | None        # inclusive upper bound
    aliases: tuple[str, ...] = ()


VOCABULARY: Final[tuple[WasrebIndicator, ...]] = (
    WasrebIndicator(
        key="wasreb_non_revenue_water",
        display_name="Non-revenue water",
        unit="pct",
        lo=0.0, hi=100.0,
        aliases=(
            "Non-Revenue Water",
            "Non Revenue Water",
            "NRW",
            "NRW %",
            "Non-Revenue Water (%)",
        ),
    ),
    WasrebIndicator(
        key="wasreb_hours_of_supply",
        display_name="Hours of supply",
        unit="hours_per_day",
        lo=0.0, hi=24.0,
        aliases=(
            "Hours of Supply",
            "Hours of Supply (hrs/day)",
            "Average Hours of Supply",
            "Hrs of Supply",
        ),
    ),
    WasrebIndicator(
        key="wasreb_metering_ratio",
        display_name="Metering ratio",
        unit="pct",
        lo=0.0, hi=100.0,
        aliases=("Metering Ratio", "Metering", "Metered Connections (%)"),
    ),
    WasrebIndicator(
        key="wasreb_revenue_collection",
        display_name="Revenue collection efficiency",
        unit="pct",
        lo=0.0, hi=200.0,   # >100% happens when arrears are settled; still <200
        aliases=(
            "Revenue Collection",
            "Revenue Collection Efficiency",
            "Collection Efficiency",
        ),
    ),
    WasrebIndicator(
        key="wasreb_om_cost_coverage",
        display_name="O&M cost coverage",
        unit="pct",
        lo=0.0, hi=500.0,
        aliases=(
            "O&M Cost Coverage",
            "O and M Cost Coverage",
            "Operations & Maintenance Cost Coverage",
            "OM Cost Coverage",
        ),
    ),
    WasrebIndicator(
        key="wasreb_water_quality",
        display_name="Drinking water quality",
        unit="pct",
        lo=0.0, hi=100.0,
        aliases=("Drinking Water Quality", "Water Quality", "Compliance"),
    ),
    WasrebIndicator(
        key="wasreb_staff_productivity",
        display_name="Staff productivity",
        unit="staff_per_1000_conn",
        lo=0.0, hi=50.0,
        aliases=(
            "Staff Productivity",
            "Staff per 1,000 Connections",
            "Staff per 1000 Connections",
        ),
    ),
    WasrebIndicator(
        key="wasreb_water_coverage",
        display_name="Water coverage",
        unit="pct",
        lo=0.0, hi=100.0,
        aliases=("Water Coverage", "Coverage", "Water Service Coverage"),
    ),
)


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower().rstrip(".,;:")


_LOOKUP: Final[dict[str, WasrebIndicator]] = {}
for _ind in VOCABULARY:
    _LOOKUP[_norm(_ind.display_name)] = _ind
    _LOOKUP[_ind.key] = _ind
    for alias in _ind.aliases:
        _LOOKUP[_norm(alias)] = _ind


def resolve_column(header: str) -> WasrebIndicator:
    """Return the canonical indicator this column header refers to.

    Raises ``KeyError`` for unknown labels — never silently accept a new
    one, or the vocabulary drifts.
    """
    key = _norm(header)
    if key in _LOOKUP:
        return _LOOKUP[key]
    raise KeyError(
        f"unknown WASREB column {header!r}. Add it to "
        f"pipeline.wasreb.vocabulary.VOCABULARY as an alias before parsing."
    )


def is_plausible(indicator_key: str, value: float) -> bool:
    ind = next((i for i in VOCABULARY if i.key == indicator_key), None)
    if ind is None or ind.lo is None or ind.hi is None:
        return True
    return ind.lo <= value <= ind.hi

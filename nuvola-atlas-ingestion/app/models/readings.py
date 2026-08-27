"""Pydantic models for pillar readings.

The taxonomy is the pillar registry — `pillars.json` at the repo root,
generated into `app/models/pillars_generated.py`. There is no separate
indicator layer: a reading names a pillar, and only pillars the registry
lists as live are accepted.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

from app.models.pillars_generated import PILLAR_KEYS, RETIRED_PILLAR_KEYS


def _live_pillar(key: str) -> str:
    if key in RETIRED_PILLAR_KEYS:
        raise ValueError(f"pillar {key!r} is switched off and cannot be ingested")
    if key not in PILLAR_KEYS:
        raise ValueError(f"unknown pillar {key!r}")
    return key


PillarKeyField = Annotated[str, AfterValidator(_live_pillar)]


class Coordinate(BaseModel):
    """WGS84 coordinate (EPSG:4326). Longitude first, latitude second."""

    model_config = ConfigDict(frozen=True)

    lon: float = Field(ge=-180, le=180)
    lat: float = Field(ge=-90, le=90)


class PillarReading(BaseModel):
    """A single pillar observation for a sub-county."""

    zone_id: str
    pillar: PillarKeyField
    value: float
    unit: str
    observed_at: datetime
    source: str
    field_verified: bool = False
    centroid: Coordinate | None = None


class ReadingBatch(BaseModel):
    """A batch of readings — the payload posted to the ingest endpoint."""

    batch_id: str
    submitted_at: datetime
    readings: list[PillarReading]


# --- WASREB (P9 §Task 2) ---------------------------------------------------
#
# WASREB IMPACT rows are utility- or county-granularity, never sub-county;
# they land in the backend `county_context` table via
# POST /api/v1/internal/county-context, not on a zone. All WASREB indicators
# belong to the water_sanitation pillar (the only pillar the regulator
# reports against).
#
# Plausibility bounds are copied from `pipeline.wasreb.vocabulary` — the
# data package is not on the ingestion service's import path. The
# `test_wasreb_bounds_match_vocabulary` smoke test in
# nuvola-atlas-data/tests/ catches drift by comparing both sources at CI
# time (added in this same slice, on the data-package side).

WASREB_INDICATOR_BOUNDS: dict[str, tuple[float, float]] = {
    "non_revenue_water": (0.0, 100.0),
    "hours_of_supply": (0.0, 24.0),
    "metering_ratio": (0.0, 100.0),
    "revenue_collection_eff": (0.0, 200.0),
    "om_cost_coverage": (0.0, 500.0),
    "personnel_exp_share": (0.0, 100.0),
    "drinking_water_quality": (0.0, 100.0),
    "staff_per_1000_connections": (0.0, 50.0),
    "water_coverage": (0.0, 100.0),
    "total_score": (0.0, 200.0),
}

WASREB_INDICATOR_KEYS = tuple(WASREB_INDICATOR_BOUNDS.keys())

WasrebIndicator = Literal[
    "non_revenue_water",
    "hours_of_supply",
    "metering_ratio",
    "revenue_collection_eff",
    "om_cost_coverage",
    "personnel_exp_share",
    "drinking_water_quality",
    "staff_per_1000_connections",
    "water_coverage",
    "total_score",
]

Granularity = Literal["county", "utility", "national"]
Method = Literal["measured", "imputed", "proxy", "gap"]
ExtractionConfidence = Literal["high", "medium", "low"]


class WasrebReading(BaseModel):
    """One row from a WASREB IMPACT dataset, ready for county_context intake.

    Envelope matches R2 amendment 4:
      - method='gap' ⇒ value is None (R1)
      - non-gap ⇒ source_id and vintage required
      - value must sit inside the indicator's plausibility bounds; a whole
        batch is rejected on any breach rather than clamped, per P9
    """

    model_config = ConfigDict(frozen=True)

    county: str = Field(min_length=1, max_length=64)
    utility_name: str = Field(min_length=1, max_length=96)
    size_category: Literal[
        "Very Large", "Large", "Medium", "Small", "Private"
    ]
    indicator: WasrebIndicator
    value: float | None
    unit: str = Field(min_length=1, max_length=16)
    granularity: Granularity
    method: Method
    source_id: str | None = None
    report_issue: int = Field(ge=1, le=99)
    vintage: str | None = Field(default=None, max_length=32)
    extraction_confidence: ExtractionConfidence
    attribution: str = Field(min_length=1)
    retrieved: date
    page_ref: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def _check_invariants(self) -> WasrebReading:
        if self.method == "gap":
            if self.value is not None:
                raise ValueError(
                    f"R1 breach: method='gap' but value is not null "
                    f"(indicator {self.indicator!r})"
                )
        else:
            if not self.source_id:
                raise ValueError(
                    f"non-gap reading for {self.indicator!r} needs source_id"
                )
            if not self.vintage:
                raise ValueError(
                    f"non-gap reading for {self.indicator!r} needs vintage"
                )
            if self.value is None:
                raise ValueError(
                    f"non-gap reading for {self.indicator!r} needs a value"
                )
            lo, hi = WASREB_INDICATOR_BOUNDS[self.indicator]
            if not (lo <= self.value <= hi):
                raise ValueError(
                    f"{self.indicator} value {self.value} out of plausible "
                    f"range [{lo}, {hi}]; whole batch rejected rather than "
                    f"clamped"
                )
        return self


class WasrebBatch(BaseModel):
    """A batch of WASREB IMPACT rows."""

    model_config = ConfigDict(frozen=True)

    batch_id: str = Field(min_length=1)
    submitted_at: datetime
    readings: list[WasrebReading] = Field(min_length=1)

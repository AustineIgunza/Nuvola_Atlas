"""Pydantic models for pillar readings.

The taxonomy is the pillar registry — `pillars.json` at the repo root,
generated into `app/models/pillars_generated.py`. There is no separate
indicator layer: a reading names a pillar, and only pillars the registry
lists as live are accepted.
"""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

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

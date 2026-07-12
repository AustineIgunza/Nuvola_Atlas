"""Pydantic models for the 12 Daystar indicators.

Field names, pillar assignments, and IDs match the frontend's
`nuvola-atlas-frontend/src/lib/indicators.ts`. Keep both in sync when the
indicator taxonomy changes.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class PillarKey(str, Enum):
    social = "social"
    safety = "safety"
    density = "density"
    infra = "infra"


class IndicatorKey(str, Enum):
    healthcare_access = "healthcare_access"
    education_access = "education_access"
    digital_connectivity = "digital_connectivity"
    crime_rates = "crime_rates"
    emergency_response = "emergency_response"
    disaster_exposure = "disaster_exposure"
    population_density = "population_density"
    congestion = "congestion"
    housing_pressure = "housing_pressure"
    road_quality = "road_quality"
    energy_reliability = "energy_reliability"
    waste_management = "waste_management"


INDICATOR_PILLAR: dict[IndicatorKey, PillarKey] = {
    IndicatorKey.healthcare_access: PillarKey.social,
    IndicatorKey.education_access: PillarKey.social,
    IndicatorKey.digital_connectivity: PillarKey.social,
    IndicatorKey.crime_rates: PillarKey.safety,
    IndicatorKey.emergency_response: PillarKey.safety,
    IndicatorKey.disaster_exposure: PillarKey.safety,
    IndicatorKey.population_density: PillarKey.density,
    IndicatorKey.congestion: PillarKey.density,
    IndicatorKey.housing_pressure: PillarKey.density,
    IndicatorKey.road_quality: PillarKey.infra,
    IndicatorKey.energy_reliability: PillarKey.infra,
    IndicatorKey.waste_management: PillarKey.infra,
}


class Coordinate(BaseModel):
    """WGS84 coordinate (EPSG:4326). Longitude first, latitude second."""

    model_config = ConfigDict(frozen=True)

    lon: float = Field(ge=-180, le=180)
    lat: float = Field(ge=-90, le=90)


class IndicatorReading(BaseModel):
    """A single indicator observation for a zone."""

    zone_id: str
    indicator: IndicatorKey
    value: float
    unit: str
    observed_at: datetime
    source: str = Field(default="daystar")
    field_verified: bool = False
    centroid: Coordinate | None = None

    @property
    def pillar(self) -> PillarKey:
        return INDICATOR_PILLAR[self.indicator]


class IndicatorBatch(BaseModel):
    """A batch of readings — the payload Daystar POSTs to /ingest/indicators."""

    batch_id: str
    submitted_at: datetime
    readings: list[IndicatorReading]

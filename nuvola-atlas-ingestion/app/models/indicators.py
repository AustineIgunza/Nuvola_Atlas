"""Pydantic models for the 13 Daystar indicators.

Post the July 2026 pillars → indicators schema swap the taxonomy is 13
indicators grouped under 4 pillars. Field names and pillar assignments
line up exactly with the Laravel `config/methodology.php` and the
frontend `nuvola-atlas-frontend/src/lib/indicators.ts` — keep all three
in sync when the taxonomy changes.
"""
from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class PillarKey(StrEnum):
    social = "social"
    safety = "safety"
    density = "density"
    infra = "infra"


class IndicatorKey(StrEnum):
    healthcare_access = "healthcare_access"
    education_access = "education_access"
    digital_connectivity = "digital_connectivity"
    crime_rates = "crime_rates"
    emergency_response_access = "emergency_response_access"
    disaster_exposure = "disaster_exposure"
    population_density = "population_density"
    congestion = "congestion"
    housing_pressure = "housing_pressure"
    road_quality = "road_quality"
    energy_reliability = "energy_reliability"
    food_risk = "food_risk"
    waste_management = "waste_management"


INDICATOR_PILLAR: dict[IndicatorKey, PillarKey] = {
    IndicatorKey.healthcare_access: PillarKey.social,
    IndicatorKey.education_access: PillarKey.social,
    IndicatorKey.digital_connectivity: PillarKey.social,
    IndicatorKey.crime_rates: PillarKey.safety,
    IndicatorKey.emergency_response_access: PillarKey.safety,
    IndicatorKey.disaster_exposure: PillarKey.safety,
    IndicatorKey.population_density: PillarKey.density,
    IndicatorKey.congestion: PillarKey.density,
    IndicatorKey.housing_pressure: PillarKey.density,
    IndicatorKey.road_quality: PillarKey.infra,
    IndicatorKey.energy_reliability: PillarKey.infra,
    IndicatorKey.food_risk: PillarKey.infra,
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

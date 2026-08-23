"""Normalises incoming reading batches before they hit the Laravel API.

Guarantees on the output stream:

* Timestamps are ISO-8601 UTC (`Z` suffix).
* Coordinates are WGS84 (EPSG:4326), longitude first.
* Rows missing zone_id, pillar, value, or observed_at are dropped.
* Rows naming a switched-off pillar are dropped.
* Nulls in optional fields normalise to sensible defaults.

Rejected rows return alongside cleaned rows so the caller can log them into
the append-only `data_ingestion_logs` table on the Laravel side.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from dateutil import parser as date_parser

from app.models.pillars_generated import PILLAR_KEYS, RETIRED_PILLAR_KEYS
from app.models.readings import Coordinate, PillarReading


@dataclass
class CleaningResult:
    cleaned: list[PillarReading]
    rejected: list[dict[str, Any]]


def _to_utc(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        try:
            dt = date_parser.isoparse(str(value))
        except (ValueError, TypeError):
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def _coerce_coordinate(raw: Any) -> Coordinate | None:
    if raw is None:
        return None
    try:
        if isinstance(raw, dict):
            # Feeds are inconsistent about lon vs lng; accept either.
            lon_raw = raw["lon"] if "lon" in raw else raw["lng"]
            lon = float(lon_raw)
            lat = float(raw["lat"])
        elif isinstance(raw, list | tuple) and len(raw) == 2:
            lon, lat = float(raw[0]), float(raw[1])
        else:
            return None
        return Coordinate(lon=lon, lat=lat)
    except (TypeError, ValueError, KeyError):
        return None


def clean_reading_row(raw: dict[str, Any]) -> PillarReading | dict[str, Any]:
    """Return a PillarReading if the row is valid; the original dict + reason otherwise."""
    zone_id = str(raw.get("zone_id") or "").strip()
    pillar = str(raw.get("pillar") or "").strip()
    value = raw.get("value")
    source = str(raw.get("source") or "").strip()
    observed_at = _to_utc(raw.get("observed_at"))

    if not zone_id:
        return {**raw, "_reject_reason": "missing zone_id"}
    if pillar in RETIRED_PILLAR_KEYS:
        return {**raw, "_reject_reason": f"switched-off pillar: {pillar!r}"}
    if pillar not in PILLAR_KEYS:
        return {**raw, "_reject_reason": f"unknown pillar: {pillar!r}"}
    if value is None:
        return {**raw, "_reject_reason": "missing value"}
    try:
        value_f = float(value)
    except (TypeError, ValueError):
        return {**raw, "_reject_reason": "value not numeric"}
    if observed_at is None:
        return {**raw, "_reject_reason": "missing/invalid observed_at"}
    # Provenance is not optional: every value the record publishes has to be
    # attributable to a named source (refocus rule 2).
    if not source:
        return {**raw, "_reject_reason": "missing source"}

    return PillarReading(
        zone_id=zone_id,
        pillar=pillar,
        value=value_f,
        unit=str(raw.get("unit") or ""),
        observed_at=observed_at,
        source=source,
        field_verified=bool(raw.get("field_verified") or False),
        centroid=_coerce_coordinate(raw.get("centroid")),
    )


def clean_batch(rows: list[dict[str, Any]]) -> CleaningResult:
    cleaned: list[PillarReading] = []
    rejected: list[dict[str, Any]] = []
    for row in rows:
        result = clean_reading_row(row)
        if isinstance(result, PillarReading):
            cleaned.append(result)
        else:
            rejected.append(result)
    return CleaningResult(cleaned=cleaned, rejected=rejected)

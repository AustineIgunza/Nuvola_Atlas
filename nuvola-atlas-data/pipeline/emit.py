"""Emit ``nairobi_vitality.geojson``.

Two rules make this file the contract instead of a suggestion:

    R1  method == 'gap'         => value MUST be null
    R2  granularity != 'subcounty' => value goes in county_context,
                                       NEVER in feature.properties

R1 is enforced at the value site (``ProvenanceValue.__post_init__``).
R2 is enforced here, on the way out. Between them, the emitter cannot
publish a utility figure spread across 17 sub-counties, which is the
category of mistake this whole rewrite exists to prevent.

Frontend contract note — the current React `Zone` type at
``nuvola-atlas-frontend/src/types/index.ts`` reads
``pillars: Record<PillarKey, number | null>``. The emitter produces the
richer ``pillars: Record<PillarKey, ProvenanceValue>``; P5 lifts the
frontend to read ``pillars.<key>.value`` and display the surrounding
source + vintage as small secondary text. Everything else on the feature
(``id``, ``name``, ``score``, ``centroid``, ``missingPillars``,
``lastSyncMin``) matches ``Zone`` exactly.
"""
from __future__ import annotations

import json
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from pipeline.indicators import ProvenanceValue
from pipeline.pillars_generated import (
    PILLAR_KEYS,
    PILLAR_REGISTRY_VERSION,
    PILLARS_BY_KEY,
    RETIRED_PILLAR_KEYS,
)


@dataclass(frozen=True)
class SubcountyFeature:
    """One sub-county, its geometry, and its measured pillars.

    ``pillars`` is a mapping ``pillar_key -> ProvenanceValue``. Keys not
    present here render as a client-side gap in the UI; that is different
    from a pillar the emitter observed as absent, which should be listed
    in ``missing_pillars`` instead — a declared finding.
    """

    id: str
    name: str
    geometry: dict[str, Any]
    centroid: tuple[float, float]
    pillars: Mapping[str, ProvenanceValue] = field(default_factory=dict)
    missing_pillars: tuple[str, ...] = ()
    score: float | None = None
    last_sync_min: int | None = None


class EmitRuleViolation(ValueError):
    """A pillar reading violated one of the two emitter invariants."""


def _validate_feature_pillars(feature: SubcountyFeature) -> None:
    for key, reading in feature.pillars.items():
        if key in RETIRED_PILLAR_KEYS:
            raise EmitRuleViolation(
                f"[{feature.id}] pillar {key!r} is retired; it must not carry a reading."
            )
        if key not in PILLARS_BY_KEY:
            raise EmitRuleViolation(
                f"[{feature.id}] unknown pillar {key!r}. Add it to pillars.json first."
            )
        # R2: nothing that isn't sub-county granularity may sit on a feature.
        if reading.granularity != "subcounty":
            raise EmitRuleViolation(
                f"[{feature.id}] pillar {key!r} carries granularity "
                f"{reading.granularity!r}. Utility/county/national values belong "
                f"in county_context, not on a sub-county bubble."
            )
        # R1 is already enforced inside ProvenanceValue.__post_init__, but we
        # re-check here so a caller that constructs the dataclass with
        # dataclasses.replace() can't sneak a value past it.
        if reading.method == "gap" and reading.value is not None:
            raise EmitRuleViolation(
                f"[{feature.id}] pillar {key!r} has method='gap' but value is not null."
            )


def _validate_county_context(context: Mapping[str, Iterable[ProvenanceValue]]) -> None:
    for pillar_key, readings in context.items():
        if pillar_key in RETIRED_PILLAR_KEYS:
            raise EmitRuleViolation(
                f"county_context references retired pillar {pillar_key!r}."
            )
        for reading in readings:
            if reading.granularity == "subcounty":
                raise EmitRuleViolation(
                    f"county_context pillar {pillar_key!r} indicator "
                    f"{reading.indicator!r} is granularity 'subcounty'. "
                    f"Sub-county values belong on their feature, not in the banner."
                )


def _feature_dict(feature: SubcountyFeature) -> dict[str, Any]:
    pillars_out: dict[str, dict[str, Any] | None] = {}
    for key in PILLAR_KEYS:
        reading = feature.pillars.get(key)
        pillars_out[key] = reading.to_dict() if reading is not None else None

    return {
        "type": "Feature",
        "geometry": feature.geometry,
        "properties": {
            "id": feature.id,
            "name": feature.name,
            "score": feature.score,
            "pillars": pillars_out,
            "missingPillars": list(feature.missing_pillars),
            "centroid": [feature.centroid[0], feature.centroid[1]],
            "lastSyncMin": feature.last_sync_min,
        },
    }


def build_geojson(
    features: Iterable[SubcountyFeature],
    county_context: Mapping[str, Iterable[ProvenanceValue]] | None = None,
    *,
    generated_at: str | None = None,
) -> dict[str, Any]:
    """Build the FeatureCollection dict. Raises ``EmitRuleViolation`` on breach."""
    feature_list = list(features)
    for f in feature_list:
        _validate_feature_pillars(f)

    context = county_context or {}
    _validate_county_context({k: list(v) for k, v in context.items()})

    when = generated_at or datetime.now(UTC).isoformat(timespec="seconds")

    return {
        "type": "FeatureCollection",
        "generated_at": when,
        "registry_version": PILLAR_REGISTRY_VERSION,
        "county_context": {
            k: [v.to_dict() for v in vs] for k, vs in context.items()
        },
        "features": [_feature_dict(f) for f in feature_list],
    }


def write_geojson(
    features: Iterable[SubcountyFeature],
    county_context: Mapping[str, Iterable[ProvenanceValue]] | None,
    output_path: str | Path,
    *,
    generated_at: str | None = None,
) -> Path:
    fc = build_geojson(features, county_context, generated_at=generated_at)
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(fc, indent=2), encoding="utf-8")
    return path

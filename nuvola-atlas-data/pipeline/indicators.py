"""Provenance schema and the canonical indicator vocabulary.

Every value the pipeline emits carries the fields on ``ProvenanceValue``.
That is not decoration — the two invariants enforced in ``__post_init__``
are what stop the emitter from ever publishing a number without receipts.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Final, Literal

Granularity = Literal["subcounty", "county", "utility", "national"]
Method = Literal["measured", "proxy", "gap"]

_GRANULARITIES: Final[frozenset[Granularity]] = frozenset(
    ("subcounty", "county", "utility", "national")
)
_METHODS: Final[frozenset[Method]] = frozenset(("measured", "proxy", "gap"))


@dataclass(frozen=True)
class ProvenanceValue:
    """One indicator reading and the receipts behind it.

    Invariants (enforced in ``__post_init__``):
    - ``method == 'gap'`` forces ``value is None``. A gap is a finding, not a
      hole to plug with zero.
    - ``method != 'gap'`` requires ``source_id`` and ``vintage``. A number
      without either cannot be defended.
    """

    value: float | int | None
    unit: str
    indicator: str
    granularity: Granularity
    method: Method
    source_id: str | None
    vintage: str | None
    retrieved: str
    page_ref: str | None = None
    notes: str | None = None

    def __post_init__(self) -> None:
        if self.granularity not in _GRANULARITIES:
            raise ValueError(f"unknown granularity: {self.granularity!r}")
        if self.method not in _METHODS:
            raise ValueError(f"unknown method: {self.method!r}")
        if self.method == "gap" and self.value is not None:
            raise ValueError(
                "method='gap' requires value=None; "
                "a gap is a finding, not a zero to render."
            )
        if self.method != "gap":
            if not self.source_id:
                raise ValueError(f"measured/proxy value for {self.indicator!r} needs source_id")
            if not self.vintage:
                raise ValueError(f"measured/proxy value for {self.indicator!r} needs vintage")
        # Retrieval is a date, not a timestamp — keep it a plain YYYY-MM-DD string.
        date.fromisoformat(self.retrieved)

    def to_dict(self) -> dict:
        out = asdict(self)
        # Drop keys that are None on the way out; keeps the geojson tidy and
        # lets callers tell "not provided" from "explicit null value".
        return {k: v for k, v in out.items() if v is not None or k == "value"}


@dataclass(frozen=True)
class IndicatorDef:
    """Canonical vocabulary entry. Change this file, not the raw sources."""

    key: str
    display_name: str
    unit: str
    granularity: Granularity
    pillar_key: str
    description: str = ""
    aliases: tuple[str, ...] = field(default_factory=tuple)


# One dict of indicators, one place. New sources map their column headers into
# these keys; nothing else in the pipeline should carry a raw source label.
INDICATORS: Final[tuple[IndicatorDef, ...]] = (
    IndicatorDef(
        key="water_source_piped_share",
        display_name="Piped water share",
        unit="pct",
        granularity="subcounty",
        pillar_key="water_sanitation",
        description="Share of households whose main water source is piped water.",
        aliases=("piped_water_pct", "main_water_source_piped"),
    ),
    IndicatorDef(
        key="sanitation_improved_share",
        display_name="Improved sanitation share",
        unit="pct",
        granularity="subcounty",
        pillar_key="water_sanitation",
        description="Share of households using an improved toilet facility per JMP.",
        aliases=("improved_toilet_pct",),
    ),
    # WASREB IMPACT indicators. Keys match wasreb_impact17_long.csv verbatim so
    # the reconciled dataset ingests without a rename layer; the wider registry
    # (Laravel/frontend) reads these through the pillar_key mapping, not the
    # indicator key directly.
    IndicatorDef(
        key="non_revenue_water",
        display_name="Non-revenue water",
        unit="%",
        granularity="utility",
        pillar_key="water_sanitation",
        description="WASREB IMPACT: share of water produced that is not billed.",
        aliases=("nrw", "wasreb_non_revenue_water"),
    ),
    IndicatorDef(
        key="hours_of_supply",
        display_name="Hours of supply",
        unit="hrs/day",
        granularity="utility",
        pillar_key="water_sanitation",
        aliases=("hours_supply", "wasreb_hours_of_supply"),
    ),
    IndicatorDef(
        key="metering_ratio",
        display_name="Metering ratio",
        unit="%",
        granularity="utility",
        pillar_key="water_sanitation",
        aliases=("wasreb_metering_ratio",),
    ),
    IndicatorDef(
        key="revenue_collection_eff",
        display_name="Revenue collection efficiency",
        unit="%",
        granularity="utility",
        pillar_key="water_sanitation",
        aliases=("wasreb_revenue_collection",),
    ),
    IndicatorDef(
        key="om_cost_coverage",
        display_name="O&M cost coverage",
        unit="%",
        granularity="utility",
        pillar_key="water_sanitation",
        aliases=("wasreb_om_cost_coverage",),
    ),
    IndicatorDef(
        key="personnel_exp_share",
        display_name="Personnel expenditure share",
        unit="%",
        granularity="utility",
        pillar_key="water_sanitation",
        description="Share of total operating cost spent on personnel — WASREB efficiency proxy.",
    ),
    IndicatorDef(
        key="drinking_water_quality",
        display_name="Drinking water quality",
        unit="%",
        granularity="utility",
        pillar_key="water_sanitation",
        aliases=("wasreb_water_quality",),
    ),
    IndicatorDef(
        key="staff_per_1000_connections",
        display_name="Staff per 1,000 connections",
        unit="staff/1000 conns",
        granularity="utility",
        pillar_key="water_sanitation",
        aliases=("wasreb_staff_productivity",),
    ),
    IndicatorDef(
        key="water_coverage",
        display_name="Water coverage",
        unit="%",
        granularity="utility",
        pillar_key="water_sanitation",
        aliases=("wasreb_water_coverage",),
    ),
    IndicatorDef(
        key="total_score",
        display_name="WASREB overall score",
        unit="points (max 200)",
        granularity="utility",
        pillar_key="water_sanitation",
        description="WASREB composite score, 0-200 points, for the utility's overall performance.",
    ),
    IndicatorDef(
        key="road_density_km_per_km2",
        display_name="Road density",
        unit="km_per_km2",
        granularity="subcounty",
        pillar_key="road_density",
        description="Kilometres of mapped road per square kilometre of sub-county.",
    ),
    IndicatorDef(
        key="transit_pop_within_500m",
        display_name="Population within 500 m of a matatu stop",
        unit="pct",
        granularity="subcounty",
        pillar_key="transit_access",
    ),
    IndicatorDef(
        key="electricity_lighting_share",
        display_name="Electricity for lighting",
        unit="pct",
        granularity="subcounty",
        pillar_key="electricity_access",
        description="KNBS 2019 census: households using electricity for lighting.",
    ),
)


INDICATORS_BY_KEY: Final[dict[str, IndicatorDef]] = {i.key: i for i in INDICATORS}


def resolve_indicator(name: str) -> IndicatorDef:
    """Look up an indicator by its canonical key or any known alias.

    Raises ``KeyError`` when the name is not in the vocabulary — surfacing the
    unknown label loudly is the point, since silently accepting a new one is
    how the vocabulary drifts.
    """
    if name in INDICATORS_BY_KEY:
        return INDICATORS_BY_KEY[name]
    for defn in INDICATORS:
        if name in defn.aliases:
            return defn
    raise KeyError(f"unknown indicator {name!r}; add it to pipeline.indicators")

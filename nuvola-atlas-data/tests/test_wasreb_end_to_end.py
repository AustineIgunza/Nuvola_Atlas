"""End-to-end proof: reconciled CSV -> ProvenanceValue -> emit county_context.

This test wires the whole WASREB pillar through the pipeline against the
real repo-root file, so a change that breaks the contract fails here
rather than in production. The invariant it holds is the R2 rule from
NAVUUNA_REFOCUS_WORKFLOW.md and NAVUUNA_PROMPTS_ROUND2.md §P9:

    WASREB values are utility-granularity and must land in
    county_context, NEVER on a sub-county feature.

If this file grows a symbol-not-found error, run the pipeline once:

    cd nuvola-atlas-data
    python -m pytest tests/test_wasreb_end_to_end.py -v
"""
from __future__ import annotations

from pathlib import Path

import pytest

from pipeline.emit import EmitRuleViolation, SubcountyFeature, build_geojson
from pipeline.indicators import ProvenanceValue
from pipeline.manifests import load_manifest, sha256_of
from pipeline.wasreb.loader import filter_for_county, load, summarise

REPO_ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = REPO_ROOT / "wasreb_impact17_long.csv"
MANIFEST_PATH = Path(__file__).resolve().parents[1] / "manifests" / "wasreb_impact_17_long_csv.yaml"


pytestmark = pytest.mark.skipif(
    not CSV_PATH.exists(),
    reason=f"reconciled WASREB CSV not present at {CSV_PATH}",
)


def test_manifest_sha256_matches_the_file_on_disk():
    """Any change to the CSV bytes must land alongside a manifest bump."""
    manifest = load_manifest(MANIFEST_PATH)
    assert manifest.sha256 == sha256_of(CSV_PATH), (
        "wasreb_impact17_long.csv changed. Bump manifests/wasreb_impact_17_long_csv.yaml "
        "with the new sha256 and record why in the notes field."
    )


def test_real_csv_loads_with_expected_shape():
    stats = summarise(load(CSV_PATH))
    assert stats.total_rows == 641
    assert stats.utilities == 68
    assert stats.indicators == 10
    # Three categories reconciled so far. Small + Private (P10) will bump this.
    assert stats.confidence_counts.get("high", 0) > 0


def test_nairobi_ncwsc_row_reads_as_utility_granularity():
    """The load path must tag NCWSC's row with county=Nairobi, not with a sub-county."""
    nairobi = filter_for_county(load(CSV_PATH), "Nairobi")
    assert len(nairobi) == 10               # 10 indicators for NCWSC
    utility_ids = {r.utility_id for r in nairobi}
    assert utility_ids == {"ncwsc"}
    non_revenue = next(r for r in nairobi if r.indicator == "non_revenue_water")
    assert non_revenue.value is not None
    assert 0 <= non_revenue.value <= 100
    assert non_revenue.fy == "FY2023/24"


def _to_provenance(reading) -> ProvenanceValue:
    """Adapter: NormalisedReading -> the ProvenanceValue emit.py expects."""
    return ProvenanceValue(
        value=reading.value,
        unit=reading.unit,
        indicator=reading.indicator,
        granularity="utility",             # WASREB is utility-granularity, always
        method="measured",
        source_id="wasreb_impact_17",
        vintage=reading.fy,
        retrieved="2026-08-24",
    )


def _blank_subcounty() -> SubcountyFeature:
    return SubcountyFeature(
        id="nrb_westlands",
        name="Westlands",
        geometry={"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
        centroid=(36.80, -1.27),
    )


def test_ncwsc_readings_survive_the_emit_county_context_path():
    """R2: utility-granularity values render only in county_context."""
    nairobi = filter_for_county(load(CSV_PATH), "Nairobi")
    provenance = [_to_provenance(r) for r in nairobi if r.value is not None]
    context = {"water_sanitation": provenance}

    fc = build_geojson([_blank_subcounty()], county_context=context)

    banner = fc["county_context"]["water_sanitation"]
    assert len(banner) == len(provenance)
    assert {b["granularity"] for b in banner} == {"utility"}
    # Nothing bled into the feature.
    slots = fc["features"][0]["properties"]["pillars"]
    assert slots["water_sanitation"] is None


def test_emitter_rejects_a_wasreb_reading_planted_on_a_feature():
    """The R2 guardrail must fire if a utility reading reaches a sub-county."""
    (any_reading,) = filter_for_county(load(CSV_PATH), "Nairobi")[:1]
    utility_prov = _to_provenance(any_reading)

    feat = SubcountyFeature(
        id="nrb_westlands",
        name="Westlands",
        geometry={"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
        centroid=(36.80, -1.27),
        pillars={"water_sanitation": utility_prov},
    )
    with pytest.raises(EmitRuleViolation, match="county_context"):
        build_geojson([feat])

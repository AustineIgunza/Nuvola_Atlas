"""Nairobi sub-county boundaries.

Fetches Kenya COD-AB admin2 (via HDX), filters to Nairobi, writes a GPKG.
Refuses to produce output unless exactly 17 features come out — a sub-county
silently dropped by a name mismatch is the failure mode this file exists to
catch.

Split across three functions so the boundary invariant can be tested without
GDAL on the machine:

- ``check_nairobi_count`` — the invariant, stdlib only, tested in isolation
- ``filter_nairobi`` — geopandas transform, invoked from the CLI
- ``run`` — the full download → filter → write pipeline

The ``geopandas``/``pyogrio`` imports are lazy so tests can import this module
without the ``geo`` extra installed.
"""
from __future__ import annotations

import argparse
import io
import zipfile
from pathlib import Path
from typing import TYPE_CHECKING

import requests

from pipeline.manifests import Manifest, load_manifest, sha256_of, write_manifest

if TYPE_CHECKING:  # pragma: no cover - types only
    import geopandas as gpd

NAIROBI_SUBCOUNTY_COUNT = 17
DEFAULT_MANIFEST = Path("manifests/cod_ab_ken.yaml")
DEFAULT_SOURCE_DIR = Path("sources/cod_ab_ken")
DEFAULT_OUTPUT = Path("outputs/nairobi_subcounties.gpkg")


class BoundaryCountError(ValueError):
    """Raised when the filtered set is not exactly 17 sub-counties."""


def check_nairobi_count(count: int, source: str) -> None:
    """Fail loudly on any count other than 17. The whole map joins to this."""
    if count != NAIROBI_SUBCOUNTY_COUNT:
        raise BoundaryCountError(
            f"expected {NAIROBI_SUBCOUNTY_COUNT} Nairobi sub-counties from {source}, "
            f"got {count}. Never drop one silently — investigate the county-name "
            f"column or the source vintage before proceeding."
        )


def download_zip(url: str, dest_dir: Path) -> Path:
    """Pull a zip from ``url`` into ``dest_dir`` and return the extracted dir."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()
    archive = dest_dir / "download.zip"
    archive.write_bytes(resp.content)
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        zf.extractall(dest_dir)
    return dest_dir


def _find_shapefile(source_dir: Path, hint: str = "adm2") -> Path:
    candidates = [p for p in source_dir.rglob("*.shp") if hint in p.stem.lower()]
    if not candidates:
        candidates = list(source_dir.rglob("*.shp"))
    if not candidates:
        raise FileNotFoundError(f"no .shp under {source_dir}")
    return candidates[0]


def filter_nairobi(
    input_shp: Path,
    county_column_candidates: tuple[str, ...] = ("adm1_name", "ADM1_EN", "ADM1_NAME"),
) -> gpd.GeoDataFrame:
    """Load ``input_shp`` and filter to Nairobi. Raises if count != 17."""
    import geopandas as gpd  # lazy: heavy dep, only needed for the pipeline run

    gdf = gpd.read_file(input_shp)
    county_col = next((c for c in county_column_candidates if c in gdf.columns), None)
    if county_col is None:
        raise KeyError(
            f"none of {county_column_candidates} present in {input_shp}. "
            f"Columns available: {list(gdf.columns)}"
        )
    filtered = gdf[gdf[county_col].str.strip().str.lower() == "nairobi"].copy()
    check_nairobi_count(len(filtered), source=str(input_shp))
    return filtered


def run(
    manifest_path: Path = DEFAULT_MANIFEST,
    source_dir: Path = DEFAULT_SOURCE_DIR,
    output_path: Path = DEFAULT_OUTPUT,
    download_url: str | None = None,
) -> Path:
    manifest = load_manifest(manifest_path)
    url = download_url or manifest.url
    download_zip(url, source_dir)
    shp = _find_shapefile(source_dir)
    filtered = filter_nairobi(shp)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    filtered.to_file(output_path, driver="GPKG")

    updated = Manifest(
        source_id=manifest.source_id,
        name=manifest.name,
        url=manifest.url,
        licence=manifest.licence,
        attribution=manifest.attribution,
        vintage=manifest.vintage,
        retrieval_date=manifest.retrieval_date,
        sha256=sha256_of(shp),
        notes=manifest.notes,
    )
    write_manifest(updated, manifest_path)
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__ or "")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--url", type=str, default=None,
                        help="Override the download URL from the manifest.")
    args = parser.parse_args()

    out = run(args.manifest, args.source_dir, args.output, args.url)
    print(f"wrote {out} ({NAIROBI_SUBCOUNTY_COUNT} features)")


if __name__ == "__main__":  # pragma: no cover
    main()

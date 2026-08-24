# nuvola-atlas-data

Offline data pipeline. Turns raw census, regulator, OSM and GTFS data into the
files the app consumes:

- `outputs/nairobi_vitality.geojson` — the map file
- `outputs/wasreb_impact_long.csv` — the open time-series asset
- `outputs/provenance.json` — source, licence, vintage and checksum per dataset

## Contract

One thing links this package to the app: the shape of `nairobi_vitality.geojson`.
The emitter (`pipeline/emit.py`) enforces two rules that make that shape honest:

1. `method == "gap"` → `value` **must** be `null`. Never a number.
2. `granularity != "subcounty"` → the value goes in the top-level `county_context`
   object, **never** into a feature's `properties`. A utility figure spread
   across 17 sub-counties is inventing data.

Both rules are enforced in code and covered by tests. If either test goes red,
the pipeline is not shipping.

## Layout

```
manifests/    one YAML per source (url, licence, vintage, sha256)
sources/      raw downloads (gitignored; manifests are the record)
pipeline/     boundaries, indicators, emit — imported by CLIs
outputs/      generated artefacts (gitignored)
tests/        pytest, no network
```

## Running

```bash
uv sync --extra dev --extra geo    # or pip install -e '.[dev,geo]'
python -m pipeline.boundaries      # fetch + filter to 17 sub-counties
pytest                             # runs without geo extras
ruff check .
```

The `geo` extra pulls GDAL-backed libraries (geopandas, pyogrio) and is only
needed for the download/filter steps. Tests do not require it.

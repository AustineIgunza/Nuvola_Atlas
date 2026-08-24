"""WASREB IMPACT parser.

Turns the 17 annual IMPACT PDFs from wasreb.go.ke/impact-reports into a
single machine-readable time series. Accuracy over coverage — a wrong
value is worse than a missing one, so nothing in here interpolates,
forward-fills, or estimates. Missing is missing.

Layout:
    editions.py    - EDITIONS registry: one entry per IMPACT report
    utilities.py   - canonical utility name resolver (renames, mergers)
    vocabulary.py  - column header -> canonical indicator key
    extract.py     - Extractor protocol + registry of per-edition impls
    extractors/    - one module per edition, each registered on import
    csvwriter.py   - long-CSV emitter with the schema locked in one place
    validate.py    - per-edition validation report (plausibility ranges,
                     coverage counts, page failures)
    spotcheck.py   - random sampler + human-verdict harness
    downloader.py  - fetch + sha256 + manifest write
"""
from __future__ import annotations

"""Per-edition extractors. Each module registers itself on import.

Importing this package loads every extractor, populating
``pipeline.wasreb.extract._REGISTRY``. The CLI does ``import
pipeline.wasreb.extractors`` before iterating editions, so nothing on the
outside needs to know which issues have implementations.

An extractor for a new edition looks like:

    from pathlib import Path

    from pipeline.wasreb.extract import RawReading, register

    def extract_issue_17(pdf: Path):
        # ... use pdfplumber (imported lazily), OCR fallback, etc.
        yield RawReading(...)

    register(17, extract_issue_17)

Tables change layout between years. Do not attempt one universal parser.
"""
from __future__ import annotations

# Editions register themselves as their modules import. Add each new one here.
# (No modules yet — this is P3's scaffold. Individual extractors land next.)

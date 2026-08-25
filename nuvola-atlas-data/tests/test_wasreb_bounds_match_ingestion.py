"""Guard against silent drift between the data package's vocabulary and
the ingestion service's copy of the plausibility bounds.

The ingestion service (nuvola-atlas-ingestion) ships as a separate Python
package with its own dependency set, so importing
``pipeline.wasreb.vocabulary`` at runtime is not an option. Instead the
bounds are copied into ``app/models/readings.py:WASREB_INDICATOR_BOUNDS``
and this test reads both files textually to prove they still agree.

If this test fails: update whichever side is stale in the same slice.
Don't broaden the tolerance — a drift here means one code path publishes
a value the other would refuse.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from pipeline.wasreb.vocabulary import VOCABULARY

INGESTION_READINGS = (
    Path(__file__).resolve().parents[2]
    / "nuvola-atlas-ingestion"
    / "app"
    / "models"
    / "readings.py"
)


pytestmark = pytest.mark.skipif(
    not INGESTION_READINGS.exists(),
    reason=f"ingestion service not present at {INGESTION_READINGS}",
)


def _parse_ingestion_bounds() -> dict[str, tuple[float, float]]:
    text = INGESTION_READINGS.read_text(encoding="utf-8")
    # Match the WASREB_INDICATOR_BOUNDS dict body — one line per entry:
    #   "key": (lo, hi),
    block_match = re.search(
        r"WASREB_INDICATOR_BOUNDS[^{]*\{([^}]*)\}", text, re.DOTALL
    )
    assert block_match, "WASREB_INDICATOR_BOUNDS block not found in ingestion readings.py"
    body = block_match.group(1)

    bounds: dict[str, tuple[float, float]] = {}
    for m in re.finditer(
        r'"([a-z0-9_]+)"\s*:\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)', body
    ):
        bounds[m.group(1)] = (float(m.group(2)), float(m.group(3)))
    return bounds


def test_wasreb_bounds_match_vocabulary():
    ingestion_bounds = _parse_ingestion_bounds()
    vocab_bounds = {
        ind.key: (ind.lo, ind.hi)
        for ind in VOCABULARY
        if ind.lo is not None and ind.hi is not None
    }
    assert ingestion_bounds == vocab_bounds, (
        "WASREB plausibility bounds drifted between "
        "pipeline.wasreb.vocabulary and nuvola-atlas-ingestion/app/models/readings.py. "
        "Update whichever side is stale in the same slice."
    )

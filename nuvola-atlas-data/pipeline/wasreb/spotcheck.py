"""Random sampler for the human spot-check.

The parser is only as trustworthy as the values a human has verified
against the source PDFs. This module draws a reproducible random sample
(seeded on report_issue so a rerun picks the same rows), formats each
one with its page reference, and appends to a checked-in verdict file so
the record persists across sessions.

Verdict file schema (JSONL):
    {"utility_id": ..., "indicator": ..., "fy": ..., "report_issue": ...,
     "value": ..., "page_ref": ..., "verdict": "ok|wrong|unclear",
     "verifier": "name", "verified_at": "YYYY-MM-DD",
     "notes": "optional"}

`sample` is deterministic per seed. `format_line` produces a copy-paste
line the human can annotate.
"""
from __future__ import annotations

import json
import random
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

from pipeline.wasreb.extract import NormalisedReading


@dataclass(frozen=True)
class SpotCheckItem:
    utility_id: str
    fy: str
    indicator: str
    value: float | None
    report_issue: int
    page_ref: str


def sample(
    readings: Iterable[NormalisedReading], n: int = 30, seed: int = 0,
) -> list[SpotCheckItem]:
    """Return a reproducible sample of ``n`` readings.

    Uses ``random.sample`` so the same seed against the same input list
    yields the same items. If fewer than ``n`` readings exist, returns
    all of them — never pads.
    """
    rs = list(readings)
    if not rs:
        return []
    rng = random.Random(seed)
    k = min(n, len(rs))
    picked = rng.sample(rs, k)
    return [
        SpotCheckItem(
            utility_id=r.utility_id,
            fy=r.fy,
            indicator=r.indicator,
            value=r.value,
            report_issue=r.report_issue,
            page_ref=r.page_ref,
        )
        for r in picked
    ]


def format_line(item: SpotCheckItem) -> str:
    """Human-friendly one-liner for the verdict prompt."""
    val = "null" if item.value is None else f"{item.value}"
    return (
        f"[issue={item.report_issue} {item.fy}] "
        f"{item.utility_id}.{item.indicator} = {val}  ({item.page_ref})"
    )


def load_verdicts(path: str | Path) -> list[dict]:
    p = Path(path)
    if not p.exists():
        return []
    out: list[dict] = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        out.append(json.loads(line))
    return out


def append_verdict(path: str | Path, verdict: dict) -> None:
    """Append one verdict line. Callers pre-validate the shape."""
    required = {"utility_id", "indicator", "fy", "report_issue",
                "value", "page_ref", "verdict", "verifier", "verified_at"}
    missing = required - verdict.keys()
    if missing:
        raise ValueError(f"verdict missing keys: {sorted(missing)}")
    if verdict["verdict"] not in {"ok", "wrong", "unclear"}:
        raise ValueError(f"verdict must be ok|wrong|unclear, got {verdict['verdict']!r}")
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(verdict, ensure_ascii=False) + "\n")

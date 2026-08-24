"""Canonical utility-name resolver.

Kenyan water service providers rename, merge and split between IMPACT
editions (NCWSC has been NCC Water & Sewerage Company, Nairobi Water,
NAWASCO, and NCWSC across the series). The alias table is the ONLY place
that variation is handled. Anything downstream carries the canonical id.

When a report introduces a name not in the table, the resolver raises —
silently accepting a new label is how the time series drifts. Add the
alias, don't work around the exception.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class UtilityDef:
    utility_id: str      # slug, stable across renames
    display_name: str    # current name
    county: str          # canonical county
    aliases: tuple[str, ...] = ()


# One dict of Nairobi + regional utilities. Extend as parsing widens
# beyond Nairobi. Keys are lowercased and whitespace-normalised at lookup
# time, so aliases here can be written the way they appear in the PDF.
UTILITIES: Final[tuple[UtilityDef, ...]] = (
    UtilityDef(
        utility_id="ncwsc",
        display_name="Nairobi City Water and Sewerage Company",
        county="Nairobi",
        aliases=(
            "Nairobi Water",
            "Nairobi City Water & Sewerage Company",
            "NCWSC",
            "NCC Water & Sewerage Company",
            "NCC Water and Sewerage Company",
            "NAWASCO",  # rare, but appears in early editions
        ),
    ),
    # Neighbouring utilities NCWSC boundaries touch — included so a report
    # that lists them alongside NCWSC does not fail the resolver.
    UtilityDef(utility_id="ruiru_juja", display_name="Ruiru-Juja Water and Sewerage Company",
               county="Kiambu",
               aliases=("Ruiru-Juja Water", "RUJWASCO", "Ruiru Juja WSSCo")),
    UtilityDef(utility_id="kiambu", display_name="Kiambu Water and Sewerage Company",
               county="Kiambu", aliases=("Kiambu Water", "KIAWASCO")),
    UtilityDef(utility_id="mavoko", display_name="Mavoko Water and Sewerage Company",
               county="Machakos", aliases=("Mavoko Water", "MAVWASCO")),
)


_UTILITIES_BY_ID: Final[dict[str, UtilityDef]] = {u.utility_id: u for u in UTILITIES}


def _norm(name: str) -> str:
    """Fold whitespace, lowercase, strip stray punctuation used in headers."""
    return re.sub(r"\s+", " ", name).strip().lower().rstrip(".,;:")


_LOOKUP: Final[dict[str, UtilityDef]] = {}
for _u in UTILITIES:
    _LOOKUP[_norm(_u.display_name)] = _u
    _LOOKUP[_u.utility_id] = _u
    for alias in _u.aliases:
        _LOOKUP[_norm(alias)] = _u


def resolve_utility(name: str) -> UtilityDef:
    """Resolve any known utility label to its canonical definition.

    Raises ``KeyError`` for anything not in the alias table. The message
    tells the caller what to edit rather than what failed — that's the
    difference between a maintainable resolver and a mystery.
    """
    key = _norm(name)
    if key in _LOOKUP:
        return _LOOKUP[key]
    raise KeyError(
        f"unknown WASREB utility label {name!r}. Add it to "
        f"pipeline.wasreb.utilities.UTILITIES as an alias before parsing."
    )


def utility(utility_id: str) -> UtilityDef:
    try:
        return _UTILITIES_BY_ID[utility_id]
    except KeyError:
        raise KeyError(f"no utility with id {utility_id!r}") from None

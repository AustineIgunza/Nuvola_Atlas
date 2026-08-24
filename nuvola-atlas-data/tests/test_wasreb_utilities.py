from __future__ import annotations

import pytest

from pipeline.wasreb.utilities import resolve_utility, utility


def test_canonical_name_resolves():
    u = resolve_utility("Nairobi City Water and Sewerage Company")
    assert u.utility_id == "ncwsc"
    assert u.county == "Nairobi"


@pytest.mark.parametrize("alias", [
    "Nairobi Water",
    "NCC Water & Sewerage Company",
    "  NAWASCO  ",
    "ncwsc",
    "Nairobi Water.",       # trailing punctuation is normalised out
])
def test_aliases_and_normalisation(alias):
    assert resolve_utility(alias).utility_id == "ncwsc"


def test_unknown_label_raises_with_actionable_message():
    with pytest.raises(KeyError, match="Add it to"):
        resolve_utility("Made Up Water Company")


def test_lookup_by_id():
    assert utility("ruiru_juja").county == "Kiambu"


def test_bad_id_raises():
    with pytest.raises(KeyError):
        utility("nope")

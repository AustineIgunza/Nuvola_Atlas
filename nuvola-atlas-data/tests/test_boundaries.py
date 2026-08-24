"""The 17-feature invariant. Anything else silently drops a sub-county."""
from __future__ import annotations

import pytest

from pipeline.boundaries import NAIROBI_SUBCOUNTY_COUNT, BoundaryCountError, check_nairobi_count


def test_seventeen_passes():
    check_nairobi_count(NAIROBI_SUBCOUNTY_COUNT, source="fixture")


@pytest.mark.parametrize("count", [0, 1, 16, 18, 47])
def test_anything_else_raises(count):
    with pytest.raises(BoundaryCountError):
        check_nairobi_count(count, source="fixture")

"""downloader idempotence + checksum-mismatch behaviour.

Tests never hit the network. We call ``fetch`` with a pre-populated
``source_dir`` so the download branch is skipped, and cover the "same
bytes" and "changed bytes" cases against a recorded sha256.
"""
from __future__ import annotations

import pytest

from pipeline.manifests import load_manifest, sha256_of
from pipeline.wasreb.downloader import ChecksumMismatch, fetch
from pipeline.wasreb.editions import edition as get_edition


def _seed_pdf(source_dir, issue, content: bytes) -> str:
    source_dir.mkdir(parents=True, exist_ok=True)
    (source_dir / f"impact_{issue:02d}.pdf").write_bytes(content)
    return sha256_of(source_dir / f"impact_{issue:02d}.pdf")


def test_fetch_is_idempotent_when_hash_matches(tmp_path):
    source_dir = tmp_path / "sources"
    manifest_dir = tmp_path / "manifests"
    sha = _seed_pdf(source_dir, 17, b"fake pdf bytes for test")

    edition = get_edition(17)
    # First call records the sha.
    _, updated1 = fetch(edition, source_dir=source_dir, manifest_dir=manifest_dir,
                        retrieval_date="2026-08-24")
    assert updated1.sha256 == sha

    # Second call with the same bytes must not raise, and manifest agrees.
    _, updated2 = fetch(updated1, source_dir=source_dir, manifest_dir=manifest_dir,
                        retrieval_date="2026-08-24")
    assert updated2.sha256 == sha

    m = load_manifest(manifest_dir / "impact_17.yaml")
    assert m.sha256 == sha
    assert m.source_id == "wasreb_impact_17"
    assert m.attribution.startswith("Water Services")


def test_fetch_refuses_silent_overwrite_on_checksum_mismatch(tmp_path):
    source_dir = tmp_path / "sources"
    manifest_dir = tmp_path / "manifests"
    _seed_pdf(source_dir, 17, b"original bytes")

    edition = get_edition(17)
    # Prime with a sha derived from the seeded content.
    _, primed = fetch(edition, source_dir=source_dir, manifest_dir=manifest_dir,
                      retrieval_date="2026-08-24")

    # Overwrite the file so its bytes no longer match what the primed spec
    # remembers, then re-run — that MUST raise, not silently update.
    (source_dir / "impact_17.pdf").write_bytes(b"different bytes")
    with pytest.raises(ChecksumMismatch, match="silently overwrite"):
        fetch(primed, source_dir=source_dir, manifest_dir=manifest_dir,
              retrieval_date="2026-08-24")

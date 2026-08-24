"""Manifest round-trip and validation."""
from __future__ import annotations

import pytest
import yaml

from pipeline.manifests import Manifest, load_manifest, sha256_of, write_manifest


def _sample():
    return Manifest(
        source_id="cod_ab_ken",
        name="Kenya COD-AB admin2",
        url="https://data.humdata.org/dataset/cod-ab-ken",
        licence="Open, HDX terms",
        attribution="IEBC via OCHA",
        vintage="2023",
        retrieval_date="2026-08-24",
        sha256=None,
    )


def test_round_trip(tmp_path):
    path = tmp_path / "m.yaml"
    write_manifest(_sample(), path)
    loaded = load_manifest(path)
    assert loaded == _sample()


def test_bad_date_rejected():
    with pytest.raises(ValueError):
        Manifest(
            source_id="x",
            name="x",
            url="https://example.com",
            licence="x",
            attribution="x",
            vintage="x",
            retrieval_date="24 Aug 2026",
        )


def test_source_id_must_be_a_slug():
    with pytest.raises(ValueError):
        Manifest(
            source_id="cod ab ken",  # space not allowed
            name="x",
            url="https://example.com",
            licence="x",
            attribution="x",
            vintage="x",
            retrieval_date="2026-08-24",
        )


def test_load_rejects_wrong_schema_version(tmp_path):
    path = tmp_path / "m.yaml"
    path.write_text(yaml.safe_dump({"schema_version": 99, "source_id": "x"}), encoding="utf-8")
    with pytest.raises(ValueError, match="schema_version"):
        load_manifest(path)


def test_sha256_of_matches_stdlib(tmp_path):
    import hashlib

    p = tmp_path / "file.bin"
    p.write_bytes(b"Nairobi has 17 sub-counties.")
    assert sha256_of(p) == hashlib.sha256(p.read_bytes()).hexdigest()

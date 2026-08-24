"""Fetch each IMPACT edition, record its sha256, write a manifest.

Idempotent: if the file already exists on disk and its sha256 matches
what's on the ``EditionSpec``, skip the download. If it exists but the
hash differs, refuse to overwrite and raise — that's evidence WASREB
republished the report, and silently accepting a new hash would lose the
audit trail.
"""
from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import requests

from pipeline.manifests import Manifest, sha256_of, write_manifest
from pipeline.wasreb.editions import EDITIONS, EditionSpec

DEFAULT_SOURCE_DIR = Path("sources/wasreb")
DEFAULT_MANIFEST_DIR = Path("manifests/wasreb")


class ChecksumMismatch(RuntimeError):
    """A previously-fetched edition's bytes changed on the server."""


def _manifest_for(edition: EditionSpec, retrieval_date: str,
                  sha: str | None) -> Manifest:
    return Manifest(
        source_id=f"wasreb_impact_{edition.issue:02d}",
        name=f"WASREB IMPACT Report Issue #{edition.issue} ({edition.fiscal_year})",
        url=edition.url,
        licence="Open, subject to WASREB terms — attribution required",
        attribution="Water Services Regulatory Board (WASREB)",
        vintage=edition.fiscal_year,
        retrieval_date=retrieval_date,
        sha256=sha,
        notes=edition.notes,
    )


def fetch(
    edition: EditionSpec,
    *,
    source_dir: Path = DEFAULT_SOURCE_DIR,
    manifest_dir: Path = DEFAULT_MANIFEST_DIR,
    retrieval_date: str,
    session: requests.Session | None = None,
) -> tuple[Path, EditionSpec]:
    """Fetch (or verify) one edition. Returns (pdf_path, updated_edition)."""
    source_dir.mkdir(parents=True, exist_ok=True)
    manifest_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = source_dir / f"impact_{edition.issue:02d}.pdf"

    if pdf_path.exists():
        current = sha256_of(pdf_path)
        if edition.sha256 and current != edition.sha256:
            raise ChecksumMismatch(
                f"issue #{edition.issue}: on-disk sha256 {current} != "
                f"recorded {edition.sha256}. Rename the old file and rerun to "
                f"produce a new manifest — do not silently overwrite the audit trail."
            )
        sha = current
    else:
        sess = session or requests.Session()
        resp = sess.get(edition.url, timeout=180)
        resp.raise_for_status()
        pdf_path.write_bytes(resp.content)
        sha = sha256_of(pdf_path)

    write_manifest(_manifest_for(edition, retrieval_date, sha),
                   manifest_dir / f"impact_{edition.issue:02d}.yaml")

    return pdf_path, replace(edition, sha256=sha)


def fetch_all(
    *,
    source_dir: Path = DEFAULT_SOURCE_DIR,
    manifest_dir: Path = DEFAULT_MANIFEST_DIR,
    retrieval_date: str,
    session: requests.Session | None = None,
) -> list[tuple[Path, EditionSpec]]:
    return [
        fetch(e, source_dir=source_dir, manifest_dir=manifest_dir,
              retrieval_date=retrieval_date, session=session)
        for e in EDITIONS
    ]

"""YAML source manifests: what was fetched, from where, under what licence."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

import yaml

MANIFEST_SCHEMA_VERSION = 1


@dataclass(frozen=True)
class Manifest:
    """One source file and everything a lawyer or reviewer might ask about it."""

    source_id: str
    name: str
    url: str
    licence: str
    attribution: str
    vintage: str
    retrieval_date: str
    sha256: str | None = None
    notes: str | None = None

    def __post_init__(self) -> None:
        date.fromisoformat(self.retrieval_date)
        if not self.source_id or " " in self.source_id:
            raise ValueError(f"source_id must be a slug, got {self.source_id!r}")

    def to_dict(self) -> dict[str, Any]:
        d = {
            "schema_version": MANIFEST_SCHEMA_VERSION,
            "source_id": self.source_id,
            "name": self.name,
            "url": self.url,
            "licence": self.licence,
            "attribution": self.attribution,
            "vintage": self.vintage,
            "retrieval_date": self.retrieval_date,
        }
        if self.sha256:
            d["sha256"] = self.sha256
        if self.notes:
            d["notes"] = self.notes
        return d


def load_manifest(path: str | Path) -> Manifest:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"manifest {path} must be a YAML mapping")
    schema = data.get("schema_version", 1)
    if schema != MANIFEST_SCHEMA_VERSION:
        raise ValueError(
            f"manifest {path} declares schema_version={schema}, "
            f"pipeline understands v{MANIFEST_SCHEMA_VERSION}"
        )
    return Manifest(
        source_id=data["source_id"],
        name=data["name"],
        url=data["url"],
        licence=data["licence"],
        attribution=data["attribution"],
        vintage=data["vintage"],
        retrieval_date=data["retrieval_date"],
        sha256=data.get("sha256"),
        notes=data.get("notes"),
    )


def write_manifest(manifest: Manifest, path: str | Path) -> None:
    Path(path).write_text(
        yaml.safe_dump(manifest.to_dict(), sort_keys=False),
        encoding="utf-8",
    )


def sha256_of(path: str | Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(chunk_size):
            h.update(chunk)
    return h.hexdigest()

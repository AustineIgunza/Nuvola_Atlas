# 0001 — Four services, not one

**Status:** accepted · **Date:** 2026-08 (recorded 2026-08-28, retroactively)

## Context

A team of two building an MVP would normally reach for one application. This
repo has four, in three languages, and a new developer needs PHP, Node, Python
and Docker before `make check` will run.

## Decision

Keep four services:

- **`nuvola-atlas-backend`** (Laravel) — scoring, storage, the JSON API
- **`nuvola-atlas-ingestion`** (FastAPI) — receives and cleans incoming readings
- **`nuvola-atlas-frontend`** (React + Vite) — the map and scorecard
- **`nuvola-atlas-data`** (Python) — the offline source pipeline

The first three are committed to in the funded proposal (§4.2). Deviating would
mean amending the grant, which is a larger cost than the polyglot overhead.

The fourth was added during the August 2026 refocus and is the one genuinely
chosen on merit. Turning a WASREB PDF into rows is slow, manual, and needs
re-running whenever a source is corrected or a reconciliation is disputed. It
does not belong in a request path.

## Alternatives rejected

**Fold ingestion into Laravel.** Saves a language and a deployment. Rejected:
the proposal commits to the FastAPI service, and the HMAC hop between them is
also the audit boundary — collapsing it would mean an operator upload and an
internal recalculation become indistinguishable in the logs.

**Fold `nuvola-atlas-data` into `nuvola-atlas-ingestion`.** Both are Python and
this is the most defensible merge on the table. Rejected *for now*: they have
different runtime shapes — one is a live HTTP service with uptime obligations,
the other a batch job that is expected to fail loudly and be re-run. Worth
revisiting once the pipeline stabilises.

## Consequences

- Contributors need four toolchains. `make check` runs all of them.
- A parser bug in `nuvola-atlas-data` cannot take the API down.
- Four CI jobs. `nuvola-atlas-data` had none until 2026-08-27, which is how a
  manifest checksum that never matched its dataset went unnoticed for three
  days — see [`0003`](0003-registries-generate-and-gate.md) on why guards must
  actually run.

# Architecture

How a byte travels from a source document to a number on the screen.

## The four services

| Service | Language | Job | In the serving path? |
|---|---|---|---|
| `nuvola-atlas-data` | Python 3.13 | Offline pipeline: source documents → validated readings | No |
| `nuvola-atlas-ingestion` | Python 3.13, FastAPI | Receives readings over HTTP, cleans them, forwards them | Yes |
| `nuvola-atlas-backend` | PHP 8.3, Laravel 13 | Stores readings, computes scores, serves the JSON API | Yes |
| `nuvola-atlas-frontend` | TypeScript, React 18 + Vite 5 | Map, scorecard, public portal | Yes |

`nuvola-atlas-data` is the odd one out and deliberately so: it runs on a laptop,
not a server. Turning a WASREB PDF into rows is slow, manual and needs
re-running when a source is corrected. Keeping it out of the request path means
a broken parser can never take the API down.

## The path

```
WASREB / KNBS / OSM
        │
        │  nuvola-atlas-data — extract, validate, reconcile
        │  manifests/ records the source, licence and sha256 of every input
        ▼
  wasreb_impact17_long.csv          (committed; the reconciled dataset)
        │
        │  POST /api/ingest/wasreb   → nuvola-atlas-ingestion
        ▼
  quality/clean.py      structural checks — schema, types, units, CRS
  quality/outliers.py   statistical checks — z-score against history
        │
        │  forward.py — HMAC-signed, idempotent by batch id
        ▼
  POST /api/v1/internal/county-context  → nuvola-atlas-backend
        │                                  (X-Internal-Secret, min 48 chars)
        ▼
  Postgres + PostGIS
        │
        │  Domain/Scoring/ScoreCalculator — pillar means, renormalised weights
        ▼
  GET /api/v1/zones, /county-context, /vitality/methodology
        │
        │  TanStack Query
        ▼
  React — Mapbox GL layers, the scorecard ring, the county banner
```

## The two hops carry different credentials, on purpose

**Hop 1** — a partner's file or an operator's upload reaching FastAPI. Crosses a
third-party boundary, so it uses a bearer token that can be issued and revoked
per partner.

**Hop 2** — FastAPI to Laravel. Both ends are ours, so it is HMAC-signed over
the request body with a shared secret and a timestamp, tolerating 300 seconds of
clock skew. `VerifyInternalSecret` rejects any secret under 48 characters, which
is a real constraint and not a formality — a test suite once sat red for days
because its fixture secret was 11.

Both hops are idempotent by batch id: replaying a batch updates in place rather
than duplicating rows.

## Scoring

`Domain/Scoring/ScoreCalculator` is the piece to read first, and its docblock is
worth more than this section.

- Every indicator is a 0–100 value or `null`.
- A pillar score is the mean of its **non-null** indicators.
- The composite is the weighted mean of the pillars that have at least one
  non-null indicator, with weights **renormalised across the pillars actually
  present**.
- Missing indicators are excluded. They are never treated as zero.

That last point is the whole design. The July 2026 rewrite exists because the
previous algorithm collapsed scores for informal settlements whenever a partner
had not yet delivered their indicators — the places with the least data scored
worst *because* they had the least data. A zone is never penalised for being
undocumented.

Weights live in `pillars.json` and reach the backend through generated config.

## Granularity is enforced, not advisory

Every reading carries `granularity`: `subcounty`, `county`, `utility` or
`national`.

- `subcounty` renders on the map bubble.
- `county` and `utility` render **only** in the banner above the map.
- `national` is context, greyed.
- `method: "gap"` renders grey with no number, always.

This is enforced in the database and in `pipeline/emit.py`, not just in the UI —
a `subcounty` row for a utility-level indicator is rejected at intake with a 422.

The reason is concrete. WASREB reports non-revenue water per utility, and NCWSC
serves the whole county. Publishing "Nairobi is 48%" against 17 individual
sub-counties would be inventing 17 numbers from one. Nobody else in Kenya
publishes a service-performance figure with its granularity declared this
honestly, which is exactly why a regulator can trust this one.

## The registries

Two files define the domain. Both generate or gate the code that uses them.

**`pillars.json`** — what we measure. `scripts/gen-pillars.mjs` generates typed
bindings into all four services; `--check` fails the build if a generated file
drifts from the source.

**`zones.json`** — where we measure it. The 17 sub-counties.
`scripts/check-zones.mjs` fails the build if the registry, the Laravel seeder and
the boundary GeoJSON stop agreeing.

Neither is decorative. Editing a generated file by hand fails CI.

## What the frontend does with it

`api/index.ts` picks between `live.ts` and the demo implementation from one flag.
`api/contract.ts` is a types-only file that makes the two structurally
incompatible if they drift — it compiles to nothing and exists solely to fail
the build.

Missing data has three distinct renderings, and the distinction is the product:

| State | Renders as |
|---|---|
| genuinely absent | `—` (`NO_SCORE_LABEL`) |
| present but estimated | the value, wrapped in `<EstimatedMark>` |
| observed | the value, plain |

See `PillarBar.tsx` for all three in one line.

## Where the seams are

Places where the architecture is deliberately unfinished, so you know they are
choices rather than oversights:

- **Boundaries are placeholders.** `pipeline/boundaries.py` already carries the
  downloader and the 17-feature invariant; only the real data is missing.
- **Quality stages 2, 4 and 5** — semantic validation, spatial imputation and
  per-zone confidence — are designed but not built. Stages 1 and 3 exist in
  `quality/`. See [`decisions/0005-ml-belongs-in-the-pipeline.md`](decisions/0005-ml-belongs-in-the-pipeline.md).
- **`ZoneScoreForecaster`** is a deliberate v0 method with a stable output
  contract, documented as such in its own docblock. It is the model for how a
  placeholder should announce its own replacement.

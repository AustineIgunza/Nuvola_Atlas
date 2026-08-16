# Navuuna — Database Design

**Owner:** Khillon Makwana
**Last updated:** 2026-08-16

PostgreSQL 16 with PostGIS 3.4. Supabase in staging and production (pooled
`:6543` for the app, direct `:5432` for migrations); Docker Postgres on
`:5434` locally and in CI.

> **This is not a table catalogue.** `database/migrations/` is the only
> honest description of the columns, and a hand-written copy of it went
> stale inside two months — it was still documenting `zones.pillar_social`
> months after that column was dropped. What follows is the part migrations
> *can't* tell you: why the schema is shaped this way. Read it alongside a
> live `\d`, not instead of one.

## Inspecting the live schema

```bash
# Local
docker compose up -d postgres
docker exec -it nuvola-atlas-backend-postgres-1 psql -U nuvola -d nuvola_atlas

# Inside psql
\dt                 # tables
\d zones            # one table
\di                 # indexes
\dm                 # materialized views
\dy                 # triggers
```

One-shot dump, which is what you want before a risky migration:

```bash
docker exec nuvola-atlas-backend-postgres-1 \
  pg_dump -U nuvola --schema-only nuvola_atlas > schema.sql
```

The same commands work against Supabase with the connection string swapped.

## Indicators, not pillars

`zones` used to carry eight derived columns — `pillar_social`, `delta_social`
and friends. Those were dropped in July 2026 and replaced with thirteen
`indicator_*` columns holding raw 0–100 values or `NULL`.

The reason is that a pillar score is a *derived* value, and storing derived
values meant the database could disagree with `ScoreCalculator`. Worse, a
`NULL` pillar and a genuinely-zero pillar were indistinguishable once
averaged. Storing indicators raw keeps "Awaiting data" and "scored zero" as
different states all the way down to the disk, which is what makes the
nulls-excluded scoring rule enforceable rather than aspirational.

`zone_score_snapshots` mirrors the same indicator columns. One row is appended
on every recalculation — even when nothing changed — so the trend chart has a
continuous series and so a stalled queue worker is detectable by the *absence*
of a new row.

## Append-only tables

`audit_logs` and `data_ingestion_logs` are both append-only, enforced in two
places on purpose: Eloquent throws on `updating`/`deleting`, and the database
carries a `trigger_logs_append_only` trigger backed by the
`enforce_logs_append_only()` plpgsql function. Application-level enforcement
alone would be bypassed by anyone with a psql prompt, which defeats the point
of an audit trail.

The trigger has one deliberate carve-out. The retention sweep must be able to
redact `payload` after 30 days without being able to alter anything else, so
the function compares `to_jsonb(NEW) - 'payload' - 'payload_purged_at'`
against the same projection of `OLD` and permits the write only when the rest
of the row is byte-identical. Redaction is allowed; rewriting history is not.

`data_ingestion_logs_pending_purge_idx` is a partial index over
`payload IS NOT NULL AND payload_purged_at IS NULL`, so the nightly sweep
scans only the rows that still have something to purge rather than the whole
table.

## Spatial indexes

| Index | Table | Type | Serves |
|---|---|---|---|
| `zones_boundary_gist` | `zones` | GIST | polygon containment, `ST_Contains` |
| `zones_centroid_gist` | `zones` | GIST | nearest-zone and radius queries |
| `zone_layers_geojson_gin` | `zone_layers` | GIN | jsonb feature-property lookups |

Both geometry columns are indexed because they answer different questions —
"which zone is this point in" hits the boundary, "which zones are near this
point" hits the centroid, and a GIST index on one does nothing for the other.

## County rollup

`county_vitality_rollup` is a materialized view aggregating zone scores to
county level, rebuilt nightly by `nuvola:refresh-county-rollup`.

It exists because the county view is read on nearly every page load and
recomputed from a join that will not stay cheap as zones and snapshots grow.
It carries `county_vitality_rollup_county_idx`, a unique index — not for
lookups, but because `REFRESH MATERIALIZED VIEW CONCURRENTLY` refuses to run
without one, and a non-concurrent refresh takes an `ACCESS EXCLUSIVE` lock
that would stall reads for the duration.

The pillar averages inside the view use `AVG()` over `unnest(ARRAY[...])`
rather than a flat arithmetic mean, because `AVG` skips `NULL`s. That is the
same nulls-excluded rule the PHP enforces, expressed in SQL — if the two ever
disagree, the rollup is wrong.

## Row-level security

`partner_dataset_overlays` carries a `partner_isolation` RLS policy. Partner
overlays are the one place where a customer's proprietary data sits in a
shared table, so isolation is enforced by Postgres rather than by remembering
to add a `where` clause. Application-level scoping stays in place on top; RLS
is the backstop, not the only lock.

## Single-current-row constraints

`methodology_versions_current_unique` is a unique index over `is_current`
filtered to `WHERE is_current IS TRUE`. A plain unique constraint would allow
only one row *per value* and therefore only one archived version ever; the
partial form permits unlimited history with exactly one live version.

This matters because `ScoreCalculator` resolves weights through
`MethodologyVersion::current()`. Two current rows would make the composite
score depend on row order, which is a silent, unreproducible wrong answer —
the worst failure mode available to a scoring system.

## Migration rules

- Every migration implements both `up()` and `down()`. No exceptions.
- Tests run against a real Postgres with PostGIS, never a mock or SQLite.
  Spatial behaviour and trigger behaviour are exactly what a mock would hide.
- `migrate:fresh` is safe against the local stack. It does **not** touch the
  n8n container's private `n8n` schema, which is isolated from `public` for
  precisely this reason.

## Related

- [`docs/backend/architecture.md`](architecture.md) — service internals
- [`docs/architecture.md`](../architecture.md) — cross-service data flow
- [`docs/data/daystar-indicator-spec.md`](../data/daystar-indicator-spec.md) — the 13 indicators

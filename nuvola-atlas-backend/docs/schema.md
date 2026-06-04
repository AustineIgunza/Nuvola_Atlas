# Nuvola Atlas — Database Schema

PostgreSQL 16 with the PostGIS 3.4 extension. All migrations live in
`database/migrations/` and are the source of truth; this document is a
human-readable summary kept in sync with them.

## How to inspect the live schema

```bash
# Local docker stack:
docker compose up -d postgres
docker exec -it nuvola-atlas-backend-postgres-1 psql -U nuvola -d nuvola_atlas

# Inside psql:
\dt           # list tables
\d zones      # describe a table
\di           # list indexes
```

For a one-shot schema dump:

```bash
docker exec nuvola-atlas-backend-postgres-1 pg_dump -U nuvola --schema-only nuvola_atlas > schema.sql
```

The same commands work against the Supabase project for production —
substitute the connection string and authenticate with the pooler creds.

---

## Tables

### `users`

Auth-managed identities for the dashboard and the API.

| Column              | Type                | Notes                                   |
|---------------------|---------------------|-----------------------------------------|
| `id`                | bigint, PK          | Auto-increment.                         |
| `name`              | string              |                                         |
| `email`             | string, UNIQUE      |                                         |
| `role`              | string(20)          | enum: viewer/partner/editor/admin. Default `viewer`. |
| `email_verified_at` | timestamp           | Null until the user verifies.           |
| `password`          | string              | bcrypt hash.                            |
| `remember_token`    | string(100)         |                                         |
| `timestamps`        | `created_at`, `updated_at` |                                |

### `personal_access_tokens`

Sanctum bearer tokens. 8-hour TTL by default; revoked on password reset.

| Column            | Type            | Notes                                   |
|-------------------|-----------------|-----------------------------------------|
| `id`              | bigint, PK      |                                         |
| `tokenable_type`  | string          | morph — points to a model class.        |
| `tokenable_id`    | bigint          | morph — points at the model row.        |
| `name`            | text            | Human label (e.g. "api").               |
| `token`           | string(64), UQ  | SHA-256 hash of the plaintext token.    |
| `abilities`       | text            | JSON array of scopes (today: `*`).      |
| `last_used_at`    | timestamp       |                                         |
| `expires_at`      | timestamp, idx  |                                         |
| `timestamps`      | `created_at`, `updated_at` |                              |

### `zones`

The 17 Nairobi sub-county zones. PostGIS-aware.

| Column           | Type                       | Notes                          |
|------------------|----------------------------|--------------------------------|
| `id`             | string, PK                 | Slug — e.g. `westlands`.       |
| `name`           | string                     |                                |
| `score`          | int (idx)                  | 0–100 Vitality Index score.    |
| `pillar_social`  | int                        |                                |
| `pillar_safety`  | int                        |                                |
| `pillar_density` | int                        |                                |
| `pillar_infra`   | int                        |                                |
| `delta_social`   | int                        | MoM change.                    |
| `delta_safety`   | int                        |                                |
| `delta_density`  | int                        |                                |
| `delta_infra`    | int                        |                                |
| `last_sync_min`  | int                        | Minutes since last ingest.     |
| `centroid`       | geography(Point, 4326)     | WGS84 marker for the zone.     |
| `boundary`       | geography(Polygon, 4326)   | Outline drawn on the map.      |
| `timestamps`     | `created_at`, `updated_at` |                                |

### `zone_layers`

GeoJSON overlays drawn on the Atlas map.

| Column        | Type                     | Notes                                          |
|---------------|--------------------------|------------------------------------------------|
| `id`          | bigint, PK               |                                                |
| `zone_id`     | FK → `zones.id`          | CASCADE on delete.                             |
| `layer_type`  | enum                     | `road_progress` / `smart_grid` / `density`.    |
| `geojson`     | jsonb                    | FeatureCollection payload.                     |
| `timestamps`  | `created_at`, `updated_at` |                                              |

UNIQUE (`zone_id`, `layer_type`) — at most one row per layer kind per zone.

### `projects`

KURA / KETRACO / KPLC project tracking.

| Column        | Type                       | Notes                                    |
|---------------|----------------------------|------------------------------------------|
| `id`          | string, PK                 |                                          |
| `name`        | string                     |                                          |
| `zone_id`     | FK → `zones.id` (idx)      | CASCADE delete.                          |
| `agency`      | string                     | e.g. KURA, KeNHA, KPLC, KETRACO.         |
| `type`        | enum                       | `road` / `energy` / `grid`.              |
| `status`      | enum (idx)                 | `active` / `stalled` / `planned`.        |
| `progress`    | int                        | 0–100 %.                                 |
| `budget`      | string                     | Human-readable; not aggregated.          |
| `started`     | date                       |                                          |
| `eta`         | date                       |                                          |
| `milestones`  | jsonb                      | Array of `{date,label,done}` objects.    |
| `marker_lon`  | decimal(10,6)              | Display point if no centroid.            |
| `marker_lat`  | decimal(10,6)              |                                          |
| `timestamps`  | `created_at`, `updated_at` |                                          |

### `alerts`

Live alerts feed. Cursor-paginated via `/api/v1/alerts`.

| Column        | Type                       | Notes                                    |
|---------------|----------------------------|------------------------------------------|
| `id`          | string, PK                 |                                          |
| `severity`    | enum (idx)                 | `high` / `medium` / `low`.               |
| `kind`        | enum                       | `infra` / `vitality` / `esia` / `system` / `partner`. |
| `title`       | string                     |                                          |
| `body`        | text                       |                                          |
| `zone_id`     | FK → `zones.id` (idx)      | NULL on zone delete; null for system-wide. |
| `read`        | bool (idx)                 | Default false.                           |
| `timestamps`  | `created_at`, `updated_at`, `deleted_at` | soft-deletes enabled.      |

### `reports`

Partner-facing PDFs / dossiers.

| Column        | Type                       | Notes                                    |
|---------------|----------------------------|------------------------------------------|
| `id`          | string, PK                 |                                          |
| `title`       | string                     |                                          |
| `zone_id`     | FK → `zones.id` (idx)      | NULL on zone delete; null for cross-zone. |
| `date`        | date                       |                                          |
| `status`      | enum (idx)                 | `published` / `review` / `draft`.        |
| `author`      | string                     |                                          |
| `size_bytes`  | int                        |                                          |
| `format`      | string                     | Default `PDF`.                           |
| `timestamps`  | `created_at`, `updated_at`, `deleted_at` | soft-deletes enabled.      |

### `activities`

Per-zone activity feed shown in the scorecard.

| Column        | Type                       | Notes                                    |
|---------------|----------------------------|------------------------------------------|
| `id`          | string, PK                 |                                          |
| `zone_id`     | FK → `zones.id` (idx)      | CASCADE delete.                          |
| `kind`        | enum                       | `road` / `grid` / `esia` / `density`.    |
| `text`        | text                       |                                          |
| `source`      | string                     | e.g. `KeNHA`, `KPLC`, `NEMA`.            |
| `timestamps`  | `created_at`, `updated_at` |                                          |

### `vitality_history`

Monthly rollup of the cross-county Vitality score average.

| Column        | Type                       | Notes                                    |
|---------------|----------------------------|------------------------------------------|
| `id`          | bigint, PK                 |                                          |
| `month`       | string                     | e.g. `May '26`.                          |
| `overall_avg` | decimal(5,1)               |                                          |
| `timestamps`  | `created_at`, `updated_at` |                                          |

### `audit_logs`

Append-only forensic trail. **Never updated** — see
`App\Support\Audit::record()` and `App\Observers\AuditableObserver`.

| Column           | Type                  | Notes                                      |
|------------------|-----------------------|--------------------------------------------|
| `id`             | bigint, PK            |                                            |
| `actor_id`       | FK → `users.id`       | NULL on user delete; null for system jobs. |
| `action`         | string(64) (idx)      | e.g. `report.created`, `auth.sign_in`.     |
| `resource_type`  | string(64)            | e.g. `Report`, `Alert`, `User`.            |
| `resource_id`    | string(64)            | Indexed jointly with resource_type.        |
| `before`         | jsonb                 | Pre-change snapshot.                       |
| `after`          | jsonb                 | Post-change snapshot.                      |
| `ip`             | inet                  | Caller IP.                                 |
| `user_agent`     | string(512)           | Truncated.                                 |
| `created_at`     | timestamp, default now() | No `updated_at` — table is append-only. |

Indexes: `(actor_id, created_at)`, `(resource_type, resource_id)`, `(action)`.

### Framework tables

The following come from Laravel's default scaffold and aren't touched by
application code:

- `password_reset_tokens` — used by `/auth/forgot-password` + `/auth/reset-password`.
- `sessions` — only populated if the SESSION_DRIVER is `database` (we use `array` in tests, `redis` in prod).
- `cache`, `cache_locks` — only populated if CACHE_STORE is `database`.
- `jobs`, `job_batches`, `failed_jobs` — Laravel queue scaffolding; we run sync in tests, redis-backed in prod.

---

## Relationships at a glance

```
users 1───* personal_access_tokens
users 1───* audit_logs            (actor)

zones 1───* zone_layers           (CASCADE)
zones 1───* projects              (CASCADE)
zones 1───* activities            (CASCADE)
zones 1───* alerts                (SET NULL)
zones 1───* reports               (SET NULL)
```

`audit_logs.resource_type/resource_id` is a manual polymorphic pointer —
not declared as an FK because we want it to survive the target row being
hard-deleted.

---

## Conventions

- **String IDs** (`zones`, `projects`, `alerts`, `reports`, `activities`,
  `zone_layers.layer_type`) are slugs so URLs stay stable across imports.
- **Soft-deletes** are enabled on `alerts` + `reports`. Everything else is
  hard-delete.
- **Timestamps** are application-level (Laravel manages them). The audit
  log is the exception — `created_at` has a DB-level `default now()`.
- **Geography vs Geometry**: zones use `geography` (4326, meters on the
  WGS84 spheroid). Projects use raw decimal lon/lat for cheap marker
  rendering.
- **Indexes**: every FK is indexed. Hot lookup columns (`zones.score`,
  `alerts.severity`, `reports.status`) have single-column indexes added in
  `2026_05_25_100002_add_indexes_to_tables.php`.

---

## Pending schema work

Tracked in [`../../tasks/todo.md`](../../tasks/todo.md):

- **GIST spatial indexes** on `zones.centroid` and `zones.boundary` (9.2).
- **`partner_id` + Row-Level Security** on a future partner-scoped overlay
  table (9.7 RLS scaffold).
- **Materialized views** for the county-wide Vitality rollup the dashboard
  uses (9.2).

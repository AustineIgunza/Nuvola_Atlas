# Navuuna — Laravel API

Headless JSON API for the Navuuna spatial intelligence platform. Serves the
React SPA in `../nuvola-atlas-frontend`, receives cleaned indicator batches
from the FastAPI service in `../nuvola-atlas-ingestion`, and computes the
Vitality Index.

Laravel 13 · PHP 8.3+ · PostgreSQL 16 + PostGIS 3.4 · Sanctum · Reverb

There are no server-rendered pages. `routes/web.php` exists only because
signed URLs (email verification, password reset) resolve through the web
stack.

## Run it locally

```bash
# 1. Test/dev database (PostGIS). Required — the suite will hang without it.
docker compose up -d postgres

# 2. Dependencies and app key
composer install
cp .env.example .env
php artisan key:generate

# 3. Schema + demo data
php artisan migrate:fresh --seed

# 4. Serve on http://localhost:8000
php artisan serve
```

Seeded admin: `austine@nuvola.dev` / `password`.

The queue must be running for scores to recalculate after an ingest:

```bash
php artisan queue:work
```

Frontend dev server runs separately from `../nuvola-atlas-frontend`
(`npm ci && npm run dev`, on `:5173`).

## Checks

Run all of these before pushing. Green across the board is the baseline.

```bash
php artisan route:list --path=api                    # 72 routes
php vendor/phpunit/phpunit/phpunit --no-coverage      # 245 tests
```

`phpunit.xml` force-overrides the connection to the local Docker Postgres on
`127.0.0.1:5434`. Without `docker compose up -d postgres` the suite hangs on
a TCP timeout rather than failing fast — if tests appear to freeze, that is
almost always why.

Tests run against a real Postgres with PostGIS. The database is never mocked:
spatial behaviour, append-only triggers and RLS policies are exactly the
things a mock would hide.

## Proving the ingestion channel end to end

```bash
php artisan nuvola:ingest-smoke
```

Drives a signed synthetic batch through the real HTTP kernel, verifies the
readings landed, waits for the queued rescore, then restores the zone and
deletes the snapshot it created. Requires `INGESTION_INTERNAL_SECRET` and a
running queue worker.

Smoke batches are stamped with a `smoke:` source prefix and are excluded from
`/api/health/intake`, so a smoke run can never make the channel look healthy
while the real feed is silent.

## Health

| Endpoint | Answers |
|---|---|
| `GET /api/health` | Is the app up? Database + cache. |
| `GET /api/health/intake` | Is data still arriving? |

`/api/health/intake` returns 503 only when the channel is **stalled**. A
rejected batch or an overdue feed reports `degraded` on a 200 — a
data-quality problem to chase, not an outage to page for.

## Documentation

All reference docs live in the repo-root `docs/` tree:

- [`docs/backend/architecture.md`](../docs/backend/architecture.md) — service internals, scoring engine, roles, audit
- [`docs/backend/schema.md`](../docs/backend/schema.md) — database design rationale
- [`docs/api/openapi.yaml`](../docs/api/openapi.yaml) — API contract (partial; see the banner inside)
- [`docs/architecture.md`](../docs/architecture.md) — cross-service data flow
- [`docs/ops/deploy.md`](../docs/ops/deploy.md) — deploy runbook
- [`docs/ops/google-oauth.md`](../docs/ops/google-oauth.md) — OAuth client setup

## Conventions

- Controllers stay thin: validate, delegate to a service, return a Resource.
- Role checks go through `role:` middleware or `App\Enums\Role` Gates — never
  an inline `$user->role === 'admin'`.
- No raw SQL except isolated, commented PostGIS queries inside a service.
- Every migration implements both `up()` and `down()`.
- Scoring runs only as a queued job, never inline in a controller.
- Missing indicators are excluded from score averages, never zero-filled.

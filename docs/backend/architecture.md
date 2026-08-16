# Navuuna — Backend Architecture

**Owner:** Khillon Makwana (Lead Programmer)
**Last updated:** 2026-08-16
**Scope:** the Laravel service only.

For how bytes cross between Daystar, the FastAPI ingestion service, Laravel,
Postgres and the SPA, read [`docs/architecture.md`](../architecture.md)
instead — that is the cross-service map. This document covers what happens
*inside* `nuvola-atlas-backend/`.

## Shape of the service

Headless JSON API. There are no server-rendered pages and no Inertia layer;
the SPA in `nuvola-atlas-frontend/` deploys separately to Vercel and talks to
this service over `/api/v1/`. `routes/web.php` survives only because signed
URLs (email verification, password reset) resolve through the web stack.

| Surface | Count | Notes |
|---|---|---|
| API routes | 72 | `php artisan route:list --path=api` is the source of truth |
| Controllers | 31 | thin — they validate, delegate to a service, return a Resource |
| Services | 34 | all real logic lives here |
| Models | 24 | |
| Migrations | 41 | |
| Middleware | 8 | |
| Form requests | 10 | |
| API resources | 14 | |
| Artisan commands | 10 | |
| Tests | 245 | integration against a real Postgres, never a mock |

Errors are RFC 7807 `application/problem+json` for every API failure, shaped
in `bootstrap/app.php`. Keeping one wire shape is what lets the OpenAPI spec
declare a single error type.

## Layering rule

`Controller → Service → Model`. Controllers do not contain business logic and
do not run raw SQL. The one deliberate exception is PostGIS spatial work,
which is allowed as isolated, commented raw SQL inside a dedicated service
method — Eloquent has no vocabulary for `ST_*`.

Scoring is never computed inside a request. `ScoreCalculator` is reached only
through the `RecalculateZoneScore` / `RecalculateAllZones` queued jobs, so a
slow rescore can never block an HTTP response.

## Scoring engine

Four pillars, thirteen indicators. Each indicator is a 0–100 normalized value
or `NULL` ("Awaiting data").

- Pillar score = simple average of that pillar's **non-null** indicators.
- Composite = weighted mean across pillars that have at least one non-null
  indicator, weights renormalized over the pillars actually present.
- **Missing indicators are excluded, never treated as zero.** This is the
  load-bearing rule. The pre-July-2026 algorithm zero-filled, which collapsed
  scores for informal settlements purely because Daystar had not delivered
  their indicators yet — the platform was punishing places for being
  undocumented, which is the exact failure Navuuna exists to fix.

Weights are read from `methodology_versions WHERE is_current` and cached for
60 seconds under `vitality_weights`. `MethodologyPublisher` drops that key on
publish, so a weight change goes live with the recalculation it triggers
rather than a minute behind it. `ScoreCalculator::DEFAULT_WEIGHTS` (an even
0.25 across the four pillars) is the fallback before any version is published,
and for any pillar a published version omits or stores as garbage.

`config/methodology.php` still holds the pillar and indicator *definitions*
(names, descriptions, groupings). It no longer holds the live weights.

## Recalculation path

```
GeoJSON import / ingest batch / methodology publish
     ▼
ZoneLayerObserver  or  IngestController
     ▼
RecalculateZoneScore  (queued, one per affected zone)
     ▼
ScoreCalculator::recalculate()
     ▼
zones.score + indicator columns + last_sync_min updated
zone_score_snapshots row appended    <-- always, even if the score is unchanged
     ▼
ZoneScoreUpdated broadcast on private channel zones.{id}
     ▼
SPA invalidates its TanStack Query cache
```

A snapshot row is written on every run regardless of whether the score moved.
That is what makes the trend chart continuous, and it is also how
`nuvola:ingest-smoke` detects a stopped queue worker without guessing.

## Authentication and roles

Sanctum bearer tokens, 8-hour TTL, revoked on password reset. Email-based 2FA
is self-service for any user and **mandatory** for admins — `/admin/*` sits
behind `role:admin` *and* `admin.two_factor`. Google OAuth runs stateless and
mints a Sanctum token before bouncing back to the SPA.

| Role | Rank | Notes |
|---|---|---|
| `viewer` | 1 | Default for new sign-ups. Read-only. |
| `partner` | 2 | Read access + partner-scoped dataset overlays. |
| `editor` | 3 | Internal team. Writes reports, flips alerts. |
| `admin` | 4 | Full access + user management. Must enrol 2FA. |

Enforcement is via the `role:` route middleware and `App\Enums\Role` Gates —
never an inline `if ($user->role === 'admin')` check. `/auth/me` returns the
caller's role and `email_verified` flag so the SPA gates its UI on the same
source of truth the API enforces.

Investor endpoints add `firm.scope` on top. Cross-firm leakage prevention is
not delegated to middleware alone: no query inside those controllers runs
without an explicit `firm_id = <caller's firm>` clause.

## Middleware aliases

| Alias | Class | Purpose |
|---|---|---|
| `role` | `EnsureRole` | Role-rank gate. |
| `partner.context` | `SetPartnerContext` | Binds the caller's partner to the request. |
| `admin.two_factor` | `RequireAdminTwoFactor` | Blocks `/admin/*` until 2FA is enrolled. |
| `http.cache` | `HttpCache` | ETag + `Cache-Control: private, max-age=N`. |
| `firm.scope` | `FirmScope` | 403s unaffiliated users off the investor suite. |
| `audit.write` | `AuditWrite` | |
| `internal.secret` / `ingest.secret` | `VerifyInternalSecret` | Hop-2 signature check. Same class, two names. |

`VerifyInternalSecret` requires the presented secret to be at least 48 chars,
compares in constant time, and allows a ±300s clock skew on the signed path.
On rejection it logs only `sha256:<first 12 hex>` of what was presented —
never the value itself.

## Audit log

`audit_logs` is append-only: no `updated_at`, and Eloquent updates and deletes
throw. Columns: `actor_id`, `action`, `resource_type`, `resource_id`, `before`
(jsonb), `after` (jsonb), `ip`, `user_agent`, `created_at`. Two write paths:

- `App\Observers\AuditableObserver` — registered on `Report` and `Alert`.
  Captures `<model>.created` / `.updated` / `.deleted` automatically.
- `App\Support\Audit::record(...)` — explicit calls for non-Eloquent events:
  `auth.sign_in`, `auth.sign_out`, `alert.bulk_read`.

Audit failures are reported but never propagate — auditing must not break the
request it is recording. There is no public API over `audit_logs`; forensic
queries go straight to Postgres.

## Security headers

`App\Http\Middleware\SecurityHeaders` runs on both the web and API stacks:
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy: camera=(),
microphone=(), geolocation=()`, `Cross-Origin-Opener-Policy: same-origin`,
`Cross-Origin-Resource-Policy: same-site`, HSTS in production only, and a CSP
on HTML responses restricted to same-origin plus the Mapbox hosts with no
`unsafe-eval` and `frame-ancestors 'none'`.

Disclosure policy is in [`SECURITY.md`](../../SECURITY.md).

## Scheduled work

Defined in `routes/console.php`.

| Command | Schedule | Purpose |
|---|---|---|
| `atlas:recalculate-scores` | hourly | Rescore every zone. |
| `atlas:sync-history` | monthly | Record the monthly vitality average. |
| `atlas:backup-database` | daily 02:00 | |
| `nuvola:refresh-county-rollup` | daily 03:00 | Rebuild the `county_vitality_rollup` matview. |
| `nuvola:prune-ingestion-payloads` | daily 03:45 | 30-day raw-payload retention sweep. |
| `nuvola:alert-stale-feeds` | daily 02:30 | One alert per overdue/missing feed, deduped over 24h. |
| `nuvola:remind-admin-2fa` | daily 09:00 | Escalates to account lock after 7 days. |
| `nuvola:pregen-firm-briefs` | Sunday 03:15 UTC | Warms the investor brief PDF. |

Manual: `atlas:import-geojson`, `nuvola:ingest-smoke`.

## Health probes

- `GET /api/health` — "is the app up". Database + cache.
- `GET /api/health/intake` — "is data still arriving". Named *intake*, not
  *ingestion*, because the FastAPI service already owns
  `/api/health/ingestion` on its own host and two identically-named health
  endpoints meaning different things is a trap at 2am.

`/api/health/intake` reads `arrived_at`, never `received_at` — the legacy
single-zone endpoint lets the caller supply `received_at`, so it is the one
timestamp a misconfigured publisher could use to fake freshness. Batches
whose `source` carries the `smoke:` prefix are excluded from both the
freshness check and the 24h tallies, so a smoke run can never make the
channel look green while Daystar sits silent.

Only `stalled` returns 503. A rejected batch or an overdue feed reports
`degraded` on a 200 — that is a data-quality problem for the team to chase,
not an outage, and it should not page anyone.

## Directory map

```
nuvola-atlas-backend/
├── app/
│   ├── Console/Commands/     # 10 — atlas:* and nuvola:*
│   ├── Enums/                # Role, FirmTier, FirmUserRole
│   ├── Events/               # ZoneScoreUpdated, ZoneLayerUpdated, NewAlertCreated
│   ├── Http/
│   │   ├── Controllers/      # 31
│   │   ├── Middleware/       # 8
│   │   ├── Requests/         # 10
│   │   └── Resources/        # 14
│   ├── Jobs/                 # RecalculateZoneScore, RecalculateAllZones
│   ├── Models/               # 24
│   ├── Observers/            # AuditableObserver, ZoneLayerObserver
│   ├── Services/             # 34, grouped by domain:
│   │   ├── Agents/           #   tool-calling loop + 7 tools
│   │   ├── Chat/             #   text-to-SQL RAG: router, generator, guard, executor
│   │   ├── Export/           #   PDF/DOCX zone + firm briefs
│   │   ├── Feeds/  Firms/  Forecast/  Methodology/  Watchlist/
│   │   └── ScoreCalculator.php
│   └── Support/              # Audit
├── config/methodology.php    # pillar + indicator definitions (not weights)
├── database/
│   ├── factories/            # 11
│   ├── migrations/           # 41
│   └── seeders/              # 16
└── tests/                    # 245
```

## Related

- [`docs/architecture.md`](../architecture.md) — cross-service data topography
- [`docs/backend/schema.md`](schema.md) — database design rationale
- [`docs/api/openapi.yaml`](../api/openapi.yaml) — machine-readable API contract
- [`docs/ops/deploy.md`](../ops/deploy.md) — deploy runbook

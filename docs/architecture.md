# Navuuna — System Architecture

**Owner:** Devyan Jethwa (CTIPSO)
**Last updated:** 2026-07-16 (indicator-count correction; Phase A remainders + Phase B contracts still open)
**Status:** Phase A scaffold. Populate live endpoints as Phase A checkboxes clear. Phase A remainders (Vercel Fluid Compute target validation, ingestion Sentry project, Docker Compose orchestrator) are Devyan's Week 1 tasks under `tasks/team/week-01/devyan.md`.

This document maps the data topography for the Navuuna Nairobi pilot — every
edge a byte crosses from Daystar University's raw indicator drop to the
partner-facing UI. It is the reference for on-call debugging and for the
final board sign-off in Phase D.

## Systems on the graph

| System                 | Owner    | Runtime                       | Public? |
|------------------------|----------|-------------------------------|---------|
| Daystar feed source    | Daystar  | Daystar-hosted CSV/JSON drops | No      |
| Ingestion service      | Devyan   | FastAPI on Vercel Fluid Compute (Python 3.13) | No (X-Internal-Secret) |
| Laravel API            | Khillon  | PHP 8.3 on DigitalOcean via Forge | Yes (Sanctum + rate-limited) |
| PostgreSQL + PostGIS   | Khillon  | Supabase (pooled :6543, direct :5432) | No |
| Reverb websocket       | Khillon  | Laravel Reverb on Forge       | Yes (WSS) |
| Frontend               | Austine  | Vite + React SPA on Vercel    | Yes (public + partner routes) |
| Sentry                 | Shared   | sentry.io                     | No |
| Cloudflare DNS / WAF   | Devyan   | Cloudflare edge               | Public entry point |

## Data flow — happy path

```
Daystar drop
     │  (CSV/JSON over HTTPS, cron-triggered)
     ▼
FastAPI ingestion service            <-- nuvola-atlas-ingestion/
     │  clean_batch()  → WGS84, ISO 8601 UTC, null-drop
     │  detect_anomalies()  → z-score guard
     │  POST /api/v1/ingest/... with X-Internal-Secret
     ▼
Laravel intake route                 <-- nuvola-atlas-backend/
     │  Log write to data_ingestion_logs (append-only)
     │  Dispatch VitalityScoreService as an async job
     ▼
PostgreSQL + PostGIS                 <-- Supabase
     │  Zone tables, GeoJSON columns, materialized views
     ▼
Reverb broadcast                     <-- Laravel Echo channel `zones`
     ▼
Frontend                             <-- React + Mapbox GL JS
        Map, scorecard, Daystar indicator ledger
```

## Data flow — anomalies and rejections

- Anomalies (`|z| ≥ 3.5`) are surfaced in the batch receipt returned by
  the ingestion service. The forwarder logs them, and the batch is still
  written; anomalies are marked for review, not silently dropped.
- Row-level rejections (missing zone_id, unknown indicator, bad
  timestamp) are attached to the receipt with `_reject_reason` so
  Daystar can fix the source and resubmit.
- All rejections and anomalies land in an append-only
  `data_ingestion_logs` row on the Laravel side (Phase B — Khillon).

## Environments

| Environment | Ingestion               | Laravel API                   | Database                | Frontend                |
|-------------|-------------------------|-------------------------------|-------------------------|-------------------------|
| Local       | uvicorn on :8001        | php artisan serve on :8000    | Docker Postgres :5434   | vite dev on :5173       |
| Staging     | Vercel preview function | Forge staging droplet         | Supabase staging branch | Vercel preview URL      |
| Production  | Vercel prod function    | Forge production droplet      | Supabase prod           | navuuna.strathmore… (TBD) |

## Cross-service secrets

| Secret                       | Consumer         | Set by  | Notes |
|------------------------------|------------------|---------|-------|
| `INGESTION_INTERNAL_SECRET`  | FastAPI, Laravel | Devyan  | Rotated with `docs/ops/secret-rotation.md`. |
| `INGESTION_DAYSTAR_FEED_BASE`| FastAPI          | Devyan  | Daystar-provided base URL for scheduled fetches. |
| `INGESTION_SENTRY_DSN`       | FastAPI          | Devyan  | Independent from the Laravel + frontend DSNs. |
| `SUPABASE_DB_URL`            | Laravel          | Khillon | Pooled :6543 for app, direct :5432 for migrations. |
| `SENTRY_DSN`                 | Laravel          | Khillon | Separate project. |
| `VITE_SENTRY_DSN`            | Frontend         | Austine | Separate project. Public DSN — safe in bundle. |
| `VITE_MAPBOX_ACCESS_TOKEN`   | Frontend         | Austine | Restricted-scope Mapbox token. |
| `VITE_USE_REMOTE_API`        | Frontend         | Austine | `true` on production only; previews stay mock. |

## Observability

- Sentry — three separate projects (frontend, Laravel, ingestion).
  Boundaries make it easy to route pages: the ingestion project pages
  Devyan; the Laravel project pages Khillon; the frontend project pages
  Austine.
- Ingestion service exposes `/api/health/ingestion` for platform pings.
- BetterStack aggregates production errors across the three Sentry
  projects and pipes to Slack for on-call.

## Related documents

- `docs/ops/deploy.md` — deploy runbook
- `docs/ops/incident-response.md` — incident playbook
- `docs/ops/rollback.md` — rollback playbook
- `docs/ops/secret-rotation.md` — secret rotation
- `docs/data/daystar-indicator-spec.md` — Daystar 13-indicator spec (Pillar 4 carries four indicators; the codebase is the source of truth for the count)
- `docs/data/internal-transport.md` — X-Internal-Secret transport contract

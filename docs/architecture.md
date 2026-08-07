# Navuuna — System Architecture

**Owner:** Devyan Jethwa (CTIPSO)
**Last updated:** 2026-08-07 (n8n automation block added; hop-2 signing recorded; Vercel Fluid Compute target landed)
**Status:** Phase A closed on the ingestion side — Fluid Compute target, ingestion Sentry wiring, Docker Compose orchestrator, and the n8n automation glue are all in the repo. Remaining Phase B work is blocked on Daystar delivering a feed URL.

This document maps the data topography for the Navuuna Nairobi pilot — every
edge a byte crosses from Daystar University's raw indicator drop to the
partner-facing UI. It is the reference for on-call debugging and for the
final board sign-off in Phase D.

## Systems on the graph

| System                 | Owner    | Runtime                       | Public? |
|------------------------|----------|-------------------------------|---------|
| Daystar feed source    | Daystar  | Daystar-hosted CSV/JSON drops | No      |
| n8n automation         | Devyan   | n8n container on the Forge droplet | No (Cloudflare Access; `/webhook/*` bypassed) |
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
     │
     ├──▶ n8n workflow #1                <-- infra/n8n/workflows/
     │       filename gate → POST → Slack #data-feeds
     │
     └──▶ Vercel Cron / manual tick      <-- pull, when Daystar publishes a feed URL
             │
             ▼
        HOP 1 — third-party edge: X-Internal-Secret token only
             ▼
FastAPI ingestion service            <-- nuvola-atlas-ingestion/
     │  spend guards  → payload size, rows/batch, rows/day, circuit breaker
     │  payload_hash  → SHA-256 dedupe, replays return the original receipt
     │  clean_batch()  → WGS84, ISO 8601 UTC, null-drop
     │  detect_anomalies()  → z-score guard
     │
     ▼
HOP 2 — ours end to end: token + X-Internal-Timestamp + HMAC-SHA256 signature
     │  1 attempt + 3 retries, 1s/4s/16s, re-signed per attempt
     ▼
Laravel intake route                 <-- nuvola-atlas-backend/
     │  VerifyInternalSecret → constant-time compare, ±300s skew window
     │  Log write to data_ingestion_logs (append-only)
     │  Dispatch VitalityScoreService as an async job
     ▼
PostgreSQL + PostGIS                 <-- Supabase
     │  Zone tables, GeoJSON columns, materialized views
     ▼
Reverb broadcast                     <-- Laravel Echo channel `zones.{id}`
     ▼
Frontend                             <-- React + Mapbox GL JS
        Map, scorecard, Daystar indicator ledger
```

The two hops carry different credentials on purpose. Hop 1 crosses a
third-party boundary — requiring a university partner to implement request
signing would stall Phase B on someone else's release cycle — so it is a
bearer token over public HTTPS. Hop 2 is ours on both ends, so it is signed.
The full contract, including the canonical signing string, is in
`docs/data/internal-transport.md`.

## Automation glue — n8n

n8n sits beside the data path rather than inside it. It converts a Daystar
file drop into an ingestion POST and reports the result to Slack; if it is
down, ingestion still accepts a direct POST and only the automatic pickup is
lost. It has no database access of its own beyond its private `n8n` schema,
which is isolated from `public` so `migrate:fresh` cannot wipe it.

Workflow #1 (`01-daystar-drop-intake.json`) gates on the drop filename
convention before spending an ingestion call, and delegates idempotency to
the ingestion service's payload hash rather than tracking its own. Exposure
is Cloudflare Access only — see `infra/n8n/README.md`, including why the
`/webhook/*` bypass is safe.

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
| Local       | uvicorn on :8001 (:8100 in compose) | php artisan serve on :8000 | Docker Postgres :5434 | vite dev on :5173 |
| Staging     | Vercel preview function | Forge staging droplet         | Supabase staging branch | Vercel preview URL      |
| Production  | Vercel prod function    | Forge production droplet      | Supabase prod           | navuuna.strathmore… (TBD) |

## Cross-service secrets

| Secret                       | Consumer         | Set by  | Notes |
|------------------------------|------------------|---------|-------|
| `INGESTION_INTERNAL_SECRET`  | FastAPI          | Devyan  | Rotated with `docs/ops/secret-rotation.md`. |
| `INGEST_INTERNAL_SECRET`     | Laravel          | Khillon | **Same value as the row above, different name.** Laravel reads `INGEST_`, FastAPI reads `INGESTION_`. They must be byte-identical or every batch 401s at hop 2. |
| `INGESTION_DAYSTAR_FEED_BASE`| FastAPI          | Devyan  | Daystar-provided base URL for scheduled fetches. |
| `INGESTION_SENTRY_DSN`       | FastAPI          | Devyan  | Independent from the Laravel + frontend DSNs. |
| `CRON_SECRET`                | FastAPI          | Devyan  | Vercel Cron bearer. Separate from the transport secret because Vercel Cron cannot set custom headers. |
| `N8N_ENCRYPTION_KEY`         | n8n              | Devyan  | Rotating it orphans every stored n8n credential. |
| `SLACK_DATA_FEEDS_WEBHOOK`   | n8n              | Devyan  | Incoming webhook for `#data-feeds`. |
| `SUPABASE_DB_URL`            | Laravel          | Khillon | Pooled :6543 for app, direct :5432 for migrations. |
| `SENTRY_DSN`                 | Laravel          | Khillon | Separate project. |
| `VITE_SENTRY_DSN`            | Frontend         | Austine | Separate project. Public DSN — safe in bundle. |
| `VITE_MAPBOX_TOKEN`          | Frontend         | Austine | Restricted-scope Mapbox token. Unset renders the styled SVG fallback rather than failing. |
| `VITE_USE_REMOTE_API`        | Frontend         | Austine | `true` on production only; previews stay mock. |

## Observability

- Sentry — three separate projects (frontend, Laravel, ingestion).
  Boundaries make it easy to route pages: the ingestion project pages
  Devyan; the Laravel project pages Khillon; the frontend project pages
  Austine.
- Ingestion service exposes `/api/health/ingestion` for platform pings and
  `/api/health/guards` for live spend-guard state (budget used, breaker
  open/closed). Guard counters are per-process and reset on a cold start —
  the durable record is `data_ingestion_logs`.
- BetterStack aggregates production errors across the three Sentry
  projects and pipes to Slack for on-call.

## Related documents

- `docs/ops/CREDENTIALS-NEEDED.md` — every account, key, and human-only action still outstanding
- `docs/ops/deploy.md` — deploy runbook (Laravel + frontend)
- `docs/ops/ingestion-deploy.md` — ingestion deploy runbook (Vercel Fluid Compute)
- `infra/n8n/README.md` — n8n exposure, workflows, git round-trip
- `docs/ops/incident-response.md` — incident playbook
- `docs/ops/rollback.md` — rollback playbook
- `docs/ops/secret-rotation.md` — secret rotation
- `docs/data/daystar-indicator-spec.md` — Daystar 13-indicator spec (Pillar 4 carries four indicators; the codebase is the source of truth for the count)
- `docs/data/internal-transport.md` — X-Internal-Secret transport contract

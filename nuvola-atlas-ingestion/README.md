# Nuvola Atlas Ingestion Service

FastAPI microservice that cleans and forwards Daystar University indicator
batches into the Navuuna Laravel API. Owned by Devyan (CTIPSO). Isolated
from the Laravel app so a batch ingest spike cannot destabilise the
partner-facing website.

## Stack

- Python 3.13/3.14 (Vercel Fluid Compute compatible)
- FastAPI + Pydantic v2 + pydantic-settings
- Ruff (lint) + Mypy (types) + Pytest (tests)
- Sentry SDK (DSN-gated at boot)

## Quick start

```bash
python -m venv .venv
.venv/Scripts/activate     # or `source .venv/bin/activate` on macOS/Linux
pip install -e .[dev]
cp .env.example .env       # edit secrets locally, never commit
uvicorn app.main:app --reload --port 8001
```

Health probe:

```bash
curl http://localhost:8001/api/health/ingestion
```

Ingest a batch (requires `X-Internal-Secret`):

```bash
curl -X POST http://localhost:8001/api/ingest/indicators \
  -H 'Content-Type: application/json' \
  -H 'X-Internal-Secret: change-me-per-environment' \
  -d @tests/fixtures/sample_batch.json
```

## Checks

```bash
ruff check .
mypy app
pytest
```

## Spend guards

Every ingest is bounded (`app/guards.py`, overridable per environment):

| Guard | Default | Response |
|-------|---------|----------|
| Payload size | 10 MB | 413 |
| Rows per batch | 5 000 | 413 |
| Rows per UTC day | 100 000 | 429 + `Retry-After` |
| Circuit breaker | 3 consecutive Laravel 5xx → 60s open | 503 + `Retry-After` |

Live state: `GET /api/health/guards`. Counters are per-process, so they are a
local brake — the durable record is Laravel's `data_ingestion_logs`.

Replayed batches are deduplicated by SHA-256 of the raw body for one hour and
return the original receipt with `"duplicate": true`.

## Scheduled ingest

| Route | Caller | Credential |
|-------|--------|-----------|
| `GET /api/cron/tick` | Vercel Cron | `Authorization: Bearer $CRON_SECRET` |
| `POST /internal/scheduler/tick` | n8n / Docker cron / manual | `X-Internal-Secret` |

Both pull `INGESTION_DAYSTAR_FEED_BASE`. With that unset the tick is a healthy
no-op — Phase B is blocked on Daystar delivering a feed URL.

## Deploy

Two target shapes are supported:

1. **Vercel Fluid Compute** — `api/index.py` + `vercel.json` + `requirements.txt`.
   Full runbook, env vars, and cold-start notes: `docs/ops/ingestion-deploy.md`.
2. **Uvicorn on Forge / Docker Compose** — `Dockerfile` at the repo root of
   this service, orchestrated by the top-level `docker-compose.yml`.

Sentry DSN, `INGESTION_INTERNAL_SECRET`, `CRON_SECRET`, and
`INGESTION_DAYSTAR_FEED_BASE` must be set per-environment (Vercel/Forge
dashboards); never in code.

See `docs/architecture.md` for the full data topography and
`docs/data/internal-transport.md` for the signed FastAPI → Laravel contract.

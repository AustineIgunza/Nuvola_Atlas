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

## Deploy

Two target shapes are supported:

1. **Vercel Fluid Compute** — Python 3.13 function. `app/main.py` exports
   `app`; add a `vercel.json` at deploy time pointing at it.
2. **Uvicorn on Forge** — behind Nginx alongside the Laravel app for the
   `docker-compose` local stack.

Sentry DSN, `INGESTION_INTERNAL_SECRET`, and `INGESTION_DAYSTAR_FEED_BASE`
must be set per-environment (Vercel/Forge dashboards); never in code.

See `docs/architecture.md` for the full data topography.

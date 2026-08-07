# Ingestion Service Deploy — Vercel Fluid Compute

**Owner:** Devyan (CTIPSO)
**Last updated:** 2026-08-07
**Applies to:** `nuvola-atlas-ingestion/`

The FastAPI ingestion service deploys to Vercel Fluid Compute as a single
Python function. Laravel deploys separately to Forge + DigitalOcean (see
`docs/ops/deploy.md`) — the two are joined only by the signed HTTP hop in
`docs/data/internal-transport.md`.

## Why Fluid Compute

Ingestion is bursty: nothing for days, then a Daystar drop that takes tens of
seconds to clean and forward. Classic serverless bills per-invocation wall
clock and caps out at 60s on the Hobby tier; Fluid Compute keeps a warm
instance and allows `maxDuration: 300`, which is what a 5000-row batch with a
retrying forwarder actually needs.

## Repo artifacts

| File | Purpose |
|------|---------|
| `api/index.py` | Entrypoint Vercel discovers — re-exports `app.main:app` |
| `vercel.json` | Function limits, catch-all rewrite, cron schedule |
| `requirements.txt` | What Vercel's builder installs (mirrors `pyproject.toml`) |
| `Dockerfile` | The *other* target — Docker Compose / Forge, not Vercel |

`vercel.json` routes every path to the one function, so FastAPI keeps owning
its own routing table. Adding a route needs no Vercel change.

## One-time project setup

Nothing below can be done from the repo — it all needs dashboard access.

1. **Create the project.** Import the repo, set **Root Directory** to
   `nuvola-atlas-ingestion`. Framework preset: *Other*.
2. **Enable Fluid Compute.** Settings → Functions → Fluid Compute → on.
   Without this, `maxDuration: 300` is rejected at build time.
3. **Set the Python version.** Settings → General → Node.js/Python version →
   `3.13`. This must match `requires-python` in `pyproject.toml`.
4. **Add environment variables** (all three environments unless noted):

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `INGESTION_LARAVEL_BASE_URL` | `https://api.navuuna.dev/api/v1` | Preview points at staging |
   | `INGESTION_INTERNAL_SECRET` | `openssl rand -base64 48` | **Must equal** Forge's `INGEST_INTERNAL_SECRET` |
   | `INGESTION_SENTRY_DSN` | from the ingestion Sentry project | Empty disables Sentry cleanly |
   | `INGESTION_ENVIRONMENT` | `production` / `preview` | Tags Sentry events |
   | `INGESTION_DAYSTAR_FEED_BASE` | Daystar drop base URL | Blank until Daystar delivers; ticks no-op |
   | `CRON_SECRET` | `openssl rand -base64 32` | Vercel sends it as the cron bearer |
   | `INGESTION_DAILY_BUDGET` | `100000` | Optional; default is 100k rows/day |

5. **Verify the cron registered.** Settings → Cron Jobs should list
   `/api/cron/tick` at `0 */6 * * *` after the first production deploy.

## Cold starts

Fluid Compute keeps instances warm between invocations, but the first request
after a deploy or a long idle still pays a cold start:

- **Import cost** is the whole budget here — FastAPI + pydantic + sentry-sdk
  is roughly 1.2–1.8s on a 1024MB instance.
- **No database driver** is loaded on this side (Laravel owns Postgres), which
  is why the ingestion cold start is cheaper than the API's would be.
- The six-hourly cron doubles as a keep-warm. Do not lengthen the schedule
  past ~6h without checking whether a cold tick still fits the timeout.
- Health probes hit `/api/health/ingestion`, which touches no I/O, so an
  uptime monitor on it measures cold-start latency honestly.

**The spend guards do not survive a cold start.** `app/guards.py` and
`app/idempotency.py` hold per-process state, so a new instance starts with a
fresh budget counter, a closed circuit, and an empty dedupe table. They are a
fast local brake; the durable record is Laravel's `data_ingestion_logs`.

## The two cron entrypoints

| Route | Caller | Credential |
|-------|--------|-----------|
| `GET /api/cron/tick` | Vercel Cron | `Authorization: Bearer $CRON_SECRET` |
| `POST /internal/scheduler/tick` | n8n, Docker cron, a human | `X-Internal-Secret` |

Vercel Cron cannot set custom headers, which is the whole reason there are
two. They run identical work; the GET variant exists only to satisfy Vercel's
calling convention.

Manual trigger:

```bash
curl -X POST https://ingest.navuuna.dev/internal/scheduler/tick \
  -H "X-Internal-Secret: $INGESTION_INTERNAL_SECRET"
```

A tick with no `INGESTION_DAYSTAR_FEED_BASE` returns
`{"status": "skipped"}` and exits 0 — Phase B is blocked on Daystar, and cron
should stay green while we wait.

## Post-deploy check

```bash
curl https://ingest.navuuna.dev/api/health/ingestion   # -> {"status":"ok",...}
curl https://ingest.navuuna.dev/api/health/guards      # -> budget + breaker state
```

Then confirm the hop end to end by posting a one-row batch and watching for a
matching row in Laravel's `data_ingestion_logs`.

## Rollback

Vercel keeps every deployment. Promote the previous one from the dashboard —
there is no migration state on this side, so rollback is instant and safe.
The only stateful coupling is `INGESTION_INTERNAL_SECRET`; if a rollback
crosses a secret rotation, roll the Forge value back in the same window.

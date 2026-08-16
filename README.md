# Navuuna

**A spatial intelligence network for African industrial development.**
Pilot: Nairobi County, Kenya.

Navuuna turns Kenya's physical infrastructure into a live, queryable map, and
scores every locality 0–100 on the **UE Vitality Index** — four pillars, 
thirteen indicators, built so that a place is never penalised for being
undocumented.

Student-led project, Strathmore University. See [`COPYRIGHT.md`](COPYRIGHT.md)
for ownership.

## Repository layout

| Path | What it is | Owner |
|---|---|---|
| `nuvola-atlas-frontend/` | React 18 + Vite + TypeScript SPA. Mapbox GL JS, TanStack Query. Deploys to Vercel. | Austine |
| `nuvola-atlas-backend/` | Laravel 13 headless JSON API. PostgreSQL + PostGIS, Sanctum, Reverb. Deploys to Forge/DigitalOcean. | Khillon |
| `nuvola-atlas-ingestion/` | FastAPI service (Python 3.13). Cleans and validates Daystar indicator batches. Deploys to Vercel Fluid Compute. | Devyan |
| `infra/n8n/` | n8n automation glue — turns a Daystar file drop into an ingestion POST. | Devyan |
| `docs/` | All reference documentation. Start at [`docs/README.md`](docs/README.md). | Shared |
| `tasks/` | Working backlog and per-week team assignments. | Shared |

`NuvolaAtlasPrototype.jsx` at the root is the approved design spec for the
frontend. It is a reference artefact — do not edit it.

## Running the stack

Each service runs standalone; you rarely need all three. Full instructions
live in [`docs/team-setup.md`](docs/team-setup.md).

```bash
# Backend  (http://localhost:8000)
cd nuvola-atlas-backend
docker compose up -d postgres      # PostGIS — required, tests hang without it
composer install && cp .env.example .env && php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve

# Frontend (http://localhost:5173)
cd nuvola-atlas-frontend
npm ci && npm run dev

# Ingestion (http://localhost:8001)
cd nuvola-atlas-ingestion
pip install -r requirements.txt && uvicorn app.main:app --reload --port 8001
```

Or bring the whole thing up with the root orchestrator:

```bash
docker compose -f docker-compose.dev.yml up
```

## The checks

Nothing gets pushed until all five are green.

```bash
cd nuvola-atlas-frontend && npx tsc --noEmit          # types
cd nuvola-atlas-frontend && npx vite build            # build
cd nuvola-atlas-frontend && npx vitest run            # 25 tests
cd nuvola-atlas-backend  && php artisan route:list --path=api    # 72 routes
cd nuvola-atlas-backend  && php vendor/phpunit/phpunit/phpunit --no-coverage   # 245 tests
```

## How data moves

```
Daystar drop → n8n → FastAPI ingestion → [signed hop] → Laravel → Postgres/PostGIS → Reverb → SPA
```

The two network hops carry different credentials deliberately: hop 1 crosses
a third-party boundary and uses a bearer token, hop 2 is ours on both ends and
is HMAC-signed. Full detail in [`docs/architecture.md`](docs/architecture.md).

## Documentation

[`docs/README.md`](docs/README.md) is the index. The documents you will want
first:

- [`docs/CONTEXT.md`](docs/CONTEXT.md) — complete standing brief on the project
- [`docs/architecture.md`](docs/architecture.md) — cross-service data topography
- [`docs/backend/architecture.md`](docs/backend/architecture.md) — inside the Laravel service
- [`docs/ops/CREDENTIALS-NEEDED.md`](docs/ops/CREDENTIALS-NEEDED.md) — what is still blocked on a human

## Status

Phase A is closed. Phase B (ingestion → scoring) is code-complete and
verifiable end to end via `php artisan nuvola:ingest-smoke`; the remaining
work is blocked on Daystar delivering a live feed URL. Progress is tracked in
[`Navuuna Build Phases.txt`](Navuuna%20Build%20Phases.txt) and
[`tasks/todo.md`](tasks/todo.md).

## Security

Report vulnerabilities per [`SECURITY.md`](SECURITY.md). Never commit
secrets — every credential is read from the environment, and
[`docs/ops/secret-rotation.md`](docs/ops/secret-rotation.md) covers rotation.

# Navuuna

**A sub-county service-performance record for Nairobi County, Kenya.**

Navuuna publishes what is actually measured about service delivery in
Nairobi's sub-counties, and shows the shape of what is not. Three pillars are
live — Water & Sanitation (flagship), Road Density and Transit Access — with
Electricity Access held until its census vintage is labelled. Every value
carries its source, vintage, granularity and method. A pillar we cannot
measure renders grey and carries no number, rather than being filled in with
a proxy.

The taxonomy lives in [`pillars.json`](pillars.json) and is generated into all
three packages, so a pillar is retired in one place. Switched off means
deleted, not flagged.

The scope was deliberately narrowed in August 2026. It is **not** a general
urban intelligence platform. [`CLAUDE.md`](CLAUDE.md) holds the current scope
and the rules that keep it honest; [`NAVUUNA_REFOCUS_WORKFLOW.md`](NAVUUNA_REFOCUS_WORKFLOW.md)
is the plan of record for getting there.

Student-led project, Strathmore University. See [`COPYRIGHT.md`](COPYRIGHT.md)
for ownership.

## Repository layout

| Path | What it is | Owner |
|---|---|---|
| `nuvola-atlas-frontend/` | React 18 + Vite + TypeScript SPA. Mapbox GL JS, TanStack Query. Deploys to Vercel. | Austine |
| `nuvola-atlas-backend/` | Laravel 13 headless JSON API. PostgreSQL + PostGIS, Sanctum, Reverb. Deploys to Forge/DigitalOcean. | Khillon |
| `nuvola-atlas-ingestion/` | FastAPI service (Python 3.13). Cleans and validates incoming pillar readings. Deploys to Vercel Fluid Compute. | Devyan |
| `infra/n8n/` | n8n automation glue — turns a Daystar file drop into an ingestion POST. | Devyan |
| `docs/` | The OpenAPI spec and brand assets. The prose docs were retired in the Aug 2026 refocus — `git log -- docs/` if you need them. | Shared |

`NuvolaAtlasPrototype.jsx` at the root is the approved design spec for the
frontend. It is a reference artefact — do not edit it.

## Running the stack

Each service runs standalone; you rarely need all three.

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

Nothing gets pushed until the blocking checks are green.

```bash
docker compose -f nuvola-atlas-backend/docker-compose.yml up -d postgres
bash scripts/check.sh
```

Six checks: pillar-registry drift, phpunit (311 tests), phpstan, frontend
typecheck, vitest (44 tests), and the Vite build. All but phpstan gate — it
carries pre-existing level-5 debt and is reported rather than enforced.

## How data moves

```
Daystar drop → n8n → FastAPI ingestion → [signed hop] → Laravel → Postgres/PostGIS → Reverb → SPA
```

The two network hops carry different credentials deliberately: hop 1 crosses
a third-party boundary and uses a bearer token, hop 2 is ours on both ends and
is HMAC-signed.

## Documentation

[`docs/api/openapi.yaml`](docs/api/openapi.yaml) is the API contract. Each
package has its own README. Everything else lives in the code.

## Status

Mid-refocus. The security remediation is done — the AI assistant now reaches
personal data through neither the allowlist, the database grants, nor the SQL
guard. The pillar registry and the scope cut are done too: the retired
taxonomy is gone from all three packages, and a test sweeps the public read
surface to prove a switched-off pillar cannot reach a response.

Remaining sequence and acceptance criteria are in
[`NAVUUNA_REFOCUS_WORKFLOW.md`](NAVUUNA_REFOCUS_WORKFLOW.md).

## Security

Report vulnerabilities per [`SECURITY.md`](SECURITY.md). Never commit
secrets — every credential is read from the environment.

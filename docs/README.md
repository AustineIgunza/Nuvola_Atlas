# Navuuna documentation

Every reference document lives in this tree. Each service directory keeps a
README that points back here rather than carrying its own docs folder — one
navigable tree beats four that drift apart.

## Start here

| If you are… | Read |
|---|---|
| New to the project | [`CONTEXT.md`](CONTEXT.md) — the full standing brief |
| Setting up your machine | [`team-setup.md`](team-setup.md) |
| Debugging a cross-service issue | [`architecture.md`](architecture.md) |
| On call | [`ops/incident-response.md`](ops/incident-response.md) |

## Architecture

- [`architecture.md`](architecture.md) — cross-service data topography: every
  edge a byte crosses from Daystar's drop to the partner UI. The reference for
  on-call debugging.
- [`backend/architecture.md`](backend/architecture.md) — inside the Laravel
  service: layering, scoring engine, roles, audit log, scheduled work.
- [`backend/schema.md`](backend/schema.md) — database design rationale. Why
  the schema is shaped this way; `database/migrations/` is the source of
  truth for the columns themselves.

## API

- [`api/openapi.yaml`](api/openapi.yaml) — machine-readable contract.
  **Currently partial** (17 of 72 routes, last regenerated 2026-06-04) — see
  the banner inside. `php artisan route:list --path=api` is authoritative
  until it is rebuilt.

## Data

- [`data/daystar-indicator-spec.md`](data/daystar-indicator-spec.md) — the 13
  indicators Daystar delivers, and their normalization rules.
- [`data/internal-transport.md`](data/internal-transport.md) — the
  `X-Internal-Secret` transport contract between FastAPI and Laravel,
  including the canonical signing string.

## Product

- [`admin-and-investor-workflows.md`](admin-and-investor-workflows.md) — what
  admins and investors can do in the platform, and what is still roadmap.

## Operations

- [`ops/CREDENTIALS-NEEDED.md`](ops/CREDENTIALS-NEEDED.md) — every account,
  key and human-only action still outstanding.
- [`ops/deploy.md`](ops/deploy.md) — Laravel + frontend deploy (Forge +
  DigitalOcean + Supabase + Cloudflare).
- [`ops/ingestion-deploy.md`](ops/ingestion-deploy.md) — FastAPI deploy
  (Vercel Fluid Compute).
- [`ops/google-oauth.md`](ops/google-oauth.md) — Google OAuth client setup.
- [`ops/rollback.md`](ops/rollback.md) — rollback playbook.
- [`ops/incident-response.md`](ops/incident-response.md) — incident playbook.
- [`ops/postmortem-template.md`](ops/postmortem-template.md) — postmortem
  template.
- [`ops/secret-rotation.md`](ops/secret-rotation.md) — rotation policy.

## Brand

[`brand/`](brand/) holds the brand board and the logo explorations from the
Nuvola Atlas → Navuuna rebrand. The shipping logo assets live with the app
that renders them, in `nuvola-atlas-frontend/public/`.

## Elsewhere in the repo

- [`infra/n8n/README.md`](../infra/n8n/README.md) — n8n exposure, workflows,
  and the git round-trip.
- [`Navuuna Build Phases.txt`](../Navuuna%20Build%20Phases.txt) — the phase
  tracker. Append-only: update checkboxes and append new phases, never
  rewrite or delete it.
- [`tasks/todo.md`](../tasks/todo.md) — the working backlog.
- [`SECURITY.md`](../SECURITY.md) — responsible disclosure.
- [`COPYRIGHT.md`](../COPYRIGHT.md) — ownership and licensing.

## Archive

[`archive/`](archive/) holds superseded planning documents. They are kept for
provenance — they record why decisions were made — but they describe past
intent, not current state. Do not treat anything in there as a description of
the system as it stands.

- `archive/backend_plan.txt` — the original 1,422-line backend build plan.
- `archive/backend-build-plan.md` — its condensed successor.
- `archive/Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf` — the same plan as circulated to the team.
- `archive/frontend-integration-contract.md` — the endpoint list the frontend
  asked the backend for in May 2026, before the API existed. Superseded by
  the API itself; kept because it records the original shape the SPA expected.

# Navuuna (repo: Nuvola_Atlas)

Sub-county service-performance record for Nairobi. NOT a general urban
intelligence platform. Scope was deliberately narrowed in Aug 2026.

The authoritative scope document is `NAVUUNA_REFOCUS_WORKFLOW.md` at this
root. Where this file and the codebase disagree, the codebase wins — and the
disagreement gets fixed in the same slice, not logged for later.

## Active pillars

| Key | Status | Method | Granularity | Source |
|---|---|---|---|---|
| `water_sanitation` | active (flagship) | measured | subcounty | KNBS census + WASREB IMPACT |
| `road_density` | active | measured | subcounty | HOT OSM roads |
| `transit_access` | active | measured | subcounty | Digital Matatus GTFS + WorldPop |
| `electricity_access` | held | measured | subcounty | KNBS 2019 census — label the vintage loudly |

## Switched off — do not reintroduce without a written decision

`civic` · `safety` · `project_momentum` · `environment` · `smart_grid` (live)

(`civic` was renamed twice for compliance reasons: from the original label to
`civic_index` on 2026-08-24 (P7.1), then to `civic` on 2026-08-25 to align
with the round-2 rebuild-plan amendment. The retirement record in
`pillars.json` carries the full identifier chain under `retired.renamed_from`;
see NAVUUNA_PROMPTS_ROUND2.md §P7 for the directive.)

Off means **deleted, not flagged**. A feature flag is an invitation to turn it
back on at 2am before a demo. If one of these returns, it returns through a
written decision recorded in `NAVUUNA_REFOCUS_WORKFLOW.md`, naming a data
source that actually exists.

## Non-negotiable rules

1. Never render an invented or proxy number as measured. `method: "gap"`
   renders grey, with no number, ever.
2. Every indicator value carries `source`, `vintage`, `granularity`, `method`.
3. Utility/county-level values NEVER render on sub-county bubbles. County
   banner only. Spreading a utility figure across 17 sub-counties is inventing
   data.
4. The AI assistant has no access to `users` or any table containing PII.
5. Scoring weights live in one versioned file. No inline magic numbers.

Rule 3 is the product, not a limitation to hide. Nobody else in Kenya
publishes a service-performance figure with its granularity honestly
declared, which is exactly why a regulator or funder will trust ours.

## Stack — grant-locked, do not deviate

- **Frontend:** React 18 + Vite 5 + TypeScript. Not Next.js.
- **Styling:** Tailwind 3, tokens from `tailwind.config.ts`. **Animation:** Framer Motion 11, `springSettle` preset.
- **Mapping:** Mapbox GL JS 3.9. Token from `VITE_MAPBOX_TOKEN` only.
- **Data/state:** TanStack Query 5 + Zustand 4.
- **Backend:** Laravel 13 (PHP 8.3+). **DB:** Supabase Postgres + PostGIS; local Docker for tests.
- **Ingestion:** FastAPI (Python 3.13).
- **Packages:** `nuvola-atlas-backend`, `-frontend`, `-ingestion`.

Directories keep the `nuvola-atlas-*` names. Use "Navuuna" in copy and UI.

## Coding rules

- Comments: default to none. Only the WHY, only when non-obvious.
- Commits: Conventional Commits, per-slice not per-session. Never add a
  `Co-Authored-By: Claude` trailer.
- Secrets from environment variables only, never in code.
- No inline role checks — Laravel Gates and Policies only.
- No raw SQL except isolated PostGIS spatial queries in a dedicated service
  method, with a comment explaining why.
- API shape: success `{ success: { status, data, message } }`, error
  `{ error: { status, code, message } }` (RFC 7807).
- Thin controllers, logic in services. Every migration implements `up()` and
  `down()`. No commented-out code. PSR-12 for PHP, PEP 8 for Python.
- No database mocking in integration tests — Docker Postgres always.
- Never edit `NuvolaAtlasPrototype.jsx`. It is the design north-star.
- Every `React.lazy()` goes through `lazyWithRetry()` so a Vercel deploy
  can't break an open tab on a stale chunk hash.

## The baseline — run after every meaningful slice

```bash
bash scripts/check.sh
```

That runs all six and keeps going after a failure, so one run tells you
everything that is broken: pillar-registry drift, phpunit, phpstan, frontend
typecheck, vitest, and the Vite build.

phpunit needs `docker compose up -d postgres` from the backend directory
first — `phpunit.xml` force-overrides to a local Docker postgres+postgis on
`127.0.0.1:5434`, and without it the suite hangs on a TCP timeout.

Five of the six gate. phpstan is informational: it carries pre-existing
level-5 violations, and a check that is always red teaches everyone to stop
reading it. The count is printed so it cannot drift upward unnoticed.

Green across the blocking five is the baseline for "it works". Fix failures,
don't paper over them. Push after the slice goes green, not at end of session.

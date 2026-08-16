# Team setup — running Navuuna Atlas locally

A one-pager for anyone on the team who wants to pull this repo down and get
the app running on their own machine. Written for the current state of the
codebase (July 2026). If something drifts, update this file — don't post
setup notes in Slack that only three people can find.

---

## What you'll end up with

- **Frontend (Vite dev server)** on `http://localhost:5173` — the actual
  app: Atlas map, Vitality Scorecard, Compare page with the Assistant
  sidepanel, Reports, Public Portal, Admin.
- **Backend (Laravel)** on `http://127.0.0.1:8000` — optional. The frontend
  ships with a full client-side mock, so you can demo the whole product
  without the backend running. Wire the backend up when you're doing real
  API work.

---

## 1. Prerequisites

Install these once. Versions are the ones we're standardised on — do not
downgrade.

| Tool | Version | Why |
|------|---------|-----|
| **Node.js** | 20+ (LTS) | Vite dev server, frontend build |
| **npm** | 10+ | ships with Node 20 |
| **PHP** | 8.3+ | Laravel 11 backend |
| **Composer** | 2.7+ | PHP dependency manager |
| **PostgreSQL** | 15+ with PostGIS 3+ | zones, snapshots, geospatial queries |
| **Git** | any recent | you already have this |
| **Docker Desktop** | optional | only if you want the containerised Postgres for tests |

Windows notes:
- PHP: install to `C:\php`, add to PATH, and make sure `php.ini` has
  `extension=pdo_pgsql` and `extension=pgsql` uncommented.
  `pdo_sqlite` is also worth enabling if you ever want to use the SQLite
  fallback. Verify with `php -m` — you should see `pdo_pgsql` and
  `pgsql` in the list.
- Composer: install via the Windows installer, tick the "Add to PATH" box.

macOS / Linux notes:
- Prefer `brew` (macOS) or your package manager for PHP + Postgres/PostGIS.
- Enable the same PHP extensions listed above.

---

## 2. Clone the repo

```bash
git clone https://github.com/Navuuna-W/FE_BE.git
cd FE_BE
```

If you already have the `AustineIgunza/Nuvola_Atlas` remote, both remotes
point at the same code — pick whichever URL you have access to.

---

## 3. Frontend — the fastest path to a working demo

The frontend runs entirely against a client-side mock by default, so this
is all you need for a demo:

```bash
cd nuvola-atlas-frontend
npm install
cp .env.example .env    # if .env doesn't exist yet
npm run dev
```

Open http://localhost:5173. Sign in with any email — `austine@nuvola.dev`
gives you admin access. Passwords are not checked in mock mode.

### Frontend `.env` — what actually matters

```
VITE_MAPBOX_TOKEN=pk.eyJ1I...       # required — get your own from mapbox.com
VITE_MAPBOX_STYLE=mapbox://styles/mapbox/light-v11
VITE_API_BASE=/api/v1               # backend API prefix
# leave the two below unset for mock mode
# VITE_USE_REMOTE_API=true          # set to true to hit the real Laravel API
# VITE_USE_REMOTE_CHAT=true         # set to true to route chat through the real backend
```

The Mapbox token in the repo is Austine's dev token — swap it for your own
if you're going to be hammering the map. Free tier is generous but shared
across the team.

### Common frontend commands

```bash
npm run dev              # dev server with hot reload
npm run build            # production build (typecheck + Vite build)
npm run typecheck        # tsc --noEmit only
npm run test             # Vitest suite
```

---

## 4. Backend — when you actually need Postgres

Skip this section unless you're touching backend code, running the phpunit
suite, or wiring the frontend against real data.

```bash
cd nuvola-atlas-backend
composer install
cp .env.example .env
php artisan key:generate
```

### Backend `.env` — the Postgres block

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nuvola
DB_USERNAME=postgres
DB_PASSWORD=<your local password>

CACHE_STORE=file          # NOT database or sqlite unless you have those drivers
SESSION_DRIVER=file
QUEUE_CONNECTION=sync     # or database if you want the queue tables
```

Two gotchas:
1. `CACHE_STORE=file` is the safe default. `database` requires the `cache`
   table and `sqlite` requires the `pdo_sqlite` PHP extension — if either
   is missing, every request 500s. `file` avoids both traps.
2. If you set `CACHE_STORE` after `artisan serve` is already running, kill
   the server and restart it. Laravel caches the boot config per request
   but the built-in server holds on to the first read of `.env`.

### Create the database + run migrations

```bash
# from Postgres shell (psql -U postgres):
CREATE DATABASE nuvola;
\c nuvola
CREATE EXTENSION IF NOT EXISTS postgis;

# back in the backend directory:
php artisan migrate --seed
```

The seeders load the seventeen Nairobi sub-county zones, users, projects,
alerts, and enough snapshot history for the trend chart to render.

### Start the backend server

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Sanity check:

```bash
curl http://127.0.0.1:8000/api/health
# → {"status":"ok","checks":{"database":{"ok":true},"cache":{"ok":true}},...}
```

If `database.ok` is `false`, the message tells you which driver is
missing. Fix that before doing anything else.

### Point the frontend at the backend

Edit `nuvola-atlas-frontend/.env` and set:

```
VITE_USE_REMOTE_API=true
```

Restart `npm run dev`. Sign-in now hits real Laravel routes.

---

## 5. The Docker-based Postgres for tests

`phpunit.xml` force-overrides the test database to a local Docker Postgres
on port `5434` with PostGIS. This is deliberate — it prevents accidentally
running tests against the shared Supabase project.

```bash
cd nuvola-atlas-backend
docker compose up -d postgres
php vendor/phpunit/phpunit/phpunit --no-coverage
```

Without Docker running, the tests hang on a TCP timeout. If you don't have
Docker Desktop installed, either install it or run the four-check baseline
manually (`route:list`, typecheck, build, dev server smoke test) and note
in your PR that tests were skipped.

### 5a. One-command dev stack (Postgres + Laravel + FastAPI ingestion)

For a full-stack local run without hand-starting each service, use the
top-level orchestrator at `docker-compose.dev.yml`:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Brings up on the host:

- `5434` → Postgres+PostGIS (same port as `phpunit`, so tests and the
  stack can share one container)
- `8000` → Laravel API (FrankenPHP inside serves :8080)
- `8100` → FastAPI ingestion

The frontend Vite dev server stays outside the compose file — HMR is
smoother when it runs on the host directly. Point it at the compose
backend with `VITE_API_BASE=http://localhost:8000/api/v1`.

Reverb is not started by the orchestrator — for websocket work run
`php artisan reverb:start` on the host against a checked-out backend.

---

## 6. Routine systems check

Run this after every meaningful slice, per project convention. Green on
all four is the baseline for "ship-ready":

```bash
# 1. Frontend types
cd nuvola-atlas-frontend && npx tsc --noEmit

# 2. Frontend build
cd nuvola-atlas-frontend && npx vite build

# 3. Backend routes
cd nuvola-atlas-backend && php artisan route:list --path=api

# 4. Backend tests (needs docker compose up -d postgres first)
cd nuvola-atlas-backend && php vendor/phpunit/phpunit/phpunit --no-coverage
```

If any of these fail on your machine but pass on someone else's, that's
usually a missing PHP extension or a stale `.env`. Don't paper over it.

---

## 7. Git remotes — where to push

The repo has two remotes:

```
origin    → https://github.com/AustineIgunza/Nuvola_Atlas.git
navuuna   → https://github.com/Navuuna-W/FE_BE.git
```

Default `git push` goes to `origin`. To publish to the Navuuna team repo
explicitly:

```bash
git push navuuna main
```

Rule of thumb: personal branches to `origin`, `main` and release-shaped
work to both. If you're the release cutter for a demo, push to both.

---

## 8. Common problems and their real fixes

**Sign-in works but no data loads.**
You've enabled `VITE_USE_REMOTE_API=true` but the backend is not running
or is degraded. Curl `/api/health` — if the database check is `false`,
fix Postgres before anything else.

**Map tiles are blank / grey.**
Your `VITE_MAPBOX_TOKEN` is wrong or the token was revoked. Get a fresh
one from mapbox.com/account/access-tokens.

**"could not find driver" 500 errors.**
Missing PHP extension. Run `php -m` and make sure `pdo_pgsql`, `pgsql`,
and — if `CACHE_STORE=database` — `pdo_sqlite` are all listed. Edit
`php.ini`, uncomment the relevant `extension=` lines, restart the server.

**Chat returns instantly with lorem ipsum.**
You're in mock mode. That's expected in dev. Set `VITE_USE_REMOTE_CHAT=true`
after the backend has `AI_GATEWAY_API_KEY` set to route through Vercel's
AI Gateway.

**Compare page Assistant does not reflect the zones I picked.**
Re-open the page. The compare context is mirrored into the atlas store
via `useEffect` — if you're hot-reloading the store, the mirror can go
stale until the picker changes again.

**Tests hang forever.**
Postgres on 5434 is not up. `docker compose up -d postgres` in the
backend directory.

---

## 9. Where to find the good stuff

- **Design spec (never delete)**: `NuvolaAtlasPrototype.jsx` at the repo
  root. This is the approved look-and-feel — palette, spacing, easing,
  score ring, pillar bars.
- **Data contract**: `nuvola-atlas-frontend/src/types/index.ts`. The
  `Zone` type is the single source of truth — the backend mirrors it.
- **Vitality methodology (in-code)**:
  `nuvola-atlas-backend/config/methodology.php` for pillar weights and
  `nuvola-atlas-backend/app/Services/ScoreCalculator.php` for the actual
  math. The formula stays out of the UI on purpose.
- **Ops / deploy runbook**: `docs/ops/deploy.md`.
- **Architecture overview**: `docs/architecture.md`.

---

## 10. When in doubt

Ask in the team channel before you push. If you're about to run
`git reset --hard`, delete a database, or force-push to `main`, stop and
ask. Everything else is recoverable.

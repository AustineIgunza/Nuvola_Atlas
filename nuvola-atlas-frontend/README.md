# Nuvola Atlas Frontend

Spatial Intelligence Network for African Industrial Development. This is the frontend for the Nairobi County pilot, built by Austine Igunza.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Sign in with any email/password (mock auth).

## Mapbox Token

The map requires a Mapbox GL JS token. Without one, a styled SVG fallback renders instead.

```bash
cp .env.example .env
# Edit .env and set VITE_MAPBOX_TOKEN=pk.your_token_here
```

## Connecting to the Real Backend

Two env vars control which API the frontend talks to:

```env
# Where to send requests. Default: /api/v1 (same-origin, e.g. via a Vercel rewrite)
VITE_API_BASE=https://api.nuvola-atlas.ke/api/v1

# Master switch. Default is `false` — the app uses mock fixtures. Set to
# `true` on Vercel Production only; leave preview deployments on mock so
# partners can review UI without depending on Khillon's backend uptime.
VITE_USE_REMOTE_API=true
```

When `VITE_USE_REMOTE_API` is anything other than `true`/`1`, the app reads
from `src/api/mock.ts` and `src/api/fixtures.ts`. No code changes are
needed to flip between mock and real. The wire contract is documented in
[`../nuvola-atlas-backend/docs/api/openapi.yaml`](../nuvola-atlas-backend/docs/api/openapi.yaml).

## Realtime — swapping the mock pulse for Reverb

`useLiveData()` is the single place the app invalidates queries from. It
mounts once at the top of the tree and is gated on the Settings
auto-refresh toggle, so turning that off pauses updates from either source.

By default it runs a 45-second mock pulse (`src/lib/realtime.ts`) that
cycles the three channels, so the dashboard looks live with no websocket
server. Flip to real Laravel Echo + Reverb with env only — there is no code
change:

```env
VITE_USE_REVERB=true
VITE_REVERB_APP_KEY=nuvola-atlas-key   # must equal backend REVERB_APP_KEY
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Then, in the backend, `php artisan reverb:start` plus a queue worker —
`ZoneScoreUpdated` fires from a queued job, so with no worker running the
socket connects and stays silent.

| Backend event | Channel | Client effect |
|---------------|---------|---------------|
| `ZoneScoreUpdated` | private `zones.{id}` | invalidates `zones`, `history`, `zoneHistory` |
| `ZoneLayerUpdated` | private `zones.{id}` | same — geometry changes invalidate the same views |
| `AlertCreated` | private `alerts` | invalidates `alerts` |

All three are private channels, so every subscribe authorizes against
`POST {VITE_API_BASE}/broadcasting/auth` with the same Sanctum bearer token
the REST client uses. That endpoint is deliberately *not* the framework
default at `/broadcasting/auth` — that one sits on the `web` session guard,
which a token SPA can never satisfy.

## File Structure

```
src/
  api/          - API client + mock fixtures
  components/   - UI components by domain
    chrome/     - Sidebar, TopBar, SearchModal
    map/        - AtlasMap, Legend, Controls, Fallback
    scorecard/  - Ring, PillarRow, ActivityFeed, Panel
    vitality/   - Leaderboard, Sparkline
    infra/      - ProjectList, ProjectCard, ProjectDetail, Timeline
    reports/    - ReportsTable, NewReportModal
    alerts/     - AlertList
    modals/     - MethodologyModal
  pages/        - Route-level components
  stores/       - Zustand stores (auth, ui)
  types/        - TypeScript interfaces
  lib/          - Utilities (scoreColor, format, cn)
public/data/    - GeoJSON files for map layers
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Type-check + production build |
| `pnpm test` | Run Vitest tests |
| `pnpm typecheck` | Type-check only |

## Tech Stack

React 18, TypeScript, Vite, Mapbox GL JS v3, Zustand, TanStack Query, Framer Motion, Tailwind CSS, Lucide icons, date-fns.

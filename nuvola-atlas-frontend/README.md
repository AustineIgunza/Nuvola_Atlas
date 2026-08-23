# Navuuna — Frontend

React SPA for the Navuuna sub-county service-performance record. Renders the
Nairobi County atlas, the per-sub-county scorecard and the pillar methodology.
Built by Austine Igunza.

Scope and the rules that constrain it live in [`../CLAUDE.md`](../CLAUDE.md).

## Quick start

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. The app runs on mock fixtures by default, so it
needs neither the Laravel backend nor a Mapbox token to start.

## Mapbox token

The map needs a Mapbox GL JS token. Without one, a styled SVG fallback renders
instead — the app stays usable.

```bash
cp .env.example .env
# then set VITE_MAPBOX_TOKEN=pk.your_token_here
```

## Pointing at the real backend

Two env vars decide which API the app talks to:

```env
# Where to send requests. Default: /api/v1 (same-origin, e.g. via a Vercel rewrite)
VITE_API_BASE=https://api.navuuna.ke/api/v1

# Master switch. Default is `false` — the app uses mock fixtures. Set to
# `true` on Vercel Production only; leave preview deployments on mock so
# partners can review UI without depending on backend uptime.
VITE_USE_REMOTE_API=true
```

When `VITE_USE_REMOTE_API` is anything other than `true`/`1`, the app reads from
`src/api/mock.ts` and `src/api/fixtures.ts`. No code changes are needed to flip
between mock and real. The wire contract is in
[`../docs/api/openapi.yaml`](../docs/api/openapi.yaml).

Chat has a second gate on top of that one. `VITE_USE_REMOTE_CHAT=true` is what
routes the assistant through the real backend — so the rest of the app can be
on live Postgres while chat stays mocked.

## Pillars

The taxonomy is generated, not hand-written. `src/lib/pillars.generated.ts`
comes from [`../pillars.json`](../pillars.json) via `scripts/gen-pillars.mjs` at
the repo root. Edit the JSON and regenerate; never edit the generated file.

A pillar whose method is `gap` renders grey and carries no number. A pillar that
is switched off is deleted, not hidden behind a flag.

## Realtime — swapping the mock pulse for Reverb

`useLiveData()` is the single place the app invalidates queries from. It mounts
once at the top of the tree and is gated on the Settings auto-refresh toggle, so
turning that off pauses updates from either source.

By default it runs a 45-second mock pulse (`src/lib/realtime.ts`) that cycles the
three channels, so the dashboard looks live with no websocket server. Flip to
real Laravel Echo + Reverb with env only — there is no code change:

```env
VITE_USE_REVERB=true
VITE_REVERB_APP_KEY=nuvola-atlas-key   # must equal backend REVERB_APP_KEY
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Then, in the backend, `php artisan reverb:start` plus a queue worker —
`ZoneScoreUpdated` fires from a queued job, so with no worker running the socket
connects and stays silent.

| Backend event | Channel | Client effect |
|---------------|---------|---------------|
| `ZoneScoreUpdated` | private `zones.{id}` | invalidates `zones`, `history`, `zoneHistory` |
| `ZoneLayerUpdated` | private `zones.{id}` | same — geometry changes invalidate the same views |
| `AlertCreated` | private `alerts` | invalidates `alerts` |

All three are private channels, so every subscribe authorizes against
`POST {VITE_API_BASE}/broadcasting/auth` with the same Sanctum bearer token the
REST client uses. That endpoint is deliberately *not* the framework default at
`/broadcasting/auth` — that one sits on the `web` session guard, which a token
SPA can never satisfy.

## File structure

```
src/
  api/          - API client, mock fixtures, per-domain request modules
  components/   - UI by domain
    admin/      - admin dashboard, audit table, API-key wizard
    alerts/     - alert list
    auth/       - sign-in, route guards
    brand/      - logo and wordmark
    chat/       - AI assistant panel and stream
    chrome/     - Sidebar, TopBar, SearchModal
    common/     - shared primitives
    infra/      - project list, card, detail, timeline
    investor/   - investor-facing views
    map/        - AtlasMap, Legend, Controls, Fallback
    modals/     - methodology and settings modals
    reports/    - reports table, new-report modal
    scorecard/  - ring, pillar rows, activity feed, panel
    vitality/   - leaderboard, sparkline
  hooks/        - useMapInstance, useLiveData, useChatStream
  lib/          - scoreColor, i18n, pillars.generated.ts, reverb, sentry
  pages/        - route-level components
  stores/       - Zustand stores (auth, ui, atlas, prefs)
  types/        - TypeScript interfaces
public/data/    - GeoJSON for map layers
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on `:5173` |
| `npm run build` | Type-check, then production build |
| `npm run typecheck` | Type-check only |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint over `src` |
| `npm run format` | Prettier write |

The repo-wide baseline is `bash ../scripts/check.sh` from the root — it runs
typecheck, vitest and the build alongside the backend checks.

## Tech stack

React 18, TypeScript, Vite 5, Mapbox GL JS 3, Zustand 4, TanStack Query 5,
Framer Motion 11, Tailwind 3, Lucide icons, date-fns.

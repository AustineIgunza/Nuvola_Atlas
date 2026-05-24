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

When Khillon's Laravel backend is live, change one env var:

```env
VITE_API_BASE=https://api.nuvola-atlas.ke
```

The mock API client automatically switches to real `fetch()` calls when `VITE_API_BASE` starts with `http`. No code changes needed. See `docs/INTEGRATION.md` for the full API contract.

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

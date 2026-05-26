# Nuvola Atlas — Inertia Frontend

## Run Locally

```bash
# 1. Install dependencies
cd nuvola-atlas-backend
npm install

# 2. Set your Mapbox token in .env
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here

# 3. Start Vite dev server (alongside Laravel)
npm run dev

# 4. In another terminal, start Laravel
php artisan serve
```

Visit `http://localhost:8000` — the Atlas page loads via Inertia.

## Architecture

```
resources/js/
├── pages/Atlas.tsx            # Main page — wires map + scorecard
├── components/
│   ├── atlas/AtlasMap.tsx     # Mapbox GL JS map with 3 data layers
│   ├── atlas/LayerToggle.tsx  # Road / Grid / Density toggles
│   ├── scorecard/
│   │   ├── ScorecardPanel.tsx # Side panel (desktop) / bottom sheet (mobile)
│   │   ├── VitalityRing.tsx   # Animated 0-100 SVG ring
│   │   └── PillarBar.tsx      # 4 pillar sub-score bars
│   └── chrome/                # Sidebar, TopBar, SearchModal
├── hooks/
│   ├── useLiveData.ts         # Data source (mock now, Reverb later)
│   └── usePrefersReducedMotion.ts
├── mock/zones.ts              # 17 Nairobi zones with scores + GeoJSON
├── lib/motionPresets.ts       # Framer Motion spring configs
├── types/zone.ts              # Zone type definition
└── layouts/AppLayout.tsx      # Shell with sidebar + topbar
```

## Data Flow

```
useLiveData() → zones[] → Atlas.tsx
                              ├── AtlasMap (markers, layers, fly-to)
                              └── ScorecardPanel (ring, pillars)
```

Zone selection flows through `useState<Zone | null>` in Atlas.tsx.

## Swapping Mock Data for Laravel Reverb

The `useLiveData` hook (`hooks/useLiveData.ts`) is the **only file** you need to change. Replace the mock implementation with:

```ts
import { useState, useEffect } from 'react';
import type { Zone } from '../types/zone';

export function useLiveData() {
    const [zones, setZones] = useState<Zone[]>([]);

    useEffect(() => {
        // 1. Fetch initial state
        fetch('/api/zones')
            .then((r) => r.json())
            .then((data) => setZones(data));

        // 2. Subscribe to real-time updates via Laravel Echo
        const channels = zones.map((z) =>
            window.Echo.private(`zones.${z.id}`)
                .listen('ZoneScoreUpdated', (e: { zone: Zone }) => {
                    setZones((prev) =>
                        prev.map((z) => (z.id === e.zone.id ? e.zone : z))
                    );
                })
        );

        return () => channels.forEach((ch) => ch.stopListening('ZoneScoreUpdated'));
    }, []);

    return {
        zones,
        getZone: (id: string) => zones.find((z) => z.id === id),
    };
}
```

### Backend prerequisites (Khillon/Devyan's scope)
1. `GET /api/zones` — returns `Zone[]` matching `types/zone.ts`
2. Laravel Reverb broadcasting on private channel `zones.{id}`
3. `ZoneScoreUpdated` event with the full `Zone` object as payload
4. `bootstrap.ts` must initialize Laravel Echo (already stubbed)

## Design Tokens

Defined in `resources/css/app.css` via Tailwind `@theme`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-ink` | `#1A1D21` | Primary text |
| `--color-surface` | `#F4F3F1` | Page background |
| `--color-score-green` | `#1B9C6B` | Score >= 70 |
| `--color-score-amber` | `#C9A227` | Score 55-69 |
| `--color-score-red` | `#C7603F` | Score < 55 |
| `--radius-card` | `26px` | Card corners |

## Accessibility

- All animated components respect `prefers-reduced-motion: reduce`
- Animations skip to final state instantly when reduced motion is on
- Close buttons have `aria-label`
- Score colors use sufficient contrast against white

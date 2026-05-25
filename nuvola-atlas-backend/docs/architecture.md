# Nuvola Atlas — System Architecture

## Overview

Nuvola Atlas is a spatial intelligence platform for African industrial development, piloting in Nairobi County. The system has two main layers:

1. **Atlas** — live GeoJSON mapping of road construction, energy infrastructure, and urban density
2. **Vitality Index** — a 0-100 readiness score per zone computed from four weighted pillars

## Components

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (SPA)                    │
│  React 18 · Vite · Mapbox GL JS · TanStack Query   │
│         http://localhost:5173                        │
└───────────────────┬─────────────────────────────────┘
                    │ fetch() + Bearer token
                    ▼
┌─────────────────────────────────────────────────────┐
│                  Backend (API)                       │
│  Laravel 13 · PHP 8.4 · Sanctum                     │
│         http://localhost:8000/api                    │
├─────────────────────────────────────────────────────┤
│  Broadcasting: Laravel Reverb (WebSocket)            │
│         ws://localhost:8080                          │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL 16 + PostGIS 3.4             │
│  Zones · Projects · Alerts · Reports · Layers        │
│  Geography types: Point (centroid), Polygon (boundary)│
│         localhost:5434                               │
└─────────────────────────────────────────────────────┘
```

## Data Flow: GeoJSON Import → Score Recalculation

```
1. artisan atlas:import-geojson file.json --zone=westlands --layer=road_progress
   │
   ▼
2. ZoneLayer created/updated in database
   │
   ▼
3. ZoneLayerObserver fires (app/Observers/ZoneLayerObserver.php)
   │
   ▼
4. RecalculateZoneScore job dispatched to queue (app/Jobs/RecalculateZoneScore.php)
   │
   ▼
5. ScoreCalculator computes weighted score (app/Services/ScoreCalculator.php)
   │  Weights from config/methodology.php:
   │    social  = 3/13 (23.1%) — 3 sub-metrics
   │    safety  = 3/13 (23.1%) — 3 sub-metrics
   │    density = 2/13 (15.4%) — 2 sub-metrics
   │    infra   = 5/13 (38.5%) — 5 sub-metrics
   │
   ▼
6. Zone score + last_sync_min updated in database
   │
   ▼
7. ZoneScoreUpdated event broadcast on private channel zones.{id}
   │
   ▼
8. Frontend receives update via Reverb WebSocket → React Query cache invalidated
```

## Authentication Flow

```
1. POST /api/auth/sign-in { email, password }
   │
   ▼
2. Sanctum creates personal access token (expires in 8 hours)
   │
   ▼
3. Response: { token: "1|abc...", user: { name, email } }
   │
   ▼
4. Frontend stores token in localStorage, sends as Bearer header
   │
   ▼
5. Protected routes (POST /reports, POST /alerts/mark-all-read) require auth:sanctum
   │
   ▼
6. On 401: frontend clears token, redirects to /sign-in
```

## Security Layers

- **Security Headers Middleware** — X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS (prod only)
- **Rate Limiting** — 60 requests/minute per user or IP
- **CORS** — restricted to frontend origin (configurable via CORS_ALLOWED_ORIGINS env)
- **Sanctum Token Expiration** — 8-hour default
- **Private Broadcast Channels** — require authenticated user
- **CSP Meta Tag** — restricts script/style/connect sources in frontend

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/zones | Public | List all 17 zones with scores |
| GET | /api/zones/{id} | Public | Zone detail with layers + boundary |
| GET | /api/zones/{id}/layers | Public | Zone GeoJSON layers |
| GET | /api/zones/{id}/activity | Public | Zone activity feed |
| GET | /api/projects | Public | List infrastructure projects |
| GET | /api/projects/{id} | Public | Project detail with milestones |
| GET | /api/alerts | Public | List alerts |
| GET | /api/reports | Public | List reports |
| GET | /api/history | Public | Vitality history timeline |
| GET | /api/vitality/methodology | Public | Pillar definitions + weights |
| POST | /api/auth/sign-in | Public | Authenticate, get token |
| POST | /api/reports | Auth | Create a new report |
| POST | /api/alerts/mark-all-read | Auth | Mark all alerts as read |

## Artisan Commands

| Command | Schedule | Description |
|---------|----------|-------------|
| `atlas:recalculate-scores` | Hourly | Recalculate all zone scores using weighted methodology |
| `atlas:import-geojson` | Manual | Import GeoJSON file into a zone layer |
| `atlas:sync-history` | Monthly | Record monthly vitality average |

## Key Directories

```
nuvola-atlas-backend/
├── app/
│   ├── Console/Commands/     # 3 artisan commands
│   ├── Events/               # 3 broadcast events
│   ├── Http/
│   │   ├── Controllers/      # 6 controllers
│   │   ├── Middleware/        # SecurityHeaders
│   │   ├── Requests/         # 2 form requests
│   │   └── Resources/        # 7 API resources
│   ├── Jobs/                 # RecalculateZoneScore
│   ├── Models/               # 7 models
│   ├── Observers/            # ZoneLayerObserver
│   └── Services/             # ScoreCalculator
├── config/
│   └── methodology.php       # Vitality Index pillar definitions
├── database/
│   ├── factories/            # 7 factories
│   ├── migrations/           # 14 migrations
│   └── seeders/              # 9 seeders
└── tests/                    # 33 tests
```

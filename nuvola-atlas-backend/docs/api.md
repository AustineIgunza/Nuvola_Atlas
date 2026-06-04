# Nuvola Atlas API Reference

> The authoritative machine-readable spec lives at
> [`docs/api/openapi.yaml`](api/openapi.yaml) (OpenAPI 3.1). This page is a
> human-friendly companion — when the two disagree, the OpenAPI file wins.

Base URL: `http://localhost:8000/api/v1`

All endpoints return JSON. Errors are RFC 7807 `application/problem+json`.
Rate limited to 60 requests/minute per IP. Path examples below omit the
`/v1` prefix for brevity but should be sent under `/api/v1/...`.

---

## Zones

### List all zones

```
GET /zones
```

**Response:** `Zone[]`

```json
[
  {
    "id": "westlands",
    "name": "Westlands",
    "score": 76,
    "pillars": { "social": 82, "safety": 71, "density": 64, "infra": 80 },
    "deltas": { "social": 3, "safety": -1, "density": 2, "infra": 4 },
    "centroid": [36.8048, -1.2673],
    "lastSyncMin": 4
  }
]
```

Note: List endpoint does NOT include `layers` or `boundary` to reduce payload size.

---

### Get single zone (with layers)

```
GET /zones/{id}
```

**Response:** `Zone` with `layers` and `boundary`

```json
{
  "id": "westlands",
  "name": "Westlands",
  "score": 76,
  "pillars": { "social": 82, "safety": 71, "density": 64, "infra": 80 },
  "deltas": { "social": 3, "safety": -1, "density": 2, "infra": 4 },
  "centroid": [36.8048, -1.2673],
  "lastSyncMin": 4,
  "layers": {
    "roadProgress": { "type": "FeatureCollection", "features": [...] },
    "smartGrid": { "type": "FeatureCollection", "features": [...] },
    "density": { "type": "FeatureCollection", "features": [...] }
  },
  "boundary": { "type": "Polygon", "coordinates": [...] }
}
```

**404** if zone not found.

---

### Get zone activity

```
GET /zones/{id}/activity
```

**Response:** `ActivityEntry[]`

```json
[
  {
    "id": "act1",
    "zoneId": "westlands",
    "kind": "road",
    "text": "Waiyaki Way Phase 2 paving completed",
    "source": "KeNHA",
    "createdAt": "2026-05-22T08:00:00.000000Z"
  }
]
```

---

### Get zone layers

```
GET /zones/{id}/layers
```

**Response:** `ZoneLayer[]`

```json
[
  {
    "layerType": "road_progress",
    "geojson": { "type": "FeatureCollection", "features": [...] }
  }
]
```

---

## Projects

### List all projects

```
GET /projects
```

**Response:** `Project[]`

```json
[
  {
    "id": "p1",
    "name": "Waiyaki Way Expansion",
    "zoneId": "westlands",
    "agency": "KeNHA",
    "type": "road",
    "status": "active",
    "progress": 72,
    "budget": "KES 1.2B",
    "started": "2025-01-15",
    "eta": "2026-06-30",
    "milestones": [{ "date": "2025-01-15", "label": "Groundbreaking", "done": true }],
    "marker": [36.795, -1.265]
  }
]
```

---

### Get single project

```
GET /projects/{id}
```

**Response:** `Project` (same shape as list item)

**404** if not found.

---

## Alerts

### List all alerts

```
GET /alerts
```

**Response:** `AlertItem[]`

```json
[
  {
    "id": "a1",
    "severity": "high",
    "kind": "infra",
    "title": "Inner Ring Resurfacing stalled",
    "body": "Contractor has not mobilized...",
    "zoneId": "starehe",
    "createdAt": "2026-05-20T09:30:00.000000Z",
    "read": false
  }
]
```

---

### Mark all alerts as read

```
POST /alerts/mark-all-read
```

**Response:** `{ "ok": true }`

---

## Reports

### List all reports

```
GET /reports
```

**Response:** `Report[]`

```json
[
  {
    "id": "r1",
    "title": "Nairobi Q1 2026 Vitality Report",
    "zoneId": null,
    "date": "2026-04-15",
    "status": "published",
    "author": "Ken N'ganga",
    "sizeBytes": 2450000,
    "format": "PDF"
  }
]
```

---

### Create a report

```
POST /reports
Content-Type: application/json

{ "title": "My Report", "zoneId": "westlands" }
```

| Field   | Type            | Required |
|---------|-----------------|----------|
| title   | string (max 255)| Yes      |
| zoneId  | string or null  | No       |

**Response:** Created `Report`

**422** if validation fails.

---

## History

### List vitality history

```
GET /history
```

**Response:** `HistoryPoint[]`

```json
[
  { "month": "May '26", "overallAvg": 69.0 }
]
```

---

## Vitality

### Get methodology

```
GET /vitality/methodology
```

**Response:**

```json
{
  "pillars": [
    {
      "key": "social",
      "name": "Social Wellbeing & Human Capital",
      "description": "...",
      "subMetrics": [
        { "key": "spi", "label": "Social Progress Index", "description": "..." }
      ]
    }
  ]
}
```

---

## Authentication

### Sign in

```
POST /auth/sign-in
Content-Type: application/json

{ "email": "user@example.com", "password": "secret" }
```

**Response:**

```json
{
  "token": "1|abc123...",
  "user": { "name": "Test User", "email": "user@example.com" }
}
```

**401** if credentials invalid. **422** if validation fails.

Use the token as `Authorization: Bearer <token>` for protected endpoints.

---

## Broadcasting (Laravel Reverb)

### Channels

| Channel            | Event              | Payload           |
|--------------------|--------------------|--------------------|
| `zones.{zoneId}`   | `ZoneScoreUpdated` | Full `Zone` object |
| `zones.{zoneId}`   | `ZoneLayerUpdated` | `ZoneLayer` object |
| `alerts`           | `NewAlertCreated`  | `AlertItem` object |

Connect via Laravel Echo + Reverb WebSocket at `ws://localhost:8080`.

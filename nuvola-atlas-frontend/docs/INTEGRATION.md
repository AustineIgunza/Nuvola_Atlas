# API Integration Contract

This document describes the exact API endpoints the frontend consumes. Khillon should implement these on the Laravel backend.

## Base URL

Set via `VITE_API_BASE` environment variable. Default: `/api` (mock mode).

## Authentication

### `POST /api/auth/sign-in`

**Request:**
```json
{ "email": "string", "password": "string" }
```

**Response:**
```json
{ "token": "string", "user": { "name": "string", "email": "string" } }
```

## Zones

### `GET /api/zones`

Returns all 17 Nairobi sub-counties with their Vitality scores.

**Response:** `Zone[]`

```typescript
interface Zone {
  id: string;           // e.g. "westlands"
  name: string;         // "Westlands"
  score: number;        // overall 0-100
  pillars: {
    social: number;     // 0-100
    safety: number;
    density: number;
    infra: number;
  };
  deltas: {             // signed change vs last quarter
    social: number;
    safety: number;
    density: number;
    infra: number;
  };
  centroid: [number, number];  // [lng, lat]
  lastSyncMin: number;        // minutes since last sync
}
```

### `GET /api/zones/:id`

Returns a single zone. **Response:** `Zone`

### `GET /api/zones/:id/activity`

Returns recent activity entries for a zone.

**Response:** `ActivityEntry[]`

```typescript
interface ActivityEntry {
  id: string;
  zoneId: string;
  kind: "road" | "grid" | "esia" | "density";
  text: string;
  source: string;       // e.g. "KURA"
  createdAt: string;    // ISO 8601
}
```

## Projects

### `GET /api/projects`

**Response:** `Project[]`

```typescript
interface Project {
  id: string;
  name: string;
  zoneId: string;
  agency: string;           // "KURA" | "KeNHA" | "KPLC" | "KETRACO" | "ICTA"
  type: "road" | "energy" | "grid";
  status: "active" | "stalled" | "planned";
  progress: number;         // 0-100
  budget: string;           // "KES 240M"
  started: string;          // ISO date
  eta: string;              // ISO date
  milestones: { date: string; label: string; done: boolean }[];
  marker: [number, number]; // [lng, lat]
}
```

### `GET /api/projects/:id`

**Response:** `Project`

## Alerts

### `GET /api/alerts`

**Response:** `AlertItem[]`

```typescript
interface AlertItem {
  id: string;
  severity: "high" | "medium" | "low";
  kind: "infra" | "vitality" | "esia" | "system" | "partner";
  title: string;
  body: string;
  zoneId: string | null;
  createdAt: string;
  read: boolean;
}
```

### `POST /api/alerts/mark-all-read`

**Response:** `{ ok: true }`

## Reports

### `GET /api/reports`

**Response:** `Report[]`

```typescript
interface Report {
  id: string;
  title: string;
  zoneId: string | null;
  date: string;
  status: "published" | "review" | "draft";
  author: string;
  sizeBytes: number;
  format: "PDF";
}
```

### `POST /api/reports`

**Request:** `{ title: string, zoneId: string | null }`

**Response:** `Report`

## History

### `GET /api/history`

Returns 12 monthly data points for the time scrubber.

**Response:** `HistoryPoint[]`

```typescript
interface HistoryPoint {
  month: string;        // "May '26"
  overallAvg: number;   // 0-100
}
```

## Methodology

### `GET /api/vitality/methodology`

**Response:**

```typescript
{
  pillars: {
    key: "social" | "safety" | "density" | "infra";
    name: string;
    description: string;
    subMetrics: { key: string; label: string; description: string }[];
  }[]
}
```

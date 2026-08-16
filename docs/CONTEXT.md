# NUVOLA ATLAS / NAVUUNA — Project Context

> **Purpose of this file.** Complete standing-context brief for a fresh Claude
> chat. Paste or `@`-attach this to seed a new session so it inherits the
> project, the stack, the domain vocabulary, what's shipped, what's next, and
> the working conventions.
>
> Last regenerated: 2026-07-16. HEAD: `2987b3d`.
>
> **⚡ THIS MONTH (2026-07-16 → 2026-08-12):** dedicated backend push, frontend
> polish on hold. Weekly per-person plans live at `tasks/team/week-01/` —
> `austine.md`, `khillon.md`, `devyan.md`. Structure: 3 build weeks + 1 test
> week. Reference `docs/archive/Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf`
> for the full architecture + task ledger the team MDs slice from.

---

## 1. Who I am and how I work

- **Me:** Austine Igunza. Student, Strathmore University. Frontend engineer on
  the Nuvola Atlas team.
- **Team (Strathmore University, student-led):**
  - **Joy Nthei** — Operations Lead + HR
  - **Ken N'ganga** — Finance + Policy
  - **Khillon** — Lead Programmer (Laravel + Postgres + auth). Backend owner.
  - **Austine Igunza** — Programmer (frontend, that's me)
  - **Devyan Jethwa** — CTIPSO + Programmer (FastAPI ingestion, infra strategy,
    security)
- **Formal scope:** frontend — Mapbox GL JS + the UI for the Vitality Scorecard.
- **Current scope (temporary):** authorized to touch the Laravel backend and
  the FastAPI ingestion / scoring code to unblock the pilot while covering
  Khillon and Devyan. Treat backend work as in-scope for now. **STOP and ASK**
  on ambiguous architectural decisions rather than guessing.
- **My email:** austineigunza@gmail.com
- **My role in the grant proposal:** frontend — Mapbox GL JS frontend, dashboard
  interface, user-facing components of the Vitality Scorecard.

### Working conventions (memory-derived, not code-derived)
- **Plan mode by default** for anything ≥ 3 steps or with an architectural
  choice.
- **Verify before "done":** run the 4-check baseline every meaningful slice —
  frontend typecheck, frontend build, backend routes, backend phpunit.
- **Backend tests need docker:** phpunit.xml force-overrides to a local docker
  Postgres+PostGIS on 127.0.0.1:5434. `docker compose up -d postgres` first —
  without it the tests hang on TCP timeout.
- **Commits are per-slice, not per-session.** Push when a slice goes green so
  the remote stays close to local.
- **Never use `Co-Authored-By: Claude` in commit trailers.** Commits show only
  my name.
- **Simplicity first, no premature abstractions.** No feature flags for
  hypothetical future needs. Trust internal-code invariants; validate only at
  boundaries.
- **Comments:** default to none. Only comment the *why* when it's non-obvious.
- **Never mock the database in integration tests.** History of that biting us.
- **User-only blockers still in play:** provisioning DO+Supabase (9.4), AES
  toggle (9.7), Sentry DSN drop-in (9.11), GitHub branch protection on `main`.

---

## 2. The project in one paragraph

Nuvola Atlas (recently rebranded **Navuuna** — see §7) is a spatial
intelligence platform for African industrial development, piloted in Nairobi
County. It fuses live infrastructure data (roads, energy, water & sanitation,
digital backbone) with social readiness data to produce a **UE Vitality Index**
— a single 0–100 score per sub-county across four pillars (Social Wellbeing &
Human Capital, Safety & Security, Density & Scaling Dynamics, Infrastructure &
Environmental Safeguards). The vision, per Amartya Sen's *Development as
Freedom*, is to make locality readiness legible as a bundle of substantive
freedoms rather than as GDP. Grant target: **KES 1,000,000 over 12 months**.
Deliverables: working Atlas of Nairobi (17 sub-county zones), functional
Scorecard, 2+ partner LOIs, a peer-reviewed methodology paper.

---

## 3. Repo layout

```
NUVOLA_ATLAS/
├── CLAUDE.md                        # Project-level instructions (the grant proposal + build spec)
├── SECURITY.md                      # Responsible-disclosure policy
├── docs/                            # Ops runbooks + this file
│   └── CONTEXT.md                   # ← you are here
├── tasks/
│   └── todo.md                      # Live execution plan; the authoritative status doc
├── NuvolaAtlasPrototype.jsx         # Original design north-star (JSX prototype; DO NOT edit)
├── nuvola-atlas-frontend/           # Vite + React 18 + Tailwind + Framer Motion + Mapbox GL JS
│   ├── src/
│   │   ├── api/
│   │   │   ├── fixtures.ts          # Single source of truth for mock data
│   │   │   ├── client.ts            # `VITE_USE_REMOTE_API` swap between mock + real backend
│   │   │   ├── twoFactor.ts         # Email 2FA client (static import of mockApi)
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── admin/               # Admin dashboard (KPI cards, audit table, users, api keys)
│   │   │   ├── alerts/              # AlertList + AlertDetail
│   │   │   ├── chrome/              # AppShell, TopBar, Sidebar, Settings, ProjectQuickView
│   │   │   ├── infra/               # ProjectList / ProjectCard / ProjectDetail / Timeline
│   │   │   ├── map/                 # AtlasMap + layer sources + popups + hover cards + fallback
│   │   │   ├── reports/             # ReportsTable + ReportDetail + NewReportModal
│   │   │   ├── scorecard/           # Ring, PillarBar, ZoneRanking, ScorecardPanel + panel views
│   │   │   └── vitality/            # Leaderboard + Sparkline
│   │   ├── hooks/                   # useLiveData, useMapPopups, useMapLayers, useMapInstance, ...
│   │   ├── lib/                     # motion presets, scoreColor tokens, voronoi, waterSanitation, sentry init
│   │   ├── pages/                   # Atlas, Vitality, Infrastructure, Reports, Alerts, Admin, SignIn/Up
│   │   └── types/index.ts           # SHARED DATA CONTRACT — mirror between FE and BE
│   ├── vercel.json                  # Cache-Control immutable on /assets/*
│   └── vite.config.ts               # Sentry vite plugin gated on 3 envs
└── nuvola-atlas-backend/            # Laravel 11 + PostgreSQL + PostGIS + Sanctum + Reverb
    ├── app/
    │   ├── Http/                    # Controllers, FormRequests, Middleware (RequireAdmin, admin.two_factor, http.cache, SecurityHeaders)
    │   ├── Models/
    │   ├── Support/                 # Audit facade, problemResponse helper
    │   └── Console/Commands/        # nuvola:remind-admin-2fa
    ├── database/migrations/         # Includes RLS scaffold for partner_dataset_overlays
    ├── docker-compose.yml           # Local postgres+postgis on :5434
    ├── phpunit.xml                  # Force-overrides to local docker DB
    ├── deploy.sh + docker/          # Forge + DigitalOcean + Supabase artifacts
    └── docs/
        ├── api/openapi.yaml         # Authoritative API spec (RFC 7807, /api/v1/*)
        └── ops/                     # deploy.md, rollback.md, incident-response.md, postmortem-template.md, secret-rotation.md
```

**`nuvola-atlas-ingestion/`** (FastAPI service) **is now in the repo**
(scaffolded — `app/main.py` with Sentry init, `app/security.py` with
`X-Internal-Secret` HMAC dependency, `app/services/{data_cleaner,anomaly_detector}.py`,
`app/routers/{health,ingest}.py`, `app/models/indicators.py`,
`pyproject.toml` with ruff+mypy+pytest+pytest-asyncio configured under
dev extras, ruff `select = E,F,I,N,UP,B,SIM,RUF` at line-length 100,
mypy strict + pydantic plugin, Python 3.13/3.14). Vercel Python Fluid
Compute deploy target is Phase A remainder (Devyan).

---

## 4. Stack — nailed and non-negotiable

Per proposal §4.2, deliberately mainstream so the codebase stays transferable.

| Layer | Choice | Notes |
|---|---|---|
| **Frontend framework** | React 18 + Vite 5 + TypeScript | *Not Next.js.* Grant-locked to plain Vite SPA. |
| **Styling** | Tailwind CSS 3 | Custom tokens in `tailwind.config.ts` derived from the prototype. |
| **Animation** | Framer Motion 11 | Spring preset `springSettle` reproduces the prototype's cubic-bezier(0.22,1,0.36,1) settle. Respect `prefers-reduced-motion`. |
| **Mapping** | Mapbox GL JS 3.9 | Real map (Nairobi centroid). Token from `VITE_MAPBOX_ACCESS_TOKEN`. Never hardcode. |
| **Data fetching** | TanStack Query 5 | 60 s default staleTime; `["zones"]` bumped to 5 min. |
| **State** | Zustand 4 | Small stores for UI, chrome, map style. |
| **Realtime** | Laravel Echo + Reverb | Mock pulse (`src/lib/realtime.ts`) fires every 45 s; real Reverb swap is a one-line change inside `useLiveData`. |
| **Error tracking** | @sentry/react + sentry-laravel 4 | DSN-gated. Source maps upload only when SENTRY_ORG + SENTRY_PROJECT + SENTRY_AUTH_TOKEN all set. |
| **Backend framework** | Laravel 11 (PHP 8.3+) | Per proposal. |
| **DB** | PostgreSQL + PostGIS | Supabase in prod. Local docker for tests. RLS scaffold live. |
| **Auth** | Sanctum SPA tokens (8 h) + email 2FA + roles + API keys | No TOTP — replaced with email 2FA. |
| **Backend hosting** | Laravel Forge + DigitalOcean droplet | Deploy artifacts staged; provisioning is user-only step (9.4). |
| **Frontend hosting** | Vercel | Root `vercel.json` delegates build into `nuvola-atlas-frontend/`. |
| **DB hosting** | Supabase Postgres (pooled :6543, direct :5432 for migrations) | Requires a `nuvola_app` role in prod (see `docs/ops/deploy.md`). |
| **Ingestion** | FastAPI on Vercel Functions (Python 3.13/3.14, Fluid Compute) | Not yet split out. |
| **DNS** | Cloudflare | Free tier. |
| **Log aggregation** | BetterStack (Logtail) | Free tier for pilot. Not wired yet. |

**Stack DO-NOTs (grant-locked):** no Next.js, no Rails, no Django. Keep deps
mainstream and small.

---

## 5. The data contract (the single source of truth)

`nuvola-atlas-frontend/src/types/index.ts` is the authoritative shape both
sides mirror. Key types:

```ts
export interface PillarScores {
  social: number;   // 0..100
  safety: number;
  density: number;
  infra: number;
}

export interface Zone {
  id: string;                // e.g. "westlands", "kibra", "mathare"
  name: string;
  score: number;             // 0..100 overall Vitality
  pillars: PillarScores;
  deltas: PillarScores;      // signed points, this-quarter
  centroid: [number, number]; // [lng, lat]
  lastSyncMin: number;
}

export type InfraType = "road" | "energy" | "grid" | "water";
export type ProjectStatus = "active" | "stalled" | "planned";

export interface Project {
  id: string;
  name: string;
  zoneId: string;
  agency: string;   // KURA / KeNHA / KPLC / KETRACO / NCWSC / Athi Water / ICTA
  type: InfraType;
  status: ProjectStatus;
  progress: number; // 0..100
  budget: string;   // "KES 1.2B"
  started: string;  // YYYY-MM-DD
  eta: string;      // YYYY-MM-DD
  milestones: { date: string; label: string; done: boolean }[];
  marker: [number, number];
}

export interface AlertItem {
  id: string;
  severity: "high" | "medium" | "low";
  kind: "infra" | "vitality" | "esia" | "system" | "partner";
  title: string;
  body: string;
  zoneId: string | null;
  createdAt: string;
  read: boolean;
  affectedInfra: string[];
  recommendedActions: string[];
  impactLevel: "critical" | "major" | "moderate" | "minor";
  relatedProjectIds: string[];
}

export type ReportStatus = "published" | "review" | "draft";
export interface ReportSection { heading: string; content: string; }
export interface Report {
  id: string;
  title: string;
  zoneId: string | null;
  date: string;
  status: ReportStatus;
  author: string;         // team names appear as authors
  sizeBytes: number;
  format: "PDF";
  sections: ReportSection[];
  tags: string[];
  type: "vitality" | "infrastructure" | "density" | "safety" | "environmental";
  priority: "critical" | "high" | "medium" | "low";
  dateRange?: { from: string; to: string };
  pillarFocus?: PillarKey[];
  executiveSummary: string;
}
```

Backend API is under `/api/v1/*`, RFC 7807 problem+json for errors, Sanctum
bearer auth. Cursor pagination on `/alerts` and `/zones/{id}/activity`;
page-based on `/zones`, `/projects`, `/reports`. OpenAPI 3.1 spec at
`docs/api/openapi.yaml`.

---

## 6. Live mock-data inventory (what the platform currently shows)

Everything lives in `nuvola-atlas-frontend/src/api/fixtures.ts`. Real backend
ingestion is the pilot-gate item (§4 of `tasks/todo.md`).

| Fixture | Count | Notes |
|---|---|---|
| **Zones** | **17** | All 17 Nairobi sub-counties: Westlands, Dagoretti North/South, Langata, Kibra, Roysambu, Kasarani, Ruaraka, Embakasi South/North/Central/East/West, Makadara, Kamukunji, Starehe, Mathare. Every one carries plausible centroids + a 4-pillar score with deltas. |
| **Projects** | **19** | Real Kenyan agencies (KURA, KeNHA, KPLC, KETRACO, ICTA, NCWSC, Athi Water). Mix of road / energy / grid / water. Each carries full milestone timeline + budget + ETA + marker. |
| **Alerts** | **20** (a1–a20) | Cover all the pillar risks in play: stalled contractors, sanitation coverage crises, ESIA public participation windows, corridor safety issues, borehole yield shortfalls, KPLC feed interruptions, MOU signings. |
| **Reports** | **22** (r1–r22) | **Every one of the 17 zones has at least one dedicated report.** Report r1 is the county-wide quarterly; r6/r8 are county-wide safety-corridor + water/sanitation reads; r11–r22 are the per-zone deep dives added 2026-07-05. |
| **Activity feed entries** | **46** | Per-zone activity streams so scorecards populate on click. |
| **History** | 12 months | County-wide overall-avg trend for the Vitality history sparkline. |
| **Methodology** | 4 pillars | Pillar definitions + sub-metric labels for the "how this score is computed" popup. |

---

## 7. Brand — Navuuna (Ground & Harvest)

Rebrand landed 2026-07-04 (`6d7387a`). Nuvola Atlas → **Navuuna**. The vision
memo (see memory `project_navuuna_vision.md`) also introduced:

- **Sankofa** and **Asase** layers as the vocabulary the vision doc proposes
  the platform will eventually carry (heritage / land respectively).
- **Freedom Index** as an in-copy synonym for the Vitality Index in some UI
  surfaces — same score, richer framing.
- **Voronoi vitality choropleth** (982573a) — each zone's Voronoi cell is
  colored along the score ramp so the map reads as an area of influence, not a
  pin. Cell outlines were dropped (5e4378d) so the tint is the story.
- **Palette:** Ground & Harvest — navy, bone, teal (water), terracotta, gold,
  steel, rose. Token module: `src/lib/scoreColor.ts` (`BRAND.*`).
- Vocabulary should be *used in copy* but the stack stays the same — do NOT
  migrate to Go / MQTT (that's a longer-term architecture discussion, not a
  pilot deliverable).

---

## 8. Water & Sanitation (SDG-6 grant angle)

Added deliberately as a fundable angle (see memory
`project_water_sanitation_theme.md`).

- Fifth toggleable layer on the map: **Water & Sanitation**.
- Drawn as **real infrastructure geometry** — trunk main network (LineStrings
  fading through teal/deep-teal by served access), communal water-point taps
  (denser where shared-point dependency is high), zone hubs carrying the full
  SDG-6 profile, real sanitation facilities (kiosks, DEWATS blocks, faecal-
  sludge plant) at their true markers.
- **Context-specific sanitation** — the platform's reframe is that "clean
  water and sanitation for all" does NOT mean one pipe network for all. Where
  trunk sewerage isn't viable (Kibra, Mathare, peri-urban edges), the Atlas
  recommends decentralized architectures: container-based sanitation, faecal-
  sludge management, DEWATS cluster bio-digesters, raised ablution blocks.
- **Zone verdict:** every zone gets a plain "trunk sewerage viable / not
  viable" call with rationale, computed in `src/lib/waterSanitation.ts`.
- **Feeds the Vitality Index** — safe access lifts the Social Wellbeing
  "basic services" sub-metric; greywater reuse scores under Circular Economy
  Freedom in the Infrastructure pillar. The UI shows the causal link
  explicitly via the "Feeds the Vitality Index" panel in `WaterExplainer.tsx`.
- Fixtures include:
  - Real sanitation projects: Kibra Communal Water Kiosks (NCWSC), Mathare
    DEWATS Sanitation Block (Athi Water), Dagoretti South Water Main
    Extension (NCWSC), Embakasi Faecal Sludge Treatment Plant (Athi Water).
  - Sanitation-themed alerts a7–a11 (borehole yield shortfall, ESIA public
    participation, coverage crisis, trench flooding, Athi Water co-financing).
  - Reports r8 (county-wide water & sanitation review) and r9 (Kibra
    decentralized sanitation feasibility).

---

## 9. Map interactions — what was recently rebuilt (2026-07-05)

Three sessions of map-interaction polish landed today:

### 9.1 Water & Safety drawn as real geometry (05f4856)
Replaced the earlier "one dot per zone" with actual reticulation networks and
corridor lines.

### 9.2 Safety heatmap + click-through popups (141df82)
- Safety corridors/hubs/posts collapsed into a **risk-weighted heatmap** (steel
  → gold → terracotta → rose). Higher-risk zones = more + hotter points.
- Density gained the same treatment — points now carry `zoneId`, and a fat
  invisible `density-touch` hit layer makes them clickable at any zoom (the
  visible density circles only appear above zoom 13).
- On click, each layer opens a **compact project-management-style popup**:
  - Safety: zone, risk band, safety score, trend delta.
  - Density: zone, score bar, trend delta.
  - Water mains: name + trunk-main served-access %.
  - Water hubs/taps: zone, context, unmet-need bar, safe-access %.
  - Water facilities: full project card (agency, status, progress, ETA).
- Water/safety/density hit surfaces are added to the vitality-cell click gate
  list so those popups take priority over zone selection when the cursor is
  over one.

### 9.3 "Open full report" deep-link (b66f931)
- The zone scorecard already linked to `/reports?zone=<id>`; the Reports page
  now honors the param.
- ReportsTable filters the visible table to that zone.
- Auto-opens the **newest published** report in the detail popup (falls back
  to newest of any status if nothing's published).
- Fires once per param value — closing the popup doesn't re-open it.
- Header shows a "Zone: <name> · Clear" chip when scoped for one-click return
  to the full library.
- Closing the popup drops the `?zone=` param so refresh reflects state.

### 9.4 Report per zone + expanded fixtures (5d761f3)
- 12 new zone reports (r11–r22) so every one of the 17 sub-counties has at
  least one dedicated report.
- 8 new alerts (a13–a20) rounding out demo data across the map.
- 28 new activity-feed entries so previously-empty zones populate on click.

---

## 10. Recent commit history (most recent first, 25)

```
5d761f3 feat(data): report per zone + expanded alerts and activity feeds
b66f931 feat(reports): auto-open the zone report from scorecard "Open full report"
141df82 feat(map): safety heatmap + click-through popups for water and density
05f4856 feat(map): draw Water & Safety layers as real infrastructure geometry
f3609ce feat(data): expand fixtures with water & sanitation projects, alerts, reports
c9196de feat(ui): detail popups open expanded by default + wider scorecard panel
a874d9c feat(details): expandable detail panels + project delivery analysis
fe61c10 feat(scorecard): drill-in side panel replaces four-corner constellation
a483430 fix(map): force full style reload on basemap swap so custom layers survive
5e4378d fix(map): drop the Voronoi cell outlines — tint-only choropleth
9c6942c feat(copy): Ground Truth / Asase / Freedom Index vocabulary from the vision doc
982573a feat(map): Voronoi vitality choropleth — zone cells colored by score
b8b0086 polish(ui): rounding sweep, themed ring track, brand emblem on error screen
75b210e feat(details): shared floating DetailPopup + richer project/report/alert content
3eb91b9 feat(scorecard): four-corner Vitality constellation replaces side panel
4679b0e feat(map): add Water & Sanitation, Momentum, Safety layers (6 total)
ffc7e59 feat(frontend): centralize brand hex tokens + purge off-brand blue/white from map
6d7387a feat(brand): Navuuna rebrand — Ground & Harvest palette, fonts, emblem + wordmark
7b80b8a feat(frontend): mock realtime pulse + asset cache + zones staleTime (3.3/9.9/2.5)
c32002e docs(todo): strip commit SHAs and per-session logs from todo.md
ea48dab feat(security): per-API-key rate limit, configurable in mint wizard (9.8)
3a65506 docs(todo): bump HEAD to da014dc + 2026-06-08 second-pass session log
da014dc chore(ops): drop Railway-era artifacts, pin Vercel for ingestion service
13051c9 feat(security): force-2FA enrolment escalation for admins (9.13)
9142085 feat(perf): ETag + Cache-Control on /zones and /projects (9.9)
```

---

## 11. What's SHIPPED (frontend + backend)

### Frontend
- **Atlas map** — Mapbox GL JS on Nairobi County. Voronoi vitality choropleth
  as the base. Five toggleable overlay layers: Roads, Smart Grid, Density,
  Water & Sanitation, Safety & Security. All drawn as real geometry / heatmaps
  (no dots-per-zone).
- **Layer interactions** — every geometry and heat surface is clickable and
  opens a compact popup in the project-management style. Roads and grid retain
  their existing detail popups; water/density/safety got parallel treatment
  this session.
- **Zone scorecard** — expandable side panel (desktop) / centered popup
  (mobile). Vitality ring animates count-up; 4 pillar bars fill on a stagger.
  Each pillar drills into its own explainer view showing sub-metrics + how the
  water read feeds the score.
- **Water & Sanitation panel** — dedicated SDG-6 view with unmet-need score,
  safe-access %, shared-point %, queue time, sewer-viability verdict, and a
  toolkit catalogue where recommended architectures are highlighted for that
  zone.
- **Project delivery analysis** — expandable per-project view with
  promised-vs-delivered-vs-current comparison.
- **Reports library** — filterable table (all / published / review / draft),
  new-report modal, per-report detail view with executive summary + sections.
  Deep-link from the scorecard's "Open full report" button.
- **Alerts** — list + detail with affected infra + recommended actions +
  impact level chip.
- **Vitality leaderboard** — sortable table on desktop, compact numbered list
  on mobile.
- **Admin dashboard** — KPI cards, audit log with CSV export, users table with
  inline role change + self-lockout guard, API-keys table with mint wizard
  (abilities + expiry + rate-limit picker), 30-day audit sparkline, county
  Vitality trend sparkline.
- **Auth flow** — sign-in / sign-up, email 2FA setup wizard, 2FA verify screen.
- **Realtime plumbing** — `useLiveData` hook + mock pulse cycling zones /
  alerts / activity on 45 s. Auto-refresh toggle in Settings persists to
  localStorage. Real Reverb swap is one line inside the hook.
- **Theme** — light / dark toggle in Settings, persists in localStorage, driven
  by `data-theme` on `<html>`. Mapbox basemap follows the theme.
- **Mobile UX pass** — Layers popover on small screens, scorecard as centered
  popup, leaderboard as compact list, tap-target overlays on all clickable
  markers.
- **Deploy hygiene** — Vercel build green from repo root, mapbox-gl lazy-loaded
  behind AtlasMap dynamic import (only the 1.8 MB mapbox chunk deferred).
  Sentry SDK wired but DSN-gated. `vercel.json` sends immutable Cache-Control
  on `/assets/*`.

### Backend
- **API** — `/api/v1/` with 32 routes. RFC 7807 errors, Resources + FormRequests
  on every write, cursor pagination on hot list endpoints, page pagination
  elsewhere. OpenAPI 3.1 spec is the single source of truth.
- **Auth & security** — Sanctum 8 h SPA tokens; email-based 2FA (TOTP dropped);
  admin force-enrolment escalation (day-0 reminder → day-7 lock + revoke
  tokens); roles (viewer / partner / editor / admin) + `role:` middleware +
  Gates; append-only `audit_logs`; CSP + HSTS + X-Content-Type + X-Frame-Options
  + Referrer-Policy + Permissions-Policy + COOP + CORP; per-IP throttle on
  auth (10 / 10 min); per-API-key throttle configurable at mint; PostgreSQL RLS
  scaffold for partner overlays.
- **API keys** — mint / list / revoke via admin panel. Sanctum PATs with a
  fixed `api:read` / `api:write` ability allowlist. Plaintext returned exactly
  once at mint. Rate-limit column on the token so two keys don't share a budget.
- **Admin endpoints** — `/api/v1/admin/metrics`, `/admin/audit` + CSV export,
  `/admin/users` + `PATCH`, `/admin/api-keys`, `/admin/metrics/audit-volume`.
- **Perf** — ETag + Cache-Control `private, max-age=300` on `/zones` and
  `/projects` via `HttpCache` middleware. 304 handling on match.
- **Ops** — GitHub Actions (frontend + backend). Dependabot (npm, composer,
  actions). Sentry SDKs DSN-gated. Structured JSON log channel. Forge + DO +
  Supabase deploy artifacts staged. Rollback / incident-response / postmortem
  / secret-rotation runbooks in `docs/ops/`. `/api/health` (DB ping + cache
  write) live.

---

## 12. What's YET TO DO

**Pre-pilot blocking — infra / user-only (Phase A remainders):**
- Provision production Sentry DSNs for `navuuna-frontend`, `navuuna-backend`, `navuuna-ingestion` (three projects).
- GitHub branch protection on `main` — 1 approval + green CI + no force-push.
- Cloudflare DNS cut-over for production traffic.
- Forge + DigitalOcean deploy (artifacts staged in `nuvola-atlas-backend/`: `deploy.sh`, `docker/`, `Dockerfile`, `fly.toml`).
- Supabase AES-at-rest toggle (dashboard step).

**Phase B — Real Data Ingestion (active, blocked on Daystar):**
- Formalize `X-Internal-Secret` contract with HMAC payload signing (Devyan + Khillon).
- Correct `docs/data/daystar-indicator-spec.md` from 12 → 13 indicators + hand to Joy for Daystar delivery.
- Run ruff + mypy on ingestion service (configured in `pyproject.toml`; needs a first pass + CI wire-up).
- Cron scheduling for intake parsing scripts.
- Ship `POST /api/v1/ingest` Laravel intake route + `create_data_ingestion_logs_table` migration (Khillon).
- Wrap remaining synchronous `ScoreCalculator::recalculate*` HTTP paths in `RecalculateZoneScore` job (single-zone job already ships at `app/Jobs/RecalculateZoneScore.php`); add `RecalculateAllZones` bulk job (Austine).

**Phase E — Admin Suite backend (design signed off 2026-07-12, build pending):**
- 10 migrations: `extend_users_for_firms`, `create_firms_table`, `create_firm_users_table`, `add_firm_fk_to_users`, `create_firm_watchlists_table`, `create_methodology_versions_table` + v1.0.0 seed, `create_data_feed_status_table`, `create_impersonation_sessions_table`, `create_content_blocks_tables` + revisions, `extend_reports_for_cms`. (`audit_logs` table already exists from 2026-06-04.)
- Services: `Firms\FirmService`, `Watchlist\WatchlistService`, `Methodology\MethodologyPublisher`, `Methodology\MethodologyPreview`, `Feeds\FeedStatusService`, `Impersonation\ImpersonationService`, `Content\ContentBlockService`.
- Middleware: `audit.write`, `firm.scope`.
- Routes: `/api/v1/admin/{firms,methodology,feeds,impersonate,content}` families.
- Seeders: `FirmSeeder`, `FirmUserSeeder`, `FirmWatchlistSeeder`, `FeedStatusSeeder`.
- **FE for these surfaces is already shipped against mock** (`b1259ec feat(admin+investor): full Phase E frontend + Phase F landing`). Backend fills in behind an existing shape.

**Phase F — Investor Suite backend (design signed off 2026-07-12, build pending):**
- Routes: `/investor/{me,watchlist,portfolio,opportunities,brief}` behind `firm.scope`.
- `Export/ZoneReportExporter` already exists — `/investor/brief` extends it with the LP-style firm-portfolio format.

**Phase C — Hardening & Operations (queued):**
- GIST spatial indexes across core spatial columns.
- Materialized views for county-wide status (`mv_county_status`).
- Object storage decision: Cloudflare R2 vs Vercel Blob.
- Pruning routines: scrub raw ingestion payload text > 30 days.
- BetterStack + weekly multi-region backups + monthly restore drill.
- Penetration evaluation with Strathmore Info Sec Club.
- Ingestion spend guards (Devyan).

**Recent shipped work (post-2026-07-05, i.e. since the previous CONTEXT.md snapshot):**
- 2026-07-08 — `zone_score_snapshots` table + per-zone history API + Recharts trend chart (single time-series slice).
- 2026-07-09 — cleared the whole demo-feedback backlog: text-to-SQL RAG (`Chat/*` service stack: AiGatewayClient, ChatOrchestrator, InsightGenerator, IntentRouter, SchemaCatalog, SqlExecutor, SqlGenerator, SqlGuard, StreamEvent), forecast (`Forecast/ZoneScoreForecaster`), compare, PDF/DOCX/TXT exports (`Export/ZoneReportExporter`), polish. Backend `chat_conversations` + `chat_messages` migrations landed. phpunit 71 → 134.
- Late-July commit cluster — full Phase E frontend + Phase F landing shipped against mock (`b1259ec`), followed by Deal Pipeline board + System Health tab (`5f2500a`), impersonation + Content CMS + per-zone notes drill-in (`fed071b`), and a broad i18n sweep (`3e1587c`, `6ed0161`, `87b191f`).
- Brand tweaks: floated sidebar (`efc33d8`), tightened sidebar tagline (`2987b3d`), Gemini wiring landed then reverted (`9fac95d` → `8fe1013`).

**Documented deviations (codebase wins over the plan):**
- Time-series table is `zone_score_snapshots` (4 pillar columns) not `zone_snapshots` (13 indicator columns) as the Backend Build Plan §4.1 lists. Trend reads at pillar granularity.
- Text-to-SQL persistence uses `chat_conversations` + `chat_messages` (with text-to-SQL-specific columns: `intent`, `generated_sql`, `result_rows`, `tokens_in`, `tokens_out`, `latency_ms`), not the generic `conversations` + `conversation_messages` that Phase I plans. Phase I extends these rather than renaming.
- `daystar-indicator-spec.md` header still says "12-Indicator" — codebase carries 13. Devyan fix in Week 1.

**Non-engineering (other owners):**
- **§5** partner outreach (Joy / Ken) — Nairobi County Planning, KARA, CURI
  (UoN), Konza Technopolis, one urban NGO. Target ≥ 2 signed LOIs by month 11.
- **§6** methodology paper (Ken) — target ICTD conference or Habitat
  International (Elsevier). Draft month 7, submit month 11.
- **§7** entity registration + IP assignment (Ken, with Strathmore Legal
  Clinic).
- **§8** follow-on funding (Ken / Joy) — AfriLabs, Mozilla Technology Fund,
  GIZ Make-IT Africa, Konza pots, Hewlett Foundation.

**Frontend TODOs I own (Austine):**
- **2.1 on-device verification (CRITICAL, do-first)** — real Android + iPhone
  portrait/landscape pass; capture recordings into `docs/qa/`.
- **3.2** Vercel prod env flip (blocked on backend live).
- **5.2** outreach assets — 1-page Atlas explainer PDF + 90 s `/atlas` screen
  recording (after 2.1).

Full itemized status: **`tasks/todo.md`** in the repo (410 lines, kept live).

---

## 13. The four-check baseline

Run after every meaningful slice:

```
1. cd nuvola-atlas-frontend && npx tsc --noEmit
2. cd nuvola-atlas-frontend && npx vite build
3. cd nuvola-atlas-backend && php artisan route:list --path=api
4. cd nuvola-atlas-backend && php vendor/phpunit/phpunit/phpunit --no-coverage
   (requires `docker compose up -d postgres` from the backend dir first)
```

Last full green baseline: HEAD `c32002e`, frontend re-verified at 2026-06-27
after the §2.5 / §3.3 / §9.9 slice.
- `tsc --noEmit` clean
- `vite build` ~15 s (only the documented 1.8 MB mapbox chunk warning
  remains)
- `vitest run` 15/15 green
- `route:list` **32**
- `phpunit` **91 / 91**, 367 assertions, ~16 s

---

## 14. Domain vocabulary the UI carries (glossary)

Grant proposal §4.3 is the authoritative source. Short version:

| Term | What it means |
|---|---|
| **UE Vitality Index** | The 0–100 locality readiness score. Sometimes called Freedom Index in Navuuna copy. |
| **Social Wellbeing & Human Capital** | Pillar 1 — SPI, workforce mobility, mental health & livability. |
| **Safety & Security** | Pillar 2 — rule of law stability, infrastructure physical security, digital sovereignty. |
| **Density & Scaling Dynamics** | Pillar 3 — Optimal Density Ratio, Urban Friction Index. |
| **Infrastructure & Environmental Safeguards** | Pillar 4 — ESIA transparency, sovereign immunity risk, resource sovereignty, waste & lifecycle mandates, Circular Economy Freedom. |
| **Optimal Density Ratio** | Infrastructure Capacity / Population Density. < 1 = over-saturated. |
| **Urban Friction Index** | Sub-metric under Density — transit times for heavy equipment + zoning complexity. |
| **ESIA** | Environmental & Social Impact Assessment. Publicly available via NEMA portal. |
| **Ground Truth** | Field verification of a data point on the map (Joy + me, 2 visits/month). |
| **Sankofa layer** | Vision-doc name for the future heritage / cultural digitization layer. Copy-only for now. |
| **Asase layer** | Vision-doc name for the future land / soil layer. Copy-only for now. |
| **DEWATS** | Decentralized Wastewater Treatment System — cluster bio-digesters + baffled reactors serving a neighbourhood without a trunk main. |
| **FSM / faecal-sludge management** | Scheduled emptying + transfer stations + dedicated sludge treatment. Backbone for non-sewered systems. |
| **CBS** | Container-based sanitation — sealed cartridge latrines emptied on a scheduled route. |

Real Kenyan agencies referenced in fixtures: **KURA** (roads), **KeNHA**
(highways), **KPLC** (power), **KETRACO** (transmission), **NCWSC** (water &
sewerage — Nairobi City), **Athi Water Works Development Agency**, **ICTA**
(fibre), **KNBS** (statistics), **NEMA** (environment), **NPS** (police), **KMD**
(met department).

---

## 15. Design north-star — the prototype

`NuvolaAtlasPrototype.jsx` at repo root is the approved design spec. **Do NOT
edit it.** It is the reference for palette, type scale, spacing, radii,
shadows, the "settle" easing curve `cubic-bezier(0.22,1,0.36,1)`, the score
ring, pillar bars, layer toggles, zone-select interaction, and the mock Zone
data shape. Every production component should match its look-and-feel closely
— don't redesign it.

---

## 16. Local run

```
# Frontend dev server
cd nuvola-atlas-frontend
npm install
npm run dev
# → http://localhost:5173

# Backend dev server (needs local docker Postgres+PostGIS first)
cd nuvola-atlas-backend
docker compose up -d postgres
composer install
php artisan migrate:fresh --seed
php artisan serve
# → http://localhost:8000/api/health
```

Environment variables that matter for the frontend:
- `VITE_MAPBOX_ACCESS_TOKEN` — required for the map to render.
- `VITE_USE_REMOTE_API` — `false` (default) reads from `fixtures.ts`; `true`
  reads from Laravel.
- `VITE_API_BASE` — points at the Laravel `/api/v1/` root when remote.
- `VITE_SENTRY_DSN` — optional; Sentry init no-ops when unset.

---

## 17. What NOT to do

- Don't rewrite the stack. Grant proposal §4.2 pins it.
- Don't redesign the UI. Match the prototype.
- Don't add features beyond what the grant scope allows without asking.
- Don't mock the database in integration tests. Docker Postgres, always.
- Don't touch `NuvolaAtlasPrototype.jsx`.
- Don't push commits with `Co-Authored-By: Claude` trailers.
- Don't use destructive git operations without confirming.
- Don't skip the four-check baseline.
- Don't invent Vercel Next.js patterns — this is a Vite SPA, no Next.js.

---

## 18. If you need more context

- **`CLAUDE.md`** (repo root) — the grant proposal + full frontend build spec
  in one place. Authoritative for anything scope- or design-related.
- **`tasks/todo.md`** — the live execution plan. Anything in §1–§13 there is
  more current than this file for tactical status.
- **`docs/ops/`** — deploy, rollback, incident-response, postmortem, secret-
  rotation runbooks.
- **`docs/api/openapi.yaml`** — the API contract.
- **`nuvola-atlas-frontend/src/types/index.ts`** — the shared data contract.
- **`nuvola-atlas-frontend/src/api/fixtures.ts`** — the mock data everything
  currently renders from.
- **Memory** (my auto-memory under `.claude/projects/.../memory/`) — session
  snapshots, feedback rules, and reference pointers. See `MEMORY.md` for the
  index.

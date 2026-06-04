# NUVOLA ATLAS — Execution Plan

_Owner: Austine Igunza (frontend). Backend / scoring owners: Khillon & Devyan._
_Last updated: 2026-06-04._

## Session log — 2026-06-04 (pushed to `main`)

Three commits on top of `34f75b1`:

- **17846cb** — Backend API contract hardening: `/api/v1/` namespace, RFC 7807 errors, cursor pagination on alerts + activity, OpenAPI 3.1 spec, `/api/health`, test infra pinned to local docker postgres+postgis. Auth hardening: `Role` enum, `EnsureRole` middleware, gated write routes, `MustVerifyEmail`, `/auth/me` returns `role` + `email_verified`. Full suite: 39 tests / 120 assertions / 5s.
- **0af12e8** — Frontend polish: Reset View button, active-layer pulse, keyboard a11y; `AtlasMap` lazy-loaded (1.8 MB mapbox-gl stays deferred); Alert + Report adopt the Infra side-panel/mobile-modal pattern; `ProjectQuickView` overlay from search; `VITE_USE_REMOTE_API` explicit flag with mock default; `AuthUser` carries `role` + `email_verified`.
- **1808ddb** — `audit_logs` table + `AuditableObserver` + `Audit::record()` helper; auth events audited; tightened `SecurityHeaders` (CSP + COOP + CORP + HSTS preload). `SECURITY.md` at repo root. Suite: 43 / 137 / ~5s.

**Remaining pre-pilot priorities:** 9.3 API keys + 2FA, 9.7 AES-at-rest verification + RLS scaffold, 9.6 CI pipelines, 3.3 Reverb realtime, 9.11 Sentry wiring.

---

## 1. DONE — already shipped and pushed to `main`

### 1.1 Deployment
- [x] Vercel build now succeeds. Root `vercel.json` delegates the build into `nuvola-atlas-frontend/` and stale `pnpm-lock.yaml` + `pnpm-workspace.yaml` were removed so npm/`npm ci` is the only install path. Node engine pinned `>=20`.

### 1.2 Mobile UX
- [x] Mobile portrait: Map / Satellite / Terrain selector is reachable. Below `sm` breakpoint the segmented control collapses into a compact `Layers` popover button next to the hamburger, full segmented control returns at `sm+`.
- [x] View-mode label stays in sync with the actual map style. The TopBar indicator is now derived from the global `mapStyle` store instead of local component state, so it can't drift after a route change.
- [x] Zone scorecard on mobile is now a centered popup with backdrop (was a bottom sheet). Desktop still gets the right-side persistent panel.
- [x] Infrastructure detail: on desktop it slides in from the right as a side panel; on mobile it opens as a centered popup. The list stays visible behind both.
- [x] Vitality Leaderboard reflows on mobile to a clean numbered list of sub-county names. Tapping a name opens a popup with the four pillar bars and a "Open on Atlas map" button. Desktop keeps the full sortable table.
- [x] Map layers (Roads / Energy / Density) now render on first paint on mobile. `useMapInstance` installs a `ResizeObserver` and listens for `visibilitychange` / `orientationchange` / `resize`, ticking `m.resize()` a few times after first style load so the canvas paints into the correct viewport.
- [x] Smart grid markers + roads are clickable on every device. Added invisible 22 px hit-target layers (`grid-touch`, `roads-touch`) above the 5 px / 3 px visible markers, and the popup gates on the current toggle state so the hit-targets don't fire for off layers.

### 1.3 Navigation
- [x] `/atlas` no longer auto-selects Westlands on load. Only honors `?zone=<id>` deeplinks; otherwise the map opens clean with no zone selected and the scorecard closed.
- [x] Sidebar logo is a `<Link to="/atlas">` that also clears any selection.
- [x] Cross-page zone navigation (Leaderboard, SearchModal, Sidebar) uses `?zone=<id>` deeplinks consistently.

### 1.4 Theme
- [x] Light / dark mode toggle lives in Settings (top-right gear icon) on every device. Persists in `localStorage` (`nuvola_theme`). Applied via `data-theme` attribute on `<html>` with CSS overrides — no Tailwind rewrite required.
- [x] Settings dropdown closes on outside click and still has Reduced-motion + Auto-refresh toggles.

---

## 2. OUTSTANDING — frontend work I still need to do

### 2.1 On-device verification (CRITICAL — do first)
- [ ] Open the next preview deployment on a real Android phone in portrait and confirm:
  - The Layers popover opens and switches the basemap.
  - The view mode label matches the actual basemap (Map / Satellite / Terrain) after route changes.
  - Tapping a road or smart-grid pin opens a Mapbox popup.
  - Tapping a zone marker opens the centered popup.
  - The Vitality Leaderboard is the compact list, not the table.
  - The Settings gear shows the Light / Dark toggle and switching it actually flips the surface colors.
  - Hard-refreshing `/atlas` does NOT preselect any zone.
- [ ] Repeat on a real iPhone (portrait + landscape).
- [ ] Capture short screen recordings into `docs/qa/` so we have a pre-pilot baseline.

### 2.2 Light-mode polish — ✅ shipped (commit 17846cb / 0af12e8)
- [x] Mapbox basemap follows the app theme (light-v11 in light, dark-v11 in dark; Satellite/Terrain are explicit overrides).
- [x] Hard-coded `text-white` audited — every remaining occurrence sits on `bg-accent`/`bg-danger`/explicit dark fills (intentional).
- [x] Markers use `--zone-marker-ring` CSS var; light theme swaps to a dark semi-opaque stroke so the pill reads on a light basemap.

### 2.3 Click → popup pass — ✅ shipped
- [x] Alerts: `AlertList` now renders the Infra pattern (desktop slide-in side panel, mobile centered modal) via `AlertDetail.tsx`. `AlertCard` is a click-trigger; no more inline expand.
- [x] Reports: `ReportsTable` adopts the same Infra pattern via new `ReportDetail.tsx`; removed legacy `ReportDetailModal.tsx`.
- [x] Search modal: `ProjectQuickView` (mounted in `AppShell`) opens projects as an in-place overlay via `useChromeStore.openQuickView` — no navigation away from the current page.

### 2.4 Map polish — ✅ shipped
- [x] Reset View button (Compass icon, top-right) — flies to Nairobi centroid + clears `?zone=` deeplink.
- [x] Active layer dots pulse via the existing `.pulse-glow` class.
- [x] Markers got `tabIndex` + `role=button` + Enter/Space handler; `ScorecardPanel` closes on Esc.

### 2.5 Bundle & build hygiene — ✅ shipped
- [x] `AtlasMap` lazy-loaded inside `AtlasPage`. AtlasPage shell is 18.5 KB; AtlasMap is a 12.6 KB chunk; the 1.8 MB mapbox-gl bundle stays deferred behind the dynamic import. Non-map pages never load it.
- [x] No more chrome.ts dynamic-import warning (vite build is warning-free apart from the documented mapbox chunk-size notice).

---

## 3. OUTSTANDING — backend integration (Khillon owns, I wire it up)

The single biggest pre-pilot milestone. Today the frontend reads from
`src/api/fixtures.ts`. It needs to read from Khillon's Laravel API instead with
**no UI changes** required (because the data contract in `src/types/index.ts`
is the source of truth on both sides).

### 3.1 Freeze the API contract with Khillon — ✅ shipped (commit 17846cb)
- [x] Authoritative OpenAPI 3.1 spec at `nuvola-atlas-backend/docs/api/openapi.yaml`. All routes namespaced under `/api/v1/`; errors standardised to RFC 7807 `application/problem+json`.
- [x] Sanctum bearer auth + 401-to-sign-in handled by `handleResponse()` on the client. CORS is env-driven (`CORS_ALLOWED_ORIGINS`).

### 3.2 Flip the data flag — ✅ shipped (commit 0af12e8)
- [x] `VITE_USE_REMOTE_API` env in `client.ts`. Default is mock so local dev + Vercel preview deployments stay offline-safe.
- [ ] **Action on Vercel**: set `VITE_USE_REMOTE_API=true` + `VITE_API_BASE=https://<backend-host>/api/v1` on Production. Add the same vars locally in `.env` to point at a real backend.

### 3.3 Realtime
- [ ] Wire `useLiveData` against Laravel Echo + Reverb (channels `zones`, `alerts`). Hook shape stays mock-compatible so the swap is one-line.

---

## 4. OUTSTANDING — real data sourcing (replaces mock data)

Owners: Devyan + Khillon for ingestion; me for surfacing freshness in the UI.

### 4.1 Pillar 1 — Social Wellbeing and Human Capital
- KNBS open-data portal (population, density, basic services) → scheduled quarterly pull.
- Social Progress Index Kenya country file → annual CSV pull.
- KNBS Quarterly Labour Force Report → manual extraction first, OCR'd ingestion in Phase 2.
- OpenAQ API for air quality (free); OpenStreetMap park polygons for green space.

**Action items:**
- [ ] Devyan: FastAPI job `/ingest/knbs/population`, quarterly cron.
- [ ] Devyan: OpenAQ hourly cron, aggregated to daily ward averages.
- [ ] Khillon: expose pillar 1 sub-metrics on the zone endpoint so the scorecard's Data Sources panel can show real ages.

### 4.2 Pillar 2 — Safety and Security
- NPS Annual Crime Report (PDF — Phase 1 manual ward-level digitization, Phase 2 NPS open-data MOU).
- World Justice Project Rule of Law Index (annual, free CSV).
- ACLED (Armed Conflict Location & Event Data) — academic access, JSON API.
- Freedom House "Freedom on the Net" annual report.

**Action items:**
- [ ] Joy: file the ACLED academic-use request under Strathmore (~2 weeks).
- [ ] Ken: draft a one-page data-use letter for NPS for the partner outreach.

### 4.3 Pillar 3 — Density and Scaling Dynamics
- KNBS population density (see 4.1).
- Google Maps Distance Matrix API for sampled origin-destination transit times (paid; cap ~USD 50/month via sampling, not real-time queries).
- Nairobi County GIS zoning layers (open data — verify with County Planning).

**Action items:**
- [ ] Devyan: scope Distance Matrix monthly cost at proposed sample rate; confirm budget with Ken.
- [ ] Devyan: build OSRM self-hosted fallback so we can drop the paid API later.

### 4.4 Pillar 4 — Infrastructure and Environmental Safeguards
- KURA project list (CSV, eventually scraper).
- KeNHA project pipeline (same).
- KPLC outage map + substation status (Phase 1 scraper, Phase 2 MOU).
- KETRACO project status (annual report, manual digitization for pilot).
- NEMA ESIA portal (weekly scraper).
- World Bank Doing Business archive + Vision 2030 monitoring reports.

**Action items:**
- [ ] Devyan: KURA scraper → `infra_projects` table, weekly schedule.
- [ ] Devyan: NEMA ESIA scraper → `esia_records` table, weekly.
- [ ] Khillon: surface project-level data on `/api/projects`.
- [ ] Ken: draft the KPLC data-sharing MOU template.

### 4.5 Ground-truthing
- [ ] Joy + me: schedule 2 field visits per month to verify a sampled set of KURA / KETRACO statuses on the ground. Output: Google Sheet (project_id, expected_status, observed_status, date, photo).
- [ ] Devyan: add `verified_at` + `verification_source` to the project schema so the UI can flag ground-truthed data.

---

## 5. OUTSTANDING — partner outreach (Objective 3)

Owner: Joy, with Ken on legal language.
Target: ≥ 2 signed letters of intent by month 11. Lead times are long, so we start at month 0.

### 5.1 Pipeline (5 leads → convert ≥ 2)
- [ ] Nairobi County Planning Department — primary target. Joy requests intro via Strathmore VC's office.
- [ ] KARA (Kenya Alliance of Resident Associations) — civic stakeholder.
- [ ] Centre for Urban Research and Innovations (CURI), UoN — research / methodology partner.
- [ ] Konza Technopolis Development Authority — smart-city interest.
- [ ] One donor-funded urban NGO. Joy shortlists 3: Slum Dwellers International, Akiba Mashinani Trust, Habitat for Humanity Kenya.

### 5.2 Outreach assets
- [ ] One-page Atlas explainer PDF — I prepare visuals from live screenshots after 2.1 is verified.
- [ ] 90-second screen recording of the live `/atlas` map + scorecard.
- [ ] LOI template — Ken drafts, Joy sends.

### 5.3 Workshops
- [ ] Two partner workshops in months 6 and 10 (per proposal Section 7). Joy books Strathmore space and arranges transport reimbursement.

---

## 6. OUTSTANDING — methodology paper (Objective 4)

Owner: Ken drafts, Devyan supports.

### 6.1 Target venues
1. ICTD (Information and Communication Technologies and Development) — best fit.
2. Habitat International (Elsevier).
3. Journal of Urban Affairs — fallback.

### 6.2 Outline ("The UE Vitality Index: A Locality-Scale Readiness Score for Sub-County Industrial Planning in Kenya")
- [ ] Intro: Sen 1999 framing, the data gap.
- [ ] Method: 4 pillars, sub-metrics, weighting + sensitivity analysis.
- [ ] Case study: 17 Nairobi sub-counties, rankings, comparison to baselines.
- [ ] Validation: ground-truth subset + partner feedback.
- [ ] Discussion: limits, replication to other 46 counties.

### 6.3 Schedule
- [ ] Internal draft 1 — month 7 (Ken).
- [ ] Internal review — month 8 (Devyan + external advisor TBD).
- [ ] Submission — month 11.

---

## 7. OUTSTANDING — compliance and legal

Owner: Ken.
- [ ] Entity registration decision (limited company vs not-for-profit). Consult Strathmore Legal Clinic.
- [ ] IP assignment memo: all current code + design rights assigned to the registered entity once formed.
- [ ] KDPA-aligned data-handling SOP: anonymization, AES-256 at rest, access control, breach response.
- [ ] Cookie / consent banner on the deployed site once the entity name and privacy policy are finalized.

---

## 8. OUTSTANDING — follow-on funding

Owner: Ken + Joy, ongoing.

### 8.1 Applications to file by month 9
- [ ] AfriLabs Catalytic Fund — USD 5–25k.
- [ ] Mozilla Technology Fund — EUR 50k civic tech.
- [ ] GIZ Make-IT Africa — needs corporate co-applicant (pair with KPLC outreach).
- [ ] Konza Technopolis innovation pots — local, smaller, useful for credibility.
- [ ] Hewlett Foundation governance / data programmes — bigger ticket, longer cycle.

### 8.2 Asset reuse
- [ ] Reuse the 1-pager + 90s demo from 5.2 across all applications.

---

## 9. OUTSTANDING — platform engineering, ops, and security

Owners: Khillon (Laravel + Postgres + auth), Devyan (FastAPI ingestion, infra strategy, CI/CD), me (frontend deploy + client telemetry), Ken (compliance and budget sign-off). Everything in this section is **pre-pilot blocking** unless explicitly marked otherwise.

### 9.1 APIs and backend logic
- [x] OpenAPI 3.1 spec at `nuvola-atlas-backend/docs/api/openapi.yaml` — single source of truth.
- [x] `/api/v1/` namespace; `/api/v2/` reserved.
- [x] RFC 7807 error rendering via `problemResponse()` in `bootstrap/app.php`. Client-side `pickErrorMessage()` parses both Problem and legacy shapes.
- [x] Cursor pagination on `/alerts` and `/zones/{id}/activity`; page-based on `zones`, `projects`, `reports`.
- [x] FormRequests on every write (`SignInRequest`, `RegisterRequest`, `StoreReportRequest`, etc).
- [x] Laravel API Resources (`ZoneResource`, `ProjectResource`, `AlertResource`, `ReportResource`, `ZoneLayerResource`, `HistoryResource`, `ActivityResource`) shield models from wire shape.
- [ ] Idempotency-Key header on POSTs (deferred — adds when programmatic partner access goes live).
- [ ] Background jobs via Horizon (deferred to 9.5).
- [ ] Laravel ↔ FastAPI internal contract doc (deferred until ingestion service exists).
- [ ] Reverb payloads documented under `x-async` in OpenAPI (deferred — write when 3.3 ships).

### 9.2 Database and storage
- [ ] Final PostGIS schema review with Khillon before any partner data is ingested. Tables we know we need: `zones`, `pillar_scores`, `pillar_metric_history`, `infra_projects`, `project_milestones`, `alerts`, `reports`, `activity`, `users`, `personal_access_tokens` (Sanctum), `ingestion_runs`, `audit_log`.
- [ ] GIST spatial indexes on every geometry column. Without these, `ST_Intersects` queries fall back to a sequential scan.
- [ ] Add `created_at`, `updated_at`, `last_verified_at`, `verification_source` columns on data tables so freshness is queryable.
- [ ] Materialized views for the county-wide rollups the Vitality page uses; refresh nightly via cron.
- [ ] Migrations are the **only** way to change schema — no manual `psql` edits in production. Migrations are committed to VCS and applied via CI.
- [ ] PgBouncer (transaction pooling) in front of Postgres. Laravel + FastAPI both connect through it. Saves dozens of idle connections per request.
- [ ] Object storage for report PDFs, partner attachments, screen recordings: pick **Cloudflare R2** (cheapest egress) or **Vercel Blob** (zero-config with the frontend host). Decision before the first partner pilot.
- [ ] Pillar metric history retention: keep raw monthly readings forever (it's tiny), keep computed scores forever, throw away raw HTTP responses from ingestion after 30 days.

### 9.3 Auth and permissions
- [x] Sanctum SPA tokens, 8h TTL.
- [x] Email verification: `User implements MustVerifyEmail`; registration fires `Registered` event so the verification email is queued. `/auth/me` returns `email_verified` flag.
- [x] Password reset (`/auth/forgot-password` + `/auth/reset-password`), rate-limited via the `auth` limiter (5/min/IP); successful reset revokes every active token.
- [x] Roles enum (`viewer`/`partner`/`editor`/`admin`) with `rank()`/`isAtLeast()` helpers. `role:` middleware + Gates (`edit-internal`, `manage-users`). Write routes gated.
- [ ] Separate API-key path for programmatic partners (deferred — not pilot-blocking).
- [ ] 2FA TOTP for admin accounts (deferred to pre-launch).
- [ ] OAuth (Google/Microsoft) SSO (Phase 2).
- [ ] Per-zone data ACLs for sensitive layers (deferred — depends on partner data agreements).

### 9.4 Hosting and deployment
- [ ] Frontend: Vercel (already live). Production = `main`, previews = every PR.
- [ ] Backend (Laravel + Reverb): pick one and stick with it.
  - **Recommended**: Laravel Forge + a single DigitalOcean droplet (~USD 12/month) for the pilot year; well-documented, easy handover. Move to Forge + multi-node only if partner traffic justifies it.
  - Alternative: Laravel Vapor (AWS Lambda) — pay-per-request, scales to zero, but harder for a student team to debug.
  - Alternative: a single VPS we manage by hand — cheapest but fragile.
- [ ] FastAPI ingestion service: Fly.io (free for small workloads) or Railway. Separate from Laravel so an ingestion outage doesn't take the API down.
- [ ] Managed Postgres + PostGIS: **Supabase** (PostGIS extension supported, free tier covers pilot) or **Neon** (branching is great for previews). Decision before month 3.
- [ ] DNS via Cloudflare — free, with built-in DDoS and analytics. Even before launch.
- [ ] TLS: Let's Encrypt via Forge (auto-renew) on the backend; Vercel handles frontend TLS automatically.
- [ ] Three environments: `production`, `staging`, `local`. **Never** demo to a partner from `local` or from `production` mid-deploy.
- [ ] Secrets in each platform's secret manager (Vercel env vars, Forge env, Fly secrets). Nothing sensitive committed to the repo — `.env.example` only.

### 9.5 Cloud and compute
- [ ] Laravel Horizon for queue workers, autoscaling at the worker level inside the backend host.
- [ ] Cron scheduling: Laravel scheduler for backend jobs; FastAPI uses APScheduler or a host-level cron, depending on host.
- [ ] Mapbox usage tracking: tag every request with the deployment env so we can attribute cost. Alert at 60 % of the monthly cap.
- [ ] Distance Matrix API (paid, Pillar 3): wrap in a daily budget guard — kill the job if it would push us over the cap.
- [ ] Compute sizing starts at the smallest viable tier on every service; document in `docs/infra/sizing.md` so future-us can scale by replacing one config block.

### 9.6 CI/CD and version control
- [x] GitHub Actions pipelines (commit 3cc967d): frontend (npm ci + tsc + vitest + vite build) and backend (composer + route:list + migrate:fresh + phpunit against a PostGIS service; Pint + PHPStan informational). Per-job path filters keep PRs fast; concurrency cancels stale runs.
- [x] Dependabot (`.github/dependabot.yml`) for npm + composer (weekly Mon 06:00 EAT) and github-actions (monthly), with grouped updates and a mapbox-gl major-version hold.
- [ ] Branch protection on `main` — must be enabled in repo settings (one approval + status checks required + no force-push). Action is on the org owner, not in-repo.
- [ ] Conventional Commits enforced via a PR-title check (e.g. `amannn/action-semantic-pull-request`).
- [ ] Pre-commit hooks (Husky or lefthook) — `tsc --noEmit`, `vitest --changed`, `pint --dirty`, `phpstan`.
- [ ] Ingestion CI (`nuvola-atlas-ingestion/`) — `ruff`, `mypy`, `pytest` — added when service is split out.
- [ ] SemVer tags on backend releases.
- [ ] Rollback playbook at `docs/ops/rollback.md`.

### 9.7 Security and RLS
- [x] HSTS preload (production only) on every response from web + API.
- [x] CSP hardened on HTML responses (same-origin + Mapbox; no `unsafe-eval`; `frame-ancestors 'none'`).
- [x] Append-only `audit_logs` table + `AuditableObserver` on Report/Alert + explicit `Audit::record()` for auth events.
- [x] `SECURITY.md` at repo root with responsible-disclosure policy.
- [x] X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, COOP, CORP set in `SecurityHeaders`.
- [ ] AES-256 at rest — verify Supabase encryption toggle is on before partner data lands. TLS 1.3 in transit is default.
- [ ] Secret rotation policy doc (90-day cadence; immediate on departure).
- [ ] Dependabot enabled + `npm audit --omit=dev` blocking CI on high/critical.
- [ ] PostgreSQL **RLS** on a partner-scoped table (e.g. `partner_dataset_overlays`). Scaffold: migration + `app.current_partner_id` session var set by middleware on every request.
- [ ] Pentest before public launch (Strathmore Info Sec Club or external).

### 9.8 Rate limiting
- [ ] Per-IP throttle on `/sign-in`, `/sign-up`, `/forgot-password`: 10 attempts / 10 minutes / IP (Laravel `RateLimiter::for`).
- [ ] Per-user-token throttle on read APIs: 600 req/min, burst 100.
- [ ] Per-API-key throttle on partner programmatic access: configurable per partner via the admin panel; default 60 req/min.
- [ ] Cloudflare's free Bot-Fight Mode in front of the backend; auto-blocks the noisy stuff before it hits Laravel.
- [ ] Webhook write paths (when we add them) must be HMAC-signed AND rate-limited.
- [ ] Frontend: TanStack Query already deduplicates in-flight requests and respects `staleTime: 60_000`. No further client-side limiting needed pre-pilot.

### 9.9 Caching and CDN
- [ ] Vercel CDN handles the static frontend automatically. Confirm `Cache-Control: public, max-age=31536000, immutable` on hashed assets.
- [ ] Backend HTTP caching: `ETag` + `Cache-Control: private, max-age=300` on `/api/zones` (rarely changes), `/api/projects` (slow-moving). Skip caching on `/api/alerts` and `/api/activity` (real-time).
- [ ] Redis (managed via Upstash free tier OR a Forge-managed instance) for:
  - Laravel cache driver (replaces `file` driver in prod).
  - Session driver.
  - Queue backend (Horizon needs it).
  - Rate-limit counters.
  - Reverb pub/sub once we scale to >1 backend node.
- [ ] Mapbox tile cache: handled by Mapbox's CDN automatically; verify cache headers show up in browser DevTools so the user isn't downloading tiles repeatedly.
- [ ] TanStack Query (frontend): keep `staleTime: 60_000` for now; bump to 5 min for `/api/zones` once we confirm backend update frequency matches.

### 9.10 Load balancing and scaling
- [ ] Frontend: Vercel handles it.
- [ ] Backend pilot phase: single Forge-managed node. Document the upgrade path:
  1. Single node (pilot).
  2. Two nodes behind a Forge load balancer + shared Redis + shared object storage (one signed-in partner with active usage).
  3. Multi-region (when we cross 2+ counties with concurrent usage).
- [ ] Backend must be **stateless** from day one — no session writes to the local filesystem, no `storage/app` writes that aren't replicated. Otherwise step 2 breaks.
- [ ] Database scaling: start single-instance. Add a read replica on Neon/Supabase the moment a partner's dashboard starts visibly lagging. Migrations always run against primary.
- [ ] Reverb scaling: Reverb supports multi-node via Redis pub/sub. Untested at our scale — load-test with Artillery before any public launch.
- [ ] Auto-scaling rules (Forge / Fly): scale up at CPU > 70 % sustained 5 min; scale down at CPU < 30 % sustained 15 min. Cap at 3 nodes during pilot to control cost.

### 9.11 Error tracking and logs
- [ ] **Sentry** for frontend + backend + FastAPI. Free tier covers the pilot. Capture user context (without PII) so we can correlate an error to a partner session.
- [ ] Upload source maps for every production frontend build (Sentry Vite plugin in `vite.config.ts`).
- [ ] Frontend: hook `ErrorBoundary.componentDidCatch` into Sentry so client-side errors don't just `console.error` and disappear.
- [ ] Backend: Laravel's exception handler reports to Sentry; structured JSON logs to stdout for log aggregation.
- [ ] FastAPI: `structlog` + Sentry's ASGI integration.
- [ ] Centralized log aggregation: **BetterStack** (Logtail) free tier for the pilot. One dashboard for the three services.
- [ ] Frontend network telemetry: ship a tiny `/api/client-telemetry` endpoint that records timing + 4xx/5xx rates from real partner sessions (opt-in for partners).
- [ ] Alert thresholds (Sentry + BetterStack):
  - Any `error.level=fatal` → immediate Slack ping.
  - 5xx error rate > 1 % sustained 5 min → ping.
  - Ingestion job failure → ping.
  - Mapbox tile load failure rate > 5 % → ping (signals quota or outage).
- [ ] Lightweight in-app "Report a problem" widget (mailto for the pilot, real ticketing later).

### 9.12 Availability and recovery
- [ ] Uptime target: **99 %** for the pilot (≈ 7 h / month allowed downtime). 99.9 % only once we have a paid partner with an SLA.
- [ ] Public status page: BetterStack free status page tied to synthetic checks against `/api/health` and the Atlas page.
- [ ] **Backups**:
  - Managed Postgres provider's automated daily backups (Supabase / Neon both do this).
  - Verified weekly: pull the latest backup into a scratch DB and run a smoke query.
  - Off-site copy: weekly `pg_dump` shipped to Cloudflare R2 in a separate region.
  - Object storage (reports, screen recordings): R2 versioning + lifecycle rule for 30-day undelete.
- [ ] Backup-restore drill every quarter. Time it. Document in `docs/ops/restore-drill.md`.
- [ ] **RTO** (Recovery Time Objective): 4 hours for the API in a full-host loss.
- [ ] **RPO** (Recovery Point Objective): ≤ 1 hour for the database (point-in-time recovery), ≤ 24 hours for object storage.
- [x] `GET /api/health` (DB ping + cache write) shipped. `GET /api/health/ingestion` still pending (depends on ingestion service).
- [ ] Single-point-of-failure audit: list every external dependency (Mapbox, KNBS, KPLC scraper targets, Sentry, GitHub). For each, what happens if it's down for 24 hours? Document the degradation strategy.
- [ ] Incident response runbook (`docs/ops/incident-response.md`): who pages who, what the first 15 minutes look like, when to update the status page.
- [ ] Light on-call rotation among the five of us (we're not a 24/7 operation, but during partner working hours someone is reachable).
- [ ] Postmortem template (`docs/ops/postmortem-template.md`) for any incident lasting > 30 min. Blameless.

---

## 10. Risks (mapped to proposal Section 5.3)

- Government data sources incomplete → mitigated by 4.2 / 4.4 multi-source triangulation; surface gaps in the Data Sources panel.
- Pilot partner slow to commit → start 5.1 outreach now; don't wait.
- Methodology challenged academically → ground in Sen + SPI + Freedom on the Net; submit early enough to survive one rejection.
- Mapbox bill overrun → monitor MAU + tile loads once any partner deploys; alert at 60 % of budget.
- Vercel bill overrun → frontend is static + rewrites only, no serverless. Should stay near-zero.

---

## 11. "Pilot-ready" definition (the bar we hit in 6 months)

A partner can:
1. Sign in.
2. See a live Atlas of Nairobi with road / energy / density layers driven by **real ingested data**, not mock.
3. Click any of the 17 sub-counties and get a Vitality score built from the four real-pillar inputs in Section 4.
4. Open the methodology popup and read exactly how each pillar number was computed and when it was last refreshed.
5. Export the zone scorecard as a PDF.
6. Trust that the data behind the map is being refreshed on a defensible schedule.

If any of those six things still depends on `src/api/fixtures.ts` after month 6, we are not pilot-ready.

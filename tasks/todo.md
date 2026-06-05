# NUVOLA ATLAS — Execution Plan

_Owner: Austine Igunza (frontend). Backend / scoring owners: Khillon & Devyan._
_Last updated: 2026-06-05._
_HEAD: `2aab2fc` on `origin/main` (Forge+DO deploy artifacts shipped). RLS + secret-rotation slice staged locally for the next commit._

## Session log — 2026-06-05 (Forge + DigitalOcean deploy prep, 9.4)

Five new files staged for the next commit. Nothing actually deployed — the
artifacts let whoever owns infra (likely Khillon or Devyan) provision the
droplet from a paint-by-numbers guide instead of designing the deploy from
scratch.

- `nuvola-atlas-backend/deploy.sh` — Forge deploy script. Idempotent:
  composer install (no-dev) → `artisan down` → migrate → cache config/route/
  view/event → `artisan up` → `queue:restart` + `reverb:restart` → php-fpm
  reload behind a flock. Trapped to bring the app back up if migrate fails.
- `nuvola-atlas-backend/.env.production.example` — production template:
  Supabase pooled+direct DB strings, Redis for cache/session/queue/state,
  Reverb with TLS through nginx, Cloudflare R2 storage, Postmark mail,
  Sanctum 8h, Sentry placeholders for 9.11.
- `nuvola-atlas-backend/docker/nginx/forge.conf` — six labelled paste-in
  blocks for the Forge nginx editor: monorepo docroot, Cloudflare real-IP,
  Reverb websocket upgrade (`/app` + `/apps/*` → `127.0.0.1:8080`), static
  asset caching, and an optional edge rate-limit on `/api/v1/auth/*`.
- `nuvola-atlas-backend/docker/supervisor/nuvola-queue.conf` and
  `nuvola-reverb.conf` — Forge Daemon configs (commands, processes, stop
  signals/timeouts) kept in-repo for review.
- `docs/ops/deploy.md` — twelve-step Forge+DO+Supabase walkthrough with a
  rollback note. New `docs/ops/` root at the repo (matches §9.6 references
  to `docs/ops/rollback.md`, etc.).

Manual TODO this unblocks (and still requires the user):
- Create the DigitalOcean droplet + Forge site per §3–5 of the deploy guide.
- Provision Supabase project + enable PostGIS per §2.
- Create the `nuvola_app` non-superuser role per deploy.md §2 step 5 so the RLS scaffold actually bites.
- Paste env values + run "Deploy Now" once.
- After §10 smoke test passes, flip `VITE_USE_REMOTE_API` on Vercel per §11.

## Session log — 2026-06-05 (continued, RLS + secret rotation, 9.7 partial)

Second slice of the day, on top of `2aab2fc`. Pure code/docs — no provider
work. Adds the RLS scaffold and the secret-rotation policy referenced in §9.7.

- `nuvola-atlas-backend/database/migrations/2026_06_05_120000_create_partners_and_overlays_with_rls.php`
  — creates `partners` + `partner_id` FK on users + `partner_dataset_overlays`
  with ENABLE + FORCE ROW LEVEL SECURITY. Single `partner_isolation` policy
  covers SELECT/INSERT/UPDATE/DELETE keyed on
  `NULLIF(current_setting('app.current_partner_id', true), '')::bigint`.
  Unset context → NULL comparison → zero rows visible (safe default).
- `nuvola-atlas-backend/app/Http/Middleware/SetPartnerContext.php` — sets
  `app.current_partner_id` from `$request->user()->partner_id` on every
  authenticated request and clears it in `finally` before the connection
  returns to the pool. Aliased `partner.context` in `bootstrap/app.php`,
  wired into the `auth:sanctum` group in `routes/api.php`.
- `app/Models/Partner.php`, `app/Models/PartnerDatasetOverlay.php` + factories.
  `User` model gained a `partner()` belongsTo relation.
- `tests/Feature/PartnerOverlayRlsTest.php` — creates a `nuvola_app`
  non-superuser role in setUp, `SET ROLE`s into it, and proves:
  (1) policy hides other partners' rows, (2) unset context → zero rows,
  (3) `WITH CHECK` blocks inserts with the wrong partner_id, (4) the
  middleware doesn't crash on a real authenticated request.
- `docs/ops/deploy.md` §2 step 5 — production setup for the `nuvola_app`
  role (the docker test postgres uses a superuser, which bypasses RLS;
  production needs a non-superuser role for the policy to bite).
- `docs/ops/secret-rotation.md` — 90-day cadence, departure trigger, leak
  playbook, per-secret rotation steps (APP_KEY, DB password, Sanctum,
  Reverb key/secret, Postmark, R2, deploy SSH, Mapbox).
- todo §9.7 — checkboxes ticked; what's left is the AES-at-rest Supabase
  toggle (user-only) and the pentest (deferred).

## Session log — 2026-06-04 (all pushed to `main`)

Six commits on top of `34f75b1`:

1. **17846cb** `feat(backend)` — API v1 namespace, RFC 7807 errors, role-based auth.
   - All routes under `/api/v1/`; new `/api/health` (DB + cache probe).
   - `bootstrap/app.php` renders every API failure as `application/problem+json`.
   - `/alerts` and `/zones/{id}/activity` now cursor-paginated.
   - OpenAPI 3.1 spec at `nuvola-atlas-backend/docs/api/openapi.yaml`.
   - `App\Enums\Role` (viewer/partner/editor/admin) + `EnsureRole` middleware (`role:` alias).
   - `User implements MustVerifyEmail`; `/auth/me` returns `role` + `email_verified`.
   - `phpunit.xml` force-overrides DB host/user/pass to local docker postgres+postgis.
   - Suite at end of commit: **39/120 green ~5s**.
2. **bb42f59** `feat(frontend)` — map polish, click→popup pass, bundle hygiene, remote API flag.
   - Reset View (Compass) button on AtlasMap; active layer dots pulse; markers keyboard-accessible; ScorecardPanel closes on Esc.
   - `AtlasMap` lazy-loaded; AtlasPage shell drops to 18.5 KB, mapbox-gl (1.8 MB) deferred.
   - `AlertList` + `ReportsTable` adopt the Infra pattern (desktop side panel, mobile centered modal) via new `AlertDetail.tsx` + `ReportDetail.tsx`; legacy `ReportDetailModal.tsx` deleted.
   - `ProjectQuickView` mounted in `AppShell`; `SearchModal` opens non-zone results as an in-place overlay via `openQuickView`.
   - `client.ts`: explicit `VITE_USE_REMOTE_API` (default mock); parses both Problem and legacy error shapes.
   - `AuthUser` carries `role` + `email_verified`; exports `hasRoleAtLeast()` helper.
3. **0af12e8** `docs(CLAUDE.md)` — routine 4-check baseline (fe tsc + fe vite build + be route:list + be phpunit) + per-slice push cadence are now mandatory in `CLAUDE.md`.
4. **1808ddb** `feat(backend)` — append-only audit log + tighter security headers.
   - `audit_logs` table (actor_id, action, resource_type, resource_id, before jsonb, after jsonb, ip, ua, created_at) — no `updated_at`.
   - `App\Models\AuditLog`, `App\Support\Audit::record()`, `App\Observers\AuditableObserver` registered on `Report` + `Alert`.
   - Explicit `Audit::record()` for `auth.sign_in`, `auth.sign_out`, `alert.bulk_read`.
   - `SecurityHeaders` gains CSP (HTML only), HSTS preload (prod), COOP, CORP; also runs on web routes, not just API.
   - `SECURITY.md` at repo root.
   - Suite at end of commit: **43/137 green ~5s** (4 new `AuditLogTest` cases).
5. **b63225a** `docs+fix` — schema reference, mock writes persist across reloads, todo sync.
   - New `nuvola-atlas-backend/docs/schema.md` — every table catalogued (users, sanctum tokens, zones, zone_layers, projects, alerts, reports, activities, vitality_history, audit_logs) with columns, FK rules, indexes, PostGIS notes; plus the `psql` commands to inspect the live DB.
   - `mock.ts` persists `reports` + `alerts` state to localStorage so a posted report survives a refresh during demos. (Real persistence still needs `VITE_USE_REMOTE_API=true` + a deployed backend.)
6. **3cc967d** `ci` — fix npm path, scope checks, add Dependabot.
   - `.github/workflows/ci.yml`: pnpm → npm; per-job path filters; cancel-in-progress concurrency; cached deps; backend job spins up `postgis/postgis:16-3.4` as a service; runs route smoke + migrate:fresh + phpunit; Pint + PHPStan informational (`continue-on-error: true`) until the ~70 files of pre-existing debt are cleaned up.
   - `.github/dependabot.yml`: weekly npm + composer PRs (Mon 06:00 EAT), monthly github-actions, grouped updates for react/mapbox/laravel/tooling; mapbox-gl major-version hold.
7. **c839103** `docs(todo)` — sections 9.6 marked done with commit refs (this file).

### Current end-to-end status

| Layer | State | Notes |
|-------|-------|-------|
| Frontend build | ✅ green | `tsc --noEmit` clean; `vite build` warns only on the documented 1.8 MB mapbox chunk; 15/15 vitest tests pass in ~4s. |
| Backend tests | ✅ 43/137 | `php vendor/phpunit/phpunit/phpunit` (needs `docker compose up -d postgres` first). |
| Backend routes | ✅ 19 routes | `php artisan route:list --path=api` shows the v1 surface + `/api/health`. |
| CI on push | ⏳ awaiting first run | First run after the new pipeline is in flight on GitHub — verify it goes green in Actions tab. |
| Vercel preview | ✅ green | `vercel.json` delegates to `nuvola-atlas-frontend/`. |
| Vercel production | ⚠️ mock data | `VITE_USE_REMOTE_API` not set on Vercel yet — that's why a posted report disappears on reload. To switch to real data: set `VITE_USE_REMOTE_API=true` + `VITE_API_BASE=https://<backend>/api/v1` on Production and redeploy. Backend has to be deployed first. |
| Backend hosting | ❌ none yet | Pick Forge + DigitalOcean (recommended in 9.4) or Vercel-hosted Laravel; nothing's live. |

### Manual TODO that only the user can do

- **GitHub → Settings → Branches → `main`** — turn on branch protection (require Backend + Frontend checks, 1 approval, block force-push).
- **Vercel → Project → Settings → Env Vars → Production** — add `VITE_USE_REMOTE_API=true` + `VITE_API_BASE=https://<backend-host>/api/v1` once the backend is hosted.
- **Verify the first CI run** in GitHub Actions; if it fails on something that passes locally, paste the failing step.

### Next pre-pilot priorities (in suggested order)

1. **9.4 Backend hosting — actual provisioning** — deploy artifacts are in repo (`deploy.sh`, `.env.production.example`, `forge.conf`, supervisor configs, `docs/ops/deploy.md`). What's left is the user-only part: create the DO droplet via Forge, provision Supabase + `nuvola_app` role (per deploy.md §2), paste env, run "Deploy Now", smoke-test `/api/health`.
2. **3.3 Reverb realtime** — only meaningful once the backend is reachable.
3. **9.11 Sentry + structured JSON logs** — wire frontend + backend; depends on a Sentry org.
4. **9.7 remaining**: AES-at-rest toggle verified on Supabase (user-only), pentest (deferred to launch).
5. **9.3 finish-up** — API key auth path for programmatic partners; 2FA TOTP for admins.

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
- [x] Frontend: Vercel (already live). Production = `main`, previews = every PR.
- [x] Backend stack picked: **Laravel Forge + DigitalOcean** + **Supabase Postgres+PostGIS**. Deploy artifacts staged: `nuvola-atlas-backend/deploy.sh`, `.env.production.example`, `docker/nginx/forge.conf`, `docker/supervisor/{nuvola-queue,nuvola-reverb}.conf`. Walkthrough at `docs/ops/deploy.md`.
- [ ] **Provision step (user-only)**: create DO droplet via Forge, provision Supabase project + enable PostGIS, paste env, run Deploy Now, smoke `/api/health`. See `docs/ops/deploy.md` §1–10.
- [ ] FastAPI ingestion service: Fly.io (free for small workloads) or Railway. Separate from Laravel so an ingestion outage doesn't take the API down.
- [x] Managed Postgres + PostGIS decision: **Supabase** (pooled connection on :6543, direct on :5432 for migrations, `DB_SSLMODE=require`).
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
- [ ] AES-256 at rest — verify Supabase encryption toggle is on before partner data lands. TLS 1.3 in transit is default. (User-only step after Supabase project exists.)
- [x] Secret rotation policy doc — `docs/ops/secret-rotation.md`. 90-day cadence + departure trigger + leak playbook + per-secret rotation steps (APP_KEY, DB password, Sanctum, Reverb key/secret, Postmark, R2, deploy SSH, Mapbox).
- [x] Dependabot enabled (commit 3cc967d) + `npm audit --omit=dev` blocking CI on high/critical.
- [x] PostgreSQL **RLS** scaffold — migration `2026_06_05_120000_create_partners_and_overlays_with_rls.php` (partners + partner_id on users + partner_dataset_overlays with ENABLE + FORCE RLS + per-action policy keyed on `current_setting('app.current_partner_id')`). `SetPartnerContext` middleware sets the session var on every authenticated request. `PartnerOverlayRlsTest` proves isolation against a non-superuser role. Requires a `nuvola_app` role in prod (see `docs/ops/deploy.md` §2 step 5).
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

# NUVOLA ATLAS — Execution Plan

_Owner: Austine Igunza (frontend). Backend / scoring owners: Khillon & Devyan._
_Last updated: 2026-06-08 (second pass)._
_HEAD: `da014dc` on `origin/main` (Railway cleanup; pin Vercel for ingestion)._

## Session log — 2026-06-08 (continued — provisioning roster, caching, force-2FA, Railway purge)

Five additional slices on top of `5e2db49`, all pushed:

5. **c8d7757** `docs(ops)` — account provisioning roster in `docs/ops/deploy.md` §0
   (Tier 1 / Tier 2 / data sourcing / MCPs / share-rule / 30-min fast path);
   every external dependency the project needs is now catalogued with
   "who creates the account, what they share, where it lands, what
   Claude does next." Replaces ad-hoc tribal knowledge.
6. **17800db** `docs(ops)` — Status column added to §0.2 / §0.3 / §0.5
   with ✅ / ⏳ / 🚫 markers + "status notes" callouts. As of today
   only `gh` CLI is ✅; GitHub repo and Vercel project are ⏳ (account
   exists, prod env vars + branch-protection rule are missing);
   everything else is 🚫.
7. **9142085** `feat(perf)` — §9.9 HTTP caching middleware. New
   `App\Http\Middleware\HttpCache` (aliased `http.cache`) computes
   `ETag` (md5 of body) + `Cache-Control: private, max-age=N`
   (default 300) on cacheable GETs only, returns 304 with the ETag
   when `If-None-Match` matches (including wildcard per RFC 7232 §4.1).
   Applied to `/api/v1/zones`, `/zones/{id}`, `/zones/{id}/layers`,
   `/projects`, `/projects/{id}`. `/activity` stays out (real-time);
   `/alerts` and `/reports` unchanged. `HttpCacheTest` (7 cases)
   covers shape, 304 path, mismatch path, wildcard, /projects
   coverage, /alerts is NOT cached, and ETag rotates with data.
8. **13051c9** `feat(security)` — §9.13 force-2FA enrolment escalation.
   Migration adds `email_two_factor_reminded_at` + `email_two_factor_locked_at`
   (datetime, nullable). Daily-scheduled `nuvola:remind-admin-2fa`
   command (`Schedule::command(...)->dailyAt('09:00')`) finds admins
   missing 2FA: day-0 reminder email + audit `user.two_factor_reminder_sent`,
   day-7 escalation that revokes every Sanctum token + sends "locked"
   email + audits `user.two_factor_locked`. `TwoFactorController::emailConfirm`
   self-heals both timestamps on successful enrolment. Admin users
   table now shows three new states (On / Locked / Reminded / Off)
   with hover-tooltips, fed by `two_factor_locked` +
   `two_factor_reminded_at` fields newly exposed on `/admin/users`.
   `RemindAdminsWithoutTwoFactorTest` (8 cases): first reminder,
   no-op in grace window, escalation + token revoke, already-locked
   skipped, enrolled ignored, non-admin ignored, dry-run no-mutation,
   enrolment clears state.
9. **da014dc** `chore(ops)` — Railway cleanup. Deleted four orphan
   files from an abandoned Railway exploration: `nuvola-atlas-backend/Dockerfile`,
   `railway.toml`, `docker-compose.prod.yml`, `docker/nginx/default.conf`.
   Replaced `nuvola-atlas-backend/docs/deployment.md` with a redirect
   stub to `docs/ops/deploy.md`. Updated §9.4 ingestion-service
   bullet: was "Fly.io or Railway", now "Vercel Functions (Python
   3.13/3.14 via Fluid Compute)" per the session-start Vercel
   knowledge update — same Vercel account as the frontend, no
   second host onboarding.

End-of-session checks: tsc clean, vite build clean (mapbox-only chunk
warning), route:list 31 (unchanged), phpunit 71 → **86** (+1 audit-
volume earlier + 3 rate-limit earlier + 7 http-cache + 8 force-2FA).

## Session log — 2026-06-08 (admin sparklines, auth throttle, ops docs)

Three slices on top of `1b3b985`, all pushed:

1. **68187df** `feat(admin)` — audit-volume + vitality-trend sparklines (9.13).
   - Backend: `GET /api/v1/admin/metrics/audit-volume` returns a 30-entry
     daily series (oldest → newest, zero-filled) cached 5 min.
     Postgres-friendly `TO_CHAR` for grouping; SQLite fallback to
     `DATE()`. New `AdminDashboardTest::test_audit_volume_returns_thirty_day_series_with_zero_fill`.
   - Frontend: pure-SVG `<Sparkline>` primitive (no chart lib), with
     gradient area fill + path stroke, scales to its own min/max with
     a 2 px y-pad. `<MetricCard>` gained an optional `spark` slot;
     overview row now shows the 30-day audit-event spark next to the
     24h count and a 12-month county-wide Vitality trend spark
     (green) reusing the existing `/api/v1/history` endpoint. Mock
     fixture for the audit-volume series so preview/local renders
     without a backend.
2. **3e0164e** `feat(security)` — tighten auth rate-limit to 10/10min/IP (9.8).
   - `AppServiceProvider`: `RateLimiter::for('auth', ...)` switched from
     `Limit::perMinute(5)` to `Limit::perMinutes(10, 10)`. Caps a single
     IP at ~60 attempts/hour across `/sign-in`, `/register`,
     `/forgot-password`, `/reset-password`, `/auth/2fa/verify`.
   - New `AuthRateLimitTest` (3 cases): 11th wrong-password attempt
     returns 429 + Problem JSON; per-IP scoping confirmed; forgot-
     password is covered by the same limiter.
   - Existing auth-touching tests (AuthApiTest, TwoFactorTest,
     AuditLogTest) all stay under the 10-attempt budget per-test
     because each test gets a fresh app + fresh array cache.
3. **42959c2** `docs(ops)` — rollback + incident-response + postmortem
   template (9.6, 9.12).
   - `docs/ops/rollback.md`: decision tree, RTO table (FE 2 min / BE
     5 min / DB 30 min), Vercel rollback steps, Forge code-only vs
     migrations-involved paths, full Supabase restore, mandatory
     after-rollback checklist, explicit "what does NOT get a rollback"
     list.
   - `docs/ops/incident-response.md`: SEV-1/2/3 definitions, IC/Comms/
     Tech/Scribe role collapse, first-15-minutes script, comms
     templates, symptom→first-action lookup table.
   - `docs/ops/postmortem-template.md`: blameless template (impact,
     timeline, root cause, contributing factors, what went well/badly/
     lucky, action items with hard rules, optional data-loss section,
     verification checklist).
   - `docs/ops/deploy.md`: replaced the placeholder rollback section
     with pointers to the three new docs.

End-of-session checks: tsc clean, vite build clean (mapbox-only
warning), route:list 31 (was 30; +`/admin/metrics/audit-volume`),
phpunit 71/71 in ~11 s (68 → 71, +1 audit-volume +3 rate-limit).

What this unblocks:
- Admin dashboard overview now reads as a trend dashboard, not just
  counters — closes one of the two remaining §9.13 items.
- The auth-IP throttle takes care of the §9.8 sign-in/sign-up/forgot
  bullet, which was the only blocking item in §9.8 that didn't need
  user infra (Cloudflare bot-fight, per-API-key throttle still open).
- §9.6 rollback playbook + §9.12 incident-response runbook +
  postmortem template are no longer just references — they exist.

Still pre-pilot blocking and user-only:
- 9.4 backend hosting provisioning (DO droplet + Supabase + env paste).
- 9.7 AES-at-rest Supabase toggle.
- 9.11 Sentry DSN drop-in.


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

1. **9.4 Backend hosting — actual provisioning** — deploy artifacts are in repo. What's left is user-only: DO droplet via Forge, Supabase + `nuvola_app` role (per `docs/ops/deploy.md` §2), paste env, Deploy Now, smoke `/api/health`.
2. **3.3 Reverb realtime** — only meaningful once the backend is reachable.
3. **9.11 remaining** — drop a real Sentry DSN on Forge + Vercel once a Sentry org exists. SDKs wire themselves up; verify first crash lands in the dashboard.
4. **9.7 remaining** — AES-at-rest Supabase toggle (user-only), pentest (deferred).
5. **§9.13 admin tail** — per-zone Vitality trend sparkline (needs a `zone_vitality_history` table — schema work, defer until Devyan's ingestion writes it); ad-hoc "remind now" admin endpoint (current path is the daily cron only).
6. **§9.8 tail** — per-API-key rate limit (configurable in the mint wizard), Cloudflare Bot-Fight mode in front of the backend (depends on 9.4).
7. **§9.9 caching tail** — bump TanStack Query `staleTime` to 5 min for `/zones` now that the backend backs it with a 300-s max-age. Document partner ETag usage.
8. **§9.12 health tail** — `/api/health/ingestion` (depends on the ingestion service existing — see Vercel-pinned bullet in §9.4).
9. **§9.1 deferred** — `Idempotency-Key` header on POSTs; only matters once partner-key writes exist, so still deferred.

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
- [x] **API-key path for programmatic partners** — `AdminApiKeyController` (mint/list/revoke) backed by Sanctum personal access tokens with a fixed `ABILITIES` allowlist (`api:read`, `api:write`). Admin-only, gated by `role:admin` + `admin.two_factor`. Plaintext token returned exactly once at mint; audit log entries on create/revoke.
- [x] **Email-based 2FA (replaced earlier TOTP)** — `email_two_factor_enabled_at` column on users (TOTP secret/recovery columns dropped); `TwoFactorController` emailStart/emailConfirm/emailDisable/verify; sign-in mails a fresh 6-digit code keyed to a challenge_token; `RequireAdminTwoFactor` middleware (`admin.two_factor`) forces admins to enrol before any `/admin/*` route is reachable; per-user rate limit of 1 send per minute on resend; `TwoFactorCodeMail` Mailable. Frontend `SignInPage` switches to a code-entry screen on `requires_two_factor: true`; admin dashboard's `TwoFactorSetup` walks any user through enrol.
- [ ] OAuth (Google/Microsoft) SSO (Phase 2).
- [ ] Per-zone data ACLs for sensitive layers (deferred — depends on partner data agreements).

### 9.4 Hosting and deployment
- [x] Frontend: Vercel (already live). Production = `main`, previews = every PR.
- [x] Backend stack picked: **Laravel Forge + DigitalOcean** + **Supabase Postgres+PostGIS**. Deploy artifacts staged: `nuvola-atlas-backend/deploy.sh`, `.env.production.example`, `docker/nginx/forge.conf`, `docker/supervisor/{nuvola-queue,nuvola-reverb}.conf`. Walkthrough at `docs/ops/deploy.md`.
- [ ] **Provision step (user-only)**: create DO droplet via Forge, provision Supabase project + enable PostGIS, paste env, run Deploy Now, smoke `/api/health`. See `docs/ops/deploy.md` §1–10.
- [ ] FastAPI ingestion service: **Vercel Functions** (Python 3.13/3.14 via Fluid Compute). Same Vercel account as the frontend, deployed from `nuvola-atlas-ingestion/` once that workspace is split out. Separate project from the Laravel API so an ingestion outage doesn't take the API down. (Earlier Railway/Fly.io options dropped on 2026-06-08; orphaned `Dockerfile`/`railway.toml`/`docker-compose.prod.yml` removed in the same commit.)
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
- [x] Rollback playbook at `docs/ops/rollback.md` (commit 42959c2). Decision tree, RTO targets, Vercel + Forge code-only + Forge-with-migrations + full Supabase restore paths, mandatory after-rollback checklist.

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
- [x] Per-IP throttle on `/sign-in`, `/sign-up`, `/forgot-password`: 10 attempts / 10 minutes / IP (Laravel `RateLimiter::for`). Shipped in 3e0164e — `auth` named limiter switched from `perMinute(5)` to `perMinutes(10, 10)`. Covers the whole throttle:auth group (also `/reset-password`, `/auth/2fa/verify`). 429 renders as RFC 7807 Problem JSON automatically. `AuthRateLimitTest` covers the cap, per-IP scoping, and forgot-password coverage.
- [ ] Per-user-token throttle on read APIs: 600 req/min, burst 100.
- [ ] Per-API-key throttle on partner programmatic access: configurable per partner via the admin panel; default 60 req/min.
- [ ] Cloudflare's free Bot-Fight Mode in front of the backend; auto-blocks the noisy stuff before it hits Laravel.
- [ ] Webhook write paths (when we add them) must be HMAC-signed AND rate-limited.
- [ ] Frontend: TanStack Query already deduplicates in-flight requests and respects `staleTime: 60_000`. No further client-side limiting needed pre-pilot.

### 9.9 Caching and CDN
- [ ] Vercel CDN handles the static frontend automatically. Confirm `Cache-Control: public, max-age=31536000, immutable` on hashed assets.
- [x] Backend HTTP caching: `ETag` + `Cache-Control: private, max-age=300` on `/api/zones` (rarely changes), `/api/projects` (slow-moving). Skip caching on `/api/alerts` and `/api/activity` (real-time). Shipped in 9142085 — new `App\Http\Middleware\HttpCache` (alias `http.cache`); applied to `/zones`, `/zones/{id}`, `/zones/{id}/layers`, `/projects`, `/projects/{id}`. Returns 304 on `If-None-Match` match (incl. wildcard). `HttpCacheTest` (7 cases).
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
- [x] **Sentry** SDKs wired on frontend + backend. `sentry/sentry-laravel` (^4.25); reportable() callback in `bootstrap/app.php` gated on `app()->bound('sentry')` — no-op without DSN. `@sentry/react` initialised from `src/lib/sentry.ts`; init only runs when `VITE_SENTRY_DSN` is set. Privacy-first defaults (no replay, no PII).
- [x] **Source-map upload**: `@sentry/vite-plugin` registered in `vite.config.ts` only when all three of `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` are set. Uses `sourcemap: 'hidden'` so maps upload without shipping in bundle URLs.
- [x] `ErrorBoundary.componentDidCatch` → `captureBoundaryError()` with the React componentStack as context.
- [x] **Structured JSON logs**: new `json` channel in `config/logging.php` (Monolog `JsonFormatter` → `php://stderr`); `.env.production.example` switches `LOG_STACK=json,daily` so BetterStack / papertrail can parse fields.
- [ ] FastAPI: `structlog` + Sentry's ASGI integration (deferred — service not split out yet).
- [ ] Centralized log aggregation: **BetterStack** (Logtail) free tier for the pilot. One dashboard for the three services.
- [ ] Provision the actual Sentry project + drop the DSNs into Forge + Vercel envs (user-only step, follow-on to 9.4).
- [ ] Frontend network telemetry: ship a tiny `/api/client-telemetry` endpoint that records timing + 4xx/5xx rates from real partner sessions (opt-in for partners).
- [ ] Alert thresholds (Sentry + BetterStack):
  - Any `error.level=fatal` → immediate Slack ping.
  - 5xx error rate > 1 % sustained 5 min → ping.
  - Ingestion job failure → ping.
  - Mapbox tile load failure rate > 5 % → ping (signals quota or outage).
- [ ] Lightweight in-app "Report a problem" widget (mailto for the pilot, real ticketing later).

### 9.13 Admin dashboard (new — first cut shipped)
- [x] `/admin` route (role-gated to admin via `RequireAdmin`; sidebar shows the Admin link only for admins).
- [x] Backend endpoints: `/api/v1/admin/metrics` (30s-cached counters), `/admin/audit` (cursor-paginated audit feed with action filter) + `/admin/audit/export` (CSV stream, 10k row cap), `/admin/users` (paginated, name/email search) + `PATCH /admin/users/{id}` (role change, self-lockout guard, audit-logged), `/admin/api-keys` (list / mint / revoke).
- [x] Frontend pages: KPI cards (users / partners / reports / unread alerts / audit events 24 h / active API keys / admins on 2FA / snapshot time), audit log table with filter + CSV export, users table with role badge + 2FA dot + inline role-change menu (self-row locked), API-keys table with revoke confirm and mint wizard.
- [x] **Mint-key wizard** — `MintApiKeyModal` with user picker (partner/editor pool), name, abilities multi-select (api:read / api:write), expiry presets (30 / 90 / 365 / never). Token shown once with copy-to-clipboard + "cannot be shown again" warning. Backend audit row on mint.
- [x] **User management writes** — inline role-change menu in `UsersTable` posts to `PATCH /admin/users/{id}`. Backend blocks self-role-change (acting admin's row is rendered as a static badge with `title="You cannot change your own role"`).
- [x] **CSV export for audit feed** — Symfony StreamedResponse, chunks 500 rows at a time, `Content-Disposition: attachment`. Frontend fetches with bearer header (anchor click can't send auth), creates a blob URL, triggers download.
- [x] Mock fixtures so the dashboard renders in preview/local without a backend.
- [x] 30-day audit-event sparkline shipped in 68187df. Overview row's "Audit events (24h)" card now embeds a 30-day spark + 30-day total. New `GET /api/v1/admin/metrics/audit-volume` backs it; pure-SVG `<Sparkline>` primitive (no chart lib); mock fixture so preview/local renders without a backend. **County-wide Vitality trend** spark (12-month, reusing `/history`) also added as a new card. **Per-zone** Vitality trend sparkline is still deferred — needs a `zone_vitality_history` table that doesn't exist yet (the current `vitality_history` table is global `month` + `overall_avg`).
- [x] Force-2FA enrolment reminder email, lock account. Shipped in 13051c9 — daily `nuvola:remind-admin-2fa` command (scheduled `dailyAt('09:00')`): day-0 reminder mail + `user.two_factor_reminder_sent` audit; day-7 revokes all Sanctum tokens + sends locked-mail + `user.two_factor_locked` audit. `TwoFactorController::emailConfirm` self-heals both timestamps. UsersTable now has four states (On / Locked / Reminded / Off). `RemindAdminsWithoutTwoFactorTest` (8 cases).

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
- [x] Incident response runbook (`docs/ops/incident-response.md`): who pages who, what the first 15 minutes look like, when to update the status page (commit 42959c2). SEV-1/2/3 definitions, IC/Comms/Tech/Scribe role collapse for the 5-person team, comms templates, symptom→first-action lookup table.
- [ ] Light on-call rotation among the five of us (we're not a 24/7 operation, but during partner working hours someone is reachable).
- [x] Postmortem template (`docs/ops/postmortem-template.md`) for any incident lasting > 30 min. Blameless. Shipped in 42959c2 — impact + timeline + root cause vs contributing factors + what-went-well/badly/lucky + action items with hard rules (owner + date, no "investigate", no "improve communication") + optional data-loss + verification + sign-off.

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

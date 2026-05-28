# NUVOLA ATLAS — Execution Plan

_Owner: Austine Igunza (frontend). Backend / scoring owners: Khillon & Devyan._
_Last updated: 2026-05-28._

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

### 2.2 Light-mode polish (we shipped the toggle but it isn't beautiful yet)
- [ ] Mapbox basemap currently doesn't follow the app theme. When in light mode, the Atlas map should default to `light-v11`; when in dark mode, default to a dark style like `dark-v11`. Wire `useThemeStore.theme` → default `mapStyle` and only override if the user explicitly picked Satellite / Terrain.
- [ ] Audit any remaining components that hard-code white-on-dark colors (look for inline `text-white` on glass surfaces, hex strings in component code). Fix anything that's unreadable in light mode.
- [ ] Map markers: the white outer ring looks great on dark mode but blends into a light basemap. Add a thin dark stroke fallback when light mode is active.

### 2.3 Remaining "click → popup" pass
- [ ] Alerts: clicking an `AlertCard` should open an `AlertDetailModal` (centered on mobile, side panel on desktop, same pattern as Infra).
- [ ] Reports: `ReportDetailModal` already exists; verify it's a centered modal on mobile (currently looks like a side panel — make it match the Infra pattern).
- [ ] Search modal: when a non-zone result is picked, open the relevant project detail as a popup overlay on the current page instead of navigating away.

### 2.4 Map polish
- [ ] "Reset view" button on the map (top-right under the Mapbox nav control) that flies back to the Nairobi centroid and clears `?zone=`.
- [ ] Subtle pulse on whichever layer toggle is currently on, so the user always knows which layers are active.
- [ ] Keyboard a11y: Enter on a focused zone marker opens the scorecard; Esc closes whichever popup is open.

### 2.5 Bundle & build hygiene
- [ ] Lazy-load `mapbox-gl` only inside `AtlasMap.tsx`. Today it's a 1.8 MB chunk that every signed-in page pays for; the sign-in / vitality / reports / alerts pages should not touch mapbox at all.
- [ ] Resolve the rollup warning: `stores/chrome.ts` is both statically and dynamically imported (from `stores/atlas.ts`). Use a synchronous import in `atlas.ts` since `ui.ts` already imports `chrome.ts` statically.

---

## 3. OUTSTANDING — backend integration (Khillon owns, I wire it up)

The single biggest pre-pilot milestone. Today the frontend reads from
`src/api/fixtures.ts`. It needs to read from Khillon's Laravel API instead with
**no UI changes** required (because the data contract in `src/types/index.ts`
is the source of truth on both sides).

### 3.1 Freeze the API contract with Khillon
- [ ] Agree the response shapes for: `GET /api/zones`, `GET /api/zones/{id}`, `GET /api/zones/{id}/layers` (returns `{ roads, energy, density }` each a `FeatureCollection`), `GET /api/zones/{id}/activity`, `GET /api/alerts`, `PATCH /api/alerts/{id}`, `GET /api/reports`, `POST /api/reports`, `GET /api/reports/{id}`, `GET /api/projects`.
- [ ] Confirm Sanctum bearer auth + CORS + 401 → `/sign-in` redirect on a deployed Laravel instance (not just `php artisan serve`).

### 3.2 Flip the data flag
- [ ] Add a `VITE_USE_REMOTE_API=true` env in `src/api/index.ts` that picks `remote` over `mock`. Default stays `mock` so local dev works without the backend.
- [ ] On Vercel: set the flag for `production` only. Previews stay on mock so partners can review UI without Khillon's backend being up.

### 3.3 Realtime
- [ ] Replace the stubbed `useLiveData` with a real Laravel Echo subscription to the `zones` and `alerts` Reverb channels. Same hook shape, just a different transport.

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
- [ ] Write the public API spec as OpenAPI 3.1 (`docs/api/openapi.yaml`). Single source of truth for the frontend, Khillon's controllers, and any future partner integration. Generate Postman / Insomnia collections from it.
- [ ] Version the API under `/api/v1/`. Reserve `/api/v2/` for breaking changes. Never delete a v1 endpoint without a 90-day deprecation header.
- [ ] Standardize the error response shape (RFC 7807 `application/problem+json`: `type`, `title`, `status`, `detail`, `instance`). Frontend already expects `{ message, errors }`; align both sides on RFC 7807 before partners depend on it.
- [ ] Pagination: cursor-based for `/api/alerts` and `/api/activity` (these grow without bound), page-based for `/api/zones`, `/api/projects`, `/api/reports` (small, bounded sets).
- [ ] Validate every write with Laravel `FormRequest` classes; never trust client-supplied IDs.
- [ ] Resource layer (Laravel API Resources) so internal Eloquent models can change without breaking the wire shape.
- [ ] Idempotency keys (`Idempotency-Key` header) on all `POST`s once partner programmatic access is enabled.
- [ ] Background jobs (Laravel Queue + Horizon) for: report generation, scheduled ingestion, bulk PDF export, broadcast fan-out.
- [ ] Document the Laravel ↔ FastAPI contract separately — these are internal endpoints, never exposed publicly. Auth via a shared signed secret in the request header, rotated quarterly.
- [ ] Reverb broadcast payloads documented in the OpenAPI spec under an `x-async` extension (or AsyncAPI side-doc) so the frontend doesn't have to grep the Laravel source to know what shape arrives.

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
- [ ] Laravel Sanctum for SPA bearer tokens (already chosen, already wired). Confirm token TTL matches frontend assumption of 8h.
- [ ] Email verification on sign-up — required before any non-read action.
- [ ] Password reset flow with rate-limited token email.
- [ ] Roles: `viewer` (public read), `partner` (read + zone-scoped write), `editor` (internal team write), `admin` (everything + user management). Use Laravel's `Gate` + a `spatie/laravel-permission`-style package.
- [ ] Separate **API key** auth path for programmatic partners (independent of user bearer tokens, longer TTL, revokable in admin UI).
- [ ] 2FA (TOTP) required for `admin` accounts before launch. Use Laravel Fortify's TwoFactorAuthenticatable.
- [ ] OAuth (Google / Microsoft) for partner orgs that require SSO — Phase 2, not blocking the pilot.
- [ ] Per-zone data access control for sensitive layers (e.g., raw NPS crime data only for partners that signed a data-use letter). Enforced at the controller + DB-policy level, not just in the UI.

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
- [ ] GitHub as canonical (already). Enforce branch protection on `main`: at least one approving review, status checks must pass, no force push.
- [ ] Conventional Commits enforced via a commit-msg hook + a GitHub Action that checks PR titles.
- [ ] Pre-commit hooks (Husky or lefthook): `prettier --write`, `tsc --noEmit`, `vitest --run --changed`, `php-cs-fixer`, `phpstan` (where relevant).
- [ ] GitHub Actions pipelines:
  - **Frontend** (this directory): `typecheck` + `vitest run` + `build` on every PR; Vercel produces a preview deployment automatically.
  - **Backend** (`nuvola-atlas-backend/`): `composer install --no-dev --optimize-autoloader`, `php artisan test`, `php artisan migrate --pretend`, `php artisan config:cache` smoke check.
  - **Ingestion** (`nuvola-atlas-ingestion/` when split out): `ruff`, `mypy`, `pytest`.
- [ ] Dependabot enabled for both `composer.json` and `package.json`. Weekly auto-PRs.
- [ ] SemVer tags on backend releases (`v0.1.0` etc) so we can correlate a deployed bug with a code state.
- [ ] **Rollback playbook**: every deploy must be reversible in under 5 minutes. Vercel rollback is one click; Forge keeps the previous release directory and can `php artisan deploy:rollback`. Document the exact button to press in `docs/ops/rollback.md`.

### 9.7 Security and RLS
- [ ] HSTS header (`max-age=31536000; includeSubDomains; preload`) on every response from both frontend and backend.
- [ ] Content Security Policy hardened: only `'self'` + `*.mapbox.com` + the backend host. No inline scripts. No `unsafe-eval`.
- [ ] AES-256 at rest for the database (managed Postgres providers handle this transparently — verify the toggle is on). TLS 1.3 in transit.
- [ ] Secret rotation policy: every 90 days for service-to-service shared secrets; immediately on any team-member departure.
- [ ] Dependency scanning: GitHub Dependabot + `npm audit --omit=dev` in CI. Block CI on `high` or `critical` advisories.
- [ ] SQL: **only** Eloquent / parameterized PDO. Forbid raw `DB::raw()` in code review unless wrapped in a justified comment.
- [ ] XSS: React escapes by default + CSP. The only place we render `dangerouslySetInnerHTML` today is the Mapbox popup HTML strings in `useMapPopups.ts` — keep that block tightly scoped and never interpolate user-supplied content into it.
- [ ] CSRF: Sanctum handles it for the SPA. API-key clients are stateless and don't need CSRF.
- [ ] **PostgreSQL Row-Level Security (RLS)** on partner-scoped tables (e.g., `partner_dataset_overlays`). Each partner can only read / write rows where `partner_id = current_setting('app.current_partner_id')`. Laravel sets the session variable per-request from the authenticated token.
- [ ] Audit log on every write: `audit_log(actor_id, action, resource_type, resource_id, before, after, ip, ua, created_at)`. Append-only.
- [ ] Pentest before public launch — engage Strathmore Information Security Club or pay for a small external assessment (budget line in Section 7 of the proposal).
- [ ] Responsible-disclosure email (`security@<entity-domain>`) + a short SECURITY.md at the repo root.

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
- [ ] Health checks: `GET /api/health` (DB ping + Redis ping + cache write) and `GET /api/health/ingestion` (latest successful ingestion < 6h ago). Hooked into status page and CI smoke tests.
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

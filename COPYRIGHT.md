# NUVOLA ATLAS / NAVUUNA — Copyright & Proprietary Elements

**Working document for the formal copyright filing.**
_Owner: Austine Igunza · Legal drafting: Ken N'ganga · Last updated: 2026-08-05_

> Purpose. This file catalogues every original, non-public element of the Navuuna Atlas (also known as Nuvola Atlas) platform so Ken can turn it into a formal copyright registration under the Kenya Copyright Act (Cap. 130, as amended by Act No. 20 of 2019) with the Kenya Copyright Board (KECOBO), and — where relevant — international filings under the Berne Convention. Anything listed here is authored by the Navuuna team; anything relying on third-party components is called out separately at the end so the filing can cleanly draw the line between what we own and what we license.

---

## 0. Author, ownership, and dates

- **Authors (natural persons, joint authorship):**
  - Joy Nthei — Operations Lead and Human Resources
  - Ken N'ganga — Finance and Policy
  - Khillon — Lead Programmer
  - Austine Igunza — Programmer (frontend + backend Phase E/F migrations and investor routes during the Jul-Aug 2026 backend push)
  - Devyan Jethwa — Chief Technology, Infrastructure and Product Strategy Officer (CTIPSO)
- **Institution of origin:** Strathmore University, Nairobi, Kenya. Project is a student-led independent innovation. IP is **not** assigned to Strathmore; the founding team retains full ownership per the original grant proposal.
- **Assignee (planned):** a Kenyan-registered entity (form to be finalised in Q1 of the grant year — leading option: private limited company). Until incorporation, IP is jointly held by the five named authors under a written intra-team assignment memo (drafted at project start per proposal §4.5 / §6.2).
- **First fixation date (earliest recorded commit on `main`):** May 2026.
- **Publication status at time of first filing:** unpublished computer program made available to a closed pilot audience under access-controlled URLs. Pilot deployment on Vercel (frontend) and Laravel Forge + DigitalOcean (backend). This distinction matters for the KECOBO filing — the work is fixed and eligible even though it is not publicly distributed.
- **Territory of first publication:** Republic of Kenya.

---

## 1. What is being claimed (headline)

The Navuuna Atlas platform is claimed as an **original literary work (computer program)** with associated **original artistic works** (the platform's visual identity, cartographic style, dashboard designs) and an **original literary work of scholarship** (the UE Vitality Index methodology). Each category below is a distinct claim:

| # | Category | Kenya Copyright Act §2 classification | Notes |
|---|---|---|---|
| A | Computer program (source + object code) | Literary work | The Laravel/PHP backend, the React/TypeScript frontend, the FastAPI Python ingestion service, and their supporting infrastructure code |
| B | Databases and structured data compilations | Literary work (compilation) | Schema definitions, seed fixtures, indicator taxonomy, methodology weights table |
| C | Methodology paper and scoring model | Literary work (scholarly) | The UE Vitality Index — 4 pillars, 13 indicators, weighting rules, null-exclusion policy |
| D | User-interface graphical works | Artistic work | Cartographic style, colour system, icon set, dashboard layouts, marker system, sparkline primitive |
| E | Written project documentation | Literary work | This CLAUDE.md scope, tasks/todo.md, docs/ops/*, docs/api/openapi.yaml, PHASES tracker, backend build plan |
| F | Brand assets | Artistic work + trade mark candidate | "Nuvola Atlas", "Navuuna", "Ground & Harvest", "UE Vitality Index", "Vitality Score", "Vitality Scorecard", the sidebar mark, the tagline |
| G | Audiovisual (planned) | Audiovisual work | The 90-second `/atlas` screen recording referenced in tasks/todo.md §5.2 (will be attached to filing on completion) |

Trade mark elements — the wordmarks "Navuuna" and "Nuvola Atlas", plus the logo — are additionally proposed for registration under the Kenya Trade Marks Act with KIPI (Kenya Industrial Property Institute) in Class 9 (downloadable software), Class 35 (data compilation services), Class 42 (SaaS / computer programming services), and Class 45 (legal/policy services related to the methodology). That KIPI filing is separate from this copyright work but is cross-referenced here for completeness.

---

## 2. Category A — Computer program (source and object code)

Original literary work under §22(1)(b) of the Copyright Act. Filing deposits the source tree, exclusive of third-party dependencies enumerated in §11 below.

### 2.1 Backend — Laravel 11 application (`nuvola-atlas-backend/`)

Proprietary elements authored by the team:

- **HTTP layer (`app/Http/Controllers/*`):** AdminApiKeyController, AdminAuditController, AdminMetricsController, AdminUserController, AlertController, AuthController, ChatController, HealthController, HistoryController, ProjectController, ReportController, TwoFactorController, VerifyEmailController, VitalityController, ZoneController, ZoneExportController, ZoneForecastController, ZoneHistoryController, plus the incoming (Phase E/F) admin firm/methodology/feeds/impersonation/content controllers and investor profile/watchlist/portfolio/opportunities/brief controllers.
- **FormRequests (`app/Http/Requests/*`):** SignInRequest, RegisterRequest, StoreReportRequest, and the Phase E/F write requests (StoreFirmRequest, StoreWatchlistEntryRequest, PatchMethodologyRequest, etc.). The validation rules themselves are original expression.
- **API Resources (`app/Http/Resources/*`):** ZoneResource, ProjectResource, AlertResource, ReportResource, ZoneLayerResource, HistoryResource, ActivityResource, plus incoming InvestorProfileResource, WatchlistResource, PortfolioResource, OpportunityResource, MethodologyResource, FeedStatusResource. Each is an authored translation between the DB shape and the wire shape.
- **Services (`app/Services/*`):**
  - `ScoreCalculator` — the composite scoring engine. Encodes the null-exclusion rule (§4.1 below) and the pillar → indicator taxonomy. Explicitly authored and non-obvious; the July 2026 rewrite that replaced a zero-biased average with a null-exclusion average is the substantive intellectual contribution and is the strongest software claim in this filing.
  - `Chat/AiGatewayClient`, `Chat/ChatOrchestrator`, `Chat/IntentRouter`, `Chat/SchemaCatalog`, `Chat/SqlExecutor`, `Chat/SqlGenerator`, `Chat/SqlGuard`, `Chat/StreamEvent`, `Chat/InsightGenerator` — the schema-aware text-to-SQL assistant. `SqlGuard`'s allow-list model and `SchemaCatalog`'s methodology-aware schema disclosure are original.
  - `Export/ZoneReportExporter` — PDF/DOCX/TXT report renderer, including the LP-style firm-portfolio format added for `/investor/brief`.
  - `Forecast/ZoneScoreForecaster` — trend forecast over `zone_score_snapshots`.
  - Phase E services (Khillon, Week 2–4): `Firms/FirmService`, `Watchlist/WatchlistService`, `Methodology/MethodologyPublisher`, `Methodology/MethodologyPreview`, `Feeds/FeedStatusService`, `Impersonation/ImpersonationService`, `Content/ContentBlockService`.
- **Middleware (`app/Http/Middleware/*`):** `EnsureRole`, `HandleInertiaRequests`, `HttpCache`, `RequireAdminTwoFactor`, `SecurityHeaders`, `SetPartnerContext`, plus the Phase E `AuditWrite` and `FirmScope` middleware. `HttpCache`'s ETag + 300s private-cache pattern and `SetPartnerContext`'s Postgres session-var handoff into RLS are notable original patterns.
- **Jobs (`app/Jobs/*`):** `RecalculateZoneScore` and the Week 1 `RecalculateAllZones` bulk chunked wrapper.
- **Events (`app/Events/*`):** `ZoneScoreUpdated` broadcast contract on `zones.{id}` channels via Laravel Reverb, including the `missingIndicators` payload key.
- **Enums (`app/Enums/*`):** `Role` (viewer / partner / editor / admin with `rank()` / `isAtLeast()` helpers), `FirmTier` (basic / deal / sovereign), `FirmUserRole` (viewer / analyst / admin), `MethodologyBand` semver enum.
- **Auth & 2FA (`app/Http/Controllers/TwoFactorController`, `app/Mail/TwoFactorCodeMail`):** email-based 2FA with challenge_token + 6-digit code, per-user 1-per-minute resend cap, admin force-enrolment escalation, day-0 reminder mail + day-7 lock via `nuvola:remind-admin-2fa` scheduled command.
- **Console commands (`app/Console/Commands/*`):** `RecalculateScores`, `RemindAdminsWithoutTwoFactor`, and the Phase E/F Artisan surface.
- **Observers (`app/Observers/*`):** `AuditableObserver` writing to the append-only `audit_logs` table, `ZoneLayerObserver` dispatching `RecalculateZoneScore` on layer change.
- **Configuration (`config/*`):** `methodology.php` (the pillar-to-indicator map, weights vector, band definitions), `sanctum.php` overrides (8-hour token TTL), `logging.php` `json` channel definition. The `methodology.php` file is a codified expression of the scholarly methodology in §4 below.
- **Bootstrapping (`bootstrap/app.php`):** the `problemResponse()` closure implementing RFC 7807 error envelopes; the `auth`, `api`, `chat` `RateLimiter::for` definitions with per-token peeking on Sanctum bearers.
- **Migrations (`database/migrations/*`):** every migration file listed in `austine.md` §3 is an authored schema definition. The full ordered schema is a compilation (see Category B).
- **Seeders and factories (`database/seeders/*`, `database/factories/*`):** ZoneSeeder, ZoneBoundarySeeder, ZoneLayerSeeder, ZoneScoreSnapshotSeeder, ActivitySeeder, AlertSeeder, HistorySeeder, ProjectSeeder, ReportSeeder, UserSeeder, plus the incoming FirmSeeder, FirmUserSeeder, FirmWatchlistSeeder, FeedStatusSeeder. These are original selections and orderings of realistic Nairobi test fixtures — the choice of Westlands as CBD-adjacent, Kibra and Mathare as informal-settlement priorities, and the particular indicator readings are authored.
- **Tests (`tests/Feature/*`, `tests/Unit/*`):** every feature and unit test file is authored. Cited here because the tests encode the operational semantics (RLS isolation, cross-firm leakage denial, rate-limit boundaries) that are themselves original expression.

### 2.2 Frontend — React + TypeScript SPA (`nuvola-atlas-frontend/`)

- **Application shell (`src/components/layout/*`):** `AppShell`, `Sidebar`, `TopBar`, `Settings` dropdown, `ProjectQuickView` overlay. The persistent-panel-on-desktop / centered-popup-on-mobile pattern is an original UX authored for the platform.
- **Atlas map (`src/components/atlas/*`):** `AtlasMap`, `LayerToggle`, `useMapInstance`, the `ResizeObserver` + `visibilitychange` + `orientationchange` + `resize` retry pattern that fixes the mobile-first-paint bug, the invisible-hit-target overlay pattern (`grid-touch`, `roads-touch`) for touch reliability, the Voronoi choropleth layer, the reset-view compass control, the pulse-glow active-layer indicator, the `?zone=` deeplink handler, and the light/dark theme-following basemap style swap.
- **Vitality Scorecard (`src/components/scorecard/*`):** `ZoneScorecard`, `VitalityRing` (count-up ring animation with settle easing), `PillarBar` (four instances with staggered fill), the `--` empty-state rendering for null pillars, the Data Sources panel, the per-zone time-series trend chart wired to `/zones/{id}/history`.
- **Admin dashboard (`src/pages/admin/*`):** KPI cards, `AuditTable`, `AuditVolumeSparkline`, `UsersTable` (with self-row lock), `ApiKeysTable`, `MintApiKeyModal` (user picker + abilities multi-select + expiry presets + one-time token reveal), `TwoFactorSetup`, System Health tab, Deal Pipeline board, Content CMS, per-zone notes, the `Sparkline` pure-SVG primitive (no chart lib).
- **Investor suite (`src/pages/investor/*`):** portfolio composite rollup, watchlist chip, opportunities ranking, LP-style brief download flow, announcements panel.
- **Chat (`src/components/chat/*`):** streaming assistant UI, intent chips, follow-up scaffolding, locale-aware answer rendering. The client half of the RAG assistant.
- **API client (`src/api/*`):** `client.ts` with `handleResponse()` RFC 7807 parsing, `pickErrorMessage()`, mock-vs-remote toggle via `VITE_USE_REMOTE_API`, `twoFactor.ts`, `adminClient.ts`, `investorClient.ts` (with mock-that-matches-Resource-envelope contract discipline), `chat.ts` streaming reader, `fixtures.ts` seed data mirroring the backend seeders.
- **State + realtime (`src/hooks/*`, `src/lib/*`):** `useLiveData` mounted in AppShell subscribing to a typed `LiveEvent` stream (`zones` / `alerts` / `activity` channels) with TanStack Query invalidation; `startMockPulse` in `src/lib/realtime.ts` cycling every 45 s with seeded zone IDs; the one-line Reverb-swap contract; `useChromeStore`; `chrome.ts` layout state; `useScoreStore`.
- **Types (`src/types/index.ts`):** the frontend authoritative `Zone`, `Pillars`, `LayerBundle`, `Alert`, `Project`, `Report`, `Activity`, `FirmTier`, `WatchlistEntry`, `PortfolioSnapshot`, `MethodologyDoc` interfaces. This file is the FE-side single-source-of-truth data contract and mirrors the backend Resources; both sides are original.
- **Error boundary + telemetry (`src/components/ErrorBoundary.tsx`, `src/lib/sentry.ts`):** `captureBoundaryError()` with React componentStack context; DSN-gated init.
- **Vite + Tailwind configuration:** the design-token extraction, the Framer Motion spring preset reproducing the prototype's settle-easing curve (`cubic-bezier(0.22, 1, 0.36, 1)`), the mapbox-gl lazy-loaded chunk boundary. Authored trade-offs, not stock configuration.
- **i18n (`src/i18n/*`):** English + Kiswahili + French strings across Scorecard, Overview, Sidebar, TopBar, AtlasMap, Alerts, Infrastructure, Vitality popup, Compare, Assistant, Watchlist, Announcements. Every string was authored for this platform; the translations themselves are original translations (secondary works) under §22(1)(a) as literary works.

### 2.3 Ingestion service — FastAPI Python (`nuvola-atlas-ingestion/`)

Devyan's service (deployed on Vercel Fluid Compute):

- **Route handlers** for `/ingest/knbs/*`, `/ingest/openaq`, `/ingest/kura`, `/ingest/nema-esia`, `/ingest/kplc`, `/ingest/ketraco`.
- **Pydantic schemas** for every Daystar indicator drop.
- **Cleaner pipeline:** WGS84 coordinate normalisation, ISO-8601 timestamp coercion, statistical anomaly detector (rolling z-score with per-indicator thresholds), null-preservation policy.
- **`X-Internal-Secret` contract** for the FastAPI → Laravel `/ingest` handoff.
- **APScheduler cron definitions** for the quarterly KNBS pull, hourly OpenAQ pull, weekly NEMA/KURA scrapers.

### 2.4 Infrastructure-as-code and ops

- **Docker artifacts:** `Dockerfile`, `docker-compose.yml`, `docker/nginx/forge.conf`, `docker/supervisor/nuvola-queue.conf`, `docker/supervisor/nuvola-reverb.conf`.
- **Deploy scripts:** `nuvola-atlas-backend/deploy.sh`, `fly.toml`, `.env.production.example`.
- **CI workflows:** `.github/workflows/*` for frontend, backend, ingestion CI + Dependabot config.
- **Runbooks (`docs/ops/*`):** `deploy.md`, `rollback.md`, `incident-response.md`, `postmortem-template.md`, `secret-rotation.md`, `restore-drill.md` (planned). Each is an authored operational literary work.

---

## 3. Category B — Databases and structured data compilations

Original compilations under §22(1)(b) — the selection and arrangement is authored even where individual data points are factual.

### 3.1 Schema (compilation)

The full PostgreSQL + PostGIS schema shipped in `nuvola-atlas-backend/database/migrations/*` is a compiled work. Core tables:

- **Spatial core:** `zones` (with `centroid` GEOGRAPHY, `boundary` GEOMETRY, `score`, and 13 `indicator_*` columns), `zone_layers` (typed geo bundles), `zone_score_snapshots` (per-zone time series with 4 pre-computed pillar columns + composite score), `projects`, `alerts`, `activities`, `reports`.
- **Auth + audit:** `users` (with `role`, `partner_id`, `primary_firm_id`, email-2FA columns, deactivation timestamps), `personal_access_tokens` (with `rate_limit_per_minute`), `audit_logs` (append-only).
- **Partners + RLS:** `partners`, `partner_dataset_overlays` (RLS-forced with the `partner_isolation` policy).
- **Phase E firms + methodology:** `firms` (slug + tier enum), `firm_users` (pivot with `role_within_firm`), `firm_watchlists` (with priority + thesis), `methodology_versions` (semver + weights jsonb + bands jsonb + partial-unique-index-gated `is_current`), `data_feed_status` (per-indicator staleness ledger, computed on read), `impersonation_sessions`, `content_blocks` + `content_block_revisions`, extended `reports` (with `created_by`, `updated_by`, `published_at`, `firm_scope_id`).
- **Chat:** `chat_conversations`, `chat_messages`, `chat_readonly_role` (Postgres role for text-to-SQL execution).
- **Vitality history:** the county-wide `vitality_history` monthly rollup, the per-zone `zone_score_snapshots` per-write snapshot.

The **selection** of tables, the **naming conventions** (e.g. `indicator_healthcare_access` instead of `metric_pillar1_sub1`), the **partial-unique-index-on-`is_current`** pattern that guarantees exactly one live methodology version, the **RLS + FORCE + `NULLIF(current_setting(...))` cast** pattern for defence-in-depth, the **computed-on-read staleness** design for feeds, and the **append-only audit-log observer** pattern are all authored decisions.

### 3.2 Seed fixtures (compilation)

The **choice of sample zones** for the pilot — Westlands (CBD growth), Starehe (established), Dagoretti (mixed), Kasarani (emerging), Embakasi (industrial adjacency), plus the informal-settlement priorities Kibra and Mathare when the pilot expands to 17 sub-counties — is an authored curation. The **plausible-but-illustrative indicator readings** that make the FE demoable without live Daystar data are original, and the **staggered staleness** in `FeedStatusSeeder` (some fresh, some 24-72h, some >7 days) is a curated illustration of the feed-status matrix.

The FE `src/api/fixtures.ts` file is a parallel compilation on the client side and is separately protected.

### 3.3 Taxonomy and vocabularies

- The **13-indicator taxonomy** grouped under 4 pillars — `healthcare_access`, `education_access`, `digital_connectivity` (Social); `crime_rates`, `emergency_response_access`, `disaster_exposure` (Safety); `population_density`, `congestion`, `housing_pressure` (Density); `road_quality`, `energy_reliability`, `food_risk`, `waste_management` (Infrastructure).
- The **layer taxonomy** — Road Progress, Smart Grid Status, Density, plus the Water & Sanitation (SDG-6) overlay layered in on 2026-07-04.
- The **role hierarchy** — viewer / partner / editor / admin with numeric `rank()`.
- The **firm-tier taxonomy** — basic / deal / sovereign with the associated heuristics for opportunity ranking.
- The **feed-name enum** covering every Daystar indicator + external source key.

Each vocabulary is an original selection tuned to Kenyan sub-county planning and is codified in both `config/methodology.php` (backend) and `src/types/index.ts` (frontend).

---

## 4. Category C — The UE Vitality Index methodology

This is the **most important non-software claim** in the filing. The Vitality Index is an original piece of scholarly methodology fixed in expression in `config/methodology.php`, in `ScoreCalculator.php`, in the pillar-and-indicator UI copy, and in the forthcoming methodology paper.

### 4.1 Core methodology (in scope of this filing)

- **Four equally-weighted pillars (0.25 each):**
  1. Social Wellbeing and Human Capital
  2. Safety and Security
  3. Density and Scaling Dynamics
  4. Infrastructure and Environmental Safeguards
- **Thirteen indicators**, three or four per pillar, each normalised to a 0-100 scale — see §3.3 for the taxonomy.
- **Null-exclusion rule.** A missing indicator is never treated as zero. A pillar's score is the simple average of its non-null indicators; a fully-empty pillar returns `null` and renders `--`. The composite Vitality Score is the simple average of the pillars that have at least one non-null indicator. This rule is the substantive intellectual contribution and is what the July 2026 rewrite delivered. The reason for the rewrite — that the previous zero-biased algorithm collapsed sub-county scores for informal settlements because Daystar hadn't delivered their indicators yet — is documented in `ScoreCalculator.php` and is part of the authored explanation.
- **Missing-indicator ledger.** Every zone response ships an explicit `missingIndicators` array so the "8 of 13 indicators active" UI badge and the "Awaiting data" copy in the Scorecard are queryable.
- **Broadcast contract.** `ZoneScoreUpdated` on `zones.{id}` fires with composite score, four pillars, and the `missingIndicators` ledger; this is an authored real-time API surface.
- **Versioning.** The `methodology_versions` table (semver + weights + bands + one-`is_current` partial-unique index) is the mechanism by which the methodology evolves over time without breaking historical scoreboards. The versioning discipline is itself an authored contribution.
- **Conceptual framing.** The pillar structure draws its analytical grounding from Amartya Sen's *Development as Freedom* (1999), the Social Progress Index (Social Progress Imperative), the Internet Freedom Score (Freedom House), and the IFC Performance Standards (2012). Those source frameworks are third-party and cited under §11. The Kenyan sub-county application, the specific pillar composition, the choice of indicators, the weightings, and the null-exclusion algorithm are our original work.

### 4.2 Methodology paper (in preparation)

Working title: **"The UE Vitality Index: A Locality-Scale Readiness Score for Sub-County Industrial Planning in Kenya"**. Target venues: ICTD, Habitat International, Journal of Urban Affairs (per tasks/todo.md §6.1). Owner: Ken drafts, Devyan supports. Once submitted, the paper is a separate original literary work (scholarly) and is cross-referenced into this filing.

---

## 5. Category D — Graphical, cartographic and interaction-design works

Original artistic works under §22(1)(c).

### 5.1 Cartography

- **Basemap styling.** Explicit choices to run `mapbox://styles/mapbox/light-v11` in light theme and `dark-v11` in dark theme, with Satellite and Terrain as explicit overrides via the Layers popover. The theme-following basemap swap is an authored choice.
- **Marker system.** Zone marker pill with `--zone-marker-ring` CSS variable that swaps ring colour by theme; 22 px invisible hit-target overlays for touch reliability; pulse-glow layer for active-toggle indicators.
- **Choropleth.** Voronoi tessellation of the Nairobi zone centroids into a district-boundary choropleth (landed 2026-07-04 @ commit 982573a).
- **Reset-view control.** Compass icon top-right that flies to Nairobi centroid + clears `?zone=` deeplink.

### 5.2 Dashboard visual language

- **Design tokens.** The palette, type scale, spacing scale, radii, and shadows extracted from the internal prototype (`NuvolaAtlasPrototype.jsx`) and codified in `tailwind.config.ts`.
- **Motion.** Framer Motion spring preset reproducing the prototype's `cubic-bezier(0.22, 1, 0.36, 1)` settle curve; count-up animation on the `VitalityRing`; staggered fill across the four `PillarBar`s on zone change; smooth fade on Atlas layer toggle; reduced-motion respected via `prefers-reduced-motion` on every animation.
- **Sparkline primitive.** Pure-SVG `<Sparkline>` component (no third-party chart library) authored for the admin dashboard's 30-day audit-volume and 12-month vitality-trend cards.
- **Iconography.** Icon set is composed of stock lucide icons *except* the Navuuna wordmark, the sidebar logo, and any authored composite marks.
- **Empty-state grammar.** The `--` treatment for null pillars, the "Awaiting data" copy, the informal-vs-formal-zone visual differentiation. Authored decisions with editorial value.

### 5.3 Layout patterns

- **Persistent-panel-on-desktop / centered-popup-on-mobile.** Applied consistently to Zone Scorecard, Infrastructure detail, Alert detail, Report detail, Vitality Leaderboard drill-in. This layout pattern is an authored UX convention for the platform.
- **Right-edge floating mobile nav pill.** Landed commit 6d41f8f. Authored mobile-only nav treatment.

### 5.4 Preliminary Fisker-style prototype

`NuvolaAtlasPrototype.jsx` at repo root is an original React demo capturing the approved visual direction. It is protected as an authored source file even though it is not a production file.

---

## 6. Category E — Written documentation

Original literary works under §22(1)(a). The following documents are authored by the team and are treated as first-class copyright deposits.

- **This file (`COPYRIGHT.md`).**
- **`CLAUDE.md` (project-level).** The scope note, phase plan, data contract, and design north-star reference. Authored guidance to the build process.
- **`tasks/todo.md`.** The execution plan cross-referenced to the grant proposal.
- **`tasks/team/week-01/austine.md`, `khillon.md`, `devyan.md`.** The 4-week backend sprint plans.
- **`docs/api/openapi.yaml`.** The full OpenAPI 3.1 API contract — authored schema + authored English descriptions.
- **`docs/ops/*`.** `deploy.md`, `rollback.md`, `incident-response.md`, `postmortem-template.md`, `secret-rotation.md`, and forthcoming runbooks. Each is an authored operational literary work.
- **`docs/architecture.md`.** Devyan's authored architecture write-up.
- **`Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf`.** The backend build plan at repo root — 100 % team-authored.
- **`Navuuna Build Phases.txt`.** The authored phase tracker.
- **Grant proposal (`CLAUDE.md` §1-§8).** The Nuvola Atlas grant proposal to Strathmore is a separate authored literary work already claimed by the team.
- **`README.md`** files at repo root and per workspace.
- **`SECURITY.md`.** Responsible-disclosure policy.
- **Commit messages themselves are not claimed** — they are considered documentation of authorship rather than authored expression, but the Conventional-Commits discipline sets the record of authorship.

---

## 7. Category F — Brand assets

### 7.1 Wordmarks and taglines

- **"Nuvola Atlas"** (original coinage; treat as the platform's product name until the Navuuna rebrand fully lands).
- **"Navuuna"** (post-2026-07-04 rebrand — landed @ commit 6d7387a).
- **"Ground & Harvest"** (product suite framing under Navuuna).
- **"UE Vitality Index"** and **"Vitality Score"** and **"Vitality Scorecard"** (product feature names — also the scholarly-methodology name).
- **Sidebar tagline** — the current copy after commits 8fe1013 and 2987b3d ("A Spatial Intelligence Network for African Industrial Development" or the current in-repo string, whichever is live in the app at filing time).

Each is proposed for KIPI trade-mark registration in addition to being an authored expression under this copyright filing.

### 7.2 Visual identity

- Sidebar mark / wordmark logo as rendered by the Sidebar component.
- The Navuuna colour system (design tokens in `tailwind.config.ts`).
- The `data-theme` light/dark variable and its authored surface palette.

### 7.3 Third-party marks used under licence

- **Mapbox** wordmark and attribution — used under Mapbox's SDK Terms of Service. Not claimed by Navuuna.
- **OpenStreetMap** attribution — used under ODbL. Not claimed by Navuuna.
- **Strathmore University** name and mark — referenced with permission; not claimed by Navuuna.

---

## 8. Category G — Audiovisual (planned)

- The 90-second `/atlas` screen recording referenced in tasks/todo.md §5.2 (part of Outreach assets) will be attached to the filing on completion.
- On-device verification recordings referenced in tasks/todo.md §2.1 will be treated as separate authored audiovisual works when they exist. Owner: Austine.

---

## 9. What is NOT proprietary — third-party components carved out

The following are used under their respective licences and are **explicitly excluded** from the copyright claim. Listed so the filing draws a clean boundary.

### 9.1 Runtimes and languages

- PHP 8.3+ (PHP Group licence).
- Python 3.13/3.14 (PSF licence).
- Node.js 24 LTS (MIT-style).
- TypeScript (Apache 2.0).

### 9.2 Frameworks and libraries (backend)

- Laravel 11 (MIT).
- Laravel Sanctum, Laravel Reverb (MIT).
- Sentry Laravel SDK (MIT).
- Symfony components (MIT).
- Monolog (MIT).
- PHPUnit (BSD-3-Clause).
- Faker (MIT).

### 9.3 Frameworks and libraries (frontend)

- React 18 (MIT).
- Vite 5 (MIT).
- Tailwind CSS (MIT).
- TanStack Query (MIT).
- Framer Motion (MIT).
- Mapbox GL JS 3.9 (Mapbox proprietary — used under Mapbox SaaS TOS).
- Recharts (MIT).
- Zustand (MIT).
- lucide-react icons (ISC).
- i18next (MIT).
- Vitest (MIT).
- Sentry React SDK (MIT).

### 9.4 Frameworks and libraries (ingestion)

- FastAPI (MIT).
- Pydantic (MIT).
- httpx (BSD-3-Clause).
- pytest, ruff, mypy (MIT / BSD variants).
- APScheduler (MIT).
- structlog (Apache 2.0 / MIT dual).

### 9.5 Data and datasets under third-party licence

- **KNBS open-data portal** (Kenya National Bureau of Statistics) — used under the KNBS Open Data licence terms.
- **Social Progress Index Kenya country file** — used under the Social Progress Imperative's non-commercial data terms.
- **KURA and KeNHA project lists** — public Kenya Government data.
- **KPLC outage / substation status** — pending MOU; scraper access is used under fair-dealing pending signature.
- **NEMA ESIA portal** — public Kenya Government data.
- **World Justice Project Rule of Law Index** — used under WJP's public-data terms.
- **ACLED** (Armed Conflict Location & Event Data) — pending Strathmore academic-use registration.
- **OpenAQ** — CC-BY.
- **OpenStreetMap** — ODbL.
- **World Bank Doing Business archive** — CC-BY-4.0.
- **Mapbox tile services** — Mapbox SaaS TOS.

The **compilations** we build over these datasets (§3 above) are our authored work; the underlying facts are not claimed.

### 9.6 Cloud services under third-party terms

- **Vercel** (frontend + FastAPI ingestion hosting) — Vercel Terms of Service.
- **Laravel Forge + DigitalOcean** (Laravel API host) — Forge + DO ToS.
- **Supabase** (managed Postgres + PostGIS) — Supabase ToS.
- **Cloudflare** (DNS + WAF + R2) — Cloudflare ToS.
- **Sentry** (error tracking) — Sentry ToS.
- **BetterStack** (log aggregation, status page) — BetterStack ToS.
- **Vercel AI Gateway** (unified LLM + embedding gateway for the RAG assistant) — Vercel AI Gateway ToS.
- **Anthropic Claude / OpenAI GPT / Google Gemini** — the models themselves are not our work. The prompt design, the SchemaCatalog disclosure format, and the SqlGuard allow-list are our work.

---

## 10. Licensing posture

- **Default posture at filing:** all-rights-reserved on all listed proprietary elements above.
- **Preferred future posture (post-entity formation):** dual-track — proprietary licence for commercial partners (subscription / API access / due-diligence reports per tasks/todo.md §6.1 revenue plan), and a **methodology-open, code-restricted** stance so the UE Vitality Index methodology paper can be openly cited and replicated by other research groups (per proposal §6.2 "Methodological scalability") while the software stack remains licensed.
- **Contributor discipline until entity forms:** all commits are authored under identifiable natural-person names via Conventional Commits (no `Co-Authored-By: Claude` trailers per the team standing rule). Once the entity is formed, IP assignments and CLAs are signed by every contributor per the governance memo (proposal §4.5 / §6.2).

---

## 11. Third-party works cited or built on (not claimed)

Cited for completeness so the filing acknowledges known upstream contributions:

- Sen, A. (1999). *Development as Freedom.* Oxford University Press.
- Social Progress Imperative. *Social Progress Index.*
- Freedom House. *Freedom on the Net.*
- Internet Freedom Score (Freedom House).
- IFC Performance Standards on Environmental and Social Sustainability (2012).
- World Bank Environmental and Social Framework (2017).
- OECD *Extended Producer Responsibility* guidance (2016).
- Lindhqvist, T. (1992). *Extended Producer Responsibility as a strategy to promote cleaner products.* Lund University.
- Kenya Vision 2030 (2007).
- African Union Agenda 2063 (2015).
- UN Resolution A/RES/70/1 (Transforming Our World: 2030 Agenda).
- NIST FIPS 197 (Advanced Encryption Standard — AES).
- RFC 7807 (Problem Details for HTTP APIs).

Every reference above is treated as a source; nothing in it is claimed as our work.

---

## 12. Filing package checklist (for Ken)

When Ken drafts the KECOBO Form 1, this file supports the following exhibits:

- [ ] **Exhibit A — Source code deposit.** A tagged Git archive of the `main` branch at the filing snapshot, with third-party dependencies excluded (i.e. `.git/`, application source only, no `vendor/`, no `node_modules/`).
- [ ] **Exhibit B — Compilation deposit.** SQL schema dump of the seeded dev DB, plus the `src/api/fixtures.ts` file, plus the `config/methodology.php` file.
- [ ] **Exhibit C — Methodology paper.** The current internal draft of "The UE Vitality Index" (owner: Ken).
- [ ] **Exhibit D — Design deposit.** PDF export of the current frontend screenshots (Atlas, Scorecard, Admin dashboard, Investor suite, Chat), plus the design-token file (`tailwind.config.ts`), plus the sparkline SVG.
- [ ] **Exhibit E — Documentation deposit.** PDF exports of the OpenAPI spec, the ops runbooks, this file (`COPYRIGHT.md`), the grant proposal (`CLAUDE.md` §1-§8), and the `Navuuna Build Phases.txt` tracker.
- [ ] **Exhibit F — Brand deposit.** Rendered PNG/SVG of the wordmarks, logo, sidebar mark, tagline.
- [ ] **Exhibit G — Author declarations.** Signed statement from each of the five authors identifying the portions they contributed. Cross-referenced against the git blame audit for evidence.
- [ ] **Exhibit H — Assignment memo.** Intra-team assignment memo (proposal §4.5) — first draft in Q1, signed by all five before the entity is registered.
- [ ] **KIPI cross-file.** File separately for the Navuuna / Nuvola Atlas trade marks (Classes 9, 35, 42, 45).

---

## 13. Change log

- **2026-08-05 — v1.** First draft assembled by Austine covering all seven claim categories (A-G), the third-party carve-outs, the licensing posture, and the KECOBO filing checklist. Basis: full sweep of the codebase, the tasks/todo.md, the tasks/team/week-01/*.md sprint plans, the grant proposal in `CLAUDE.md`, and the memory-store record of the Navuuna rebrand and the July 2026 backend milestones.

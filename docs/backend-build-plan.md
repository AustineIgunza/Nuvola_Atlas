# Backend Build Plan — Execution

> **Companion to the Navuuna Backend Build Plan doc** (`Navuuna_Backend_Build_Plan.pdf` in Downloads / SharePoint).
> The doc defines the architecture, tables, routes, and rules. This file defines the **build order** and the **acceptance criteria** per slice.
>
> **Authority chain:** codebase > tracker (`Navuuna Build Phases.txt`) > doc > this plan.
> Where the doc and reality drift, log a Documented Deviation in the tracker.
>
> **Live checkbox state** lives in `Navuuna Build Phases.txt`. This file does not carry checkboxes — it exists to *sequence the work* and give each slice a precise Definition of Done. Update the tracker as slices land.

Last updated: 2026-07-12 · HEAD 92626c3

---

## 0. How this plan is used

Every slice below has:
1. **What ships** — files/routes/migrations touched
2. **Doc references** — sections of `Navuuna_Backend_Build_Plan.pdf` to re-read first
3. **Definition of Done** — the five-check baseline plus slice-specific proofs
4. **Blocks / unblocks** — which downstream slices this enables

Before starting any slice: re-read the referenced sections of the doc, check the tracker for `[x]` state, run the 5-check baseline (§10 of the doc) on `main` to confirm the starting point is green.

**Standing rule** carried from the tracker: no slice is done until all five checks pass and the tracker checkbox flips to `[x]`. Push per-slice, not per-session.

---

## 1. Priority ladder (do these first)

Two items in the doc's §9/§11 gate everything else. They must be the first slices shipped:

### Slice 1 — ScoreCalculator dispatched as an async job
**Doc refs:** §5.2 (Phase E cache rule), §6 (Service Layer), §11 (risk register — synchronous ScoreCalculator).
**Why first:** the coding rule says "VitalityScoreService dispatched strictly as an asynchronous Laravel job." Current `ScoreCalculator::recalculate` is synchronous. This blocks Phase B (real feeds under load) and Phase E (methodology publish → recompute all zones).

**What ships:**
- `app/Jobs/RecalculateZoneScore.php` — single-zone job.
- `app/Jobs/RecalculateAllZones.php` — bulk job, batches 5 zones at a time.
- `app/Events/ZoneScoreUpdated.php` — payload for the Reverb broadcast (event already exists — verify shape).
- Refactor every caller of `ScoreCalculator::recalculate` to dispatch the job instead.
- Reverb channel `zones.{id}` broadcasts on job completion.
- Tests: assert dispatch (not synchronous call), assert event fires on completion.

**Definition of Done:** 5-check baseline green; `Queue::fake()` test confirms no synchronous recalc paths remain; Reverb broadcast test confirms channel + payload.

**Blocks:** Slice 4 (methodology publish requires this), Phase B intake endpoint.

---

### Slice 2 — Re-run phpunit green against the 13-indicator schema
**Doc refs:** §10 (test baseline), §11 (risk — backend phpunit not re-verified green post-schema-swap).
**Why first:** the CI backend job is `continue-on-error: true` until this passes. Every subsequent Phase E migration must land on a green foundation.

**What ships:**
- `docker compose up -d postgres` from `nuvola-atlas-backend/`, then `php vendor/phpunit/phpunit/phpunit --no-coverage`.
- Fix any assertions that broke on the pillars → indicators cut (should be complete after commit `ac92f1c`, but needs actual green run).
- Once green, remove `continue-on-error: true` from `.github/workflows/ci.yml` backend job.
- Verify `tests/Support/IndicatorSeeding` still resolves to the correct 13 columns.

**Definition of Done:** phpunit 91/91 (or higher — the current target is 91) green, ~16 s. CI backend job enforcing again on `main`.

**Blocks:** every Phase E migration slice (they must not land on a red baseline).

---

## 2. Phase A remainders (Backend Live)

Doc §9 (Phase A Remainders). All Khillon-owned config work — no external dependencies, but requires access to production accounts (Vercel, Fly, Cloudflare, GitHub).

### Slice 3 — Production Sentry DSNs
**Doc refs:** §8 (Security), §9.
**What ships:** production Sentry projects for `navuuna-frontend`, `navuuna-backend`, `navuuna-ingestion` (three separate targets); DSNs pushed to Forge, Vercel, and the ingestion host via secrets managers only.
**Definition of Done:** a test exception in each service surfaces in the correct project inside 60 s. `.env.production.example` documents the three env var names but never the values.

### Slice 4 — GitHub branch protection on `main`
**Doc refs:** §8 (branch protection row).
**What ships:** 1 required approval, all CI checks required, no force-push, no direct commit — configured in GitHub Settings.
**Definition of Done:** a probe PR opened without approval cannot merge; a probe force-push is rejected.

### Slice 5 — Cloudflare DNS for production
**Doc refs:** §2.1 (Edge), §8 (Transport & headers row).
**What ships:** Cloudflare zone for the production apex; A/AAAA records to Forge droplet or Fly production app; proxied on for DDoS shielding; Let's Encrypt cert or Cloudflare origin cert.
**Definition of Done:** `curl -I https://<prod>` returns Cloudflare headers + 200 on `/api/health`.

### Slice 6 — Forge + DigitalOcean production deploy
**Doc refs:** §2.1, §11 (production cutover risk).
**What ships:** DigitalOcean droplet provisioned via Forge; existing `Dockerfile` reused for parity with Fly staging; `.env.production` sourced from Forge secrets; first migration run against the fresh Supabase pool.
**Definition of Done:** `/api/health` returns 200 with DB + cache green on the production hostname; all six Phase D pilot criteria re-verified against production.

### Slice 7 — Ingestion Sentry target
**Doc refs:** §8 (Error Tracking), §9 Phase A remainders.
**What ships:** dedicated Sentry project for the FastAPI ingestion service; keys shipped to the ingestion host secrets.
**Definition of Done:** raised exception from `services/data_cleaner.py` surfaces in the ingestion project only, not the backend project.

### Slice 8 — Docker Compose orchestrator (local dev only)
**Doc refs:** §9 Phase A remainders.
**What ships:** `docker-compose.dev.yml` at the repo root wiring FastAPI + Laravel + PostGIS + Reverb + Nginx. Reuses the existing backend `docker-compose.yml` postgres service.
**Definition of Done:** `docker compose -f docker-compose.dev.yml up` boots the whole stack; frontend can point at localhost and complete a sign-in → zone-fetch round trip.

---

## 3. Phase B — Real Data Ingestion (active, blocked on Daystar)

Doc §9 Phase B, §2.2 (data pipeline), §7.1 `/ingest`.

**Blocking status:** most items require Daystar delivery to actually start. The doc explicitly says "no fallback path exists." These slices build the infra that *waits* for Daystar and stays exercisable via mock payloads.

### Slice 9 — X-Internal-Secret contract (Devyan + Khillon)
**Doc refs:** §2.1 (Ingestion), §7.4, §8 (Internal channel row), §9 Phase B.
**What ships:**
- Shared secret in `INGESTION_SHARED_SECRET` env var (Fly + local + ingestion host).
- Ingestion service adds `X-Internal-Secret: <value>` header on every intake POST.
- New Laravel middleware `internal.secret` on the intake route(s).
- Retry policy (3 attempts, exponential backoff) on the Python side.
- Standard error envelope on failure per §7 rules.
- Rotation runbook appended to `docs/ops/secret-rotation.md`.

**Definition of Done:** requests without header return 401; wrong secret returns 401; correct secret returns 202. Ingestion service tests hit the fake Laravel endpoint and confirm the retry loop.

### Slice 10 — Append-only `data_ingestion_logs` table
**Doc refs:** §4.2, §2.2 step 5.
**What ships:**
- Migration `create_data_ingestion_logs_table`: id PK, source, payload_hash, arrived_at, verified_by_field, status.
- **No update path** — enforced by revoking UPDATE / DELETE grants on the nuvola_app role.
- Writer service `App\Services\Ingestion\IngestionLogger` called from the intake controller.

**Definition of Done:** intake POST creates a log row; direct UPDATE attempts through the app role fail; readable from `/admin/audit` with row expand.

### Slice 11 — Laravel intake routes
**Doc refs:** §7.1 `/ingest`, §2.2 step 4, §7.4.
**What ships:**
- `POST /api/v1/ingest/indicators` — accepts the cleaned batch payload.
- `POST /api/v1/ingest/geometries` — accepts zone layer GeoJSON updates.
- Both guarded by `internal.secret` middleware.
- Controllers thin — logic in `App\Services\Ingestion\IndicatorIntake` and `LayerIntake`.
- Dispatches `RecalculateZoneScore` (Slice 1) per affected zone.

**Definition of Done:** end-to-end mock payload flows through FastAPI → Laravel → `data_ingestion_logs` row + updated `indicator_scores` + `RecalculateZoneScore` dispatched. Reverb broadcast confirms on completion.

### Slice 12 — Ingestion service linting + cron
**Doc refs:** §9 Phase B (ruff + mypy, cron scheduling).
**What ships:**
- `pyproject.toml` gets `ruff` + `mypy` config.
- `Makefile` or `justfile` for local lint/type/test.
- Cron scheduler config for scheduled Daystar polls (starts as no-op until Daystar delivery starts).

**Definition of Done:** `ruff check` clean, `mypy` clean, `pytest` green. Cron docs describe schedule + rotation.

### Slice 13 — End-to-end telemetry sweep (dry run)
**Doc refs:** §2.2 (full pipeline), §9 Phase B last item.
**What ships:** synthetic Daystar payload (in `nuvola-atlas-ingestion/tests/fixtures/`) flows through the full pipeline: FastAPI validation → data_cleaner → anomaly_detector → Laravel intake → `data_ingestion_logs` write → `indicator_scores` upsert → job dispatch → Reverb broadcast → mock frontend consumer receives the update.
**Definition of Done:** integration test in `nuvola-atlas-backend/tests/Feature/EndToEndIngestionTest.php` exercises the full path with sub-2s latency.

**Unblocks:** Daystar delivery start.

---

## 4. Phase E — Admin Suite backend

Doc §4.4 (migration order), §6 (services), §7.2 (routes). **Ten migrations must land in the dependency order specified in §4.4** — do not reorder.

Grouped into three concurrent tracks (a, b, c) after the migrations land in order.

### Slice 14 — All ten Phase E migrations (single PR, single commit per migration)
**Doc refs:** §4.4, §4.3.
**What ships:** the ten migrations exactly per §4.4:

1. `extend_users_for_firms` — primary_firm_id (nullable, no FK yet), deactivated_at, last_active_at.
2. `create_firms_table` — uuid PK, slug (unique), tier enum, contact_name, contact_email, active bool.
3. `create_firm_users_table` — pivot with role_within_firm enum, unique (firm_id, user_id).
4. `add_firm_fk_to_users` — finalise users.primary_firm_id FK → firms.id ON DELETE SET NULL.
5. `create_firm_watchlists_table` — firm_id + zone_id + priority + thesis, unique (firm_id, zone_id).
6. `create_methodology_versions_table` — weights jsonb, bands jsonb, is_current with partial unique index. **Seed v1.0.0 as is_current=true, draft=false with equal 0.25 weights inside the same migration** so `ScoreCalculator` has something to read from the moment it flips over.
7. `create_data_feed_status_table` — feed_name enum + zone_id + indicator_key + last_delivered_at + expected_frequency_min + verified_records.
8. `create_impersonation_sessions_table` — admin_user_id + target_user_id + reason (NOT NULL) + ip + user_agent + started_at + ended_at.
9. `create_content_blocks_tables` — content_blocks + content_block_revisions. Seed default blocks: `methodology.overview`, `methodology.pillar.social/safety/density/infra`.
10. `extend_reports_for_cms` — created_by, updated_by, published_at, firm_scope_id FK.

Each migration is its own commit with `feat(db): ...` message per §10 coding rules.

**Definition of Done:** `php artisan migrate` runs clean forward; `php artisan migrate:rollback` runs clean back to the previous state for each; phpunit still green.

**Blocks:** every subsequent Phase E slice (services, routes, seeders).

---

### Slice 15a — Services + middleware (Phase E, backend)
**Doc refs:** §6.
**What ships (in order):**
1. `App\Services\Firms\FirmService` — CRUD + membership.
2. `App\Services\Watchlist\WatchlistService`.
3. `App\Services\Methodology\MethodologyPublisher` — publish + `MethodologyPublished` event + `RecalculateAllZones` dispatch (uses Slice 1).
4. `App\Services\Methodology\MethodologyPreview` — projected zone scores under proposed weights.
5. `App\Services\Feeds\FeedStatusService` — staleness computed on read (never stored).
6. `App\Services\Impersonation\ImpersonationService` — mint target-user token, audit both ends.
7. `App\Services\Content\ContentBlockService` — auto-snapshot revisions on save.
8. `App\Http\Middleware\AuditWrite` (`audit.write`) — writes an `audit_logs` row per admin action.
9. `App\Http\Middleware\FirmScope` (`firm.scope`) — inject firm context, 403 without.
10. Modify `App\Services\ScoreCalculator` to read weights from `methodology_versions WHERE is_current=true` with a 60 s Cache::remember. Fallback to the hardcoded 0.25 quartet only if the table read fails, to preserve boot resilience.

**Definition of Done:** each service has a matching `Unit` or `Feature` test. `MethodologyPublisherTest` proves publish → previous version demoted → RecalculateAllZones dispatched → snapshots under previous version preserved.

---

### Slice 15b — Admin routes (`/api/v1/admin/*`)
**Doc refs:** §7.2.
**What ships (grouped commits):**

- **Firms:** `GET/POST /admin/firms`, `GET/PATCH/DELETE /admin/firms/{id}`, `POST /admin/firms/{id}/users`, `DELETE /admin/firms/{id}/users/{userId}`, `PUT /admin/firms/{id}/watchlist`.
- **Methodology:** `GET/POST /admin/methodology`, `POST /admin/methodology/{version}/preview`, `POST /admin/methodology/{version}/publish`.
- **Feeds:** `GET /admin/feeds`, `GET /admin/feeds/{feedName}`, `GET /admin/feeds/zones/{zoneId}`.
- **Impersonation:** `POST /admin/impersonate/{userId}`, `POST /admin/impersonate/end`, `GET /admin/impersonations`.
- **Content:** `GET/PUT /admin/content/{key}`, `GET /admin/content/{key}/revisions`.

Every route requires `auth:sanctum`, `role:admin`, `admin.two_factor`, `audit.write`. Existing `admin.two_factor` and role gate are reused.

**Definition of Done:** `php artisan route:list --path=api/v1/admin` shows the full set with correct middleware chain. Feature test per route asserts 403 without role + 200 with role. RFC 7807 envelope on all errors.

---

### Slice 15c — Seed data (dev + demo parity with the frontend mock)
**Doc refs:** §4.3 seed notes, §9 Phase E.
**What ships:**
- `FirmSeeder` — Acumen East Africa (deal), Andela Ventures (basic), GCF Nairobi Corridor (sovereign). **Exactly the same slugs the frontend `src/api/firms.ts` uses.**
- `FirmUserSeeder` — `investor+{slug}@navuuna.dev`, `investor-lead+{slug}@navuuna.dev`, `investor-analyst+{slug}@navuuna.dev` for each firm, mirroring the mock sign-in rules.
- `FirmWatchlistSeeder` — Acumen (Westlands, Kibra, Mathare, Kasarani); Andela (Kasarani, Embakasi East, Roysambu); GCF (all 17).
- `FeedStatusSeeder` — realistic mixed staleness per feed × zone × indicator so `/admin/feeds` renders green/amber/red as expected.
- `ImpersonationSessionSeeder` — two historical rows (no active session).

**Definition of Done:** `php artisan db:seed --class=DemoSeeder` populates every table used by an admin or investor UI surface; sign-in with an investor email hits a firm with a populated watchlist.

---

## 5. Phase F — Investor Suite backend

Doc §7.3, §6 (services), §4.3 firm_watchlists row.

### Slice 16 — Investor routes
**Doc refs:** §7.3.
**What ships:**
- `GET /api/v1/investor/me` — own profile + firm + tier.
- `GET /api/v1/investor/watchlist` — enriched with live zone data.
- `POST /api/v1/investor/watchlist/{zoneId}` — body `{note, thesis, priority}`.
- `PATCH /api/v1/investor/watchlist/{zoneId}` — update note/priority/thesis.
- `DELETE /api/v1/investor/watchlist/{zoneId}`.
- `GET /api/v1/investor/portfolio` — composite score rollup + trend across watchlist.
- `GET /api/v1/investor/opportunities` — non-watchlisted zones ranked by tier heuristic (matches the frontend `investorScore` weighting: safety × 0.35 + infra × 0.35 + social × 0.15 + density × 0.15 for `deal`; overall Vitality for `basic`; QoQ delta for `sovereign`).
- `GET /api/v1/investor/brief` — LP-style PDF over the firm's watchlist.

Every route: `auth:sanctum`, `role:investor`, `firm.scope`. Missing `primary_firm_id` returns 403 with a "contact admin" message.

**Definition of Done:** Feature test per route asserts scoping (investor from firm A cannot read firm B). `firm.scope` middleware behaviour verified. PDF exported via extending `ZoneReportExporter` (see §6) with a `firm-portfolio` format branch.

**Blocks:** unblocks the frontend `/investor` page (already shipped as mock) to flip over to remote when `VITE_USE_REMOTE_API=true`.

---

## 6. Phase C — Hardening

Doc §9 Phase C. Sequenced after Phase E migrations land so indices go on the final schema, not the pre-swap one.

### Slice 17 — GIST spatial indexes across core spatial columns
**Doc refs:** §4.1 note, §9 Phase C.
**What ships:** migration adding GIST indexes on `zones.geometry`, `zone_layers.geojson->>geometry`, `projects.marker`. Existing indices audited via `pg_indexes` query, gaps filled.
**Definition of Done:** `EXPLAIN ANALYZE` on the common map-viewport query drops from seq scan to index scan; latency < 50 ms on staging with seeded data.

### Slice 18 — Materialised views for county-wide status
**Doc refs:** §9 Phase C.
**What ships:** `mv_county_status` refreshed by an overnight scheduled command. Views cover the aggregate reads used by the /public portal so it never hits the base tables.
**Definition of Done:** view refresh idempotent, refresh finishes < 5 s, view read < 20 ms.

### Slice 19 — Object storage decision + implementation
**Doc refs:** §9 Phase C.
**What ships:** decision recorded in `docs/ops/storage.md` — recommendation Cloudflare R2 for large exports (aligns with existing Cloudflare presence, avoids Vercel egress). Report exports > 5 MB stream to R2, return signed URLs.
**Definition of Done:** an exported report > 5 MB stores in R2, downloaded via signed URL, retention policy documented.

### Slice 20 — Pruning routines
**Doc refs:** §9 Phase C.
**What ships:** scheduled command `atlas:prune-raw` — deletes raw ingestion payload files older than 30 days. Analytical `zone_snapshots` retained indefinitely (explicit exclude).
**Definition of Done:** dry-run reports counts; wet-run removes only files older than 30 d; test asserts snapshots untouched.

### Slice 21 — BetterStack + Slack alerting
**Doc refs:** §2.1 (Observability), §9 Phase C.
**What ships:** BetterStack heartbeat + log source configured; Sentry → Slack integration for threshold-triggered issues; runbook update.
**Definition of Done:** a synthetic high-severity Sentry event posts to the ops Slack channel inside 60 s.

### Slice 22 — Backup drills
**Doc refs:** §9 Phase C.
**What ships:** weekly Supabase backup export to cold storage; monthly restore drill runbook + first drill executed.
**Definition of Done:** first restore drill completes successfully; drill notes in `docs/ops/backup-restore.md`.

### Slice 23 — Penetration evaluation
**Doc refs:** §8 (Pen testing row), §9 Phase C, §11 (main unprotected).
**What ships:** engagement with Strathmore Info Sec Club or external partner; scope covers the whole `/api/v1/*` surface + `/ingest`; findings tracked in `docs/security/pentest-findings.md`; critical findings fixed before Phase D closes.
**Definition of Done:** report received; every critical + high finding resolved or accepted with sign-off.

### Slice 24 — Ingestion spend guards (Devyan)
**Doc refs:** §9 Phase C, §11.
**What ships:** ingestion service enforces a per-hour + per-day budget for outbound Laravel calls; over-budget requests fail fast with a structured error; alerts on 80 % of budget.
**Definition of Done:** synthetic overload test triggers the fail-fast path, alert fires, ingestion resumes on window rollover.

---

## 7. Phase D — Validation & Launch

Doc §9 Phase D, §12 (completion). Runs at the end — every earlier slice's definition of done contributes to a pilot criterion.

### Slice 25 — Six pilot criteria verification (against production, not staging)
**What ships:** verification report signed off by Khillon + Devyan + Austine covering:
1. **Authentication** — partner accounts sign in on production Cloudflare-fronted host.
2. **Live Spatial Data** — map renders Daystar-derived indicators, `fixtures.ts` fully decoupled.
3. **Scoring Authenticity** — real scores, partial-data boundaries communicated ("9 of 13 indicators active").
4. **Transparency** — methodology screens explain factors, dataset origins, sync times.
5. **Portability** — PDF export from real data (already shipped for mock).
6. **Predictability** — ingestion schedules match the formalised Daystar agreement.

**Definition of Done:** signed-off `docs/launch/pilot-criteria-verification.md` with evidence per criterion, board sign-off recorded.

---

## 8. Cross-cutting: OpenAPI spec upkeep

Every route slice that adds or changes an endpoint updates `nuvola-atlas-backend/docs/api/openapi.yaml` in the same commit. Slice is not done if the spec drifts from the routes.

---

## 9. Dependency graph (visual summary)

```
Slice 1 (async ScoreCalculator) ──┐
                                  ├─→ Slice 11 (Laravel intake)
Slice 2 (phpunit green) ──────────┤
                                  ├─→ Slice 14 (Phase E migrations)
                                  │       │
                                  │       ├─→ Slice 15a (services)
                                  │       ├─→ Slice 15b (admin routes)
                                  │       └─→ Slice 15c (seeders)
                                  │              │
                                  │              └─→ Slice 16 (investor routes)
                                  │                     │
                                  │                     └─→ Frontend flip: VITE_USE_REMOTE_API=true
                                  │
                                  └─→ Slice 17-24 (Phase C hardening on final schema)
                                         │
                                         └─→ Slice 25 (Phase D pilot verification)

Phase A remainders (Slices 3-8): parallel, ops-only, unblock production deploy.
Phase B mid-slices (Slice 9-13): parallel with Slice 14+ track since they touch different tables.
```

---

## 10. When to STOP and ASK

Per the session-start rules:
- **Schema drift.** If a proposed migration column contradicts §4, stop and ask before writing SQL.
- **Route drift.** If a proposed endpoint contradicts §7, stop and ask.
- **Weights formula.** If the scoring engine change would treat nulls as zero or change the equal-0.25 weighting outside the methodology_versions publish flow, stop and ask.
- **Direct ScoreCalculator invocation.** If any code path calls `ScoreCalculator::recalculate` synchronously, stop and refactor via Slice 1's job dispatch.
- **Any Documented Deviation.** Log it in the tracker under Documented Deviations before the code lands.

---

## 11. Progress reporting cadence

- After each slice: update `Navuuna Build Phases.txt` checkbox → `[x]`, push per-slice commit with Conventional Commits message.
- After each phase (E-migrations complete, E-services complete, F-routes complete): update the tracker's `Last updated` + `HEAD` lines, and add a summary to `docs/backend-build-plan-status.md` (create on demand).
- Weekly: post the phase-level summary to the team channel; the tracker is the source of truth.

---

End of plan.

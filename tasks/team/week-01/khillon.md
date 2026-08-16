# Khillon — Backend Sprint Plan (Week 01)

**Owner:** Khillon (Lead Programmer) · **Week:** 2026-07-16 → 2026-07-22 (Week 1 of a 4-week backend push)
**Full window:** 2026-07-16 → 2026-08-12 · **Shape:** 3 build weeks + 1 test week
**Companion docs:** `docs/archive/Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf`, `Navuuna Build Phases.txt`, `tasks/todo.md`, `docs/api/openapi.yaml`

> **Authority chain (unchanged).** `Navuuna Build Phases.txt` (tracker) > `Backend Build Plan v1.1` (PDF) > this MD > codebase. Where the codebase drifts from the docs, the codebase wins and the deviation is logged in the tracker under "Documented Deviations". Do not delete or overwrite the tracker — only flip checkboxes and update the `Last updated` / `HEAD` lines.

---

## 1. Who you are on this sprint (context that carries you across weeks)

You're the Lead Programmer on the Navuuna Atlas team at Strathmore University. Your grant-proposal scope is the Laravel 11 core platform — auth, spatial APIs, Gates/Policies, Service classes, async job queue, Reverb broadcasts, PDF/DOCX/TXT export, the text-to-SQL assistant, and everything that sits on Supabase Postgres + PostGIS. For this 4-week window we're compressing the backend push:
- **Weeks 1–3:** build.
- **Week 4:** test — the whole team runs the 5-check baseline end-to-end and closes any regression.

Team roles you coordinate with weekly:
- **Devyan** — CTIPSO, owns FastAPI ingestion, ML models (Phase G), n8n automations (Phase J), infra strategy, security. Your handshake is the `X-Internal-Secret` header on the Python→PHP hop and the shared `data_ingestion_logs` write contract.
- **Austine** — Frontend programmer, this month covering backend for Phase E migrations + Phase F investor routes to unblock you. His work sits under yours: his migrations land first, your services + middleware sit on top, and his `/investor/*` routes call your `FirmService` and `WatchlistService`.
- **Joy** — Operations Lead + HR, drives Daystar coordination (any movement on delivery reaches you through her).
- **Ken** — Finance + Policy, drives the methodology paper and legal/IP.

## 2. What Navuuna is (single paragraph, for anyone reading cold)

Navuuna Atlas is a spatial intelligence platform for Nairobi County. It computes a **Vitality Score** (0–100) for 17 sub-counties from **13 indicators** grouped into **4 equally-weighted pillars (0.25 each):** Social Wellbeing & Human Capital · Safety & Security · Density & Scaling Dynamics · Infrastructure & Environmental Safeguards. Data flows Daystar University → FastAPI ingestion (Pydantic validation + WGS84/ISO-8601 cleaner + statistical anomaly detector) → Laravel `/ingest` (`X-Internal-Secret`) → Supabase Postgres+PostGIS → async ScoreCalculator job → Reverb WebSocket → live Mapbox map. Frontend is React 18 + Vite 5 (NOT Next.js). Grant target: KES 1,000,000 over 12 months. Pilot deliverable: functional Atlas + Scorecard + ≥ 2 partner LOIs + methodology paper.

## 3. Where the codebase is today (2026-07-16) — grounded audit

**Active phase:** Phase B — blocked on Daystar delivery. Ingestion scaffold complete on our side; external data has not started.

**Design signed off, build pending:** Phase E (Admin Suite backend) and Phase F (Investor Suite backend), both 2026-07-12.

**Your Phase A remainders (still open):**
1. Provision production Sentry targets and deploy active DSN keys to Forge and Vercel envs. Package installed, DSN-gated, keys not issued.
2. GitHub branch protection on `main` — 1 manager approval, green pipelines, no force-push.
3. Cloudflare DNS for production traffic (staging stays on `fly.dev`).
4. Execute production Forge + DigitalOcean deploy. Backend has `deploy.sh`, `docker/`, `Dockerfile`, `fly.toml` already staged — deploy artifacts are ready to run.

**Backend surfaces already shipped (audit of `nuvola-atlas-backend/routes/api.php` on 2026-07-16):**
- Public: `/api/health` + all `/api/v1/{zones,zones/{id},zones/{id}/{layers,history,forecast,export},projects,projects/{id},zones/{id}/activity,alerts,reports,history,vitality/methodology}`.
- Auth: `/api/v1/auth/{sign-in,register,forgot-password,reset-password,email/verify/{id}/{hash},2fa/verify,me,sign-out,2fa/email/{start,confirm,disable}}`.
- Chat (text-to-SQL, `USE_MOCK_CHAT` gated): `/api/v1/chat/conversations` (GET/POST/DELETE) + `/messages` (GET/POST).
- Admin (viewer/partner/editor/admin role hierarchy behind `role:admin` + `admin.two_factor`): `/api/v1/admin/{metrics,metrics/audit-volume,audit,audit/export,users,users/{id},api-keys,api-keys/{id}}`.
- **NOT shipped yet (your Phase E queue):** `/api/v1/admin/{firms,methodology,feeds,impersonate,content}`.
- **NOT shipped yet (Austine's Phase F queue, sits on your services):** `/api/v1/investor/*`.
- **NOT shipped yet (Phase B):** `/api/v1/ingest` intake hook (X-Internal-Secret guarded).

**Service layer already shipped (audit of `nuvola-atlas-backend/app/Services/` on 2026-07-16):**
- `ScoreCalculator` — 13-indicator pillar/composite math, null exclusion, `missingIndicators` ledger.
- `Chat/*` — `AiGatewayClient`, `ChatOrchestrator`, `InsightGenerator`, `IntentRouter`, `SchemaCatalog`, `SqlExecutor`, `SqlGenerator`, `SqlGuard`, `StreamEvent`.
- `Forecast/ZoneScoreForecaster` — some Phase G forecast work already pre-shipped in the 2026-07-09 session.
- `Export/ZoneReportExporter` — PDF/DOCX/TXT zone reports.
- **NOT shipped:** `Firms\*`, `Watchlist\*`, `Methodology\*`, `Feeds\*`, `Impersonation\*`, `Content\*`.

**Middleware already shipped:** `EnsureRole` (`role:`), `HandleInertiaRequests`, `HttpCache` (`http.cache:`), `RequireAdminTwoFactor` (`admin.two_factor`), `SecurityHeaders`, `SetPartnerContext` (`partner.context`).
**NOT shipped:** `audit.write`, `firm.scope`.

**Jobs already shipped:** `app/Jobs/RecalculateZoneScore.php` (single-zone async, `ShouldQueue`, tries=3, backoff=10).
**NOT shipped:** `app/Jobs/RecalculateAllZones.php`.
**Note:** the `atlas:recalculate-scores` artisan CLI still calls `ScoreCalculator::recalculate` / `recalculateAll` synchronously. That's an admin ergonomics call, not a hot path — leaving it CLI-synchronous is fine, but flag it inline so we don't confuse it for a coding-rule violation.

**Migrations already shipped (25 total, as of 2026-07-16 audit of `database/migrations/`):**
Base + `enable_postgis`, `zones + boundary`, `projects`, `alerts`, `reports`, `vitality_history`, `activities`, `zone_layers + indexes`, `role` on users, `audit_logs` (2026-06-04 — Phase E's audit store already exists, no need to recreate), `partners_and_overlays_with_rls` (RLS scaffold on `partner_dataset_overlays`), email 2FA columns, TOTP swap, 2FA reminders, `rate_limit_per_minute` on personal access tokens, `zone_score_snapshots` (2026-07-08), `chat_conversations` + `chat_messages` (2026-07-09), `swap_pillars_for_indicators` (13-indicator schema swap, dated 2026-07-25).

**Deviations to note in the tracker (don't rename tables):**
- Backend Build Plan §4.1 refers to the time-series table as `zone_snapshots` with 13 indicator columns per row. Codebase ships it as `zone_score_snapshots` with 4 pre-computed pillar columns (`pillar_social/pillar_safety/pillar_density/pillar_infra`) — trends read at pillar granularity. Codebase wins.
- Backend Build Plan §17 (Phase I) lists `conversations` / `conversation_messages` tables. Codebase already ships `chat_conversations` + `chat_messages` (2026-07-09) with a text-to-SQL–specific column set (`intent`, `generated_sql`, `result_rows`, `tokens_in`, `tokens_out`, `latency_ms`). Phase I extends these, doesn't rename.

**Phase B critical rule violation on the open list:** `ScoreCalculator::recalculate` HTTP call paths need a full audit — it's wrappable-but-not-yet-fully-wrapped. `RecalculateZoneScore` job exists; `RecalculateAllZones` doesn't. Austine takes this in his Week 1 (see `austine.md`). Your job is to confirm his audit + review the PR.

**phpunit baseline:** 91/91 green at HEAD `c32002e`; 134 after 2026-07-09 slice. Backend CI job stays `continue-on-error` until you re-verify green post-schema-swap against Docker Postgres and flip the flag.

## 4. Your 4-week schedule

**Working principle:** you own the **service + middleware + route** tier of Phase E and the deep infra work (Phase A close-out, Phase C hardening prep). Austine owns the **migrations + seeders + tests + Phase F routes** tier and consumes your services. Devyan owns FastAPI + ML + n8n. Handshake weekly.

### Week 1 · 2026-07-16 → 2026-07-22 — Close Phase A + intake pipe

**Goal:** get production posture out of "staging demo" and put down the pipe that Phase B will flow through.

- [ ] **Phase A #1 — Provision production Sentry targets**
  - Three separate Sentry projects: `navuuna-frontend`, `navuuna-backend`, `navuuna-ingestion` (last one is Devyan's — you own the two Laravel/frontend keys).
  - Push DSN env vars to Forge (`SENTRY_LARAVEL_DSN`) and Vercel (`VITE_SENTRY_DSN`). Never in code.
  - **DoD:** a deliberate test exception thrown in each service surfaces in the correct Sentry project inside 60s. Update `.env.production.example` with the var names (values never committed). Rotation runbook stays at `docs/ops/secret-rotation.md`.

- [ ] **Phase A #2 — GitHub branch protection on `main`**
  - Settings → Branches → `main`: require 1 approving review, require all CI checks to pass (frontend workflow + backend workflow both required), no force-push, no direct commit.
  - **DoD:** probe PR without approval cannot merge; probe force-push rejected. Screenshot the settings into `docs/ops/`.

- [ ] **Phase A #3 — Cloudflare DNS for production**
  - Point production A/AAAA records at the DigitalOcean droplet IP once the deploy lands (item #4 below). Staging stays on `navuuna-atlas-staging.fly.dev`.
  - **DoD:** `dig navuuna.<domain>` resolves to the DO droplet + TLS termination handshake succeeds via Cloudflare Universal SSL.

- [ ] **Phase A #4 — Execute Forge + DigitalOcean production deploy**
  - Deploy artifacts are staged (`nuvola-atlas-backend/deploy.sh`, `docker/`, `Dockerfile`). Provisioning is user-only (you drive Forge dashboard + DO account).
  - Supabase side: create the `nuvola_app` role with RLS per `docs/ops/deploy.md`. Pooled `:6543` for app, direct `:5432` for migrations. Confirm AES-256 at rest.
  - Deploy Now → smoke `/api/health` (DB ping + cache write must both be green).
  - **DoD:** `/api/health` returns 200 with both `database: ok` + `cache: ok` on production; migrations ran without drift; Reverb WebSocket connects on `wss://`.

- [x] **Phase B intake pipe — `POST /api/v1/ingest`**
  - New route inside `routes/api.php`, `throttle:api` + `X-Internal-Secret` header validator middleware (build `EnsureInternalSecret` in `app/Http/Middleware/`).
  - Body accepts cleaned Daystar batches per Devyan's `daystar-indicator-spec.md`. Payload validates via `IngestBatchRequest` FormRequest.
  - Writes an append-only row to `data_ingestion_logs` (new migration below), then persists indicator values to the correct zone/indicator columns, then dispatches `RecalculateZoneScore` per zone in the batch.
  - Coordinate with Devyan on: header name, HMAC signature scheme (`hash_hmac('sha256', $body, $secret)`), retry limits (3 tries, exponential backoff), error envelope shape.

- [x] **Phase B migration — `create_data_ingestion_logs_table` (append-only)**
  - `id PK`, `source` string (Daystar batch id or feed name), `payload_hash` string(64) unique (idempotency dedupe), `arrived_at` timestamp, `verified_by_field` bool (default false, updated by field workers via a later admin action), `status` enum(`received`,`validated`,`rejected`,`applied`), `error_reasons` jsonb nullable, `zone_count` int nullable, `indicator_count` int nullable, timestamps.
  - Table is **append-only** — no updates or deletes ever. Enforce at model level (`static::updating(fn () => throw)`) + at DB level with a `BEFORE UPDATE/DELETE` trigger returning `NULL` (isolated commented raw SQL per the coding rule).
  - Reversible (`up()` + `down()`).

**End-of-week deliverable:** Phase A closed, `/api/v1/ingest` shipped, `data_ingestion_logs` table live, tracker checkboxes flipped, 5-check baseline green.

### Week 2 · 2026-07-23 → 2026-07-29 — FirmService + admin/firms + weights caching

**Goal:** land the first Phase E service surface and give the admin dashboard a real firm CRUD.

- [ ] **`ScoreCalculator` reads weights from `methodology_versions`**
  - Once Austine's migration 6 (`create_methodology_versions_table`) is green, refactor `ScoreCalculator::getWeights()` to `SELECT weights FROM methodology_versions WHERE is_current = true` with a **60-second cache** (`Cache::remember('methodology.current', 60, ...)`).
  - Fall back to the seeded v1.0.0 equal-0.25 quartet if the query returns nothing.
  - **DoD:** unit test asserts the cache TTL + the fallback path.

- [ ] **`Firms\FirmService`**
  - `list(pagination)`, `create(dto)`, `find(id)`, `update(id, dto)`, `deactivate(id)` (soft — sets `active = false`, does not delete because of FK integrity from `firm_watchlists` and `users.primary_firm_id`).
  - `addUser(firmId, userId, roleWithinFirm)`, `removeUser(firmId, userId)` — writes to `firm_users` pivot.
  - All methods return typed DTOs, not Eloquent models, so the Resource layer is thin.
  - **DoD:** unit tests per method, no controller instantiation of the service directly (inject).

- [ ] **`Watchlist\WatchlistService`**
  - `getFor(firmId)` — returns the firm's watchlist with zone summaries + composite score.
  - `bulkReplace(firmId, entries[])` — atomic bulk PUT for `/admin/firms/{id}/watchlist`.
  - Phase F extends this — Austine's `/investor/watchlist` routes call the same service.

- [ ] **`AuditWriteMiddleware` (`audit.write`)**
  - Registered in `bootstrap/app.php` as `audit.write`. Runs on every admin-scope route after the controller executes successfully.
  - Writes an `audit_logs` row (table already exists) with `user_id`, `action` (route name), `entity` (model touched), `before/after` jsonb diff (from `Model::getOriginal()` vs `Model::getAttributes()`).
  - **DoD:** feature test asserts every admin write route writes an audit row.

- [ ] **`FirmScopeMiddleware` (`firm.scope`)**
  - Reads `request()->user()->primary_firm_id`. If null and route is `/investor/*` → 403 problem+json ("no firm scope"). Otherwise injects `$request->attributes->set('firm_id', $firmId)` for downstream controllers.
  - Applies to every `/investor/*` route (Austine's Phase F work).

- [ ] **Admin routes — firms family** (all behind `role:admin` + `admin.two_factor` + `audit.write`, per §7.2 of Backend Build Plan):
  - `GET/POST /api/v1/admin/firms`
  - `GET/PATCH/DELETE /api/v1/admin/firms/{id}`
  - `POST /api/v1/admin/firms/{id}/users`
  - `DELETE /api/v1/admin/firms/{id}/users/{userId}`
  - `PUT /api/v1/admin/firms/{id}/watchlist` (bulk replace)
  - Resources: `FirmResource`, `FirmUserResource`, `FirmWatchlistResource`.

**End-of-week deliverable:** FirmService + WatchlistService + 2 middleware + 6 admin routes shipped, `phpunit` well above baseline, tracker checkboxes flipped.

### Week 3 · 2026-07-30 → 2026-08-05 — MethodologyPublisher + FeedStatusService + admin routes

**Goal:** land the two most complex Phase E services — methodology publishing (triggers full recompute) and feed health (staleness computed on read).

- [ ] **`Methodology\MethodologyPublisher`**
  - `publish(version)` — sets `is_current = false` on the previous current row, flips new version to `is_current = true` (atomic transaction), dispatches `RecalculateAllZones` (Austine's Week 1 bulk job).
  - Emits `MethodologyPublished` event (create it) so the audit trail catches the swap.
  - **DoD:** integration test asserts the atomicity (concurrent publish attempts serialize) + the recompute dispatch.

- [ ] **`Methodology\MethodologyPreview`**
  - `project(version, weights)` — computes what every zone's composite would be under the proposed weights, without persisting. Runs `ScoreCalculator::pillarScoresFromValues` with the alt weights.
  - Returns a diff list: `[{ zoneId, currentComposite, projectedComposite, delta }, ...]`.

- [ ] **`Feeds\FeedStatusService`**
  - `matrix()` — returns the feed × zone × indicator grid with staleness computed on read: `now() - last_delivered_at > (expected_frequency_min minutes)`.
  - `forFeed(name)` — filters to one feed. `forZone(zoneId)` — filters to one zone.
  - Powers the `/admin/data` matrix on the admin dashboard.

- [ ] **Admin routes — methodology family:**
  - `GET /api/v1/admin/methodology` — list all versions.
  - `POST /api/v1/admin/methodology` — create a draft.
  - `POST /api/v1/admin/methodology/{version}/preview` — call `MethodologyPreview`.
  - `POST /api/v1/admin/methodology/{version}/publish` — call `MethodologyPublisher`.

- [ ] **Admin routes — feeds family:**
  - `GET /api/v1/admin/feeds` — the matrix.
  - `GET /api/v1/admin/feeds/{feedName}` — one feed.
  - `GET /api/v1/admin/feeds/zones/{zoneId}` — one zone.

**End-of-week deliverable:** methodology + feeds Phase E services + routes shipped, tracker checkboxes flipped.

### Week 4 · 2026-08-06 → 2026-08-12 — TEST WEEK · Impersonation + ContentBlock + hardening prep

**Focus flips from build to validation.** You finish the last two Phase E services + start Phase C hardening prep.

- [ ] **`Impersonation\ImpersonationService`**
  - `start(adminId, targetUserId, reason)` — creates `impersonation_sessions` row, mints a Sanctum token for the target user with a 60-minute TTL, returns `{token, session_id}`.
  - `end(sessionId)` — revokes the target token, sets `ended_at`.
  - Every impersonation start + end is audited on both ends (`audit_logs`).
  - **DoD:** policy test — only admin role can start; target user's tokens rotate on session end (no orphan sessions).

- [ ] **`Content\ContentBlockService`**
  - `get(key)`, `save(key, body)` — every save auto-snapshots to `content_block_revisions`.
  - `revisions(key)` — chronological list. Backing store for admin CMS.

- [ ] **Admin routes — impersonation + content:**
  - `POST /api/v1/admin/impersonate/{userId}` · `POST /api/v1/admin/impersonate/end` · `GET /api/v1/admin/impersonations`
  - `GET /api/v1/admin/content/{key}` · `PUT /api/v1/admin/content/{key}` · `GET /api/v1/admin/content/{key}/revisions`

- [ ] **Phase C hardening prep (start; finish in the next sprint):**
  - **GIST spatial indexes** on `zones.geometry`, `zone_layers.geojson` (jsonb → GIST is not native; wrap the actual PostGIS geometry column if present, or add a computed column). Isolated commented raw SQL per the coding rule.
  - **Materialized view** `mv_county_status` — county-wide composite + pillar averages + last-updated timestamp. Refreshed by an overnight scheduled job.
  - **Object storage decision** — Cloudflare R2 vs Vercel Blob. Log the decision in `docs/ops/deploy.md`. R2 is likely cheaper for the pilot volume; Vercel Blob is one less vendor. Recommend R2 unless multi-vendor is a policy problem.
  - **Pruning routine** — scheduled job scrubbing raw ingestion payload text > 30 days old from `data_ingestion_logs.error_reasons`. Never prune analytical scores.

- [ ] **5-check baseline daily**, target 100% green all 5 checks by 2026-08-07.
- [ ] **Backend CI job**: flip `continue-on-error: false` on the backend workflow in `.github/workflows/ci.yml` once phpunit is confirmed green against Docker Postgres.

**End-of-week deliverable:** All 7 Phase E services shipped, all 5 admin route families shipped, Phase C hardening scoped, 5-check baseline green, tracker fully up to date, PR into `main` for the sprint merge.

## 5. Non-negotiable rules (repeat before every commit)

**Stack (grant-locked):** Laravel 11 (PHP 8.3+) · Supabase Postgres + PostGIS (pooled :6543 app, direct :5432 migrations) · Sanctum SPA tokens (8h TTL) + email 2FA · Laravel Echo + Reverb · FastAPI (Python 3.13) ingestion · Cloudflare · Vercel AI Gateway for chat/embeddings.

**Do-nots:** No Next.js, Rails, Django, MQTT, Go migration, premature abstractions, hypothetical feature flags, DB mocking in integration tests.

**Coding:**
- Secrets from environment variables only. Never inline in code.
- No inline role checks — Gates and Policies only.
- Thin controllers; business logic in `App\Services\*`.
- All migrations reversible (`up()` + `down()`).
- No raw SQL except isolated, commented PostGIS spatial queries in a dedicated service/repository method (append-only triggers, GIST index DDL, HNSW index DDL).
- Consistent JSON envelope on every endpoint. RFC 7807 `application/problem+json` for errors.
- `ScoreCalculator` dispatched **only** as an async Laravel job from HTTP paths — never called synchronously from a controller. CLI is fine.
- Nulls excluded from score averages — never zero-biased.
- Conventional Commits, per-slice, push only when the 5-check baseline is green.
- Never add `Co-Authored-By: Claude` to commits.
- Plan Mode in Claude for anything ≥ 3 steps or with architectural tradeoffs. Stop and ask on ambiguity.

## 6. Definition of Done — the 5-check baseline

Run after every meaningful slice. Nothing merges to `main` until all 5 are green.

```
1. cd nuvola-atlas-frontend && npx tsc --noEmit
2. cd nuvola-atlas-frontend && npx vite build
3. cd nuvola-atlas-frontend && npx vitest run
4. cd nuvola-atlas-backend && php artisan route:list --path=api
5. cd nuvola-atlas-backend && php vendor/phpunit/phpunit/phpunit --no-coverage
   # Requires `docker compose up -d postgres` from the backend directory.
   # phpunit.xml force-overrides to a local docker Postgres+PostGIS on 127.0.0.1:5434.
```

## 7. Coordination points

| Who     | When            | What you need to align on                                                                     |
|---------|-----------------|-----------------------------------------------------------------------------------------------|
| Devyan  | Week 1 daily    | `X-Internal-Secret` scheme (HMAC-SHA256), header name, retry limits, error fallback envelope. |
| Devyan  | Week 1 handoff  | Sentry ingestion DSN — his project, but you drop the DSN into the ingestion service env.       |
| Austine | Week 1 handoff  | Review Austine's async job PR + confirm `ZoneScoreUpdated` payload shape.                     |
| Austine | Week 2 handoff  | Confirm `firm_users.role_within_firm` enum values match `FirmService::addUser` role signature. |
| Austine | Week 3 handoff  | Ship `MethodologyPublisher` before Austine's `/investor/portfolio` route reads current weights. |
| Austine | Week 3 handoff  | Ship `firm.scope` middleware so Austine can wire `/investor/me` behind it in Week 3.           |
| Joy     | Week 2 async    | Confirmation Daystar delivery is still blocked. If it lifts, Phase B intake becomes critical path. |

Post daily standup snippets to `#navuuna-backend` Slack. Blockers escalated same-day.

## 8. Blockers & escalation

- **Daystar data still not arriving.** Doesn't affect Phase E/F — build against `FeedStatusSeeder` (Austine's Week 2 seeder) for realistic dev data.
- **AI Gateway billing not yet confirmed.** Doesn't affect Phase E/F. `USE_MOCK_CHAT` gate stays on.
- **Supabase AES-at-rest toggle** — you flip this on the Supabase dashboard as part of Week 1 deploy. Not a code task.
- **If Forge deploy (Week 1) slips past Wednesday**, work backwards: complete the branch protection + Sentry DSN provisioning first, and target deploy for the Friday-Saturday window so Week 2 opens with production live.

## 9. Where to find everything

- **Live tactical status:** `tasks/todo.md` (updated per-slice).
- **Authoritative phase state:** `Navuuna Build Phases.txt` (checkboxes).
- **Backend architecture + full task ledger:** `docs/archive/Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf`.
- **API contract (authoritative for /api/v1/*):** `docs/api/openapi.yaml` — update as routes ship.
- **Ops runbooks:** `docs/ops/` — `deploy.md`, `rollback.md`, `incident-response.md`, `secret-rotation.md`, `postmortem-template.md`.
- **This sprint's team MDs:** `tasks/team/week-01/austine.md` · `khillon.md` · `devyan.md` — regenerated weekly by Austine.

## 10. Handover contract

Every merged PR this sprint must:
1. Flip the matching tracker checkbox to `[x]`.
2. Update `Last updated` and `HEAD` lines in `Navuuna Build Phases.txt`.
3. Update `tasks/todo.md` status snapshot.
4. Log any deviation from the Backend Build Plan v1.1 in the tracker's "Documented Deviations" section with a one-line rationale.

If it doesn't do those four things, it doesn't merge — even if the code is perfect. The tracker is the memory of the sprint.

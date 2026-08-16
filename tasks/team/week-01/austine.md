# Austine — Backend Sprint Plan (Week 01)

**Owner:** Austine Igunza · **Week:** 2026-07-16 → 2026-07-22 (this is Week 1 of a 4-week backend push)
**Full window:** 2026-07-16 → 2026-08-12 · **Shape:** 3 build weeks + 1 test week
**Companion docs:** `docs/archive/Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf`, `Navuuna Build Phases.txt`, `tasks/todo.md`

> **Authority chain (unchanged).** `Navuuna Build Phases.txt` (tracker) > `Backend Build Plan v1.1` (PDF) > this MD > codebase. Where the codebase drifts from the docs, the codebase wins and the deviation is logged in the tracker under "Documented Deviations". Do not delete or overwrite the tracker — only flip checkboxes and update the `Last updated` / `HEAD` lines.

---

## 1. Who I am on the team (context you don't lose)

I'm Austine Igunza, the frontend programmer on the Navuuna Atlas team at Strathmore University. My formal grant-proposal scope is the Mapbox GL JS frontend + the user-facing Vitality Scorecard components. For this 4-week window I'm temporarily authorized (per project `CLAUDE.md`) to work in the Laravel backend and the FastAPI ingestion service to help unblock the pilot while covering Khillon and Devyan on schema and route work. Frontend polish is deliberately paused for this month — **backend only** through Week 3, with a controlled FE round-trip pass in Week 4 to prove the new admin/investor endpoints wire up cleanly.

Team roles I coordinate with weekly:
- **Khillon** — Lead Programmer, owns Laravel core (auth, services, middleware, Reverb, ScoreCalculator, admin/investor route families).
- **Devyan** — CTIPSO, owns FastAPI ingestion, ML models (Phase G), n8n automations (Phase J), infra strategy, security.
- **Joy** — Operations Lead + HR, drives Daystar coordination and stakeholder outreach.
- **Ken** — Finance + Policy, drives the methodology paper and legal/IP.

## 2. What Navuuna is (single paragraph, for anyone reading cold)

Navuuna Atlas is a spatial intelligence platform for Nairobi County. It computes a **Vitality Score** (0–100) for 17 sub-counties from **13 indicators** grouped into **4 equally-weighted pillars (0.25 each):** Social Wellbeing & Human Capital · Safety & Security · Density & Scaling Dynamics · Infrastructure & Environmental Safeguards. Data flows Daystar University → FastAPI ingestion (Pydantic validation + WGS84/ISO-8601 cleaner + statistical anomaly detector) → Laravel `/ingest` (X-Internal-Secret) → Supabase Postgres+PostGIS → async ScoreCalculator job → Reverb WebSocket → live Mapbox map. Frontend is React 18 + Vite 5 (NOT Next.js). Grant target: KES 1,000,000 over 12 months. Pilot deliverable: functional Atlas + Scorecard + ≥ 2 partner LOIs + methodology paper.

## 3. Where the codebase is today (2026-07-16)

**Active phase:** Phase B (Real Data Ingestion) — active but blocked on Daystar delivery. Ingestion scaffold complete; external data has not started arriving.

**Design signed off, build pending:** Phase E (Admin Suite backend) and Phase F (Investor Suite backend), both signed off 2026-07-12.

**Phase A remainders open (Khillon):** production Sentry DSNs, GitHub branch protection on `main`, Cloudflare DNS cut-over, Forge + DigitalOcean deploy. Backend has `deploy.sh`, `docker/`, `Dockerfile`, `fly.toml` staged — deploy artifacts ready.

**Phase A remainders open (Devyan):** FastAPI target-arch validation (Vercel Python Fluid Compute), ingestion Sentry target, Docker Compose orchestrator wrapping FastAPI + Laravel + Postgres + Reverb + Nginx (the backend's current `docker-compose.yml` covers Postgres only).

**Backend `phpunit` baseline:** 91/91 green at HEAD `c32002e`; 134 after the 2026-07-09 slice. Backend CI job stays `continue-on-error` until re-verified green post-schema-swap against Docker Postgres.

**Backend surfaces already shipped (per `routes/api.php` audit 2026-07-16):**
- Public: `/api/health`, `/api/v1/{health,zones,zones/{id},zones/{id}/{layers,history,forecast,export},projects,projects/{id},zones/{id}/activity,alerts,reports,history,vitality/methodology}`.
- Auth: `/api/v1/auth/{sign-in,register,forgot-password,reset-password,email/verify/{id}/{hash},2fa/verify,me,sign-out,2fa/email/{start,confirm,disable}}`.
- Chat: `/api/v1/chat/conversations` (GET/POST/DELETE) + `/messages` (GET/POST) — text-to-SQL assistant already live behind `USE_MOCK_CHAT` gate.
- Admin (viewer/partner/editor/admin role hierarchy): `/api/v1/admin/{metrics,metrics/audit-volume,audit,audit/export,users,users/{id},api-keys,api-keys/{id}}`.
- **NOT shipped yet:** `/api/v1/admin/{firms,methodology,feeds,impersonate,content}` (Phase E), `/api/v1/investor/*` (Phase F), `/api/v1/ingest` (Phase B intake hook), `/api/v1/zones/{id}/history` per-zone time-series returning trend data (already partly wired via `ZoneHistoryController` — verify what remains).

**Service surfaces already shipped (per `app/Services/` audit 2026-07-16):**
- `ScoreCalculator` — 13-indicator pillar/composite math + null exclusion + `missingIndicators` ledger. Uses `pillarScoresFromValues` for read-time derivation.
- `Chat/*` — `AiGatewayClient`, `ChatOrchestrator`, `InsightGenerator`, `IntentRouter`, `SchemaCatalog`, `SqlExecutor`, `SqlGenerator`, `SqlGuard`, `StreamEvent`. Full text-to-SQL surface.
- `Forecast/ZoneScoreForecaster` — some Phase G forecast work already pre-shipped (per 2026-07-09 session memory). Verify what's live vs. what's mocked.
- `Export/ZoneReportExporter` — PDF/DOCX/TXT zone reports. Phase F `/investor/brief` extends this.
- **NOT shipped yet:** `Firms\*`, `Watchlist\*`, `Methodology\*`, `Feeds\*`, `Impersonation\*`, `Content\*` (all Phase E).

**Middleware already shipped:** `EnsureRole` (registered as `role:`), `HandleInertiaRequests`, `HttpCache` (registered as `http.cache:`), `RequireAdminTwoFactor` (registered as `admin.two_factor`), `SecurityHeaders`, `SetPartnerContext` (registered as `partner.context`). **NOT shipped:** `audit.write`, `firm.scope`.

**Jobs already shipped:** `RecalculateZoneScore` (single-zone async, `ShouldQueue`, tries=3). **NOT shipped:** `RecalculateAllZones`.

**Migrations already shipped (as of 2026-07-16):** 25 migrations including `enable_postgis`, zones + boundary, projects, alerts, reports, vitality_history, activities, zone_layers + indexes, role column on users, `audit_logs` (2026-06-04 — Phase E's audit store already exists), `partners_and_overlays_with_rls` (RLS scaffold), two-factor email columns, TOTP swap, 2FA reminders, `rate_limit_per_minute` on PATs, `zone_score_snapshots` (2026-07-08 — per-zone time-series), `chat_conversations` + `chat_messages` (2026-07-09), `swap_pillars_for_indicators` (13-indicator schema swap dated 2026-07-25).

**Coding-rule pressure point:** `ScoreCalculator::recalculate` is wrappable-but-not-yet-fully-wrapped. `RecalculateZoneScore` job exists; `RecalculateAllZones` job doesn't; the artisan CLI command still calls the synchronous variants (fine for CLI, but every HTTP path must go through the job). This is my Week 1 close-out.

**Note the naming deviation between docs and code:** The Backend Build Plan §4.1 calls the time-series table `zone_snapshots` and lists "13 nullable indicator columns" per row. The codebase ships it as `zone_score_snapshots` with 4 pre-computed pillar columns (`pillar_social/pillar_safety/pillar_density/pillar_infra`) — trends read at pillar granularity, not indicator granularity. Log this under the tracker's Documented Deviations if not already there. Do not rename tables — the codebase wins per the authority chain.

## 4. My 4-week schedule

**Working principle:** I own the **data tier** of Phase E (migrations + seeders + tests) and the **Phase F investor routes** that sit on top of Khillon's services. That keeps my scope clean — schema and route-level work that doesn't collide with Khillon's service classes — and lets Khillon focus on the deep service/middleware layer.

### Week 1 · 2026-07-16 → 2026-07-22 — Async job + Phase E migrations 1-4

**Goal:** unblock the biggest coding-rule violation on the board, then start landing Phase E schema.

- [ ] **Async ScoreCalculator wrapper — close-out** (Phase B critical, Backend Build Plan §11 risk register)
  - **Grounded state:** `app/Jobs/RecalculateZoneScore.php` already ships (single-zone job, `ShouldQueue`, tries=3, backoff=10). `app/Events/ZoneScoreUpdated.php` already ships. What's missing is (a) the bulk job and (b) full audit that no synchronous hot path still calls `ScoreCalculator::recalculate*` from an HTTP request.
  - Create `app/Jobs/RecalculateAllZones.php` — bulk job that dispatches `RecalculateZoneScore` per zone in chunked batches of 5 (feeds `MethodologyPublisher` → `RecalculateAllZones::dispatch()` in Phase E).
  - Audit `ScoreCalculator::recalculate` + `recalculateAll` call sites (`app/Http/Controllers/VitalityController.php`, `app/Http/Controllers/ZoneHistoryController.php`, `app/Http/Resources/ZoneResource.php`, `app/Services/Export/ZoneReportExporter.php`, `app/Console/Commands/RecalculateScores.php`). Read-only shape uses (`pillarScoresFromValues`, `pillars()`) are fine to leave. Any hot-path write/recompute goes through the job. CLI command may stay synchronous for admin ergonomics — note the exemption inline.
  - Verify `ZoneScoreUpdated` payload shape includes composite score, four pillars, and the `missingIndicators` ledger. Broadcast contract test on channel `zones.{id}`.
  - **DoD:** 5-check baseline green; `Queue::fake()` assertion in `tests/Feature/Scoring/` proves HTTP controllers never call `recalculate*` synchronously; Reverb broadcast contract test asserts channel + payload.

- [ ] **Phase E migration 1 — `extend_users_for_firms`**
  - Adds `primary_firm_id` (nullable uuid FK, filled in later by migration #4), `deactivated_at` (timestamp nullable), `last_active_at` (timestamp nullable) to `users`.
  - Reversible (`up()` + `down()`). Feature test asserts columns exist post-migrate and revert cleanly.

- [ ] **Phase E migration 2 — `create_firms_table`**
  - `id uuid PK`, `slug` (unique), `tier` enum(`basic`,`deal`,`sovereign`), contact fields (email/name/website), `active` bool, timestamps.
  - Reversible. Feature test asserts uniqueness on slug + tier enum guard.

- [ ] **Phase E migration 3 — `create_firm_users_table`**
  - Pivot: `firm_id FK`, `user_id FK`, `role_within_firm` enum(`viewer`,`analyst`,`admin`), timestamps.
  - Composite unique on (firm_id, user_id).

- [ ] **Phase E migration 4 — `add_firm_fk_to_users`**
  - Finalises `users.primary_firm_id` FK → `firms.id ON DELETE SET NULL`. Split from migration 1 so both parents exist.

- [ ] **`FirmSeeder`** — three seeded rows for dev: Acumen East Africa (`deal`), Andela Ventures (`basic`), GCF Nairobi Corridor (`sovereign`).

**End-of-week deliverable:** async job dispatch shipped, 4 Phase E migrations green, `FirmSeeder` running clean, 5-check baseline green, PRs merged with tracker checkboxes flipped.

### Week 2 · 2026-07-23 → 2026-07-29 — Phase E migrations 5-7 + seeders

- [ ] **Phase E migration 5 — `create_firm_watchlists_table`**
  - `firm_id FK`, `zone_id FK`, `priority` int(1-5), `thesis` text nullable, timestamps.
  - Unique on (firm_id, zone_id) — a firm cannot double-watchlist a zone.

- [ ] **Phase E migration 6 — `create_methodology_versions_table` + v1.0.0 seed**
  - `version` string (semver), `weights jsonb`, `bands jsonb`, `is_current` bool with a **partial unique index** (`WHERE is_current = true`) so only one row can be current, `draft` bool, timestamps.
  - Seed v1.0.0 as `is_current = true` with equal 0.25 weights on all four pillars.
  - **Migration order matters** — this must land before Khillon's `MethodologyPublisher` service (Week 3).

- [ ] **Phase E migration 7 — `create_data_feed_status_table`**
  - `feed_name` enum (list every Daystar indicator + external source keys), `zone_id FK`, `indicator_key`, `last_delivered_at`, `verified_records` int, `expected_frequency_min` int.
  - Staleness is **computed on read** by `FeedStatusService` (Khillon Week 3) — never stored.

- [ ] **`FirmUserSeeder`** — one investor account per firm: `investor+acumen@navuuna.dev`, `investor+andela@navuuna.dev`, `investor+gcf@navuuna.dev`. Each seeded into `firm_users` and back-populated as `users.primary_firm_id`.

- [ ] **`FirmWatchlistSeeder`** — realistic mix: Acumen watchlisting Westlands + Starehe (deal tier tends toward CBD growth zones), Andela watchlisting Kasarani + Embakasi (basic tier tends toward emerging), GCF watchlisting Kibra + Mathare (sovereign tier tends toward informal-settlement priorities).

- [ ] **`FeedStatusSeeder`** — realistic mixed staleness: some feeds fresh (last 6h), some moderate (24-72h), some stale (>7 days) so Khillon's `/admin/feeds` matrix has plausible dev data.

**End-of-week deliverable:** 7 of 10 Phase E migrations green, 3 seeders running clean, `phpunit` still green, tracker checkboxes flipped.

### Week 3 · 2026-07-30 → 2026-08-05 — Phase E migrations 8-10 + Phase F routes begin

- [ ] **Phase E migration 8 — `create_impersonation_sessions_table`**
  - `admin_user_id FK`, `target_user_id FK`, `reason` string (required), `ip` string, `user_agent` string, `started_at`, `ended_at` (nullable). No composite unique — an admin can impersonate the same user twice.

- [ ] **Phase E migration 9 — `create_content_blocks_tables`**
  - Two tables in one migration: `content_blocks` (`key` string unique PK, `body` text, timestamps) and `content_block_revisions` (`content_block_key FK`, `body_snapshot`, `edited_by user FK`, `edited_at`). Every save auto-snapshots to `revisions` — Khillon's `ContentBlockService` (Week 4) owns the write-side; migration establishes the shape.

- [ ] **Phase E migration 10 — `extend_reports_for_cms`**
  - Adds `created_by user FK`, `updated_by user FK`, `published_at timestamp`, `firm_scope_id firm FK nullable` to `reports`. `firm_scope_id` powers firm-scoped report publishing (Phase F `/investor/brief`).

- [ ] **Phase F migration — `create_investor_watchlist_operations_table`** (if needed for `/investor/watchlist` audit) — decide with Khillon whether `firm_watchlists` writes get logged into `audit_logs` (his middleware) or into a dedicated table. Default: audit_logs is enough; skip this migration unless Khillon disagrees.

- [ ] **Phase F route — `GET /investor/me`**
  - Returns `{ user, firm, tier, watchlist_count }`. Sits behind `auth:sanctum` + `firm.scope` middleware (Khillon Week 3). Resource: `InvestorProfileResource`.

- [ ] **Phase F route — `GET/POST/PATCH/DELETE /investor/watchlist`**
  - GET returns the firm's watchlist with zone summaries.
  - POST adds a zone (`{ zone_id, priority, thesis }`) — 422 on duplicate.
  - PATCH updates priority/thesis on an existing entry.
  - DELETE removes a zone. All routes 403 for investors without a firm (enforced by `firm.scope`).

**End-of-week deliverable:** all 10 Phase E migrations green, `/investor/me` + `/investor/watchlist` shipped with policy tests, tracker checkboxes flipped, `phpunit` well above 91 (target 100+).

### Week 4 · 2026-08-06 → 2026-08-12 — TEST WEEK · Phase F routes + FE round-trip

**Focus flips from build to validation.** Everything I ship this week is either a Phase F completion slice or a proof that the whole stack round-trips cleanly.

- [ ] **Phase F route — `GET /investor/portfolio`**
  - Composite score rollup across the firm's watchlisted zones + 4-week trend.
  - Reads `zone_snapshots` (per-zone time-series, shipped 2026-07-08) to compute trend. Resource: `PortfolioResource`.

- [ ] **Phase F route — `GET /investor/opportunities`**
  - Non-watchlisted zones ranked by tier-specific heuristic (basic|deal|sovereign — coordinate weights with Khillon; Backend Build Plan §14.1 sets the v1 rule as transparent tier-aware weighted heuristic).
  - Documented in `docs/api/openapi.yaml`.

- [ ] **Phase F route — `GET /investor/brief`**
  - LP-style PDF across the watchlist. Extends `ZoneReportExporter` with a firm-portfolio format. Streams `application/pdf`.
  - Reuses the Phase E CMS content blocks for methodology copy.

- [ ] **Policy test sweep** — every Phase F route has a Policy test:
  - Viewer without firm → 403.
  - Investor with firm → 200, scoped to their firm only.
  - Investor from firm A cannot see firm B's watchlist under any route.
  - Admin → 200, unscoped.

- [ ] **FE consumption round-trip — the shape is already there**
  - **Grounded state:** commit `b1259ec feat(admin+investor): full Phase E frontend + Phase F landing + fixes` already landed the Phase E admin surfaces (firms, methodology, feeds, impersonation, content CMS) and the Phase F investor landing against mock data. Subsequent commits (`5f2500a` System Health + Deal Pipeline, `fed071b` impersonation + Content CMS + per-zone notes, `83efc1b` watchlist chip + announcements) fleshed those out.
  - So Week 4 round-trip is NOT "build a client from scratch" — it's "flip the flag and prove the mock shapes match Khillon's real shapes".
  - Wire the existing FE admin/investor views to the new backend routes: audit `src/api/adminClient.ts` and `src/api/investorClient.ts` (or wherever the mock is centralised) and confirm every request/response envelope matches the Laravel Resource returned by Khillon's Week 2/3 routes.
  - Flip `VITE_USE_REMOTE_API=true` locally against the running Laravel dev server (or against staging Fly.io if Forge deploy is still open).
  - Prove the round-trip in the browser: sign in as `investor+acumen@navuuna.dev`, walk through the shipped Phase F FE flows (portfolio, watchlist, opportunities, brief), screenshot the response envelopes into `docs/qa/2026-08/`.
  - Any shape mismatch → open an issue with the mock file + the Resource file so Khillon can adjust the Resource. Don't unilaterally rename backend fields.
  - **No design work.** No new components, no CSS. Just prove the shape.

- [ ] **Full 5-check baseline daily**, target 100% green all 5 checks by Friday 2026-08-07.

- [ ] **Deviation log** — anything I built that diverged from the Backend Build Plan v1.1 goes into the tracker's "Documented Deviations" section with a rationale line.

**End-of-week deliverable:** Phase F backend fully shipped, FE round-trip proven, 5-check baseline green, tracker fully up to date, PR into `main` for the sprint merge (per Khillon's Week 1 branch protection).

## 5. Non-negotiable rules (repeat before every commit)

**Stack (grant-locked, do not deviate):**
- Laravel 11 (PHP 8.3+) · Supabase Postgres + PostGIS (pooled :6543 app, direct :5432 migrations) · Sanctum SPA tokens (8h TTL) + email 2FA · Laravel Echo + Reverb · Mapbox GL JS 3.9 · React 18 + Vite 5 (NOT Next.js) · FastAPI (Python 3.13) for ingestion · Cloudflare DNS · Vercel AI Gateway for chat/embeddings.
- **Do-nots:** No Next.js, Rails, Django, MQTT, Go migration, premature abstractions, hypothetical feature flags, DB mocking in integration tests (Docker Postgres always).

**Coding:**
- Secrets from environment variables only. Never hardcode `VITE_MAPBOX_ACCESS_TOKEN` or any DSN.
- No inline role checks — Gates and Policies only.
- Thin controllers; business logic in `App\Services\*`.
- All migrations implement `up()` AND `down()`. Reversible or don't merge.
- No raw SQL except isolated, commented PostGIS spatial queries in a dedicated service/repository method.
- Consistent JSON envelope on every endpoint. RFC 7807 `application/problem+json` for errors.
- `ScoreCalculator` dispatched **only** as an async Laravel job — never from a controller.
- Nulls excluded from score averages — never zero-biased. Null pillars render `--`, not `0`.
- Conventional Commits, per-slice, push only when the 5-check baseline is green.
- Never add `Co-Authored-By: Claude` to commits. Commits show my name only.
- **Plan Mode** in Claude for anything ≥ 3 steps or with architectural tradeoffs. Stop and ask on ambiguity.

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

Additions for the AI workstream (not in scope this month, but keep them primed):
- `cd nuvola-atlas-ingestion && ruff check . && mypy . && pytest`
- Every new agent tool needs: a Policy test, a SqlGuard/allow-list test, and an `agent_steps` logging assertion. (Phase I, not this month.)

## 7. Coordination points

| Who     | When            | What I need from them                                                                       |
|---------|-----------------|---------------------------------------------------------------------------------------------|
| Khillon | Week 1 handoff  | Confirm async job event payload shape matches his `ZoneScoreUpdated` broadcast expectation. |
| Khillon | Week 2 handoff  | Confirm `firm_users.role_within_firm` enum values match his `FirmService` role model.       |
| Khillon | Week 3 handoff  | `firm.scope` middleware shipped so I can wire `/investor/me` behind it.                     |
| Khillon | Week 4          | `FirmService` + `WatchlistService` shipped so my routes can call them.                      |
| Devyan  | Week 2          | Confirm `data_feed_status.feed_name` enum matches the Daystar indicator spec keys.          |
| Devyan  | Week 4          | Together on the E2E telemetry sweep — I hit the routes, he hits the ingestion path.         |
| Joy     | Week 1 async    | Any Daystar delivery movement — if the block lifts, I re-prioritize toward Phase B intake.  |

Post daily standup snippets to `#navuuna-backend` Slack. Blockers escalated same-day, no waiting.

## 8. Blockers & escalation

- **Backend host not live yet (Phase A remainder, Khillon).** Doesn't block my migrations (Docker Postgres locally). Does block my Week 4 FE round-trip against production. If Forge+DO deploy hasn't happened by end of Week 3, I do the Week 4 round-trip against staging Fly.io instead and note the deviation.
- **AI Gateway billing not yet confirmed.** Doesn't affect Phase E/F. `USE_MOCK_CHAT` gate stays on.
- **Daystar data still not arriving.** Doesn't affect my Phase E/F work — I'm building against seed fixtures. If the block lifts mid-sprint, I re-prioritize the async ScoreCalculator wrapper (Week 1) as the critical path and push Phase E migration order out one week.

## 9. Where to find everything

- **Live tactical status:** `tasks/todo.md` (updated per-slice).
- **Authoritative phase state:** `Navuuna Build Phases.txt` (checkboxes).
- **Backend architecture + full task ledger:** `docs/archive/Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf`.
- **API contract:** `docs/api/openapi.yaml`.
- **Data contract:** `nuvola-atlas-frontend/src/types/index.ts`.
- **Ops runbooks:** `docs/ops/` — deploy, rollback, incident, secret-rotation, postmortem template.
- **This sprint's team MDs:** `tasks/team/week-01/` — my copy is `austine.md`; Khillon's and Devyan's copies are the ones I hand off to them.

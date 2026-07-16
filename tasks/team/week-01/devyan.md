# Devyan — Backend Sprint Plan (Week 01)

**Owner:** Devyan Jethwa (CTIPSO) · **Week:** 2026-07-16 → 2026-07-22 (Week 1 of a 4-week backend push)
**Full window:** 2026-07-16 → 2026-08-12 · **Shape:** 3 build weeks + 1 test week
**Companion docs:** `Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf` (root of repo), `Navuuna Build Phases.txt`, `tasks/todo.md`, `docs/architecture.md`, `docs/data/daystar-indicator-spec.md`, `docs/data/internal-transport.md`

> **Authority chain (unchanged).** `Navuuna Build Phases.txt` (tracker) > `Backend Build Plan v1.1` (PDF) > this MD > codebase. Where the codebase drifts from the docs, the codebase wins and the deviation is logged in the tracker under "Documented Deviations". Do not delete or overwrite the tracker — only flip checkboxes and update the `Last updated` / `HEAD` lines.

---

## 1. Who you are on this sprint (context that carries you across weeks)

You're the CTIPSO on the Navuuna Atlas team at Strathmore University. Your grant-proposal scope is the technical architecture, infrastructure strategy, product roadmap, and security. In practice that maps to owning the FastAPI ingestion service (`nuvola-atlas-ingestion/`), the Python→PHP handshake (`X-Internal-Secret`), the ML models (Phase G — not in scope this month), the n8n automation layer (Phase J — workflow #1 pulled forward), and the cross-service security posture. For this 4-week window we're compressing the backend push:
- **Weeks 1–3:** build.
- **Week 4:** test — the whole team runs the 5-check baseline end-to-end and closes any regression.

Team roles you coordinate with weekly:
- **Khillon** — Lead Programmer, owns the Laravel core. Your handshake is the `X-Internal-Secret` header contract, the `POST /api/v1/ingest` route on his side, and the `data_ingestion_logs` write shape.
- **Austine** — Frontend programmer, this month covering backend (Phase E migrations + Phase F investor routes) to unblock Khillon. His work is upstream of yours only where the Phase F `/investor/opportunities` route will eventually consume the `Opportunity Ranker` (Phase G — not this month).
- **Joy** — Operations Lead + HR, drives Daystar University coordination. Every conversation with Daystar goes through her.
- **Ken** — Finance + Policy, owns methodology paper + legal/IP.

## 2. What Navuuna is (single paragraph, for anyone reading cold)

Navuuna Atlas is a spatial intelligence platform for Nairobi County. It computes a **Vitality Score** (0–100) for 17 sub-counties from **13 indicators** grouped into **4 equally-weighted pillars (0.25 each):** Social Wellbeing & Human Capital · Safety & Security · Density & Scaling Dynamics · Infrastructure & Environmental Safeguards. Data flows Daystar University → FastAPI ingestion (Pydantic validation + WGS84/ISO-8601 cleaner + statistical anomaly detector) → Laravel `/ingest` (`X-Internal-Secret`) → Supabase Postgres+PostGIS → async ScoreCalculator job → Reverb WebSocket → live Mapbox map. Frontend is React 18 + Vite 5 (NOT Next.js). Grant target: KES 1,000,000 over 12 months. Pilot deliverable: functional Atlas + Scorecard + ≥ 2 partner LOIs + methodology paper.

## 3. Where the codebase is today (2026-07-16) — grounded audit

**Active phase:** Phase B — blocked on Daystar delivery. Ingestion scaffold complete on our side; external data has not started.

**Ingestion service state (audit of `nuvola-atlas-ingestion/` on 2026-07-16):**
- `app/main.py` — FastAPI entry point with Sentry SDK init (DSN-gated: `if settings.sentry_dsn`, `traces_sample_rate=0.1`, `send_default_pii=False`). Ready for Vercel Fluid Compute deploy.
- `app/config.py` — pydantic-settings config loader.
- `app/security.py` — `require_internal_secret` FastAPI dependency using `hmac.compare_digest`. Rejects empty/mismatched headers with 401. **Already implemented — the handshake exists in code, needs a formalized contract doc with Khillon.**
- `app/routers/health.py` + `app/routers/ingest.py` — health check and intake routers registered.
- `app/services/data_cleaner.py` — WGS84 coordinate harmonization + ISO 8601 UTC timestamps + null-row drops.
- `app/services/anomaly_detector.py` — statistical z-score spike blocker (TF/PyTorch deferred per Phase B scaffold).
- `app/models/indicators.py` — Pydantic models for the indicator payload.
- `pyproject.toml` — Python 3.13/3.14, FastAPI ≥ 0.115, pydantic ≥ 2.9, `sentry-sdk[fastapi]`. **`ruff`, `mypy`, `pytest`, `pytest-asyncio` already configured** in `[project.optional-dependencies].dev`; ruff select is `E,F,I,N,UP,B,SIM,RUF`; mypy is strict + pydantic plugin. **You need to RUN these + fix any findings, not configure them.**
- `tests/` — `test_anomaly_detector.py` + `test_data_cleaner.py` shipped.

**Docs shipped in `docs/data/`:**
- `daystar-indicator-spec.md` — **titled "12-Indicator"** as of 2026-07-10 but the codebase now carries 13 indicators (Backend Build Plan §5.1). **The spec needs updating to 13 before you hand it to Joy.**
- `internal-transport.md` — DRAFT status. Contract: 48+ byte base64 token, raw value in header, `hmac.compare_digest` on both sides. Ready for formalization with Khillon.

**Phase A remainders (your queue):**
1. Validate and provision the FastAPI service's target architecture — Vercel Python Fluid Compute as blueprint.
2. Formulate a dedicated ingestion Sentry target and map independent keys.
3. Build the Docker Compose orchestrator tying local engines together (FastAPI + Laravel + PostGIS + Reverb + Nginx). Current backend `docker-compose.yml` covers Postgres only.

**Phase B remainders (your queue):**
- Formalize internal transmission signatures with Khillon: `X-Internal-Secret` tokens, validation parameters, error fallbacks, retry limits.
- Supply spec copies to Joy for coordination with Daystar.
- Evaluate Daystar capabilities vs. platform requirements; register coverage limits and integration holes.
- Feed deficit lists to Khillon so he can calibrate partial-scoring around field realities.
- Initialize granular intake jobs as streams clear validation — do not wait for full rollouts.
- Add ruff + mypy config to the ingestion pipeline (**config already in `pyproject.toml`** — need to run + fix findings + wire into CI).
- Enforce automated cron scheduling for intake parsing scripts.
- Run the full end-to-end telemetry sweep: Daystar → FastAPI → Laravel → PostGIS → WebSocket → live screens.

**Phase C remainders (your queue):**
- Ingestion spend guards so a runaway background job cannot exhaust the API budget.

**Phase J workflow #1 pulled forward** — n8n Daystar drop intake, PULLED FORWARD of everything else because it attacks the project's critical-path risk today (Backend Build Plan §19.1 note).

**Phase G (ML models):** entry gate is Phase B streaming ≥ 1 pillar of real data + `zone_score_snapshots` accumulating history. **NOT in scope for this month.** `Forecast/ZoneScoreForecaster` service already exists on the Laravel side (2026-07-09) with mock projections — Phase G replaces the mocks with real FastAPI-served models. Do not start Phase G work until Daystar starts flowing.

**Deviation to note in the tracker:**
- `daystar-indicator-spec.md` title/body says 12 indicators; codebase carries 13. Update the spec title + body before Week 1's Joy hand-off.

## 4. Your 4-week schedule

**Working principle:** you own the **ingestion + infra + automation** tier. Khillon owns the Laravel service layer. Austine owns the migrations + Phase F routes. Handshake weekly with Khillon on Phase B contracts and with Joy on Daystar coordination.

### Week 1 · 2026-07-16 → 2026-07-22 — Close Phase A + fix the Daystar spec

**Goal:** get the ingestion service to a shippable production posture and correct the spec before Joy carries it to Daystar.

- [ ] **Phase A #1 — Validate and provision FastAPI target architecture (Vercel Python Fluid Compute)**
  - Create `nuvola-atlas-ingestion/vercel.json` with `functions` config for Python 3.13, `maxDuration: 300` (new default), region matching the Laravel Forge droplet (Frankfurt or Amsterdam depending on droplet).
  - Add `nuvola-atlas-ingestion/api/index.py` if needed as the Vercel Fluid Compute entry point (wraps `app.main:app`).
  - Deploy to a Vercel preview URL. Confirm `/api/health/ingestion` returns 200.
  - **DoD:** preview URL responds; cold-start latency documented in `docs/ops/`.

- [ ] **Phase A #2 — Ingestion Sentry target**
  - Create a third Sentry project `navuuna-ingestion` (Khillon owns the frontend + backend projects, you own this one).
  - Set `INGESTION_SENTRY_DSN` in Vercel env for the ingestion service. Sentry init in `app/main.py` is DSN-gated — it turns on automatically once the env var is set.
  - **DoD:** a deliberate test exception in the ingestion service surfaces in the correct Sentry project inside 60s. Update `.env.production.example` (var name only, never value).

- [ ] **Phase A #3 — Docker Compose orchestrator**
  - Extend the backend's `nuvola-atlas-backend/docker-compose.yml` OR create a top-level `docker-compose.dev.yml` that ties together: Postgres+PostGIS (already present), Laravel (`nuvola-atlas-backend` via its `Dockerfile`), FastAPI (`nuvola-atlas-ingestion` — needs a Dockerfile), Reverb (spawned inside the Laravel container as a supervisord process), Nginx (front proxy).
  - Add `nuvola-atlas-ingestion/Dockerfile` — Python 3.13-slim base, `uvicorn app.main:app --host 0.0.0.0 --port 8001`.
  - Document `docker compose -f docker-compose.dev.yml up` in `docs/team-setup.md` as the "one-command dev stack" path.
  - **DoD:** fresh clone → `docker compose up` → all services healthy on 5173 (FE dev), 8000 (Laravel), 8001 (FastAPI), 5434 (Postgres). Reverb WebSocket connects.

- [ ] **Phase B — Update `daystar-indicator-spec.md` to 13 indicators**
  - Fix title from "12-Indicator" → "13-Indicator".
  - Verify every indicator in Backend Build Plan §5.1 has a spec section: healthcare_access, education_access, digital_connectivity, crime_rates, emergency_response_access, disaster_exposure, population_density, congestion, housing_pressure, road_quality, energy_reliability, food_risk, waste_management (13 total; Pillar 4 has four).
  - Each entry needs: unit, resolution (zone-level vs point-level), cadence, spatial anchor requirement, acceptable value range for the anomaly detector.
  - **DoD:** spec is 13-indicator, checked in, delivery to Joy scheduled for end of Week 1.

- [ ] **Phase B — Formalize `X-Internal-Secret` contract with Khillon**
  - Move `docs/data/internal-transport.md` from DRAFT to FORMAL. Include: HMAC-SHA256 payload signing on top of the shared header (so replay attacks are caught even if the header leaks), retry limits (3 attempts, exponential backoff at 1s/4s/16s), error envelope shape when the header is rejected (RFC 7807 problem+json).
  - Coordinate with Khillon on the Laravel-side middleware (`EnsureInternalSecret`).
  - **DoD:** both sides use the same header + payload-signing scheme; contract test in each service asserts a valid request + a tampered request (should 401).

**End-of-week deliverable:** Vercel Fluid Compute preview live, dedicated Sentry project active, Docker Compose orchestrator running end-to-end, Daystar spec updated to 13 indicators and delivered to Joy, `X-Internal-Secret` contract formalized.

### Week 2 · 2026-07-23 → 2026-07-29 — Ruff/mypy + cron + spend guards

**Goal:** harden the ingestion service for real production traffic.

- [ ] **Ruff + mypy full-repo run + fix findings**
  - `cd nuvola-atlas-ingestion && ruff check .` — fix every finding. Config is already in `pyproject.toml` (line-length 100, `select = ["E","F","I","N","UP","B","SIM","RUF"]`).
  - `cd nuvola-atlas-ingestion && mypy .` — fix every finding. Config is strict + pydantic plugin.
  - Add `.github/workflows/ingestion-ci.yml` — GitHub Actions workflow running `ruff check .`, `mypy .`, `pytest` on every PR. Required in branch protection (coordinate with Khillon so his branch-protection rule includes this).
  - **DoD:** ruff clean + mypy clean + `pytest` green. CI job enforces on `main`.

- [ ] **Cron scheduling for intake parsing scripts**
  - Add a `scheduler` role to the FastAPI service — either APScheduler embedded in the FastAPI process OR a separate Vercel Cron job hitting a `POST /internal/scheduler/tick` endpoint (preferred — Vercel Cron is native and idempotent).
  - Schedule: hourly indicator poll from Daystar's advertised endpoint (once Daystar delivery starts), daily anomaly-detector re-fit against the accepted historical window.
  - Idempotency: every scheduled run writes a row into an in-memory dedupe cache (`payload_hash` = SHA-256 of the request) so duplicate crons don't double-post to Laravel.
  - **DoD:** cron config in `vercel.json` (or `vercel.ts`), documented in `docs/data/internal-transport.md`.

- [ ] **Phase C — Ingestion spend guards**
  - Rate limit per Daystar batch: max 10 MB payload, max 5000 rows per batch.
  - Circuit breaker on outbound Laravel calls: after 3 consecutive 5xx from Laravel, back off 60 seconds. Emit a Sentry breadcrumb.
  - Daily budget guard: track total outbound-request count in a lightweight in-process counter; if daily count exceeds `INGESTION_DAILY_BUDGET` env var (default 100k), refuse new requests with 429 + Sentry breadcrumb.
  - **DoD:** unit tests for each guard; each guard emits a distinct Sentry breadcrumb category so ops can distinguish.

- [ ] **Feed deficit lists to Khillon**
  - Read the Daystar spec + Daystar's actual coverage (Joy will tell you which of the 13 indicators Daystar can deliver in Phase B and which are gaps).
  - Produce a table: indicator | Daystar coverage | first delivery ETA | gap owner (partner search).
  - Feed to Khillon so he can calibrate `ScoreCalculator::missingIndicators` UI messaging and the "N of 13 indicators active" chip.

**End-of-week deliverable:** ruff+mypy clean, ingestion CI enforcing, cron shipped, spend guards live, Khillon has the deficit list.

### Week 3 · 2026-07-30 → 2026-08-05 — n8n Daystar drop intake

**Goal:** land the automation workflow that unblocks Daystar delivery mechanics.

- [ ] **n8n self-hosted deploy**
  - Docker container on the same DigitalOcean box Khillon deploys Laravel to (add a service to the docker-compose orchestrator from Week 1). Behind Cloudflare Access — **never publicly exposed**.
  - Persist workflow state to a dedicated Postgres schema (`n8n` schema on the same DB, isolated from `public`).
  - Repo-versioned workflow JSON at `infra/n8n/` (create the directory).
  - **DoD:** n8n dashboard reachable via Cloudflare Access; workflow JSONs are round-tripped through git.

- [ ] **Phase J workflow #1 — Daystar drop intake** (Backend Build Plan §17.3 #1)
  - Trigger: watch a drop channel (email attachment via IMAP node OR shared-drive webhook — coordinate with Joy on Daystar's actual delivery mechanism).
  - Step 1: validate filename against `daystar-indicator-spec.md` naming rules.
  - Step 2: POST to FastAPI `/api/v1/ingest` with `X-Internal-Secret` header (dedicated "automation" credential — Khillon mints a Sanctum API key for this, tag it `automation`).
  - Step 3: capture FastAPI response envelope (validation summary + "N of 13 indicators active" delta).
  - Step 4: post the summary to Slack `#data-feeds`.
  - Idempotency: `payload_hash` in `automation_runs` (schema deferred — Phase J proper adds the table; for now log to a JSON file in the n8n workflow storage).
  - **DoD:** dry-run with a synthetic Daystar-shaped payload arrives in Slack; production wire-up depends on Joy confirming Daystar's actual delivery mechanism.

- [ ] **Update `docs/architecture.md`** with the n8n block in the topography (Ingestion → Laravel → PostGIS is now flanked by n8n as the automation glue).

**End-of-week deliverable:** n8n live behind Cloudflare Access, workflow #1 shipped with dry-run proof, architecture doc updated.

### Week 4 · 2026-08-06 → 2026-08-12 — TEST WEEK · E2E sweep + hardening

**Focus flips from build to validation.**

- [ ] **End-to-end telemetry sweep** (Phase B critical-path deliverable)
  - Path: synthetic Daystar drop → n8n workflow #1 → FastAPI `/api/v1/ingest` → Laravel `POST /api/v1/ingest` → `data_ingestion_logs` write → `RecalculateZoneScore` dispatched → Reverb broadcast on `zones.{id}` → FE map updates.
  - Time every hop. Capture timings in `docs/ops/e2e-telemetry-2026-08.md`.
  - **DoD:** synthetic drop arrives on FE map inside the target SLA (< 30 s end-to-end). Any hop over 5 s is documented as a hot spot.

- [ ] **Full ingestion test suite green**
  - `cd nuvola-atlas-ingestion && ruff check . && mypy . && pytest` — all three green.
  - Add tests for the Week 2 spend guards + Week 3 cron scheduler.
  - **DoD:** ingestion CI job green on `main`; branch protection includes it.

- [ ] **Docker Compose orchestrator verification**
  - Fresh clone → `docker compose -f docker-compose.dev.yml up` → the 4-check baseline (frontend + backend halves) runs green inside the compose stack, not just against local installs.
  - **DoD:** documented in `docs/team-setup.md` as the recommended dev path for new contributors.

- [ ] **Pen test scope coordination with Khillon**
  - Backend Build Plan §11 Phase C item — Strathmore Info Sec Club simulated attack across both codebases. Scope this week: agree the scope, get Info Sec Club dates, prepare the test target (staging preferred; not production).
  - Include the AI Gateway path in scope (SqlGuard + text-to-SQL bypass attempts) even though the mock gate is on — the surface exists.

- [ ] **Ingestion validation + pipeline architecture docs + health diagnostics for the board** (Phase D remainder pre-work)
  - Update `docs/architecture.md` with any drift from the Week 1–3 work.
  - Update `docs/ops/deploy.md` with the ingestion Vercel deployment steps.
  - Prepare a one-page ingestion health diagnostic PDF for the eventual board sign-off.

**End-of-week deliverable:** E2E sweep verified, ruff+mypy+pytest green, Docker Compose orchestrator verified, pen test scoped, ingestion docs current.

## 5. Non-negotiable rules (repeat before every commit)

**Stack (grant-locked):** FastAPI (Python 3.13/3.14) · pydantic 2 · uvicorn · sentry-sdk · httpx. Deploy target Vercel Python Fluid Compute (Node.js 24 LTS is the current Vercel default; Python runs alongside).

**Do-nots:** No Rails, Django, MQTT, Go migration, premature abstractions, hypothetical feature flags. **No TF/PyTorch until Phase G entry gate opens** (Daystar streaming ≥ 1 pillar of real data). No ML libraries in the ingestion service until then — the statistical anomaly detector stays as the shipped baseline.

**Coding:**
- Secrets from environment variables only. Never inline in code.
- `X-Internal-Secret` is the only accepted auth for internal FastAPI→Laravel calls. Anything else is a 401.
- Ruff select `E,F,I,N,UP,B,SIM,RUF`; mypy strict + pydantic plugin. No `# type: ignore` without a comment explaining why.
- Every intake path has an idempotency check (`payload_hash` dedupe).
- Every scheduled/cron path has a spend guard.
- Never mock the database in integration tests — Docker Postgres always.
- Conventional Commits, per-slice, push only when the 5-check baseline is green.
- Never add `Co-Authored-By: Claude` to commits.
- Plan Mode in Claude for anything ≥ 3 steps or with architectural tradeoffs. Stop and ask on ambiguity.

## 6. Definition of Done — the 5-check baseline (+ ingestion additions)

Run after every meaningful slice. Nothing merges to `main` until all 5 are green.

```
1. cd nuvola-atlas-frontend && npx tsc --noEmit
2. cd nuvola-atlas-frontend && npx vite build
3. cd nuvola-atlas-frontend && npx vitest run
4. cd nuvola-atlas-backend && php artisan route:list --path=api
5. cd nuvola-atlas-backend && php vendor/phpunit/phpunit/phpunit --no-coverage
   # Requires `docker compose up -d postgres` from the backend directory.
```

Ingestion additions (Phase B remainder from Backend Build Plan §9):
```
6. cd nuvola-atlas-ingestion && ruff check .
7. cd nuvola-atlas-ingestion && mypy .
8. cd nuvola-atlas-ingestion && pytest
```

Every new ingestion endpoint has: a contract test (payload shape + `X-Internal-Secret` guard), an idempotency test (duplicate `payload_hash` no-ops cleanly), and a spend-guard test.

## 7. Coordination points

| Who     | When            | What you need to align on                                                                             |
|---------|-----------------|-------------------------------------------------------------------------------------------------------|
| Khillon | Week 1 daily    | `X-Internal-Secret` contract — HMAC-SHA256 payload sign, retry limits, error envelope shape.          |
| Khillon | Week 1 handoff  | `POST /api/v1/ingest` route shape — what payload it expects, what response envelope it returns.       |
| Khillon | Week 2 handoff  | Deliver the "feed deficit list" (indicator × Daystar coverage × gap owner) so he can calibrate the UI. |
| Khillon | Week 3          | n8n needs a dedicated Sanctum API token (`automation` tag) from Khillon — coordinate mint + rate-limit override. |
| Khillon | Week 4          | Together on the E2E telemetry sweep + pen test scope coordination.                                     |
| Joy     | End of Week 1   | Hand off the corrected 13-indicator Daystar spec. Joy carries it to Daystar admin.                    |
| Joy     | Week 2 async    | Any Daystar delivery-mechanism confirmation (email attachment vs. shared drive webhook) — you need this for n8n workflow #1. |
| Austine | Week 4          | If time permits, review Austine's `/investor/opportunities` route to make sure it's ready to consume a real ranker when Phase G opens. No code from you yet. |

Post daily standup snippets to `#navuuna-backend` Slack. Blockers escalated same-day.

## 8. Blockers & escalation

- **Daystar delivery still not started.** This is the single largest schedule risk in the project (Backend Build Plan §11 risk register — "Critical" severity). Your Week 3 n8n workflow #1 attacks the mechanics of the drop; it does not summon the data itself. If Daystar delivery slips past the end of the sprint, Phase B stays open into the next month and Phase G's entry gate stays closed. Escalate delivery movement through Joy.
- **Vercel Python Fluid Compute** — new-ish deploy target. If you hit shape issues, the Backend Build Plan blueprint says validate first, provision second. Do not push the ingestion service to production until the Vercel preview URL is stable for 48 hours.
- **n8n on the same DO droplet as Laravel** may compete for RAM. Monitor after Week 3 deploy; if RAM is tight, split n8n onto its own small Fly.io app (per Backend Build Plan §17.1). Not a blocker if Laravel has headroom.

## 9. What's NOT in scope this month (do not start these)

- **Phase G — ML Layer.** Entry gate is Phase B streaming ≥ 1 pillar of real Daystar data + `zone_score_snapshots` accumulating history. Do not build the Vitality Forecaster, anomaly_detector v2 (IsolationForest), Opportunity Ranker, or Data Quality Classifier until then. Note that a mock `Forecast/ZoneScoreForecaster` service already exists on the Laravel side (2026-07-09) — leave the mock in place.
- **Phase H — RAG.** Entry gate is unstructured documents actually existing in the system (Phase E CMS content + published reports + Daystar spec + partner docs). Not yet.
- **Phase I — Agentic chatbot & background agents.** Depends on Phase E Gates/Policies + `audit.write` middleware (Khillon's Week 2 work) + AI Gateway billing confirmed. Not yet.
- **Automation workflows #2–#6.** Only workflow #1 is pulled forward. The rest wait for their phase dependencies (Backend Build Plan §19.1).

## 10. Where to find everything

- **Live tactical status:** `tasks/todo.md` (updated per-slice).
- **Authoritative phase state:** `Navuuna Build Phases.txt` (checkboxes).
- **Backend architecture + full task ledger:** `Navuuna_Backend_Build_Plan_v1.1_COMPLETE.pdf` (root of repo).
- **System topography (yours to keep current):** `docs/architecture.md`.
- **Daystar data contract:** `docs/data/daystar-indicator-spec.md` (update to 13 indicators Week 1).
- **X-Internal-Secret contract:** `docs/data/internal-transport.md` (formalize Week 1).
- **Ops runbooks:** `nuvola-atlas-backend/docs/ops/` — `deploy.md`, `rollback.md`, `incident-response.md`, `secret-rotation.md`, `postmortem-template.md`.
- **This sprint's team MDs:** `tasks/team/week-01/austine.md` · `khillon.md` · `devyan.md` — regenerated weekly by Austine.

## 11. Handover contract

Every merged PR this sprint must:
1. Flip the matching tracker checkbox to `[x]`.
2. Update `Last updated` and `HEAD` lines in `Navuuna Build Phases.txt`.
3. Update `tasks/todo.md` status snapshot.
4. Log any deviation from the Backend Build Plan v1.1 in the tracker's "Documented Deviations" section with a one-line rationale.

If it doesn't do those four things, it doesn't merge — even if the code is perfect. The tracker is the memory of the sprint.

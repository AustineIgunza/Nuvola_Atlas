# Navuuna — Execution Plan

_Owner: Austine Igunza (frontend; currently also covering Khillon's Laravel backend)._
_Backend: Khillon (Laravel core, services, admin routes) · Devyan (FastAPI ingestion, n8n, infra)._
_Last updated: 2026-08-16 · HEAD `8b7c694`._

Verified baseline at this HEAD, not remembered: **72** API routes · **247** backend
tests / 1127 assertions · **25** frontend tests · `tsc --noEmit` clean · `vite build`
green. Run the five checks yourself before trusting any number in this file.

> This file is the live tactical plan. `Navuuna Build Phases.txt` is the
> phase-level tracker for the whole team, and it wins on scope questions.
> Where either disagrees with the codebase, the codebase wins.
>
> The previous version of this file carried a 300-line log of finished work.
> That is what `git log` and the tracker's `[x]` marks are for, and keeping a
> third copy by hand is how all three drifted. Removed deliberately.

---

## Where we actually are

The platform is built. A 2026-08-16 audit against the live codebase found that
Phases E and F — carried for weeks as "signed off, build pending" — were in fact
shipped and test-covered on both ends: every migration, service, route, seeder,
and the full ten-tab admin console.

So the honest statement of risk has changed. It is no longer *"can we build
it."* It is:

1. **We have never run on real data.** Every score on screen traces back to
   fixtures. The ingestion channel is provably correct end to end
   (`php artisan nuvola:ingest-smoke`) but has never carried a Daystar byte.
2. **We have never run in production.** The Supabase half is further along than
   this file previously claimed: the project exists, PostGIS 3.3 is installed,
   and the app schema is live — local dev already points `DB_HOST` at it. What
   is missing is the application tier (DO droplet via Forge) and a migration
   ledger that matches the repo. See A0.
3. **The operational tail is thin.** No pen test, no alerting destination, no
   restore drill, no object storage decision.

Everything below is ordered against those three.

---

## Track A — code, doable now, nothing blocking

Ordered. Do them top-down; each is a slice ending in a commit and a green
five-check baseline.

### A0. Reconcile the Supabase migration ledger — **do first**
`migrate:status` against Supabase reports two pending migrations, and they are
pending for two different reasons:
- `2026_07_17_153850_create_data_ingestion_logs_table` — the table **already
  exists** in the database but has no row in `migrations`. A plain
  `php artisan migrate` will abort on "relation already exists".
- `2026_08_16_000001_add_spatial_index_rollup_and_payload_retention` — genuinely
  never applied. The GIST index, the county rollup matview and the payload
  retention trigger are absent in Supabase, so proximity queries there are still
  sequential scans and the KDPA redaction path does not exist.

- [ ] Establish how `data_ingestion_logs` was created outside the ledger before
      writing anything — an out-of-band schema change is the thing that makes
      every later migration untrustworthy.
- [ ] Reconcile with `migrate --pretend` first, then insert the missing ledger
      row (or re-run the migration against a scratch branch) — do not guess.
- [ ] Apply `2026_08_16_000001` and verify the matview refreshes concurrently.
- [ ] Then decide whether prod migrations run from Forge deploy hooks or by hand.
      Right now nothing runs them, which is why the drift went unnoticed.

### A1. Close the firms tab's inert controls
The admin Firms tab renders member management and watchlist bulk edit, but
`/admin/firms/{id}/users` and `/admin/firms/{id}/watchlist` do not exist. The UI
calls into nothing. This is the only place in the app where a control lies to
the person clicking it, which makes it the worst defect we currently carry.
- [ ] `POST /admin/firms/{id}/users` + `DELETE /admin/firms/{id}/users/{userId}`.
      `FirmService` already owns the membership transitions — this is routes,
      a FormRequest and a policy check.
- [ ] `PUT /admin/firms/{id}/watchlist` for the bulk edit.
- [ ] Feature tests including the cross-firm leakage case.
- [ ] If any of the above is deferred, hide the control rather than leaving it wired to nothing.

### A2. Regenerate the OpenAPI spec
`docs/api/openapi.yaml` describes 17 of 72 routes and carries a banner saying
so. A partner integration will start from this file, so a spec covering a
quarter of the surface is worse than none.
- [ ] Regenerate against `route:list`, covering chat/RAG, investor, admin,
      methodology, feeds, forecast, export, 2FA, Google OAuth, ingest and
      health-intake.
- [ ] Delete the banner in the same commit that makes it untrue.
- [ ] Decide whether generation belongs in CI. A spec that drifts is the
      problem we just spent a session fixing everywhere else.

### A3. Settle the rate limit
Tracker line 403 is checked and claims 600 req/min with a 100 burst.
`AppServiceProvider` implements `Limit::perMinute(60)`. One of the two is
wrong and nobody has decided which.
- [ ] Pick the number against expected partner API traffic, not against the
      tracker's wording.
- [ ] Implement, test the boundary, and correct whichever document is wrong.

### A4. Build the reports CMS
The only Phase E surface that genuinely does not exist. `extend_reports_for_cms`
shipped, so the schema is ready.
- [ ] `/admin/reports` routes: draft / publish / unpublish, honouring `firm_scope_id`.
- [ ] Admin tab UI alongside Content and Announcements.
- [ ] Scoping test: a firm-scoped report must not surface to another firm.

### A5. Flip the backend CI gate
`.github/workflows/ci.yml` still carries `continue-on-error` on the backend
phpunit job, from when the suite was red against the indicator schema. It is
247/247 green now, so the guard is protecting nothing and hiding regressions.
- [ ] Set `continue-on-error: false`.
- [ ] Confirm CI provisions Postgres + PostGIS the way `phpunit.xml` expects.

### A6. Object storage decision (Cloudflare R2 vs Vercel Blob)
Blocks nothing today because briefs are written to local disk, which does not
survive a Forge redeploy.
- [ ] Decide, write the reasoning into `docs/ops/deploy.md`.
- [ ] Point `FirmBriefExporter` and the export paths at it.

### A7. Devyan — ingestion tail
- [ ] Spend guards on the ingestion cron so a runaway job cannot drain the API budget.
- [ ] Confirm `ruff` + `mypy` + `pytest` green and wired into CI.
- [ ] Reconcile `docs/data/daystar-indicator-spec.md` against whatever Daystar
      last confirmed, so the template we hand them matches the validator.

---

## Track B — blocked on a human, not on code

None of these are engineering work. They are accounts, keys and clicks, and
each one blocks a chunk of Track C. Full detail lives in
[`docs/ops/CREDENTIALS-NEEDED.md`](../docs/ops/CREDENTIALS-NEEDED.md) — that
file is the ledger; this is the summary.

- [ ] **Provision the application tier** — DO droplet via Forge, `nuvola_app`
      role, env paste, deploy, smoke `/api/health`. The Supabase database is
      already provisioned with PostGIS 3.3 and the app schema, so this is the
      remaining half, not the whole job. *Unblocks: everything in Track C.*
- [ ] **Supabase AES-at-rest toggle.** *Unblocks: the KDPA compliance claim.*
- [ ] **Sentry DSNs** (backend + ingestion). *Unblocks: error tracking.*
- [ ] **GitHub branch protection on `main`.** *Unblocks: the CI gate meaning anything.*
- [ ] **Cloudflare DNS.**
- [ ] **`AI_GATEWAY_API_KEY` + `DB_CHAT_RO_*`.** *Unblocks: the assistant on
      real data; it currently runs on `USE_MOCK_CHAT`.*
- [ ] **Daystar feed URL + delivery schedule.** *Unblocks: the pilot.*
- [ ] **Alerting destination** — BetterStack or equivalent. Alerts are written
      but have nowhere to go.

---

## Track C — blocked on Daystar delivery

Do not start these before data lands; every one of them needs real rows to
mean anything.

- [ ] Flip `VITE_USE_REMOTE_API=true` + `VITE_API_BASE` on Vercel production.
- [ ] Swap the mock realtime pulse for the live Reverb subscription. One-line
      change inside `useLiveData` — replace `startMockPulse` with the Echo
      subscription on the same channel names.
- [ ] Retire `src/api/fixtures.ts` from the authenticated paths.
- [ ] Verify scoring authenticity end to end: real indicators in, correct
      nulls-excluded composite out, partial-data state shown honestly to the user.
- [ ] Confirm ingestion cadence matches whatever Daystar actually commits to,
      and set `expected_frequency_min` from that rather than from a guess.
- [ ] Ground-truthing pass — verify a sample of ingested values against
      physical reality. A spatial platform that has not checked its own data
      on the ground fails its core promise.

---

## Track D — hardening and QA

- [ ] **On-device verification (Austine).** Real Android + iPhone, portrait and
      landscape, every overlay and toggle. Capture recordings into `docs/qa/`.
      Needs physical handsets; no emulator substitute.
- [ ] **Pen test.** Scope with the Strathmore Info Sec Club. Both codebases.
- [ ] **Backups.** `atlas:backup-database` exists; multi-region transfer and a
      monthly restore drill do not. An untested backup is not a backup.
- [ ] **Load behaviour.** Nothing has been measured under concurrent load.
      Establish a number before a partner demo, not after.

---

## Track E — non-engineering

Owners are Ken and Joy. Tracked here only so engineering can see what it gates.

- [ ] **Entity registration** and IP assignment. Playbook:
      [`docs/legal/ip-and-entity-playbook.md`](../docs/legal/ip-and-entity-playbook.md).
      Gates: the copyright filing, the trademark filing, and any signed partner
      agreement.
- [ ] **Partner outreach** — 5-lead pipeline, convert ≥ 2 to signed LOIs (Objective 3).
- [ ] **Methodology paper** — submit for peer review (Objective 4).
- [ ] **Follow-on funding** — AfriLabs, Mozilla Technology Fund, GIZ Make-IT
      Africa, Konza, Hewlett.
- [ ] **KDPA data-handling SOP** and the consent banner, once the entity name
      and privacy policy are final.

---

## Definition of done

Every slice ends green across all five, and commits only after:

```bash
cd nuvola-atlas-frontend && npx tsc --noEmit
cd nuvola-atlas-frontend && npx vite build
cd nuvola-atlas-frontend && npx vitest run
cd nuvola-atlas-backend  && php artisan route:list --path=api
cd nuvola-atlas-backend  && php vendor/phpunit/phpunit/phpunit --no-coverage
# docker compose up -d postgres first — phpunit.xml force-overrides to
# 127.0.0.1:5434 and the suite hangs on a TCP timeout without it.
```

Ingestion changes add: `cd nuvola-atlas-ingestion && ruff check . && mypy . && pytest`.

A slice is also not done until its tracker checkbox is flipped **in the same
commit that ships the work**. The 2026-08-16 audit existed because that did not
happen, and two whole phases sat mismarked for weeks.

---

## Pilot-ready

A partner can:

1. Sign in.
2. See a live Atlas of Nairobi with road, energy and density layers driven by
   **real ingested data**.
3. Click any of the 17 sub-counties and get a Vitality score built from real
   indicator inputs.
4. Open the methodology panel and read how each number was computed and when
   it was last refreshed.
5. Export the scorecard as a PDF.
6. Trust that the data is refreshed on a schedule we have committed to in writing.

Five of those six work today against fixtures. The sixth has never been true.
If any of them still depends on `fixtures.ts` when we demo, we are not
pilot-ready — and the fix is not on this repo's side.

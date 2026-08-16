# Navuuna — post-audit remediation sprint

_Standing brief. Start a session with: "Read `tasks/remediation-sprint.md`. Do Phase 0 only."_
_(substitute whichever phase is next — one phase per session, in order.)_

You are working in the Navuuna monorepo (`nuvola-atlas-backend` Laravel,
`nuvola-atlas-frontend` React/Vite, `nuvola-atlas-ingestion` FastAPI).

## Ground rules

1. **The codebase is the source of truth.** `tasks/todo.md` and
   `Navuuna Build Phases.txt` have both drifted — several tasks below exist
   because those files were wrong. Verify every claim here against the code
   before acting. If a claim is wrong, say so and stop rather than "fixing"
   a non-problem.
2. **One task = one slice = one commit.** Do not batch. Run the five checks
   after each and confirm green before moving on.
3. **The five checks:**
   - `cd nuvola-atlas-backend && php vendor/phpunit/phpunit/phpunit --no-coverage`
   - `cd nuvola-atlas-backend && vendor/bin/phpstan analyse --memory-limit=512M`
   - `cd nuvola-atlas-frontend && npm run typecheck`
   - `cd nuvola-atlas-frontend && npm test`
   - `cd nuvola-atlas-frontend && npm run build`
4. **Do not touch `NuvolaAtlasPrototype.jsx`** — frozen design spec.
5. **Do not attempt Track B of `tasks/todo.md`** — credentials and human
   clicks, not code.
6. No new dependencies without saying why first.
7. **Recurring principle: no surface may state something it does not know.**
   Several tasks below are instances of this. If you find another while
   working, flag it rather than silently fixing or silently leaving it.

---

# PHASE 0 — DevOps foundation

Do this phase first. Everything after it is safer once these exist.

## Task 0.1 — CI is skipped on every pull request

**Problem.** In `.github/workflows/ci.yml`, all three jobs are gated on:

    contains(toJson(github.event.pull_request.changed_files), 'nuvola-atlas-backend')

`changed_files` in GitHub's pull_request payload is an **integer count**, not
a filename list. `toJson` yields `"7"`, the `contains` is always false, every
job skips on PRs. Only pushes to `main` run CI — after the code has landed.

**Verify:** confirm the `if:` blocks still look like this, then check any
recent PR's Checks tab for zero check runs.

**Do.** Replace the guards with `dorny/paths-filter@v3` feeding a `changes`
job the three jobs depend on, or native `on.pull_request.paths`. Keep
"pushes to `main` always run everything". Cover each service dir,
`.github/workflows`, and root `docker-compose*.yml`.

**Done when:** a frontend-only PR runs the frontend job and skips the other
two; a README-only PR runs none.

## Task 0.2 — ESLint + Prettier for the frontend

21k lines of TypeScript with no linter and no formatter. This is the largest
codebase in the repo and the only one with no style enforcement.

- Add ESLint flat config: `typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y`.
- Add Prettier. Match the existing house style rather than reformatting to
  taste — read a dozen files first and configure to minimise the diff.
- Scripts: `lint`, `lint:fix`, `format`, `format:check`.
- Run once. Commit the mechanical formatting pass **entirely separately**
  from any rule fix, so both diffs stay reviewable.
- Report the violation count by rule before fixing. Fix the auto-fixable,
  and for the rest tell me the count per rule — do not disable rules to get
  to zero.
- Add both as blocking CI steps in the frontend job.

## Task 0.3 — Correct the CI gate item (tracker A5 is wrong)

`tasks/todo.md` A5 claims `continue-on-error` sits on the backend phpunit
job. It does not — phpunit runs blocking at ~line 99. The two flags are on
**Pint** (line 104) and **PHPStan** (line 108).

- Run `vendor/bin/pint` repo-wide, commit formatting alone, then set
  `continue-on-error: false` on that step.
- Run PHPStan at the current level 5 and report the violation count first.
  Green → make it blocking. Not green → report the count and leave it
  informational. **Do not lower the level to pass.**
- Once green at 5, raise to level 6 and report what breaks. Do not fix yet.
- Rewrite A5 in `tasks/todo.md` to describe the actual steps.

## Task 0.4 — Repo hygiene

- `.github/pull_request_template.md`: what changed, which of the five checks
  were run, screenshots for UI, and a checkbox for "no surface now states
  something it does not know".
- `.github/CODEOWNERS` mapping the three service dirs to their owners per
  `README.md` (frontend: Austine, backend: Khillon, ingestion: Devyan).
- `CONTRIBUTING.md`: branch naming, the five checks, the commit convention
  already visible in `git log` (`feat(scope):`, `fix(scope):`, `docs(...)`).
- Root `Makefile` or `justfile` wrapping the five checks as `make check`,
  plus `make up` / `make fresh`. Three services with different toolchains
  makes this worth more than it usually is.
- `.editorconfig` matching the Pint and Prettier configs.
- Pre-commit hooks via Husky + lint-staged: Prettier and ESLint on staged
  frontend files, Pint on staged PHP, `ruff` on staged Python. Fast checks
  only — no test suites in the hook.
- `docs/ops/branch-protection.md`: exact settings to apply on `main` once
  Task 0.1 lands — required checks, no force-push, linear history, required
  review. This is a Track B click, but the document is code-side work.

---

# PHASE 1 — Stop the app stating things it does not know

## Task 1.1 — Fixture backfill in remote mode

`nuvola-atlas-frontend/src/api/remote.ts` — `hydrateZone()` runs on every
zone response in *remote* mode and backfills null pillars, deltas and
centroid from mock fixtures. The return spreads `...(mock ?? {})` as the
base, so an entire mock zone can show through with only real fields
overwritten. No badge, no null state, no warning.

`tasks/todo.md` names "we have never run on real data" as risk #1. This
function is what will stop anyone noticing. On a product whose whole value
is a trustworthy 0–100 Vitality Score shown to Daystar and to investors, a
synthesised pillar is indistinguishable from a measured one.

**Do — keep the crash-prevention, kill the silence.**
- Return `_hydrated: string[]` listing every synthesised field. Add it to the
  `Zone` type as optional.
- Drop the wholesale `...(mock ?? {})` spread. Backfill only null fields.
- `console.warn` once per response in remote mode, naming zone id + fields.
- Mark hydrated values visibly in the UI — dotted underline or glyph with a
  tooltip along the lines of "estimated — no measured data for this
  indicator". Start with `src/components/scorecard/` pillar bars and the
  zone list.
- Vitest: a response with null pillars must render the marker and populate
  `_hydrated` with the four pillar keys.

## Task 1.2 — System health panel reports fabricated telemetry

`src/components/admin/SystemHealthPanel.tsx` renders hardcoded strings —
"99.98% uptime · Fly.io ams", "8 ms p50 · Supabase pooler :6543" — as if
measured. Its own comment admits it is a mock. It is the operator console.

**Do.**
- Extend the backend `/api/health` (or add `/admin/system-health`, admin-only)
  to return real values: DB connectivity and p50 latency, queue depth,
  Reverb channel health, ingestion service reachability via
  `/api/health/intake`, last successful ingestion timestamp, migration
  status.
- Rewire the panel to that endpoint with TanStack Query and a sane refetch
  interval.
- Anything genuinely not measurable yet (30-day uptime needs an external
  monitor) renders as an explicit "not monitored" state — **never a number**.
- Feature test for the endpoint; vitest for the not-monitored state.

---

# PHASE 2 — Complete the admin console

Ten tabs exist. Audit, Users, API keys, Methodology and Data feeds are
genuinely API-backed. The rest are not.

## Task 2.1 — Firms tab (tracker A1 is inverted)

A1 claims the UI calls endpoints that don't exist. The opposite is true.
`routes/api.php` ~181–185 already exposes full CRUD via `AdminFirmController`.
`FirmsTable.tsx` calls none of it — it imports a hardcoded `FIRMS` fixture
from `src/api/firms.ts`, and "Create firm" is hard-`disabled` with a tooltip
saying the workflow "lands with the Phase E migrations", which shipped.

- Add firm methods to `src/api/admin.ts` against the real routes.
- Rewrite `FirmsTable.tsx` on TanStack Query. Enable create; add a modal
  consistent with `MintApiKeyModal.tsx`.
- `AnnouncementsManager.tsx` reads firm names from the same fixture — point
  it at the query.
- Member management and watchlist bulk edit have no backend. Add
  `POST/DELETE /admin/firms/{id}/users` and `PUT /admin/firms/{id}/watchlist`.
  `FirmService` already owns the membership transitions.
  **If you defer either, hide the control rather than leaving it inert.**
- Feature tests including cross-firm leakage.
- Delete `FIRMS` once nothing imports it.

## Task 2.2 — Content CMS is not wired to its own backend

`AdminContentController` exists with GET `/admin/content`, GET
`/admin/content/{key}`, PUT `/admin/content/{key}`. `ContentCms.tsx` calls
`contentBlocksApi`, which reads and writes `localStorage`. An admin edits
public copy, sees it save, and nothing reaches the server or any other user.

- Rewire `src/api/contentBlocks.ts` to the real endpoints.
- Preserve the revision-history and diff-preview UX. If the backend has no
  revisions table, add one — the UI already promises rollback.
- Feature test: save creates a revision; rollback restores.
- Remove the localStorage path entirely. No dual-mode.

## Task 2.3 — Announcements have no backend at all

`src/api/announcements.ts` is localStorage-only, including per-user
dismissal state. An announcement broadcast to a firm reaches exactly one
browser.

- Migration + model + `AdminAnnouncementController`: CRUD, `firm_scope_id`
  honoured, publish window, and a per-user dismissal pivot.
- Public read route for the banner; dismissal endpoint.
- Rewire `AnnouncementsManager.tsx` and the display banner.
- Scoping test: a firm-scoped announcement must not reach another firm.

## Task 2.4 — Reports CMS (tracker A4)

The only Phase E surface that genuinely does not exist. The
`extend_reports_for_cms` migration shipped, so the schema is ready.

- `/admin/reports`: draft / publish / unpublish, honouring `firm_scope_id`.
- Admin tab alongside Content and Announcements.
- Scoping test. Use the Policy from Task 4.1 rather than re-checking by hand.

## Task 2.5 — Admin console sweep

With the above done, walk **every** control in all ten tabs and confirm each
either performs a real server action or is visibly disabled with an honest
reason. Report a table: tab, control, backed / disabled / inert. Fix or hide
anything still inert. No control may lie to the person clicking it.

---

# PHASE 3 — Complete the investor suite

Backend for watchlist, portfolio, opportunities and brief exists
(`api.php` 153–160) and `InvestorPage.tsx` queries some of it. The
differentiated surfaces — the ones that make it an investor product rather
than a dashboard — are browser-local.

## Task 3.1 — Deal pipeline has no backend

`src/api/dealPipeline.ts` persists per-firm deals to `localStorage`. Stage
changes are invisible to colleagues, lost on cache clear, absent on mobile.
This is the core investor workflow.

- Migration + model + `InvestorDealController`: CRUD, stage transitions,
  `firm_scope_id`, `zone_id` FK.
- Transitions must be validated server-side against `DEAL_STAGES` — don't
  trust a client-supplied stage.
- Audit-log every stage change; the audit infrastructure already exists.
- Rewire `DealPipelineBoard.tsx` with optimistic updates.
- Tests: transition validation, cross-firm isolation, audit entry written.

## Task 3.2 — Zone notes have no backend

`src/api/zoneNotes.ts` is localStorage keyed by `(firmId, zoneId)`. These are
private investment thesis notes — the highest-value, least-recoverable data
in the product, and the most sensitive.

- Migration + model + routes scoped to the firm.
- Decide and document: firm-shared or author-private. The UI says "private
  thesis notes"; `firmSliceFor` implies firm-scoped. Resolve the ambiguity
  before writing the schema and record the decision.
- Rewire `ZoneNotesCard.tsx`.
- Test: a user from firm A cannot read, write or enumerate firm B's notes.

## Task 3.3 — Investor suite sweep

Same as 2.5, for `InvestorPage.tsx`, `ESGLensChip`, `WatchlistStar`,
`ZoneNotesCard`, `DealPipelineBoard` and the reports watchlist filter. Report
the table. Confirm the firm brief export actually produces a file end to end,
and note where it writes — local disk does not survive a redeploy (tracker
A6).

---

# PHASE 4 — Authorization and tests

## Task 4.1 — Object-level authorization

Zero `Policy` classes; zero `authorize()` / `Gate::` / `can()` calls across
31 controllers. Authorization is entirely middleware (`EnsureRole`,
`FirmScope`). That covers coarse role gates, but "can this user touch **this**
firm's record" then depends on every service method scoping its query by hand,
forever. Phases 2 and 3 add several new firm-scoped resources, which makes
this the moment to fix it.

- Policies for every firm-scoped model, including the ones added above.
- `$this->authorize()` in the corresponding actions. Keep `FirmScope` — they
  are complementary.
- One test per policy: a user from firm A gets **403**, not 404, not an empty
  list, on firm B's record.
- Report which models you covered and which you deliberately left out.

## Task 4.2 — Frontend test coverage

21k lines, 4 test files. Backend is 9.5k lines with 41. The largest,
most-changed, most-demoed codebase is the least tested.

- `src/pages/ComparePage.tsx` (784 lines) — comparison maths, empty and
  partial-data states.
- `src/hooks/useChatStream.ts` (641 lines) — stream assembly, abort/cleanup,
  error paths.
- Every surface rewired in Phases 2 and 3 gets a loading, error and empty
  state test.
- Behaviour tests, not snapshots. Split either file if needed to make it
  testable, and say so.

---

# PHASE 5 — Deploy and observability

## Task 5.1 — Harden the deploy workflow

`.github/workflows/deploy.yml` is `workflow_dispatch`-only, deploys the
backend only, and is a bare `git pull` with no verification and no way back.

- Add `php artisan down --render=...` / `up` around the migration step.
- Post-deploy smoke: curl `/api/health`, fail the job on non-200.
- **Automatic rollback** on smoke failure — capture the prior sha before
  pulling, reset to it and re-cache on failure. `docs/ops/rollback.md`
  describes this manually; make it automatic and update the doc.
- Add `php artisan view:cache`, `storage:link`, and an opcache reset.
- `queue:restart` only signals workers — confirm Supervisor or Horizon is
  actually managing them and document which.
- Separate jobs for frontend (Vercel) and ingestion so a deploy is one
  action, not three.
- Add a `staging` target and make production require an environment approval.

## Task 5.2 — Observability

`@sentry/react` is already a dependency.

- Confirm Sentry init exists on all three services; add where missing, gated
  on DSN presence so a missing DSN never breaks boot.
- Wire release tagging to the commit sha in the deploy workflow, and upload
  frontend sourcemaps via `@sentry/vite-plugin`.
- Structured request logging on the backend with a correlation id that
  survives the Laravel → FastAPI hop. The HMAC hop-2 signing exists; add the
  id alongside it.
- Ingestion spend guards on the cron so a runaway job cannot drain the API
  budget (tracker A7).
- Confirm `ruff` + `mypy` + `pytest` are green and blocking in CI.

## Task 5.3 — Dependabot backlog

Four Dependabot branches are open and unmerged, including a Sentry Laravel
bump. Once Task 0.1 makes PR CI real, review and merge or close each with a
reason. Report what you did with each.

---

# PHASE 6 — Docs and reconciliation

## Task 6.1 — Regenerate the OpenAPI spec (tracker A2)

`docs/api/openapi.yaml` covers 17 of ~72 routes and carries a banner
admitting it. A partner integration starts here, so a quarter-spec is worse
than none.

- Regenerate against `php artisan route:list`, including everything added in
  Phases 2 and 3.
- Delete the banner in the same commit that makes it untrue.
- CI step that regenerates and fails on diff. A drifting spec is the exact
  problem this sprint exists to end.

## Task 6.2 — Settle the rate limit (tracker A3)

`Navuuna Build Phases.txt` ~line 403 is checked and claims 600 req/min with a
100 burst. `AppServiceProvider.php:82` implements `Limit::perMinute(60)`.

- Pick against expected partner traffic, not the tracker's wording. State
  your reasoning.
- Implement, test the boundary (last allowed request, first 429), correct
  whichever document is wrong.

## Task 6.3 — Object storage decision (tracker A6)

Cloudflare R2 vs Vercel Blob. Briefs currently write to local disk, which
does not survive a Forge redeploy.

- Decide, write the reasoning into `docs/ops/deploy.md`.
- Point `FirmBriefExporter` and the export paths at it.

## Task 6.4 — Reconcile the trackers

Last.
- Correct A1, A3 and A5 in `tasks/todo.md` to what was actually true.
- Reconcile `Navuuna Build Phases.txt` against the code, not against
  `todo.md`.
- Re-derive the baseline numbers by running the commands, and record the HEAD
  sha they were measured at.
- Add a new risk line: the localStorage-backed surfaces are now server-backed,
  so "we have never run on real data" is the only remaining instance of the
  no-real-data risk.

---

## Report back

Per task: what you verified, what changed, what you deferred and why. Flag
anything where the code contradicted this prompt. For Phases 2 and 3, include
the control-by-control tables.

# Rollback Runbook

_Status: pre-pilot. Lives under `tasks/todo.md` §9.6._
_Last updated: 2026-06-08._

A rollback is reverting production to a known-good state when the current
release is broken and not fixable in a single forward commit. This document
covers what to roll back, how to roll it back, and how to tell when *not* to.

The decision is always: **forward fix or revert?** A forward fix that's
shipped in under 15 minutes is almost always better. A revert is the right
choice when the forward fix is uncertain, multi-file, or under pressure
during a partner demo or live incident.

---

## 1. Decision tree (use this first)

```
Is production serving wrong/broken responses?
├─ No  → not an emergency; fix in a normal PR.
└─ Yes → can you ship a one-line forward fix in < 15 min, with confidence?
         ├─ Yes → forward fix. Push to main. Forge auto-deploys.
         └─ No  → REVERT. Use §3 (frontend) or §4 (backend).
```

If you cannot answer the second question in under 60 seconds, **revert**.
Hesitation costs minutes that the dashboard is broken.

---

## 2. RTO targets

| Layer | Target time to recover | Method |
|-------|------------------------|--------|
| Frontend (Vercel) | **≤ 2 min** | Promote a previous Vercel deployment. |
| Backend (Forge) | **≤ 5 min** | Redeploy the previous green Forge deployment. |
| Database (Supabase) | **≤ 30 min** | Point-in-time restore + DB env swap. |
| Object storage (R2) | **Versioning + lifecycle** | Per-object restore from R2 versioning. |

The 4-hour API RTO declared in §9.12 is the worst case; the table above is
what we should hit in practice for everything that isn't a database loss.

---

## 3. Frontend rollback (Vercel)

The frontend is static + edge — a Vercel rollback is effectively instant
because we're just changing which build's HTML the edge serves.

**Steps:**
1. Open Vercel → `nuvola-atlas-frontend` project → **Deployments**.
2. Find the last deployment marked **Ready** and **Production** that was
   green before the regression landed. Note its commit SHA.
3. Click the `⋯` menu on that deployment → **Promote to Production**.
4. Confirm. New traffic hits the rolled-back build within seconds.
5. Open https://atlas.nuvola.dev in an incognito window — verify the page
   loads and the build banner (footer commit SHA, if visible) matches the
   promoted SHA.
6. In Slack/team channel: post the rolled-back SHA, the regression SHA,
   and a one-line summary. Open a `git revert <bad-sha>` PR within the
   hour so `main` reflects production.

**Note**: this does not roll back `main`. The repository still points at
the broken commit. Open a revert PR (`git revert <bad-sha>`) so the next
forward deploy doesn't re-ship the regression.

---

## 4. Backend rollback (Forge + DigitalOcean)

Forge keeps the last 5 deploys on the droplet under
`/home/forge/<site>/releases/`. Rolling back is a one-click operation
unless migrations are involved.

### 4.1 Code-only rollback (no schema change)

1. Open Forge → site → **Deployments** tab.
2. Find the last green deployment whose commit predates the bug.
3. Click the deployment → **Redeploy this Deployment**.
4. Watch the deploy script log; expect:
   - `composer install --no-dev` ≤ 60s
   - `artisan migrate` no-op (no new migrations to apply)
   - `artisan config:cache / route:cache / view:cache / event:cache`
   - `artisan queue:restart`, `reverb:restart`
   - php-fpm reload
5. Smoke: `curl https://api.atlas.nuvola.dev/api/health` → 200 + DB ok.
6. Smoke a real endpoint: `curl …/api/v1/zones | jq '. | length'`.
7. Open the admin dashboard → confirm the metric counters refresh.

### 4.2 Migrations were involved

If the bad release shipped a forward-incompatible migration (column
dropped, NOT NULL added, type narrowed), **a code-only Forge rollback
will leave the running app trying to read a schema that no longer
matches**. Two paths:

#### Option A — `migrate:rollback` is safe

If the offending migration's `down()` method is correct and the data it
produces is reversible (typical for additive migrations: `add column`,
`add index`, `create table`):

1. Forge → site → **SSH** → into the deploy.
2. `cd /home/forge/<site>`
3. `php artisan migrate:rollback --step=1` (or however many migrations
   the bad release added).
4. Re-deploy the previous green Forge deployment per §4.1.
5. Verify `php artisan migrate:status` shows the rolled-back migrations
   as pending.

#### Option B — `migrate:rollback` is unsafe (destructive `down`, or no `down`)

Treat the database as the source of truth and **restore the database to a
point before the bad migration ran**:

1. Pause writes — toggle `APP_MAINTENANCE_DRIVER=file` and run
   `php artisan down --secret=…` via Forge SSH.
2. Supabase → Project → **Database → Backups** → pick the most recent
   point-in-time recovery target *before* the bad migration ran (the
   `migrations` table row's `created_at` tells you exactly when).
3. Restore to a **new database** (not in place — restoring in place
   destroys the audit trail of what went wrong).
4. Forge → Environment → swap `DB_DATABASE` / pooled connection string
   to the restored DB.
5. Redeploy the previous green Forge deployment per §4.1.
6. `php artisan up` to lift maintenance mode.
7. Diff the restored DB against the original (use `pg_dump --schema-only`
   on both) so we know exactly what was lost.

The original (broken) DB is *not* deleted — keep it for the postmortem.

---

## 5. Database rollback (Supabase, full restore)

This is the worst-case path: schema drift + data corruption that
restore-to-snapshot is the only safe fix.

1. Stop the app: Forge → **Down** (uses `php artisan down`).
2. Supabase → **Database → Backups** → pick a snapshot from *before* the
   incident window. Daily auto-backups are retained; PITR resolution
   depends on the Supabase tier.
3. Restore to a new database (always). Note its connection string.
4. Forge → Environment → update the `DB_*` block.
5. Forge → Deploy Now. Migrations run cleanly because the schema is at
   the snapshot's state.
6. `curl /api/health` → 200.
7. `php artisan up`.
8. **Data loss window**: write down the snapshot timestamp. Everything
   between that timestamp and the rollback is gone. Communicate it to
   partners.

---

## 6. After every rollback (mandatory)

1. **Open a postmortem** using `docs/ops/postmortem-template.md`. Even if
   the incident lasted 10 minutes. Especially if it lasted 10 minutes —
   the small ones are where the patterns hide.
2. **Open a revert PR** so `main` reflects what's running in prod. Do
   not leave production lagging the repo.
3. **Note the rollback in `tasks/todo.md`** session log so future-us can
   read the timeline.
4. **Check Sentry + BetterStack** — clear any noisy alerts that the
   rollback resolved, escalate any that didn't.

---

## 7. What doesn't get a rollback

- **Frontend visual bug, dashboard still functional** → forward-fix PR.
- **A single broken admin panel button** → forward-fix PR.
- **An ingestion job that's failing** → disable the schedule, fix
  forward. Rolling the whole app back to fix one cron is wrong.
- **A flaky test in CI** → that's not production. Fix the test.
- **Sentry noise from a third-party SDK** → silence the rule in Sentry,
  fix the SDK config in a normal PR.

The rule: roll back when *real users see a broken product right now* and
no quick forward path exists. Otherwise, ship a fix.

---

## 8. Related runbooks

- `docs/ops/deploy.md` — how the deploy script works, what each step
  does, why it does it.
- `docs/ops/incident-response.md` — who pages who, comms cadence.
- `docs/ops/postmortem-template.md` — blameless template for the writeup.
- `docs/ops/secret-rotation.md` — required if the incident involved a
  leaked or guessed secret.

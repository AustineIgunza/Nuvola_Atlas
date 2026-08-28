# Rolling back

Ordered by what you reach for first. Frontend rollbacks are instant and safe;
backend rollbacks are neither, because of migrations.

## Frontend — seconds, safe

Vercel keeps every previous deployment. In the dashboard, find the last good one
and **Promote to Production**. No rebuild, no git operation, no risk.

Do this first if you are unsure which layer broke. It costs nothing and takes
the frontend out of the question.

## Backend — read this before you touch it

The deploy runs `php artisan migrate --force`. Reverting the code does **not**
revert the schema, and a rolled-back application talking to a migrated database
is often more broken than the bad deploy.

**Decide first whether the bad deploy included a migration:**

```bash
php artisan migrate:status
```

### No migration ran

Straightforward. On the server:

```bash
cd /var/www/nuvola-atlas/nuvola-atlas-backend
git log --oneline -5
git checkout <last-good-sha>
composer install --no-dev --optimize-autoloader
php artisan config:cache && php artisan route:cache
php artisan queue:restart
```

Then fix forward on `main` and redeploy properly — leaving the server on a
detached HEAD is a trap for the next person.

### A migration ran

Do **not** reflexively `migrate:rollback`. Ask whether the migration is
destructive:

- **Additive** (new table, new nullable column) — usually safe to leave in
  place. Roll the code back and let the unused column sit there. This is the
  common case and the calm one.
- **Destructive** (dropped column, changed type, backfilled data) — rolling back
  loses data written since the deploy. Every migration here implements `down()`,
  but `down()` recreates structure, not the rows that were in it.

If it is destructive and you need the data, restore from a database backup
taken before the deploy, then roll the code back to match. Doing it in the other
order gives you an old schema under new code.

## What protects you

- **`v0.1-pre-restructure`** — tagged at `060cf0f`, the last commit before the
  August 2026 structural work. `git checkout v0.1-pre-restructure` gets that
  tree back exactly.
- **`backup/pre-restructure`** — the same commit as a branch, so it survives a
  force-push to `main`.
- **An offline bundle** — `git bundle` output held outside GitHub. This is the
  only copy that survives losing access to the remote, which matters because the
  repository lives on a personal account rather than an organisation.

## What does not protect you

**`main` has no branch protection.** Enabling it needs admin on the repository,
which the owner alone holds. Until that changes, nothing on the server side
prevents a force-push over `main` — the tag, the backup branch and the bundle
are the whole safety net. Treat them as load-bearing rather than ceremonial.

# Deploying

Two targets, deployed independently. Neither happens automatically on merge.

| What | Where | Trigger |
|---|---|---|
| Frontend | Vercel | automatic on push to the production branch |
| Backend | VPS over SSH | **manual** — Actions → Deploy → Run workflow |
| Ingestion | Vercel Fluid Compute | per its own project |
| Data pipeline | nowhere — runs on a laptop | n/a |

## Backend

`.github/workflows/deploy.yml`, `workflow_dispatch` only, and gated on
`github.ref == 'refs/heads/main'`. Two independent locks: nothing on a branch
can reach the server, and nothing deploys without someone clicking.

On the box it does:

```
cd /var/www/nuvola-atlas/nuvola-atlas-backend
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache
php artisan queue:restart
```

Secrets required: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`. They are
repository secrets and setting them needs **admin** on the repository, which
collaborators with write access do not have — see [`secrets.md`](secrets.md).

**`migrate --force` runs unreviewed.** It applies whatever migrations landed on
`main`. Read the migration diff before dispatching, not after.

**The deploy path is hardcoded.** `cd /var/www/nuvola-atlas/nuvola-atlas-backend`
is a literal in the workflow. If the repository directories are ever renamed —
for example to `services/backend` — this breaks and the fix is on the server as
well as in the workflow. Parameterising it as a `DEPLOY_PATH` secret is the
intended change and needs admin.

## Frontend

Vercel builds from the repository and reads `vercel.json` **at the repo root**,
which sets `installCommand`, `buildCommand` and `outputDirectory` to point into
`nuvola-atlas-frontend`.

There is a second `vercel.json` **inside** `nuvola-atlas-frontend/` with only
`framework`, `rewrites` and `headers`. Which one is live depends on the
project's Root Directory setting in the Vercel dashboard. Two configs is
ambiguous; resolve to one before the next structural change.

**Only the production branch deploys to production.** Every other branch
produces a Preview deployment on a throwaway URL, and a failed preview build
produces no deployment at all — it cannot roll anything back. There are exactly
three ways production moves: a push to the production branch, someone clicking
"Promote to Production" on a preview, or someone changing the Production Branch
setting.

## Before you deploy

```bash
bash scripts/check.sh
```

Green on the blocking checks. Then read what is actually shipping:

```bash
git log --oneline origin/main..HEAD
php artisan migrate:status
```

## Known-stale checks

If you are deploying for the first time in a while, confirm these still hold —
they were true on 2026-08-28 and are the kind of thing that rots:

- The Vercel Production Branch is `main`.
- The VPS path above still exists.
- `.env` on the server has every key `.env.example` has. A stale `.env` missing
  newly added keys is a silent 500, not a startup error.

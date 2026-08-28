# Secrets

Every credential is read from the environment. None is committed. `.env` is
gitignored in every service, and `.env.example` is the list of keys — never of
values.

## Where each one lives

| Secret | Lives in | Used by |
|---|---|---|
| `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` | GitHub repository secrets | `deploy.yml` |
| `INGEST_INTERNAL_SECRET` | server `.env` and the ingestion service's env | the HMAC hop |
| `DB_*` | server `.env` | Laravel |
| `VITE_MAPBOX_TOKEN` | Vercel project env | the map |
| `SENTRY_LARAVEL_DSN`, Sentry frontend DSN | server `.env`, Vercel env | error reporting |
| Google OAuth client id/secret | server `.env` | sign-in |

Anything prefixed `VITE_` is **compiled into the browser bundle**. It is public
by construction. Never put a real secret behind that prefix; the Mapbox token
there is a publishable token and should be domain-restricted in Mapbox rather
than treated as private.

## The internal secret has a minimum length

`VerifyInternalSecret` rejects any `X-Internal-Secret` shorter than **48
characters** before the route runs. This is enforced, not advisory — a test
suite sat red for days because its fixture secret was 11 characters and every
request came back 401 with no other explanation.

Generate one properly:

```bash
openssl rand -hex 32
```

Both sides must carry the same value: `INGEST_INTERNAL_SECRET` on the Laravel
side, and the matching key in the ingestion service's environment.

## Who can change repository secrets

**Admin only.** On a user-owned repository, only the owner has admin —
collaborators get write access and no more, and role granularity (Read / Triage
/ Write / Maintain / Admin) is an *organisation* feature. A collaborator sees
"You don't have access to repository options" under Settings. That is the
expected state, not a misconfiguration.

Practically: a collaborator can push, open and merge pull requests, and dispatch
workflows, but cannot add a secret, enable branch protection, or change
visibility. Moving the repository into an organisation is what changes this, and
it is worth doing before the team grows past two.

## Rotating

1. Generate the new value.
2. Set it on **every** consumer before removing the old one — for the internal
   secret that means Laravel and the ingestion service together, or the hop
   fails closed with 401s.
3. Restart the workers: `php artisan queue:restart`.
4. Verify: `/api/health/ingestion` returns 200, and an intake POST with the new
   secret succeeds.

## If one leaks

Rotate first, investigate second. Then remember that git history keeps it —
removing the value in a later commit does not remove it from the repository.
A leaked credential must be treated as compromised even after it is deleted from
the working tree.

Report per [`../../SECURITY.md`](../../SECURITY.md).

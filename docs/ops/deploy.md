# Deploy — Backend on Laravel Forge + DigitalOcean

_Status: pre-pilot. This is the recommended path per `tasks/todo.md` §9.4._
_Owner of the live infra: TBD (likely Khillon or Devyan once the droplet exists)._
_Last updated: 2026-06-05._

This guide gets the Laravel backend onto a public URL with TLS, a managed
Postgres+PostGIS, Redis, queue workers, and Reverb websockets — the minimum
needed before `VITE_USE_REMOTE_API=true` does anything useful on Vercel.

Everything in this repo for the deploy is already prepared:

| What | Where |
|------|-------|
| Deploy script | `nuvola-atlas-backend/deploy.sh` |
| Prod env template | `nuvola-atlas-backend/.env.production.example` |
| nginx paste-in blocks | `nuvola-atlas-backend/docker/nginx/forge.conf` |
| Queue + Reverb daemons | `nuvola-atlas-backend/docker/supervisor/*.conf` |

Below is the order of operations. Each step is short on purpose — the file
references above are the source of truth for the actual content.

---

## 1. Decide hosts and write them down

Pin these before touching any provider so you don't have to come back and
edit the env later:

| Role | Value |
|------|-------|
| API host | `api.<your-domain>` |
| Frontend host | `atlas.<your-domain>` (or the Vercel project alias) |
| Postgres provider | Supabase (PostGIS supported, free tier OK for pilot) |
| Droplet size | DigitalOcean `s-1vcpu-2gb` (~USD 12/mo) — the documented sizing in §9.10 |
| Region | `fra1` (closest low-latency DO region to Nairobi at time of writing) |
| DNS | Cloudflare (free tier, proxy on for both hosts) |

---

## 2. Provision the managed Postgres

1. Supabase → New Project. Region: `eu-central-1` (lowest RTT to `fra1`).
2. Database → Extensions → enable `postgis`.
3. Database → Connection Info: copy **both** strings.
   - **Pooled** (port `6543`) → `DB_HOST` + `DB_PORT` in the app.
   - **Direct** (port `5432`) → `DB_MIGRATIONS_HOST` + `DB_MIGRATIONS_PORT`
     (Laravel migrations open long transactions; the pooler will trip them).
4. Database → SSL Configuration → enforce. `DB_SSLMODE=require` matches.
5. **Create a non-superuser app role** so RLS bites (§9.7):
   ```sql
   CREATE ROLE nuvola_app LOGIN PASSWORD '<random>';
   GRANT USAGE ON SCHEMA public TO nuvola_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO nuvola_app;
   GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO nuvola_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
       GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO nuvola_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
       GRANT USAGE, SELECT                  ON SEQUENCES TO nuvola_app;
   ```
   Point `DB_USERNAME` at `nuvola_app` (not `postgres`). Run migrations
   with the `postgres` user (`DB_MIGRATIONS_*` direct connection), but
   serve requests as `nuvola_app`. The RLS policy on
   `partner_dataset_overlays` only applies because `nuvola_app` is not a
   superuser and not the table owner — `postgres` would silently bypass
   it even with FORCE.

> Skip this step only if you decide to run Postgres on the droplet itself.
> If you do, `apt install postgresql-16-postgis-3`, create the role + db, and
> `CREATE EXTENSION postgis;` inside the new db. Drop this on Supabase
> before the first partner pilot — losing the droplet means losing the data.

---

## 3. Create the DigitalOcean droplet via Forge

1. Forge → Servers → **Create Server** → Provider: DigitalOcean.
2. Size: `s-1vcpu-2gb`. Region: `fra1`. PHP: **8.3**. Database: skip
   (we're on Supabase). **Enable Redis**. Postgres: skip.
3. Wait for green ✓. SSH in once to confirm:
   ```bash
   ssh forge@<droplet-ip>
   php -v        # → PHP 8.3.x
   redis-cli ping # → PONG
   ```

---

## 4. Create the site

1. Forge → the new server → **New Site**.
   - Domain: `api.<your-domain>`
   - Project Type: **General PHP/Laravel**
   - Web Directory: `/nuvola-atlas-backend/public`  ← critical, monorepo
   - PHP Version: 8.3
2. Application → **Git Repository**.
   - Provider: GitHub
   - Repo: `AustineIgunza/Nuvola_Atlas`
   - Branch: `main`
   - Install Composer: **off** (the deploy script handles it explicitly)
3. Click **Install Repository**. Wait for the clone to finish.

---

## 5. Wire the deploy script + env

1. Application → **Environment**: paste `.env.production.example` from the
   repo, then fill every `<…>` placeholder.
   - `APP_KEY` — run `php artisan key:generate --show` locally and paste.
   - `DB_*` — Supabase pooled + direct hosts from step 2.
   - `REVERB_APP_*` — generate random IDs/keys/secrets (`openssl rand -hex 16`).
   - `CORS_ALLOWED_ORIGINS` — exact frontend origin, no trailing slash.
2. Application → **Deploy Script**: replace Forge's default with
   `bash nuvola-atlas-backend/deploy.sh`.
3. Application → **Quick Deploy**: enable. Every push to `main` now deploys.
4. Application → **Deploy Now**. Watch the log; on first run it will composer
   install, migrate the schema into Supabase, and prime the caches.

---

## 6. nginx — paste in the override blocks

`Site > Edit Files > Nginx Configuration`. Open
`nuvola-atlas-backend/docker/nginx/forge.conf` and paste the labelled blocks:

- **Block A** — set the docroot to the monorepo subdir.
- **Block B** — Cloudflare real-IP + gzip.
- **Block C** — `/app` + `/apps/*` websocket upgrade for Reverb.
- **Block D** — static asset caching.
- **Block F** (optional) — edge rate-limit on `/api/v1/auth/*`.

Then **Save** → Forge runs `nginx -t` and reloads.

---

## 7. Daemons — queue worker + Reverb

`Server > Daemons > New Daemon` twice. Settings come from
`nuvola-atlas-backend/docker/supervisor/`:

**nuvola-queue** (`nuvola-queue.conf`):
- Command:
  ```
  /usr/bin/php8.3 /home/forge/<site>/nuvola-atlas-backend/artisan queue:work redis --sleep=3 --tries=3 --max-jobs=1000 --max-time=3600 --backoff=15 --timeout=120
  ```
- User: `forge` · Directory: `/home/forge/<site>/nuvola-atlas-backend`
- Processes: **2** · Stop signal: SIGTERM · Stop wait: 60

**nuvola-reverb** (`nuvola-reverb.conf`):
- Command:
  ```
  /usr/bin/php8.3 /home/forge/<site>/nuvola-atlas-backend/artisan reverb:start --host=127.0.0.1 --port=8080
  ```
- User: `forge` · Directory: `/home/forge/<site>/nuvola-atlas-backend`
- Processes: **1** · Stop signal: SIGTERM · Stop wait: 10

---

## 8. Scheduler

`Site > Scheduler > Add Task`:
- Command: `php8.3 /home/forge/<site>/nuvola-atlas-backend/artisan schedule:run`
- Frequency: **Every Minute**
- User: `forge`

Laravel's own scheduler decides what actually runs.

---

## 9. DNS + TLS

1. Cloudflare → add an A record `api → <droplet-ip>`. Proxy **on**.
   Add `atlas` as a CNAME to the Vercel project alias (proxy off — Vercel
   manages its own TLS).
2. Forge → Site → **SSL → Let's Encrypt**. Add `api.<your-domain>`.
   Cloudflare's "Full (strict)" SSL mode requires the cert on the origin, so
   this step is required even though Cloudflare also fronts the origin.
3. Cloudflare → SSL/TLS → **Full (strict)**.

---

## 10. Smoke test

```bash
curl -i https://api.<your-domain>/api/health
# → 200 OK
# → { "ok": true, "db": "ok", "cache": "ok" }

curl -i https://api.<your-domain>/api/v1/zones
# → 200 OK with the seeded zone list
```

If `/api/health` returns 200 but `db: "error"`, the Supabase pooled string is
wrong or SSL isn't accepted — fix `DB_*` env, redeploy.

---

## 11. Flip the frontend to remote

`Vercel → nuvola-atlas-frontend → Settings → Environment Variables → Production`:

```
VITE_USE_REMOTE_API=true
VITE_API_BASE=https://api.<your-domain>/api/v1
VITE_REVERB_HOST=api.<your-domain>
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=<same as backend REVERB_APP_KEY>
```

Trigger a redeploy. After the build finishes, hard-refresh `/atlas` and
confirm posted reports survive a reload (they hit Postgres now, not
localStorage).

---

## 12. Hand-off checklist before declaring 9.4 done

- [ ] Site responds 200 on `/api/health` from the public URL.
- [ ] `vercel.json` env vars set on Production; redeployed; report-post round-trips.
- [ ] Forge Daemons both report `running` for ≥ 1 hour.
- [ ] Forge Scheduler heartbeat present in `storage/logs/laravel-*.log`.
- [ ] Cloudflare proxy on; SSL/TLS = Full (strict); A record resolves.
- [ ] `tasks/todo.md` §9.4 checkboxes ticked with the production URL.
- [ ] First Supabase backup snapshot present (auto, but confirm it ran).

---

## Rollback

Forge keeps the last 5 deploys. From the Forge UI →
**Deployments → previous green commit → Redeploy this Deployment**.

If migrations are the problem and `migrate:rollback` isn't safe, restore the
Supabase point-in-time snapshot (Database → Backups) to a *new* db, swap
`DB_*` env to point at it, redeploy.

A proper rollback runbook with timing targets belongs at
`docs/ops/rollback.md` (§9.6) — write it once we've actually rolled back a
prod incident.

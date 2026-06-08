# Deploy — Backend on Laravel Forge + DigitalOcean

_Status: pre-pilot. This is the recommended path per `tasks/todo.md` §9.4._
_Owner of the live infra: TBD (likely Khillon or Devyan once the droplet exists)._
_Last updated: 2026-06-08._

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

## 0. Account provisioning roster — who creates what

Two columns: things the agent (Claude) can fully execute from the repo with
its existing tools, and things you (Austine) must sign up for personally
because they need a real human, a credit card, OAuth approval, KYC, or
legal acceptance of terms.

Where a service appears in both columns, it means *you* create the account
and *I* take it from there once you've pasted the credential into the
right place. The credential-flow column at the right of each table says
exactly where the value lands and who puts it there.

### 0.1 What Claude can do on its own — no new account needed

These are already wired or live in the repo. I do not need anything from
you to use them.

| Capability | Why we need it | How I use it today |
|---|---|---|
| Read / write any file in `C:\Users\mmatt\NUVOLA_ATLAS` | Source of truth for all code, configs, docs | `Read` / `Edit` / `Write` tools |
| Run `composer`, `npm`, `php artisan`, `npx vite`, `npx tsc` locally | Build + test loops | `PowerShell` / `Bash` tools |
| Run the local docker postgres+postgis for tests | Backend phpunit suite (`docker compose up -d postgres`) | Docker Desktop installed; I just `docker compose` |
| Commit + push to `origin/main` | Per-slice push cadence | `git` is authenticated as `AustineIgunza` via the cached credential helper |
| `gh` CLI (already installed + logged in) | Read PRs / issues / Actions status when needed | I use `gh` directly |
| Read existing Mapbox dev token | Frontend map renders locally | Already in `nuvola-atlas-frontend/.env` |
| Anonymous package registries (npm, Packagist, Docker Hub) | Pull dependencies | Anonymous reads; no account |
| The repo's own GitHub | Branch protection, Actions, Dependabot, secrets | I can read; **only you can change branch-protection / settings** |

### 0.2 What YOU must create + share — pre-pilot blocking (Tier 1)

Everything below is needed before a partner can use the deployed system.
Order is the same order I'd suggest you tackle them in.

| # | Service | Why | What you do | What you share | Where it lands | What I do next |
|---|---|---|---|---|---|---|
| 1 | **Domain registrar** (Namecheap / GoDaddy / Strathmore IT / wherever you bought `nuvola.dev` or the project domain) | We need DNS authority before TLS can issue | Sign in, locate the nameserver settings page | The two Cloudflare nameservers (after step 2) — paste them at the registrar yourself | Registrar UI | Verify the change has propagated with `dig NS <domain>` |
| 2 | **Cloudflare** | DNS + free DDoS + Bot-Fight + analytics | Free signup. Add the domain. Pick free plan. Cloudflare gives you the two nameservers to paste at step 1 | Nothing (cloudflare host stays in the Cloudflare UI) — **but** later: Cloudflare → API Tokens → mint a token scoped to "Zone: read; DNS: edit" → paste into Forge env as `CLOUDFLARE_API_TOKEN` if we automate DNS | Cloudflare UI | I'll generate the A records list you need to add (`api.<domain>` and `atlas.<domain>`) once we know the droplet IP |
| 3 | **DigitalOcean** | The droplet that Forge provisions | Sign up + add payment method ($5–12/mo droplet) | Nothing back to me — your DO account stays personal | DO UI | Nothing direct; Forge does the talking to DO |
| 4 | **Laravel Forge** | Provisioner + deploy automation + Daemons (queue, Reverb) + Scheduler | Sign up ($19/mo Hobby). In Forge → Account → Source Control → connect GitHub (the `Nuvola_Atlas` repo). In Forge → Account → Server Providers → connect your DigitalOcean account | **Optional but useful:** Forge → Account → API → mint an API token → paste the value into our chat OR into `.env.local.forge` (gitignored) | I can either receive it in chat (one-time) or you stage it in a gitignored file | With the Forge API token I can: read deploy state, trigger deploys, read server env keys (not values). Without it: I just walk you through clicks. |
| 5 | **Supabase** | Managed Postgres 16 + PostGIS | New Project (free tier). Region `eu-central-1`. Database → Extensions → enable `postgis`. Then per `deploy.md` §2 step 5, create the `nuvola_app` non-superuser role | DB → Connection Info: paste both the **pooled** and **direct** connection strings into **Forge → Site → Environment**, NOT into chat | Forge env (server-side only) | I'll verify by running `php artisan migrate --pretend` against staging |
| 6 | **Sentry** | Error tracking — SDKs are already wired on both sides | Sign up (Developer free tier). Create two projects: `nuvola-atlas-backend` (platform: PHP/Laravel) and `nuvola-atlas-frontend` (platform: React) | Each project's **DSN** (a URL ending in `@oXXXX.ingest.sentry.io/PROJECT_ID`). Paste backend DSN into **Forge env** as `SENTRY_LARAVEL_DSN`. Paste frontend DSN into **Vercel → Project → Environment Variables → Production** as `VITE_SENTRY_DSN` | Forge env + Vercel env | I trigger a test error each side and confirm it lands in Sentry |
| 7 | **GitHub branch protection** | Block force-pushes to `main`, require Backend + Frontend Actions to pass | Repo → Settings → Branches → Add rule for `main`: require status checks (Backend, Frontend), require 1 approval, restrict force-push. Only the repo admin (you) can do this. | Nothing | GitHub UI | I'll verify by opening a draft PR and watching the required-checks gate fire |
| 8 | **Vercel production env vars** | Flip the frontend off mock data | Vercel → `nuvola-atlas-frontend` project → Settings → Environment Variables → Production. Add: `VITE_USE_REMOTE_API=true`, `VITE_API_BASE=https://api.<your-domain>/api/v1` | Nothing back to chat — these are not secret but they live in Vercel | Vercel env | I redeploy + verify the mock banner is gone and a real `/zones` request hits your backend |

### 0.3 What YOU create — partner-onboarding (Tier 2)

Needed before the first partner signs in. Not blocking the smoke test of
the deploy.

| # | Service | Why | What you do | What you share | Where it lands | What I do next |
|---|---|---|---|---|---|---|
| 9 | **Postmark** | Transactional email — 2FA codes, password reset, email verification. Without it admins literally cannot finish sign-in once 2FA enforcement bites | Sign up. Create one "Server" named `nuvola-atlas`. Verify the sender domain (DNS TXT records — Cloudflare clicks) | The server token (paste into **Forge env** as `POSTMARK_TOKEN`); the verified sender address (paste into Forge env as `MAIL_FROM_ADDRESS` and `MAIL_FROM_NAME`) | Forge env | I send a smoke email via `php artisan tinker` |
| 10 | **Cloudflare R2** | Object storage for report PDFs, partner attachments, screen recordings | Cloudflare → R2 → enable R2. Create bucket `nuvola-atlas-prod`. R2 → Manage API Tokens → mint an Access Key with the `Object Read & Write` permission scoped to that bucket | Access Key ID + Secret Access Key (paste into **Forge env** as `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET=nuvola-atlas-prod`, `AWS_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com`, `AWS_USE_PATH_STYLE_ENDPOINT=true`) | Forge env | I add an upload test endpoint or wire the report-upload flow |
| 11 | **BetterStack (Logtail + Status)** | Centralized log aggregation (structured JSON channel already wired) + public status page | Sign up (free for our scale). Create a Logtail source named `nuvola-atlas-prod`. Create a Status Page tied to synthetic checks against `/api/health` and the Atlas page | Logtail token (paste into **Forge env** as `LOGTAIL_TOKEN`) | Forge env | I switch the `json` log channel target so structured logs ship to BetterStack |
| 12 | **Mapbox** (production token) | Frontend map tiles. You already have a dev token — production needs its own with URL allowlist | Mapbox → Account → Access Tokens → create a new public token scoped to `https://atlas.<your-domain>` and `https://*.vercel.app` (for previews) | Paste into **Vercel env** as `VITE_MAPBOX_ACCESS_TOKEN` (Production). Keep the dev token only in your local `.env` | Vercel env | I verify the prod build loads tiles against the new token |
| 13 | **Shared password vault** (1Password / Bitwarden — pick one) | Human-recoverable copy of every secret so we don't lose the only set when someone leaves a laptop on a bus | Sign up (1Password Teams ~$8/user/mo, Bitwarden free tier is fine too). Invite the team. Create a shared vault `nuvola-atlas-ops` | Nothing back to me — vault content stays human-only | Vault | Nothing — I never read from the vault |

### 0.4 What YOU create — data sourcing (Tier 3, §4 of the proposal)

These have long lead times. Joy + Ken own most of them. They are NOT
blocking the technical pilot — the mock data flag carries us until a feed
is wired.

| # | Service | Pillar | Lead time | Owner |
|---|---|---|---|---|
| 14 | **ACLED** academic access | Pillar 2 (Safety) | ~2 weeks via Strathmore | Joy |
| 15 | **OpenAQ API key** | Pillar 1 (Air quality) | Instant, free | Devyan |
| 16 | **Google Cloud** (Distance Matrix API) | Pillar 3 (Density transit times) | Same-day, paid; cap at USD 50/mo via sampling | Devyan + Ken |
| 17 | **Social Progress Index Kenya CSV** | Pillar 1 | No account; public download | Devyan |
| 18 | **World Justice Project Rule of Law Index** | Pillar 2 | No account; public CSV | Ken |
| 19 | **Freedom House — Freedom on the Net** | Pillar 2 | No account; public report | Ken |
| 20 | **KNBS** (Kenya National Bureau of Statistics) open-data portal | Pillar 1 + 3 | Free signup; portal access | Devyan |
| 21 | **NEMA** ESIA portal | Pillar 4 | Free signup or scraping | Devyan |
| 22 | **NPS** crime data | Pillar 2 | Letter + MOU (slow) | Ken |
| 23 | **KURA / KeNHA / KPLC / KETRACO** | Pillar 4 | Open data + MOUs | Devyan + Ken |

When any of these get unblocked, share the API key / token (Postman-style)
or the data URL with me and I'll wire the ingestion. Tokens go into
**Forge env** (or the ingestion service's env once that's split out),
never into the repo.

### 0.5 MCPs and CLIs that help the agent

These are agent-side, not project-side. Doing them is optional but they
shorten the loop for me considerably.

| Tool | What it unlocks | How you enable it |
|---|---|---|
| **Vercel CLI** | `vercel env pull`, `vercel deploy`, `vercel logs` without copy-paste | `npm i -g vercel` then `vercel login` (browser OAuth). One-time. |
| **Vercel MCP** | Same as CLI but I can call it directly from this chat | Run the `mcp__plugin_vercel_vercel__authenticate` tool when I trigger it. One browser-OAuth. |
| **Forge API token** | Read deploy state, trigger deploys, read env keys, restart Daemons — without you in the loop | Forge → Account → API → New API Token → paste once into chat (I'll move it into `.env.local.forge` which is gitignored) |
| **Cloudflare API token** (Zone read / DNS edit, scoped to our zones) | I can add the `A` and `CNAME` records during the deploy instead of dictating them to you | Cloudflare → Profile → API Tokens → Create Token with the scope above |
| **Supabase service-role key** | Run admin SQL (create the `nuvola_app` role automatically, install PostGIS) instead of you clicking the dashboard | Supabase → Project Settings → API → `service_role` key. **High-power** — only useful if you're comfortable with me having admin SQL. If unsure, skip and we drive Supabase through the UI together. |
| **GitHub PAT** (read-only) | I already have `gh` CLI; usually unnecessary | Skip unless we hit a permission wall |
| **Google Drive / Calendar / Gmail MCPs** | Coordination only, not pilot-critical | Skip for pilot |
| **Higgsfield MCP** | Image / video gen — not screen recording | Skip; use Loom or OBS for the §5.2 90-second demo |

### 0.6 The "what to share, how to share it" rule

Three classes of value, three different handling rules:

| Class | Examples | Where it goes | Allowed to paste in chat? |
|---|---|---|---|
| **Non-secret IDs** | Sentry org slug, Supabase project ref, DO droplet IP, Mapbox public token, Vercel project ID | Forge env / Vercel env / chat | Yes |
| **Service-scoped tokens** | Postmark server token, Logtail token, R2 access key, Forge API token, Cloudflare API token | Forge env (mostly) + 1Password vault | Yes once, in chat, then rotated within 90 days per `secret-rotation.md` |
| **Account-root credentials** | Supabase project owner password, DO root login, your Gmail / Cloudflare login | Never anywhere outside the password vault | **No.** Don't paste these in chat. If I ask for one, I'm wrong — push back. |

Rule of thumb: if rotating it tomorrow would only mean updating one env
variable, it's fine to share in chat once. If rotating it tomorrow would
mean signing back into the provider's UI, it never leaves the vault.

### 0.7 The 30-minute fast path (if you want to go right now)

1. **You** sign up for Cloudflare + add the domain (15 min).
2. **You** sign up for DigitalOcean + add payment (5 min).
3. **You** sign up for Laravel Forge + connect GitHub + DO (5 min).
4. **You** paste the Forge API token into chat with me.
5. **I** walk you through Supabase + the rest of `deploy.md` §2–§10 while
   you click; you only ever paste credentials into Forge env, not into
   chat.
6. **You** sign up for Sentry + Postmark in parallel while the deploy is
   running. Paste DSNs and tokens into Forge env when each one is ready.

Total elapsed time for first deploy: roughly 90 minutes if nothing fights
back.

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

Full rollback runbook with RTO targets, decision tree, and the
migration-rollback-vs-restore split: `docs/ops/rollback.md`.
For the comms-and-coordination side of an incident,
`docs/ops/incident-response.md`. Every incident lasting more than 30
minutes ends with `docs/ops/postmortem-template.md` filled in.

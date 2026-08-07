# Credentials & human-only actions needed

**Last updated:** 2026-08-07
**Audience:** Austine (holds the accounts), with rows delegated to Devyan / Khillon / Joy.

Everything in this file is a thing **code cannot do for itself** — it needs a
human to sign into a dashboard, accept terms, pay for something, or ask
another person a question.

Nothing here blocks local development. The stack runs end to end with an
empty `.env` copied from `.env.example`: every integration below fails
*closed* and degrades to a documented fallback. The list is what stands
between "runs on Austine's laptop" and "runs in staging".

---

## How to read the tables

| Column | Meaning |
|--------|---------|
| **Unblocks** | What stays broken or mocked until this is set. |
| **Var** | The exact env var name. Copy it verbatim — several are near-misses of each other. |
| **Where it goes** | Which `.env` / dashboard the value is pasted into. |

Priority is P0 (blocks the staging deploy), P1 (blocks a demoable feature),
P2 (nice to have, has a working fallback).

---

## P0 — blocks the staging deploy

### 1. Supabase project (PostgreSQL + PostGIS)

| | |
|---|---|
| **Unblocks** | Every backend route. Local Docker Postgres covers dev; staging has no database at all without this. |
| **Var** | `DB_HOST` `DB_PORT` `DB_DATABASE` `DB_USERNAME` `DB_PASSWORD` |
| **Where it goes** | Forge → site → Environment |
| **Owner** | Khillon |

Steps: create a Supabase project in a region close to Nairobi
(`eu-central-1` is the usual pick), enable the **PostGIS** extension under
Database → Extensions, then copy the connection string.

Two ports matter and they are not interchangeable:

- **`:6543` (pooled / PgBouncer)** — what the app uses at runtime.
- **`:5432` (direct)** — what `php artisan migrate` must use. PgBouncer in
  transaction mode breaks the advisory locks migrations take out.

Also needed, from the same project, for the chat SQL guard:

| **Var** | `DB_CHAT_RO_USER` `DB_CHAT_RO_PASSWORD` |
|---|---|
| **Unblocks** | The RAG chatbot running its generated SQL as a least-privilege role instead of the app user. |

The role itself is created by migration
`2026_07_09_000001_create_chat_readonly_role`; you supply the password. Left
blank, the pipeline falls back to the primary DB user — acceptable in dev,
**not** acceptable in staging, because a prompt-injected query would then run
with write privileges.

### 2. The ingestion shared secret

| | |
|---|---|
| **Unblocks** | Hop 2 of the data path (FastAPI → Laravel). Every batch 401s without it. |
| **Var** | `INGEST_INTERNAL_SECRET` (Laravel) and `INGESTION_INTERNAL_SECRET` (FastAPI) |
| **Where it goes** | Forge env **and** Vercel ingestion project env |
| **Owner** | Devyan |

**Read the two names again — they differ.** Laravel reads `INGEST_`, the
ingestion service reads `INGESTION_`. It is one value stored under two keys,
and they must be byte-identical. This is the single most likely cause of a
"nothing is ingesting and nothing is logging an error" afternoon.

Generate with `openssl rand -base64 48`. Rotation procedure is in
`docs/ops/secret-rotation.md`. An unset value fails closed with `503`, never
"no check required" — pinned by
`tests/Feature/IngestAccessTest::test_ingest_is_refused_when_the_secret_is_unconfigured`.

### 3. DigitalOcean droplet + Laravel Forge

| | |
|---|---|
| **Unblocks** | Any Laravel deploy at all; also the Reverb websocket and the queue workers. |
| **Var** | n/a — dashboard state |
| **Owner** | Devyan |

Forge needs a paid plan; DO needs a droplet (2GB is enough for the pilot).
Forge then provisions PHP 8.3, nginx, and the supervisor configs already
committed under `docs/ops/`. Two daemons must be added by hand in Forge:

- `php artisan reverb:start` — the websocket server
- `php artisan queue:work` — **without this, scores recalculate but never
  broadcast**, because `ZoneScoreUpdated` fires from a queued job

### 4. `APP_KEY`

| | |
|---|---|
| **Unblocks** | Session/cookie encryption. Laravel refuses to boot without it. |
| **Var** | `APP_KEY` |
| **Owner** | Khillon |

`php artisan key:generate` on the target host. Do not copy the dev key into
staging, and do not rotate it after users exist — it invalidates every
session and every encrypted column.

---

## P1 — blocks a demoable feature

### 5. Mapbox access token

| | |
|---|---|
| **Unblocks** | The actual map. Without it the Atlas renders a styled SVG fallback — fine for a UI review, not for a partner demo. |
| **Var** | `VITE_MAPBOX_TOKEN` |
| **Where it goes** | `nuvola-atlas-frontend/.env`, and Vercel → frontend project → Environment Variables |
| **Owner** | Austine |

Free tier is 50k map loads/month, which comfortably covers the pilot. **Scope
the token before deploying:** Mapbox account → Tokens → restrict URLs to the
Vercel domain and `localhost`. A `VITE_`-prefixed var is compiled into the
JS bundle and is readable by anyone who opens devtools — a URL restriction is
the only thing making that safe.

### 6. Google OAuth client

| | |
|---|---|
| **Unblocks** | "Continue with Google" on sign-in/sign-up. Email+password auth works regardless. |
| **Var** | `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` `GOOGLE_REDIRECT_URI` |
| **Owner** | Austine |

Google Cloud Console → APIs & Services → Credentials → OAuth client ID →
Web application. The **Authorized redirect URI** must match
`GOOGLE_REDIRECT_URI` character for character, including the scheme and any
trailing path. Register all three:

```
http://localhost:8000/api/v1/auth/google/callback
https://<staging-host>/api/v1/auth/google/callback
https://<prod-host>/api/v1/auth/google/callback
```

Full walkthrough: `nuvola-atlas-backend/docs/ops/google-oauth.md`.

### 7. Sentry — three separate projects

| | |
|---|---|
| **Unblocks** | Production error visibility. All three no-op cleanly when unset. |
| **Var** | `SENTRY_LARAVEL_DSN` · `VITE_SENTRY_DSN` · `INGESTION_SENTRY_DSN` |
| **Owner** | Austine (frontend), Khillon (Laravel), Devyan (ingestion) |

Three projects, not one, and the split is deliberate: it is what lets each
project page a different person instead of paging everyone for every error.
Free tier is 5k events/month across the org.

The frontend DSN is public by design and safe in the bundle. For source-map
upload you additionally need build-time-only `SENTRY_ORG`, `SENTRY_PROJECT`,
`SENTRY_AUTH_TOKEN` on Vercel; if any is missing the Vite plugin simply is
not registered and the build stays fast.

### 8. Reverb app credentials

| | |
|---|---|
| **Unblocks** | Live score updates. Falls back to a 45-second mock pulse, which looks live but is not. |
| **Var** | `REVERB_APP_ID` `REVERB_APP_KEY` `REVERB_APP_SECRET` + the `VITE_REVERB_*` mirrors |
| **Owner** | Khillon |

Self-hosted, so these are values you invent rather than obtain — but the
frontend `VITE_REVERB_APP_KEY` must equal the backend `REVERB_APP_KEY`, and
in production `VITE_REVERB_SCHEME=https` with port `443` behind Cloudflare.
See the Realtime section of `nuvola-atlas-frontend/README.md`.

---

## P2 — has a working fallback

### 9. Vercel AI Gateway

| | |
|---|---|
| **Unblocks** | The RAG chatbot. Returns `503 "AI is not configured"` until set. |
| **Var** | `AI_GATEWAY_API_KEY` |
| **Owner** | Austine |

Requires a card on file. Set `VITE_USE_REMOTE_CHAT=false` to keep chat on the
client-side mock while the rest of the API points at real Postgres.

### 10. HuggingFace Inference Endpoint

| | |
|---|---|
| **Unblocks** | LLM-routed tool selection in the assistant agent. |
| **Var** | `AGENT_PROVIDER=huggingface` `HF_ENDPOINT` `HF_TOKEN` `HF_MODEL` |
| **Owner** | Devyan |

**Not needed for the pilot.** The default `AGENT_PROVIDER=heuristic` does
tool routing with no external model and no key. Only flip this once a
dedicated endpoint is live — a paused endpoint returns 503 and the agent has
no automatic fallback to heuristic.

### 11. Cloudflare — DNS, WAF, tunnel, Access

| | |
|---|---|
| **Unblocks** | Public DNS, TLS, and the only safe way to expose n8n. |
| **Var** | Tunnel token (dashboard state, not repo state) |
| **Owner** | Devyan |

Needed: nameservers pointed at Cloudflare; a `cloudflared` tunnel mapping
`automation.navuuna.dev` → `127.0.0.1:5678`; and an **Access application** on
that hostname restricted to the team's five email addresses.

The n8n editor runs arbitrary JS in Code nodes behind a single shared login,
so it is never published directly — no port, no DNS record, no exception. The
one bypass is `/webhook/*`, because Daystar's drop mechanism cannot complete
an Access login; that path is protected by the shared secret at the next hop
instead. Rationale in `infra/n8n/README.md`.

### 12. Slack incoming webhook

| | |
|---|---|
| **Unblocks** | `#data-feeds` notifications from n8n workflow #1. |
| **Var** | `SLACK_DATA_FEEDS_WEBHOOK` |
| **Owner** | Joy |

Without it the workflow still runs and the final node shows the payload it
would have sent — usable for a dry run.

### 13. n8n encryption key

| | |
|---|---|
| **Unblocks** | n8n credential storage. |
| **Var** | `N8N_ENCRYPTION_KEY` |
| **Owner** | Devyan |

`openssl rand -hex 32`. **Rotating it orphans every stored n8n credential**,
so set it once, before first boot, and back it up.

### 14. Vercel Cron secret

| | |
|---|---|
| **Unblocks** | Scheduled Daystar pulls. Manual and n8n-triggered POSTs work without it. |
| **Var** | `CRON_SECRET` |
| **Owner** | Devyan |

Separate from the transport secret specifically because Vercel Cron cannot
set custom headers — it can only send `Authorization: Bearer`. Reusing the
transport secret there would put it in a weaker position than it was designed
for.

---

## Human-only actions (no credential involved)

### 15. Daystar feed URL and coverage answers — **the real Phase B blocker**

Owner: Joy (relationship), Devyan (integration).

Everything on the ingestion side is built and tested against synthetic
drops. What is missing is not code:

1. **A feed URL** → `INGESTION_DAYSTAR_FEED_BASE`. Until this exists,
   scheduled pulls have nothing to pull and only the push path works.
2. **Which of the 13 indicators Daystar can actually deliver, and at what
   cadence.** The scoring model currently assumes all 13. If Daystar covers
   nine, the Vitality Score needs a documented gap-handling rule *before* a
   partner sees a number, not after.
3. **Confirmation they can honour the filename convention**
   (`daystar-<YYYY-MM-DD>-<scope>[-<seq>].json`, spec in
   `docs/data/daystar-indicator-spec.md`). The n8n gate quarantines anything
   that does not match, so a mismatch here is silent from their side.
4. **A named technical contact.** Row-level rejections are returned with a
   `_reject_reason` so the source can be fixed and resubmitted — that loop
   needs a person on the other end.

### 16. GitHub branch protection

Owner: Austine. Settings → Branches → protect `main`: require the CI
workflow to pass, require one review. Right now anything can be pushed
straight to `main`.

### 17. Physical device testing

Owner: Austine. The bottom-sheet scorecard and the map gestures have only
been exercised in devtools' responsive mode, which does not reproduce real
touch behaviour, iOS Safari viewport quirks, or actual GPU performance with
the Mapbox layers on.

### 18. Domain

Owner: Devyan. `navuuna.dev` (or the Strathmore subdomain) needs to be
purchased and pointed at Cloudflare before any of the OAuth redirect URIs and
Access policies above can be finalised.

---

## Fastest path to a shareable staging URL

If the goal is one demoable link rather than the full matrix, the minimum is
rows **1, 2, 3, 4, 5** — Supabase, the shared secret, Forge+DO, `APP_KEY`,
and a Mapbox token. That yields a real map over real Postgres with working
auth. Realtime shows the mock pulse, chat returns 503, and Google sign-in is
hidden; none of those are visible as failures to a viewer.

# Secret Rotation Policy

_Status: pre-pilot. Lives under `tasks/todo.md` §9.7._
_Last updated: 2026-06-05._

A secret is any value whose disclosure would let an attacker impersonate the
project, read data they shouldn't, or send messages on our behalf. This doc
lists what counts as a secret, when each must be rotated, and how to do it
without taking the site down.

---

## 1. Cadence

| Trigger | Action |
|--------|--------|
| **Every 90 days** | Routine rotation of all production secrets in §3. Calendared on the team's shared calendar. Ken owns the reminder. |
| **Departure** | Any team member with prod access leaves → rotate everything they could have touched within 24 h. Joy owns the off-boarding checklist. |
| **Suspected compromise** | Rotate the affected secret immediately. Notify the team in the shared channel. Treat as an incident — open a postmortem template (per §9.12). |
| **First public partner pilot** | Rotate every secret once before the partner gets a login. Removes any drift from development. |
| **GitHub leak** | If a secret lands in a commit (Dependabot/GitGuardian/manual review), rotate within 1 h and force-push only the offending file if it's still in the working tree; otherwise treat the leaked secret as burned and rotate. Never assume the leak is "old enough not to matter." |

Rotation does not mean "regenerate and email the new value around." Each
section below specifies *where the new value lands* — that's the canonical
place and the only place.

---

## 2. Where secrets live (the canonical stores)

Nothing sensitive belongs in the repo. Each secret has exactly one home:

| Store | What lives there |
|-------|------------------|
| **Vercel → Project → Environment Variables** | Frontend build-time vars: `VITE_*` |
| **Forge → Site → Environment** | Backend `.env`: `APP_KEY`, `DB_*`, `REDIS_*`, `REVERB_*`, `POSTMARK_TOKEN`, `AWS_*`, `SANCTUM_*`, `SENTRY_*` |
| **GitHub → Repo → Secrets and variables → Actions** | CI-only secrets: `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER` |
| **Supabase → Project Settings → Database** | DB password (regenerate here, paste into Forge) |
| **Cloudflare → R2 → Manage API tokens** | R2 access key + secret |
| **Postmark → Servers → API Tokens** | Server token |
| **Mapbox → Account → Tokens** | Public token (frontend) — yes it's "public", but rotate if scope changes |
| **1Password (team vault)** | Shared, human-recoverable copies of the above so we don't lose the only set. Per-secret notes mention which store is canonical. |

If a secret appears in two places (vault excluded) and one isn't the
canonical store, that's a leak — clear the duplicate.

---

## 3. Per-secret rotation steps

### 3.1 `APP_KEY` (Laravel application key)

Used to encrypt session cookies, signed URLs, and `Crypt::encryptString()`
output. **Rotating invalidates active sessions, signed URLs, and any
already-encrypted data.**

1. Schedule a 5-minute maintenance window. The site will sign users out.
2. Local: `php artisan key:generate --show` → copy the output.
3. Forge → Environment → replace `APP_KEY` → Save.
4. Forge → Deploy → "Deploy Now" (runs `config:cache` with the new key).
5. Confirm sign-in works.

### 3.2 Database password (Supabase)

1. Supabase → Project Settings → Database → Reset database password.
2. Copy the new password.
3. Forge → Environment → replace `DB_PASSWORD` → Save.
4. Forge → Deploy → "Deploy Now".
5. `curl https://api.<domain>/api/health` returns 200 with `db: ok`.

Note: the Supabase pooler may cache the old credential for a few seconds
after reset — expect a brief 5xx spike, then recovery.

### 3.3 Sanctum bearer tokens

Sanctum tokens have an 8 h TTL via `SANCTUM_TOKEN_EXPIRATION`. Routine
rotation isn't required, but on suspected compromise:

```bash
php artisan tinker
>>> \Laravel\Sanctum\PersonalAccessToken::truncate();
```

Every user is forced to re-authenticate. The password-reset flow already
calls this scoped to the user.

### 3.4 Reverb app key / secret

`REVERB_APP_KEY` is shared with the frontend (it's a public WebSocket app
identifier — like a Pusher key). `REVERB_APP_SECRET` is server-only.

1. Generate: `openssl rand -hex 16` (key) and `openssl rand -hex 32` (secret).
2. Forge → Environment → update both → Save.
3. Vercel → Production → update `VITE_REVERB_APP_KEY` to match.
4. Redeploy both. The Reverb daemon restarts via the deploy script's
   `php artisan reverb:restart` call.

Connected clients drop and reconnect — expect a brief gap in live updates.

### 3.5 Postmark token

1. Postmark → Servers → API Tokens → Issue a new one.
2. Forge → Environment → `POSTMARK_TOKEN` → Save → Deploy.
3. Revoke the old token in Postmark.

Test by triggering a password reset to a team email.

### 3.6 Cloudflare R2 access key

1. Cloudflare → R2 → Manage API tokens → Create token (Read & Write on the
   bucket only — no account-wide perms).
2. Forge → Environment → `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` → Save → Deploy.
3. Cloudflare → revoke the old token.

### 3.7 GitHub Actions deploy SSH key

1. Local: `ssh-keygen -t ed25519 -C "github-actions-nuvola" -f ./tmp_deploy_key -N ""`
2. Forge → Server → SSH Keys → add the *public* key (`tmp_deploy_key.pub`).
3. GitHub → Repo → Settings → Secrets and variables → Actions →
   replace `DEPLOY_SSH_KEY` with the *private* key contents.
4. Trigger the deploy workflow; confirm it lands.
5. Forge → Server → SSH Keys → remove the previous public key.
6. `shred -u tmp_deploy_key tmp_deploy_key.pub` locally.

### 3.8 Mapbox public token

The token is in `VITE_MAPBOX_TOKEN` (Vercel). Public means anyone reading
JS can see it — but it's URL-restricted on the Mapbox dashboard, so leakage
doesn't immediately equal abuse.

1. Mapbox → Account → Tokens → Create token (restrict to the production
   URLs only).
2. Vercel → Production env → `VITE_MAPBOX_TOKEN` → Save → Redeploy.
3. Mapbox → delete the previous token.

---

## 4. What is NOT rotated

These are not secrets and don't go on the schedule:

- The repo's public ID (`AustineIgunza/Nuvola_Atlas`).
- The Vercel project name, Forge server hostname, Supabase project ref.
- Mapbox style URLs.
- The Sanctum `SANCTUM_STATEFUL_DOMAINS` list (configuration, not a secret).

---

## 5. Tooling

- **GitHub secret scanning** (built-in, free for public repos) is on. Any
  Anthropic/OpenAI/Stripe-style key pasted into the repo by accident pings
  the org admin.
- **Dependabot** (via `.github/dependabot.yml`) covers dependencies, not
  secrets. It will not catch a leaked key.
- Add **gitleaks** as a CI check before the first public pilot —
  scheduled, not in 9.7 scope.

---

## 6. Checklist for the quarterly rotation

Print this; tick as you go. Don't context-switch mid-rotation.

- [ ] Maintenance window announced in the shared channel (5 min).
- [ ] `APP_KEY` rotated (§3.1).
- [ ] DB password rotated (§3.2).
- [ ] Reverb key/secret rotated (§3.4).
- [ ] Postmark token rotated (§3.5).
- [ ] R2 keys rotated (§3.6).
- [ ] Deploy SSH key rotated (§3.7).
- [ ] Mapbox token rotated (§3.8) — verify production URL still loads.
- [ ] Sanctum tokens NOT routinely rotated; check §3.3 only if suspicion.
- [ ] 1Password vault updated with the new values; old entries archived.
- [ ] `/api/health` returns 200.
- [ ] Smoke: sign-in, post a report, see the alert in the UI, receive the
      verification email.
- [ ] Date the rotation in the shared calendar; schedule the next one +90 d.

---

## 7. After a suspected leak

1. Rotate the affected secret first (don't investigate first — burn it).
2. Open `docs/ops/postmortem-template.md` (per §9.12).
3. Search GitHub: `https://github.com/search?q=org:AustineIgunza+<leaked-fragment>`.
4. Search public paste sites only if there's specific reason to.
5. If the leak is a DB credential, audit the Supabase logs for the prior
   24 h: unexpected IPs, unexpected queries.
6. Notify partners if their data could have been read (the bar for
   notification is real, not theoretical).

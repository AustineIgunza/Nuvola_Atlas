# Incident Response Runbook

_Status: pre-pilot. Lives under `tasks/todo.md` §9.12._
_Last updated: 2026-06-08._

This document is what we do in the first 30 minutes after we notice that
production is broken. It is deliberately short. If you are reading this
*during* an incident, jump to §3 (first 15 minutes) and come back later.

We are five students. There is no 24/7 on-call rotation. The realistic
goal is: during partner working hours (Mon–Fri 09:00–18:00 EAT), at least
one of us is reachable and the response starts within 30 minutes.

---

## 1. What counts as an incident

An incident is anything that makes the platform unusable for a partner
or that exposes data we shouldn't have exposed.

**Page-the-team severity (SEV-1):**
- The Atlas / Vitality dashboard returns 5xx for any signed-in user.
- The `/api/health` endpoint is failing.
- Authentication is broken — sign-in, password reset, or 2FA does not
  work.
- A partner reports they cannot reach the product.
- Any suspected data exposure: leaked secret, RLS bypass, mis-shared
  link.

**Working-hours severity (SEV-2):**
- A non-critical page is broken but the rest of the product works
  (e.g. /reports loads but `/admin/audit` 500s).
- An ingestion job is silently failing (no fresh data, no errors
  surfaced).
- Sentry error rate > 1 % sustained 10 minutes but no user-visible
  symptom yet.

**Backlog severity (SEV-3):**
- A single broken button, a layout regression, a sparkline rendering
  oddly. Forward-fix PR; no incident process.

---

## 2. Roles during an incident

For the pilot stage we collapse the usual roles:

| Role | Owner during incident | Job |
|------|-----------------------|-----|
| **Incident Commander (IC)** | First responder | Drives the response; decides forward-fix vs. rollback. Has the final call. |
| **Comms** | IC (or delegated to Joy if she's online) | Posts updates in the shared channel and on the status page every 15 min. |
| **Tech** | IC + whoever knows the affected subsystem | Actually runs the rollback / fix. |
| **Scribe** | Whoever isn't on Tech | Captures the timeline as it happens — pasted later into the postmortem template. |

IC is whoever responds first. Don't wait for "the right person" — the
right person is the one who saw it first.

---

## 3. The first 15 minutes

1. **Acknowledge.** Post in the shared channel: *"SEV-1 [or 2], I'm IC,
   investigating [symptom]."* If nobody else responds in 2 minutes,
   carry on as a solo IC.
2. **Confirm scope.** `curl https://api.atlas.nuvola.dev/api/health`.
   Open the frontend in incognito. Hit a real endpoint
   (`/api/v1/zones`). Is it global or one path? One user or many?
3. **Capture state.** Screenshot Sentry "Issues" panel; tail the last
   500 lines of `storage/logs/laravel-*.log` via Forge SSH; note the
   commit SHA Forge is currently deploying.
4. **Decide forward fix or rollback** using the decision tree in
   `docs/ops/rollback.md` §1. If you can't ship the fix in 15 minutes
   with confidence, **revert**.
5. **Communicate.** First update in the channel: timestamp + what's
   broken + what you're doing. Repeat every 15 minutes until resolved.
   For partner-facing incidents, post the same content (minus internal
   detail) on the BetterStack status page.

---

## 4. After the immediate fix

1. Confirm the fix end-to-end:
   - `/api/health` returns 200.
   - The originally-failing user flow now works (don't just trust
     metrics — actually click the thing).
   - Sentry error rate decays to baseline within 5 minutes.
2. Post resolution in the channel: timestamp + what we did + what's
   still flaky if anything.
3. Open the postmortem document (`docs/ops/postmortem-template.md`),
   fill in the timeline while it's fresh. Scribe's notes go here.
4. File follow-up issues for action items. **Every action item must
   have an owner and a date** — postmortems without owners are how
   patterns repeat.

---

## 5. Comms templates

### 5.1 Public status page update (BetterStack)

```
SEV-{1|2}  Investigating
{HH:MM EAT}

We're investigating reports that {symptom — what the user sees}.
We'll update here every 15 minutes until this is resolved.
```

### 5.2 Internal channel acknowledgement

```
🚨 SEV-{1|2}: {one-line symptom}
IC: @{your-handle}
Scribe: @{or "none yet"}
Started: {HH:MM EAT}
Current hypothesis: {what you think it is, or "unknown"}
```

### 5.3 Resolution post (public + internal)

```
✅ Resolved at {HH:MM EAT}
{One sentence on what happened.}
{One sentence on what we did.}
Postmortem to follow within {24h for SEV-1, 1w for SEV-2}.
```

---

## 6. Specific symptom → first action

| Symptom | First check | Most likely cause |
|---------|-------------|-------------------|
| `/api/health` returns 500 | Forge logs → DB connect error? | Supabase credentials rotated / pooled-conn exhaustion |
| `/api/health` returns 503 | Forge `artisan up` status | We're stuck in maintenance mode |
| Sign-in returns 429 from real users | Rate limiter bucket | Bot scan from a single IP — block at Cloudflare |
| Frontend builds but blank page | Browser console | Mapbox token missing or wrong env on Vercel |
| Dashboard 5xx, API ok | Browser network tab | Specific endpoint regression — check recent admin/* changes |
| Sentry: `current_setting('app.current_partner_id')` errors | `SetPartnerContext` middleware | The `nuvola_app` non-superuser role isn't set up in Supabase (see deploy.md §2 step 5) |
| All requests hanging | DB connections | Migrate left a long-running transaction; restart pgbouncer/queue workers |

If the symptom isn't in this table, it's a new one — write a one-liner
into this table after the incident closes.

---

## 7. Escalation

For the pilot, we don't escalate to a paging service. The escalation
path is:

1. Post in shared channel (always).
2. Direct-message the team member who most recently touched the affected
   subsystem (check `git log -n 5 -- <affected-path>`).
3. If nobody responds within 30 minutes and the issue is SEV-1, send a
   one-line text message to that team member.
4. If still no response after 60 minutes, the IC unilaterally decides
   (rollback is almost always the right call here).

We will revisit this when we have a paid partner with an SLA.

---

## 8. Related runbooks

- `docs/ops/rollback.md` — how to actually roll back.
- `docs/ops/deploy.md` — how deployments work; helpful for figuring out
  what's actually deployed.
- `docs/ops/secret-rotation.md` — if the incident involves a leaked
  secret, this is the next doc.
- `docs/ops/postmortem-template.md` — the writeup.

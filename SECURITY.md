# Security Policy

## Supported Versions

Navuuna is currently in pre-pilot development against `main`. Only the
latest `main` commit is supported for security fixes during this phase.

## Reporting a Vulnerability

If you discover a security issue in Navuuna — the frontend, the
Laravel backend, the FastAPI ingestion service, the OpenAPI contract,
or any deployed infrastructure — please report it privately. Do **not**
open a public GitHub issue.

Email **security@navuuna.example** with:

- A description of the issue and the potential impact.
- Steps to reproduce, or a proof-of-concept where appropriate.
- The commit SHA, deployed URL, or environment you observed it on.
- Your name / handle if you would like to be credited in the advisory.

We aim to acknowledge reports within **3 working days** and to publish an
advisory once a fix has been deployed. There is no bounty programme during
the pilot phase.

## What Counts

In scope:

- Authentication / authorisation bypass (`/auth/*`, role gating, RLS).
- Data exposure (cross-tenant reads, IDOR on `/api/v1/*`).
- Injection (SQL, NoSQL, command, header, log).
- Anything that gets the AI assistant to read personal data, or to run a
  statement the SQL guard should have refused. Prompt injection counts.
- Cryptography / token-handling issues (Sanctum tokens, password resets).
- Server-side request forgery, deserialization, and supply-chain risks.
- Compromise of the audit log integrity.

Out of scope for the pilot:

- Findings against third-party services we don't run (Vercel, Supabase,
  Mapbox, Cloudflare).
- Self-XSS that requires the victim to paste content into devtools.
- Issues that depend on a stolen laptop / unattended session.
- Rate-limit gaps where we already publish the configured limit.

## Hardening Already In Place

- All API responses use the RFC 7807 `application/problem+json` shape so
  errors do not leak stack traces in production.
- HSTS (`max-age=31536000; includeSubDomains; preload`) on every production
  response.
- Content Security Policy on HTML responses; the JSON API stays unaffected.
- `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, COOP, CORP on every response.
- Role-based access (`role:editor,admin`) on write endpoints; viewers and
  partners are strictly read-only on internal resources today.
- Append-only `audit_logs` table tracks every write to Reports and Alerts
  plus auth events.
- Bearer tokens are Sanctum personal access tokens with an 8-hour TTL;
  successful password resets revoke every active token for the affected
  user.

### The AI assistant

The assistant generates SQL, so it is treated as hostile input at three
independent layers. Each is designed to hold if the ones above it fail.

- **Database grants are the primary control.** The assistant connects as a
  dedicated read-only role, and `SELECT` on `users` is revoked from that role
  outright. Aggregate user counts reach it through the `chat_user_stats` view
  instead, which exposes no personal data.
- **The connection is mandatory, and it fails closed.** With `DB_CHAT_RO_USER`
  unset, chat errors rather than falling back to the privileged connection.
  There is no environment where an unconfigured deployment silently runs the
  assistant as the app user.
- **`SqlGuard` parses rather than pattern-matches.** It tokenises the statement
  and resolves every table source, so the bypasses that defeat a regex do not
  get through: comments of any nesting, stacked statements, and reads reached
  via subquery, derived table, CTE, `UNION`, comma join, quoted identifier or
  set-returning function all resolve back to the table allowlist. Keywords and
  semicolons inside string literals are not mistaken for syntax. It is defence
  in depth: assume it will eventually be bypassed, and the grants above hold.

If you find a way through all three, that is exactly the report we want.

## Coordinated Disclosure

We will work with reporters on a disclosure timeline that fits the
severity of the issue. The default is **90 days** from acknowledgement,
shortened if a fix ships sooner. After the embargo expires we publish a
GitHub Security Advisory linking to the patching commit.

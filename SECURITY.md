# Security Policy

## Supported Versions

Nuvola Atlas is currently in pre-pilot development against `main`. Only the
latest `main` commit is supported for security fixes during this phase.

## Reporting a Vulnerability

If you discover a security issue in Nuvola Atlas — the frontend, the
Laravel backend, the FastAPI ingestion service, the OpenAPI contract,
or any deployed infrastructure — please report it privately. Do **not**
open a public GitHub issue.

Email **security@nuvola-atlas.example** with:

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

## Coordinated Disclosure

We will work with reporters on a disclosure timeline that fits the
severity of the issue. The default is **90 days** from acknowledgement,
shortened if a fix ships sooner. After the embargo expires we publish a
GitHub Security Advisory linking to the patching commit.

# Internal Transport Contract — FastAPI ↔ Laravel

**Owners:** Devyan (FastAPI side), Khillon (Laravel side)
**Last updated:** 2026-07-10
**Status:** Draft — formalise before Phase B ingest cutover.

Daystar → FastAPI is public HTTPS. FastAPI → Laravel is server-to-server
and is protected by a single shared header, `X-Internal-Secret`. This
document is the contract for that header — how it is generated, rotated,
and verified.

## Header format

```
X-Internal-Secret: <opaque token, 48+ bytes, base64-safe>
```

- Generate with `openssl rand -base64 48`.
- No prefix / bearer scheme. The header value is the raw token so both
  sides can `hmac.compare_digest` without stripping.
- Anything shorter than 48 bytes must be rejected outright — the
  ingestion service already refuses empty values and the Laravel side
  will do the same.

## Environment mapping

| Environment | Where it lives                        | Rotated by |
|-------------|---------------------------------------|------------|
| Local       | `.env` in both repos                  | Any developer |
| Staging     | Vercel env (ingestion) + Forge env (Laravel) | Devyan + Khillon |
| Production  | Vercel env (ingestion) + Forge env (Laravel) | Devyan + Khillon |

The Vercel and Forge values must be updated as a pair, in the same
change window, or an ingest request will get rejected until they match
again. See `docs/ops/secret-rotation.md` for the full playbook.

## Verification

FastAPI (`app/security.py`):

```python
if not hmac.compare_digest(x_internal_secret, expected):
    raise HTTPException(status_code=401, ...)
```

Laravel (Phase B — to be added by Khillon): the intake route must guard
with a matching middleware that:

1. Reads `X-Internal-Secret` from the request.
2. Compares against `config('ingestion.internal_secret')` using
   `hash_equals()` (Laravel's constant-time equivalent).
3. Returns `401` with the RFC 7807 shape on failure.
4. Never logs the raw header value — logs use a redacted `sha256:…`
   fingerprint for debugging.

## Failure modes

| Failure                              | Response       | Alert |
|--------------------------------------|----------------|-------|
| Header missing                       | 401            | No    |
| Header mismatch                      | 401            | Yes (Sentry breadcrumb + BetterStack) |
| Header present but too short         | 401            | Yes   |
| Rate-limit exceeded upstream         | 429            | Yes   |

## Rotation policy

- Rotate every 90 days by default, or immediately after any suspected
  leak.
- Rotation is a two-step deploy: (1) roll a new secret into both
  environments simultaneously, (2) confirm health probes on both sides
  before considering the rotation complete.
- Never commit the raw secret to the repo — the `.env.example` in
  `nuvola-atlas-ingestion/` uses a placeholder.

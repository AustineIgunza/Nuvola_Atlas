# Internal Transport Contract — FastAPI ↔ Laravel

**Owners:** Devyan (FastAPI side), Khillon (Laravel side)
**Last updated:** 2026-08-07
**Status:** Formal — in force from Phase B ingest cutover.

Ingestion traffic crosses two hops, and they are not equally trusted.

| Hop | Path | Trust | Credentials |
|-----|------|-------|-------------|
| 1 | Daystar → FastAPI | third party, public HTTPS | `X-Internal-Secret` only |
| 2 | FastAPI → Laravel | ours end to end | `X-Internal-Secret` + timestamp + HMAC-SHA256 signature |

Hop 1 is token-only on purpose: Daystar is a university partner posting a
CSV/GeoJSON drop, and requiring them to implement request signing for the
pilot would stall Phase B on someone else's release cycle. Hop 2 is code we
own on both ends, so it carries the full scheme.

## Hop 1 — Daystar → FastAPI

```
X-Internal-Secret: <opaque token, 48+ bytes, base64-safe>
```

- Generate with `openssl rand -base64 48`.
- No prefix / bearer scheme. The header value is the raw token so both
  sides can compare in constant time without stripping.
- Empty or mismatched values are rejected with `401`. A missing *server-side*
  configuration is a `503`, not a `401` — the caller did nothing wrong.
- Implemented in `nuvola-atlas-ingestion/app/security.py`.

## Hop 2 — FastAPI → Laravel

Three headers, all required:

```
X-Internal-Secret:    <the same shared token>
X-Internal-Timestamp: <unix seconds, integer>
X-Internal-Signature: sha256=<lowercase hex>
```

### Canonical signing string

```
{timestamp}.{raw request body bytes}
```

The signature is `HMAC-SHA256(secret, signing_string)`, hex-encoded, prefixed
with `sha256=`. The timestamp is inside the MAC so it cannot be rewritten to
extend the replay window.

The body is signed and transmitted as **bytes**, not as a re-serialized
object. Both sides must MAC the exact octets on the wire — any middlebox that
re-encodes JSON will invalidate the signature, which is the intended
behaviour.

Reference implementations:

- Sign: `nuvola-atlas-ingestion/app/signing.py::sign`
- Verify: `nuvola-atlas-backend/app/Http/Middleware/VerifyInternalSecret.php`

```python
# python
digest = hmac.new(secret.encode(), f"{ts}.".encode() + body, hashlib.sha256).hexdigest()
```

```php
// php
$computed = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $expected);
```

### Clock skew

Requests are accepted while `abs(now - timestamp) <= 300` seconds. The
constant is `MAX_CLOCK_SKEW_SECONDS` in `signing.py` and
`VerifyInternalSecret::MAX_CLOCK_SKEW` — **change both or neither.**

### Verification order

Laravel checks in this order, 401ing at the first failure:

1. Server-side secret is configured (else `503`).
2. `X-Internal-Secret` matches under `hash_equals`.
3. Both signature headers are present.
4. Timestamp is numeric and inside the skew window.
5. Computed signature matches under `hash_equals`.

Neither side ever logs the raw header. Rejections log a redacted
`sha256:<first 12 hex>` fingerprint of the presented value plus a machine
reason (`secret mismatch`, `signature headers missing`,
`timestamp outside skew window`, `signature mismatch`).

## Retry policy

The forwarder makes **one initial attempt plus up to three retries**, sleeping
`1s → 4s → 16s` between them (`RETRY_BACKOFF_SECONDS` in
`app/services/laravel_forwarder.py`). Backoff is stepped rather than doubled
so a Laravel deploy — tens of seconds of 502s — still lands inside the window.

Retried: `408, 425, 429, 500, 502, 503, 504`, and any transport-level
`httpx.HTTPError`. Every retry is re-signed with a fresh timestamp.

Not retried: every other `4xx`. Those mean the payload itself is wrong, so
resending the same bytes only burns budget. A `401` in particular means the
secrets have drifted apart between Vercel and Forge — page, do not retry.

`ForwardResult.attempts` records how many sends it took, and the ingest
receipt surfaces it so a partial batch is diagnosable from the response alone.

## Error envelope

Both services reject with RFC 7807 `application/problem+json`:

```json
{
  "type": "https://navuuna.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or missing internal transport credentials.",
  "instance": "api/v1/ingest"
}
```

- Laravel: `problemResponse()` in `bootstrap/app.php`.
- FastAPI: `app/problems.py::register_problem_handlers`.

The `detail` string is deliberately identical for every credential failure —
it must not disclose *which* of the five checks failed. The machine reason
goes to the log, not to the caller.

## Environment mapping

| Environment | Where it lives | Rotated by |
|-------------|----------------|------------|
| Local | `.env` in both repos (`docker-compose.yml` shares `INGEST_INTERNAL_SECRET`) | Any developer |
| Staging | Vercel env (ingestion) + Forge env (Laravel) | Devyan + Khillon |
| Production | Vercel env (ingestion) + Forge env (Laravel) | Devyan + Khillon |

Variable names differ by service and this is load-bearing:

- Ingestion reads `INGESTION_INTERNAL_SECRET` (the `INGESTION_` prefix comes
  from `Settings.model_config`).
- Laravel reads `INGEST_INTERNAL_SECRET`.

The two values must be updated as a pair, in the same change window, or every
ingest gets a `401` until they match again. See `docs/ops/secret-rotation.md`.

## Failure modes

| Failure | Response | Alert |
|---------|----------|-------|
| Secret not configured server-side | 503 | Yes — deploy is broken |
| Header missing | 401 | No |
| Header mismatch | 401 | Yes (Sentry breadcrumb + BetterStack) |
| Signature headers missing | 401 | Yes |
| Timestamp outside skew window | 401 | Yes — check NTP on both hosts |
| Signature mismatch | 401 | Yes — body was rewritten in transit |
| Rate limit / budget exceeded | 429 | Yes |

## Rotation policy

- Rotate every 90 days by default, or immediately after any suspected leak.
- Rotation is a two-step deploy: (1) roll the new secret into both
  environments simultaneously, (2) confirm health probes on both sides before
  calling the rotation complete.
- Never commit the raw secret. `nuvola-atlas-ingestion/.env.example` and
  `docker-compose.yml` both carry obvious placeholders.

## Contract tests

The scheme is pinned from both directions. If one side is edited without the
other, these go red before staging does:

- `nuvola-atlas-ingestion/tests/test_signing.py` — canonical string, tamper,
  wrong secret, rewritten timestamp, skew boundary.
- `nuvola-atlas-ingestion/tests/test_laravel_forwarder.py` — signed headers
  verify, retry budget, no-retry on 4xx.
- `nuvola-atlas-backend/tests/Feature/IngestContractTest.php` — the PHP mirror
  of the same canonical string, plus the RFC 7807 rejection shape.

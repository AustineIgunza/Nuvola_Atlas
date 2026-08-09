"""Contract tests for the FastAPI -> Laravel signing scheme.

The PHP-side mirror of these expectations lives in
nuvola-atlas-backend/tests/Feature/IngestContractTest.php. Both files
encode the same canonical string; if one is edited without the other, the
hop breaks in staging rather than here, so keep them in step.
"""
from __future__ import annotations

import hashlib
import hmac

from app.signing import MAX_CLOCK_SKEW_SECONDS, fingerprint, sign, verify

SECRET = "test-internal-secret-value-that-is-long-enough-000"
BODY = b'{"indicators":{"healthcare_access":82},"source":"fastapi.daystar","zone_id":"westlands"}'


def test_signature_matches_the_canonical_php_construction() -> None:
    ts, signature = sign(SECRET, BODY, timestamp=1_760_000_000)

    expected = hmac.new(
        SECRET.encode(),
        b"1760000000." + BODY,
        hashlib.sha256,
    ).hexdigest()

    assert ts == 1_760_000_000
    assert signature == f"sha256={expected}"


def test_valid_signature_verifies() -> None:
    ts, signature = sign(SECRET, BODY)
    assert verify(SECRET, BODY, str(ts), signature) is True


def test_tampered_body_fails_verification() -> None:
    ts, signature = sign(SECRET, BODY)
    assert verify(SECRET, BODY.replace(b"82", b"99"), str(ts), signature) is False


def test_wrong_secret_fails_verification() -> None:
    ts, signature = sign(SECRET, BODY)
    assert verify("a-different-secret", BODY, str(ts), signature) is False


def test_rewritten_timestamp_fails_verification() -> None:
    _, signature = sign(SECRET, BODY, timestamp=1_760_000_000)
    assert verify(SECRET, BODY, "1760000001", signature, now=1_760_000_001) is False


def test_stale_timestamp_is_outside_the_skew_window() -> None:
    ts, signature = sign(SECRET, BODY, timestamp=1_760_000_000)
    stale = 1_760_000_000 + MAX_CLOCK_SKEW_SECONDS + 1
    assert verify(SECRET, BODY, str(ts), signature, now=stale) is False


def test_timestamp_at_the_skew_boundary_still_verifies() -> None:
    ts, signature = sign(SECRET, BODY, timestamp=1_760_000_000)
    edge = 1_760_000_000 + MAX_CLOCK_SKEW_SECONDS
    assert verify(SECRET, BODY, str(ts), signature, now=edge) is True


def test_non_numeric_timestamp_fails_verification() -> None:
    _, signature = sign(SECRET, BODY)
    assert verify(SECRET, BODY, "not-a-timestamp", signature) is False


def test_fingerprint_never_reveals_the_secret() -> None:
    fp = fingerprint(SECRET)
    assert SECRET not in fp
    assert fp.startswith("sha256:")
    assert len(fp) == len("sha256:") + 12
    assert fingerprint("") == "sha256:empty"

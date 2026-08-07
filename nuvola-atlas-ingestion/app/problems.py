"""RFC 7807 ``application/problem+json`` error envelopes.

The Laravel API already renders every failure as problem+json. The
ingestion service sits on the same call chain, so a caller walking the
chain (Daystar -> FastAPI -> Laravel) sees one error shape end to end
instead of having to special-case whichever hop rejected it.
"""
from __future__ import annotations

from collections.abc import Mapping

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM_BASE = "https://navuuna.dev/problems"
CONTENT_TYPE = "application/problem+json"

_TITLES = {
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Resource not found",
    413: "Payload too large",
    422: "Validation failed",
    429: "Too many requests",
    503: "Service unavailable",
}


def problem(
    status: int,
    detail: str,
    request: Request,
    *,
    problem_type: str | None = None,
    headers: Mapping[str, str] | None = None,
    **extra: object,
) -> JSONResponse:
    body: dict[str, object] = {
        "type": f"{PROBLEM_BASE}/{problem_type or _slug(status)}",
        "title": _TITLES.get(status, "Request failed"),
        "status": status,
        "detail": detail,
        "instance": request.url.path,
    }
    body.update(extra)
    return JSONResponse(body, status_code=status, media_type=CONTENT_TYPE, headers=headers)


def _slug(status: int) -> str:
    return _TITLES.get(status, "request-failed").lower().replace(" ", "-")


def register_problem_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def _http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        # Retry-After on a 429/503 is the actionable half of the response —
        # dropping it would leave callers guessing at the backoff.
        return problem(exc.status_code, detail, request, headers=exc.headers)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return problem(
            422,
            "The request body did not match the expected schema.",
            request,
            problem_type="validation-error",
            errors=jsonable_encoder(exc.errors()),
        )

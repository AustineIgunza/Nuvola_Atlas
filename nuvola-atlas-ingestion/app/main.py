"""FastAPI entry point for the Navuuna ingestion microservice."""
from __future__ import annotations

import sentry_sdk
from fastapi import FastAPI

from app import __version__
from app.config import get_settings
from app.problems import register_problem_handlers
from app.routers import health, ingest, scheduler


def create_app() -> FastAPI:
    settings = get_settings()

    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.environment,
            release=f"nuvola-atlas-ingestion@{__version__}",
            traces_sample_rate=0.1,
            send_default_pii=False,
        )

    app = FastAPI(
        title="Navuuna Ingestion Service",
        version=__version__,
        description=(
            "Cleans and forwards Daystar University indicator batches into the "
            "Navuuna Laravel API. Deployable as a Vercel Fluid Compute Python "
            "function or under Uvicorn on Forge."
        ),
    )
    register_problem_handlers(app)
    app.include_router(health.router)
    app.include_router(ingest.router)
    app.include_router(scheduler.router)
    return app


app = create_app()

"""Vercel Fluid Compute entrypoint.

Vercel's Python runtime discovers a module under `api/` and looks for a
module-level ASGI callable named `app`. Everything real lives in
`app.main`; this file exists so the deploy target and the local
uvicorn/Docker target share one application factory rather than drifting
into two.
"""
from app.main import app

__all__ = ["app"]

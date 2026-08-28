# 0002 — A Vite SPA against a headless API, not Next.js

**Status:** accepted · **Date:** 2026 (recorded 2026-08-28, retroactively)

## Context

The frontend is React. The default choice in 2026 is Next.js, and a reviewer
will ask why it was not used.

## Decision

React 18 + Vite 5 + TypeScript, as a single-page app against a headless Laravel
JSON API. Explicitly **not** Next.js. This is part of the grant-locked stack —
changing it means amending the proposal.

## Why it is also the right call on merit

**The backend is already the backend.** Laravel owns scoring, storage, auth and
the API. Next.js would add a second server-side runtime whose main job would be
proxying to the first. Two backends, one product.

**Server rendering buys little here.** The product is a Mapbox GL map with an
interactive scorecard — client-side by nature. The one genuinely
SEO-relevant surface is the public per-ward portal, and that is a small number
of pages that can be pre-rendered or served statically if it ever matters.

**Deployment stays simple.** A Vite build is static files on Vercel's CDN. No
serverless function cold starts in front of the API, no edge/node runtime
split to reason about.

## Consequences

- No SSR. If the public portal ever needs indexing, that is a specific problem
  with specific solutions, not a reason to move the whole app.
- Routing is `react-router-dom`, declared in `app/App.tsx`.
- Every page is code-split via `React.lazy`, wrapped in `lazyWithRetry`.
  **That wrapper is load-bearing**: a Vercel deploy changes chunk hashes, and a
  tab open across the deploy would otherwise fail to load a chunk that no longer
  exists. `lazyWithRetry` reloads once to self-heal. Every `React.lazy` must go
  through it.
- The SPA needs `rewrites` sending all paths to `index.html`, which is why
  `vercel.json` exists at the repo root.

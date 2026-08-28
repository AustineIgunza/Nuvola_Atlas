# 0006 — Park out-of-scope surfaces; do not delete them yet

**Status:** accepted · **Date:** 2026-08-28

## Context

The August 2026 refocus cut the product from eight pillars to three plus one
held. It did **not** cut the pages. Fourteen routes are still registered, and
roughly 5,200 lines of frontend components plus seven backend service
namespaces belong to surfaces outside the MVP: admin console, investor portal,
AI assistant, alerts, reports.

This sits awkwardly beside an existing house position — recorded in
`COPYRIGHT.md` and enforced for pillars — that **off means deleted, not
feature-flagged**, because a dormant flag is an invitation to reinstate an
unsupported number under deadline pressure.

## Decision

For **pillars**, that position stands unchanged: a retired pillar has no code
path, and a test sweeps the public read surface to prove it.

For **whole product surfaces**, park rather than delete:

- the code moves to `src/parked/` and `app/Parked/`
- its routes are not registered
- `scripts/check-parked.sh` fails the build if anything outside `parked/`
  imports from it
- `parked/README.md` records why each is there and what turning it on needs

Turning one back on is `git mv` plus restoring a route — a two-line pull
request, visible in the diff.

## Why parking rather than deleting

Deletion is the better answer for onboarding and we know it. It is not the
better answer for **optionality**, and these surfaces are not speculative: the
investor portal and the admin console were built to a specification and may
return once the MVP ships.

The decisive factor is that these surfaces are **not cleanly separable today**.
Six live files import from them — the app shell and sidebar read investor
components, the scorecard panel renders a zone-notes card, the Atlas and
Compare pages embed the assistant. Deleting means resolving those six knots
first, and three of them are product decisions about what the live shell
contains. Parking makes the boundary explicit and lets the decisions happen
one at a time.

## Why not runtime feature flags

This was the first proposal and it is worse than both alternatives.

- **Git is already the off switch.** With `v0.1-pre-restructure` tagged,
  `git checkout <tag> -- src/features/admin` restores anything exactly.
- **These are already off for users.** `RequireAdmin` and `RequireInvestor` gate
  them, and every page is lazy-loaded through `lazyWithRetry`, so an unrouted
  page is not in any downloaded chunk. A flag buys no security and no bundle win.
- **The remaining cost is developer confusion, and a flag adds to it.** A
  flagged-off feature is still in the live tree *plus* a new concept to learn.
- **Flags rot.** Code that is off and never exercised drifts; turning it on
  after six months means a week of repair. Git history costs nothing to keep.

## Consequences

- Roughly 5,200 frontend lines stay visible in the tree. That is the price of
  optionality, and it is a real cost against the onboarding goal.
- **Parking does not touch the database.** All 51 migrations have run; `firms`,
  `impersonation_sessions`, `chat_conversations` and `alert_rules` still exist.
  A new developer opening the schema still sees the old product. This is the
  largest remaining source of confusion and parking does not solve it — only
  deletion would.
- The parked directories are where a future scope decision lands cheaply: when
  someone decides the investor portal is never coming back, deleting
  `parked/investor` touches nothing else.

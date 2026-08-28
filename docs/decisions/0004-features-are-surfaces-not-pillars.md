# 0004 — Frontend features are product surfaces, not pillars

**Status:** accepted · **Date:** 2026-08-28

## Context

The rebuild plan specified a feature-first frontend with one folder per pillar:

```
features/
  water/    roads/    energy/    freedom/
  atlas/    scorecard/
```

The intent was right — the frontend was layer-first, and "where does water &
sanitation live?" had five answers across three directories.

Built literally against this codebase, the pillar split would have been wrong.

## Decision

Features are **product surfaces**. Pillar logic lives in a separate `domain/`
layer with no JSX.

```
src/
  app/        the shell
  domain/     water.ts, scores.ts, deltas.ts, estimates.ts, types.ts
  features/   atlas, scorecard, vitality, compare, projects, portal, account…
  shared/     ui, chrome, hooks, lib, stores
  api/        client, contract, live, demo
```

"Where does water live?" is now `domain/water.ts`. One file.

## Why the pillar split fails here

**Pillars are data, not features.** `PillarBar`, `Leaderboard`, `CountyBanner`
and `ScorecardPanel` render *every* pillar generically from `pillars.json`.
There is no per-pillar component to put in a per-pillar folder.

**Only water has bespoke logic**, and it is not a vertical slice either:
`waterProfile` is imported from five places across the map, the scorecard panel
and Compare. A `features/water/` folder would be a folder everything imports
from — the definition of a shared module, not a feature.

**Two of the four named pillars no longer exist.** The registry has
`water_sanitation`, `road_density`, `transit_access` and `electricity_access`.
`energy` and `freedom` are pre-refocus names.

**`features/freedom/` would have been actively harmful.** "Freedom Index" was
purged for trademark reasons — Freedom House holds prior use, and Navuuna cites
their score as a source — and `scripts/check-freedom-index.sh` is a
build-failing tripwire watching for the name's return. The pillar is now
`civic`, and retired.

Built as specified, the result would have been three near-empty directories,
one that everything depends on, and a folder name that fails the build.

## Consequences

- Adding a pillar means editing `pillars.json`, not creating a directory.
- A pillar that *does* grow bespoke logic gets a `domain/` module, not a feature
  folder — `domain/water.ts` is the pattern.
- `features/` currently holds surfaces outside the MVP (admin, investor,
  assistant, alerts, reports). They are there rather than deleted — see
  [`0006`](0006-park-dont-delete.md).
- Stores all live in `shared/stores`. Every one has consumers in two or more
  features, and `shared/chrome` reads the impersonation store, so pushing them
  into features would make shared code import from a feature.

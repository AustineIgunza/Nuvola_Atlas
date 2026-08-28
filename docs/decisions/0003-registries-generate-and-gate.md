# 0003 — The registries generate the code, and gate the build

**Status:** accepted · **Date:** 2026-08-22 (recorded 2026-08-28)

## Context

Before the August 2026 refocus, the definition of a pillar lived in four places
that could drift silently: `ScoreCalculator`, `config/methodology.php`, the
FastAPI pydantic models, and the frontend types. Renaming a pillar meant finding
all four. Nothing failed if you found three.

## Decision

One file per domain concept, at the repo root, generating typed bindings into
every service that consumes it — and a build-failing check that the generated
files are current.

**`pillars.json`** — what we measure. `scripts/gen-pillars.mjs` writes
`config/pillars.php`, `domain/pillars.generated.ts` and two
`pillars_generated.py`. `--check` fails if any has drifted.

**`zones.json`** — where we measure it, the 17 sub-counties.
`scripts/check-zones.mjs` compares it against the Laravel seeder and the
boundary GeoJSON on slug, name and count.

Generated files carry a do-not-edit banner. Editing one by hand fails CI.

## Why compare rather than generate, for zones

`pillars.json` can emit bindings because its consumers are plain data. The zone
consumers are not: one is a PHP seeder carrying fixture pillar values alongside
the zone definitions, the other a GeoJSON `FeatureCollection` with geometry.
Generating either would mean the registry owning content it has no business
owning. Comparison costs one script and catches the same drift.

## Alternatives rejected

**YAML instead of JSON.** More readable, supports comments. Rejected: YAML needs
a parser dependency in all three languages; JSON needs none. `pillars.json`
carries a `$comment` array, which covers the one real advantage.

**A Python generator.** Rejected: Node is already a frontend dependency, so a
`.mjs` generator adds no toolchain. A `.py` one would mean you need Python
installed to work on the frontend.

**Trusting review.** This is the alternative that was actually in force before,
and it is what the refocus replaced. The quality of the codebase was personal
rather than institutional — it depended on one person's discipline, and
discipline does not transfer with a repo.

## Consequences

- A pillar is retired in one place and disappears from four codebases.
- `pillars.json` is the best onboarding artefact in the repo: read one file,
  understand the domain model.
- **A guard only counts if it runs.** Both checks were `make check`-only until
  2026-08-27, so `HISTORY.md` sat in violation of the retired-name tripwire for
  three days while CI reported green. They now run in CI as well. A check that
  exists but fires nowhere is worse than no check, because it is trusted.

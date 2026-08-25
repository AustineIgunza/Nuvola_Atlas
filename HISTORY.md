# Navuuna change history

Chronological log of the refocus (August 2026) and the round-2 rebuild
that followed. Newer entries first. For each entry: the commit hash so
`git show <hash>` gives the full detail, the file paths touched at a
glance, and the *why* in one line.

The doc that pairs with this one is `NAVUUNA_REFOCUS_WORKFLOW.md §11`,
which is the *decision* ledger (what shipped and what was deferred, with
the reasoning). This file is the *change* log — commit-by-commit.

---

## 2026-08-25 · Round-2: P8 audit + follow-through

- **`4b8e4fb`** — `feat(frontend)`: source + vintage caption on
  `PillarBar` + attribution footer on `Leaderboard`. CSV export ships a
  second header row with per-pillar source. Closes the
  definition-of-done item "every number on screen shows its source and
  vintage" (§9). PillarBar tests 5 → 7.
- **`c8a038e`** — `fix(copy)`: retire the legacy '9 of 13 indicators
  active' language in the pilot-live announcement fixture and the n8n
  Slack summary (`infra/n8n/workflows/01-daystar-drop-intake.json`).
  Navuuna has no closed indicator set; a stale denominator would
  misstate coverage.
- **`4c6ebfe`** — `test(backend)`: guard `/api/v1/vitality/methodology`
  against sub-indicator weight leaks (P8 trade-secret boundary). Three
  assertions: top-level key allowlist, weights-map pillar-only, and
  a forbidden-key-pattern scan at any nesting level.
- **`fdc7065`** — `feat(backend)`: bind `zone_score_snapshots` to
  `methodology_version_id` (P8). Nullable FK + backfill from current
  version. `ScoreCalculator::recalculate` stamps the current version so
  a v-bump does not silently rewrite historical scores. Four-case
  `SnapshotMethodologyVersionBindingTest` covers this.
- **`703e150`** — `docs(round-2)`: `NAVUUNA_REFOCUS_WORKFLOW.md §11`
  status ledger. Records P7 shipped 2026-08-24, P9 shipped 2026-08-25,
  P10 deferred with the written reason (extractor pipeline is empty
  scaffold and the reconciled CSV already carries what Phase 0 needs).

## 2026-08-25 · Round-2: P9 (granularity end-to-end) + envelope

- **`8f12ed0`** — `feat(frontend)`: `CountyBanner` above the atlas map
  reads `/api/v1/county-context`, renders source + vintage inline,
  gap rows show "Not measured", defensive filter refuses a sub-county
  payload. 6 new vitest tests.
- **`b558c69`** — `feat(ingestion)`: `POST /api/ingest/wasreb` with
  `WasrebReading` pydantic envelope, per-indicator plausibility bounds
  (whole batch rejected on any breach). `forward_county_context`
  ships batches in one request. Bounds copied from
  `pipeline.wasreb.vocabulary` with a drift test on the data-package
  side.
- **`f416902`** — `feat(backend)`: `county_context` table with three
  DB CHECK constraints (granularity ≠ subcounty, R1 gap⇒null,
  non-gap-needs-source-and-vintage). Read endpoint
  `GET /api/v1/county-context`, internal intake
  `POST /api/v1/internal/county-context` (X-Internal-Secret).
  `data_feed_status` gains `vintage` + `granularity`; WASREB registered
  in the seeder.
- **`e44d09b`** — `feat(data)`: extend the provenance envelope per R2
  amendment 4. `method` gains `"imputed"`; new fields `imputed_from`
  (required for imputed, forbidden otherwise), `zone_id` (forbidden on
  non-subcounty), `confidence` (0-100). Four new invariants tested.
- **`d0bcabf`** — `refactor(pillars)!`: `civic_index` → `civic` per
  round-2 rebuild-plan amendment. The retirement gravestone in
  `pillars.json` now carries the full identifier chain
  (`freedom_index` → `civic_index` → `civic`) under
  `retired.renamed_from`.

## 2026-08-25 · Round-2 P7 (compliance sweep — same day continuation)

- **`92ed8f1`** — `feat(fixture-gate)!`: block fixture zones from every
  export and every public read route. `data_provenance = fixture|mixed`
  hidden from the public API; visible to admin/editor with the flag
  attached. Closes P7 Task 3.

## 2026-08-24 · Round-2 P7 (compliance sweep)

- **`017001c`** — `feat(branding)`: expand UE as "Urban-Environmental",
  read from a single exported constant in both
  `nuvola-atlas-frontend/src/lib/branding.ts` and
  `nuvola-atlas-backend/config/branding.php`. Closes P7 Task 2.
- **`991f50e`** — `refactor(pillars)!`: rename `freedom_index` to
  `civic_index`. Freedom House holds prior use of the label and Navuuna
  cites their Internet Freedom Score, so the label was purged for
  trademark reasons. `scripts/check-freedom-index.sh` enforces the
  purge going forward. Closes P7 Task 1.
- **`c99097d`** — `feat(data)`: load the reconciled WASREB CSV into
  the county_context path. End-to-end test proves R2 (utility rows
  land in `county_context`, never on a sub-county feature).
- **`19d1c9a`** — `refactor(data)!`: align the WASREB vocabulary to
  the reconciled CSV column keys.
- **`446d096`** — `docs(data)`: add `NAVUUNA_PROMPTS_ROUND2.md` and
  the reconciled `wasreb_impact17_long.csv` (641 values, 3 of 5
  categories).
- **`7b656fb`** — `feat(data)`: scaffold the WASREB IMPACT parser
  (protocol only — no offset solver yet; see P10 deferral).
- **`3d2587f`** — `feat(data)`: scaffold `nuvola-atlas-data` package
  with the two integrity rules (R1 gap⇒null, R2 subcounty-only)
  enforced in code.
- **`cb477d9`** — `chore(pillars)`: emit the registry into the new
  data package.

## 2026-08-23 · Post-refocus consolidation

- **`3f82f11`** — `fix(frontend)`: stop the client silently
  misrepresenting zone data.
- **`9ac1082`** — `docs`: bring the documentation set in line with
  the refocused codebase.
- **`edc59cd`** — `fix(ingestion)`: repoint the n8n drop intake at
  the live pillar registry.
- **`e6088e4`** — `test(backend)`: guard that a retired pillar cannot
  reach an API response.
- **`1b4b58d`** — `fix(ingestion)!`: post pillars to Laravel and reject
  switched-off keys.
- **`3fee6b8`** — `refactor(frontend)!`: render the four live pillars,
  delete the retired UI.
- **`7a363ba`** — `refactor(backend)!`: serve pillars from the
  registry, retire the old indicator model.
- **`ea419ff`** — `feat(pillars)`: add the pillar registry
  (`pillars.json` at repo root) as the single source of truth.

## 2026-08-22 · Refocus paperwork

- **`f8b3d03`** — `docs`: retire the pre-refocus documentation set.
- **`58d8755`** — `fix(chat)`: cut the assistant off from personal
  data at the database (P0 blocker in the round-2 read-me).

---

For anything earlier — see `git log --oneline` and the phased build
plans in `docs/archive/`. The refocus (August 2026) was the moment
Navuuna narrowed from a general urban-intelligence platform to a
sub-county service-performance record for Nairobi, so anything before
`ea419ff` (2026-08-23) is history the current codebase does not
implement.

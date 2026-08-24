# Navuuna — Claude Code prompts, round 2 (P7–P10)

**Date:** 21 August 2026
**Follows:** P0–P6 in `NAVUUNA_REFOCUS_WORKFLOW.md`
**Aligned to:** IP, Legal & Competitive Dossier · Marketing & Channel Plan · Platform Overview

---

## Read this before running anything

The three documents introduced constraints that P0–P6 did not know about. Four of them change the code.

**1. Water & Sanitation is not currently a pillar indicator.** The UE Vitality Index has 13 indicators across 4 pillars, and **none of them is water**. W&S exists only as an Atlas *layer* (added 2026-07-04). If W&S is now the flagship module, that requires a **methodology version bump** — not a hack. The `methodology_versions` table exists for exactly this.

**2. The weighting vector is a trade secret.** P4 said to emit weights into `provenance.json`. That was wrong. Pillar-level weights (0.25 each) are already public in the Platform Overview and may be published. **Sub-indicator weights and the null-exclusion internals must never appear in any output, API response, or public file.** `config/methodology.php` must never reach a public repo.

**3. "Freedom Index" is a trademark liability.** Freedom House has prior use, and Navuuna *cites* their Internet Freedom Score as a source. It must be purged from all UI copy, labels, charts and exported files — not merely deprecated. This is in the marketing plan's Phase 0 as a blocking item.

**4. There is an absolute ban on publishing scores computed from fixtures.** The Module Readiness Scorecard puts data readiness at 3–4 out of 10 and the "8 of 13 indicators active" badge is hardcoded. Publishing a low score for Kibra or Mathare off seeded data is defamation-adjacent and burns the communities the platform depends on. This needs to be enforced in code, not in a policy document.

---

### P7 — Compliance sweep: Freedom Index, UE, and the fixture gate

```
Context: Three compliance items from the IP, Legal & Competitive Dossier and the
Marketing & Channel Plan. All three are blocking items in the marketing plan's
Phase 0 — no public posting begins until they are closed.

TASK 1 — Purge "Freedom Index"
Freedom House has prior use of this term and is a source Navuuna cites. Using it
as a product name or score label creates trademark confusion risk and would be
refused at KIPI.
- Find every occurrence of "Freedom Index" (and case/spacing variants) across the
  backend, frontend, ingestion service, i18n files, seeders, fixtures, tests,
  OpenAPI descriptions, and any exported file template.
- Replace with "UE Vitality Index" or "Vitality Score" as contextually correct.
- Add a CI check that fails the build if the string reappears anywhere outside a
  historical changelog entry.
- Report every file you changed, with counts.

TASK 2 — Define "UE"
"UE Vitality Index" is used throughout the codebase without the acronym ever
being expanded. Set it to "Urban-Environmental" and apply consistently:
- Add a single exported constant for the full name; have the UI, OpenAPI
  descriptions and report exports read from it rather than hardcoding strings.
- Update i18n strings in all three locales (English, Kiswahili, French).

TASK 3 — The fixture gate (most important of the three)
There must be no code path by which a zone score computed from seed or mock data
can leave the system. Implement:
- A `data_provenance` flag on every zone score: "measured" | "fixture" | "mixed".
- ScoreCalculator sets it based on whether the contributing indicators trace to a
  real ingested feed or to a seeder/fixture.
- Any zone whose score is "fixture" or "mixed":
    · is excluded from every export (ZoneReportExporter, investor brief, CSV, GeoJSON)
    · returns the score in the API only when the caller is authenticated as
      admin or editor, and always with the flag attached
    · renders in the UI with an explicit "Demo data" treatment that cannot be
      confused with a measured score
- Add tests asserting that a fixture-scored zone cannot appear in any export.

Constraints:
- Do not weaken the existing null-exclusion rule in ScoreCalculator. A missing
  indicator is still never zero. This adds a provenance dimension alongside it.
- Do not remove or rename the missingIndicators ledger or the ZoneScoreUpdated
  broadcast contract — both are claimed IP.
```

---

### P8 — Methodology v2: add the Water & Sanitation pillar properly

```
Context: The UE Vitality Index currently has 13 indicators across 4 pillars, and
none of them measures water or sanitation. Water & Sanitation exists only as an
Atlas map layer. The August strategy refocus makes W&S the flagship module, so
the methodology must gain water indicators through the versioning mechanism that
already exists — never by editing the live version in place.

Read config/methodology.php and the methodology_versions migration before
starting. The partial-unique-index-on-is_current pattern guarantees exactly one
live version; preserve it.

Tasks:
- Author a new methodology version (semver minor bump) that adds water and
  sanitation indicators to Pillar 4 (Infrastructure & Environmental Safeguards).
  Proposed indicators, all sourceable from KNBS 2019 Census at sub-county level:
      water_source_improved_share    -- % households with an improved main water source
      sanitation_improved_share      -- % households with an improved toilet type
  And, at utility/county granularity only (see P9), from WASREB:
      non_revenue_water              -- utility-level
      hours_of_supply                -- utility-level
- Do NOT edit the current version's weights row. Insert a new methodology_versions
  row, leave is_current on the old one, and add an admin action to promote it.
- Historical zone_score_snapshots must remain computed against the version that
  was current when they were written. Verify this holds and add a test.
- Update the pillar-to-indicator map, the MethodologyResource, and the
  MethodologyPreview service so an admin can diff v1 against v2 before promoting.
- Update the frontend "N of 13 indicators active" badge to read the count from
  the live methodology version rather than a hardcoded number.

CRITICAL — trade secret boundary:
- Pillar-level weights (0.25 each) may appear in API responses and public docs.
- Sub-indicator weights and the null-exclusion algorithm internals must NEVER
  appear in any API response, export, GeoJSON property, or public file.
- Audit MethodologyResource and the OpenAPI spec to confirm this holds, and add
  a test that fails if a sub-indicator weight is serialised anywhere.

Constraints:
- config/methodology.php stays out of any public repository.
- Do not change the four pillar names or the equal 0.25 weighting — both are in
  the Platform Overview and the copyright filing.
```

---

### P9 — The granularity rule and the WASREB ingestion route

```
Context: We now hold a reconciled WASREB IMPACT 17 dataset — 68 utilities, 641
values, FY2023/24, in wasreb_impact17_long.csv. It is UTILITY-level data.
NCWSC serves the whole of Nairobi County, so Nairobi's 48% non-revenue water is
ONE number covering all 17 sub-counties. Spreading it across bubbles would be
inventing data.

TASK 1 — Enforce granularity in the data model
- Add a `granularity` field to every indicator value:
  "subcounty" | "county" | "utility" | "national".
- Hard rules, enforced by tests, not documentation:
    · granularity != "subcounty"  ->  the value MUST NOT enter a zone's
      properties or the zones table's indicator_* columns. It goes into a
      separate county_context store.
    · method == "gap"  ->  value MUST be null. Never a number, never zero.
- Add a `county_context` table or JSON store keyed by county + fy + indicator,
  and expose it on a new endpoint. The Atlas reads it for the banner.

TASK 2 — /ingest/wasreb
Add a route to the FastAPI ingestion service, alongside the existing
/ingest/knbs, /ingest/openaq, /ingest/kura, /ingest/nema-esia, /ingest/kplc,
/ingest/ketraco:
- Accepts the long-format CSV schema: utility_name, size_category, fy, indicator,
  value, unit, granularity, method, source_id, report_issue, vintage,
  extraction_confidence, attribution.
- Pydantic schema with plausibility validation per indicator (percentages 0-100,
  hours_of_supply 0-24, total_score 0-200). Reject the batch on any violation
  rather than clamping.
- Rows with extraction_confidence "low" are stored but flagged and excluded from
  any published output by default.
- Preserve the existing null-preservation policy — never coerce a null to zero.
- Register WASREB in data_feed_status with its vintage, so the staleness ledger
  shows "FY2023/24, annual" rather than treating it as a stale hourly feed.
- Use the existing X-Internal-Secret contract for the FastAPI -> Laravel hop.

TASK 3 — The county banner
- Render county_context ABOVE the Atlas map, clearly labelled county-wide:
  e.g. "Nairobi County · Non-revenue water 48% · NCWSC · WASREB IMPACT 17 ·
  FY2023/24". It must be visually impossible to mistake for a sub-county value.
- Source and vintage render as part of the component by default, not as an
  optional prop. Same for every chart and export template — attribution is a
  design element, not a caption.

Constraints:
- OpenStreetMap (ODbL) and WorldPop (CC-BY) attribution is licence-required and
  must render wherever their data appears.
- Do not name a specific failing utility in any default-visible UI copy or
  export title. The data is there; the framing stays sector-level.
```

---

### P10 — Finish the parse: Small and Private categories

```
Context: The WASREB Highlights decks store each category table column-major, and
the PDF's internal text order does not follow the visual column order. Very
Large, Large and Medium have been reconciled. Small (22 utilities) and Private
(4) have not — their blocks are incomplete or return the wrong number of values.

See wasreb_extract.py for the offset solver, the plausibility gate, the
run-together splitter, and the LayoutSpec pattern.

Tasks:
- Render each Highlights category page to PNG:
      pdftoppm -r 200 -png Impact-17-Highlights.pdf page
- Read each table visually and write a LayoutSpec for it: category, utility
  count, and the block order as it appears in the extracted text.
- Re-run the extraction against those specs. Reconcile against the narrative
  anchors already known:
      Oloitokitok is the lowest-ranked utility overall, with 6 points
      Tana has 8 points, Samburu 9
      Oloolaiser is NOT ranked (Special Regulatory Regime) - exclude, don't zero
      Private WSPs are exactly four: Kiamumbi, Runda, Two Rivers, Tatu City
- Resolve the open items in the Verification queue sheet, in particular:
      Nairobi hours of supply (extracted as 7 - confirm or correct)
      Large water coverage rows 24-25 (ambiguous "667" split)
      Large total scores (36 values recovered for 37 utilities)
- Then extend the same approach to IMPACT issues 16 and 15, which is where the
  time series starts to have value.

Constraints:
- Never interpolate, forward-fill or estimate a missing year or value.
- A value that splits more than one way stays null and gets logged, not guessed.
- Every value keeps its page_ref. When WASREB asks how we got a number, we show
  them the page.
- Update the manifest with sha256 for every PDF downloaded.
```

---

## Sequencing note

P7 is blocking for the marketing plan — nothing gets posted until Freedom Index is purged, UE is defined, and the fixture gate is in. P8 and P9 can run in parallel. P10 is the long tail and can run alongside everything else.

The one thing that should not wait: **KECOBO filing before the dataset is published.** The underlying WASREB facts are not ours and publishing them openly is right, but the compilation is a claimed asset under Category B of the copyright filing. File first, publish second — it costs three weeks, not three months.

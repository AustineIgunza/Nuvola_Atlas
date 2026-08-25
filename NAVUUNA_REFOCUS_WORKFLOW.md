# Navuuna — Refocus Workflow & Claude Code Prompts

**Date:** 21 August 2026
**Repo:** `github.com/AustineIgunza/Nuvola_Atlas`
**Reads with:** Navuuna Focus & Business Value Brief · One-Page Positioning · Data Sourcing Findings Report (16 Aug 2026)

---

## 0. What actually changes

Nothing in the stack is thrown away. Laravel 11, FastAPI, Supabase/PostGIS, React 18 + Vite 5, the Mapbox map — all stay.

| | Before | After |
|---|---|---|
| Pillars rendered | 8 (4 real, 2 proxy, 2 invented) | 3 (2 real, 1 labelled proxy) |
| Flagship | "Vitality Score" | **Water & Sanitation service performance** |
| Second | Road Progress | **Road density + transit accessibility** |
| Held, labelled | Smart Grid | **Electricity Access (2019 census)** |
| Off | — | Freedom Index, Safety, Project Momentum, Environment |
| New asset | — | **WASREB IMPACT time series** (17 editions, machine-readable) |
| New requirement | — | **Provenance on every value** — source, vintage, method |

The map is the same engine. Fewer pillars, better sourced, with the receipts attached.

---

## 1. The one technical decision that will trip you up

**Granularity mismatch. Deal with it in week one or it poisons everything.**

- KNBS census data is **sub-county** (17 units). ✅ matches the map.
- WASREB IMPACT data is **utility-level**. NCWSC serves all of Nairobi County.

So Nairobi's 51% non-revenue water is **one number for all 17 sub-counties**. You cannot spread it across bubbles. Doing so would be inventing data — exactly what your own integrity rule forbids.

**How to handle it:**

Every indicator carries a `granularity` field: `subcounty` | `county` | `utility` | `national`.

- `subcounty` → renders on the bubble
- `county` / `utility` → renders in a **county banner** above the map, not on bubbles
- `national` → context only, greyed
- Anything with `method: "gap"` → grey, no number, ever

This is not a limitation to hide. It *is* the product. Nobody else in Kenya publishes a service-performance figure with its granularity honestly declared, and that is precisely why a regulator or funder will trust yours.

---

## 2. Three parallel tracks

### Track A — DATA (Joy leads, Austine supports)
Produce the files. Runs offline, no backend needed.

### Track B — SOFTWARE (Devyan + Khillon)
Security first, then scope cut, then consume the files.

### Track C — INSTITUTIONAL (Austine)
Emails and letters. Blocks nothing, unblocks everything later.

**Critical rule:** Track A and Track B are decoupled by **one contract** — the shape of `nairobi_vitality.geojson`. Agree the field names on day one and the two tracks never block each other. This is exactly what the Integration Guide already says; honour it.

---

## 3. Data workflow (Track A)

### Stage 0 — Boundaries (do this first, everything joins to it)

| | |
|---|---|
| Source | Kenya COD-AB admin2 (IEBC), on HDX |
| URL | `https://data.humdata.org/dataset/cod-ab-ken` |
| Take | the `admin2` shapefile from the `.shp.zip` |
| Licence | Open, attribute IEBC / geoBoundaries |

```bash
ogr2ogr -where "adm1_name = 'Nairobi'" nairobi_subcounties.gpkg ken_admin2.shp
ogrinfo -so nairobi_subcounties.gpkg   # must report 17 features
```

If it reports 0, run `ogrinfo -so ken_admin2.shp` and find the real county-name column.

### Stage 1 — Sources, by pillar

**WATER & SANITATION — flagship**

| Source | What | Granularity | Effort |
|---|---|---|---|
| KNBS 2019 Census | % households by main water source; by toilet type | sub-county | Low — it's an xlsx |
| **WASREB IMPACT 1–17** | NRW, hours of supply, metering ratio, revenue collection, O&M cost coverage, water quality, staff productivity, coverage | utility + county | **High — this is the build** |
| WPDx | Individual water points with status | point | Medium |

**ROAD — second**

| Source | What | Granularity | Effort |
|---|---|---|---|
| HOT OSM roads (Kenya) | Road network as lines | line → aggregate | Low |
| Digital Matatus GTFS | Matatu routes and stops | point/line | Medium |

Compute two things: road density (km per km²) and **transit accessibility** (population within X m of a matatu stop, per sub-county). The second is the interesting number and nobody publishes it.

**ELECTRICITY ACCESS — held, labelled**

KNBS 2019 Census: % of households using electricity for lighting. Sub-county. Label the vintage loudly.

### Stage 2 — The WASREB parser (the crown jewel)

This is the single highest-value artefact in the whole project. Treat it accordingly.

```
Input:   17 annual IMPACT report PDFs from wasreb.go.ke/impact-reports
Output:  wasreb_impact_long.csv
Schema:  utility_id, utility_name, county, fy, indicator, value, unit,
         report_issue, page_ref, extraction_confidence
```

Notes that will save you a week:
- The indicator set and table layout **change between editions**. Do not write one parser; write a per-edition extractor with a shared normaliser and a canonical indicator vocabulary.
- Keep `page_ref` for every value. When WASREB asks how you got a number, you show them the page.
- `extraction_confidence`: `high` (clean table), `medium` (OCR/reflow), `low` (manual). Publish the low ones flagged, don't silently drop them.
- Spot-check **at least 30 values by hand** against the PDFs before publishing anything. One wrong figure and the whole record is worthless.

### Stage 3 — Emit

Three outputs, not one:

1. `nairobi_vitality.geojson` — feeds the map, exactly the shape the Integration Guide specifies
2. `wasreb_impact_long.csv` + `.parquet` — the open asset you publish
3. `provenance.json` — source, licence, vintage, retrieval date, checksum per dataset

### Stage 4 — Publish

Static file in the repo, per Option A in the Integration Guide. No backend until there's a genuine live-refresh requirement. Then publish the WASREB series openly with attribution to WASREB.

---

## 4. Software workflow (Track B)

**Order is not negotiable.** Security → scope cut → data contract → consume → performance.

```
P0  Security remediation          ← blocks everything, hours not days
P1  Pillar registry + scope cut   ← makes the codebase match the strategy
P2  Data package + provenance     ← the contract between tracks
P3  WASREB parser                 ← the asset
P4  Join + emit geojson           ← fills the map with real numbers
P5  Frontend provenance rendering ← turns the discipline into a feature
P6  Audit performance items       ← safe to defer, not to skip
```

---

## 5. Repo layout after the refocus

Add a fourth package to the monorepo:

```
Nuvola_Atlas/
├── nuvola-atlas-backend/      (Laravel 11)
├── nuvola-atlas-frontend/     (React 18 + Vite 5)
├── nuvola-atlas-ingestion/    (FastAPI)
└── nuvola-atlas-data/         ← NEW
    ├── manifests/             one YAML per source: url, licence, vintage, checksum
    ├── sources/               raw downloads (gitignored; manifests are the record)
    ├── pipeline/
    │   ├── boundaries.py
    │   ├── knbs.py
    │   ├── wasreb/            per-edition extractors + normaliser
    │   ├── osm_roads.py
    │   ├── gtfs_transit.py
    │   ├── indicators.py      canonical vocabulary + granularity rules
    │   ├── score.py           scaling + weights, in ONE place
    │   └── emit.py
    ├── outputs/
    │   ├── nairobi_vitality.geojson
    │   ├── wasreb_impact_long.csv
    │   └── provenance.json
    └── tests/
```

Keep the scoring weights in one file and version them. An index whose weighting is hidden cannot be defended in a room.

---

## 6. `CLAUDE.md` for the repo root

Drop this at the repo root. Claude Code reads it automatically on every session, which stops you re-explaining the scope each time.

```markdown
# Navuuna (repo: Nuvola_Atlas)

Sub-county service-performance record for Nairobi. NOT a general urban
intelligence platform. Scope was deliberately narrowed in Aug 2026.

## Active pillars
- Water & Sanitation  (flagship) — KNBS census + WASREB IMPACT
- Road                (second)   — OSM road density + Digital Matatus GTFS
- Electricity Access  (held)     — KNBS 2019 census, labelled with vintage

## Switched off — do not reintroduce without a written decision
Freedom Index · Safety & Security · Project Momentum · Environment · Smart Grid (live)

## Non-negotiable rules
1. Never render an invented or proxy number as measured. `method: "gap"` renders grey.
2. Every indicator value carries source, vintage, granularity, method.
3. Utility/county-level values NEVER render on sub-county bubbles. County banner only.
4. The AI assistant has no access to `users` or any table containing PII.
5. Scoring weights live in one versioned file. No inline magic numbers.

## Stack
Laravel 11 · FastAPI (Python 3.13) · Supabase Postgres + PostGIS · React 18 + Vite 5
Packages: nuvola-atlas-backend, -frontend, -ingestion, -data
```

---

## 7. Claude Code prompts

Run these as separate sessions. Do not paste them all at once — Claude Code does better work on scoped tasks with clear acceptance criteria, and you want to review each one before the next.

---

### P0 — Security remediation `RUN FIRST`

```
Context: Laravel 11 API with an LLM-backed chat feature that generates SQL
against a Supabase Postgres database. A security audit found critical issues.
This code will handle Kenyan government data, so this must be airtight.

Findings to fix:

1. CRITICAL — `users` is listed in `allowed_tables` in config/ai.php, and a
   migration grants SELECT on public.users to the read-only chat role. A prompt
   injection can therefore retrieve emails and password hashes.

2. CRITICAL — In local/testing environments without DB_CHAT_RO_USER configured,
   execution falls back to the primary DB_USERNAME connection, which has full
   read/write privileges.

3. HIGH — SqlGuard validates table names with the regex
   /\b(?:FROM|JOIN)\s+([A-Z0-9_.]+)/ which misses implicit comma joins.
   `SELECT * FROM zones, users` passes the guard.

Tasks:
- Remove `users` from allowed_tables.
- Write a migration that REVOKEs SELECT on public.users from the chat role and
  creates a view `chat_user_stats` exposing only id, role, created_at. Add only
  that view to the allowlist.
- Make DB_CHAT_RO_USER mandatory in ALL environments. If it is not configured,
  the chat feature must fail closed with a clear error — never fall back to the
  privileged connection. Update .env.example and the local setup docs.
- Replace the regex table extraction with a proper SQL AST parser
  (evaluate greenlion/php-sql-parser or an equivalent maintained library).
  Validate every table reference node against the allowlist, including
  comma joins, subqueries and CTEs.
- Add tests covering: comma-join bypass, subquery reference to a disallowed
  table, CTE reference, semicolon in a string literal, and a missing
  DB_CHAT_RO_USER failing closed.

Constraints:
- Database-level permissions are the primary control. The parser is
  defence-in-depth, not the guard. Assume the parser will eventually be bypassed
  and make sure that is survivable.
- Do not weaken any existing check to make tests pass.

Acceptance:
- All new tests pass.
- A prompt asking for user emails or password hashes returns a refusal or an
  authorisation error, never data — verify by actually running the chat path.
```

---

### P1 — Pillar registry and scope cut

```
Context: Navuuna currently renders 8 pillars, several of which have no real data
source. We are narrowing to 3. See CLAUDE.md at the repo root for the scope.

Goal: make the codebase structurally incapable of rendering a pillar we cannot
source, rather than relying on people remembering not to.

Tasks:
- Create a single pillar registry (one module, imported by backend, ingestion
  and frontend — or duplicated from one generated JSON if cross-language sharing
  is awkward). Each pillar declares:
    key, display_name, status (active | held | off),
    method (measured | proxy | gap),
    granularity (subcounty | county | utility | national),
    source_id, vintage, weight
- Populate it:
    ACTIVE:  water_sanitation (measured, subcounty)
             road_density     (measured, subcounty)
             transit_access   (measured, subcounty)
    HELD:    electricity_access (measured, subcounty, vintage "2019 census")
    OFF:     freedom_index, safety, project_momentum, environment, smart_grid
- Anything with status "off" must not be served by the API, must not appear in
  the frontend, and must not have a code path that could render it. Delete the
  dead components rather than hiding them behind a flag.
- Rename in the UI and API: "Smart Grid" -> "Electricity Access",
  "Road Progress" -> "Road Density". Update all copy, keys and any seeded data.
- Add a test that fails if a pillar with status "off" appears in any API response.

Constraints:
- Do not delete historical migrations. Add new ones.
- Keep the existing Mapbox map, styling, colour bands and side panel exactly as
  they are. This task changes what data exists, not how it is drawn.
```

---

### P2 — Data package and the provenance contract

```
Context: Creating a new package `nuvola-atlas-data` that produces the data files
the app consumes. It runs offline and is decoupled from the app by one contract:
the shape of nairobi_vitality.geojson.

Tasks:
- Scaffold nuvola-atlas-data with the layout in NAVUUNA_REFOCUS_WORKFLOW.md §5.
  Python 3.13, pinned deps, ruff + pytest.
- Define the provenance schema. Every indicator value is:
    {
      "value": number | null,
      "unit": string,
      "indicator": string,          // from the canonical vocabulary
      "granularity": "subcounty" | "county" | "utility" | "national",
      "method": "measured" | "proxy" | "gap",
      "source_id": string,          // maps to a manifest
      "vintage": string,            // "FY2023/24", "2019 census"
      "retrieved": "YYYY-MM-DD",
      "page_ref": string | null     // for PDF-extracted values
    }
- A manifest format (YAML, one per source) recording: name, url, licence,
  attribution string, vintage, retrieval date, sha256 of the raw file.
- Implement pipeline/boundaries.py: download COD-AB admin2, filter to Nairobi,
  write nairobi_subcounties.gpkg. Assert exactly 17 features or fail loudly.
- Implement pipeline/emit.py writing nairobi_vitality.geojson.

CRITICAL RULE — encode this in the emitter, not in documentation:
  - method == "gap"  -> value MUST be null. Never a number.
  - granularity != "subcounty" -> the value goes in a top-level
    `county_context` object, NEVER into a feature's properties.
  Add tests asserting both. These tests are the product's integrity guarantee.

- Before finalising field names inside `properties`, read the current frontend
  and match the existing dummy-object keys exactly so the file drops in with no
  renaming. Report the names you found.

Constraints:
- No network calls at import time. Downloads are explicit pipeline steps.
- Every output file gets a companion entry in provenance.json.
```

---

### P3 — The WASREB IMPACT parser

```
Context: WASREB (Kenya's water regulator) publishes an annual IMPACT report.
17 editions exist as PDFs at wasreb.go.ke/impact-reports. They contain utility-
level performance data for up to 92 water service providers across 47 counties:
non-revenue water, hours of supply, metering ratio, revenue collection
efficiency, O&M cost coverage, water quality, staff productivity, coverage.

Nobody has turned this into a machine-readable time series. That series is our
core asset. Accuracy matters more than coverage — a wrong number is worse than
a missing one.

Tasks:
- Build pipeline/wasreb/ with:
    - a downloader that fetches each edition and records sha256 in a manifest
    - PER-EDITION extractors (the table layouts and indicator sets change
      between years — do not attempt one universal parser)
    - a normaliser mapping each edition's column headers to a canonical
      indicator vocabulary defined in one place
    - a utility-name resolver handling renames, mergers and spelling variants
      across years, with an explicit alias table that a human maintains
- Output wasreb_impact_long.csv (and .parquet) with columns:
    utility_id, utility_name, county, fy, indicator, value, unit,
    report_issue, page_ref, extraction_confidence
- extraction_confidence: "high" (clean structured table), "medium" (reflowed or
  OCR'd), "low" (ambiguous). Never silently drop a low-confidence value — emit
  it flagged.
- Build a validation report: per edition, how many utilities and indicators were
  extracted, which pages failed, and any value outside a plausible range
  (e.g. a percentage above 100).
- Write a manual spot-check harness: sample 30 random values, print each with
  its page_ref, and record a human verdict in a checked-in file.

Constraints:
- Use pdfplumber for structured tables. Only fall back to OCR where genuinely
  needed, and mark those values medium confidence.
- Do not interpolate, estimate or forward-fill missing years. Missing is missing.
- Do not compute any sub-county figure from this data. It is utility-level and
  must be tagged granularity: "utility".

Acceptance:
- At least 10 editions parsed with a validation report per edition.
- The spot-check file exists with 30 human-verified values.
```

---

### P4 — Join, score, and emit the map file

```
Context: Combining the boundaries, KNBS census tables and derived road/transit
metrics into the single GeoJSON the Mapbox map reads.

Tasks:
- pipeline/knbs.py: load the 2019 census tables (population/density/households;
  % households by main water source; by toilet type; by lighting fuel), join to
  the 17 sub-counties by name with an explicit alias table for name mismatches.
  Fail loudly on any unmatched sub-county — never drop one silently.
- pipeline/osm_roads.py: clip HOT OSM Kenya roads to each sub-county, sum length,
  divide by area -> road density (km/km²).
- pipeline/gtfs_transit.py: load Digital Matatus GTFS, compute per sub-county the
  share of population within 500 m of a stop, using WorldPop for the population
  surface. Document the buffer distance as a parameter, not a magic number.
- pipeline/score.py: scale each indicator to 0–100 across the 17 sub-counties.
  All weights in ONE versioned dict with a comment explaining each. Emit the
  weights into provenance.json so the index is defensible.
- pipeline/emit.py: write nairobi_vitality.geojson with the agreed property
  names, plus a top-level county_context object carrying the utility-level
  WASREB values for Nairobi (NCWSC).

Constraints:
- Re-read the CRITICAL RULE from P2. The county_context separation is the point.
- OSM coverage is biased: wealthier areas are mapped more completely than
  informal settlements. Record this as a caveat in provenance.json against
  every OSM-derived indicator so the frontend can surface it.
- The pipeline must be idempotent and rerunnable from manifests alone.
```

---

### P5 — Frontend: make provenance visible

```
Context: Our differentiator is that we never present an unsourced number. Right
now that discipline lives in a document. Make it a visible product feature.

Tasks:
- Swap the hardcoded dummy sub-county array for a fetch of
  /data/nairobi_vitality.geojson. Keep the Mapbox setup, bubble styling, colour
  bands and side panel exactly as they are.
- Every indicator shown in the side panel displays its source and vintage as
  small secondary text — e.g. "KNBS 2019 Census" or "WASREB IMPACT 17 · FY2023/24".
- Pillars with method "gap": render greyed with "Limited data" and no number.
  They must be visually distinct at a glance, not hidden.
- Render county_context in a banner ABOVE the map, clearly labelled as
  county-wide (e.g. "Nairobi County · Non-revenue water 51% · NCWSC · FY2023/24").
  It must be visually impossible to mistake for a sub-county value.
- Add a "Data sources" panel listing every dataset with its licence and
  attribution. OpenStreetMap and WorldPop attribution is licence-required.
- Where an indicator carries an OSM coverage caveat, show an info affordance
  explaining that under-mapped areas can appear to have fewer services.

Constraints:
- No new dependencies unless genuinely necessary.
- Do not change the colour thresholds or bubble geometry.
- Read /mnt/skills/public/frontend-design/SKILL.md conventions if present.
```

---

### P6 — Performance and reliability (from the audit)

```
Context: The audit flagged scalability issues. Lower priority than P0 but they
will bite as data grows.

Tasks:
- IngestController: readings are applied row-by-row inside a transaction,
  causing repeated updates to the same zones row and lock contention that blocks
  concurrent API reads. Group readings by zone_id in memory first, then issue
  ONE update per zone.
- Add PostGIS GIST spatial indexes on all geography/geometry columns
  (zones.centroid and any boundary columns). Add via migration and verify with
  EXPLAIN that the relevant queries use them.
- FastAPI: batches of up to 5,000 entries are validated synchronously with
  Pydantic, blocking the event loop and timing out /api/health. Move heavy list
  validation to asyncio.to_thread.
- The FastAPI -> Laravel signature check allows 300s clock skew. Add a healthcheck
  that alerts on clock drift between the two hosts, and document NTP as a
  deployment requirement.

Acceptance:
- A benchmark showing ingestion of 5,000 readings does not block /api/health.
- EXPLAIN output confirming index usage on a representative spatial query.
```

---

## 8. Institutional workflow (Track C)

Runs in parallel. Blocks nothing.

| When | Action | To | Anchor to |
|---|---|---|---|
| Week 1 | Letter requesting participation | Kenya Space Agency | EO Data Sharing Framework 2026 + the urban-observatory student-engagement item. Strathmore + Daystar on the letterhead. |
| Week 1 | Register accounts | tenders.go.ke, WBGeProcure | So K-WASH TORs and EOIs reach you |
| Week 2–3 | Meeting request | Nairobi City County | Their OGP Action Plan 2025–June 2027 Open Data Portal commitment |
| Week 4 | Introduction + the published series | WASREB | "We turned your 17 IMPACT reports into a queryable series. Attributed to you. Free." |
| Month 3+ | Grant application | Lacuna Fund | With the WASREB series as evidence of execution |

**Sequencing rule:** never approach WASREB or the county before the series exists. The whole strategy rests on arriving having already done work, not asking for permission to start.

---

## 9. Definition of done for this phase

- [ ] P0 merged; a chat prompt asking for user emails returns an error, verified live
- [ ] Codebase renders exactly 3 pillars; "off" pillars have no code path
- [ ] `wasreb_impact_long.csv` covers ≥10 editions with a validation report
- [ ] 30 values hand-verified against source PDFs, recorded in the repo
- [ ] `nairobi_vitality.geojson` drops into the map with zero frontend renaming
- [ ] Every number on screen shows its source and vintage
- [ ] Gap pillars render grey with no number
- [ ] County-level values appear only in the banner, never on a bubble
- [ ] Three letters sent

---

## 10. What "off" means

Off means deleted, not flagged. A feature flag is an invitation to turn it back on at 2am before a demo. If Freedom Index, Safety or Project Momentum returns, it returns through a written decision recorded in this document — with a named data source that actually exists.

The failure mode for this project is not a bad decision. It is a good decision that quietly erodes.

---

## 11. Round-2 status ledger

Written decisions on the round-2 prompt set (P7–P10 in
`NAVUUNA_PROMPTS_ROUND2.md`). Records what shipped and what was
deliberately deferred, so a future reader knows the state was chosen,
not forgotten.

### 2026-08-24 · P7 shipped

Blocking sweep for the marketing plan's Phase 0. Landed across three
commits: `991f50e` (`freedom_index` → `civic_index` rename + label
gate), `017001c` (UE = "Urban-Environmental" pinned to
`nuvola-atlas-frontend/src/lib/branding.ts` +
`nuvola-atlas-backend/config/branding.php`), `92ed8f1` (fixture gate:
zones tagged `data_provenance = fixture|mixed` are excluded from every
export and hidden from the public read API).

### 2026-08-25 · P7 amendment shipped

Second half of the compliance rename, per round-2 amendment: the pillar
key collapsed onto the display label. `civic_index` → `civic` (display
name "Civic & Governance"), landed in `d0bcabf`. The retirement
gravestone in `pillars.json` now carries the full identifier chain
(`freedom_index` → `civic_index` → `civic`) under
`retired.renamed_from`.

### 2026-08-25 · P9 shipped

The granularity rule now runs end-to-end. Utility figures like NCWSC's
48% non-revenue water reach the frontend banner via
`GET /api/v1/county-context`, and never land on a sub-county bubble.

- **Backend** (`f416902`): `county_context` table with DB-level CHECK
  constraints for R1 (gap ⇒ null value), the P9 rule (granularity ≠
  subcounty), and non-gap-needs-source-and-vintage. Read endpoint
  `/api/v1/county-context`, internal intake
  `/api/v1/internal/county-context` (`X-Internal-Secret`).
  `data_feed_status` gains `vintage` + `granularity` columns so a
  FY-cadence WASREB feed no longer renders as an overdue hourly feed.
- **Ingestion** (`b558c69`): `POST /api/ingest/wasreb`, WasrebReading
  pydantic model with plausibility bounds ported from
  `pipeline.wasreb.vocabulary`, `forward_county_context` shipping
  batches to the backend intake in one request.
- **Frontend** (`8f12ed0`): `CountyBanner` component rendered above the
  map, source + vintage rendered inline as part of the component (not
  as an optional prop), "Not measured" treatment for gap rows.

### 2026-08-25 · P10 deferred (written decision)

**Decision:** the WASREB extractor pipeline stays unbuilt for now. The
reconciled `wasreb_impact17_long.csv` at repo root (641 values across
Very Large / Large / Medium categories) is the authoritative source of
WASREB data until a future session decides to invest in a repeatable
extractor.

**Why:** `pipeline/wasreb/extract.py` is protocol-only (no offset
solver, no LayoutSpec, no run-together splitter — despite what the
prompt implies), `extractors/` is an empty scaffold, and no PDFs are
downloaded. Building the extractor is multi-session work that doesn't
unblock the marketing plan's Phase 0 or the Lacuna Fund evidence — both
of which the current reconciled CSV already supports. Manually
reconciling the remaining Small (22 utilities) + Private (4 utilities)
tables would also be a valid choice; either can happen later without
this decision blocking anything else.

**When to revisit:** when either (a) IMPACT 18 is published and we need
a repeatable path for the next issue, or (b) a funder specifically asks
for the earlier IMPACT time series (15 and 16). Whichever comes first.

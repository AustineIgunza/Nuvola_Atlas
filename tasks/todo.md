# NUVOLA ATLAS — Execution Plan

_Owner: Austine Igunza (frontend). Backend / scoring owners: Khillon & Devyan.
Last updated: 2026-05-28._

---

## A. Current session (DONE — pushed in this commit)

- [x] Fix Vercel production build (dual lockfile + missing Node engines)
- [x] Mobile: terrain / Map / Satellite view selector reachable in portrait
- [x] Mobile: zone scorecard renders as a centered popup, not a bottom sheet
- [x] Map: stop auto-selecting Westlands on `/atlas` load (URL `?zone=` is now the deep-link contract)
- [x] Sidebar logo is now a `<Link to="/atlas">` and clears any selection
- [x] Map layers: add `ResizeObserver` + `visibilitychange` + `orientationchange` listeners and a deferred `m.resize()` so the canvas paints into the correct viewport on mobile (no more "navigate away and back to see roads/energy")

---

## B. Frontend — remaining UI polish (my scope, this week)

### B1. Verification on a real device (CRITICAL — do this first)
- [ ] Open the new preview deployment on a real Android phone (portrait) and a real iPhone (portrait + landscape).
- [ ] Confirm: Map / Satellite / Terrain dropdown opens and switches the basemap.
- [ ] Confirm: tapping a zone marker opens the centered popup (not a bottom sheet).
- [ ] Confirm: toggling Roads / Energy / Density layers makes them appear immediately on first paint.
- [ ] Confirm: hard-refresh of `/atlas` does NOT preselect a zone.
- [ ] Capture short screen recordings, file them under `docs/qa/` so we have a baseline before backend swap.

### B2. Convert remaining list rows / cards to "click → popup"
The user has asked for popups, not full page navigation, on most clicks.
Map zone clicks are done. Outstanding:
- [ ] Alerts page: clicking an `AlertCard` opens an `AlertDetailModal` (component skeleton exists, just wire it up — currently rows expand inline).
- [ ] Reports page: `ReportsTable` row click already opens `ReportDetailModal` (verify on mobile; it currently renders as a side panel — push to centered modal).
- [ ] Infrastructure page: clicking a `ProjectCard` opens a `ProjectDetailModal` instead of navigating to `/infrastructure/:projectId`. Keep the deep-link route for sharing, but default UX is a modal.
- [ ] Vitality page leaderboard: tapping a row already navigates to `/atlas?zone=...`; on mobile add a small "Open scorecard here" button that opens the same scorecard modal without leaving the page.

### B3. Map polish
- [ ] Replace the random GeoJSON generator (`atlas-map.sources.ts`) with the real backend-served collections once Khillon ships `/api/zones/{id}/layers` (see Section C).
- [ ] Add a "Reset view" button on the map (top-right under nav control) that flies back to Nairobi centroid and clears `?zone=`.
- [ ] Add a soft pulse on the *active* layer toggle chip so users can see which layers are currently on without scanning the legend.
- [ ] Wire up keyboard accessibility on map markers (Enter to open scorecard, Esc to close it).

### B4. Code-split mapbox
- [ ] The bundler warning shows `mapbox-Ckg7ABI8.js` at 1.8 MB. Split it: lazy-load `mapbox-gl` only inside `AtlasMap.tsx` so the sign-in page and vitality/reports/alerts pages don't pay the cost.

### B5. Build hygiene
- [ ] Resolve the rollup warning: `chrome.ts` is both statically and dynamically imported. Pick one (likely static, since `ui.ts` already imports it statically). Removes a layer of indirection.

---

## C. Backend integration — replace mock data (Khillon owns API, I own client glue)

This is the biggest pre-pilot milestone. Today the frontend reads from `src/api/fixtures.ts`. We need it to read from Khillon's Laravel API instead, without changing any UI.

### C1. Confirm the API contract is fixed
- [ ] With Khillon, freeze the response shape for the following endpoints (these MUST match `src/types/index.ts` exactly so no UI changes are needed):
  - `GET /api/zones` → `Zone[]`
  - `GET /api/zones/{id}` → `Zone`
  - `GET /api/zones/{id}/layers` → `{ roads, energy, density }` (each a `FeatureCollection`)
  - `GET /api/zones/{id}/activity` → `Activity[]`
  - `GET /api/alerts` → `Alert[]`, `PATCH /api/alerts/{id}` for read state
  - `GET /api/reports`, `POST /api/reports`, `GET /api/reports/{id}`
  - `GET /api/projects`
- [ ] Verify auth: the frontend already sends Sanctum bearer token via `src/api/client.ts`. Confirm CORS, 401 redirect to `/sign-in`, and token refresh behaviour on a deployed Laravel instance (not just `php artisan serve`).

### C2. Flip the data flag
- [ ] In `src/api/index.ts`, the current code already has both `mock` and `remote` modules. Add an env flag `VITE_USE_REMOTE_API=true` and wire `index.ts` to pick `remote` when set. Default stays mock so local dev keeps working without the Laravel backend running.
- [ ] On Vercel, set `VITE_USE_REMOTE_API=true` for the production environment only. Preview environments stay on mock so the UI can be reviewed without Khillon's backend being up.

### C3. Realtime
- [ ] Replace the stubbed `useLiveData` hook with a real Laravel Echo subscription to the `zones` and `alerts` Reverb channels. UI does not change — only the subscription source. Khillon to confirm the channel auth route.

---

## D. Real data sourcing — the actual pillar inputs

This is the work that converts the demo into something a county planner would believe. It is **not** my (Austine's) scope to ingest these — Devyan and Khillon own the pipeline — but the frontend should expose a "Data freshness" panel that surfaces real ingestion timestamps, which means we need to agree on what each pillar pulls from.

The Vitality Scorecard already lists fake sources in `ScorecardPanel.tsx`. Replace those with the real ones below.

### D1. Pillar 1 — Social Wellbeing and Human Capital
- KNBS (Kenya National Bureau of Statistics): population, density, basic services — **open data portal**, downloadable XLSX, refresh quarterly. Need a scheduled FastAPI job to re-pull each quarter.
- Social Progress Index (Kenya country file): annual, public CSV. One pull per year is fine.
- Workforce mobility / unemployment: KNBS Quarterly Labour Force Report (PDF tables — manual extraction first, then OCR'd ingestion in Phase 2).
- Air quality + green space: OpenAQ API for AQ, OpenStreetMap park polygons for green space coverage per ward. Both free.

**Action items:**
- [ ] Devyan: write a FastAPI ingestion job for KNBS quarterly pull (`/ingest/knbs/population`).
- [ ] Devyan: cron OpenAQ pull (hourly), aggregate to daily ward averages.
- [ ] Khillon: expose pillar 1 sub-metrics on the zone endpoint so the scorecard breakdown shows source ages.

### D2. Pillar 2 — Safety and Security
- Crime data: National Police Service (NPS) Annual Crime Report. **Not real-time**, annual PDF. Phase 1: manually digitize ward-level totals once. Phase 2: relationship with NPS open-data desk.
- Rule of law / judicial independence trend: World Justice Project Rule of Law Index (annual, free CSV).
- Conflict events: ACLED (Armed Conflict Location & Event Data). Free for academic, request access. JSON API.
- Internet freedom / cybersecurity: Freedom House "Freedom on the Net" annual report.

**Action items:**
- [ ] Joy: file the ACLED academic-use request under Strathmore. Lead time ~2 weeks.
- [ ] Ken: draft a one-page data-use letter for NPS so we have it ready for the partner outreach in Section E.

### D3. Pillar 3 — Density and Scaling Dynamics
- Population density: KNBS, see D1.
- Urban friction (transit time): Google Maps Distance Matrix API for sampled origin-destination pairs per ward, sampled four times a day. **Paid** — budget allocation lives in the cloud-infrastructure line; cap at ~USD 50/month by sampling, not real-time querying.
- Zoning complexity: Nairobi County GIS zoning layers (open data — verify with County Planning).

**Action items:**
- [ ] Devyan: scope the Distance Matrix monthly cost at the proposed sample rate before turning it on. Confirm budget with Ken.
- [ ] Devyan: write a fallback (OSM routing via OSRM self-hosted) so we can drop the paid API later.

### D4. Pillar 4 — Infrastructure and Environmental Safeguards
This is the most Nairobi-specific pillar and the one investors will care about most.
- **Road construction status**: KURA (Kenya Urban Roads Authority) project list — published on their portal. Currently CSV; eventually we want a scraper.
- **Highway segments**: KeNHA project pipeline — same structure.
- **Energy**: KPLC outage map + substation status. They do not publish a clean feed. Phase 1: scrape the public outage page hourly. Phase 2: request a data-sharing MOU through Strathmore.
- **Transmission**: KETRACO project status — annual report, manual digitization for the pilot.
- **ESIA Transparency**: NEMA (National Environment Management Authority) ESIA portal — public listings, scrape weekly.
- **Sovereign immunity / contract risk**: World Bank Doing Business archive + Kenya Vision 2030 monitoring reports.

**Action items:**
- [ ] Devyan: build a scraper for the KURA project list, output → `infra_projects` table. Schedule weekly.
- [ ] Devyan: build a scraper for the NEMA ESIA portal, output → `esia_records` table. Schedule weekly.
- [ ] Khillon: surface project-level data in `/api/projects` so the Infrastructure page can render real entries.
- [ ] Ken: draft the KPLC data-sharing MOU template (we'll need it for the partner outreach window in Section E).

### D5. Ground-truthing
- [ ] Joy + Austine: schedule 2 field visits per month to verify a sampled set of KURA/KETRACO project statuses against what is actually on the ground. Output: a Google Sheet of (project_id, expected_status, observed_status, date, photo). This is what makes the platform credible.
- [ ] Devyan: add a `verified_at` timestamp + `verification_source` enum to the project schema so ground-truthed data can be flagged in the UI.

---

## E. Partner outreach (Objective 3 — letters of intent / MOU)

Owned by Joy, supported by Ken.
We need at least two signed letters of intent by month 11 (per the proposal). Starting at month 0 because lead times are long.

### E1. Pipeline (target 5 leads, convert ≥2)
- [ ] Nairobi County Planning Department — primary target. Joy to request introductory meeting via Strathmore Vice-Chancellor's office.
- [ ] KARA (Kenya Alliance of Resident Associations) — civic stakeholder, would use the public-facing Atlas.
- [ ] Centre for Urban Research and Innovations (CURI), University of Nairobi — research partner for the methodology paper.
- [ ] Konza Technopolis Development Authority — corporate / smart-city interest.
- [ ] One donor-funded urban planning NGO (Joy to shortlist 3 candidates: Slum Dwellers International, Akiba Mashinani Trust, Habitat for Humanity Kenya).

### E2. Outreach assets to prepare
- [ ] One-page Atlas explainer (PDF). I (Austine) can prepare the visual using the live screenshots once B1 is verified.
- [ ] 90-second screen recording demo of the live `/atlas` map + scorecard. Use the same QA recording from B1.
- [ ] Letter-of-intent template — Ken drafts; Joy sends.

### E3. Workshop budget
- [ ] Two partner workshops in months 6 and 10 (per Section 7 of the proposal). Joy to book Strathmore meeting space and arrange transport reimbursement.

---

## F. Methodology paper (Objective 4)

Owned by Ken, drafting support from Devyan.

### F1. Target venues (ranked)
- ICTD (Information and Communication Technologies and Development) — best fit for the mix of method + deployment context. Submission cycle is annual.
- Habitat International (Elsevier journal) — strong urban-planning fit.
- Journal of Urban Affairs — secondary fallback.

### F2. Outline (working title: "The UE Vitality Index: A Locality-Scale Readiness Score for Sub-County Industrial Planning in Kenya")
- [ ] Introduction: framing in Sen 1999, gap argument (Section 2 of the proposal already does this).
- [ ] Method: the four pillars, sub-metrics, weighting (default equal, sensitivity analysis to be added).
- [ ] Case study: 17 Nairobi sub-counties, ranked outputs, comparison to baseline measures.
- [ ] Validation: ground-truth subset (from D5) and partner feedback.
- [ ] Discussion: limitations, replication path to the other 46 counties.

### F3. Schedule
- [ ] Internal draft 1: month 7 (Ken).
- [ ] Internal review: month 8 (Devyan + external advisor TBD).
- [ ] Submission: month 11.

---

## G. Compliance & legal (Objective 5)

Owned by Ken.
- [ ] Entity registration: decide between limited company (CR-12) and not-for-profit. Ken to consult with Strathmore Legal Clinic.
- [ ] IP assignment memo: all current code + design rights assigned to the registered entity once formed.
- [ ] KDPA-aligned data handling SOP: written document covering anonymization, encryption at rest (AES-256 already in place via Laravel), access control, and breach response.
- [ ] Cookie/consent banner on the deployed site — currently absent. Will add after entity is registered (because the privacy policy needs an entity name).

---

## H. Follow-on funding (Section 6 of proposal)

Owned by Ken + Joy, ongoing through year.

### H1. Applications to file by month 9
- [ ] AfriLabs Catalytic Fund — open call, USD 5–25k tranches.
- [ ] Mozilla Technology Fund — open call for civic-tech projects, EUR 50k tranche.
- [ ] GIZ Make-IT Africa — engagement track; needs a corporate co-applicant, so pair with KPLC outreach above.
- [ ] Konza Technopolis innovation pots — local, lower amounts, useful for credibility.
- [ ] Hewlett Foundation governance/data programmes — bigger ticket, longer cycle.

### H2. Application asset reuse
- [ ] Reuse the same 90-second demo + 1-pager produced for E2 across all applications. One library, one update flow.

---

## I. Risk watch (mapped to the proposal's Section 5.3)

- Government data sources incomplete → mitigated by D2/D4 multiple-source triangulation; surface gaps transparently in the Data Sources panel of the scorecard.
- Pilot partner slow to commit → start E1 outreach NOW; do not wait until month 6.
- Methodology challenged academically → ground in Sen + SPI + Freedom on the Net; submit the methodology paper early enough that a single rejection isn't terminal.
- Mapbox bill overrun → the dev-tier plan is fine for now, but as soon as a partner deploys we need to monitor MAU + tile-load counts; alert at 60% of budget.
- Vercel bill overrun → frontend is purely static + edge rewrites. No serverless functions on the frontend project, so cost should stay near-zero. The Laravel backend stays on its own hosting (Khillon owns that decision).

---

## J. Definition of "pilot-ready" (the bar we're aiming for in 6 months)

A partner can:
1. Sign in.
2. See a live Atlas of Nairobi with road / energy / density layers driven by real ingested data (not mock).
3. Click any of the 17 sub-counties and get a Vitality score built from the four real-pillar inputs above.
4. Open the methodology popup and read exactly how each pillar number was computed and when it was last refreshed.
5. Export the zone scorecard as a PDF.
6. Trust that the data behind the map is being refreshed on a schedule we can defend.

If any of those six things still depends on `src/api/fixtures.ts` after month 6, we are not pilot-ready.

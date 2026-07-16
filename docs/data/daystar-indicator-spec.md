# Daystar 13-Indicator Data Specification

**Owner:** Devyan Jethwa (CTIPSO)
**Consumer:** Daystar University data-access partnership
**Last updated:** 2026-07-16 (indicator-count corrected 12 → 13; Pillar 4 carries four indicators per Backend Build Plan §5.1 and the codebase's `swap_pillars_for_indicators` migration)
**Status:** Draft — to be reviewed with Daystar before Phase B ingest cutover. Devyan reviews all 13 sections in Week 1 (`tasks/team/week-01/devyan.md`) before Joy carries the spec to Daystar admin.

This document is the authoritative contract between Navuuna and Daystar
University for the **13 indicators** that drive the Vitality Index (4 pillars
× ≈ 3 indicators, with Pillar 4 — Infrastructure & Environmental Safeguards
— carrying four indicators: road_quality, energy_reliability, food_risk,
waste_management). Every field, unit, resolution, spatial anchor, and delivery
cadence below must match what Daystar sends; any drift is a rejection.

**13-indicator canonical list (Backend Build Plan §5.1):**
1. Social Wellbeing & Human Capital — `healthcare_access`, `education_access`, `digital_connectivity`
2. Safety & Security — `crime_rates`, `emergency_response_access`, `disaster_exposure`
3. Density & Scaling Dynamics — `population_density`, `congestion`, `housing_pressure`
4. Infrastructure & Environmental Safeguards — `road_quality`, `energy_reliability`, `food_risk`, `waste_management`

## Common contract

- **Transport:** HTTPS POST to
  `https://ingestion.navuuna.example/api/ingest/indicators` with a
  `X-Internal-Secret` header (see
  `docs/data/internal-transport.md`).
- **Format:** JSON `application/json`, UTF-8, one batch per POST.
- **Spatial reference:** WGS84 (EPSG:4326). Longitude first, latitude
  second. Any other CRS is rejected.
- **Time reference:** ISO 8601, UTC, with the `Z` suffix. Local-time
  timestamps are converted to UTC on ingest but are logged as a
  rejection warning so Daystar can fix upstream.
- **Zone identifiers:** the 17 Nairobi sub-county slugs used by the
  frontend (`westlands`, `starehe`, `kibra`, …). See
  `nuvola-atlas-frontend/src/api/fixtures.ts` for the current list.
- **Cadence:** each indicator has its own cadence (below). Ad-hoc
  resubmissions of the same `batch_id` are treated as idempotent
  updates.

## Batch envelope

```json
{
  "batch_id": "daystar-2026-07-08-social",
  "submitted_at": "2026-07-08T09:00:00Z",
  "readings": [
    {
      "zone_id": "westlands",
      "indicator": "healthcare_access",
      "value": 72.4,
      "unit": "index_0_100",
      "observed_at": "2026-07-08T09:00:00Z",
      "field_verified": true,
      "centroid": { "lon": 36.8048, "lat": -1.2673 },
      "source": "daystar"
    }
  ]
}
```

## The 12 indicators

Each row lists: **key** (immutable machine identifier), **unit**,
**resolution** (spatial or numeric granularity), and **cadence**
(delivery frequency Daystar commits to).

### Pillar 1 — Social Wellbeing and Human Capital

| Key                    | Unit              | Resolution                            | Cadence    |
|------------------------|-------------------|---------------------------------------|------------|
| `healthcare_access`    | `index_0_100`     | Sub-county; distance-weighted to Level 4+ | Quarterly  |
| `education_access`     | `index_0_100`     | Sub-county; primary + secondary catchments | Quarterly  |
| `digital_connectivity` | `mbps` (mean p50) | Sub-county; mobile broadband           | Monthly    |

### Pillar 2 — Safety and Security

| Key                    | Unit                        | Resolution                        | Cadence  |
|------------------------|-----------------------------|-----------------------------------|----------|
| `crime_rates`          | `incidents_per_1000_90d`    | Sub-county; NPS-sourced           | Monthly  |
| `emergency_response`   | `minutes` (median)          | Sub-county; police + ambulance    | Monthly  |
| `disaster_exposure`    | `index_0_100`               | Sub-county; overlay of NDMA hazards | Quarterly |

### Pillar 3 — Density and Scaling Dynamics

| Key                  | Unit               | Resolution                          | Cadence   |
|----------------------|--------------------|-------------------------------------|-----------|
| `population_density` | `persons_per_km2`  | Sub-county; KNBS 2019 + growth model | Yearly    |
| `congestion`         | `minutes` (peak)   | Sub-county corridor mean            | Weekly    |
| `housing_pressure`   | `index_0_100`      | Sub-county; rent/income + shortfall | Quarterly |

### Pillar 4 — Infrastructure and Environmental Safeguards

| Key                  | Unit           | Resolution                         | Cadence   |
|----------------------|----------------|------------------------------------|-----------|
| `road_quality`       | `index_0_100`  | Sub-county; paved share + IRI      | Quarterly |
| `energy_reliability` | `outage_min_per_month` | Sub-county; KPLC feeder-level     | Monthly   |
| `waste_management`   | `index_0_100`  | Sub-county; formal collection coverage | Quarterly |

## Field verification

`field_verified` distinguishes remotely computed indicators from those a
Daystar or Navuuna field officer has spot-checked on the ground. The
frontend renders a "Field-verified" badge only when this flag is `true`;
otherwise it renders "Unverified". `false` is the safe default when the
value came from a passive feed with no on-the-ground confirmation.

## Rejection reasons Daystar will see

| Reason string                              | Meaning                                             |
|--------------------------------------------|-----------------------------------------------------|
| `missing zone_id`                          | Row has no `zone_id`.                               |
| `unknown indicator: <key>`                 | Key not in the 12 above.                            |
| `missing value`                            | Value is null.                                      |
| `value not numeric`                        | Value is not castable to float.                     |
| `missing/invalid observed_at`              | Timestamp is missing or unparseable.                |
| _(anomaly, not a rejection)_               | `|z_score| ≥ 3.5` against zone-indicator history.   |

Rejected rows and anomalies are returned in the batch receipt with the
full offending row, so Daystar can re-run the batch after a fix without
guessing which line failed.

## Open questions for Daystar

- **Baseline history:** for the z-score anomaly guard, we need at least
  three prior observations per (zone, indicator). We propose Daystar
  bulk-loads the trailing four quarters at first ingest so anomaly
  detection is meaningful from day one.
- **Coverage staging:** which of the 12 indicators is Daystar committing
  to for the Phase B (Aug-01 to Aug-21) window? The frontend's partial
  data UX communicates "N of 12" gracefully, but the four-week window
  needs firm scope.
- **Batch size cap:** proposed 10,000 rows per POST. Larger batches
  should be chunked upstream so we can keep the ingest function inside
  Vercel's 300s timeout with headroom.

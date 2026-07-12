import type { PillarKey } from "@/types";

/**
 * The 12 Daystar-sourced indicators that drive the Vitality Index once the
 * ingestion pipeline is live (Phase B in PHASES.md). This module is the
 * single source of truth for indicator identity + per-zone availability +
 * per-indicator field verification.
 *
 * Kept deliberately separate from the legacy `pillar-data.ts` sub-metrics so
 * that migration to the 12-indicator framework can happen without breaking
 * the current scorecard display. When the backend cutover completes and
 * pillar-data.ts is retired, the components already consume this module.
 */

export type IndicatorVerification = "verified" | "unverified" | "pending";
export type IndicatorAvailability = "delivered" | "pending" | "blocked";

export interface IndicatorDef {
  key: string;
  label: string;
  pillar: PillarKey;
  description: string;
}

export const INDICATORS: IndicatorDef[] = [
  { key: "healthcare_access", label: "Healthcare access", pillar: "social", description: "Distance to nearest Level 4+ facility, weighted by facility capacity" },
  { key: "education_access", label: "Education access", pillar: "social", description: "Primary + secondary catchment coverage, TSC teacher density" },
  { key: "digital_connectivity", label: "Digital connectivity", pillar: "social", description: "Mobile broadband coverage, median downlink speed" },

  { key: "crime_rates", label: "Crime rates", pillar: "safety", description: "NPS reported incidents per 1,000 residents, 90-day trailing" },
  { key: "emergency_response", label: "Emergency response", pillar: "safety", description: "Median police + ambulance response time" },
  { key: "disaster_exposure", label: "Disaster exposure", pillar: "safety", description: "Flood, fire and structural risk against NDMA hazard layers" },

  { key: "population_density", label: "Population density", pillar: "density", description: "Persons per km² from KNBS 2019 census, adjusted for growth" },
  { key: "congestion", label: "Congestion", pillar: "density", description: "Mean AM/PM peak transit time on the corridor network" },
  { key: "housing_pressure", label: "Housing pressure", pillar: "density", description: "Rent-to-income ratio and formal housing shortfall" },

  { key: "road_quality", label: "Road quality", pillar: "infra", description: "Paved road share, KURA condition audit, IRI where available" },
  { key: "energy_reliability", label: "Energy reliability", pillar: "infra", description: "KPLC outage minutes per month, transformer density" },
  { key: "waste_management", label: "Waste management", pillar: "infra", description: "Formal collection coverage and dump-site proximity" },
];

export const INDICATOR_COUNT = INDICATORS.length;

export const INDICATORS_BY_PILLAR: Record<PillarKey, IndicatorDef[]> = {
  social: INDICATORS.filter((i) => i.pillar === "social"),
  safety: INDICATORS.filter((i) => i.pillar === "safety"),
  density: INDICATORS.filter((i) => i.pillar === "density"),
  infra: INDICATORS.filter((i) => i.pillar === "infra"),
};

/**
 * Mock ingestion state per zone. Once Daystar delivery starts (Phase B) this
 * gets replaced by a backend query, but the shape stays the same. Zones
 * with more mature partnerships get more indicators delivered; informal
 * settlements are the last to fill in — which matches the pilot rollout
 * plan and reads honestly during a demo.
 */
const AVAILABILITY_TIERS: Record<string, IndicatorAvailability[]> = {
  westlands: fillTier(12, 12, 0),
  starehe: fillTier(11, 12, 1),
  "embakasi-east": fillTier(11, 12, 1),
  langata: fillTier(10, 12, 2),
  kasarani: fillTier(10, 12, 2),
  "dagoretti-north": fillTier(9, 12, 3),
  "dagoretti-south": fillTier(9, 12, 3),
  roysambu: fillTier(9, 12, 3),
  ruaraka: fillTier(9, 12, 3),
  makadara: fillTier(8, 12, 4),
  "embakasi-north": fillTier(8, 12, 4),
  "embakasi-central": fillTier(8, 12, 4),
  "embakasi-west": fillTier(8, 12, 4),
  "embakasi-south": fillTier(8, 12, 4),
  kamukunji: fillTier(7, 12, 5),
  kibra: fillTier(6, 12, 6),
  mathare: fillTier(5, 12, 7),
};

const DEFAULT_TIER: IndicatorAvailability[] = fillTier(9, 12, 3);

function fillTier(delivered: number, total: number, pending: number): IndicatorAvailability[] {
  const arr: IndicatorAvailability[] = [];
  for (let i = 0; i < delivered; i++) arr.push("delivered");
  for (let i = 0; i < pending; i++) arr.push("pending");
  while (arr.length < total) arr.push("blocked");
  return arr;
}

export interface ZoneIndicatorState {
  key: string;
  label: string;
  pillar: PillarKey;
  description: string;
  availability: IndicatorAvailability;
  verification: IndicatorVerification;
}

export interface ZoneIndicatorSummary {
  delivered: number;
  pending: number;
  blocked: number;
  verified: number;
  total: number;
  states: ZoneIndicatorState[];
}

/**
 * Field verification is a step past availability: an indicator can be
 * delivered by Daystar but still awaiting a ground-truth check by a field
 * officer. We derive verification deterministically from the indicator
 * key + zone id so the badges are stable across renders and re-mounts.
 */
function verificationFor(zoneId: string, key: string, avail: IndicatorAvailability): IndicatorVerification {
  if (avail !== "delivered") return "pending";
  // deterministic pseudo-hash — stable per (zone, indicator)
  let h = 0;
  const s = `${zoneId}:${key}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const bucket = Math.abs(h) % 10;
  if (bucket < 6) return "verified";
  if (bucket < 9) return "unverified";
  return "pending";
}

export function zoneIndicatorSummary(zoneId: string): ZoneIndicatorSummary {
  const tier = AVAILABILITY_TIERS[zoneId] ?? DEFAULT_TIER;
  const states: ZoneIndicatorState[] = INDICATORS.map((ind, idx) => {
    const availability = tier[idx] ?? "blocked";
    return {
      ...ind,
      availability,
      verification: verificationFor(zoneId, ind.key, availability),
    };
  });
  const delivered = states.filter((s) => s.availability === "delivered").length;
  const pending = states.filter((s) => s.availability === "pending").length;
  const blocked = states.filter((s) => s.availability === "blocked").length;
  const verified = states.filter((s) => s.verification === "verified").length;
  return { delivered, pending, blocked, verified, total: INDICATORS.length, states };
}

export const VERIFICATION_LABEL: Record<IndicatorVerification, string> = {
  verified: "Field-verified",
  unverified: "Unverified",
  pending: "Awaiting data",
};

export const AVAILABILITY_LABEL: Record<IndicatorAvailability, string> = {
  delivered: "Delivered",
  pending: "In pipeline",
  blocked: "Not yet scoped",
};

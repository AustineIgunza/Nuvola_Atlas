export const NAIROBI: [number, number] = [36.84, -1.283];
export const INITIAL_ZOOM = 11.5;

export const MAP_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  terrain: "mapbox://styles/mapbox/outdoors-v12",
} as const;

export const DEFAULT_STYLE = MAP_STYLES.light;

// Light and dark are the two "Map" view-mode basemaps — they follow the app
// theme. Satellite and Terrain are user-selected overrides that ignore theme.
export const BASEMAP_STYLES: ReadonlySet<string> = new Set([
  MAP_STYLES.light,
  MAP_STYLES.dark,
]);

export function defaultStyleForTheme(theme: "light" | "dark"): string {
  return theme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
}

import { BRAND } from "@/lib/scoreColor";

/**
 * The Atlas data layers. `label` + `color` drive the floating map chips.
 * The extra fields (description, source, sdg, features, lastSyncMin) power
 * the richer Sidebar layer cards — they're purely informational and the
 * map ignores them.
 *
 * `features` and `lastSyncMin` are approximations for the Nairobi pilot,
 * good enough to communicate freshness. When the real ingestion service is
 * live these should be swapped for a hook that reads the actual feed
 * status per layer.
 */
export const LAYER_META = [
  {
    key: "vitality" as const,
    label: "Vitality Zones",
    color: BRAND.gold,
    description: "The overall 0-100 readiness score for each of the 17 sub-counties, coloured by the score ramp.",
    source: "Navuuna · UE Vitality Index",
    sdg: "SDG 9 & 11",
    features: 17,
    lastSyncMin: 4,
  },
  {
    key: "roads" as const,
    label: "Road Progress",
    color: BRAND.terracotta,
    description: "Live construction status of major road projects — active, stalled, or planned — with percent complete.",
    source: "KURA · KeNHA feeds",
    sdg: "SDG 9",
    features: 12,
    lastSyncMin: 9,
  },
  {
    key: "energy" as const,
    label: "Smart Grid Status",
    color: BRAND.gold,
    description: "Substations, feeder lines, and smart-meter pilots across the county. Highlights outages and NTL zones.",
    source: "KPLC · KETRACO feeds",
    sdg: "SDG 7",
    features: 21,
    lastSyncMin: 6,
  },
  {
    key: "density" as const,
    label: "Density",
    color: BRAND.steel,
    description: "Population density per sub-county at ward resolution — used by the Density & Scaling pillar.",
    source: "KNBS 2019 · county projections",
    sdg: "SDG 11",
    features: 17,
    lastSyncMin: 60 * 24 * 30,
  },
  {
    key: "water" as const,
    label: "Water & Sanitation",
    color: BRAND.teal,
    description: "Piped-water coverage, communal water points, and context-specific sanitation for informal settlements.",
    source: "NCWSC · Athi Water Works",
    sdg: "SDG 6",
    features: 9,
    lastSyncMin: 12,
  },
  {
    key: "momentum" as const,
    label: "Project Momentum",
    color: BRAND.goldDeep,
    description: "Rolling 30-day delivery velocity across active infrastructure projects — flags stalling before it shows in totals.",
    source: "Derived · project milestones",
    sdg: null,
    features: 19,
    lastSyncMin: 15,
  },
  {
    key: "safety" as const,
    label: "Safety & Security",
    color: BRAND.rose,
    description: "Incident heatmap along transit corridors, cross-referenced with the Safety pillar sub-metrics.",
    source: "NPS quarterly · Atlas Safety pillar",
    sdg: "SDG 16",
    features: 34,
    lastSyncMin: 45,
  },
];

export function markerScoreColor(score: number): string {
  if (score >= 70) return BRAND.teal;
  if (score >= 55) return BRAND.gold;
  return BRAND.terracotta;
}

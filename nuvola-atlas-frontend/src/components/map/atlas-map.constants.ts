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
// LabelKey + descriptionKey point at i18n entries; consumers t() them at
// render time. Kept as MessageKey strings (not tokens) so tsc can enforce
// the reference lands on a real translation.
export const LAYER_META = [
  {
    key: "vitality" as const,
    labelKey: "layer.vitality" as const,
    color: BRAND.gold,
    descriptionKey: "layerDesc.vitality" as const,
    source: "Navuuna · UE Vitality Index",
    sdg: "SDG 9 & 11",
    features: 17,
    lastSyncMin: 4,
  },
  {
    key: "roads" as const,
    labelKey: "layer.roads" as const,
    color: BRAND.terracotta,
    descriptionKey: "layerDesc.roads" as const,
    source: "KURA · KeNHA feeds",
    sdg: "SDG 9",
    features: 12,
    lastSyncMin: 9,
  },
  {
    key: "energy" as const,
    labelKey: "layer.energy" as const,
    color: BRAND.gold,
    descriptionKey: "layerDesc.energy" as const,
    source: "KPLC · KETRACO feeds",
    sdg: "SDG 7",
    features: 21,
    lastSyncMin: 6,
  },
  {
    key: "density" as const,
    labelKey: "layer.density" as const,
    color: BRAND.steel,
    descriptionKey: "layerDesc.density" as const,
    source: "KNBS 2019 · county projections",
    sdg: "SDG 11",
    features: 17,
    lastSyncMin: 60 * 24 * 30,
  },
  {
    key: "water" as const,
    labelKey: "layer.water" as const,
    color: BRAND.teal,
    descriptionKey: "layerDesc.water" as const,
    source: "NCWSC · Athi Water Works",
    sdg: "SDG 6",
    features: 9,
    lastSyncMin: 12,
  },
  {
    key: "momentum" as const,
    labelKey: "layer.momentum" as const,
    color: BRAND.goldDeep,
    descriptionKey: "layerDesc.momentum" as const,
    source: "Derived · project milestones",
    sdg: null,
    features: 19,
    lastSyncMin: 15,
  },
  {
    key: "safety" as const,
    labelKey: "layer.safety" as const,
    color: BRAND.rose,
    descriptionKey: "layerDesc.safety" as const,
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

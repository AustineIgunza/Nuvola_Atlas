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
export const BASEMAP_STYLES: ReadonlySet<string> = new Set([MAP_STYLES.light, MAP_STYLES.dark]);

export function defaultStyleForTheme(theme: "light" | "dark"): string {
  return theme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
}

import { INDEX_NAME_SHORT } from "@/lib/branding";
import { BRAND, NO_SCORE_COLOR_HEX } from "@/lib/scoreColor";

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
    source: `Navuuna · ${INDEX_NAME_SHORT}`,
    sdg: "SDG 9 & 11",
    features: 17,
    lastSyncMin: 4,
  },
  {
    key: "roads" as const,
    labelKey: "layer.roads" as const,
    color: BRAND.terracotta,
    descriptionKey: "layerDesc.roads" as const,
    source: "HOT OSM roads",
    sdg: "SDG 9",
    features: 12,
    lastSyncMin: 9,
  },
  {
    key: "energy" as const,
    labelKey: "layer.energy" as const,
    color: BRAND.gold,
    descriptionKey: "layerDesc.energy" as const,
    source: "KNBS 2019 census",
    sdg: "SDG 7",
    features: 21,
    lastSyncMin: 6,
  },
  {
    key: "water" as const,
    labelKey: "layer.water" as const,
    color: BRAND.teal,
    descriptionKey: "layerDesc.water" as const,
    source: "KNBS census · WASREB IMPACT",
    sdg: "SDG 6",
    features: 9,
    lastSyncMin: 12,
  },
];

export function markerScoreColor(score: number | null): string {
  if (score === null) return NO_SCORE_COLOR_HEX;
  if (score >= 70) return BRAND.teal;
  if (score >= 55) return BRAND.gold;
  return BRAND.terracotta;
}

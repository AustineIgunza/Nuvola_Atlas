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

export const LAYER_META = [
  { key: "vitality" as const, label: "Vitality Zones", color: BRAND.gold },
  { key: "roads" as const, label: "Road Progress", color: BRAND.terracotta },
  { key: "energy" as const, label: "Smart Grid Status", color: BRAND.gold },
  { key: "density" as const, label: "Density", color: BRAND.steel },
  { key: "water" as const, label: "Water & Sanitation", color: BRAND.teal },
  { key: "momentum" as const, label: "Project Momentum", color: BRAND.goldDeep },
  { key: "safety" as const, label: "Safety & Security", color: BRAND.rose },
];

export function markerScoreColor(score: number): string {
  if (score >= 70) return BRAND.teal;
  if (score >= 55) return BRAND.gold;
  return BRAND.terracotta;
}

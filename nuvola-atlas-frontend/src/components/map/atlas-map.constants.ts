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

export const LAYER_META = [
  { key: "roads" as const, label: "Road Progress", color: "#2C6FB0" },
  { key: "energy" as const, label: "Smart Grid Status", color: "#C9A227" },
  { key: "density" as const, label: "Density", color: "#C7603F" },
];

export function markerScoreColor(score: number): string {
  if (score >= 70) return "#1B9C6B";
  if (score >= 55) return "#C9A227";
  return "#C7603F";
}

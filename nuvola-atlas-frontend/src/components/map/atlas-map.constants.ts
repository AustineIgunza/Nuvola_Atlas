export const NAIROBI: [number, number] = [36.84, -1.283];
export const INITIAL_ZOOM = 11.5;
export const DEFAULT_STYLE = "mapbox://styles/mapbox/light-v11";

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

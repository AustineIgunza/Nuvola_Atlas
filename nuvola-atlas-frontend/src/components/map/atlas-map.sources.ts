import type mapboxgl from "mapbox-gl";
import type { Zone } from "@/types";

export function generateRoadFeatures(zones: Zone[]) {
  const pairs = [
    [0, 1], [1, 2], [2, 3], [0, 5], [5, 4], [4, 7],
    [7, 10], [10, 8], [8, 6], [1, 12], [12, 11],
    [3, 14], [14, 13], [13, 3], [15, 4], [15, 5],
    [1, 16], [16, 15],
  ];
  return pairs
    .filter(([a, b]) => a < zones.length && b < zones.length)
    .map(([a, b]) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [zones[a].centroid, zones[b].centroid],
      },
      properties: {
        progress: Math.round(30 + Math.random() * 70),
        name: `${zones[a].name} → ${zones[b].name}`,
      },
    }));
}

export function generateGridFeatures(zones: Zone[]) {
  return zones.flatMap((z) => {
    const count = 2 + Math.floor(Math.random() * 3);
    return Array.from({ length: count }, () => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [
          z.centroid[0] + (Math.random() - 0.5) * 0.025,
          z.centroid[1] + (Math.random() - 0.5) * 0.02,
        ],
      },
      properties: {
        status: Math.random() > 0.3 ? "active" : "planned",
        zone: z.name,
        capacity: Math.round(20 + Math.random() * 80),
      },
    }));
  });
}

export function generateDensityFeatures(zones: Zone[]) {
  return zones.flatMap((z) => {
    const count = Math.round((z.pillars.density / 100) * 20) + 5;
    return Array.from({ length: count }, () => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [
          z.centroid[0] + (Math.random() - 0.5) * 0.04,
          z.centroid[1] + (Math.random() - 0.5) * 0.03,
        ],
      },
      properties: {
        weight: z.pillars.density / 100,
        zone: z.name,
      },
    }));
  });
}

export function addSourcesAndLayers(
  m: mapboxgl.Map,
  zones: Zone[],
  active: { roads: boolean; energy: boolean; density: boolean },
) {
  m.addSource("roads", {
    type: "geojson",
    data: { type: "FeatureCollection", features: generateRoadFeatures(zones) },
  });
  m.addSource("grid", {
    type: "geojson",
    data: { type: "FeatureCollection", features: generateGridFeatures(zones) },
  });
  m.addSource("density", {
    type: "geojson",
    data: { type: "FeatureCollection", features: generateDensityFeatures(zones) },
  });

  m.addLayer({
    id: "roads-line", type: "line", source: "roads",
    paint: { "line-color": "#2C6FB0", "line-width": 3, "line-dasharray": [2, 2], "line-opacity": active.roads ? 0.85 : 0 },
  });
  m.addLayer({
    id: "roads-glow", type: "line", source: "roads",
    paint: { "line-color": "#2C6FB0", "line-width": 8, "line-blur": 6, "line-opacity": active.roads ? 0.25 : 0 },
  }, "roads-line");
  // Invisible thicker hit-target so touch on mobile is reliable. Opacity 0 but
  // still receives click/tap events. Width tuned to a finger-tip.
  m.addLayer({
    id: "roads-touch", type: "line", source: "roads",
    paint: { "line-color": "#000", "line-width": 22, "line-opacity": 0 },
  });

  m.addLayer({
    id: "grid-outer", type: "circle", source: "grid",
    paint: {
      "circle-radius": 12, "circle-color": "transparent", "circle-stroke-width": 2,
      "circle-stroke-color": ["case", ["==", ["get", "status"], "active"], "#C9A227", "#999"],
      "circle-stroke-opacity": active.energy ? 0.9 : 0,
    },
  });
  m.addLayer({
    id: "grid-inner", type: "circle", source: "grid",
    paint: {
      "circle-radius": 5,
      "circle-color": ["case", ["==", ["get", "status"], "active"], "#C9A227", "#999"],
      "circle-opacity": active.energy ? 0.9 : 0,
    },
  });
  // Larger invisible hit-target above the visible grid circles for tap accuracy.
  m.addLayer({
    id: "grid-touch", type: "circle", source: "grid",
    paint: { "circle-radius": 22, "circle-color": "#000", "circle-opacity": 0 },
  });

  m.addLayer({
    id: "density-heat", type: "heatmap", source: "density",
    paint: {
      "heatmap-weight": ["get", "weight"], "heatmap-intensity": 1.2,
      "heatmap-radius": 35, "heatmap-opacity": active.density ? 0.65 : 0,
      "heatmap-color": [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(199,96,63,0)", 0.3, "rgba(199,96,63,0.25)",
        0.6, "rgba(199,96,63,0.5)", 1, "rgba(199,96,63,0.85)",
      ],
    },
  });
  m.addLayer({
    id: "density-circles", type: "circle", source: "density", minzoom: 13,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 4, 16, 8],
      "circle-color": "#C7603F", "circle-opacity": active.density ? 0.5 : 0,
      "circle-stroke-width": 1, "circle-stroke-color": "#C7603F", "circle-stroke-opacity": active.density ? 0.3 : 0,
    },
  });
}

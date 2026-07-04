import type mapboxgl from "mapbox-gl";
import type { Zone } from "@/types";
import { BRAND } from "@/lib/scoreColor";
import { PROJECTS } from "@/api/fixtures";
import { waterProfile } from "@/lib/waterSanitation";
import { voronoiRings } from "@/lib/voronoi";

/** Vitality choropleth — one clipped-Voronoi cell per zone so the map shows a
 *  zone's *area of influence* (not just a pin), tinted along the score ramp. */
export function generateVitalityCells(zones: Zone[]) {
  if (!zones.length) return [];
  const rings = voronoiRings(zones.map((z) => z.centroid));
  return zones.flatMap((z, i) => {
    const ring = rings[i];
    if (!ring.length) return [];
    return [
      {
        type: "Feature" as const,
        id: i, // numeric id enables hover feature-state
        geometry: { type: "Polygon" as const, coordinates: [ring] },
        properties: { zoneId: z.id, zone: z.name, score: z.score },
      },
    ];
  });
}

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

/** Water & Sanitation (SDG 6) — one marker per zone, sized/weighted by unmet
 *  water & sanitation need. Weakest access reads as the STRONGEST teal marker;
 *  zones where trunk sewerage is not viable carry an `opportunity` flag so the
 *  map can surface a context-specific decentralized-sanitation solution. */
export function generateWaterFeatures(zones: Zone[]) {
  return zones.map((z) => {
    const p = waterProfile(z);
    return {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: z.centroid },
      properties: {
        zone: z.name,
        need: p.needPct / 100,
        needPct: p.needPct,
        opportunity: p.opportunity,
        context: p.contextLabel,
        accessPct: p.accessPct,
        sharedPointPct: p.sharedPointPct,
        waitMin: p.waitMin,
        sewerViable: p.sewerViable,
        solutionTag: p.solutionTag,
        solution: p.solution,
        rationale: p.rationale,
      },
    };
  });
}

/** Project Momentum — gold circles at each project marker, sized by progress.
 *  Stalled projects tint rose so lost momentum reads at a glance. */
export function generateMomentumFeatures() {
  return PROJECTS.map((p) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: p.marker },
    properties: {
      name: p.name,
      progress: p.progress,
      status: p.status,
      agency: p.agency,
      eta: p.eta,
    },
  }));
}

/** Safety & Security — one circle per zone, sized/colored by risk (inverse of
 *  the safety pillar): steel where secure, gold at watch level, rose at risk. */
export function generateSafetyFeatures(zones: Zone[]) {
  return zones.map((z) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: z.centroid },
    properties: {
      zone: z.name,
      safety: z.pillars.safety,
      risk: 100 - z.pillars.safety,
      delta: z.deltas.safety,
    },
  }));
}

export function addSourcesAndLayers(
  m: mapboxgl.Map,
  zones: Zone[],
  active: {
    vitality: boolean;
    roads: boolean;
    energy: boolean;
    density: boolean;
    water: boolean;
    momentum: boolean;
    safety: boolean;
  },
) {
  m.addSource("vitality", {
    type: "geojson",
    data: { type: "FeatureCollection", features: generateVitalityCells(zones) },
  });
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
  m.addSource("water", {
    type: "geojson",
    data: { type: "FeatureCollection", features: generateWaterFeatures(zones) },
  });
  m.addSource("momentum", {
    type: "geojson",
    data: { type: "FeatureCollection", features: generateMomentumFeatures() },
  });
  m.addSource("safety", {
    type: "geojson",
    data: { type: "FeatureCollection", features: generateSafetyFeatures(zones) },
  });

  // --- Vitality choropleth (added first → bottom-most; overlays draw above) ---
  m.addLayer({
    id: "vitality-fill", type: "fill", source: "vitality",
    paint: {
      // Stops mirror the score ramp in scoreColor.ts (SCORE_GRADIENT_CSS).
      "fill-color": [
        "interpolate", ["linear"], ["get", "score"],
        0, "#B23A2E", 30, "#C0552B", 55, "#E0A82E", 78, "#3F9E72", 100, "#1F8A78",
      ],
      "fill-opacity": active.vitality
        ? ["case", ["boolean", ["feature-state", "hover"], false], 0.3, 0.16]
        : 0,
    },
  });
  m.addLayer({
    id: "vitality-outline", type: "line", source: "vitality",
    layout: { "line-join": "round" },
    paint: {
      "line-color": BRAND.bone,
      "line-width": 1.2,
      "line-opacity": active.vitality ? 0.55 : 0,
    },
  });

  m.addLayer({
    id: "roads-line", type: "line", source: "roads",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": BRAND.terracotta, "line-width": 3, "line-dasharray": [1.5, 2.5], "line-opacity": active.roads ? 0.85 : 0 },
  });
  m.addLayer({
    id: "roads-glow", type: "line", source: "roads",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": BRAND.terracotta, "line-width": 8, "line-blur": 6, "line-opacity": active.roads ? 0.25 : 0 },
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
      "circle-stroke-color": ["case", ["==", ["get", "status"], "active"], BRAND.gold, BRAND.steel],
      "circle-stroke-opacity": active.energy ? 0.9 : 0,
    },
  });
  m.addLayer({
    id: "grid-inner", type: "circle", source: "grid",
    paint: {
      "circle-radius": 5,
      "circle-color": ["case", ["==", ["get", "status"], "active"], BRAND.gold, BRAND.steel],
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
        0, "rgba(62,110,147,0)", 0.3, "rgba(62,110,147,0.28)",
        0.6, "rgba(62,110,147,0.55)", 1, "rgba(62,110,147,0.9)",
      ],
    },
  });
  m.addLayer({
    id: "density-circles", type: "circle", source: "density", minzoom: 13,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 4, 16, 8],
      "circle-color": BRAND.steel, "circle-opacity": active.density ? 0.5 : 0,
      "circle-stroke-width": 1, "circle-stroke-color": BRAND.steel, "circle-stroke-opacity": active.density ? 0.3 : 0,
    },
  });

  // --- Water & Sanitation (SDG 6) ---
  // Soft teal environmental underlay — larger + more opaque where unmet need is
  // greater, so the weakest-access zones glow strongest.
  m.addLayer({
    id: "water-halo", type: "circle", source: "water",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "need"], 0, 18, 1, 48],
      "circle-color": BRAND.teal,
      "circle-blur": 1,
      "circle-opacity": active.water ? ["interpolate", ["linear"], ["get", "need"], 0, 0.08, 1, 0.32] : 0,
    },
  });
  m.addLayer({
    id: "water-core", type: "circle", source: "water",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "need"], 0, 5, 1, 14],
      "circle-color": BRAND.teal,
      "circle-opacity": active.water ? 0.92 : 0,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": BRAND.bone,
      "circle-stroke-opacity": active.water ? 0.7 : 0,
    },
  });
  // Dashed opportunity ring — only on zones where trunk sewerage is not viable
  // and a decentralized-sanitation solution applies.
  m.addLayer({
    id: "water-opportunity", type: "circle", source: "water",
    filter: ["==", ["get", "opportunity"], true],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "need"], 0, 16, 1, 28],
      "circle-color": "rgba(0,0,0,0)",
      "circle-stroke-width": 2,
      "circle-stroke-color": BRAND.tealDeep,
      "circle-stroke-opacity": active.water ? 0.85 : 0,
    },
  });
  m.addLayer({
    id: "water-touch", type: "circle", source: "water",
    paint: { "circle-radius": 24, "circle-color": "#000", "circle-opacity": 0 },
  });

  // --- Project Momentum ---
  m.addLayer({
    id: "momentum-glow", type: "circle", source: "momentum",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "progress"], 0, 12, 100, 32],
      "circle-color": ["case", ["==", ["get", "status"], "stalled"], BRAND.rose, BRAND.gold],
      "circle-blur": 1,
      "circle-opacity": active.momentum ? 0.28 : 0,
    },
  });
  m.addLayer({
    id: "momentum-core", type: "circle", source: "momentum",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "progress"], 0, 4, 100, 13],
      "circle-color": ["case",
        ["==", ["get", "status"], "stalled"], BRAND.rose,
        ["interpolate", ["linear"], ["get", "progress"], 0, BRAND.goldDeep, 100, BRAND.gold],
      ],
      "circle-opacity": active.momentum ? 0.92 : 0,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": BRAND.bone,
      "circle-stroke-opacity": active.momentum ? 0.6 : 0,
    },
  });
  m.addLayer({
    id: "momentum-touch", type: "circle", source: "momentum",
    paint: { "circle-radius": 20, "circle-color": "#000", "circle-opacity": 0 },
  });

  // --- Safety & Security ---
  m.addLayer({
    id: "safety-fill", type: "circle", source: "safety",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "risk"], 20, 22, 60, 46],
      "circle-color": ["interpolate", ["linear"], ["get", "risk"], 20, BRAND.steel, 40, BRAND.gold, 60, BRAND.rose],
      "circle-blur": 0.9,
      "circle-opacity": active.safety ? 0.22 : 0,
    },
  });
  m.addLayer({
    id: "safety-core", type: "circle", source: "safety",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "risk"], 20, 5, 60, 12],
      "circle-color": ["interpolate", ["linear"], ["get", "risk"], 20, BRAND.steel, 40, BRAND.gold, 60, BRAND.rose],
      "circle-opacity": active.safety ? 0.9 : 0,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": BRAND.bone,
      "circle-stroke-opacity": active.safety ? 0.6 : 0,
    },
  });
  m.addLayer({
    id: "safety-touch", type: "circle", source: "safety",
    paint: { "circle-radius": 24, "circle-color": "#000", "circle-opacity": 0 },
  });
}

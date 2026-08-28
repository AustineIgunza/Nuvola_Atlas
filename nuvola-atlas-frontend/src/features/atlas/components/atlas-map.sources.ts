import type mapboxgl from "mapbox-gl";
import type { Zone } from "@/domain/types";
import { BRAND } from "@/shared/lib/scoreColor";
import { PROJECTS } from "@/api/fixtures";
import { waterProfile } from "@/domain/water";
import { voronoiRings } from "@/shared/lib/voronoi";

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
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 5],
    [5, 4],
    [4, 7],
    [7, 10],
    [10, 8],
    [8, 6],
    [1, 12],
    [12, 11],
    [3, 14],
    [14, 13],
    [13, 3],
    [15, 4],
    [15, 5],
    [1, 16],
    [16, 15],
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

/** Deterministic jitter so scattered nodes stay put between renders (no random
 *  drift on every map re-init). Hashes a seed string into a stable [-1,1]. */
function jitter(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

const WATER_FACILITY_KIND: { match: RegExp; tag: string }[] = [
  { match: /kiosk|water point/i, tag: "Communal kiosks" },
  { match: /dewats|ablution|sanitation block/i, tag: "DEWATS block" },
  { match: /sludge|treatment/i, tag: "Faecal-sludge plant" },
  { match: /main|extension|reticulation/i, tag: "Trunk main" },
];

function waterFacilityTag(name: string): string {
  return WATER_FACILITY_KIND.find((k) => k.match.test(name))?.tag ?? "Water works";
}

/** Water & Sanitation (SDG 6) — drawn as real reticulation *infrastructure*
 *  rather than one marker per zone: a trunk-main network (LineStrings) feeding
 *  from the western/northern sources toward the high-need informal settlements,
 *  communal water-point taps scattered per zone (denser where shared-point
 *  dependency is higher), a zone hub carrying the full access profile, and the
 *  real sanitation facilities (kiosks, DEWATS, sludge plants) at their markers.
 *  Weakest access reads deepest teal; zones where trunk sewerage is not viable
 *  carry an `opportunity` flag surfacing a decentralized-sanitation solution. */
export function generateWaterFeatures(zones: Zone[]) {
  const idx = new Map(zones.map((z, i) => [i, z] as const));
  // Reticulation spine — source zones in the west/north feeding eastward.
  const mains = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [0, 15],
    [15, 14],
    [14, 13],
    [15, 16],
    [5, 7],
    [7, 6],
    [13, 12],
    [12, 10],
    [10, 11],
    [10, 8],
    [9, 10],
  ];

  const mainFeatures = mains
    .filter(([a, b]) => idx.has(a) && idx.has(b))
    .flatMap(([a, b]) => {
      const za = idx.get(a)!;
      const zb = idx.get(b)!;
      const pb = waterProfile(zb);
      // No profile at the destination means no measured need — drawing the
      // main with a fabricated width/tint would put a fake priority on it.
      if (pb === null) return [];
      return [
        {
          type: "Feature" as const,
          geometry: { type: "LineString" as const, coordinates: [za.centroid, zb.centroid] },
          properties: {
            kind: "main",
            zoneId: zb.id,
            name: `${za.name} → ${zb.name} main`,
            need: pb.needPct / 100,
          },
        },
      ];
    });

  const nodeFeatures = zones.flatMap((z) => {
    const p = waterProfile(z);
    // No profile means the zone has null pillars — no hub, no taps, no ring.
    // The map should be silent about a zone it cannot honestly characterise.
    if (p === null) return [];
    // Zone hub — carries the full SDG-6 profile for the popup + opportunity ring.
    const hub = {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: z.centroid },
      properties: {
        kind: "hub",
        zoneId: z.id,
        zone: z.name,
        need: p.needPct / 100,
        needPct: p.needPct,
        opportunity: p.opportunity,
        context: p.contextLabel,
        sewerViable: p.sewerViable,
        solutionTag: p.solutionTag,
        solution: p.solution,
        rationale: p.rationale,
      },
    };
    // Communal water-point taps — more of them where unmet need is higher, so
    // weak sub-counties visibly carry a denser tap cluster. A density cue for
    // the eye, not a count of real taps; no number is ever read off it.
    const taps = 2 + Math.round((p.needPct / 100) * 4);
    const tapFeatures = Array.from({ length: taps }, (_, i) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [
          z.centroid[0] + jitter(`${z.id}-tx-${i}`) * 0.014,
          z.centroid[1] + jitter(`${z.id}-ty-${i}`) * 0.011,
        ] as [number, number],
      },
      properties: { kind: "tap", zoneId: z.id, zone: z.name, need: p.needPct / 100 },
    }));
    return [hub, ...tapFeatures];
  });

  // Real sanitation facilities from the fixtures, at their true markers.
  const facilityFeatures = PROJECTS.filter((p) => p.type === "water").map((p) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: p.marker },
    properties: {
      kind: "facility",
      zoneId: p.zoneId,
      name: p.name,
      agency: p.agency,
      progress: p.progress,
      status: p.status,
      eta: p.eta,
      facility: waterFacilityTag(p.name),
    },
  }));

  return [...mainFeatures, ...nodeFeatures, ...facilityFeatures];
}

export function addSourcesAndLayers(
  m: mapboxgl.Map,
  zones: Zone[],
  active: {
    vitality: boolean;
    roads: boolean;
    energy: boolean;
    water: boolean;
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
  m.addSource("water", {
    type: "geojson",
    data: { type: "FeatureCollection", features: generateWaterFeatures(zones) },
  });

  // --- Vitality choropleth (added first → bottom-most; overlays draw above) ---
  m.addLayer({
    id: "vitality-fill",
    type: "fill",
    source: "vitality",
    paint: {
      // Stops mirror the score ramp in scoreColor.ts (SCORE_GRADIENT_CSS).
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", "score"],
        0,
        "#B23A2E",
        30,
        "#C0552B",
        55,
        "#E0A82E",
        78,
        "#3F9E72",
        100,
        "#1F8A78",
      ],
      "fill-opacity": active.vitality
        ? ["case", ["boolean", ["feature-state", "hover"], false], 0.3, 0.16]
        : 0,
    },
  });
  m.addLayer({
    id: "roads-line",
    type: "line",
    source: "roads",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": BRAND.terracotta,
      "line-width": 3,
      "line-dasharray": [1.5, 2.5],
      "line-opacity": active.roads ? 0.85 : 0,
    },
  });
  m.addLayer(
    {
      id: "roads-glow",
      type: "line",
      source: "roads",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": BRAND.terracotta,
        "line-width": 8,
        "line-blur": 6,
        "line-opacity": active.roads ? 0.25 : 0,
      },
    },
    "roads-line",
  );
  // Invisible thicker hit-target so touch on mobile is reliable. Opacity 0 but
  // still receives click/tap events. Width tuned to a finger-tip.
  m.addLayer({
    id: "roads-touch",
    type: "line",
    source: "roads",
    paint: { "line-color": "#000", "line-width": 22, "line-opacity": 0 },
  });

  m.addLayer({
    id: "grid-outer",
    type: "circle",
    source: "grid",
    paint: {
      "circle-radius": 12,
      "circle-color": "transparent",
      "circle-stroke-width": 2,
      "circle-stroke-color": ["case", ["==", ["get", "status"], "active"], BRAND.gold, BRAND.steel],
      "circle-stroke-opacity": active.energy ? 0.9 : 0,
    },
  });
  m.addLayer({
    id: "grid-inner",
    type: "circle",
    source: "grid",
    paint: {
      "circle-radius": 5,
      "circle-color": ["case", ["==", ["get", "status"], "active"], BRAND.gold, BRAND.steel],
      "circle-opacity": active.energy ? 0.9 : 0,
    },
  });
  // Larger invisible hit-target above the visible grid circles for tap accuracy.
  m.addLayer({
    id: "grid-touch",
    type: "circle",
    source: "grid",
    paint: { "circle-radius": 22, "circle-color": "#000", "circle-opacity": 0 },
  });

  // --- Water & Sanitation (SDG 6) — drawn reticulation network ---
  // Trunk mains: soft glow under a dashed pipe line. Deeper teal = lower access
  // (more urgent). Width also grows with need so priority mains read heavier.
  m.addLayer({
    id: "water-main-glow",
    type: "line",
    source: "water",
    filter: ["==", ["get", "kind"], "main"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": [
        "interpolate",
        ["linear"],
        ["get", "access"],
        35,
        BRAND.tealDeep,
        90,
        BRAND.teal,
      ],
      "line-width": ["interpolate", ["linear"], ["get", "need"], 0, 6, 1, 12],
      "line-blur": 6,
      "line-opacity": active.water ? 0.22 : 0,
    },
  });
  m.addLayer({
    id: "water-main",
    type: "line",
    source: "water",
    filter: ["==", ["get", "kind"], "main"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": [
        "interpolate",
        ["linear"],
        ["get", "access"],
        35,
        BRAND.tealDeep,
        90,
        BRAND.teal,
      ],
      "line-width": ["interpolate", ["linear"], ["get", "need"], 0, 2, 1, 4],
      "line-dasharray": [2, 1.6],
      "line-opacity": active.water ? 0.85 : 0,
    },
  });
  // Environmental halo on the zone hub — larger + more opaque where unmet need
  // is greater, so the weakest-access zones glow strongest.
  m.addLayer({
    id: "water-halo",
    type: "circle",
    source: "water",
    filter: ["==", ["get", "kind"], "hub"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "need"], 0, 16, 1, 42],
      "circle-color": BRAND.teal,
      "circle-blur": 1,
      "circle-opacity": active.water
        ? ["interpolate", ["linear"], ["get", "need"], 0, 0.06, 1, 0.28]
        : 0,
    },
  });
  // Communal water-point taps — the scattered network nodes.
  m.addLayer({
    id: "water-tap",
    type: "circle",
    source: "water",
    filter: ["==", ["get", "kind"], "tap"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 2.5, 15, 5],
      "circle-color": BRAND.teal,
      "circle-opacity": active.water ? 0.7 : 0,
      "circle-stroke-width": 1,
      "circle-stroke-color": BRAND.bone,
      "circle-stroke-opacity": active.water ? 0.4 : 0,
    },
  });
  // Zone hub core.
  m.addLayer({
    id: "water-core",
    type: "circle",
    source: "water",
    filter: ["==", ["get", "kind"], "hub"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "need"], 0, 5, 1, 12],
      "circle-color": BRAND.tealDeep,
      "circle-opacity": active.water ? 0.9 : 0,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": BRAND.bone,
      "circle-stroke-opacity": active.water ? 0.7 : 0,
    },
  });
  // Real sanitation facilities — larger square-shouldered nodes at true markers.
  m.addLayer({
    id: "water-facility",
    type: "circle",
    source: "water",
    filter: ["==", ["get", "kind"], "facility"],
    paint: {
      "circle-radius": 8,
      "circle-color": BRAND.tealDeep,
      "circle-opacity": active.water ? 0.95 : 0,
      "circle-stroke-width": 2.5,
      "circle-stroke-color": BRAND.bone,
      "circle-stroke-opacity": active.water ? 0.9 : 0,
    },
  });
  // Dashed opportunity ring — only on hubs where trunk sewerage is not viable
  // and a decentralized-sanitation solution applies.
  m.addLayer({
    id: "water-opportunity",
    type: "circle",
    source: "water",
    filter: ["all", ["==", ["get", "kind"], "hub"], ["==", ["get", "opportunity"], true]],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "need"], 0, 16, 1, 26],
      "circle-color": "rgba(0,0,0,0)",
      "circle-stroke-width": 2,
      "circle-stroke-color": BRAND.tealDeep,
      "circle-stroke-opacity": active.water ? 0.85 : 0,
    },
  });
  // Invisible hit targets — a wide line for mains, wide circles for the nodes.
  m.addLayer({
    id: "water-main-touch",
    type: "line",
    source: "water",
    filter: ["==", ["get", "kind"], "main"],
    paint: { "line-color": "#000", "line-width": 18, "line-opacity": 0 },
  });
  m.addLayer({
    id: "water-touch",
    type: "circle",
    source: "water",
    filter: ["in", ["get", "kind"], ["literal", ["hub", "facility"]]],
    paint: { "circle-radius": 22, "circle-color": "#000", "circle-opacity": 0 },
  });

}

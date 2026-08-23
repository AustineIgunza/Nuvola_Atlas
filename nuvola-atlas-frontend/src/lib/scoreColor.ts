import { PILLARS, type PillarKey } from "@/lib/pillars.generated";

/** Maps a 0-100 vitality score along the Ground & Harvest ramp:
 *  brick #B23A2E -> terracotta #C0552B -> gold #E0A82E -> #3F9E72 -> teal #1F8A78
 *  (warm earth at the low end → living teal where people flourish). */
const STOPS: [number, [number, number, number]][] = [
  [0, [178, 58, 46]],
  [30, [192, 85, 43]],
  [55, [224, 168, 46]],
  [78, [63, 158, 114]],
  [100, [31, 138, 120]],
];

/**
 * An unscoreable zone gets a flat, desaturated grey that sits off the ramp
 * entirely. Any colour on the ramp — including the brick at 0 — would read
 * as a measurement.
 */
export const NO_SCORE_COLOR = "rgba(255,255,255,0.18)";
export const NO_SCORE_COLOR_HEX = "#4A5560";

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export function scoreColor(score: number | null): string {
  if (score === null) return NO_SCORE_COLOR;
  const s = Math.max(0, Math.min(100, score));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [s0, c0] = STOPS[i];
    const [s1, c1] = STOPS[i + 1];
    if (s >= s0 && s <= s1) {
      const t = (s - s0) / (s1 - s0);
      return `rgb(${lerp(c0[0], c1[0], t)},${lerp(c0[1], c1[1], t)},${lerp(c0[2], c1[2], t)})`;
    }
  }
  const last = STOPS[STOPS.length - 1][1];
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

export function scoreColorHex(score: number | null): string {
  if (score === null) return NO_SCORE_COLOR_HEX;
  const s = Math.max(0, Math.min(100, score));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [s0, c0] = STOPS[i];
    const [s1, c1] = STOPS[i + 1];
    if (s >= s0 && s <= s1) {
      const t = (s - s0) / (s1 - s0);
      const r = lerp(c0[0], c1[0], t);
      const g = lerp(c0[1], c1[1], t);
      const b = lerp(c0[2], c1[2], t);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
  }
  return "#1F8A78";
}

export const SCORE_GRADIENT_CSS =
  "linear-gradient(90deg, #B23A2E, #C0552B, #E0A82E, #3F9E72, #1F8A78)";

/** Ground & Harvest raw hex tokens — the single source for values that need a
 *  literal hex rather than a Tailwind class: Mapbox paint expressions and
 *  inline `style` props. Mirrors tailwind.config.ts; keep the two in sync. */
export const BRAND = {
  navy: "#0B2235", // Sovereign Navy — cold infrastructure / view-from-above
  navyDeep: "#07141F",
  navyRaised: "#123049",
  terracotta: "#C0552B", // signature — earth / roads / infrastructure
  terracottaDeep: "#A8481F",
  gold: "#E0A82E", // value — energy / transit
  goldDeep: "#B8801C",
  teal: "#1F8A78", // water / life
  tealDeep: "#176B5D",
  steel: "#3E6E93", // navy-family — held / deliberately cool
  rose: "#D3402E", // alert / risk
  bone: "#F4EFE6", // warm off-white — paper / verified record
  ink: "#1A1A1A",
  inkSoft: "#6B6257", // warm taupe — secondary text on light surfaces
} as const;

export const PILLAR_COLORS: Record<PillarKey, string> = {
  water_sanitation: "#1F8A78", // Living Teal — water / life
  road_density: "#C0552B", // Harvest Terracotta — earth / roads
  transit_access: "#E0A82E", // Savannah Gold — movement
  electricity_access: "#3E6E93", // Sovereign Steel — held, deliberately cool
};

/** Long form, for headings and legends. Taken from the registry so a rename
 *  in pillars.json lands everywhere at once. */
export const PILLAR_LABELS: Record<PillarKey, string> = Object.fromEntries(
  PILLARS.map((p) => [p.key, p.displayName]),
) as Record<PillarKey, string>;

export const PILLAR_SHORT: Record<PillarKey, string> = {
  water_sanitation: "Water",
  road_density: "Roads",
  transit_access: "Transit",
  electricity_access: "Power",
};

export const PILLAR_GLYPHS: Record<PillarKey, string> = {
  water_sanitation: "W",
  road_density: "R",
  transit_access: "T",
  electricity_access: "E",
};

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

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export function scoreColor(score: number): string {
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

export function scoreColorHex(score: number): string {
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

export const PILLAR_COLORS: Record<string, string> = {
  social: "#1F8A78", // Living Teal — freedom / human wellbeing
  safety: "#3E6E93", // Sovereign Steel — security (navy family)
  density: "#E0A82E", // Savannah Gold — value / scaling
  infra: "#C0552B", // Harvest Terracotta — earth / infrastructure
};

export const PILLAR_LABELS: Record<string, string> = {
  social: "Social Wellbeing & Human Capital",
  safety: "Safety & Security",
  density: "Density & Scaling Dynamics",
  infra: "Infrastructure & Environmental Safeguards",
};

export const PILLAR_SHORT: Record<string, string> = {
  social: "Social",
  safety: "Safety",
  density: "Density",
  infra: "Infra",
};

export const PILLAR_GLYPHS: Record<string, string> = {
  social: "S",
  safety: "P",
  density: "D",
  infra: "E",
};

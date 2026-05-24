/** Maps a 0-100 vitality score to the gradient: #ff5d5d -> #ff9a3c -> #ffd23c -> #8de26a -> #34c97a */
const STOPS: [number, [number, number, number]][] = [
  [0, [255, 93, 93]],
  [25, [255, 154, 60]],
  [50, [255, 210, 60]],
  [75, [141, 226, 106]],
  [100, [52, 201, 122]],
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
  return "#34c97a";
}

export const SCORE_GRADIENT_CSS =
  "linear-gradient(90deg, #ff5d5d, #ff9a3c, #ffd23c, #8de26a, #34c97a)";

export const PILLAR_COLORS: Record<string, string> = {
  social: "#4a9eff",
  safety: "#ff5d5d",
  density: "#b888ff",
  infra: "#34c97a",
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

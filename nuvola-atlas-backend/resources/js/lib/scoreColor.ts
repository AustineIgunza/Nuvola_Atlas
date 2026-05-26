const STOPS: [number, [number, number, number]][] = [
  [0, [199, 96, 63]],    // #C7603F terracotta
  [25, [201, 162, 39]],   // #C9A227 amber
  [50, [201, 162, 39]],   // #C9A227 amber
  [75, [27, 156, 107]],   // #1B9C6B green
  [100, [27, 156, 107]],  // #1B9C6B green
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

export const SCORE_GRADIENT_CSS =
  "linear-gradient(90deg, #C7603F, #C9A227, #1B9C6B)";

export const PILLAR_COLORS: Record<string, string> = {
  social: "#40798C",
  safety: "#C7603F",
  density: "#C9A227",
  infra: "#1B9C6B",
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

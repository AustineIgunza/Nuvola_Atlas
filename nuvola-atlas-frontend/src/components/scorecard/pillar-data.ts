import type { PillarKey } from "@/types";

export interface SubMetricDef {
  label: string;
  score: number;
  weight: number;
  trend: "up" | "down" | "stable";
  detail: string;
}

export const SUB_METRICS: Record<PillarKey, SubMetricDef[]> = {
  social: [
    { label: "Social Progress Index", score: 64, weight: 0.4, trend: "up", detail: "Basic medical care, access to amenities, and inclusiveness" },
    { label: "Workforce Mobility", score: 71, weight: 0.35, trend: "stable", detail: "Ease of labour and specialized role movement in/out of region" },
    { label: "Mental Health & Livability", score: 52, weight: 0.25, trend: "down", detail: "Green space access, air quality, projected burnout risk" },
  ],
  safety: [
    { label: "Rule of Law Stability", score: 68, weight: 0.4, trend: "stable", detail: "Contract expropriation probability, 5-year judicial independence trend" },
    { label: "Physical Security", score: 58, weight: 0.35, trend: "down", detail: "Conflict heatmap integration, proximity to high-crime corridors" },
    { label: "Digital Sovereignty", score: 61, weight: 0.25, trend: "up", detail: "Internet Freedom Score, network outage frequency" },
  ],
  density: [
    { label: "Optimal Density Ratio", score: 55, weight: 0.55, trend: "down", detail: "Infrastructure Capacity / Population Density — low ratio flags over-saturation" },
    { label: "Urban Friction Index", score: 62, weight: 0.45, trend: "stable", detail: "Average transit times for heavy equipment, zoning process complexity" },
  ],
  infra: [
    { label: "ESIA Transparency", score: 74, weight: 0.25, trend: "up", detail: "Availability of Environmental & Social Impact Assessments to local stakeholders" },
    { label: "Sovereign Immunity Risk", score: 62, weight: 0.2, trend: "stable", detail: "Government accountability for breaches of environmental/infrastructure contracts" },
    { label: "Resource Sovereignty", score: 70, weight: 0.2, trend: "stable", detail: "Legal protections on water and energy rights, nationalization risk" },
    { label: "Waste & Lifecycle Mandates", score: 58, weight: 0.2, trend: "up", detail: "EPR laws, decommissioning liabilities in force" },
    { label: "Circular Economy Freedom", score: 48, weight: 0.15, trend: "down", detail: "Whether laws permit reuse of greywater and recycled construction materials" },
  ],
};

export const TREND_ICON: Record<string, { char: string; color: string }> = {
  up: { char: "▲", color: "#1F8A78" },
  down: { char: "▼", color: "#D3402E" },
  stable: { char: "◆", color: "#94A2AF" },
};

export function scoreLabel(s: number): { text: string; color: string } {
  if (s >= 75) return { text: "Strong", color: "#1F8A78" };
  if (s >= 60) return { text: "Moderate", color: "#E0A82E" };
  if (s >= 45) return { text: "Weak", color: "#C0552B" };
  return { text: "Critical", color: "#D3402E" };
}

import type { AlertSeverity } from "@/types";

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: "#ff5d5d",
  medium: "#ffb340",
  low: "rgba(255,255,255,0.2)",
};

export const IMPACT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "rgba(255,93,93,0.15)", text: "#ff5d5d", label: "Critical Impact" },
  major: { bg: "rgba(255,154,60,0.15)", text: "#ff9a3c", label: "Major Impact" },
  moderate: { bg: "rgba(255,210,60,0.15)", text: "#ffd23c", label: "Moderate Impact" },
  minor: { bg: "rgba(141,226,106,0.15)", text: "#8de26a", label: "Minor Impact" },
};

export const KIND_LABELS: Record<string, string> = {
  infra: "Infrastructure",
  vitality: "Vitality Index",
  esia: "ESIA / Environmental",
  system: "System",
  partner: "Partnership",
};

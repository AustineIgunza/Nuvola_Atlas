import type { AlertSeverity } from "@/types";

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: "#D3402E",
  medium: "#E0A82E",
  low: "rgba(244,239,230,0.2)",
};

export const IMPACT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "rgba(211,64,46,0.15)", text: "#D3402E", label: "Critical Impact" },
  major: { bg: "rgba(192,85,43,0.15)", text: "#C0552B", label: "Major Impact" },
  moderate: { bg: "rgba(224,168,46,0.15)", text: "#E0A82E", label: "Moderate Impact" },
  minor: { bg: "rgba(31,138,120,0.15)", text: "#1F8A78", label: "Minor Impact" },
};

export const KIND_LABELS: Record<string, string> = {
  infra: "Infrastructure",
  vitality: "Vitality Index",
  esia: "ESIA / Environmental",
  system: "System",
  partner: "Partnership",
};

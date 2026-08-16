import type { ReportStatus } from "@/types";

export const STATUS_STYLES: Record<ReportStatus, { bg: string; text: string; glow: string }> = {
  published: {
    bg: "rgba(31,138,120,0.12)",
    text: "#1F8A78",
    glow: "glow-success",
  },
  review: {
    bg: "rgba(224,168,46,0.12)",
    text: "#E0A82E",
    glow: "glow-warning",
  },
  draft: {
    bg: "rgba(255,255,255,0.06)",
    text: "#94A2AF",
    glow: "",
  },
};

export const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "rgba(211,64,46,0.15)", text: "#D3402E" },
  high: { bg: "rgba(192,85,43,0.15)", text: "#C0552B" },
  medium: { bg: "rgba(224,168,46,0.15)", text: "#E0A82E" },
  low: { bg: "rgba(31,138,120,0.15)", text: "#1F8A78" },
};

export const TYPE_LABELS: Record<string, string> = {
  vitality: "Vitality Assessment",
  infrastructure: "Infrastructure Progress",
  density: "Density Analysis",
  safety: "Safety Audit",
  environmental: "Environmental Impact",
};

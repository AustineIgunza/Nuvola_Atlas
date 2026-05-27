import type { ReportStatus } from "@/types";

export const STATUS_STYLES: Record<
  ReportStatus,
  { bg: string; text: string; glow: string }
> = {
  published: {
    bg: "rgba(52,201,122,0.12)",
    text: "#34c97a",
    glow: "glow-success",
  },
  review: {
    bg: "rgba(255,179,64,0.12)",
    text: "#ffb340",
    glow: "glow-warning",
  },
  draft: {
    bg: "rgba(255,255,255,0.06)",
    text: "#8a91a0",
    glow: "",
  },
};

export const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "rgba(255,93,93,0.15)", text: "#ff5d5d" },
  high: { bg: "rgba(255,154,60,0.15)", text: "#ff9a3c" },
  medium: { bg: "rgba(255,210,60,0.15)", text: "#ffd23c" },
  low: { bg: "rgba(141,226,106,0.15)", text: "#8de26a" },
};

export const TYPE_LABELS: Record<string, string> = {
  vitality: "Vitality Assessment",
  infrastructure: "Infrastructure Progress",
  density: "Density Analysis",
  safety: "Safety Audit",
  environmental: "Environmental Impact",
};

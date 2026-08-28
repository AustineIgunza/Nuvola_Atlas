import type { MessageKey } from "@/shared/lib/i18n/translate";
import type { AlertSeverity } from "@/domain/types";

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: "#D3402E",
  medium: "#E0A82E",
  low: "rgba(244,239,230,0.2)",
};

// Palette and impact-level → i18n key. Label text now comes from t()
// so the badge follows the active locale.
export const IMPACT_STYLES: Record<
  string,
  { bg: string; text: string; labelKey: MessageKey; shortKey: MessageKey }
> = {
  critical: {
    bg: "rgba(211,64,46,0.15)",
    text: "#D3402E",
    labelKey: "alert.impact.critical",
    shortKey: "alert.impact.short.critical",
  },
  major: {
    bg: "rgba(192,85,43,0.15)",
    text: "#C0552B",
    labelKey: "alert.impact.major",
    shortKey: "alert.impact.short.major",
  },
  moderate: {
    bg: "rgba(224,168,46,0.15)",
    text: "#E0A82E",
    labelKey: "alert.impact.moderate",
    shortKey: "alert.impact.short.moderate",
  },
  minor: {
    bg: "rgba(31,138,120,0.15)",
    text: "#1F8A78",
    labelKey: "alert.impact.minor",
    shortKey: "alert.impact.short.minor",
  },
};

// Alert kind → i18n key. Consumers t() the key to get the label.
export const KIND_LABEL_KEYS: Record<string, MessageKey> = {
  infra: "alert.kind.infra",
  vitality: "alert.kind.vitality",
  esia: "alert.kind.esia",
  system: "alert.kind.system",
  partner: "alert.kind.partner",
};

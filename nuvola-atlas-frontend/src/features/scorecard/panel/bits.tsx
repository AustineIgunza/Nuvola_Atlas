import type { ReactNode } from "react";
import { Layers } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useUIStore } from "@/shared/stores/ui";
import type { LayerKey } from "@/shared/stores/atlas";
import { BRAND, NO_SCORE_COLOR_HEX } from "@/shared/lib/scoreColor";
import { translate } from "@/shared/lib/i18n/translate";
import { usePrefsStore } from "@/shared/stores/prefs";
import { useT } from "@/shared/lib/i18n/use-t";
import type { AlertSeverity, ProjectStatus } from "@/domain/types";

/** Shared color coding for the scorecard panel and its explainer views. */
export const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  high: BRAND.rose,
  medium: BRAND.gold,
  low: BRAND.steel,
};

export const IMPACT_COLOR: Record<string, string> = {
  critical: BRAND.rose,
  major: BRAND.terracotta,
  moderate: BRAND.gold,
  minor: BRAND.steel,
};

export const STATUS_COLOR: Record<ProjectStatus, string> = {
  active: BRAND.teal,
  stalled: BRAND.rose,
  planned: BRAND.steel,
};

/**
 * STATUS_STYLE — deprecated in favour of statusLabel(t) + STATUS_COLOR.
 * Kept for backwards compat while the drill-in components migrate.
 */
export const STATUS_STYLE: Record<ProjectStatus, { label: string; color: string }> = {
  active: { label: "Active", color: BRAND.teal },
  stalled: { label: "Stalled", color: BRAND.rose },
  planned: { label: "Planned", color: BRAND.steel },
};

export function statusLabel(t: ReturnType<typeof useT>, status: ProjectStatus): string {
  if (status === "active") return t("project.status.active");
  if (status === "stalled") return t("project.status.stalled");
  return t("project.status.planned");
}

/** Score band shared with the map legend / marker colors (70/55 thresholds). */
export function scoreBand(score: number | null): { label: string; color: string } {
  const locale = usePrefsStore.getState().locale;
  // Not "At Risk". A zone nobody measured has not failed a threshold, and the
  // terracotta would put it in the same visual bucket as one that did.
  if (score === null) {
    return { label: translate(locale, "band.noData"), color: NO_SCORE_COLOR_HEX };
  }
  if (score >= 70) return { label: translate(locale, "band.strong"), color: BRAND.teal };
  if (score >= 55) return { label: translate(locale, "band.moderate"), color: BRAND.gold };
  return { label: translate(locale, "band.atRisk"), color: BRAND.terracotta };
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-3", className)}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-2">
          {title && (
            <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.08em]">
              {title}
            </div>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Chip({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: `${color}1A`, color }}
    >
      {children}
    </span>
  );
}

export function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-control bg-[rgba(255,255,255,0.04)] py-1.5 px-1 text-center">
      <div className="text-[12.5px] font-semibold tabular-nums text-ink-1">{value}</div>
      <div className="text-[8.5px] text-ink-4 uppercase tracking-[0.05em]">{label}</div>
    </div>
  );
}

/** "See it on the Atlas" — enables the related map layer if it's off. */
export function LayerHintButton({ layer, label }: { layer: LayerKey; label: string }) {
  const t = useT();
  const active = useUIStore((s) => s.activeLayers[layer]);
  const toggleLayer = useUIStore((s) => s.toggleLayer);
  return (
    <button
      onClick={() => {
        if (!active) toggleLayer(layer);
      }}
      className={cn(
        "w-full h-8 rounded-control border text-[10.5px] font-medium transition-colors flex items-center justify-center gap-1.5",
        active
          ? "bg-[rgba(31,138,120,0.10)] border-[rgba(31,138,120,0.3)] text-ink-2 cursor-default"
          : "bg-[rgba(255,255,255,0.04)] border-border text-ink-3 hover:bg-[rgba(255,255,255,0.08)]",
      )}
    >
      <Layers size={12} className="shrink-0" style={{ color: BRAND.teal }} />
      {active ? t("layerHint.active", { label }) : t("layerHint.show", { label })}
    </button>
  );
}

import { Activity } from "lucide-react";
import { BRAND } from "@/lib/scoreColor";
import { zoneIndicatorSummary } from "@/lib/indicators";

interface Props {
  zoneId: string;
  className?: string;
}

/**
 * "N of 12 indicators available" chip. Colour follows the ingestion state
 * so it reads at a glance: teal when fully delivered, gold while data is
 * still filling in, steel when the zone is early in the rollout. Kept
 * intentionally quiet — this is a status indicator, not an alarm.
 */
export default function IndicatorAvailabilityChip({ zoneId, className }: Props) {
  const summary = zoneIndicatorSummary(zoneId);
  const complete = summary.delivered === summary.total;
  const color = complete
    ? BRAND.teal
    : summary.delivered >= Math.round(summary.total * 0.75)
      ? BRAND.gold
      : BRAND.steel;

  const label = complete
    ? `${summary.total} of ${summary.total} indicators active`
    : `${summary.delivered} of ${summary.total} indicators active`;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${className ?? ""}`}
      style={{ background: `${color}1A`, color }}
      title={
        complete
          ? "All 12 Daystar indicators are delivering to this zone."
          : `${summary.delivered} delivered · ${summary.pending} in pipeline · ${summary.blocked} not yet scoped.`
      }
    >
      <Activity size={10} className="shrink-0" />
      {label}
    </span>
  );
}

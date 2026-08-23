import { Activity } from "lucide-react";
import { BRAND } from "@/lib/scoreColor";
import { PILLARS } from "@/lib/pillars.generated";
import type { PillarKey, Zone } from "@/types";

interface Props {
  zone: Zone;
  className?: string;
}

/**
 * "N of 4 pillars measured" chip, counted off the zone's own readings rather
 * than a coverage fixture. A zone missing a pillar reads steel, not red — a
 * gap in the record is not a bad score.
 */
export default function PillarCoverageChip({ zone, className }: Props) {
  const total = PILLARS.length;
  const measured = PILLARS.filter((p) => zone.pillars[p.key as PillarKey] !== null).length;
  const complete = measured === total;
  const color = complete
    ? BRAND.teal
    : measured >= Math.round(total * 0.75)
      ? BRAND.gold
      : BRAND.steel;

  const missing = PILLARS.filter((p) => zone.pillars[p.key as PillarKey] === null)
    .map((p) => p.displayName)
    .join(", ");

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${className ?? ""}`}
      style={{ background: `${color}1A`, color }}
      title={
        complete
          ? "Every live pillar has a reading for this sub-county."
          : `No reading for: ${missing}.`
      }
    >
      <Activity size={10} className="shrink-0" />
      {measured} of {total} pillars measured
    </span>
  );
}

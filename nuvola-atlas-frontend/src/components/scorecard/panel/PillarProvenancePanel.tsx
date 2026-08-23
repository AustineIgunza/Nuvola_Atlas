import { BadgeCheck, CircleDashed } from "lucide-react";
import { BRAND, PILLAR_COLORS } from "@/lib/scoreColor";
import { PILLARS } from "@/lib/pillars.generated";
import { Section } from "./bits";
import type { PillarKey, Zone } from "@/types";

interface Props {
  zone: Zone;
  showAttribution?: boolean;
}

/**
 * Provenance ledger: for each live pillar, what it is measured from, at what
 * granularity, and as of when. A pillar this zone has no reading for is drawn
 * as a gap — no number, no colour off the score ramp — because a blank cell a
 * regulator can see is worth more than a plausible one they cannot check.
 */
export default function PillarProvenancePanel({ zone, showAttribution }: Props) {
  const measured = PILLARS.filter((p) => zone.pillars[p.key as PillarKey] !== null).length;

  return (
    <Section title={`Provenance · ${measured}/${PILLARS.length} measured`} className="space-y-2">
      <p className="text-[10px] text-ink-4 leading-[1.55]">
        Every pillar states its source, its vintage and the level it was collected at. Nothing here
        is modelled down from a county or utility figure.
      </p>

      <div className="mt-2 space-y-1">
        {PILLARS.map((p) => {
          const value = zone.pillars[p.key as PillarKey];
          const color = PILLAR_COLORS[p.key as PillarKey];
          const isGap = value === null;

          return (
            <div
              key={p.key}
              className="flex items-start gap-1.5 rounded-control bg-[rgba(255,255,255,0.02)] border border-border px-2 py-1.5"
              title={p.description ?? p.displayName}
            >
              <span
                className="mt-1 w-1.5 h-3 rounded-sm shrink-0"
                style={{ background: isGap ? BRAND.steel : color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] text-ink-2 truncate">{p.displayName}</span>
                  {p.status === "held" && (
                    <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-4">
                      held
                    </span>
                  )}
                </div>
                <div className="text-[9.5px] text-ink-4 truncate">
                  {isGap ? "No reading for this sub-county" : `${p.vintage} · ${p.granularity}`}
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  background: isGap ? `${BRAND.steel}1A` : `${BRAND.teal}1A`,
                  color: isGap ? BRAND.steel : BRAND.teal,
                }}
              >
                {isGap ? <CircleDashed size={11} /> : <BadgeCheck size={11} />}
                {isGap ? "Gap" : "Measured"}
              </span>
            </div>
          );
        })}
      </div>

      {showAttribution && <SourceAttribution />}
    </Section>
  );
}

export function SourceAttribution() {
  return (
    <div
      className="mt-2 rounded-control p-2.5 border"
      style={{ borderColor: `${BRAND.teal}33`, background: `${BRAND.teal}0F` }}
    >
      <div className="flex items-center gap-1.5">
        <BadgeCheck size={12} style={{ color: BRAND.teal }} className="shrink-0" />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: BRAND.teal }}
        >
          Upstream sources
        </span>
      </div>
      <p className="mt-1.5 text-[10.5px] text-ink-2 leading-[1.55]">
        KNBS 2019 census and WASREB IMPACT for water and sanitation, HOT OSM for road density,
        Digital Matatus GTFS with WorldPop for transit access. Each is published, dated and
        independently checkable.
      </p>
    </div>
  );
}

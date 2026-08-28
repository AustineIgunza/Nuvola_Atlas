import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { api } from "@/api";
import { BRAND, PILLAR_COLORS, PILLAR_GLYPHS } from "@/shared/lib/scoreColor";
import Ring from "../Ring";
import PillarProvenancePanel from "./PillarProvenancePanel";
import { Section, Chip, scoreBand } from "./bits";
import { PILLARS } from "@/domain/pillars.generated";
import { byScoreDesc, formatScore, isScored } from "@/domain/scores";
import { useT } from "@/shared/lib/i18n/use-t";
import type { PanelView } from "./panel-types";
import type { Zone, PillarKey } from "@/domain/types";

interface Props {
  zone: Zone;
  onNavigate: (view: PanelView) => void;
}

export default function IndexExplainer({ zone, onNavigate }: Props) {
  const t = useT();
  const { data: allZones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });
  const band = scoreBand(zone.score);

  const sorted = [...(allZones ?? [])].sort(byScoreDesc);
  // Unscoreable zones are pinned to the tail, so their index is a placement,
  // not a rank. Suppress it rather than claim they came last.
  const rank = isScored(zone) ? sorted.findIndex((z) => z.id === zone.id) + 1 : 0;

  const BANDS = [
    { range: "70–100", label: t("band.strong"), color: BRAND.teal, note: t("band.strong.note") },
    { range: "55–69", label: t("band.moderate"), color: BRAND.gold, note: t("band.moderate.note") },
    {
      range: "0–54",
      label: t("band.atRisk"),
      color: BRAND.terracotta,
      note: t("band.atRisk.note"),
    },
  ];

  return (
    <div className="space-y-3">
      <Section>
        <div className="flex items-center gap-3">
          <Ring score={zone.score} size={84} />
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">
              {t("explain.compositeReadiness")}
            </div>
            <div className="mt-1">
              <Chip color={band.color}>{band.label}</Chip>
            </div>
            {rank > 0 && (
              <p className="text-[10.5px] text-ink-3 mt-1.5 tabular-nums">
                {t("explain.rank", { rank, total: sorted.length })}
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section title={t("explain.whatIndex")}>
        <p className="text-[11px] text-ink-2 leading-[1.6]">
          Navuuna publishes one 0–100 service-performance score per Nairobi sub-county, built from
          the pillars below. Each pillar is a single measured quantity with a named public source
          and a stated vintage.
        </p>
        <p className="mt-2 text-[10.5px] text-ink-3 leading-[1.6]">
          Nothing here is modelled down from a county or utility figure. A sub-county with no
          reading for a pillar shows a gap rather than a number.
        </p>
      </Section>

      <Section title={t("explain.howComputed")}>
        <div className="space-y-1.5">
          {PILLARS.map((p) => {
            const key = p.key as PillarKey;
            const color = PILLAR_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => onNavigate({ type: "pillar", key })}
                className="group w-full flex items-center gap-2 text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border px-2 py-1.5 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: color, boxShadow: `0 0 6px ${color}44` }}
                >
                  {PILLAR_GLYPHS[key]}
                </div>
                <span className="flex-1 min-w-0 text-[10.5px] text-ink-2 font-medium truncate">
                  {p.displayName}
                </span>
                <span
                  className="text-[12px] font-semibold tabular-nums shrink-0"
                  style={{ color: zone.pillars[key] === null ? BRAND.inkSoft : color }}
                >
                  {formatScore(zone.pillars[key])}
                </span>
                <ChevronRight
                  size={12}
                  className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors"
                />
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[9.5px] text-ink-4 leading-[1.5]">
          The composite is a weighted average of these pillars, with gaps excluded from both the
          numerator and the divisor. The weights are published in the methodology, not withheld.
        </p>
      </Section>

      <Section title={t("explain.bands")}>
        <div className="space-y-1.5">
          {BANDS.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-[10.5px]">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: b.color }} />
              <span className="w-14 tabular-nums text-ink-3 shrink-0">{b.range}</span>
              <span className="font-semibold w-16 shrink-0" style={{ color: b.color }}>
                {b.label}
              </span>
              <span className="text-ink-4 min-w-0">{b.note}</span>
            </div>
          ))}
        </div>
      </Section>

      <PillarProvenancePanel zone={zone} showAttribution />

      <Section title={t("explain.dataPipeline")}>
        <p className="text-[10.5px] text-ink-3 leading-[1.6]">
          Scores refresh as the KNBS, WASREB, HOT OSM and Digital Matatus extracts land. {zone.name}{" "}
          last synced <span className="text-ink-2 font-medium">{zone.lastSyncMin} min ago</span>.
          Every reading traces back to a named public source.
        </p>
      </Section>
    </div>
  );
}

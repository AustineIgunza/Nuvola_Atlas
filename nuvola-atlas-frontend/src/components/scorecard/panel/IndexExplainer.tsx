import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { api } from "@/api";
import { BRAND, PILLAR_COLORS, PILLAR_GLYPHS } from "@/lib/scoreColor";
import Ring from "../Ring";
import DaystarIndicatorPanel from "./DaystarIndicatorPanel";
import { Section, Chip, scoreBand } from "./bits";
import { byScoreDesc, formatScore, isScored } from "@/lib/scores";
import { useT } from "@/lib/i18n/use-t";
import type { PanelView } from "./panel-types";
import type { Zone, PillarKey } from "@/types";

const PILLAR_KEYS: PillarKey[] = ["social", "safety", "density", "infra"];

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
          The UE Vitality Index turns fused infrastructure and social data into a single 0–100
          readiness score for each sub-county — how ready a locality is to absorb, operate, and
          sustain new infrastructure.
        </p>
        <p className="mt-2 text-[10.5px] text-ink-3 leading-[1.6]">
          It is grounded in Amartya Sen&apos;s <em>Development as Freedom</em>: readiness is the
          expansion of real freedoms — economic opportunity, safety, social wellbeing, and
          environmental security — not infrastructure counts alone.
        </p>
      </Section>

      <Section title={t("explain.howComputed")}>
        <div className="space-y-1.5">
          {PILLAR_KEYS.map((key) => {
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
                  {t(`pillar.${key}.long` as const)}
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
          The four pillars combine into the composite readiness score; each pillar synthesizes
          sub-metrics from live public feeds. The composite methodology is proprietary — pillar
          definitions and data sources are open.
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

      <DaystarIndicatorPanel zoneId={zone.id} showAttribution />

      <Section title={t("explain.dataPipeline")}>
        <p className="text-[10.5px] text-ink-3 leading-[1.6]">
          Scores refresh as KNBS, KURA, KPLC, NPS, and NEMA feeds sync into the Atlas. {zone.name}{" "}
          last synced <span className="text-ink-2 font-medium">{zone.lastSyncMin} min ago</span>.
          Every reading traces back to a named public source — the Ground Truth ledger.
        </p>
      </Section>
    </div>
  );
}

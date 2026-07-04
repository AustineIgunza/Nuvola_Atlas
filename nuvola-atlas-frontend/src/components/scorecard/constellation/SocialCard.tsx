import { Droplets } from "lucide-react";
import { cn } from "@/lib/cn";
import { BRAND, PILLAR_COLORS } from "@/lib/scoreColor";
import { waterProfile } from "@/lib/waterSanitation";
import SubMetricList from "./SubMetricList";
import ActivityFeed from "../ActivityFeed";
import type { Zone } from "@/types";

interface Props {
  zone: Zone;
}

export default function SocialCard({ zone }: Props) {
  const wp = waterProfile(zone);
  const delta = zone.deltas.social;
  const accent = wp.opportunity ? BRAND.teal : BRAND.steel;

  const sources = [
    { source: "KNBS Population", fresh: true, age: "2 days" },
    { source: "KURA Road Status", fresh: true, age: "4 hours" },
    { source: "KPLC Energy Feed", fresh: zone.lastSyncMin < 15, age: `${zone.lastSyncMin} min` },
    { source: "NPS Safety Data", fresh: true, age: "1 week" },
    { source: "NEMA ESIA Portal", fresh: true, age: "3 days" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span
          className="text-[26px] font-semibold tabular-nums leading-none"
          style={{ color: PILLAR_COLORS.social }}
        >
          {zone.pillars.social}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium tabular-nums",
            delta >= 0 ? "text-success" : "text-danger",
          )}
        >
          {delta >= 0 ? "+" : ""}{delta} qtr
        </span>
        <span className="ml-auto text-[10px] text-ink-4">Wellbeing pillar</span>
      </div>

      {/* Reimagining Water Futures — the SDG 6 solution read for this zone */}
      <div
        className="rounded-card border p-2.5"
        style={{ background: `${accent}0F`, borderColor: `${accent}33` }}
      >
        <div className="flex items-center gap-1.5">
          <Droplets size={12} style={{ color: BRAND.teal }} className="shrink-0" />
          <span className="text-[9.5px] font-semibold text-ink-2 uppercase tracking-[0.08em]">
            Water &amp; Sanitation · SDG 6
          </span>
          <span
            className="ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: `${accent}1A`, color: accent }}
          >
            {wp.contextLabel}
          </span>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
          {[
            { v: `${wp.accessPct}%`, l: "Safe access" },
            { v: `${wp.sharedPointPct}%`, l: "Shared points" },
            { v: `${wp.waitMin} min`, l: "Median queue" },
          ].map((s) => (
            <div key={s.l} className="rounded-control bg-[rgba(255,255,255,0.04)] py-1.5 px-1">
              <div className="text-[12px] font-semibold tabular-nums text-ink-1">{s.v}</div>
              <div className="text-[8.5px] text-ink-4 uppercase tracking-[0.05em]">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-2">
          <div className="text-[10px] font-semibold" style={{ color: accent }}>
            {wp.opportunity ? "◈ Decentralized sanitation opportunity" : "◈ Sewerage viable here"}
          </div>
          <div className="mt-1">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: accent, color: BRAND.bone }}
            >
              {wp.solutionTag}
            </span>
          </div>
          <p className="mt-1.5 text-[10.5px] text-ink-2 leading-[1.5]">{wp.solution}</p>
          <p className="mt-1 text-[9.5px] text-ink-4 leading-[1.45]">{wp.rationale}</p>
        </div>
      </div>

      <SubMetricList pillarKey="social" />

      <ActivityFeed zoneId={zone.id} />

      <div className="rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-2.5">
        <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.08em] mb-2">
          Data Sources
        </div>
        <div className="space-y-1.5">
          {sources.map((d) => (
            <div key={d.source} className="flex items-center justify-between text-[10.5px]">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: d.fresh ? BRAND.teal : BRAND.rose,
                    boxShadow: d.fresh
                      ? "0 0 6px rgba(31,138,120,0.5)"
                      : "0 0 6px rgba(211,64,46,0.5)",
                  }}
                />
                <span className="text-ink-3">{d.source}</span>
              </div>
              <span className={d.fresh ? "text-ink-4" : "text-danger font-medium"}>{d.age}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

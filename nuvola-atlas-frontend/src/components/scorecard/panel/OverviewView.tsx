import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Droplets, Info } from "lucide-react";
import { api } from "@/api";
import { BRAND } from "@/lib/scoreColor";
import { waterProfile } from "@/lib/waterSanitation";
import { formatRelative } from "@/lib/format";
import Ring from "../Ring";
import PillarBar from "../PillarBar";
import ZoneRanking from "../ZoneRanking";
import ActivityFeed from "../ActivityFeed";
import ScoreHistoryChart from "./ScoreHistoryChart";
import { Section, Chip, StatCell, SEVERITY_COLOR, IMPACT_COLOR, STATUS_STYLE } from "./bits";
import type { PanelView } from "./panel-types";
import type { Zone, PillarKey } from "@/types";

const PILLAR_KEYS: PillarKey[] = ["social", "safety", "density", "infra"];

interface Props {
  zone: Zone;
  onNavigate: (view: PanelView) => void;
}

export default function OverviewView({ zone, onNavigate }: Props) {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });

  const zoneProjects = (projects ?? []).filter((p) => p.zoneId === zone.id);
  const zoneAlerts = (alerts ?? []).filter((a) => a.zoneId === zone.id);
  const wp = waterProfile(zone);
  const waterAccent = wp.opportunity ? BRAND.teal : BRAND.steel;

  const totalDelta = Math.round(
    (zone.deltas.social + zone.deltas.safety + zone.deltas.density + zone.deltas.infra) / 4,
  );

  const sources = [
    { source: "KNBS Population", fresh: true, age: "2 days" },
    { source: "KURA Road Status", fresh: true, age: "4 hours" },
    { source: "KPLC Energy Feed", fresh: zone.lastSyncMin < 15, age: `${zone.lastSyncMin} min` },
    { source: "NPS Safety Data", fresh: true, age: "1 week" },
    { source: "NEMA ESIA Portal", fresh: true, age: "3 days" },
  ];

  const handleExport = useCallback(() => {
    if (exporting) return;
    setExporting(true);
    const content = [
      `NAVUUNA ATLAS — Zone Report`,
      `Zone: ${zone.name}`,
      `Vitality Score: ${zone.score}/100`,
      ``,
      `Pillar Scores:`,
      `  Social Wellbeing: ${zone.pillars.social}`,
      `  Safety & Security: ${zone.pillars.safety}`,
      `  Density & Scaling: ${zone.pillars.density}`,
      `  Infrastructure & Environmental: ${zone.pillars.infra}`,
      ``,
      `Water & Sanitation (SDG 6): ${wp.contextLabel}`,
      `  Safe access: ${wp.accessPct}% · Shared points: ${wp.sharedPointPct}% · Queue: ${wp.waitMin} min`,
      `  Recommended: ${wp.solutionTag}`,
      ``,
      `Generated: ${new Date().toLocaleString()}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${zone.id}-vitality-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }, [zone, wp, exporting]);

  return (
    <div className="space-y-3">
      {/* Hero — composite score; opens the index methodology explainer */}
      <button
        onClick={() => onNavigate({ type: "index" })}
        className="group w-full text-left rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Ring score={zone.score} size={76} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">
              UE Vitality Index
            </div>
            <div
              className="mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: totalDelta >= 0 ? "rgba(31,138,120,0.12)" : "rgba(211,64,46,0.12)",
                color: totalDelta >= 0 ? BRAND.teal : BRAND.rose,
              }}
            >
              {totalDelta >= 0 ? "▲" : "▼"} {Math.abs(totalDelta)} pts this quarter
            </div>
            <p className="text-[10px] text-ink-4 mt-1">Last sync {zone.lastSyncMin} min ago</p>
          </div>
          <ChevronRight size={14} className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors" />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-4">
          <Info size={10} className="shrink-0" />
          How this score is computed
        </div>
      </button>

      {/* Score history — trend over selected range */}
      <ScoreHistoryChart zoneId={zone.id} />

      {/* Pillars — each row drills into the pillar explainer */}
      <Section title="Pillars — tap to expand" className="px-1.5 py-1">
        {PILLAR_KEYS.map((key, i) => (
          <button
            key={key}
            onClick={() => onNavigate({ type: "pillar", key })}
            className="group w-full flex items-center gap-1 text-left rounded-control px-1.5 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <PillarBar pillarKey={key} score={zone.pillars[key]} delta={zone.deltas[key]} index={i} />
            </div>
            <ChevronRight size={13} className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors" />
          </button>
        ))}
      </Section>

      {/* Water & Sanitation — part of the vitality read; opens the SDG 6 explainer */}
      <button
        onClick={() => onNavigate({ type: "water" })}
        className="group w-full text-left rounded-card border p-2.5 transition-colors hover:brightness-110"
        style={{ background: `${waterAccent}0F`, borderColor: `${waterAccent}33` }}
      >
        <div className="flex items-center gap-1.5">
          <Droplets size={12} style={{ color: BRAND.teal }} className="shrink-0" />
          <span className="text-[9.5px] font-semibold text-ink-2 uppercase tracking-[0.08em]">
            Water &amp; Sanitation · SDG 6
          </span>
          <span className="ml-auto shrink-0">
            <Chip color={waterAccent}>{wp.contextLabel}</Chip>
          </span>
          <ChevronRight size={13} className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <StatCell value={`${wp.accessPct}%`} label="Safe access" />
          <StatCell value={`${wp.sharedPointPct}%`} label="Shared points" />
          <StatCell value={`${wp.waitMin} min`} label="Median queue" />
        </div>
        <div className="mt-2 flex items-center gap-1.5 min-w-0">
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: waterAccent, color: BRAND.bone }}
          >
            {wp.solutionTag}
          </span>
          <span className="text-[10px] truncate" style={{ color: waterAccent }}>
            {wp.opportunity ? "Decentralized sanitation opportunity" : "Sewerage viable here"}
          </span>
        </div>
      </button>

      {/* Infrastructure projects — each row drills into the project explainer */}
      <Section
        title={`Infrastructure · ${zoneProjects.length} ${zoneProjects.length === 1 ? "project" : "projects"}`}
        action={
          <button
            onClick={() => navigate("/infrastructure")}
            className="text-[10px] text-ink-4 hover:text-ink-2 transition-colors"
          >
            View all →
          </button>
        }
      >
        {zoneProjects.length > 0 ? (
          <div className="space-y-1.5">
            {zoneProjects.map((p) => {
              const st = STATUS_STYLE[p.status];
              const barColor = p.status === "stalled" ? BRAND.rose : BRAND.terracotta;
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate({ type: "project", id: p.id })}
                  className="group w-full text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border p-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 text-[11px] font-medium text-ink-1 truncate">
                      {p.name}
                    </div>
                    <Chip color={st.color}>{st.label}</Chip>
                    <ChevronRight size={12} className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors" />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-[3px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p.progress}%`, background: barColor, boxShadow: `0 0 4px ${barColor}55` }}
                      />
                    </div>
                    <span className="text-[10.5px] font-semibold tabular-nums shrink-0" style={{ color: barColor }}>
                      {p.progress}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[10.5px] text-ink-4 leading-[1.5]">
            No tracked infrastructure projects in {zone.name} yet — new KURA / KPLC / KeNHA works
            will appear here as they are ingested.
          </p>
        )}
      </Section>

      {/* Alerts — each row drills into the alert explainer */}
      <Section
        title={`Active alerts · ${zoneAlerts.length}`}
        action={
          <button
            onClick={() => navigate("/alerts")}
            className="text-[10px] text-ink-4 hover:text-ink-2 transition-colors"
          >
            View all →
          </button>
        }
      >
        {zoneAlerts.length > 0 ? (
          <div className="space-y-1.5">
            {zoneAlerts.map((a) => {
              const color = SEVERITY_COLOR[a.severity];
              return (
                <button
                  key={a.id}
                  onClick={() => onNavigate({ type: "alert", id: a.id })}
                  className="group w-full text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border p-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                >
                  <div className="flex items-start gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-ink-2 font-medium leading-snug">{a.title}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-ink-4">
                        <span className="capitalize">
                          <Chip color={IMPACT_COLOR[a.impactLevel] ?? BRAND.steel}>{a.impactLevel}</Chip>
                        </span>
                        <span>{formatRelative(a.createdAt)}</span>
                      </div>
                    </div>
                    <ChevronRight size={12} className="shrink-0 mt-0.5 text-ink-4 group-hover:text-ink-2 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[10.5px] text-ink-4 leading-[1.5]">
            No active alerts for this zone — monitoring feeds are quiet.
          </p>
        )}
      </Section>

      <ZoneRanking currentZone={zone} />

      <Section>
        <ActivityFeed zoneId={zone.id} />
      </Section>

      {/* Data source freshness */}
      <Section title="Data Sources">
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
      </Section>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/reports?zone=${zone.id}`)}
          className="flex-1 h-8 rounded-control bg-accent text-white text-[11px] font-medium hover:brightness-110 transition-all btn-glow"
        >
          Open full report
        </button>
        <button
          onClick={handleExport}
          className="flex-1 h-8 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-2 text-[11px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          {exporting ? "Exporting…" : "Export summary"}
        </button>
      </div>
    </div>
  );
}

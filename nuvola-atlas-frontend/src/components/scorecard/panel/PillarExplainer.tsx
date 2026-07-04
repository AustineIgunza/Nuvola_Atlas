import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Droplets } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { BRAND, PILLAR_COLORS, PILLAR_LABELS } from "@/lib/scoreColor";
import { waterProfile } from "@/lib/waterSanitation";
import { formatRelative } from "@/lib/format";
import ActivityFeed from "../ActivityFeed";
import { SUB_METRICS, TREND_ICON, scoreLabel } from "../pillar-data";
import { Section, Chip, LayerHintButton, SEVERITY_COLOR, STATUS_STYLE, scoreBand } from "./bits";
import type { PanelView } from "./panel-types";
import type { Zone, PillarKey } from "@/types";

const TREND_TEXT: Record<string, string> = {
  up: "improving this quarter",
  down: "declining this quarter",
  stable: "holding steady this quarter",
};

/** Which Atlas layer best visualizes each pillar. */
const PILLAR_LAYER: Record<PillarKey, { layer: "water" | "safety" | "density" | "roads"; label: string }> = {
  social: { layer: "water", label: "Water & Sanitation" },
  safety: { layer: "safety", label: "Safety & Security" },
  density: { layer: "density", label: "Density" },
  infra: { layer: "roads", label: "Road Progress" },
};

interface Props {
  zone: Zone;
  pillarKey: PillarKey;
  onNavigate: (view: PanelView) => void;
}

export default function PillarExplainer({ zone, pillarKey, onNavigate }: Props) {
  const color = PILLAR_COLORS[pillarKey];
  const score = zone.pillars[pillarKey];
  const delta = zone.deltas[pillarKey];
  const band = scoreBand(score);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const { data: methodology } = useQuery({ queryKey: ["methodology"], queryFn: api.getMethodology });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });

  const pillarDef = methodology?.pillars.find((p) => p.key === pillarKey);
  const zoneProjects = (projects ?? []).filter((p) => p.zoneId === zone.id);
  const zoneAlerts = (alerts ?? []).filter((a) => a.zoneId === zone.id);
  const wp = waterProfile(zone);

  return (
    <div className="space-y-3">
      {/* Zone reading for this pillar */}
      <Section>
        <div className="flex items-center gap-2.5">
          <span className="text-[30px] font-semibold tabular-nums leading-none" style={{ color }}>
            {score}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium tabular-nums",
              delta >= 0 ? "text-success" : "text-danger",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {delta} qtr
          </span>
          <span className="ml-auto">
            <Chip color={band.color}>{band.label}</Chip>
          </span>
        </div>
        <div className="mt-2 h-[4px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        {pillarDef && (
          <p className="mt-2.5 text-[11px] text-ink-2 leading-[1.6]">{pillarDef.description}</p>
        )}
      </Section>

      {/* Sub-metrics — accordion rows, each expands into a full explainer */}
      <Section title="Sub-metrics — tap to expand">
        <div className="space-y-1.5">
          {SUB_METRICS[pillarKey].map((sm, i) => {
            const trend = TREND_ICON[sm.trend];
            const sl = scoreLabel(sm.score);
            const open = openIdx === i;
            const methodDesc = pillarDef?.subMetrics[i]?.description;
            return (
              <div
                key={sm.label}
                className={cn(
                  "rounded-control border transition-colors",
                  open
                    ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.14)]"
                    : "bg-[rgba(255,255,255,0.02)] border-border",
                )}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-1.5 text-left px-2 py-2"
                >
                  <span style={{ color: trend.color }} className="text-[8px] shrink-0">
                    {trend.char}
                  </span>
                  <span className="flex-1 min-w-0 text-[11px] text-ink-2 font-medium truncate">
                    {sm.label}
                  </span>
                  <span className="text-[9px] text-ink-4 shrink-0">
                    ({Math.round(sm.weight * 100)}%)
                  </span>
                  <span className="text-[11.5px] font-semibold tabular-nums shrink-0" style={{ color }}>
                    {sm.score}
                  </span>
                  <Chip color={sl.color}>{sl.text}</Chip>
                  <ChevronDown
                    size={12}
                    className={cn("shrink-0 text-ink-4 transition-transform", open && "rotate-180")}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 pb-2.5 space-y-1.5">
                        <div className="h-[2px] rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${sm.score}%`, background: color, opacity: 0.7 }}
                          />
                        </div>
                        <p className="text-[10.5px] text-ink-2 leading-[1.55]">
                          {methodDesc ?? sm.detail}
                        </p>
                        <p className="text-[10px] text-ink-4 leading-[1.5]">
                          Carries{" "}
                          <span className="text-ink-3 font-medium">
                            {Math.round(sm.weight * 100)}%
                          </span>{" "}
                          of the pillar score · reading{" "}
                          <span className="font-medium" style={{ color: sl.color }}>
                            {sm.score} — {sl.text.toLowerCase()}
                          </span>
                          , {TREND_TEXT[sm.trend]}.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[9px] text-ink-4 leading-[1.5]">
          Sub-metric readings are county-wide composites; zone-level ingestion is on the pilot
          roadmap.
        </p>
      </Section>

      {/* Pillar-specific evidence from this zone */}
      {pillarKey === "social" && (
        <>
          <button
            onClick={() => onNavigate({ type: "water" })}
            className="group w-full flex items-center gap-2 text-left rounded-card border p-2.5 transition-colors hover:brightness-110"
            style={{ background: `${BRAND.teal}0F`, borderColor: `${BRAND.teal}33` }}
          >
            <Droplets size={13} style={{ color: BRAND.teal }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10.5px] font-semibold text-ink-1">
                Water &amp; Sanitation · SDG 6
              </div>
              <div className="text-[9.5px] text-ink-4 truncate">
                {wp.accessPct}% safe access · {wp.contextLabel}
              </div>
            </div>
            <ChevronRight size={12} className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors" />
          </button>
          <Section>
            <ActivityFeed zoneId={zone.id} />
          </Section>
        </>
      )}

      {pillarKey === "safety" && (
        <Section title={`Zone alerts · ${zoneAlerts.length}`}>
          {zoneAlerts.length > 0 ? (
            <div className="space-y-1.5">
              {zoneAlerts.map((a) => {
                const c = SEVERITY_COLOR[a.severity];
                return (
                  <button
                    key={a.id}
                    onClick={() => onNavigate({ type: "alert", id: a.id })}
                    className="group w-full flex items-start gap-1.5 text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border p-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ background: c, boxShadow: `0 0 6px ${c}66` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10.5px] text-ink-2 font-medium leading-snug">{a.title}</div>
                      <div className="text-[9.5px] text-ink-4 mt-0.5">{formatRelative(a.createdAt)}</div>
                    </div>
                    <ChevronRight size={12} className="shrink-0 mt-0.5 text-ink-4 group-hover:text-ink-2 transition-colors" />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[10.5px] text-ink-4 leading-[1.5]">
              No active alerts — monitoring feeds for this zone are quiet.
            </p>
          )}
        </Section>
      )}

      {pillarKey === "infra" && (
        <Section title={`Zone projects · ${zoneProjects.length}`}>
          {zoneProjects.length > 0 ? (
            <div className="space-y-1.5">
              {zoneProjects.map((p) => {
                const st = STATUS_STYLE[p.status];
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate({ type: "project", id: p.id })}
                    className="group w-full flex items-center gap-2 text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border p-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                  >
                    <div className="flex-1 min-w-0 text-[10.5px] font-medium text-ink-1 truncate">
                      {p.name}
                    </div>
                    <Chip color={st.color}>{st.label}</Chip>
                    <span className="text-[10.5px] font-semibold tabular-nums shrink-0 text-ink-3">
                      {p.progress}%
                    </span>
                    <ChevronRight size={12} className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors" />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[10.5px] text-ink-4 leading-[1.5]">
              No tracked projects in this zone yet — ESIA filings and new works will appear here.
            </p>
          )}
        </Section>
      )}

      {pillarKey === "density" && (
        <Section title="Reading density">
          <p className="text-[10.5px] text-ink-3 leading-[1.6]">
            Density can power growth or strangle it. A low Optimal Density Ratio flags
            over-saturation — high land costs, congested corridors, and regulatory gridlock — while
            the Urban Friction Index tracks how hard it is to actually move heavy equipment through
            the zone.
          </p>
        </Section>
      )}

      <LayerHintButton layer={PILLAR_LAYER[pillarKey].layer} label={PILLAR_LAYER[pillarKey].label} />
    </div>
  );
}

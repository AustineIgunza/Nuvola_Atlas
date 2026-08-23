import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Droplets } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { BRAND, PILLAR_COLORS } from "@/lib/scoreColor";
import { PILLARS_BY_KEY } from "@/lib/pillars.generated";
import { waterProfile } from "@/lib/waterSanitation";
import { NO_SCORE_LABEL } from "@/lib/scores";
import { formatRelative } from "@/lib/format";
import ActivityFeed from "../ActivityFeed";
import { Section, Chip, LayerHintButton, SEVERITY_COLOR, STATUS_STYLE, scoreBand } from "./bits";
import type { PanelView } from "./panel-types";
import type { Zone, PillarKey } from "@/types";

/** Which Atlas layer best visualizes each pillar. */
const PILLAR_LAYER: Record<PillarKey, { layer: "water" | "roads" | "energy"; label: string }> = {
  water_sanitation: { layer: "water", label: "Water & Sanitation" },
  road_density: { layer: "roads", label: "Road Density" },
  transit_access: { layer: "roads", label: "Road Density" },
  electricity_access: { layer: "energy", label: "Electricity Access" },
};

interface Props {
  zone: Zone;
  pillarKey: PillarKey;
  onNavigate: (view: PanelView) => void;
}

export default function PillarExplainer({ zone, pillarKey, onNavigate }: Props) {
  const def = PILLARS_BY_KEY[pillarKey];
  const color = PILLAR_COLORS[pillarKey];
  const score = zone.pillars[pillarKey];
  const delta = zone.deltas[pillarKey];
  const band = scoreBand(score);

  const { data: methodology } = useQuery({
    queryKey: ["methodology"],
    queryFn: api.getMethodology,
  });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });

  const weight = methodology?.weights[pillarKey] ?? def.weight;
  const zoneProjects = (projects ?? []).filter((p) => p.zoneId === zone.id);
  const zoneAlerts = (alerts ?? []).filter((a) => a.zoneId === zone.id);
  const wp = waterProfile(zone);

  return (
    <div className="space-y-3">
      {/* Zone reading for this pillar */}
      <Section>
        <div className="flex items-center gap-2.5">
          <span
            className="text-[30px] font-semibold tabular-nums leading-none"
            style={{ color: score === null ? "rgba(255,255,255,0.35)" : color }}
          >
            {score === null ? NO_SCORE_LABEL : score}
          </span>
          {score === null || delta === null || zone.deltaWindowDays === null ? (
            <span className="text-[10px] font-medium text-ink-4">no trend yet</span>
          ) : (
            <span
              className={cn(
                "text-[10px] font-medium tabular-nums",
                delta >= 0 ? "text-success" : "text-danger",
              )}
            >
              {delta >= 0 ? "+" : ""}
              {delta} / {zone.deltaWindowDays}d
            </span>
          )}
          <span className="ml-auto">
            <Chip color={band.color}>{band.label}</Chip>
          </span>
        </div>
        <div className="mt-2 h-[4px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          {/* No fill for a pillar with no reading — the empty track carries
              the message honestly, a 0%-width bar does not. */}
          {score !== null && (
            <motion.div
              className="h-full rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          )}
        </div>
        {def.description && (
          <p className="mt-2.5 text-[11px] text-ink-2 leading-[1.6]">{def.description}</p>
        )}
      </Section>

      <Section title="Where this number comes from">
        <dl className="space-y-1.5 text-[10.5px]">
          <ProvenanceRow label="Source" value={def.sourceId ?? "—"} />
          <ProvenanceRow label="Vintage" value={def.vintage ?? "—"} />
          <ProvenanceRow label="Collected at" value={def.granularity ?? "—"} />
          <ProvenanceRow
            label="Weight in score"
            value={weight === 0 ? "0 — held, not scored" : weight.toFixed(2)}
          />
        </dl>
        {def.status === "held" && (
          <p className="mt-2 text-[10px] text-ink-4 leading-[1.55]">
            Held: the reading is published with its vintage attached but carries no weight in the
            composite until a fresher source lands.
          </p>
        )}
        {score === null && (
          <p className="mt-2 text-[10px] text-ink-4 leading-[1.55]">
            No reading for this sub-county. The gap is left blank rather than filled from a county
            or utility figure.
          </p>
        )}
      </Section>

      {/* Pillar-specific evidence from this zone */}
      {pillarKey === "water_sanitation" && (
        <>
          {wp && (
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
                  {wp.needPct}/100 unmet need · {wp.contextLabel}
                </div>
              </div>
              <ChevronRight
                size={12}
                className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors"
              />
            </button>
          )}
          <Section>
            <ActivityFeed zoneId={zone.id} />
          </Section>
        </>
      )}

      {pillarKey === "road_density" && (
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
                    <ChevronRight
                      size={12}
                      className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors"
                    />
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

      {zoneAlerts.length > 0 && (
        <Section title={`Zone alerts · ${zoneAlerts.length}`}>
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
                    <div className="text-[10.5px] text-ink-2 font-medium leading-snug">
                      {a.title}
                    </div>
                    <div className="text-[9.5px] text-ink-4 mt-0.5">
                      {formatRelative(a.createdAt)}
                    </div>
                  </div>
                  <ChevronRight
                    size={12}
                    className="shrink-0 mt-0.5 text-ink-4 group-hover:text-ink-2 transition-colors"
                  />
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <LayerHintButton layer={PILLAR_LAYER[pillarKey].layer} label={PILLAR_LAYER[pillarKey].label} />
    </div>
  );
}

function ProvenanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-24 shrink-0 text-ink-4">{label}</dt>
      <dd className="min-w-0 text-ink-2">{value}</dd>
    </div>
  );
}

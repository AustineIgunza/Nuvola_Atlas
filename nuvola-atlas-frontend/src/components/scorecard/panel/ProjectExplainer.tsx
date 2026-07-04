import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ChevronRight, ExternalLink } from "lucide-react";
import { api } from "@/api";
import { BRAND } from "@/lib/scoreColor";
import { formatDate, formatRelative } from "@/lib/format";
import Timeline from "@/components/infra/Timeline";
import { Section, Chip, StatCell, SEVERITY_COLOR, STATUS_STYLE, LayerHintButton } from "./bits";
import type { PanelView } from "./panel-types";
import type { InfraType } from "@/types";

const TYPE_LABEL: Record<InfraType, string> = {
  road: "Road works",
  energy: "Energy",
  grid: "Smart grid",
};

interface Props {
  projectId: string;
  onNavigate: (view: PanelView) => void;
}

export default function ProjectExplainer({ projectId, onNavigate }: Props) {
  const navigate = useNavigate();
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });

  const p = projects?.find((x) => x.id === projectId);
  if (!p) {
    return (
      <Section>
        <p className="text-[10.5px] text-ink-4">Project not found — it may have been archived.</p>
      </Section>
    );
  }

  const st = STATUS_STYLE[p.status];
  const barColor = p.status === "stalled" ? BRAND.rose : BRAND.terracotta;
  const doneCount = p.milestones.filter((m) => m.done).length;
  const nextMilestone = p.milestones.find((m) => !m.done);
  const relatedAlerts = (alerts ?? []).filter((a) => a.relatedProjectIds.includes(p.id));

  return (
    <div className="space-y-3">
      {/* Identity */}
      <Section>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Chip color={st.color}>{st.label}</Chip>
          <Chip color={BRAND.steel}>{TYPE_LABEL[p.type]}</Chip>
          <Chip color={BRAND.gold}>{p.agency}</Chip>
        </div>
        <h3 className="mt-2 text-[14px] font-semibold text-ink-1 leading-snug">{p.name}</h3>
        {p.status === "stalled" && (
          <p className="mt-1.5 text-[10px] leading-[1.5]" style={{ color: BRAND.rose }}>
            Delivery has stalled — see related alerts below for the blocking issues.
          </p>
        )}
      </Section>

      {/* Progress */}
      <Section title="Delivery progress">
        <div className="flex items-baseline gap-2">
          <span className="text-[26px] font-semibold tabular-nums leading-none" style={{ color: barColor }}>
            {p.progress}%
          </span>
          <span className="text-[10px] text-ink-4">
            {doneCount} of {p.milestones.length} milestones complete
          </span>
        </div>
        <div className="mt-2 h-[5px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor, boxShadow: `0 0 6px ${barColor}55` }}
            initial={{ width: 0 }}
            animate={{ width: `${p.progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        {nextMilestone && (
          <p className="mt-2 text-[10px] text-ink-4 leading-[1.5]">
            Next milestone:{" "}
            <span className="text-ink-2 font-medium">{nextMilestone.label}</span> — due{" "}
            <span className="tabular-nums text-ink-3">{formatDate(nextMilestone.date)}</span>
          </p>
        )}
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <StatCell value={p.budget.replace("KES ", "")} label="Budget (KES)" />
          <StatCell value={format(new Date(p.started), "MMM yyyy")} label="Started" />
          <StatCell value={format(new Date(p.eta), "MMM yyyy")} label="ETA" />
        </div>
      </Section>

      {/* Milestones */}
      <Section title="Milestone timeline">
        <Timeline milestones={p.milestones} />
      </Section>

      {/* Related alerts */}
      {relatedAlerts.length > 0 && (
        <Section title={`Related alerts · ${relatedAlerts.length}`}>
          <div className="space-y-1.5">
            {relatedAlerts.map((a) => {
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
        </Section>
      )}

      <LayerHintButton layer="momentum" label="Project Momentum" />

      <button
        onClick={() => navigate("/infrastructure")}
        className="w-full h-8 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-[10.5px] font-medium text-ink-3 hover:bg-[rgba(255,255,255,0.08)] transition-colors flex items-center justify-center gap-1.5"
      >
        <ExternalLink size={11} className="shrink-0" />
        Open in Infrastructure
      </button>
    </div>
  );
}

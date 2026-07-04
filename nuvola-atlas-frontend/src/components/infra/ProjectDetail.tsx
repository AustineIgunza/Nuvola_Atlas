import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, MapPin, BellRing } from "lucide-react";
import { api } from "@/api";
import { formatDate, formatRelative } from "@/lib/format";
import { springSettle } from "@/lib/motion";
import { BRAND } from "@/lib/scoreColor";
import { SEVERITY_COLORS } from "@/components/alerts/alerts.constants";
import Timeline from "./Timeline";
import type { Project } from "@/types";

const TYPE_COLORS: Record<string, string> = { road: "#C0552B", energy: "#E0A82E", grid: "#1F8A78" };

const STATUS_STYLE: Record<Project["status"], { color: string; label: string }> = {
  active: { color: BRAND.teal, label: "Active" },
  stalled: { color: BRAND.rose, label: "Stalled" },
  planned: { color: BRAND.steel, label: "Planned" },
};

interface Props {
  project: Project;
}

export default function ProjectDetail({ project }: Props) {
  const navigate = useNavigate();
  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });
  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const zoneName = zones?.find((z) => z.id === project.zoneId)?.name ?? project.zoneId;

  const status = STATUS_STYLE[project.status];
  const milestonesDone = project.milestones.filter((m) => m.done).length;
  const linkedAlerts = alerts?.filter((a) => a.relatedProjectIds.includes(project.id)) ?? [];

  const kvItems = [
    { label: "Budget", value: project.budget },
    { label: "Progress", value: `${project.progress}%` },
    { label: "ETA", value: formatDate(project.eta) },
    { label: "Milestones", value: `${milestonesDone} of ${project.milestones.length}` },
  ];

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSettle}
      className="p-5 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, ...springSettle }}
        className="flex items-center gap-2 mb-3 flex-wrap"
      >
        <span
          className="px-2 py-0.5 rounded-chip text-[10px] font-semibold uppercase text-white"
          style={{ background: TYPE_COLORS[project.type] }}
        >
          {project.type}
        </span>
        <span
          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: `${status.color}1A`, color: status.color }}
        >
          {status.label}
        </span>
        <span className="text-[12px] text-ink-4">{project.agency}</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, ...springSettle }}
        className="text-[22px] font-semibold tracking-[-0.02em] text-ink-1 mb-1"
      >
        {project.name}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="text-[12px] text-ink-4 mb-6"
      >
        {zoneName} · started {formatDate(project.started)}
      </motion.p>

      {/* KV grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {kvItems.map((kv, i) => (
          <motion.div
            key={kv.label}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, ...springSettle }}
            whileHover={{ scale: 1.02 }}
            className="glass rounded-control p-3.5"
          >
            <div className="text-[10px] text-ink-4 uppercase tracking-[0.06em] mb-1">{kv.label}</div>
            <div className="text-[16px] font-semibold text-ink-1 tabular-nums">{kv.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-ink-3 font-medium">Progress</span>
          <span className="text-ink-1 font-semibold tabular-nums">{project.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: project.status === "stalled" ? BRAND.rose : TYPE_COLORS[project.type] }}
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>
      </motion.div>

      {/* Stalled warning */}
      {project.status === "stalled" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mb-6 rounded-card p-3.5 flex items-start gap-2.5"
          style={{ background: `${BRAND.rose}0F`, border: `1px solid ${BRAND.rose}33` }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: BRAND.rose }} />
          <p className="text-[12px] leading-relaxed text-ink-2">
            Delivery is flagged as stalled — field verification is pending. The milestones below
            reflect the last confirmed on-the-ground status.
          </p>
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6"
      >
        <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] mb-4">Milestones</div>
        <Timeline milestones={project.milestones} />
      </motion.div>

      {/* Linked alerts */}
      {linkedAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] mb-2.5 flex items-center gap-1.5">
            <BellRing size={12} />
            Linked alerts
          </div>
          <div className="space-y-1.5">
            {linkedAlerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2.5 rounded-control bg-[rgba(255,255,255,0.02)] border border-border/40 px-3 py-2.5"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1"
                  style={{ background: SEVERITY_COLORS[a.severity], boxShadow: `0 0 6px ${SEVERITY_COLORS[a.severity]}66` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-ink-1 leading-snug">{a.title}</div>
                  <div className="text-[10.5px] text-ink-4 mt-0.5">
                    {a.impactLevel} impact · {formatRelative(a.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Zone cross-link */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(`/atlas?zone=${project.zoneId}`)}
        className="w-full h-9 flex items-center justify-center gap-1.5 rounded-control bg-[rgba(255,255,255,0.05)] border border-border text-ink-2 text-[12px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
      >
        <MapPin size={13} />
        View {zoneName} on the Atlas
      </motion.button>
    </motion.div>
  );
}

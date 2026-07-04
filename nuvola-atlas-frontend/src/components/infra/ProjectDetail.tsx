import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/api";
import { formatDate } from "@/lib/format";
import { springSettle } from "@/lib/motion";
import Timeline from "./Timeline";
import type { Project } from "@/types";

const TYPE_COLORS: Record<string, string> = { road: "#C0552B", energy: "#E0A82E", grid: "#1F8A78" };

interface Props {
  project: Project;
}

export default function ProjectDetail({ project }: Props) {
  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });
  const zoneName = zones?.find((z) => z.id === project.zoneId)?.name ?? project.zoneId;

  const kvItems = [
    { label: "Budget", value: project.budget },
    { label: "Progress", value: `${project.progress}%` },
    { label: "Status", value: project.status },
    { label: "ETA", value: formatDate(project.eta) },
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
        className="flex items-center gap-2 mb-3"
      >
        <span
          className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase text-white"
          style={{ background: TYPE_COLORS[project.type] }}
        >
          {project.type}
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
            <div className="text-[16px] font-semibold text-ink-1 tabular-nums capitalize">{kv.value}</div>
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
            style={{ background: TYPE_COLORS[project.type] }}
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] mb-4">Milestones</div>
        <Timeline milestones={project.milestones} />
      </motion.div>
    </motion.div>
  );
}

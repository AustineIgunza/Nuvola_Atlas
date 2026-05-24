import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSettle } from "@/lib/motion";
import type { Project } from "@/types";

const TYPE_COLORS: Record<string, string> = { road: "#4a9eff", energy: "#ffb340", grid: "#b888ff" };
const STATUS_COLORS: Record<string, string> = { active: "#34c97a", stalled: "#ff5d5d", planned: "#ffb340" };

interface Props {
  project: Project;
  selected: boolean;
  zoneName: string;
  onClick: () => void;
}

export default function ProjectCard({ project, selected, zoneName, onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      layout
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
      whileTap={{ scale: 0.98 }}
      transition={springSettle}
      className={cn(
        "w-full text-left p-4 rounded-card transition-colors border",
        selected
          ? "bg-[rgba(74,158,255,0.08)] border-accent/40"
          : "bg-[rgba(255,255,255,0.02)] border-border hover:border-border-strong",
      )}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase text-white"
          style={{ background: TYPE_COLORS[project.type] }}
        >
          {project.type}
        </span>
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ background: STATUS_COLORS[project.status] }}
          animate={project.status === "active" ? { scale: [1, 1.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <span className="text-[10px] text-ink-4 capitalize">{project.status}</span>
      </div>

      <div className="text-[13px] font-semibold text-ink-1 mb-1">{project.name}</div>
      <div className="text-[11px] text-ink-4 mb-3">{zoneName} · {project.agency}</div>

      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden mb-1.5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: TYPE_COLORS[project.type] }}
          initial={{ width: 0 }}
          animate={{ width: `${project.progress}%` }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      <div className="text-[10px] text-ink-4 tabular-nums">{project.progress}% · ETA {project.eta}</div>
    </motion.button>
  );
}

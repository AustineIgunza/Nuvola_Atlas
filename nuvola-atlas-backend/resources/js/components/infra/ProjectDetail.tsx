import { motion } from "framer-motion";
import { Building2, Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatDate } from "../../lib/format";
import { settleSpring } from "../../lib/motionPresets";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import type { Project } from "../../types";

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-[#1B9C6B]/10 text-[#1B9C6B]",
  stalled: "bg-[#C7603F]/10 text-[#C7603F]",
  planned: "bg-ink/5 text-ink/50",
};

export default function ProjectDetail({ project }: { project: Project }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      key={project.id}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={settleSpring}
      className="bg-card rounded-card shadow-card p-7 h-full overflow-y-auto"
    >
      {/* Header */}
      <div className="text-[10px] tracking-[0.14em] uppercase text-ink/38">Project</div>
      <h2 className="text-[22px] font-semibold tracking-[-0.02em] mt-1">{project.name}</h2>

      {/* Meta */}
      <div className="flex flex-wrap gap-2.5 mt-3 text-[12px] text-ink/50">
        <span className="flex items-center gap-1">
          <Building2 size={14} className="opacity-60" /> {project.agency}
        </span>
        <span className="px-2 py-0.5 rounded-chip bg-ink/5 capitalize">{project.type}</span>
        <span className={cn("px-2 py-0.5 rounded-chip capitalize", STATUS_CLASSES[project.status] ?? "bg-ink/5")}>
          {project.status}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex justify-between text-[13px] mb-1.5">
          <span className="text-ink/60 font-medium">Progress</span>
          <span className="text-ink font-semibold">{project.progress}%</span>
        </div>
        <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={reduced ? { duration: 0 } : settleSpring}
          />
        </div>
      </div>

      {/* Budget + Dates */}
      <div className="grid grid-cols-3 gap-4 mt-5">
        <div>
          <div className="text-[10px] tracking-[0.12em] uppercase text-ink/38 mb-1">Budget</div>
          <div className="text-[14px] font-semibold text-ink">{project.budget}</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.12em] uppercase text-ink/38 mb-1">Started</div>
          <div className="text-[13px] text-ink/70">{formatDate(project.started)}</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.12em] uppercase text-ink/38 mb-1">ETA</div>
          <div className="text-[13px] text-ink/70">{formatDate(project.eta)}</div>
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-6 border-t border-ink/7 pt-5">
        <div className="text-[10px] tracking-[0.14em] uppercase text-ink/38 mb-4">Milestones</div>
        <div className="space-y-0">
          {project.milestones.map((m, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    m.done ? "bg-score-green text-white" : "bg-ink/8"
                  )}
                >
                  {m.done && <Check size={13} strokeWidth={2.5} />}
                </div>
                {i < project.milestones.length - 1 && <div className="w-px h-5 bg-ink/8" />}
              </div>
              <div className="pb-3">
                <div className={cn("text-[13px]", m.done ? "text-ink/60" : "text-ink/40")}>{m.label}</div>
                <div className="text-[11px] text-ink/30">{formatDate(m.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

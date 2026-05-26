import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { HardHat } from "lucide-react";
import { api } from "../../api";
import { cn } from "../../lib/cn";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { settleSpring } from "../../lib/motionPresets";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const TYPE_LABELS = ["all", "road", "energy", "grid"];
const STATUS_LABELS = ["all", "active", "stalled", "planned"];

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-[#1B9C6B]/10 text-[#1B9C6B]",
  stalled: "bg-[#C7603F]/10 text-[#C7603F]",
  planned: "bg-ink/5 text-ink/50",
};

export default function ProjectList({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const reduced = usePrefersReducedMotion();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = projects.filter(
    (p) => (filterType === "all" || p.type === filterType) && (filterStatus === "all" || p.status === filterStatus)
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-ink/30 text-sm">Loading projects...</div>;
  }

  return (
    <div>
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] mb-3">Projects</h2>

      <div className="flex gap-1.5 mb-2 flex-wrap">
        {TYPE_LABELS.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              "px-2.5 py-0.5 text-[11px] rounded-pill transition-colors capitalize",
              filterType === t ? "bg-accent text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/8"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {STATUS_LABELS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-2.5 py-0.5 text-[11px] rounded-pill transition-colors capitalize",
              filterStatus === s ? "bg-accent text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/8"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-card shadow-card p-8 text-center">
          <HardHat className="mx-auto mb-2 text-ink/20" size={28} />
          <p className="text-[13px] text-ink/40">No projects match</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial={reduced ? false : "hidden"}
          animate="visible"
          key={`${filterType}-${filterStatus}`}
        >
          {filtered.map((project) => (
            <motion.div
              key={project.id}
              variants={staggerItem}
              onClick={() => onSelect(project.id)}
              className={cn(
                "bg-card rounded-card shadow-card p-4 mb-3 cursor-pointer transition-shadow hover:shadow-lg",
                selectedId === project.id && "ring-2 ring-accent"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-semibold text-ink truncate pr-2">{project.name}</span>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-chip shrink-0 capitalize", STATUS_CLASSES[project.status] ?? "bg-ink/5 text-ink/50")}>
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[11px] px-2 py-0.5 rounded-chip bg-ink/5 text-ink/50 capitalize">{project.type}</span>
                <span className="text-[11px] text-ink/40">{project.agency}</span>
              </div>
              <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={reduced ? { duration: 0 } : settleSpring}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[11px] text-ink/40">
                <span>{project.progress}%</span>
                <span>{project.budget}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSettle } from "@/lib/motion";
import { useT } from "@/lib/i18n/use-t";
import type { MessageKey } from "@/lib/i18n/translate";
import type { Project } from "@/domain/types";

const STATUS_KEYS: Record<Project["status"], MessageKey> = {
  active: "infra.status.active",
  stalled: "infra.status.stalled",
  planned: "infra.status.planned",
};

const TYPE_COLORS: Record<string, string> = {
  road: "#C0552B",
  energy: "#E0A82E",
  grid: "#1F8A78",
  water: "#176B5D",
};
const STATUS_COLORS: Record<string, string> = {
  active: "#1F8A78",
  stalled: "#D3402E",
  planned: "#E0A82E",
};

interface Props {
  project: Project;
  selected: boolean;
  zoneName: string;
  onClick: () => void;
}

export default function ProjectCard({ project, selected, zoneName, onClick }: Props) {
  const t = useT();
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
          ? "bg-[rgba(192,85,43,0.08)] border-accent/40"
          : "bg-[rgba(255,255,255,0.02)] border-border hover:border-border-strong",
      )}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase text-white"
          style={{
            background: TYPE_COLORS[project.type],
            boxShadow: `0 0 10px ${TYPE_COLORS[project.type]}44, 0 0 4px ${TYPE_COLORS[project.type]}22`,
          }}
        >
          {project.type}
        </span>
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{
            background: STATUS_COLORS[project.status],
            boxShadow: `0 0 8px ${STATUS_COLORS[project.status]}66`,
          }}
          animate={
            project.status === "active"
              ? {
                  scale: [1, 1.3, 1],
                  boxShadow: [
                    `0 0 8px ${STATUS_COLORS[project.status]}66`,
                    `0 0 14px ${STATUS_COLORS[project.status]}88`,
                    `0 0 8px ${STATUS_COLORS[project.status]}66`,
                  ],
                }
              : {}
          }
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <span className="text-[10px] text-ink-4">{t(STATUS_KEYS[project.status])}</span>
      </div>

      <div className="text-[13px] font-semibold text-ink-1 mb-1">{project.name}</div>
      <div className="text-[11px] text-ink-4 mb-3">
        {zoneName} · {project.agency}
      </div>

      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden mb-1.5">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: TYPE_COLORS[project.type],
            boxShadow: `0 0 8px ${TYPE_COLORS[project.type]}55, 0 1px 3px ${TYPE_COLORS[project.type]}33`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${project.progress}%` }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      <div className="text-[10px] text-ink-4 tabular-nums">
        {t("infra.card.etaLine", { progress: project.progress, eta: project.eta })}
      </div>
    </motion.button>
  );
}

import { motion } from "framer-motion";
import { formatDate } from "@/lib/format";
import { springSettle } from "@/lib/motion";
import type { ProjectMilestone } from "@/types";

interface Props {
  milestones: ProjectMilestone[];
}

export default function Timeline({ milestones }: Props) {
  return (
    <div className="relative">
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, ...springSettle }}
            className="flex gap-3.5 pb-5 last:pb-0"
          >
            {/* Rail */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08 + 0.1, ...springSettle }}
                className="w-3.5 h-3.5 rounded-full border-2 shrink-0"
                style={{
                  borderColor: m.done ? "#34c97a" : "rgba(255,255,255,0.2)",
                  background: m.done ? "#34c97a" : "transparent",
                  boxShadow: m.done ? "0 0 8px rgba(52,201,122,0.3)" : "none",
                }}
              />
              {!isLast && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.08 + 0.15, duration: 0.4 }}
                  className="w-px flex-1 mt-1 origin-top"
                  style={{
                    background: m.done ? "rgba(52,201,122,0.25)" : "rgba(255,255,255,0.06)",
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-1 -mt-0.5">
              <div className="text-[13px] font-medium text-ink-1">{m.label}</div>
              <div className="text-[11px] text-ink-4 tabular-nums mt-0.5">{formatDate(m.date)}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

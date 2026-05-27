import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { springSettle, staggerItemScale } from "@/lib/motion";
import { SEVERITY_COLORS, IMPACT_STYLES, KIND_LABELS } from "./alerts.constants";
import type { AlertItem } from "@/types";

interface Props {
  alert: AlertItem;
  expanded: boolean;
  onToggle: () => void;
  zoneName: string;
  projectName: (id: string) => string;
}

export default function AlertCard({ alert: a, expanded, onToggle, zoneName, projectName }: Props) {
  const impact = IMPACT_STYLES[a.impactLevel] ?? IMPACT_STYLES.moderate;
  const sevColor = SEVERITY_COLORS[a.severity];

  return (
    <motion.div
      variants={staggerItemScale}
      transition={springSettle}
      layout
      exit={{ opacity: 0, scale: 0.95, x: -20, transition: { duration: 0.2 } }}
      className={cn(
        "relative rounded-card border border-border transition-opacity overflow-hidden",
        a.read && "opacity-55",
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex gap-3.5 p-4 sm:p-5 text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      >
        <motion.div
          className="w-[3px] rounded-full shrink-0 self-stretch"
          style={{ background: sevColor, boxShadow: `0 0 8px ${sevColor}55` }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.1, ...springSettle }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white"
                style={{ background: sevColor, boxShadow: `0 0 10px ${sevColor}55, 0 0 4px ${sevColor}30` }}
              >
                {a.severity}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                style={{ background: impact.bg, color: impact.text }}
              >
                {impact.label}
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[rgba(255,255,255,0.06)] text-ink-3">
                {KIND_LABELS[a.kind] ?? a.kind}
              </span>
            </div>
            <span className="text-[11px] text-ink-4 tabular-nums shrink-0">{formatRelative(a.createdAt)}</span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-ink-4">{zoneName}</span>
          </div>

          <h3 className="text-[14px] font-semibold text-ink-1 mb-1.5">{a.title}</h3>
          <p className="text-[12.5px] text-ink-2 leading-[1.6]">{a.body}</p>
        </div>

        <ChevronDown
          size={16}
          className={cn(
            "text-ink-4 shrink-0 mt-1 transition-transform",
            expanded && "rotate-180",
          )}
        />

        {!a.read && (
          <div className="absolute top-3 right-3">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" style={{ boxShadow: "0 0 10px rgba(74,158,255,0.5)" }} />
          </div>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4 ml-[15px]">
              {a.affectedInfra.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <h4 className="text-[11px] font-semibold text-ink-3 uppercase tracking-[0.06em] mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-ink-4" />
                    Affected Infrastructure
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {a.affectedInfra.map((infra, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.05)] text-ink-2 border border-border/40"
                      >
                        {infra}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {a.recommendedActions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h4 className="text-[11px] font-semibold text-ink-3 uppercase tracking-[0.06em] mb-2 flex items-center gap-1.5">
                    <Shield size={12} className="text-ink-4" />
                    Recommended Actions
                  </h4>
                  <div className="space-y-1.5">
                    {a.recommendedActions.map((action, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + i * 0.03 }}
                        className="flex items-start gap-2 text-[12px] text-ink-2"
                      >
                        <span className="text-accent mt-0.5 shrink-0 text-[10px]">●</span>
                        <span className="leading-[1.5]">{action}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {a.relatedProjectIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h4 className="text-[11px] font-semibold text-ink-3 uppercase tracking-[0.06em] mb-2 flex items-center gap-1.5">
                    <ExternalLink size={12} className="text-ink-4" />
                    Related Projects
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {a.relatedProjectIds.map((pid) => (
                      <span
                        key={pid}
                        className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent/10 text-accent"
                      >
                        {projectName(pid)}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

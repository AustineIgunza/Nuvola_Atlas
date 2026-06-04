import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { springSettle, staggerItemScale } from "@/lib/motion";
import { SEVERITY_COLORS, IMPACT_STYLES, KIND_LABELS } from "./alerts.constants";
import type { AlertItem } from "@/types";

interface Props {
  alert: AlertItem;
  selected: boolean;
  onSelect: () => void;
  zoneName: string;
}

export default function AlertCard({ alert: a, selected, onSelect, zoneName }: Props) {
  const impact = IMPACT_STYLES[a.impactLevel] ?? IMPACT_STYLES.moderate;
  const sevColor = SEVERITY_COLORS[a.severity];

  return (
    <motion.div
      variants={staggerItemScale}
      transition={springSettle}
      layout
      exit={{ opacity: 0, scale: 0.95, x: -20, transition: { duration: 0.2 } }}
      className={cn(
        "relative rounded-card border transition-all overflow-hidden",
        selected
          ? "border-accent/40 bg-[rgba(74,158,255,0.04)]"
          : "border-border",
        a.read && !selected && "opacity-55",
      )}
    >
      <button
        onClick={onSelect}
        aria-label={`Open ${a.title}`}
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
          <p className="text-[12.5px] text-ink-2 leading-[1.6] line-clamp-2">{a.body}</p>
        </div>

        <ChevronRight size={16} className="text-ink-4 shrink-0 mt-1" />

        {!a.read && (
          <div className="absolute top-3 right-3">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" style={{ boxShadow: "0 0 10px rgba(74,158,255,0.5)" }} />
          </div>
        )}
      </button>
    </motion.div>
  );
}

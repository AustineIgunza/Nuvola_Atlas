import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { PILLAR_COLORS, PILLAR_LABELS, PILLAR_GLYPHS } from "@/lib/scoreColor";
import type { PillarKey } from "@/types";

interface Props {
  pillarKey: PillarKey;
  score: number;
  delta: number;
  index: number;
}

const SUB_METRICS: Record<PillarKey, { label: string; value: string }[]> = {
  social: [
    { label: "Social Progress Index", value: "Moderate" },
    { label: "Workforce Mobility", value: "High" },
    { label: "Livability Score", value: "Moderate" },
  ],
  safety: [
    { label: "Rule of Law Stability", value: "Stable" },
    { label: "Physical Security", value: "Moderate" },
    { label: "Digital Sovereignty", value: "Fair" },
  ],
  density: [
    { label: "Optimal Density Ratio", value: "0.72" },
    { label: "Urban Friction Index", value: "Moderate" },
  ],
  infra: [
    { label: "ESIA Transparency", value: "Published" },
    { label: "Sovereign Immunity Risk", value: "Low" },
    { label: "Resource Sovereignty", value: "Protected" },
    { label: "Waste Mandates", value: "Partial" },
    { label: "Circular Economy", value: "Emerging" },
  ],
};

export default function PillarRow({ pillarKey, score, delta, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = PILLAR_COLORS[pillarKey];
  const label = PILLAR_LABELS[pillarKey];
  const glyph = PILLAR_GLYPHS[pillarKey];

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3 px-1 text-left group"
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}44` }}
        >
          {glyph}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-ink-2 font-medium truncate">
            {label}
          </div>
        </div>
        <span
          className="tabular-nums text-[18px] font-semibold shrink-0"
          style={{ color }}
        >
          {score}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-ink-4 transition-transform shrink-0",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Progress bar */}
      <div className="px-1 pb-3">
        <div className="h-[3px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
              delay: index * 0.08,
            }}
          />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-1 pb-3 space-y-1.5">
              {SUB_METRICS[pillarKey].map((sm) => (
                <div
                  key={sm.label}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="text-ink-3">{sm.label}</span>
                  <span className="text-ink-2 font-medium">{sm.value}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 pt-1 text-[11px]">
                <span className={delta >= 0 ? "text-success" : "text-danger"}>
                  {delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(delta)} pts
                </span>
                <span className="text-ink-4">vs last quarter</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

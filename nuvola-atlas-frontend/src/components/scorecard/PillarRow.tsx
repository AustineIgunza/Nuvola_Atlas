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

interface SubMetricDef {
  label: string;
  score: number;
  weight: number;
  trend: "up" | "down" | "stable";
  detail: string;
}

const SUB_METRICS: Record<PillarKey, SubMetricDef[]> = {
  social: [
    { label: "Social Progress Index", score: 64, weight: 0.4, trend: "up", detail: "Basic medical care, access to amenities, and inclusiveness" },
    { label: "Workforce Mobility", score: 71, weight: 0.35, trend: "stable", detail: "Ease of labour and specialized role movement in/out of region" },
    { label: "Mental Health & Livability", score: 52, weight: 0.25, trend: "down", detail: "Green space access, air quality, projected burnout risk" },
  ],
  safety: [
    { label: "Rule of Law Stability", score: 68, weight: 0.4, trend: "stable", detail: "Contract expropriation probability, 5-year judicial independence trend" },
    { label: "Physical Security", score: 58, weight: 0.35, trend: "down", detail: "Conflict heatmap integration, proximity to high-crime corridors" },
    { label: "Digital Sovereignty", score: 61, weight: 0.25, trend: "up", detail: "Internet Freedom Score, network outage frequency" },
  ],
  density: [
    { label: "Optimal Density Ratio", score: 55, weight: 0.55, trend: "down", detail: "Infrastructure Capacity / Population Density — low ratio flags over-saturation" },
    { label: "Urban Friction Index", score: 62, weight: 0.45, trend: "stable", detail: "Average transit times for heavy equipment, zoning process complexity" },
  ],
  infra: [
    { label: "ESIA Transparency", score: 74, weight: 0.25, trend: "up", detail: "Availability of Environmental & Social Impact Assessments to local stakeholders" },
    { label: "Sovereign Immunity Risk", score: 62, weight: 0.2, trend: "stable", detail: "Government accountability for breaches of environmental/infrastructure contracts" },
    { label: "Resource Sovereignty", score: 70, weight: 0.2, trend: "stable", detail: "Legal protections on water and energy rights, nationalization risk" },
    { label: "Waste & Lifecycle Mandates", score: 58, weight: 0.2, trend: "up", detail: "EPR laws, decommissioning liabilities in force" },
    { label: "Circular Economy Freedom", score: 48, weight: 0.15, trend: "down", detail: "Whether laws permit reuse of greywater and recycled construction materials" },
  ],
};

const TREND_ICON: Record<string, { char: string; color: string }> = {
  up: { char: "▲", color: "#34c97a" },
  down: { char: "▼", color: "#ff5d5d" },
  stable: { char: "◆", color: "#8a91a0" },
};

function scoreLabel(s: number): { text: string; color: string } {
  if (s >= 75) return { text: "Strong", color: "#34c97a" };
  if (s >= 60) return { text: "Moderate", color: "#ffd23c" };
  if (s >= 45) return { text: "Weak", color: "#ff9a3c" };
  return { text: "Critical", color: "#ff5d5d" };
}

export default function PillarRow({ pillarKey, score, delta, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = PILLAR_COLORS[pillarKey];
  const label = PILLAR_LABELS[pillarKey];
  const glyph = PILLAR_GLYPHS[pillarKey];
  const subMetrics = SUB_METRICS[pillarKey];
  const sl = scoreLabel(score);

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
          <div className="text-[10px] text-ink-4 mt-0.5">
            {subMetrics.length} sub-metrics · <span style={{ color: sl.color }}>{sl.text}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="tabular-nums text-[18px] font-semibold"
            style={{ color }}
          >
            {score}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium tabular-nums",
              delta >= 0 ? "text-success" : "text-danger",
            )}
          >
            {delta >= 0 ? "+" : ""}{delta}
          </span>
        </div>
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
            <div className="px-1 pb-4 space-y-3">
              {subMetrics.map((sm, i) => {
                const trend = TREND_ICON[sm.trend];
                const smLabel = scoreLabel(sm.score);
                return (
                  <motion.div
                    key={sm.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span style={{ color: trend.color }} className="text-[9px]">
                          {trend.char}
                        </span>
                        <span className="text-[11px] text-ink-2 font-medium truncate">
                          {sm.label}
                        </span>
                        <span className="text-[9px] text-ink-4 shrink-0">
                          ({Math.round(sm.weight * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>
                          {sm.score}
                        </span>
                        <span
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: `${smLabel.color}18`, color: smLabel.color }}
                        >
                          {smLabel.text}
                        </span>
                      </div>
                    </div>
                    <div className="h-[2px] rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color, opacity: 0.7 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${sm.score}%` }}
                        transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                      />
                    </div>
                    <p className="text-[10px] text-ink-4 leading-[1.4]">{sm.detail}</p>
                  </motion.div>
                );
              })}

              {/* Pillar delta summary */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-border/30 text-[11px]">
                <span className={delta >= 0 ? "text-success" : "text-danger"}>
                  {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts
                </span>
                <span className="text-ink-4">vs last quarter</span>
                <span className="text-ink-4 ml-auto">
                  Weighted composite of {subMetrics.length} metrics
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

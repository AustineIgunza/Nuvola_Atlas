import { motion } from "framer-motion";
import { PILLAR_COLORS } from "@/lib/scoreColor";
import { SUB_METRICS, TREND_ICON, scoreLabel } from "../pillar-data";
import type { PillarKey } from "@/types";

interface Props {
  pillarKey: PillarKey;
}

export default function SubMetricList({ pillarKey }: Props) {
  const color = PILLAR_COLORS[pillarKey];

  return (
    <div className="space-y-2">
      {SUB_METRICS[pillarKey].map((sm, i) => {
        const trend = TREND_ICON[sm.trend];
        const sl = scoreLabel(sm.score);
        return (
          <div key={sm.label}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span style={{ color: trend.color }} className="text-[8px] shrink-0">
                  {trend.char}
                </span>
                <span className="text-[11px] text-ink-2 font-medium truncate">{sm.label}</span>
                <span className="text-[9px] text-ink-4 shrink-0">
                  ({Math.round(sm.weight * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>
                  {sm.score}
                </span>
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: `${sl.color}18`, color: sl.color }}
                >
                  {sl.text}
                </span>
              </div>
            </div>
            <div className="mt-1 h-[2px] rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color, opacity: 0.7 }}
                initial={{ width: 0 }}
                animate={{ width: `${sm.score}%` }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { PILLAR_COLORS, PILLAR_GLYPHS } from "@/lib/scoreColor";
import { useT } from "@/lib/i18n/use-t";
import EstimatedMark from "@/components/common/EstimatedMark";
import type { PillarKey } from "@/types";

interface Props {
  pillarKey: PillarKey;
  score: number;
  delta: number;
  index: number;
  /** The API returned null for this pillar and the client filled it in. */
  estimated?: boolean;
}

export default function PillarBar({ pillarKey, score, delta, index, estimated }: Props) {
  const color = PILLAR_COLORS[pillarKey];
  const t = useT();

  return (
    <div className="py-1.5">
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ background: color, boxShadow: `0 0 6px ${color}44` }}
        >
          {PILLAR_GLYPHS[pillarKey]}
        </div>
        <span className="flex-1 min-w-0 text-[11px] text-ink-2 font-medium truncate">
          {t(`pillar.${pillarKey}.short` as const)}
        </span>
        <span className="tabular-nums text-[13px] font-semibold shrink-0" style={{ color }}>
          {estimated ? <EstimatedMark>{score}</EstimatedMark> : score}
        </span>
        {/* A trend on a value we had to invent would be inventing a second
            thing. Estimated pillars get no delta at all. */}
        {estimated ? (
          <span className="text-[10px] font-medium tabular-nums shrink-0 text-ink-4">—</span>
        ) : (
          <span
            className={cn(
              "text-[10px] font-medium tabular-nums shrink-0",
              delta >= 0 ? "text-success" : "text-danger",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-1 h-[3px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", estimated && "opacity-40")}
          style={{ background: color, boxShadow: estimated ? "none" : `0 0 6px ${color}55` }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20, delay: index * 0.08 }}
        />
      </div>
    </div>
  );
}

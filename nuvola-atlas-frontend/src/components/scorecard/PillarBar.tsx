import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { PILLAR_COLORS, PILLAR_GLYPHS } from "@/lib/scoreColor";
import { NO_SCORE_LABEL } from "@/domain/scores";
import { useT } from "@/lib/i18n/use-t";
import { PILLARS_BY_KEY } from "@/domain/pillars.generated";
import EstimatedMark from "@/components/common/EstimatedMark";
import type { PillarKey } from "@/domain/types";

interface Props {
  pillarKey: PillarKey;
  /** Null for a pillar with no indicator behind any sub-metric. */
  score: number | null;
  /** Null when history cannot support a direction of travel. */
  delta: number | null;
  index: number;
  /** The API returned null for this pillar and the client filled it in. */
  estimated?: boolean;
}

export default function PillarBar({ pillarKey, score, delta, index, estimated }: Props) {
  const color = PILLAR_COLORS[pillarKey];
  const t = useT();
  const unscored = score === null;
  const pillar = PILLARS_BY_KEY[pillarKey];

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
        <span
          className="tabular-nums text-[13px] font-semibold shrink-0"
          style={{ color: unscored ? "rgba(255,255,255,0.35)" : color }}
        >
          {unscored ? NO_SCORE_LABEL : estimated ? <EstimatedMark>{score}</EstimatedMark> : score}
        </span>
        {/* A trend on a value we had to invent would be inventing a second
            thing. Estimated pillars get no delta at all, and neither do
            pillars whose history is too thin to measure movement, nor
            pillars with no reading in the first place. */}
        {unscored || estimated || delta === null ? (
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
        {/* No fill for an unscored pillar. A 0%-width bar is indistinguishable
            from a 1%-width one, so the empty track speaks louder. */}
        {!unscored && (
          <motion.div
            className={cn("h-full rounded-full", estimated && "opacity-40")}
            style={{ background: color, boxShadow: estimated ? "none" : `0 0 6px ${color}55` }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20, delay: index * 0.08 }}
          />
        )}
      </div>
      {/* Source + vintage caption. Definition-of-done from
          NAVUUNA_REFOCUS_WORKFLOW.md §9: every number on screen shows
          its source and vintage — a bar without a caption is a number a
          regulator cannot check. Hidden only when the pillar registry
          has no vintage recorded (a retired pillar, which should not
          reach this component anyway). */}
      {pillar?.vintage && (
        <div className="mt-0.5 text-[9px] text-ink-4 truncate">
          {pillar.sourceId ? `${pillar.sourceId} · ` : ""}
          {pillar.vintage}
        </div>
      )}
    </div>
  );
}

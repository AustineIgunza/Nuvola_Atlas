import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { scoreColor } from "@/lib/scoreColor";
import { hasEstimates } from "@/domain/estimates";
import { byScoreDesc, formatScore, isScored } from "@/domain/scores";
import { useT } from "@/lib/i18n/use-t";
import type { Zone } from "@/domain/types";

interface Props {
  currentZone: Zone;
}

export default function ZoneRanking({ currentZone }: Props) {
  const { data: allZones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });
  const t = useT();

  if (!allZones || allZones.length < 2) return null;

  const sorted = [...allZones].sort(byScoreDesc);
  // An unscoreable zone sits at the tail of `sorted` by convention, not by
  // merit, so its position is not a rank. Show no rank rather than a false one.
  const rank = isScored(currentZone) ? sorted.findIndex((z) => z.id === currentZone.id) + 1 : 0;
  const top5 = sorted.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em]">
          Zone Ranking
        </div>
        <span className="text-[12px] font-semibold text-accent tabular-nums">
          {rank > 0 ? `#${rank} of ${sorted.length}` : "Unranked"}
        </span>
      </div>
      <div className="space-y-1.5">
        {top5.map((z, i) => {
          const isCurrent = z.id === currentZone.id;
          const color = scoreColor(z.score);
          return (
            <div
              key={z.id}
              className={cn(
                "flex items-center gap-2.5 py-1.5 px-2 rounded-control text-[11px]",
                isCurrent && "bg-[rgba(192,85,43,0.08)] border border-accent/20",
              )}
            >
              <span className="text-ink-4 font-bold w-4 text-right tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0 truncate text-ink-2 font-medium">
                {z.name}
                {hasEstimates(z) && (
                  <span
                    title={t("estimated.zoneBadge")}
                    aria-label={t("estimated.zoneBadge")}
                    data-testid="estimated-badge"
                    className="ml-1 text-ink-4"
                  >
                    ~
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-[40px] h-[3px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  {/* No fill at all when unscored — a 0%-wide bar and a 1%-wide
                      bar are indistinguishable, so an empty track says it better. */}
                  {z.score !== null && (
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${z.score}%`,
                        background: color,
                        boxShadow: `0 0 4px ${color}55`,
                      }}
                    />
                  )}
                </div>
                <span className="font-semibold tabular-nums" style={{ color }}>
                  {formatScore(z.score)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {rank > 5 && (
        <div className="mt-2 text-[10px] text-ink-4 text-center">
          {currentZone.name} is ranked #{rank}
        </div>
      )}
    </motion.div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api } from "../../api";
import { cn } from "../../lib/cn";
import { scoreColor, PILLAR_COLORS, PILLAR_SHORT } from "../../lib/scoreColor";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import type { PillarKey } from "../../types";

const PILLARS: PillarKey[] = ["social", "safety", "density", "infra"];

function Sparkline({ data }: { data: { month: string; overallAvg: number }[] }) {
  if (data.length < 2) return null;

  const W = 400;
  const H = 60;
  const PAD = 4;
  const min = Math.min(...data.map((d) => d.overallAvg)) - 1;
  const max = Math.max(...data.map((d) => d.overallAvg)) + 1;

  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.overallAvg - min) / (max - min)) * (H - PAD * 2);
    return `${x},${y}`;
  });

  const fillPoints = [...points, `${PAD + (W - PAD * 2)},${H}`, `${PAD},${H}`];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16 text-accent" preserveAspectRatio="none">
        <polygon points={fillPoints.join(" ")} fill="currentColor" fillOpacity="0.06" />
        <polyline points={points.join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[11px] text-ink/30 mt-1">
        <span>{data[0].month}</span>
        <span className="font-medium text-ink/50">{data[data.length - 1].overallAvg} avg</span>
        <span>{data[data.length - 1].month}</span>
      </div>
    </div>
  );
}

function NetDelta({ deltas }: { deltas: { social: number | null; safety: number | null; density: number | null; infra: number | null } }) {
  const net = (deltas.social ?? 0) + (deltas.safety ?? 0) + (deltas.density ?? 0) + (deltas.infra ?? 0);
  if (net === 0) return <Minus size={14} className="text-ink/25" />;
  if (net > 0) return <TrendingUp size={14} className="text-[#1B9C6B]" />;
  return <TrendingDown size={14} className="text-[#C7603F]" />;
}

export default function Leaderboard() {
  const reduced = usePrefersReducedMotion();
  const { data: zones = [], isLoading: zonesLoading } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });
  const { data: history = [] } = useQuery({ queryKey: ["history"], queryFn: api.getHistory });

  const sorted = [...zones].sort((a, b) => b.score - a.score);

  if (zonesLoading) {
    return <div className="flex items-center justify-center h-64 text-ink/30 text-sm">Loading leaderboard...</div>;
  }

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] mb-5">Vitality Leaderboard</h1>

      {/* Trend card */}
      {history.length > 0 && (
        <div className="bg-card rounded-card shadow-card p-5 mb-5">
          <div className="text-[10px] tracking-[0.14em] uppercase text-ink/38 mb-3">12-Month Nairobi Trend</div>
          <Sparkline data={history} />
        </div>
      )}

      {/* Leaderboard */}
      <motion.div
        variants={staggerContainer}
        initial={reduced ? false : "hidden"}
        animate="visible"
      >
        {sorted.map((zone, i) => (
          <motion.div
            key={zone.id}
            variants={staggerItem}
            className="bg-card rounded-card shadow-card p-4 mb-3 flex items-center gap-4"
          >
            {/* Rank */}
            <span
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0",
                i < 3 ? "bg-accent text-white" : "bg-ink/5 text-ink/40"
              )}
            >
              {i + 1}
            </span>

            {/* Zone info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[14px] font-semibold text-ink truncate">{zone.name}</span>
                <NetDelta deltas={zone.deltas} />
              </div>
              {/* Pillar mini-bars */}
              <div className="flex gap-1">
                {PILLARS.map((k) => (
                  <div
                    key={k}
                    className="flex-1 h-1.5 bg-ink/5 rounded-full overflow-hidden"
                    title={`${PILLAR_SHORT[k]}: ${zone.pillars[k]}`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${zone.pillars[k]}%`, backgroundColor: PILLAR_COLORS[k] }}
                    />
                  </div>
                ))}
              </div>
              {/* Pillar legend */}
              <div className="flex gap-3 mt-1.5">
                {PILLARS.map((k) => (
                  <span key={k} className="text-[10px] text-ink/30">
                    {PILLAR_SHORT[k]} {zone.pillars[k]}
                  </span>
                ))}
              </div>
            </div>

            {/* Score */}
            <span
              className="text-[22px] font-semibold tabular-nums shrink-0"
              style={{ color: scoreColor(zone.score) }}
            >
              {zone.score}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

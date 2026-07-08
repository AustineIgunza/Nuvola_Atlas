import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useZoneHistory } from "@/hooks/useZoneHistory";
import { BRAND, PILLAR_COLORS, PILLAR_SHORT } from "@/lib/scoreColor";
import type { HistoryRange, PillarKey } from "@/types";
import { Section } from "./bits";

const RANGES: { key: HistoryRange; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

const PILLAR_KEYS: PillarKey[] = ["social", "safety", "density", "infra"];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatTick(iso: string, range: HistoryRange): string {
  const d = new Date(iso);
  if (range === "day") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface Props {
  zoneId: string;
}

export default function ScoreHistoryChart({ zoneId }: Props) {
  const [range, setRange] = useState<HistoryRange>("week");
  const [overlays, setOverlays] = useState<Set<PillarKey>>(new Set());
  const { data, isLoading } = useZoneHistory(zoneId, range);
  const reduceMotion = useMemo(prefersReducedMotion, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.points.map((p) => ({
      t: p.t,
      label: formatTick(p.t, range),
      score: p.score,
      social: p.pillars.social,
      safety: p.pillars.safety,
      density: p.pillars.density,
      infra: p.pillars.infra,
    }));
  }, [data, range]);

  const empty = !isLoading && chartData.length < 2;

  const toggleOverlay = (k: PillarKey) => {
    setOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  return (
    <Section
      title="Score history"
      action={
        <div className="flex items-center gap-0.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-2 py-0.5 rounded-full text-[9.5px] font-medium transition-colors ${
                range === r.key
                  ? "bg-[rgba(255,255,255,0.14)] text-ink-1"
                  : "text-ink-4 hover:text-ink-2"
              }`}
              aria-pressed={range === r.key}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[128px] w-full">
        {isLoading ? (
          <div className="h-full w-full rounded-control bg-[rgba(255,255,255,0.03)] animate-pulse" />
        ) : empty ? (
          <div className="h-full w-full grid place-items-center text-[10.5px] text-ink-4 text-center px-3">
            Not enough data yet — check back after the next sync.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND.teal} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={BRAND.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                minTickGap={12}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={22}
                ticks={[0, 50, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(11,34,53,0.94)",
                  border: `1px solid ${BRAND.navyRaised}`,
                  borderRadius: 6,
                  fontSize: 10,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                itemStyle={{ padding: 0 }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={BRAND.teal}
                strokeWidth={1.5}
                fill="url(#scoreFill)"
                isAnimationActive={!reduceMotion}
                animationDuration={reduceMotion ? 0 : 420}
              />
              {PILLAR_KEYS.filter((k) => overlays.has(k)).map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={PILLAR_COLORS[k]}
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={!reduceMotion}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="text-[9px] text-ink-4 uppercase tracking-[0.08em] mr-1">Overlays</span>
        {PILLAR_KEYS.map((k) => {
          const on = overlays.has(k);
          return (
            <button
              key={k}
              onClick={() => toggleOverlay(k)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium transition-colors border"
              style={{
                borderColor: on ? PILLAR_COLORS[k] : "rgba(255,255,255,0.08)",
                color: on ? PILLAR_COLORS[k] : "rgba(255,255,255,0.55)",
                background: on ? `${PILLAR_COLORS[k]}18` : "transparent",
              }}
              aria-pressed={on}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: PILLAR_COLORS[k] }}
              />
              {PILLAR_SHORT[k]}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

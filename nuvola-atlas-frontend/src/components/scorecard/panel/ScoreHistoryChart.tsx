import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useZoneHistory } from "@/hooks/useZoneHistory";
import { useZoneForecast } from "@/hooks/useZoneForecast";
import { BRAND, PILLAR_COLORS, PILLAR_SHORT } from "@/lib/scoreColor";
import type { HistoryRange, PillarKey } from "@/types";
import { Section } from "./bits";

const RANGES: { key: HistoryRange; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

const RANGE_WINDOW: Record<HistoryRange, string> = {
  day: "24 hours",
  week: "7 days",
  month: "30 days",
};

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
  const [forecastOn, setForecastOn] = useState(false);
  const { data, isLoading } = useZoneHistory(zoneId, range);
  const { data: forecast } = useZoneForecast(zoneId, 14, forecastOn);
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);

  // A range with no rows does not mean the zone has no history — a stalled
  // feed empties the short windows first. Probe the widest window before
  // claiming there is nothing, so the panel never reports absence it has
  // not checked for.
  const noRowsHere = !isLoading && (data?.points.length ?? 0) < 2;
  const { data: widest } = useZoneHistory(zoneId, "month", noRowsHere && range !== "month");
  const widestPoints = range === "month" ? (data?.points ?? []) : (widest?.points ?? []);
  const latestElsewhere = widestPoints.length >= 2 ? widestPoints[widestPoints.length - 1].t : null;

  const chartData = useMemo(() => {
    if (!data) return [];
    const historical = data.points.map((p) => ({
      t: p.t,
      label: formatTick(p.t, range),
      score: p.score,
      social: p.pillars.social,
      safety: p.pillars.safety,
      density: p.pillars.density,
      infra: p.pillars.infra,
      forecast: undefined as number | undefined,
      lower: undefined as number | undefined,
      upper: undefined as number | undefined,
    }));

    if (!forecastOn || !forecast) return historical;

    // Anchor: last historical point becomes the seed for the forecast line
    // so the two segments connect visually.
    const anchor = historical[historical.length - 1];
    const projected = forecast.points.map((p, i) => ({
      t: p.t,
      label: formatTick(p.t, range === "day" ? "week" : range),
      score: undefined as number | undefined,
      social: undefined as number | undefined,
      safety: undefined as number | undefined,
      density: undefined as number | undefined,
      infra: undefined as number | undefined,
      forecast: p.score,
      lower: p.lower,
      upper: p.upper,
      __anchor: i === 0 && anchor ? anchor.score : undefined,
    }));

    if (anchor) {
      // Bridge the two segments by lifting the anchor's `forecast` value
      // so Recharts draws a continuous line into the forecast area.
      anchor.forecast = anchor.score;
      anchor.lower = anchor.score;
      anchor.upper = anchor.score;
    }

    return [...historical, ...projected];
  }, [data, range, forecastOn, forecast]);

  const empty = noRowsHere;
  const dividerLabel =
    data && data.points.length > 0
      ? formatTick(data.points[data.points.length - 1].t, range)
      : null;

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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setForecastOn((v) => !v)}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${
              forecastOn
                ? "text-ink-1 bg-[rgba(31,138,120,0.14)] border-[rgba(31,138,120,0.32)]"
                : "text-ink-4 hover:text-ink-2 border-border"
            }`}
            aria-pressed={forecastOn}
            title="Toggle 14-day forecast"
          >
            <TrendingUp size={9} />
            Forecast
          </button>
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
        </div>
      }
    >
      <div className="h-[128px] w-full">
        {isLoading ? (
          <div className="h-full w-full rounded-control bg-[rgba(255,255,255,0.03)] animate-pulse" />
        ) : empty ? (
          <div className="h-full w-full grid place-items-center text-[10.5px] text-ink-4 text-center px-3">
            {latestElsewhere ? (
              <div>
                <p>
                  No snapshots in the last {RANGE_WINDOW[range]}. The most recent is from{" "}
                  {new Date(latestElsewhere).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                  .
                </p>
                <button
                  onClick={() => setRange("month")}
                  className="mt-1.5 px-2 py-0.5 rounded-full border border-border text-ink-2 hover:text-ink-1 transition-colors"
                >
                  Show last 30 days
                </button>
              </div>
            ) : (
              <p>No history recorded for this zone yet.</p>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND.teal} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={BRAND.teal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND.gold} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={BRAND.gold} stopOpacity={0.05} />
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
              {forecastOn && (
                <>
                  {dividerLabel && (
                    <ReferenceLine
                      x={dividerLabel}
                      stroke="rgba(224,168,46,0.35)"
                      strokeDasharray="2 2"
                      label={{ value: "today", fill: BRAND.gold, fontSize: 8, position: "top" }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill="url(#forecastBand)"
                    isAnimationActive={!reduceMotion}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="none"
                    fill="rgba(11,34,53,0.85)"
                    fillOpacity={1}
                    isAnimationActive={!reduceMotion}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke={BRAND.gold}
                    strokeWidth={1.2}
                    strokeDasharray="4 3"
                    dot={false}
                    isAnimationActive={!reduceMotion}
                    connectNulls
                  />
                </>
              )}
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
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: PILLAR_COLORS[k] }} />
              {PILLAR_SHORT[k]}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

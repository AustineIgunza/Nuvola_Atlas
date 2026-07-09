import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { X } from "lucide-react";
import AppShell from "@/components/chrome/AppShell";
import { api } from "@/api";
import { useZoneHistory } from "@/hooks/useZoneHistory";
import { BRAND, PILLAR_COLORS, PILLAR_SHORT, scoreColor } from "@/lib/scoreColor";
import type { HistoryRange, PillarKey, Zone } from "@/types";

const MAX_ZONES = 3;
const RANGES: { key: HistoryRange; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];
const SERIES_COLORS = [BRAND.terracotta, BRAND.teal, BRAND.gold];
const PILLAR_KEYS: PillarKey[] = ["social", "safety", "density", "infra"];

export default function ComparePage() {
  const { data: zones = [] } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [range, setRange] = useState<HistoryRange>("week");

  const selected = useMemo(
    () => selectedIds.map((id) => zones.find((z) => z.id === id)).filter((z): z is Zone => Boolean(z)),
    [selectedIds, zones],
  );

  const addZone = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_ZONES) return;
    setSelectedIds([...selectedIds, id]);
  };
  const removeZone = (id: string) => {
    setSelectedIds(selectedIds.filter((s) => s !== id));
  };

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto p-4 sm:p-6">
          <header className="mb-5">
            <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.12em]">Compare</div>
            <h1 className="text-[22px] font-semibold text-ink-1 leading-tight">Side-by-side zone comparison</h1>
            <p className="mt-1.5 text-[12px] text-ink-3 max-w-[68ch]">
              Pick up to {MAX_ZONES} Nairobi sub-counties to compare their Vitality Score, pillar
              breakdown, and score history side by side.
            </p>
          </header>

          <ZonePicker
            zones={zones}
            selectedIds={selectedIds}
            onAdd={addZone}
            onRemove={removeZone}
          />

          {selected.length === 0 ? (
            <div className="mt-6 rounded-card border border-border p-8 text-center text-[12px] text-ink-4">
              Pick a zone above to start.
            </div>
          ) : (
            <>
              <ScoreGrid zones={selected} />
              <PillarGrid zones={selected} />
              <TrendCard zones={selected} range={range} onRange={setRange} />
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ZonePicker({
  zones,
  selectedIds,
  onAdd,
  onRemove,
}: {
  zones: Zone[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const remaining = zones.filter((z) => !selectedIds.includes(z.id));

  return (
    <div className="rounded-card border border-border p-3 space-y-3 bg-[rgba(255,255,255,0.02)]">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id, i) => {
            const z = zones.find((z) => z.id === id);
            if (!z) return null;
            return (
              <button
                key={id}
                onClick={() => onRemove(id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-ink-1"
                style={{
                  background: `${SERIES_COLORS[i]}22`,
                  border: `1px solid ${SERIES_COLORS[i]}44`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: SERIES_COLORS[i] }}
                />
                {z.name}
                <X size={10} className="opacity-60" />
              </button>
            );
          })}
        </div>
      )}

      {selectedIds.length < MAX_ZONES && (
        <div>
          <div className="text-[9.5px] text-ink-4 uppercase tracking-[0.08em] mb-1.5">
            Add zone{selectedIds.length > 0 ? "" : "s"} to compare
          </div>
          <div className="flex flex-wrap gap-1.5">
            {remaining.map((z) => (
              <button
                key={z.id}
                onClick={() => onAdd(z.id)}
                className="px-2 py-1 rounded-full text-[10.5px] bg-[rgba(255,255,255,0.04)] border border-border text-ink-2 hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              >
                {z.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreGrid({ zones }: { zones: Zone[] }) {
  return (
    <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${zones.length}, minmax(0, 1fr))` }}>
      {zones.map((z, i) => {
        const color = scoreColor(z.score);
        return (
          <div
            key={z.id}
            className="rounded-card border border-border p-3 bg-[rgba(255,255,255,0.02)]"
          >
            <div className="text-[9.5px] text-ink-4 uppercase tracking-[0.08em]">Sub-county</div>
            <div className="text-[14px] font-semibold text-ink-1 truncate">{z.name}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold tabular-nums" style={{ color }}>
                {z.score}
              </span>
              <span className="text-[10px] text-ink-4">/100</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[9.5px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                Series {i + 1}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PillarGrid({ zones }: { zones: Zone[] }) {
  return (
    <div className="mt-3 rounded-card border border-border p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-2">Pillar breakdown</div>
      <div className="space-y-2">
        {PILLAR_KEYS.map((k) => (
          <div key={k}>
            <div className="flex items-center gap-2 text-[10.5px] mb-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: PILLAR_COLORS[k] }}
              />
              <span className="text-ink-2">{PILLAR_SHORT[k]}</span>
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${zones.length}, minmax(0, 1fr))` }}>
              {zones.map((z, i) => (
                <div key={z.id} className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${z.pillars[k]}%`,
                        background: SERIES_COLORS[i],
                        boxShadow: `0 0 6px ${SERIES_COLORS[i]}66`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-ink-2 w-6 text-right">{z.pillars[k]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendCard({
  zones,
  range,
  onRange,
}: {
  zones: Zone[];
  range: HistoryRange;
  onRange: (r: HistoryRange) => void;
}) {
  return (
    <div className="mt-3 rounded-card border border-border p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em]">Score history</div>
        <div className="flex items-center gap-0.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => onRange(r.key)}
              className={`px-2 py-0.5 rounded-full text-[9.5px] font-medium transition-colors ${
                range === r.key ? "bg-[rgba(255,255,255,0.14)] text-ink-1" : "text-ink-4 hover:text-ink-2"
              }`}
              aria-pressed={range === r.key}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ComparisonChart zones={zones} range={range} />
    </div>
  );
}

function ComparisonChart({ zones, range }: { zones: Zone[]; range: HistoryRange }) {
  // Rules of hooks: always call the hook MAX_ZONES times regardless of how
  // many zones are actually selected. Missing zones pass null and the hook
  // returns { data: undefined } thanks to the enabled flag.
  const s1 = useZoneHistory(zones[0]?.id ?? null, range);
  const s2 = useZoneHistory(zones[1]?.id ?? null, range);
  const s3 = useZoneHistory(zones[2]?.id ?? null, range);
  const series = [s1, s2, s3].slice(0, zones.length);
  const ready = series.every((s) => s.data);

  const merged = useMemo(() => {
    if (!ready) return [];
    const anchor = series[0].data!;
    return anchor.points.map((p, idx) => {
      const row: Record<string, unknown> = { label: formatTick(p.t, range) };
      series.forEach((s, i) => {
        row[`score${i}`] = s.data!.points[idx]?.score;
      });
      return row;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s1.data, s2.data, s3.data, range, ready]);

  if (!ready) {
    return <div className="h-[220px] rounded-control bg-[rgba(255,255,255,0.03)] animate-pulse" />;
  }
  if (merged.length < 2) {
    return (
      <div className="h-[220px] grid place-items-center text-[11px] text-ink-4">
        Not enough shared history to plot yet.
      </div>
    );
  }

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={26}
            ticks={[0, 50, 100]}
          />
          <Tooltip
            contentStyle={{ background: "rgba(11,34,53,0.94)", border: `1px solid ${BRAND.navyRaised}`, borderRadius: 6, fontSize: 11 }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(value: unknown, key: unknown) => {
              const i = Number(String(key).replace("score", ""));
              return [String(value), zones[i]?.name ?? key];
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}
            formatter={(_v, entry) => {
              const i = Number(String(entry.dataKey).replace("score", ""));
              return zones[i]?.name ?? "";
            }}
          />
          {zones.map((_z, i) => (
            <Line
              key={i}
              type="monotone"
              dataKey={`score${i}`}
              stroke={SERIES_COLORS[i]}
              strokeWidth={1.6}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTick(iso: string, range: HistoryRange): string {
  const d = new Date(iso);
  if (range === "day") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

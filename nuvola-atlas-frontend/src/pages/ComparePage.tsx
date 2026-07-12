import { useEffect, useMemo, useState } from "react";
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
import { AlertTriangle, Droplets, HardHat, RefreshCcw, TrendingUp, X } from "lucide-react";
import AppShell from "@/components/chrome/AppShell";
import CompareAssistant from "@/components/chat/CompareAssistant";
import { api } from "@/api";
import { useAtlasStore } from "@/stores/atlas";
import { useChatStore } from "@/stores/chat";
import { useChromeStore } from "@/stores/chrome";
import { useZoneHistory } from "@/hooks/useZoneHistory";
import { useZoneForecast } from "@/hooks/useZoneForecast";
import { waterProfile } from "@/lib/waterSanitation";
import { BRAND, PILLAR_COLORS, PILLAR_SHORT, scoreColor } from "@/lib/scoreColor";
import type { AlertItem, AlertSeverity, HistoryRange, PillarKey, Project, Zone } from "@/types";

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
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [range, setRange] = useState<HistoryRange>("week");

  const selected = useMemo(
    () => selectedIds.map((id) => zones.find((z) => z.id === id)).filter((z): z is Zone => Boolean(z)),
    [selectedIds, zones],
  );

  // Mirror the picked zones into the atlas store so the Assistant panel (and
  // the mock chat stream) can craft answers scoped to what's on screen.
  const setCompareZoneIds = useAtlasStore((s) => s.setCompareZoneIds);
  useEffect(() => {
    setCompareZoneIds(selectedIds);
    return () => setCompareZoneIds([]);
  }, [selectedIds, setCompareZoneIds]);

  // Auto-collapse the sidebar when the user opens the Compare page — the
  // comparison grid is dense and needs the horizontal real estate. Restore
  // the previous state on unmount so users don't get stuck in collapsed mode.
  useEffect(() => {
    const chrome = useChromeStore.getState();
    const wasCollapsed = chrome.sidebarCollapsed;
    if (!wasCollapsed) chrome.setSidebarCollapsed(true);
    return () => {
      if (!wasCollapsed) chrome.setSidebarCollapsed(false);
    };
  }, []);

  const addZone = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_ZONES) return;
    setSelectedIds([...selectedIds, id]);
  };
  const removeZone = (id: string) => {
    setSelectedIds(selectedIds.filter((s) => s !== id));
  };

  // Reset the whole compare surface: no zones, no active conversation.
  // The Assistant panel drops back to its starter prompts, and the grids
  // re-collapse to the "Pick a zone" empty state.
  const setChatActive = useChatStore((s) => s.setActive);
  const startNewComparison = () => {
    setSelectedIds([]);
    setRange("week");
    setChatActive(null);
  };

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <header className="mb-5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.12em]">Compare</div>
                <h1 className="text-[22px] font-semibold text-ink-1 leading-tight">Side-by-side zone comparison</h1>
                <p className="mt-1.5 text-[12px] text-ink-3 max-w-[68ch]">
                  Pick up to {MAX_ZONES} Nairobi sub-counties to compare their Vitality Score, pillar
                  breakdown, and score history side by side.
                </p>
              </div>
              <button
                onClick={startNewComparison}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-8 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-[11.5px] font-semibold text-ink-2 hover:text-ink-1 hover:bg-[rgba(255,255,255,0.08)] transition-colors btn-press"
                aria-label="Start a new comparison and reset the assistant"
                title="Clears the picked zones and starts a fresh assistant chat"
              >
                <RefreshCcw size={12} />
                <span className="hidden sm:inline">New comparison</span>
                <span className="sm:hidden">New</span>
              </button>
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
                <DeltaGrid zones={selected} />
                <PillarGrid zones={selected} />
                <WaterGrid zones={selected} />
                <TrendCard zones={selected} range={range} onRange={setRange} />
                <ProjectsGrid zones={selected} projects={projects} />
                <AlertsGrid zones={selected} alerts={alerts} />
              </>
            )}
          </div>

          <CompareAssistant zones={selected} />
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
  const [forecastOn, setForecastOn] = useState(false);
  const [pillarOverlay, setPillarOverlay] = useState<PillarKey | null>(null);

  return (
    <div className="mt-3 rounded-card border border-border p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em]">Score history</div>
        <div className="ml-auto flex items-center gap-1.5 flex-wrap">
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
            <TrendingUp size={9} /> Forecast
          </button>
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
      </div>
      <ComparisonChart zones={zones} range={range} forecastOn={forecastOn} pillarOverlay={pillarOverlay} />
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="text-[9px] text-ink-4 uppercase tracking-[0.08em] mr-1">Pillar overlay</span>
        <button
          onClick={() => setPillarOverlay(null)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium transition-colors border ${
            pillarOverlay === null
              ? "text-ink-1 bg-[rgba(255,255,255,0.08)] border-border"
              : "text-ink-4 border-border hover:text-ink-2"
          }`}
        >
          Score
        </button>
        {PILLAR_KEYS.map((k) => {
          const on = pillarOverlay === k;
          return (
            <button
              key={k}
              onClick={() => setPillarOverlay(k)}
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
    </div>
  );
}

function DeltaGrid({ zones }: { zones: Zone[] }) {
  return (
    <div className="mt-3 rounded-card border border-border p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-2">Quarter-over-quarter change</div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${zones.length}, minmax(0, 1fr))` }}>
        {zones.map((z, i) => {
          const total = z.deltas.social + z.deltas.safety + z.deltas.density + z.deltas.infra;
          const avg = Math.round(total / 4);
          const color = avg >= 0 ? BRAND.teal : BRAND.rose;
          return (
            <div key={z.id} className="rounded-control bg-[rgba(255,255,255,0.03)] p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                <span className="text-[10.5px] text-ink-3 truncate">{z.name}</span>
                <span className="ml-auto text-[11px] font-semibold tabular-nums" style={{ color }}>
                  {avg >= 0 ? "▲" : "▼"} {Math.abs(avg)}
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-4 gap-1 text-[9px]">
                {PILLAR_KEYS.map((k) => {
                  const d = z.deltas[k];
                  const c = d >= 0 ? BRAND.teal : BRAND.rose;
                  return (
                    <div key={k} className="rounded-chip bg-[rgba(255,255,255,0.02)] py-1 text-center">
                      <div className="text-ink-4 uppercase tracking-[0.05em]">{PILLAR_SHORT[k]}</div>
                      <div className="tabular-nums font-medium" style={{ color: c }}>
                        {d >= 0 ? "+" : ""}{d}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WaterGrid({ zones }: { zones: Zone[] }) {
  return (
    <div className="mt-3 rounded-card border border-border p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-1.5 mb-2">
        <Droplets size={12} style={{ color: BRAND.teal }} />
        <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em]">Water &amp; Sanitation · SDG 6</div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${zones.length}, minmax(0, 1fr))` }}>
        {zones.map((z, i) => {
          const wp = waterProfile(z);
          const accent = wp.opportunity ? BRAND.teal : BRAND.steel;
          return (
            <div key={z.id} className="rounded-control p-2.5 border" style={{ background: `${accent}0F`, borderColor: `${accent}33` }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                <span className="text-[10.5px] text-ink-2 font-medium truncate">{z.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 mb-1.5">
                <StatCell value={`${wp.accessPct}%`} label="Access" />
                <StatCell value={`${wp.sharedPointPct}%`} label="Shared" />
                <StatCell value={`${wp.waitMin}m`} label="Queue" />
              </div>
              <div className="text-[9px] text-ink-3 leading-tight">
                <span className="font-semibold px-1.5 py-0.5 rounded-full mr-1" style={{ background: accent, color: BRAND.bone }}>
                  {wp.solutionTag}
                </span>
                {wp.contextLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-chip bg-[rgba(255,255,255,0.04)] py-1 text-center">
      <div className="text-[11px] font-semibold tabular-nums text-ink-1">{value}</div>
      <div className="text-[8px] text-ink-4 uppercase tracking-[0.05em]">{label}</div>
    </div>
  );
}

function ProjectsGrid({ zones, projects }: { zones: Zone[]; projects: Project[] }) {
  return (
    <div className="mt-3 rounded-card border border-border p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-1.5 mb-2">
        <HardHat size={12} style={{ color: BRAND.terracotta }} />
        <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em]">Infrastructure projects</div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${zones.length}, minmax(0, 1fr))` }}>
        {zones.map((z, i) => {
          const zoneProjects = projects.filter((p) => p.zoneId === z.id);
          const active = zoneProjects.filter((p) => p.status === "active").length;
          const stalled = zoneProjects.filter((p) => p.status === "stalled").length;
          const planned = zoneProjects.filter((p) => p.status === "planned").length;
          return (
            <div key={z.id} className="rounded-control bg-[rgba(255,255,255,0.03)] p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                <span className="text-[10.5px] text-ink-2 font-medium truncate">{z.name}</span>
                <span className="ml-auto text-[11px] font-semibold tabular-nums text-ink-1">
                  {zoneProjects.length}
                </span>
              </div>
              <div className="flex gap-1 mb-1.5 text-[9px]">
                <StatusPill color={BRAND.teal} label="Active" n={active} />
                <StatusPill color={BRAND.rose} label="Stalled" n={stalled} />
                <StatusPill color={BRAND.steel} label="Planned" n={planned} />
              </div>
              {zoneProjects.length === 0 ? (
                <div className="text-[9.5px] text-ink-4 italic">No tracked projects.</div>
              ) : (
                <ul className="space-y-1">
                  {zoneProjects.slice(0, 3).map((p) => (
                    <li key={p.id} className="text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="flex-1 min-w-0 truncate text-ink-2">{p.name}</span>
                        <span className="tabular-nums text-ink-3 shrink-0">{p.progress}%</span>
                      </div>
                      <div className="h-[2px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden mt-0.5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${p.progress}%`,
                            background: p.status === "stalled" ? BRAND.rose : BRAND.terracotta,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                  {zoneProjects.length > 3 && (
                    <li className="text-[9px] text-ink-4">+ {zoneProjects.length - 3} more</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-chip font-semibold"
      style={{ background: `${color}18`, color }}
    >
      {n} <span className="text-ink-4 font-normal">{label}</span>
    </span>
  );
}

function AlertsGrid({ zones, alerts }: { zones: Zone[]; alerts: AlertItem[] }) {
  const severityColor: Record<AlertSeverity, string> = {
    high: BRAND.rose,
    medium: BRAND.gold,
    low: BRAND.steel,
  };
  return (
    <div className="mt-3 rounded-card border border-border p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-1.5 mb-2">
        <AlertTriangle size={12} style={{ color: BRAND.gold }} />
        <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em]">Active alerts</div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${zones.length}, minmax(0, 1fr))` }}>
        {zones.map((z, i) => {
          const zoneAlerts = alerts.filter((a) => a.zoneId === z.id);
          const bySeverity: Record<AlertSeverity, number> = {
            high: zoneAlerts.filter((a) => a.severity === "high").length,
            medium: zoneAlerts.filter((a) => a.severity === "medium").length,
            low: zoneAlerts.filter((a) => a.severity === "low").length,
          };
          return (
            <div key={z.id} className="rounded-control bg-[rgba(255,255,255,0.03)] p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                <span className="text-[10.5px] text-ink-2 font-medium truncate">{z.name}</span>
                <span className="ml-auto text-[11px] font-semibold tabular-nums text-ink-1">
                  {zoneAlerts.length}
                </span>
              </div>
              <div className="flex gap-1 mb-1.5 text-[9px]">
                {(["high", "medium", "low"] as AlertSeverity[]).map((s) => (
                  <StatusPill key={s} color={severityColor[s]} label={s} n={bySeverity[s]} />
                ))}
              </div>
              {zoneAlerts.length === 0 ? (
                <div className="text-[9.5px] text-ink-4 italic">No active alerts.</div>
              ) : (
                <ul className="space-y-0.5">
                  {zoneAlerts.slice(0, 3).map((a) => (
                    <li key={a.id} className="text-[10px] flex items-start gap-1">
                      <span
                        className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                        style={{ background: severityColor[a.severity] }}
                      />
                      <span className="text-ink-2 leading-snug truncate">{a.title}</span>
                    </li>
                  ))}
                  {zoneAlerts.length > 3 && (
                    <li className="text-[9px] text-ink-4">+ {zoneAlerts.length - 3} more</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonChart({
  zones, range, forecastOn = false, pillarOverlay = null,
}: {
  zones: Zone[];
  range: HistoryRange;
  forecastOn?: boolean;
  pillarOverlay?: PillarKey | null;
}) {
  // Rules of hooks: always call the hook MAX_ZONES times regardless of how
  // many zones are actually selected. Missing zones pass null and the hook
  // returns { data: undefined } thanks to the enabled flag.
  const s1 = useZoneHistory(zones[0]?.id ?? null, range);
  const s2 = useZoneHistory(zones[1]?.id ?? null, range);
  const s3 = useZoneHistory(zones[2]?.id ?? null, range);
  // Same hook-order rule for the forecast — always three calls.
  const f1 = useZoneForecast(zones[0]?.id ?? null, 14, forecastOn);
  const f2 = useZoneForecast(zones[1]?.id ?? null, 14, forecastOn);
  const f3 = useZoneForecast(zones[2]?.id ?? null, 14, forecastOn);
  const series = [s1, s2, s3].slice(0, zones.length);
  const forecasts = [f1, f2, f3].slice(0, zones.length);
  const ready = series.every((s) => s.data);

  // Series key — either the composite score, or one pillar-name field per point.
  const seriesKey = pillarOverlay ?? "score";

  const merged = useMemo(() => {
    if (!ready) return [];
    const anchor = series[0].data!;
    const historical = anchor.points.map((p, idx) => {
      const row: Record<string, unknown> = { label: formatTick(p.t, range), phase: "history" };
      series.forEach((s, i) => {
        const point = s.data!.points[idx];
        if (!point) return;
        row[`v${i}`] = pillarOverlay ? point.pillars[pillarOverlay] : point.score;
      });
      return row;
    });

    if (!forecastOn) return historical;
    // Forecast is composite-score-only in the current data contract, so
    // pillar-overlay + forecast doesn't add a projected line — just the
    // historical pillar shows. That's a fine trade-off for a v1.
    if (pillarOverlay) return historical;

    const projected: Record<string, unknown>[] = [];
    const anchorPointCount = anchor.points.length;
    const maxForecastLen = Math.max(...forecasts.map((f) => f.data?.points.length ?? 0));
    for (let idx = 0; idx < maxForecastLen; idx++) {
      const row: Record<string, unknown> = { label: "+" + (idx + 1) + (range === "day" ? "h" : "d"), phase: "forecast" };
      forecasts.forEach((f, i) => {
        const point = f.data?.points[idx];
        if (!point) return;
        row[`f${i}`] = point.score;
        row[`fLower${i}`] = point.lower;
        row[`fUpper${i}`] = point.upper;
      });
      // Anchor the first forecast point on the last historical point per
      // series so the two segments connect visually.
      if (idx === 0 && historical.length > 0) {
        const lastRow = historical[anchorPointCount - 1];
        series.forEach((_s, i) => {
          if (row[`f${i}`] === undefined) return;
          if (lastRow && lastRow[`v${i}`] !== undefined) {
            (lastRow as Record<string, unknown>)[`f${i}`] = lastRow[`v${i}`];
          }
        });
      }
      projected.push(row);
    }
    return [...historical, ...projected];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s1.data, s2.data, s3.data, f1.data, f2.data, f3.data, range, ready, forecastOn, pillarOverlay]);

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
              const k = String(key);
              const suffix = pillarOverlay ? " · " + PILLAR_SHORT[pillarOverlay] : "";
              if (k.startsWith("f")) {
                const i = Number(k.replace(/^f/, ""));
                return [String(value), (zones[i]?.name ?? key) + " (forecast)"];
              }
              const i = Number(k.replace("v", ""));
              return [String(value), (zones[i]?.name ?? key) + suffix];
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}
            formatter={(_v, entry) => {
              const k = String(entry.dataKey);
              const i = Number(k.replace(/^[vf]/, ""));
              return zones[i]?.name ?? "";
            }}
          />
          {zones.map((_z, i) => (
            <Line
              key={`v${i}`}
              type="monotone"
              dataKey={`v${i}`}
              stroke={pillarOverlay ? PILLAR_COLORS[pillarOverlay] : SERIES_COLORS[i]}
              strokeWidth={1.6}
              strokeOpacity={pillarOverlay ? 0.35 + (i * 0.25) : 1}
              dot={false}
              connectNulls
            />
          ))}
          {forecastOn && !pillarOverlay && zones.map((_z, i) => (
            <Line
              key={`f${i}`}
              type="monotone"
              dataKey={`f${i}`}
              stroke={SERIES_COLORS[i]}
              strokeWidth={1.2}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
              legendType="none"
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

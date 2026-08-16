import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CircleDashed, Clock, Signal } from "lucide-react";
import { api } from "@/api";
import { INDICATORS, zoneIndicatorSummary } from "@/lib/indicators";
import { BRAND } from "@/lib/scoreColor";
import type { Zone } from "@/types";

const FEEDS: { name: string; source: string; expectedFreqMin: number; lastMinAgo: number }[] = [
  {
    name: "Daystar",
    source: "Daystar University data-access partnership",
    expectedFreqMin: 60 * 24,
    lastMinAgo: 42,
  },
  { name: "KURA", source: "Kenya Urban Roads Authority", expectedFreqMin: 60 * 24, lastMinAgo: 9 },
  {
    name: "KeNHA",
    source: "Kenya National Highways Authority",
    expectedFreqMin: 60 * 24,
    lastMinAgo: 18,
  },
  {
    name: "KPLC",
    source: "Kenya Power & Lighting Company",
    expectedFreqMin: 60 * 6,
    lastMinAgo: 6,
  },
  {
    name: "KETRACO",
    source: "Kenya Electricity Transmission Company",
    expectedFreqMin: 60 * 24,
    lastMinAgo: 33,
  },
  {
    name: "NPS",
    source: "National Police Service quarterly reports",
    expectedFreqMin: 60 * 24 * 90,
    lastMinAgo: 60 * 24 * 45,
  },
  {
    name: "KNBS",
    source: "Kenya National Bureau of Statistics",
    expectedFreqMin: 60 * 24 * 365,
    lastMinAgo: 60 * 24 * 30,
  },
  {
    name: "NEMA",
    source: "National Environment Management Authority",
    expectedFreqMin: 60 * 24 * 30,
    lastMinAgo: 60 * 24 * 3,
  },
  {
    name: "NCWSC",
    source: "Nairobi City Water & Sewerage Company",
    expectedFreqMin: 60 * 24,
    lastMinAgo: 12,
  },
  {
    name: "Athi Water",
    source: "Athi Water Works Development Agency",
    expectedFreqMin: 60 * 24,
    lastMinAgo: 20,
  },
  {
    name: "ICTA",
    source: "ICT Authority connectivity feeds",
    expectedFreqMin: 60 * 6,
    lastMinAgo: 4,
  },
];

function stalenessBucket(lastMinAgo: number, expectedFreqMin: number): "fresh" | "amber" | "stale" {
  if (lastMinAgo <= expectedFreqMin * 1.5) return "fresh";
  if (lastMinAgo <= expectedFreqMin * 3) return "amber";
  return "stale";
}

function formatAge(min: number): string {
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function DataFeedsMatrix() {
  const { data: zones = [] } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });

  return (
    <div className="space-y-4">
      {/* Feed health tiles — every ingestion source at a glance */}
      <section>
        <div className="text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
          <Signal size={11} /> Ingestion feed health · {FEEDS.length} sources
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {FEEDS.map((f) => {
            const bucket = stalenessBucket(f.lastMinAgo, f.expectedFreqMin);
            const bucketColor =
              bucket === "fresh" ? BRAND.teal : bucket === "amber" ? BRAND.gold : BRAND.rose;
            return (
              <div
                key={f.name}
                className="rounded-card border border-border p-2.5 bg-[rgba(255,255,255,0.02)]"
                title={f.source}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full pulse-glow shrink-0"
                    style={{ background: bucketColor, boxShadow: `0 0 6px ${bucketColor}88` }}
                  />
                  <span className="text-[11px] font-semibold text-ink-1 truncate">{f.name}</span>
                  <span className="ml-auto text-[9.5px] text-ink-4 tabular-nums">
                    {formatAge(f.lastMinAgo)}
                  </span>
                </div>
                <div className="mt-1 text-[9.5px] text-ink-4 truncate">{f.source}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Zone × indicator matrix */}
      <section>
        <div className="text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-2">
          Zone × indicator delivery matrix
        </div>
        <div className="overflow-x-auto rounded-card border border-border bg-[rgba(255,255,255,0.02)] max-w-full">
          {/* On mobile the swipe hint helps users find that the matrix scrolls sideways */}
          <div className="sm:hidden text-[9px] text-ink-4 uppercase tracking-[0.08em] px-2.5 pt-1.5">
            Swipe horizontally →
          </div>
          <table className="w-full text-[10.5px]">
            <thead>
              <tr className="text-ink-4">
                <th className="text-left px-2.5 py-1.5 font-medium sticky left-0 z-10 min-w-[110px] sm:min-w-[140px] bg-atlas-base shadow-[2px_0_6px_rgba(0,0,0,0.4)]">
                  Zone
                </th>
                {INDICATORS.map((ind) => (
                  <th
                    key={ind.key}
                    className="text-center px-1.5 py-1.5 font-medium min-w-[42px]"
                    title={ind.label}
                  >
                    {ind.label.split(" ").slice(0, 2).join(" ")}
                  </th>
                ))}
                <th className="text-right px-2.5 py-1.5 font-medium min-w-[70px]">Delivered</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z: Zone) => {
                const summary = zoneIndicatorSummary(z.id);
                return (
                  <tr key={z.id} className="border-t border-border">
                    <td className="text-left px-2.5 py-1.5 text-ink-1 font-medium sticky left-0 z-10 truncate bg-atlas-base shadow-[2px_0_6px_rgba(0,0,0,0.4)]">
                      {z.name}
                    </td>
                    {summary.states.map((s) => {
                      const icon =
                        s.availability === "delivered" ? (
                          <BadgeCheck size={11} style={{ color: BRAND.teal }} />
                        ) : s.availability === "pending" ? (
                          <CircleDashed size={11} style={{ color: BRAND.gold }} />
                        ) : (
                          <Clock size={11} style={{ color: BRAND.steel }} />
                        );
                      return (
                        <td
                          key={s.key}
                          className="text-center px-1 py-1.5"
                          title={`${s.label} · ${s.availability}`}
                        >
                          <span className="inline-flex">{icon}</span>
                        </td>
                      );
                    })}
                    <td className="text-right px-2.5 py-1.5 text-ink-2 tabular-nums">
                      {summary.delivered}/{summary.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[9.5px] text-ink-3">
          <span className="inline-flex items-center gap-1">
            <BadgeCheck size={10} style={{ color: BRAND.teal }} /> Delivered
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleDashed size={10} style={{ color: BRAND.gold }} /> In pipeline
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={10} style={{ color: BRAND.steel }} /> Awaiting Daystar
          </span>
        </div>
      </section>
    </div>
  );
}

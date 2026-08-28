import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CircleDashed, CircleSlash, Clock, Signal } from "lucide-react";
import { adminApi, type FeedRow, type FeedState } from "@/api/admin";
import { PILLARS } from "@/domain/pillars.generated";
import { BRAND } from "@/lib/scoreColor";
import type { PillarKey } from "@/domain/types";

const STATE_STYLE: Record<
  FeedState,
  { color: string; label: string; Icon: typeof BadgeCheck; note: string }
> = {
  fresh: { color: BRAND.teal, label: "Within SLA", Icon: BadgeCheck, note: "Delivered on schedule" },
  stale: { color: BRAND.gold, label: "Past SLA", Icon: CircleDashed, note: "Late, under 3× the SLA" },
  overdue: { color: BRAND.rose, label: "Overdue", Icon: Clock, note: "More than 3× the SLA late" },
  missing: {
    color: BRAND.steel,
    label: "Never delivered",
    Icon: CircleSlash,
    note: "Registered but no delivery yet",
  },
};

const STATE_ORDER: FeedState[] = ["fresh", "stale", "overdue", "missing"];

function formatAge(min: number): string {
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function DataFeedsMatrix() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "feeds"], queryFn: adminApi.feeds });

  const feeds = data?.feeds ?? [];
  const summary = data?.summary;

  // One cell per (sub-county, pillar). Rows come from the feed table itself,
  // so a sub-county with nothing registered is absent rather than shown as a
  // row of empty promises.
  const byCell = new Map<string, FeedRow>();
  const zones = new Map<string, string>();
  for (const f of feeds) {
    byCell.set(`${f.zone_id}:${f.pillar_key}`, f);
    zones.set(f.zone_id, f.zone_name ?? f.zone_id);
  }
  const zoneRows = [...zones.entries()].sort((a, b) => a[1].localeCompare(b[1]));

  const sources = [...new Set(feeds.map((f) => f.source_system).filter(Boolean))] as string[];

  if (isLoading) {
    return <div className="text-[11px] text-ink-4">Reading feed status…</div>;
  }

  if (!summary || summary.total === 0) {
    return (
      <div className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-4">
        <div className="text-[11px] font-semibold text-ink-1">No feed rows registered</div>
        <p className="mt-1 text-[10.5px] text-ink-4 leading-[1.55]">
          Nothing is being tracked in <code className="text-ink-3">data_feed_status</code> yet.
          Freshness is measured from real deliveries, so there is nothing to show rather than a
          default set of green tiles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <div className="text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
          <Signal size={11} /> Feed health · {summary.total} tracked
          {sources.length > 0 && ` · ${sources.length} sources`}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {STATE_ORDER.map((state) => {
            const st = STATE_STYLE[state];
            return (
              <div
                key={state}
                className="rounded-card border border-border p-2.5 bg-[rgba(255,255,255,0.02)]"
                title={st.note}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: st.color, boxShadow: `0 0 6px ${st.color}88` }}
                  />
                  <span className="text-[11px] font-semibold text-ink-1 truncate">{st.label}</span>
                  <span
                    className="ml-auto text-[13px] font-semibold tabular-nums"
                    style={{ color: st.color }}
                  >
                    {summary[state]}
                  </span>
                </div>
                <div className="mt-1 text-[9.5px] text-ink-4 truncate">{st.note}</div>
              </div>
            );
          })}
        </div>
        {sources.length > 0 && (
          <p className="mt-2 text-[9.5px] text-ink-4">Sources · {sources.join(" · ")}</p>
        )}
      </section>

      <section>
        <div className="text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-2">
          Sub-county × pillar delivery
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
                  Sub-county
                </th>
                {PILLARS.map((p) => (
                  <th
                    key={p.key}
                    className="text-center px-1.5 py-1.5 font-medium min-w-[64px]"
                    title={`${p.displayName} · ${p.sourceId ?? "no source"}`}
                  >
                    {p.displayName.split(" ")[0]}
                  </th>
                ))}
                <th className="text-right px-2.5 py-1.5 font-medium min-w-[70px]">Within SLA</th>
              </tr>
            </thead>
            <tbody>
              {zoneRows.map(([zoneId, zoneName]) => {
                const cells = PILLARS.map((p) => byCell.get(`${zoneId}:${p.key as PillarKey}`));
                const tracked = cells.filter(Boolean).length;
                const fresh = cells.filter((c) => c?.state === "fresh").length;
                return (
                  <tr key={zoneId} className="border-t border-border">
                    <td className="text-left px-2.5 py-1.5 text-ink-1 font-medium sticky left-0 z-10 truncate bg-atlas-base shadow-[2px_0_6px_rgba(0,0,0,0.4)]">
                      {zoneName}
                    </td>
                    {PILLARS.map((p, i) => {
                      const cell = cells[i];
                      if (!cell) {
                        return (
                          <td
                            key={p.key}
                            className="text-center px-1 py-1.5 text-ink-4"
                            title={`${p.displayName} · no feed registered for this sub-county`}
                          >
                            —
                          </td>
                        );
                      }
                      const st = STATE_STYLE[cell.state];
                      const age = cell.age_min === null ? "never" : formatAge(cell.age_min);
                      return (
                        <td
                          key={p.key}
                          className="text-center px-1 py-1.5"
                          title={`${cell.feed_name} · ${st.label} · ${age} · ${cell.verified_records} verified records`}
                        >
                          <span className="inline-flex">
                            <st.Icon size={11} style={{ color: st.color }} />
                          </span>
                        </td>
                      );
                    })}
                    <td className="text-right px-2.5 py-1.5 text-ink-2 tabular-nums">
                      {fresh}/{tracked}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[9.5px] text-ink-3">
          {STATE_ORDER.map((state) => {
            const st = STATE_STYLE[state];
            return (
              <span key={state} className="inline-flex items-center gap-1">
                <st.Icon size={10} style={{ color: st.color }} /> {st.label}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1 text-ink-4">— No feed registered</span>
        </div>
      </section>
    </div>
  );
}

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BRAND } from "@/lib/scoreColor";

type Row = Record<string, unknown>;

interface Props {
  rows: Row[];
}

/**
 * Auto-picks a chart shape from the result rows:
 *  - {t|captured_at|month, <numeric>} → line chart
 *  - {name|zone_id|zone, <numeric>}   → bar chart
 *  - single row                        → KPI tiles
 *  - anything else                     → compact table
 */
export default function ResultChart({ rows }: Props) {
  const shape = useMemo(() => classifyShape(rows), [rows]);

  if (!rows.length) return null;

  if (shape.kind === "kpi") {
    const row = rows[0];
    const entries = Object.entries(row).filter(([, v]) => typeof v === "number" || typeof v === "string");
    return (
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {entries.slice(0, 4).map(([k, v]) => (
          <div key={k} className="rounded-control bg-[rgba(255,255,255,0.04)] px-2 py-1.5">
            <div className="text-[8.5px] text-ink-4 uppercase tracking-[0.05em] truncate">{k}</div>
            <div className="text-[12.5px] font-semibold text-ink-1 tabular-nums truncate">{String(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (shape.kind === "line") {
    return (
      <div className="mt-2 h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={shape.data as Array<{ label: string; value: number }>} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} axisLine={false} tickLine={false} minTickGap={12} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} axisLine={false} tickLine={false} width={22} />
            <Tooltip contentStyle={{ background: "rgba(11,34,53,0.94)", border: `1px solid ${BRAND.navyRaised}`, borderRadius: 6, fontSize: 10 }} />
            <Line type="monotone" dataKey="value" stroke={BRAND.teal} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (shape.kind === "bar") {
    return (
      <div className="mt-2 h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={shape.data as Array<{ label: string; value: number }>} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} axisLine={false} tickLine={false} width={22} />
            <Tooltip contentStyle={{ background: "rgba(11,34,53,0.94)", border: `1px solid ${BRAND.navyRaised}`, borderRadius: 6, fontSize: 10 }} />
            <Bar dataKey="value" fill={BRAND.terracotta} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Table fallback — first 5 rows.
  const cols = Object.keys(rows[0]).slice(0, 4);
  return (
    <div className="mt-2 rounded-control bg-[rgba(255,255,255,0.03)] overflow-hidden">
      <table className="w-full text-[10px] tabular-nums">
        <thead>
          <tr className="text-ink-4">
            {cols.map((c) => (
              <th key={c} className="text-left px-2 py-1 font-medium uppercase tracking-[0.05em] text-[8.5px]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 5).map((r, i) => (
            <tr key={i} className="border-t border-border">
              {cols.map((c) => (
                <td key={c} className="px-2 py-1 text-ink-2 truncate">{String(r[c] ?? "—")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Shape =
  | { kind: "line"; data: Array<{ label: string; value: number }> }
  | { kind: "bar"; data: Array<{ label: string; value: number }> }
  | { kind: "kpi" }
  | { kind: "table" };

function classifyShape(rows: Row[]): Shape {
  if (rows.length === 0) return { kind: "table" };
  if (rows.length === 1) return { kind: "kpi" };

  const first = rows[0];
  const timeKey = ["t", "captured_at", "month", "date", "bucket"].find((k) => k in first);
  const labelKey = ["name", "zone_id", "zone", "id"].find((k) => k in first);
  const numericKey = Object.keys(first).find((k) => typeof first[k] === "number" && k !== timeKey && k !== labelKey);

  if (timeKey && numericKey) {
    return {
      kind: "line",
      data: rows.map((r) => ({
        label: String(r[timeKey]).slice(5, 10),
        value: Number(r[numericKey]),
      })),
    };
  }
  if (labelKey && numericKey) {
    return {
      kind: "bar",
      data: rows.map((r) => ({
        label: String(r[labelKey]),
        value: Number(r[numericKey]),
      })),
    };
  }
  return { kind: "table" };
}

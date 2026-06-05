import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type AuditEntry } from "@/api/admin";
import { cn } from "@/lib/cn";

const ACTION_COLOR: Record<string, string> = {
  "auth.sign_in": "text-ink-3",
  "auth.sign_out": "text-ink-4",
  "auth.two_factor_enabled": "text-success",
  "auth.two_factor_disabled": "text-warning",
  "auth.two_factor_challenged": "text-ink-3",
  "auth.two_factor_verified": "text-success",
  "report.created": "text-accent",
  "alert.bulk_read": "text-ink-3",
  "api_key.created": "text-warning",
  "api_key.revoked": "text-danger",
};

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default function AuditTable() {
  const [actionFilter, setActionFilter] = useState<string>("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "audit", actionFilter],
    queryFn: () => adminApi.audit(null, actionFilter || undefined),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action (e.g. auth.sign_in)"
          className="flex-1 h-9 px-3 rounded-control bg-[rgba(255,255,255,0.04)] text-[13px] text-ink-1 placeholder-ink-4 outline-none focus:ring-1 focus:ring-accent"
        />
        {actionFilter && (
          <button
            onClick={() => setActionFilter("")}
            className="px-3 h-9 rounded-control text-[12px] text-ink-3 hover:text-ink-2"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading && <div className="text-[13px] text-ink-3 py-6 text-center">Loading audit log…</div>}
      {isError && <div className="text-[13px] text-danger py-6 text-center">Failed to load audit log.</div>}

      {data && (
        <div className="glass rounded-control overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="text-ink-4 text-[11px] uppercase tracking-[0.06em]">
              <tr>
                <th className="text-left font-medium px-3 py-2 w-[140px]">Time</th>
                <th className="text-left font-medium px-3 py-2 w-[180px]">Actor</th>
                <th className="text-left font-medium px-3 py-2 w-[200px]">Action</th>
                <th className="text-left font-medium px-3 py-2">Resource</th>
                <th className="text-left font-medium px-3 py-2 w-[110px]">IP</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((row: AuditEntry) => (
                <tr key={row.id} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-3 py-2 text-ink-3 tabular-nums">{fmtTime(row.created_at)}</td>
                  <td className="px-3 py-2 text-ink-2">
                    {row.actor ? (
                      <div>
                        <div className="truncate">{row.actor.name}</div>
                        <div className="text-ink-4 text-[11px] truncate">{row.actor.email}</div>
                      </div>
                    ) : (
                      <span className="text-ink-4">system</span>
                    )}
                  </td>
                  <td className={cn("px-3 py-2 font-medium tabular-nums", ACTION_COLOR[row.action] ?? "text-ink-2")}>
                    {row.action}
                  </td>
                  <td className="px-3 py-2 text-ink-3">
                    {row.resource_type ? (
                      <span>{row.resource_type}{row.resource_id ? ` #${row.resource_id}` : ""}</span>
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink-4 tabular-nums">{row.ip ?? "—"}</td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink-4">No events match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

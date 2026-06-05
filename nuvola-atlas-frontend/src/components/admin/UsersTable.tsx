import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { cn } from "@/lib/cn";

const ROLE_TONE: Record<string, string> = {
  admin: "bg-[rgba(74,158,255,0.15)] text-accent",
  editor: "bg-[rgba(57,210,143,0.15)] text-success",
  partner: "bg-[rgba(255,189,89,0.15)] text-warning",
  viewer: "bg-[rgba(255,255,255,0.06)] text-ink-3",
};

export default function UsersTable() {
  const [q, setQ] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: () => adminApi.users(1, q || undefined),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or email"
        className="w-full h-9 px-3 rounded-control bg-[rgba(255,255,255,0.04)] text-[13px] text-ink-1 placeholder-ink-4 outline-none focus:ring-1 focus:ring-accent"
      />

      {isLoading && <div className="text-[13px] text-ink-3 py-6 text-center">Loading users…</div>}
      {isError && <div className="text-[13px] text-danger py-6 text-center">Failed to load users.</div>}

      {data && (
        <div className="glass rounded-control overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="text-ink-4 text-[11px] uppercase tracking-[0.06em]">
              <tr>
                <th className="text-left font-medium px-3 py-2">Name</th>
                <th className="text-left font-medium px-3 py-2">Email</th>
                <th className="text-left font-medium px-3 py-2 w-[100px]">Role</th>
                <th className="text-left font-medium px-3 py-2 w-[80px]">2FA</th>
                <th className="text-left font-medium px-3 py-2 w-[80px]">Email</th>
                <th className="text-left font-medium px-3 py-2 w-[180px]">Partner</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u.id} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-3 py-2 text-ink-1">{u.name}</td>
                  <td className="px-3 py-2 text-ink-3">{u.email}</td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-block px-2 py-0.5 rounded-chip text-[11px] font-medium", ROLE_TONE[u.role] ?? ROLE_TONE.viewer)}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-block w-2 h-2 rounded-full", u.two_factor_enabled ? "bg-success" : "bg-ink-4")} />
                    <span className="ml-2 text-[12px] text-ink-3">{u.two_factor_enabled ? "On" : "Off"}</span>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-ink-3">{u.email_verified ? "verified" : "pending"}</td>
                  <td className="px-3 py-2 text-ink-3">{u.partner?.name ?? <span className="text-ink-4">—</span>}</td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-ink-4">No users match this search.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-[rgba(255,255,255,0.04)] text-[11px] text-ink-4">
            {data.meta.total} total · page {data.meta.current_page} / {data.meta.last_page}
          </div>
        </div>
      )}
    </div>
  );
}

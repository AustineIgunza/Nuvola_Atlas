import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { adminApi } from "@/api/admin";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/cn";

const ROLE_TONE: Record<string, string> = {
  admin: "bg-[rgba(74,158,255,0.15)] text-accent",
  editor: "bg-[rgba(57,210,143,0.15)] text-success",
  partner: "bg-[rgba(255,189,89,0.15)] text-warning",
  viewer: "bg-[rgba(255,255,255,0.06)] text-ink-3",
};

const ROLES = ["admin", "editor", "partner", "viewer"] as const;

export default function UsersTable() {
  const [q, setQ] = useState("");
  const [openMenuFor, setOpenMenuFor] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentUserEmail = useAuthStore((s) => s.user?.email);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: () => adminApi.users(1, q || undefined),
    staleTime: 30_000,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
      setOpenMenuFor(null);
    },
  });

  useEffect(() => {
    function onClick(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuFor(null);
      }
    }
    if (openMenuFor !== null) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [openMenuFor]);

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
                  <td className="px-3 py-2 relative">
                    {u.email === currentUserEmail ? (
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-chip text-[11px] font-medium",
                          ROLE_TONE[u.role] ?? ROLE_TONE.viewer,
                        )}
                        title="You cannot change your own role"
                      >
                        {u.role}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => setOpenMenuFor(openMenuFor === u.id ? null : u.id)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-chip text-[11px] font-medium hover:brightness-110",
                            ROLE_TONE[u.role] ?? ROLE_TONE.viewer,
                          )}
                          aria-haspopup="menu"
                          aria-expanded={openMenuFor === u.id}
                        >
                          {u.role}
                          <ChevronDown size={11} />
                        </button>
                        {openMenuFor === u.id && (
                          <div
                            ref={menuRef}
                            role="menu"
                            className="absolute left-3 top-9 z-10 glass-strong rounded-control shadow-modal py-1 min-w-[120px]"
                          >
                            {ROLES.filter((r) => r !== u.role).map((r) => (
                              <button
                                key={r}
                                role="menuitem"
                                onClick={() => updateRole.mutate({ id: u.id, role: r })}
                                disabled={updateRole.isPending}
                                className="w-full px-3 py-1.5 text-left text-[12px] text-ink-2 hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-50"
                              >
                                Set as {r}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {u.two_factor_enabled ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-success" />
                        <span className="ml-2 text-[12px] text-ink-3">On</span>
                      </>
                    ) : u.two_factor_locked ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded-chip text-[11px] font-medium bg-[rgba(255,93,93,0.12)] text-danger"
                        title="Account locked pending 2FA enrolment. Tokens revoked; sign-in lands on the enrolment wizard."
                      >
                        locked
                      </span>
                    ) : u.two_factor_reminded_at ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded-chip text-[11px] font-medium bg-[rgba(255,189,89,0.12)] text-warn"
                        title={`Reminder sent on ${new Date(u.two_factor_reminded_at).toLocaleDateString()}; lock fires 7 days later`}
                      >
                        reminded
                      </span>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-ink-4" />
                        <span className="ml-2 text-[12px] text-ink-3">Off</span>
                      </>
                    )}
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

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Eye, X } from "lucide-react";
import { adminApi } from "@/features/admin/admin.api";
import { useAuthStore, type AuthUser, type AuthRole } from "@/shared/stores/auth";
import { useImpersonationStore } from "@/shared/stores/impersonation";
import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/lib/i18n/use-t";

const ROLE_TONE: Record<string, string> = {
  admin: "bg-[rgba(192,85,43,0.15)] text-accent",
  editor: "bg-[rgba(31,138,120,0.15)] text-success",
  partner: "bg-[rgba(224,168,46,0.15)] text-warning",
  viewer: "bg-[rgba(255,255,255,0.06)] text-ink-3",
};

const ROLES = ["admin", "editor", "partner", "viewer"] as const;

export default function UsersTable() {
  const t = useT();
  const [q, setQ] = useState("");
  const [openMenuFor, setOpenMenuFor] = useState<number | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<{
    id: number;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentUser = useAuthStore((s) => s.user);
  const currentUserEmail = currentUser?.email;
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: () => adminApi.users(1, q || undefined),
    staleTime: 30_000,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.updateUserRole(id, role),
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
      {isError && (
        <div className="text-[13px] text-danger py-6 text-center">Failed to load users.</div>
      )}

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
                <tr
                  key={u.id}
                  className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]"
                >
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
                        className="inline-block px-2 py-0.5 rounded-chip text-[11px] font-medium bg-[rgba(211,64,46,0.12)] text-danger"
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
                  <td className="px-3 py-2 text-[12px] text-ink-3">
                    {u.email_verified ? "verified" : "pending"}
                  </td>
                  <td className="px-3 py-2 text-ink-3">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate">
                        {u.partner?.name ?? <span className="text-ink-4">—</span>}
                      </span>
                      {u.email !== currentUserEmail && (
                        <button
                          onClick={() =>
                            setImpersonateTarget({
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              role: u.role,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-3 hover:text-accent transition-colors shrink-0"
                          title={t("impersonate.button")}
                        >
                          <Eye size={11} />
                          <span className="hidden lg:inline">{t("impersonate.button")}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-ink-4">
                    No users match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-[rgba(255,255,255,0.04)] text-[11px] text-ink-4">
            {data.meta.total} total · page {data.meta.current_page} / {data.meta.last_page}
          </div>
        </div>
      )}

      {impersonateTarget && currentUser && (
        <ImpersonationModal
          target={impersonateTarget}
          adminEmail={currentUser.email}
          onClose={() => setImpersonateTarget(null)}
        />
      )}
    </div>
  );
}

function ImpersonationModal({
  target,
  adminEmail,
  onClose,
}: {
  target: { id: number; name: string; email: string; role: string };
  adminEmail: string;
  onClose: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const authSignIn = useAuthStore((s) => s.signIn);
  const impersonate = useImpersonationStore((s) => s.start);
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!reason.trim()) return;
    const targetUser: AuthUser = {
      name: target.name,
      email: target.email,
      role: target.role as AuthRole,
      email_verified: true,
    };
    // Persist so the banner + end-impersonation flow can restore the admin.
    impersonate({
      target: targetUser,
      reason: reason.trim(),
      startedAt: new Date().toISOString(),
      adminEmail,
    });
    // Swap the auth store to the target user. Sign-out will restore admin
    // via the banner's "End impersonation" button, which re-signs in the
    // admin with the original session.
    authSignIn(targetUser, "impersonation-mock-token");
    onClose();
    // Investors land on /investor, admins on /admin, everyone else on /atlas.
    if (targetUser.role === "investor") navigate("/investor");
    else if (targetUser.role === "admin") navigate("/admin");
    else navigate("/atlas");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[440px] rounded-modal glass-strong border border-border shadow-modal p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-ink-1">
              {t("impersonate.title", { name: target.name })}
            </h3>
            <p className="text-[11px] text-ink-3 mt-1 leading-relaxed">
              {t("impersonate.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-4 hover:text-ink-2"
            aria-label={t("common.close")}
          >
            <X size={15} />
          </button>
        </div>

        <div className="rounded-control bg-[rgba(255,255,255,0.04)] p-3 space-y-0.5">
          <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em]">Target</div>
          <div className="text-[12.5px] text-ink-1 font-medium">{target.name}</div>
          <div className="text-[10.5px] text-ink-3">
            {target.email} · {target.role}
          </div>
        </div>

        <label className="block">
          <span className="block text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-1">
            {t("impersonate.reason")}
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. investigating support ticket #142"
            className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[12px] text-ink-1 placeholder-ink-4 resize-none"
          />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 h-8 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-[11.5px] text-ink-3"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={!reason.trim()}
            className="px-3 h-8 rounded-control bg-accent text-white text-[11.5px] font-semibold disabled:opacity-50 btn-press"
          >
            {t("impersonate.start")}
          </button>
        </div>
      </div>
    </div>
  );
}

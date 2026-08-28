import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, X, Check } from "lucide-react";
import { adminApi, type AdminUser, type MintApiKeyResponse } from "@/features/admin/admin.api";
import { cn } from "@/shared/lib/cn";

const ABILITIES = [
  { value: "api:read", label: "Read", hint: "GET /zones, /projects, /alerts, /reports" },
  { value: "api:write", label: "Write", hint: "POST /reports, /alerts/mark-all-read" },
] as const;

const EXPIRY_PRESETS = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
  { label: "Never", days: undefined },
] as const;

// Per-key throttle presets. `null` = no per-key cap (the request still falls
// under the default 60/min `api` limiter — pick "Unlimited" only when the
// partner has a contractual reason to burst).
const RATE_LIMIT_PRESETS = [
  { label: "30 / min", rate: 30 },
  { label: "60 / min", rate: 60 },
  { label: "120 / min", rate: 120 },
  { label: "300 / min", rate: 300 },
  { label: "Unlimited", rate: null },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MintApiKeyModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [abilities, setAbilities] = useState<string[]>(["api:read"]);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(90);
  const [rateLimit, setRateLimit] = useState<number | null>(60);
  const [minted, setMinted] = useState<MintApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Load partner-role users for the picker. We don't paginate the picker
  // for the first cut — if a partner roster grows past a few dozen we'd
  // switch to a search field, but that's a follow-on.
  const { data: users } = useQuery({
    queryKey: ["admin", "users", "partners-and-editors"],
    queryFn: async () => {
      // Fetch first page; the pool is small in the pilot.
      const p = await adminApi.users(1);
      return p.data.filter((u: AdminUser) => u.role === "partner" || u.role === "editor");
    },
    enabled: open,
    staleTime: 60_000,
  });

  const mint = useMutation({
    mutationFn: () =>
      adminApi.mintApiKey({
        user_id: userId!,
        name,
        abilities,
        expires_in_days: expiresInDays,
        rate_limit_per_minute: rateLimit,
      }),
    onSuccess: (res) => {
      setMinted(res);
      qc.invalidateQueries({ queryKey: ["admin", "api-keys"] });
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
    },
  });

  useEffect(() => {
    if (!open) {
      // Reset on close so a future "New key" click starts fresh.
      setTimeout(() => {
        setUserId(null);
        setName("");
        setAbilities(["api:read"]);
        setExpiresInDays(90);
        setRateLimit(60);
        setMinted(null);
        setCopied(false);
        mint.reset();
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function copyToken(): Promise<void> {
    if (!minted) return;
    await navigator.clipboard.writeText(minted.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleAbility(value: string): void {
    setAbilities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    );
  }

  const canSubmit =
    !mint.isPending && userId !== null && name.trim().length > 0 && abilities.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mint-key-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 md:p-6 pointer-events-none"
          >
            <div className="w-full max-w-[520px] glass-strong rounded-modal shadow-modal pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 h-12 border-b border-border">
                <h2 id="mint-key-title" className="text-[14px] font-semibold text-ink-1">
                  {minted ? "API key created" : "New API key"}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-7 h-7 rounded-control flex items-center justify-center text-ink-3 hover:text-ink-2"
                >
                  <X size={16} />
                </button>
              </div>

              {!minted ? (
                <div className="p-5 space-y-4">
                  <Field label="Owner (partner or editor user)">
                    <select
                      value={userId ?? ""}
                      onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-10 px-3 rounded-control bg-[rgba(255,255,255,0.04)] text-[13px] text-ink-1 outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">— Select a user —</option>
                      {users?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email}) · {u.role}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Key name" hint="A short label so admins recognise it later">
                    <input
                      type="text"
                      maxLength={120}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="pilot partner — readonly"
                      className="w-full h-10 px-3 rounded-control bg-[rgba(255,255,255,0.04)] text-[13px] text-ink-1 placeholder-ink-4 outline-none focus:ring-1 focus:ring-accent"
                    />
                  </Field>

                  <Field label="Abilities">
                    <div className="space-y-2">
                      {ABILITIES.map((a) => (
                        <label
                          key={a.value}
                          htmlFor={`ability-${a.value}`}
                          aria-label={a.label}
                          className="flex items-start gap-2 cursor-pointer"
                        >
                          <input
                            id={`ability-${a.value}`}
                            type="checkbox"
                            checked={abilities.includes(a.value)}
                            onChange={() => toggleAbility(a.value)}
                            className="mt-1 accent-accent"
                          />
                          <div>
                            <div className="text-[13px] text-ink-1">{a.label}</div>
                            <div className="text-[11px] text-ink-4">{a.hint}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field label="Expiry">
                    <div className="flex flex-wrap gap-2">
                      {EXPIRY_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => setExpiresInDays(p.days)}
                          className={cn(
                            "px-3 h-8 rounded-chip text-[12px] transition-colors",
                            expiresInDays === p.days
                              ? "bg-accent text-white"
                              : "bg-[rgba(255,255,255,0.04)] text-ink-3 hover:text-ink-2",
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field
                    label="Rate limit"
                    hint="Caps the partner key in isolation — independent of any other key issued to the same user."
                  >
                    <div className="flex flex-wrap gap-2">
                      {RATE_LIMIT_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => setRateLimit(p.rate)}
                          className={cn(
                            "px-3 h-8 rounded-chip text-[12px] transition-colors",
                            rateLimit === p.rate
                              ? "bg-accent text-white"
                              : "bg-[rgba(255,255,255,0.04)] text-ink-3 hover:text-ink-2",
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {mint.isError && (
                    <div className="text-[12px] text-danger">{(mint.error as Error).message}</div>
                  )}
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <div className="rounded-control p-3 bg-[rgba(255,189,89,0.08)] ring-1 ring-[rgba(255,189,89,0.3)]">
                    <div className="text-[12px] font-medium text-warning">
                      Copy this token now — it cannot be shown again.
                    </div>
                    <div className="mt-1 text-[11px] text-ink-3">
                      Share over a secure channel (1Password vault entry, signed email, in-person).
                      Treat it like a password: rotate on suspicion, revoke if a partner reports
                      loss.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-control bg-[rgba(0,0,0,0.3)] text-[11px] text-ink-1 font-mono break-all">
                      {minted.token}
                    </code>
                    <button
                      onClick={copyToken}
                      className="shrink-0 px-3 h-9 rounded-control bg-accent text-white text-[12px] font-semibold flex items-center gap-2"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                    <div>
                      <dt className="text-ink-4">Name</dt>
                      <dd className="text-ink-1">{minted.data.name}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-4">Abilities</dt>
                      <dd className="text-ink-1">{minted.data.abilities.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-4">Owner</dt>
                      <dd className="text-ink-1 truncate">{minted.data.user?.email ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-4">Expires</dt>
                      <dd className="text-ink-1">
                        {minted.data.expires_at
                          ? new Date(minted.data.expires_at).toLocaleDateString()
                          : "Never"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-4">Rate limit</dt>
                      <dd className="text-ink-1">
                        {minted.data.rate_limit_per_minute
                          ? `${minted.data.rate_limit_per_minute} / min`
                          : "Unlimited"}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 px-5 h-12 border-t border-border">
                {!minted ? (
                  <>
                    <button
                      onClick={onClose}
                      className="px-3 h-9 rounded-control text-[12px] text-ink-3 hover:text-ink-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => mint.mutate()}
                      disabled={!canSubmit}
                      className="px-4 h-9 rounded-control bg-accent text-white text-[12px] font-semibold disabled:opacity-40"
                    >
                      {mint.isPending ? "Minting…" : "Mint key"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-4 h-9 rounded-control bg-accent text-white text-[12px] font-semibold"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-ink-3 uppercase tracking-[0.06em] mb-1">
        {label}
      </label>
      {children}
      {hint && <div className="mt-1 text-[11px] text-ink-4">{hint}</div>}
    </div>
  );
}

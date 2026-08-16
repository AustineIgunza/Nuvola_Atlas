import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { adminApi, type ApiKey } from "@/api/admin";
import MintApiKeyModal from "./MintApiKeyModal";

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default function ApiKeysTable() {
  const qc = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [mintOpen, setMintOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "api-keys"],
    queryFn: adminApi.apiKeys,
    staleTime: 30_000,
  });

  const revoke = useMutation({
    mutationFn: (id: number) => adminApi.revokeApiKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "api-keys"] });
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
      setConfirmingId(null);
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] text-ink-4 flex-1">
          Long-lived bearer tokens issued to programmatic partners. Plaintext tokens are shown only
          at mint time — there is no way to recover one after that. Revoke and reissue if a partner
          reports loss.
        </p>
        <button
          onClick={() => setMintOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-control bg-accent text-white text-[12px] font-semibold"
        >
          <Plus size={14} />
          New key
        </button>
      </div>

      <MintApiKeyModal open={mintOpen} onClose={() => setMintOpen(false)} />

      {isLoading && (
        <div className="text-[13px] text-ink-3 py-6 text-center">Loading API keys…</div>
      )}
      {isError && (
        <div className="text-[13px] text-danger py-6 text-center">Failed to load API keys.</div>
      )}

      {data && (
        <div className="glass rounded-control overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="text-ink-4 text-[11px] uppercase tracking-[0.06em]">
              <tr>
                <th className="text-left font-medium px-3 py-2">Name</th>
                <th className="text-left font-medium px-3 py-2 w-[160px]">Partner / user</th>
                <th className="text-left font-medium px-3 py-2 w-[120px]">Abilities</th>
                <th className="text-left font-medium px-3 py-2 w-[110px]">Rate limit</th>
                <th className="text-left font-medium px-3 py-2 w-[140px]">Last used</th>
                <th className="text-left font-medium px-3 py-2 w-[140px]">Expires</th>
                <th className="text-right font-medium px-3 py-2 w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((k: ApiKey) => (
                <tr
                  key={k.id}
                  className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <td className="px-3 py-2 text-ink-1">{k.name}</td>
                  <td className="px-3 py-2 text-ink-3">
                    {k.user ? (
                      <div>
                        <div className="truncate">{k.user.name}</div>
                        <div className="text-ink-4 text-[11px] truncate">{k.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink-3 text-[12px] tabular-nums">
                    {k.abilities.join(", ")}
                  </td>
                  <td className="px-3 py-2 text-ink-3 text-[12px] tabular-nums">
                    {k.rate_limit_per_minute ? (
                      `${k.rate_limit_per_minute} / min`
                    ) : (
                      <span className="text-ink-4">Unlimited</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink-3 text-[12px]">{fmtTime(k.last_used_at)}</td>
                  <td className="px-3 py-2 text-ink-3 text-[12px]">{fmtTime(k.expires_at)}</td>
                  <td className="px-3 py-2 text-right">
                    {confirmingId === k.id ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="px-2 h-7 rounded-control text-[11px] text-ink-3 hover:text-ink-2"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => revoke.mutate(k.id)}
                          disabled={revoke.isPending}
                          className="px-2 h-7 rounded-control bg-danger text-white text-[11px] font-medium disabled:opacity-50"
                        >
                          {revoke.isPending ? "…" : "Confirm"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(k.id)}
                        className="px-2 h-7 rounded-control text-[11px] text-danger hover:bg-[rgba(255,89,89,0.1)]"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-ink-4">
                    No active API keys.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

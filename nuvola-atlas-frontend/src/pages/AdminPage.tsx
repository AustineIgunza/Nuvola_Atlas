import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import AppShell from "@/components/chrome/AppShell";
import AdminTabs, { type AdminTab } from "@/components/admin/AdminTabs";
import MetricCard from "@/components/admin/MetricCard";
import AuditTable from "@/components/admin/AuditTable";
import UsersTable from "@/components/admin/UsersTable";
import ApiKeysTable from "@/components/admin/ApiKeysTable";
import TwoFactorSetup from "@/components/admin/TwoFactorSetup";
import { adminApi } from "@/api/admin";
import { api } from "@/api";
import { springSettle } from "@/lib/motion";

// Detect the structured 2FA-required body the backend's RequireAdminTwoFactor
// middleware returns. The fetch wrapper turns that into a thrown Error whose
// message is either the RFC 7807 `detail` or a generic one — we match on the
// "two-factor" wording either way.
function isTwoFactorError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /two[- ]?factor/i.test(err.message);
}

export default function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [twoFactorMode, setTwoFactorMode] = useState(false);

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: adminApi.metrics,
    staleTime: 30_000,
    retry: false,
  });

  // Sparkline series. Audit volume is admin-scoped; vitality history is a
  // public read but reused here as the county-wide trend line.
  const { data: auditVolume } = useQuery({
    queryKey: ["admin", "audit-volume"],
    queryFn: adminApi.auditVolume,
    staleTime: 5 * 60_000,
    retry: false,
    enabled: !error,
  });

  const { data: historyPoints } = useQuery({
    queryKey: ["history", "global"],
    queryFn: api.getHistory,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const auditSeries = auditVolume?.series.map((p) => p.count);
  const vitalitySeries = historyPoints?.map((p) => p.overallAvg);
  const vitalityLatest = vitalitySeries?.[vitalitySeries.length - 1];

  const showTwoFactor = twoFactorMode || (error && isTwoFactorError(error));

  if (showTwoFactor) {
    return (
      <AppShell>
        <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-10">
          <TwoFactorSetup
            onComplete={() => {
              setTwoFactorMode(false);
              qc.invalidateQueries({ queryKey: ["admin"] });
            }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springSettle}
              className="text-[20px] font-semibold tracking-[-0.02em] text-ink-1"
            >
              Admin
            </motion.h1>
            <p className="text-[12px] text-ink-4 mt-1">
              Operational view of the Atlas instance — counters refresh every 30 s.
            </p>
          </div>
          <button
            onClick={() => setTwoFactorMode(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-control bg-[rgba(255,255,255,0.06)] text-[12px] text-ink-2 hover:text-ink-1"
            title="Enrol your account in TOTP — required for /admin/* in production"
          >
            <Shield size={13} />
            Set up 2FA
          </button>
        </header>

        <AdminTabs active={tab} onChange={setTab} />

        {tab === "overview" && (
          <section className="space-y-4">
            {isLoading || !metrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="glass rounded-control p-4 h-[88px] animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Users" value={metrics.users_total} />
                  <MetricCard label="Partners" value={metrics.partners_total} />
                  <MetricCard label="Reports" value={metrics.reports_total} />
                  <MetricCard
                    label="Unread alerts"
                    value={metrics.alerts_unread}
                    tone={metrics.alerts_unread > 0 ? "warning" : "default"}
                  />
                  <MetricCard
                    label="Audit events (24h)"
                    value={metrics.audit_events_last_24h}
                    hint={auditVolume ? `${auditVolume.total} in last 30d` : "rolling window"}
                    spark={auditSeries}
                    sparkAriaLabel="30-day audit event volume"
                  />
                  <MetricCard label="Active API keys" value={metrics.api_keys_active} />
                  <MetricCard
                    label="Vitality trend"
                    value={vitalityLatest != null ? vitalityLatest.toFixed(1) : "—"}
                    hint={historyPoints && historyPoints.length > 0 ? `12-month avg, latest ${historyPoints[historyPoints.length - 1].month}` : "12-month avg"}
                    spark={vitalitySeries}
                    sparkColor="#1F8A78"
                    sparkAriaLabel="12-month county-wide Vitality trend"
                  />
                  <MetricCard
                    label="Admins on 2FA"
                    value={`${metrics.admins_with_two_factor}/${metrics.admins_total}`}
                    tone={
                      metrics.admins_total > 0 && metrics.admins_with_two_factor === metrics.admins_total
                        ? "success"
                        : "warning"
                    }
                    hint={
                      metrics.admins_total > 0 && metrics.admins_with_two_factor === metrics.admins_total
                        ? "all admins protected"
                        : "enrolment incomplete"
                    }
                  />
                  <MetricCard
                    label="Snapshot"
                    value={new Date(metrics.generated_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    hint="server time"
                  />
                </div>
                <p className="text-[11px] text-ink-4">
                  Headline counters only. Drill into Audit, Users, or API keys for detail.
                </p>
              </>
            )}
          </section>
        )}

        {tab === "audit" && <AuditTable />}
        {tab === "users" && <UsersTable />}
        {tab === "api-keys" && <ApiKeysTable />}
      </div>
    </AppShell>
  );
}

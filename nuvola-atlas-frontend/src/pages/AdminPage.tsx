import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AppShell from "@/components/chrome/AppShell";
import AdminTabs, { type AdminTab } from "@/components/admin/AdminTabs";
import MetricCard from "@/components/admin/MetricCard";
import AuditTable from "@/components/admin/AuditTable";
import UsersTable from "@/components/admin/UsersTable";
import ApiKeysTable from "@/components/admin/ApiKeysTable";
import { adminApi } from "@/api/admin";
import { springSettle } from "@/lib/motion";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: adminApi.metrics,
    staleTime: 30_000,
  });

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <header>
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
                    hint="rolling window"
                  />
                  <MetricCard label="Active API keys" value={metrics.api_keys_active} />
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

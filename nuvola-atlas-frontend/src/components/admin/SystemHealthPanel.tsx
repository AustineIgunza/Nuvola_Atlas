import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  AlertOctagon,
  Cpu,
  Database,
  Gauge,
  GitCommit,
  HelpCircle,
  Radio,
  Server,
  Timer,
} from "lucide-react";
import { adminApi, type HealthCheck, type HealthStatus } from "@/api/admin";
import { BRAND } from "@/lib/scoreColor";
import { formatRelative } from "@/lib/format";

/**
 * Operator telemetry, read from /admin/system-health.
 *
 * This panel previously rendered fixtures — "99.98% uptime · Fly.io ams",
 * "8 ms p50 · Supabase pooler :6543", a deploy log of invented SHAs, and
 * per-region latencies for a region that does not exist. On the operator
 * console, where the numbers are read as ground truth, that was the worst
 * place in the app to be guessing.
 *
 * Anything the API cannot actually measure now arrives as `not_monitored`
 * and renders as a dash. A dash is a worse demo and a true one.
 */

const LABELS: Record<string, string> = {
  database: "PostgreSQL",
  queue_depth: "Queue depth",
  migrations: "Migrations",
  last_ingestion: "Last ingestion",
  broadcasting: "Broadcasting",
  release: "Running release",
  uptime_30d: "30-day uptime",
  error_rate_24h: "Error rate (24h)",
  mock_mode: "Mock mode",
};

const ICONS: Record<string, typeof Server> = {
  database: Database,
  queue_depth: Gauge,
  migrations: GitCommit,
  last_ingestion: Cpu,
  broadcasting: Radio,
  release: Server,
  uptime_30d: Timer,
  error_rate_24h: AlertOctagon,
};

function statusColor(s: HealthStatus): string {
  if (s === "ok") return BRAND.teal;
  if (s === "degraded") return BRAND.gold;
  if (s === "down") return BRAND.rose;
  return "var(--ink-4, #7a7a7a)"; // not_monitored — deliberately colourless
}

/** A measured value, or an em dash when there is nothing to show. */
function renderValue(c: HealthCheck): string {
  if (c.status === "not_monitored" || c.value === null) return "—";
  if (c.unit === "timestamp") return formatRelative(String(c.value));
  if (c.unit && c.unit !== "timestamp") return `${c.value} ${c.unit}`;
  return String(c.value);
}

function HealthCard({ check }: { check: HealthCheck }) {
  const color = statusColor(check.status);
  const Icon = ICONS[check.key] ?? HelpCircle;
  const unmonitored = check.status === "not_monitored";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`health-${check.key}`}
      className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-3"
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
          style={{ background: `${color}22`, color }}
        >
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-semibold text-ink-1 truncate">
              {LABELS[check.key] ?? check.key}
            </span>
            <span
              className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${unmonitored ? "" : "pulse-glow"}`}
              style={{
                background: color,
                boxShadow: unmonitored ? "none" : `0 0 6px ${color}88`,
              }}
            />
          </div>
          <div className="text-[13.5px] font-bold tabular-nums" style={{ color }}>
            {renderValue(check)}
          </div>
          {unmonitored && (
            <div className="text-[9px] uppercase tracking-[0.08em] text-ink-4 mt-0.5">
              Not monitored
            </div>
          )}
          <div className="text-[9.5px] text-ink-4 leading-tight mt-0.5">{check.detail}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SystemHealthPanel() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: adminApi.systemHealth,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Activity size={12} style={{ color: BRAND.teal }} />
          <h3 className="text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.1em]">
            Live services
          </h3>
          {data && (
            <span className="ml-auto text-[9.5px] text-ink-4 tabular-nums">
              measured {formatRelative(data.measured_at)}
            </span>
          )}
        </div>

        {isLoading && <div className="text-[11px] text-ink-4">Reading system state…</div>}

        {isError && (
          <div
            className="rounded-card border border-border p-3 text-[11px]"
            style={{ color: BRAND.rose }}
          >
            Could not read system health: {(error as Error).message}
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.checks.map((c) => (
              <HealthCard key={c.key} check={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

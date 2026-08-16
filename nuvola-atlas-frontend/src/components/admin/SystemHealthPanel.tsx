import { motion } from "framer-motion";
import {
  Activity,
  AlertOctagon,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  Radio,
  Server,
  Zap,
} from "lucide-react";
import { BRAND } from "@/lib/scoreColor";

/**
 * System Health mock — read-only telemetry a Navuuna operator would see.
 * All values are static fixtures; when the backend Phase E migrations
 * land this swaps for a hook that reads BetterStack + Sentry + queue
 * depth + Reverb channel health.
 */

interface Health {
  label: string;
  value: string;
  status: "green" | "amber" | "red";
  hint: string;
  icon: typeof Server;
}

const SERVICES: Health[] = [
  {
    label: "Laravel API",
    value: "99.98%",
    status: "green",
    hint: "30-day uptime · Fly.io ams",
    icon: Server,
  },
  {
    label: "PostgreSQL",
    value: "8 ms",
    status: "green",
    hint: "p50 query latency · Supabase pooler :6543",
    icon: Database,
  },
  {
    label: "Reverb websocket",
    value: "3 open",
    status: "green",
    hint: "Live map sessions on zones.* channels",
    icon: Radio,
  },
  {
    label: "Queue depth",
    value: "0 waiting",
    status: "green",
    hint: "Sync queue — no backlog",
    icon: Gauge,
  },
  {
    label: "Ingestion FastAPI",
    value: "no traffic",
    status: "amber",
    hint: "Awaiting Daystar cutover (Aug 15 ETA)",
    icon: Cpu,
  },
  {
    label: "Sentry error rate",
    value: "0.1%",
    status: "green",
    hint: "Last 24h · 3 issues, 0 critical",
    icon: AlertOctagon,
  },
];

const RECENT_DEPLOYS = [
  {
    sha: "6d41f8f",
    author: "Austine",
    when: "just now",
    branch: "main",
    note: "mobile nav pill + i18n sweep",
  },
  {
    sha: "87b191f",
    author: "Austine",
    when: "18 min ago",
    branch: "main",
    note: "locale-aware chat, auto-collapse sidebar",
  },
  {
    sha: "7f6fafa",
    author: "Austine",
    when: "42 min ago",
    branch: "main",
    note: "admin mobile layout cutoffs",
  },
  {
    sha: "83efc1b",
    author: "Austine",
    when: "1h ago",
    branch: "main",
    note: "watchlist chip, announcements",
  },
];

const REGIONS = [
  { name: "Amsterdam (ams)", role: "Primary staging", status: "green", latency: "12 ms" },
  { name: "Nairobi (nbo)", role: "Planned production", status: "amber", latency: "— pending" },
];

function statusColor(s: Health["status"]): string {
  if (s === "green") return BRAND.teal;
  if (s === "amber") return BRAND.gold;
  return BRAND.rose;
}

export default function SystemHealthPanel() {
  return (
    <div className="space-y-4">
      {/* Service uptime grid */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Activity size={12} style={{ color: BRAND.teal }} />
          <h3 className="text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.1em]">
            Live services
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SERVICES.map((s) => {
            const color = statusColor(s.status);
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-3"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                    style={{ background: `${color}22`, color }}
                  >
                    <s.icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11.5px] font-semibold text-ink-1 truncate">
                        {s.label}
                      </span>
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0 pulse-glow"
                        style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
                      />
                    </div>
                    <div className="text-[13.5px] font-bold tabular-nums" style={{ color }}>
                      {s.value}
                    </div>
                    <div className="text-[9.5px] text-ink-4 leading-tight truncate mt-0.5">
                      {s.hint}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Deployment log */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <GitBranch size={12} style={{ color: BRAND.terracotta }} />
          <h3 className="text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.1em]">
            Recent deploys
          </h3>
        </div>
        <div className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] divide-y divide-border">
          {RECENT_DEPLOYS.map((d) => (
            <div key={d.sha} className="flex items-center gap-3 px-3 py-2">
              <span
                className="text-[9.5px] font-mono tabular-nums text-ink-3 tracking-tight bg-[rgba(255,255,255,0.04)] rounded px-1.5 py-0.5 shrink-0"
                title={d.sha}
              >
                {d.sha}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-medium text-ink-1 truncate">{d.note}</div>
                <div className="text-[9.5px] text-ink-4 truncate">
                  {d.author} · {d.branch} · {d.when}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Region map */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={12} style={{ color: BRAND.gold }} />
          <h3 className="text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.1em]">
            Regions
          </h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {REGIONS.map((r) => {
            const color = r.status === "green" ? BRAND.teal : BRAND.gold;
            return (
              <div
                key={r.name}
                className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
                  />
                  <span className="text-[12px] font-semibold text-ink-1 truncate flex-1">
                    {r.name}
                  </span>
                  <span
                    className="text-[9.5px] font-semibold uppercase tracking-[0.08em] shrink-0"
                    style={{ color }}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="mt-1 text-[10.5px] text-ink-3">{r.role}</div>
                <div className="mt-0.5 text-[10.5px] text-ink-4 tabular-nums">
                  Latency {r.latency}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

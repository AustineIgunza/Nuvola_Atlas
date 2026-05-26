import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown } from "lucide-react";
import { api } from "../../api";
import { cn } from "../../lib/cn";
import { formatRelative } from "../../lib/format";
import { staggerContainer, staggerItem, springSettle } from "../../lib/motion";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import type { AlertSeverity } from "../../types";

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  high: "bg-score-red",
  medium: "bg-score-amber",
  low: "bg-score-green",
};

const SEVERITY_LABELS: AlertSeverity[] = ["all" as any, "high", "medium", "low"];
const KIND_LABELS = ["all", "infra", "vitality", "esia", "system", "partner"];

export default function AlertList() {
  const reduced = usePrefersReducedMotion();
  const queryClient = useQueryClient();
  const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const markAll = useMutation({
    mutationFn: api.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const [severity, setSeverity] = useState("all");
  const [kind, setKind] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = alerts.filter(
    (a) => (severity === "all" || a.severity === severity) && (kind === "all" || a.kind === kind)
  );

  const unreadCount = alerts.filter((a) => !a.read).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-ink/30 text-sm">Loading alerts...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Alerts</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-pill bg-score-red text-white text-[11px] font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="text-[13px] text-accent hover:underline disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Severity filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {SEVERITY_LABELS.map((s) => (
          <button
            key={s}
            onClick={() => setSeverity(s)}
            className={cn(
              "px-3 py-1 text-[12px] rounded-pill transition-colors capitalize",
              severity === s ? "bg-accent text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/8"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Kind filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {KIND_LABELS.map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={cn(
              "px-3 py-1 text-[12px] rounded-pill transition-colors capitalize",
              kind === k ? "bg-accent text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/8"
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-card shadow-card p-12 text-center">
          <Bell className="mx-auto mb-3 text-ink/20" size={32} />
          <p className="text-[13px] text-ink/40">No alerts match your filters</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial={reduced ? false : "hidden"}
          animate="visible"
          key={`${severity}-${kind}`}
        >
          {filtered.map((alert) => {
            const isExpanded = expandedId === alert.id;
            return (
              <motion.div
                key={alert.id}
                variants={staggerItem}
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                className={cn(
                  "bg-card rounded-card shadow-card p-5 mb-3 cursor-pointer transition-all hover:shadow-lg",
                  !alert.read && "border-l-[3px] border-accent"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", SEVERITY_DOT[alert.severity])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("text-[14px]", !alert.read ? "font-semibold text-ink" : "text-ink/70")}>
                        {alert.title}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-chip bg-ink/5 text-ink/50 capitalize">
                        {alert.kind}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-chip font-medium capitalize",
                        alert.severity === "high" ? "bg-score-red/10 text-score-red" :
                        alert.severity === "medium" ? "bg-score-amber/10 text-score-amber" :
                        "bg-score-green/10 text-score-green"
                      )}>
                        {alert.severity}
                      </span>
                    </div>
                    {/* Collapsed: show truncated body */}
                    {!isExpanded && (
                      <p className="text-[13px] text-ink/50 line-clamp-1">{alert.body}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-ink/30">{formatRelative(alert.createdAt)}</span>
                      {alert.zoneId && (
                        <span className="text-[11px] text-accent/70 capitalize">{alert.zoneId.replace(/-/g, ' ')}</span>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={springSettle}
                    className="text-ink/30 shrink-0 mt-1"
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={springSettle}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="text-[13px] text-ink/70 leading-relaxed">{alert.body}</div>
                        <div className="mt-3 flex items-center gap-4 text-[11px]">
                          <div>
                            <span className="text-ink/30">Severity: </span>
                            <span className={cn(
                              "font-medium capitalize",
                              alert.severity === "high" ? "text-score-red" :
                              alert.severity === "medium" ? "text-score-amber" :
                              "text-score-green"
                            )}>{alert.severity}</span>
                          </div>
                          <div>
                            <span className="text-ink/30">Type: </span>
                            <span className="text-ink/60 capitalize">{alert.kind}</span>
                          </div>
                          {alert.zoneId && (
                            <div>
                              <span className="text-ink/30">Zone: </span>
                              <span className="text-accent capitalize">{alert.zoneId.replace(/-/g, ' ')}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-ink/30">Status: </span>
                            <span className={alert.read ? "text-ink/40" : "text-accent font-medium"}>
                              {alert.read ? "Read" : "Unread"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

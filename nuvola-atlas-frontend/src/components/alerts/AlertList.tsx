import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { formatRelative } from "@/lib/format";
import { springSettle, staggerContainer, staggerItemScale } from "@/lib/motion";
import type { AlertSeverity } from "@/types";

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: "#ff5d5d",
  medium: "#ffb340",
  low: "rgba(255,255,255,0.2)",
};

const FILTERS: { label: string; value: AlertSeverity | "all" }[] = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export default function AlertList() {
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, isError } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });

  const markAll = useMutation({
    mutationFn: api.markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["alerts"] });
      const prev = queryClient.getQueryData(["alerts"]);
      queryClient.setQueryData(["alerts"], (old: typeof alerts) => old?.map((a) => ({ ...a, read: true })));
      return { prev };
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(["alerts"], ctx.prev); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const filtered = alerts?.filter((a) => filter === "all" || a.severity === filter) ?? [];
  function zoneName(id: string | null) { return id ? (zones?.find((z) => z.id === id)?.name ?? id) : "System"; }

  if (isLoading) {
    return (
      <div className="glass-strong rounded-card p-8 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-strong rounded-card p-8 text-center">
        <p className="text-danger text-[13px] mb-2">Failed to load alerts</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ["alerts"] })} className="text-accent text-[12px] hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="glass-strong rounded-card p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 flex-wrap relative">
          {FILTERS.map((f) => (
            <motion.button
              key={f.value}
              onClick={() => setFilter(f.value)}
              whileTap={{ scale: 0.93 }}
              className={cn(
                "relative px-3.5 h-8 rounded-chip text-[11px] font-medium transition-colors",
                filter === f.value ? "text-white" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {filter === f.value && (
                <motion.div layoutId="alert-filter" className="absolute inset-0 bg-accent rounded-chip" transition={springSettle} />
              )}
              <span className="relative z-10">{f.label}</span>
            </motion.button>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => markAll.mutate()}
          className="h-9 px-4 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-3 text-[12px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors self-start"
        >
          Mark all read
        </motion.button>
      </div>

      {/* Alert cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        key={filter}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((a) => (
            <motion.div
              key={a.id}
              variants={staggerItemScale}
              transition={springSettle}
              layout
              exit={{ opacity: 0, scale: 0.95, x: -20, transition: { duration: 0.2 } }}
              whileHover={{ y: -1, boxShadow: "0 6px 20px rgba(0,0,0,0.2)" }}
              className={cn(
                "relative flex gap-3.5 p-4 sm:p-5 rounded-card border border-border transition-opacity",
                a.read && "opacity-55",
              )}
            >
              {/* Severity rail */}
              <motion.div
                className="w-[3px] rounded-full shrink-0 self-stretch"
                style={{ background: SEVERITY_COLORS[a.severity] }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.1, ...springSettle }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white"
                      style={{ background: SEVERITY_COLORS[a.severity] }}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[11px] text-ink-4">{zoneName(a.zoneId)}</span>
                  </div>
                  <span className="text-[11px] text-ink-4 tabular-nums shrink-0">{formatRelative(a.createdAt)}</span>
                </div>

                <h3 className="text-[14px] font-semibold text-ink-1 mb-1.5">{a.title}</h3>
                <p className="text-[12.5px] text-ink-2 leading-[1.6]">{a.body}</p>
              </div>

              {/* Unread dot */}
              <AnimatePresence>
                {!a.read && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={springSettle}
                    className="absolute top-3 right-3"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" style={{ boxShadow: "0 0 10px rgba(74,158,255,0.5)" }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

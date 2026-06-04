import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import {
  springSettle,
  staggerContainer,
  panelSlideRight,
  modalBackdrop,
  modalContent,
} from "@/lib/motion";
import AlertCard from "./AlertCard";
import AlertDetail from "./AlertDetail";
import type { AlertSeverity } from "@/types";

const FILTERS: { label: string; value: AlertSeverity | "all" }[] = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export default function AlertList() {
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches,
  );
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, isError } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId]);

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
  const selectedAlert = alerts?.find((a) => a.id === selectedId);
  function zoneName(id: string | null) { return id ? (zones?.find((z) => z.id === id)?.name ?? id) : "System-wide"; }
  function projectName(id: string) { return projects?.find((p) => p.id === id)?.name ?? id; }

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
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="glass-strong rounded-card p-4 sm:p-6"
      >
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
                  <motion.div layoutId="alert-filter" className="absolute inset-0 bg-accent rounded-chip glow-accent" transition={springSettle} />
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

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          key={filter}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((a) => (
              <AlertCard
                key={a.id}
                alert={a}
                selected={selectedId === a.id}
                onSelect={() => setSelectedId(a.id)}
                zoneName={zoneName(a.zoneId)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* DESKTOP: slide-in side panel */}
      <AnimatePresence>
        {!isMobile && selectedAlert && (
          <motion.div
            key="alert-side-panel"
            className="fixed inset-y-0 right-0 z-30 flex"
            initial={{ pointerEvents: "none" }}
            animate={{ pointerEvents: "auto" }}
            exit={{ pointerEvents: "none" }}
          >
            <motion.aside
              key={selectedAlert.id}
              variants={panelSlideRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="w-[440px] xl:w-[480px] glass-strong border-l border-border h-full overflow-y-auto shadow-modal"
              role="complementary"
              aria-label={`${selectedAlert.title} details`}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 border-b border-border glass-strong">
                <span className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                  Alert details
                </span>
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
                  aria-label="Close panel"
                >
                  <X size={14} />
                </button>
              </div>
              <AlertDetail
                alert={selectedAlert}
                zoneName={zoneName(selectedAlert.zoneId)}
                projectName={projectName}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE: centered popup modal */}
      <AnimatePresence>
        {isMobile && selectedAlert && (
          <motion.div
            key="alert-mobile-modal"
            className="fixed inset-0 z-40 flex items-center justify-center p-3 pb-safe"
          >
            <motion.div
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              key={selectedAlert.id}
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="relative w-full max-w-[460px] max-h-[88vh] glass-strong border border-border rounded-modal overflow-y-auto shadow-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedAlert.title} details`}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 border-b border-border glass-strong">
                <span className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                  Alert details
                </span>
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
                  aria-label="Close popup"
                >
                  <X size={14} />
                </button>
              </div>
              <AlertDetail
                alert={selectedAlert}
                zoneName={zoneName(selectedAlert.zoneId)}
                projectName={projectName}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { springSettle, panelSlideRight, modalBackdrop, modalContent } from "@/lib/motion";
import Ring from "./Ring";
import PillarRow from "./PillarRow";
import ActivityFeed from "./ActivityFeed";
import ZoneRanking from "./ZoneRanking";
import type { Zone, PillarKey } from "@/types";

const PILLAR_KEYS: PillarKey[] = ["social", "safety", "density", "infra"];

interface Props {
  zone: Zone | undefined;
}

export default function ScorecardPanel({ zone }: Props) {
  const panelOpen = useUIStore((s) => s.panelOpen);
  const closePanel = useUIStore((s) => s.closePanel);
  const openPanel = useUIStore((s) => s.openPanel);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  const [exporting, setExporting] = useState(false);

  const handleOpenReport = useCallback(() => {
    if (zone) navigate(`/reports?zone=${zone.id}`);
  }, [zone, navigate]);

  const handleExportPdf = useCallback(() => {
    if (!zone || exporting) return;
    setExporting(true);
    const content = [
      `NUVOLA ATLAS — Zone Report`,
      `Zone: ${zone.name}`,
      `Vitality Score: ${zone.score}/100`,
      ``,
      `Pillar Scores:`,
      `  Social Wellbeing: ${zone.pillars.social}`,
      `  Safety & Security: ${zone.pillars.safety}`,
      `  Density & Scaling: ${zone.pillars.density}`,
      `  Infrastructure & Environmental: ${zone.pillars.infra}`,
      ``,
      `Generated: ${new Date().toLocaleString()}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${zone.id}-vitality-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }, [zone, exporting]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePanel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen, closePanel]);

  const totalDelta = zone
    ? Math.round((zone.deltas.social + zone.deltas.safety + zone.deltas.density + zone.deltas.infra) / 4)
    : 0;

  const body = zone ? (
    <div className="p-3 sm:p-5">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, ...springSettle }}
                className="flex items-start justify-between mb-5"
              >
                <div>
                  <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                    Sub-county · Nairobi
                  </div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink-1 mt-1">
                    {zone.name}
                  </h2>
                </div>
                <motion.button
                  onClick={closePanel}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springSettle}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors"
                  aria-label="Close scorecard"
                >
                  <X size={14} />
                </motion.button>
              </motion.div>

              {/* Score ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, ...springSettle }}
                className="flex flex-col items-center mb-6"
              >
                <Ring score={zone.score} size={96} />

                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.12em] mt-3"
                >
                  UE Vitality Index
                </motion.div>

                {/* Delta chip */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, ...springSettle }}
                  className="mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{
                    background: totalDelta >= 0 ? "rgba(52,201,122,0.12)" : "rgba(255,93,93,0.12)",
                    color: totalDelta >= 0 ? "#34c97a" : "#ff5d5d",
                    boxShadow: totalDelta >= 0 ? "0 0 10px rgba(52,201,122,0.25)" : "0 0 10px rgba(255,93,93,0.25)",
                  }}
                >
                  {totalDelta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(totalDelta)} pts this quarter
                </motion.div>

                <p className="text-[11px] text-ink-4 mt-2 text-center">
                  Computed across 4 pillars · last sync {zone.lastSyncMin} min ago
                </p>
              </motion.div>

              {/* Pillars */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-6 rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-4"
              >
                {PILLAR_KEYS.map((key, i) => (
                  <PillarRow key={key} pillarKey={key} score={zone.pillars[key]} delta={zone.deltas[key]} index={i} />
                ))}
              </motion.div>

              {/* Zone ranking */}
              <ZoneRanking currentZone={zone} />

              {/* Data freshness */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-4"
              >
                <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] mb-3">
                  Data Sources
                </div>
                <div className="space-y-2">
                  {[
                    { source: "KNBS Population", fresh: true, age: "2 days" },
                    { source: "KURA Road Status", fresh: true, age: "4 hours" },
                    { source: "KPLC Energy Feed", fresh: zone.lastSyncMin < 15, age: `${zone.lastSyncMin} min` },
                    { source: "NPS Safety Data", fresh: true, age: "1 week" },
                    { source: "NEMA ESIA Portal", fresh: true, age: "3 days" },
                  ].map((d) => (
                    <div key={d.source} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: d.fresh ? "#34c97a" : "#ff5d5d",
                            boxShadow: d.fresh ? "0 0 6px rgba(52,201,122,0.5)" : "0 0 6px rgba(255,93,93,0.5)",
                          }}
                        />
                        <span className="text-ink-3">{d.source}</span>
                      </div>
                      <span className={d.fresh ? "text-ink-4" : "text-danger font-medium"}>
                        {d.age}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Activity */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mb-6"
              >
                <ActivityFeed zoneId={zone.id} />
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <motion.button
                  onClick={handleOpenReport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 h-10 rounded-control bg-accent text-white text-[13px] font-medium hover:brightness-110 transition-all btn-glow"
                >
                  Open full report
                </motion.button>
                <motion.button
                  onClick={handleExportPdf}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 h-10 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-2 text-[13px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  {exporting ? "Exporting..." : "Export PDF"}
                </motion.button>
              </motion.div>
            </div>
  ) : null;

  return (
    <>
      <AnimatePresence mode="wait">
        {panelOpen && zone && (
          isMobile ? (
            // Mobile: centered modal popup with backdrop
            <motion.div
              key="mobile-modal"
              className="fixed inset-0 z-40 flex items-center justify-center p-3 pb-safe"
            >
              <motion.div
                variants={modalBackdrop}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={closePanel}
              />
              <motion.div
                key={zone.id}
                variants={modalContent}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={springSettle}
                className="relative w-full max-w-[420px] max-h-[85vh] glass-strong border border-border rounded-modal overflow-y-auto shadow-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`${zone.name} scorecard`}
              >
                {body}
              </motion.div>
            </motion.div>
          ) : (
            // Desktop: persistent side panel
            <motion.aside
              key={zone.id}
              variants={panelSlideRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="w-[420px] xl:w-[440px] shrink-0 glass-strong border-l border-border overflow-y-auto h-full"
            >
              {body}
            </motion.aside>
          )
        )}
      </AnimatePresence>

      {/* Re-open chip — when panel is dismissed but a zone is still selected */}
      <AnimatePresence>
        {!panelOpen && zone && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={springSettle}
            onClick={openPanel}
            className={
              isMobile
                ? "fixed left-1/2 -translate-x-1/2 z-40 glass-strong rounded-full px-5 py-3 border border-border hover:bg-[rgba(255,255,255,0.06)] transition-colors shadow-chrome btn-press flex items-center gap-2 bottom-[calc(var(--mobile-nav-h)+0.75rem)]"
                : "fixed right-0 top-1/2 -translate-y-1/2 z-30 glass-strong rounded-l-control px-2.5 py-5 border border-r-0 border-border hover:bg-[rgba(255,255,255,0.06)] transition-colors btn-press"
            }
          >
            {isMobile ? (
              <>
                <ChevronUp size={14} className="text-ink-3" />
                <span className="text-[12px] font-medium text-ink-2 tabular-nums">
                  {zone.name} · {zone.score}
                </span>
              </>
            ) : (
              <span className="text-[12px] font-medium text-ink-2 tabular-nums" style={{ writingMode: "vertical-rl" }}>
                {zone.name} · {zone.score}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}


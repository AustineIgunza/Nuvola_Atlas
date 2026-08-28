import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { api } from "@/api";
import { PILLAR_COLORS, PILLAR_GLYPHS } from "@/lib/scoreColor";
import { PILLARS } from "@/domain/pillars.generated";
import type { PillarKey } from "@/domain/types";
import {
  springSettle,
  modalBackdrop,
  modalContent,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";

export default function MethodologyModal() {
  const open = useUIStore((s) => s.methodOpen);
  const close = useUIStore((s) => s.closeMethod);

  const { data } = useQuery({
    queryKey: ["methodology"],
    queryFn: api.getMethodology,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60"
            onClick={close}
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={springSettle}
            className="relative glass-strong rounded-modal w-full max-w-[600px] max-h-[80vh] overflow-y-auto shadow-modal p-6"
            role="dialog"
            aria-label="How the score is computed"
          >
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[18px] font-semibold tracking-[-0.02em] text-ink-1"
              >
                How the score is computed
              </motion.h2>
              <motion.button
                onClick={close}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-3 hover:text-ink-2 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </motion.button>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[13px] text-ink-3 mb-4 leading-relaxed"
            >
              Navuuna publishes one 0–100 service-performance score per Nairobi sub-county. It is a
              weighted average of the pillars below, each a single measured quantity with a named
              source and a stated vintage. A pillar with no reading for a sub-county is left out of
              both the numerator and the divisor — never counted as a zero.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mb-6 p-3.5 rounded-card bg-[rgba(255,255,255,0.03)] border border-border"
            >
              <div className="text-[10px] font-semibold text-ink-4 uppercase tracking-[0.08em] mb-1.5">
                Weights are published, not proprietary
              </div>
              <p className="text-[12px] text-ink-2 leading-relaxed">
                Every weight on this page is served from the same versioned registry the scorer
                reads, so what you see here is what produced the number on the map. A regulator can
                recompute any score from the pillar values and these weights.
              </p>
              {data && (
                <p className="text-[11px] text-ink-4 mt-2 tabular-nums">
                  Registry version {data.version}
                </p>
              )}
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {PILLARS.map((pillar) => {
                const key = pillar.key as PillarKey;
                const weight = data?.weights[key] ?? pillar.weight;
                return (
                  <motion.div
                    key={pillar.key}
                    variants={staggerItem}
                    transition={springSettle}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-card bg-[rgba(255,255,255,0.03)] border border-border transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <motion.div
                        className="w-6 h-6 rounded-chip flex items-center justify-center text-[11px] font-bold text-white"
                        style={{ background: PILLAR_COLORS[key] }}
                        whileHover={{ rotate: 10 }}
                      >
                        {PILLAR_GLYPHS[key]}
                      </motion.div>
                      <h3 className="text-[14px] font-semibold text-ink-1">{pillar.displayName}</h3>
                      <span className="ml-auto text-[11px] font-semibold tabular-nums text-ink-3">
                        {weight === 0 ? "held · weight 0" : `weight ${weight.toFixed(2)}`}
                      </span>
                    </div>
                    {pillar.description && (
                      <p className="text-[12px] text-ink-3 mb-3 leading-relaxed">
                        {pillar.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-4">
                      <span>Source · {pillar.sourceId ?? "—"}</span>
                      <span>Vintage · {pillar.vintage ?? "—"}</span>
                      <span>Collected at · {pillar.granularity ?? "—"}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

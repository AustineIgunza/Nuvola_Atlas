import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, Gauge, Building2, ShieldAlert, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { springSettle, modalBackdrop, panelSlideUp } from "@/lib/motion";
import { BRAND } from "@/lib/scoreColor";
import CornerCard, { type Corner } from "./CornerCard";
import Connectors, { type ConnectorDef } from "./Connectors";
import VitalityCard from "./VitalityCard";
import InfrastructureCard from "./InfrastructureCard";
import SafetyCard from "./SafetyCard";
import SocialCard from "./SocialCard";
import type { Zone } from "@/types";

interface CardDef {
  corner: Corner;
  accent: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const CARD_DEFS: CardDef[] = [
  { corner: "tl", accent: BRAND.gold, icon: Gauge, title: "Vitality", subtitle: "UE Index · Nairobi" },
  { corner: "tr", accent: BRAND.terracotta, icon: Building2, title: "Infrastructure", subtitle: "Projects & delivery" },
  { corner: "bl", accent: BRAND.steel, icon: ShieldAlert, title: "Safety & Alerts", subtitle: "Security posture" },
  { corner: "br", accent: BRAND.teal, icon: Users, title: "Social & Water", subtitle: "Wellbeing · SDG 6" },
];

const CONNECTOR_DEFS: ConnectorDef[] = CARD_DEFS.map((d) => ({
  corner: d.corner,
  accent: d.accent,
}));

interface Props {
  zone: Zone | undefined;
}

export default function ScorecardConstellation({ zone }: Props) {
  const panelOpen = useUIStore((s) => s.panelOpen);
  const closePanel = useUIStore((s) => s.closePanel);
  const openPanel = useUIStore((s) => s.openPanel);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

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

  const bodies: ReactNode[] = zone
    ? [
        <VitalityCard key="v" zone={zone} />,
        <InfrastructureCard key="i" zone={zone} />,
        <SafetyCard key="sa" zone={zone} />,
        <SocialCard key="so" zone={zone} />,
      ]
    : [];

  return (
    <>
      {/* Desktop — four corner cards framing the centred zone */}
      <AnimatePresence>
        {panelOpen && zone && !isMobile && (
          <motion.div
            key={zone.id}
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
          >
            <Connectors
              containerRef={containerRef}
              cardsRef={cardEls}
              defs={CONNECTOR_DEFS}
              zoneKey={zone.id}
            />
            {CARD_DEFS.map((d, i) => (
              <CornerCard
                key={d.corner}
                ref={(el) => {
                  cardEls.current[i] = el;
                }}
                corner={d.corner}
                accent={d.accent}
                icon={d.icon}
                title={i === 0 ? zone.name : d.title}
                subtitle={i === 0 ? "Sub-county · Vitality" : d.subtitle}
                index={i}
              >
                {bodies[i]}
              </CornerCard>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile — stacked bottom sheet */}
      <AnimatePresence>
        {panelOpen && zone && isMobile && (
          <motion.div key="constellation-sheet" className="fixed inset-0 z-40">
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
              variants={panelSlideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto glass-strong border-t border-border rounded-t-modal shadow-modal pb-safe"
              role="dialog"
              aria-modal="true"
              aria-label={`${zone.name} scorecard`}
            >
              <div className="sticky top-0 z-10 glass-strong border-b border-border rounded-t-modal px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 rounded-full bg-[rgba(255,255,255,0.18)]" />
                <div>
                  <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                    Sub-county · Nairobi
                  </div>
                  <div className="text-[16px] font-semibold text-ink-1">{zone.name}</div>
                </div>
                <button
                  onClick={closePanel}
                  aria-label="Close scorecard"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {CARD_DEFS.map((d, i) => {
                const Icon = d.icon;
                return (
                  <section key={d.corner} className="px-4 pt-3.5 pb-4 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div
                        className="w-6 h-6 rounded-chip flex items-center justify-center shrink-0"
                        style={{ background: `${d.accent}1F`, color: d.accent }}
                      >
                        <Icon size={13} />
                      </div>
                      <span className="text-[12px] font-semibold text-ink-1">{d.title}</span>
                      <span className="text-[9px] text-ink-4 uppercase tracking-[0.08em]">
                        {d.subtitle}
                      </span>
                    </div>
                    {bodies[i]}
                  </section>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-open chip — when the constellation is dismissed but a zone is still selected */}
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
              <span
                className="text-[12px] font-medium text-ink-2 tabular-nums"
                style={{ writingMode: "vertical-rl" }}
              >
                {zone.name} · {zone.score}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

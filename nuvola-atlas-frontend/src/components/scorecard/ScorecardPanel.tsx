import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ChevronLeft, ChevronUp } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { springSettle, modalBackdrop, panelSlideUp } from "@/lib/motion";
import { BRAND, PILLAR_LABELS } from "@/lib/scoreColor";
import OverviewView from "./panel/OverviewView";
import IndexExplainer from "./panel/IndexExplainer";
import PillarExplainer from "./panel/PillarExplainer";
import WaterExplainer from "./panel/WaterExplainer";
import ProjectExplainer from "./panel/ProjectExplainer";
import AlertExplainer from "./panel/AlertExplainer";
import type { PanelView } from "./panel/panel-types";
import type { Zone } from "@/types";

function headerMeta(view: PanelView, zone: Zone): { kicker: string; title: string } {
  switch (view.type) {
    case "overview":
      return { kicker: "Sub-county · Vitality Scorecard", title: zone.name };
    case "index":
      return { kicker: zone.name, title: "UE Vitality Index" };
    case "pillar":
      return { kicker: `${zone.name} · Pillar`, title: PILLAR_LABELS[view.key] };
    case "water":
      return { kicker: `${zone.name} · SDG 6`, title: "Water & Sanitation" };
    case "project":
      return { kicker: zone.name, title: "Project detail" };
    case "alert":
      return { kicker: zone.name, title: "Alert detail" };
  }
}

function viewKeyOf(view: PanelView): string {
  switch (view.type) {
    case "pillar":
      return `pillar:${view.key}`;
    case "project":
      return `project:${view.id}`;
    case "alert":
      return `alert:${view.id}`;
    default:
      return view.type;
  }
}

function renderView(view: PanelView, zone: Zone, push: (v: PanelView) => void): ReactNode {
  switch (view.type) {
    case "overview":
      return <OverviewView zone={zone} onNavigate={push} />;
    case "index":
      return <IndexExplainer zone={zone} onNavigate={push} />;
    case "pillar":
      return <PillarExplainer zone={zone} pillarKey={view.key} onNavigate={push} />;
    case "water":
      return <WaterExplainer zone={zone} onNavigate={push} />;
    case "project":
      return <ProjectExplainer projectId={view.id} onNavigate={push} />;
    case "alert":
      return <AlertExplainer alertId={view.id} onNavigate={push} />;
  }
}

interface Props {
  zone: Zone | undefined;
}

/** The Vitality Scorecard — a floating right-side panel with drill-in
 *  navigation: every row in the overview opens a detailed explainer view. */
export default function ScorecardPanel({ zone }: Props) {
  const panelOpen = useUIStore((s) => s.panelOpen);
  const closePanel = useUIStore((s) => s.closePanel);
  const openPanel = useUIStore((s) => s.openPanel);
  const reduced = useReducedMotion();

  const [stack, setStack] = useState<PanelView[]>([{ type: "overview" }]);
  const view = stack[stack.length - 1];
  const push = (v: PanelView) => setStack((s) => [...s, v]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Fresh drill-in state whenever the selected zone changes.
  useEffect(() => {
    setStack([{ type: "overview" }]);
  }, [zone?.id]);

  // Esc steps back through the drill-in first; closes only from the overview.
  useEffect(() => {
    if (!panelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (stack.length > 1) back();
      else closePanel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen, stack.length, closePanel]);

  if (!zone) return null;
  const meta = headerMeta(view, zone);
  const bodyKey = `${zone.id}:${viewKeyOf(view)}`;

  const header = (
    <div className="flex items-center gap-2 px-3.5 pt-3 pb-2.5 border-b border-border shrink-0">
      <AnimatePresence initial={false}>
        {stack.length > 1 && (
          <motion.button
            initial={{ opacity: 0, width: 0, marginRight: -8 }}
            animate={{ opacity: 1, width: 28, marginRight: 0 }}
            exit={{ opacity: 0, width: 0, marginRight: -8 }}
            transition={{ duration: 0.15 }}
            onClick={back}
            aria-label="Back"
            className="h-7 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-3 hover:text-ink-1 transition-colors shrink-0 btn-press overflow-hidden"
          >
            <ChevronLeft size={14} />
          </motion.button>
        )}
      </AnimatePresence>
      <div className="flex-1 min-w-0">
        <div className="text-[9.5px] font-medium text-ink-4 uppercase tracking-[0.1em] truncate">
          {meta.kicker}
        </div>
        <div className="text-[15px] font-semibold text-ink-1 leading-tight truncate" title={meta.title}>
          {meta.title}
        </div>
      </div>
      <button
        onClick={closePanel}
        aria-label="Close scorecard"
        className="w-7 h-7 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors shrink-0 btn-press"
      >
        <X size={13} />
      </button>
    </div>
  );

  const body = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={bodyKey}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      >
        {renderView(view, zone, push)}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      {/* Desktop — floating panel over the map's right edge */}
      <AnimatePresence>
        {panelOpen && !isMobile && (
          <motion.aside
            key="scorecard-panel"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={springSettle}
            role="complementary"
            aria-label={`${zone.name} scorecard`}
            className="absolute top-3 right-3 bottom-3 z-20 w-[380px] xl:w-[420px] flex flex-col glass-strong border border-border rounded-modal shadow-modal overflow-hidden"
          >
            <div
              className="h-[2.5px] shrink-0"
              style={{ background: `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.teal})` }}
            />
            {header}
            <div className="flex-1 overflow-y-auto p-3">{body}</div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile — bottom sheet */}
      <AnimatePresence>
        {panelOpen && isMobile && (
          <motion.div key="scorecard-sheet" className="fixed inset-0 z-40">
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
              variants={panelSlideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              role="dialog"
              aria-modal="true"
              aria-label={`${zone.name} scorecard`}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col glass-strong border-t border-border rounded-t-modal shadow-modal pb-safe"
            >
              <div
                className="h-[2.5px] shrink-0 rounded-t-modal"
                style={{ background: `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.teal})` }}
              />
              <div className="relative shrink-0">
                <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 rounded-full bg-[rgba(255,255,255,0.18)]" />
                {header}
              </div>
              <div className="flex-1 overflow-y-auto p-3.5">{body}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-open chip — panel dismissed but a zone is still selected */}
      <AnimatePresence>
        {!panelOpen && (
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

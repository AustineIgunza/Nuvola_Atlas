import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { springSettle, panelSlideUp, modalBackdrop, fadeIn } from "@/lib/motion";

interface Props {
  open: boolean;
  onClose: () => void;
  label: string;
  ariaLabel: string;
  wide?: boolean;
  children: React.ReactNode;
}

/**
 * Rounded side-floating detail popup. Desktop: detached panel anchored to the
 * right with margins — no backdrop, so the page beside it stays interactive.
 * Mobile: bottom sheet with a dimmed backdrop.
 */
export default function DetailPopup({ open, onClose, label, ariaLabel, wide, children }: Props) {
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches,
  );

  // A fresh popup always opens at its default width.
  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  // Keep the last rendered children through the exit animation so the popup
  // doesn't blank out while sliding away (children go null the moment the
  // consumer clears its selection).
  const frozen = useRef(children);
  if (open) frozen.current = children;
  const content = open ? children : frozen.current;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const header = (
    <div className="relative shrink-0 flex items-center justify-between gap-2 px-4 h-12 border-b border-border">
      <span className="flex-1 min-w-0 truncate text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
        {label}
      </span>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="hidden lg:flex w-8 h-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
        aria-label={expanded ? "Collapse panel" : "Expand panel"}
        title={expanded ? "Collapse" : "Expand"}
      >
        {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
      </button>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
        aria-label="Close details"
      >
        <X size={14} />
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40">
            <motion.div
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              variants={reduce ? fadeIn : panelSlideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col glass-strong border-t border-border rounded-t-modal shadow-modal"
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
            >
              <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 rounded-full bg-[rgba(255,255,255,0.18)]" />
              {header}
              <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain pb-safe">
                {content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 48, scale: 0.97 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 48, scale: 0.97 }}
          transition={springSettle}
          className={cn(
            "fixed top-[4.25rem] bottom-4 right-4 z-40 flex flex-col",
            "glass-strong border border-border rounded-modal shadow-modal overflow-hidden",
            "transition-[width] duration-300 ease-out",
            expanded
              ? "w-[min(760px,calc(100vw-2rem))]"
              : wide
                ? "w-[440px] xl:w-[520px]"
                : "w-[440px] xl:w-[480px]",
          )}
          role="complementary"
          aria-label={ariaLabel}
        >
          {header}
          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">{content}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

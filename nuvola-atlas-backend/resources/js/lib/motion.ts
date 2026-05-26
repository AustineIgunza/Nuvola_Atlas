import type { Transition, Variants } from "framer-motion";

/* ── Apple-style spring presets ──────────────────────────── */

/** iOS default spring — smooth, no overshoot, ~0.5s settle */
export const springApple: Transition = { type: "spring", stiffness: 200, damping: 26, mass: 1 };

/** Snappy interactions (button presses, toggles) */
export const springSnap: Transition = { type: "spring", stiffness: 300, damping: 30, mass: 0.8 };

/** Default settle — balanced for panels and cards */
export const springSettle: Transition = { type: "spring", stiffness: 220, damping: 28, mass: 1 };

/** Gentle float — modals, overlays */
export const springGentle: Transition = { type: "spring", stiffness: 160, damping: 24, mass: 1.1 };

/** Bouncy — playful micro-interactions */
export const springBouncy: Transition = { type: "spring", stiffness: 400, damping: 22, mass: 0.9 };

/* ── Fade & Slide variants ───────────────────────────────── */

export const fadeIn: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
export const fadeSlideUp: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };
export const fadeSlideRight: Variants = { hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 } };
export const scaleIn: Variants = { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } };

/* ── Stagger containers (Apple-smooth pacing) ────────────── */

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};
export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
};

export const staggerItem: Variants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } };
export const staggerItemScale: Variants = { hidden: { opacity: 0, scale: 0.97, y: 4 }, visible: { opacity: 1, scale: 1, y: 0 } };

/* ── Slide panels ────────────────────────────────────────── */

export const panelSlideRight: Variants = { hidden: { x: "100%" }, visible: { x: 0 }, exit: { x: "100%" } };
export const panelSlideLeft: Variants = { hidden: { x: "-100%" }, visible: { x: 0 }, exit: { x: "-100%" } };
export const panelSlideUp: Variants = { hidden: { y: "100%" }, visible: { y: 0 }, exit: { y: "100%" } };

/* ── Modals ──────────────────────────────────────────────── */

export const modalBackdrop: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 6 },
};

/* ── Page transition ─────────────────────────────────────── */

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } },
  exit: { opacity: 0, y: -3, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } },
};

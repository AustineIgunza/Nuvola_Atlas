import { forwardRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { springSettle } from "@/lib/motion";

export type Corner = "tl" | "tr" | "bl" | "br";

const CORNER_POS: Record<Corner, string> = {
  tl: "top-[3.75rem] left-3 max-h-[calc(50%-3.25rem)]",
  tr: "top-[3.75rem] right-3 max-h-[calc(50%-3.25rem)]",
  bl: "bottom-3 left-3 max-h-[calc(50%-2rem)]",
  br: "bottom-3 right-3 max-h-[calc(50%-2rem)]",
};

const CORNER_OFFSET: Record<Corner, { x: number; y: number }> = {
  tl: { x: -28, y: -28 },
  tr: { x: 28, y: -28 },
  bl: { x: -28, y: 28 },
  br: { x: 28, y: 28 },
};

interface Props {
  corner: Corner;
  accent: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  index: number;
  children: ReactNode;
}

const CornerCard = forwardRef<HTMLDivElement, Props>(function CornerCard(
  { corner, accent, icon: Icon, title, subtitle, index, children },
  ref,
) {
  const closePanel = useUIStore((s) => s.closePanel);
  const reduce = useReducedMotion();
  const off = CORNER_OFFSET[corner];

  return (
    <motion.div
      ref={ref}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: off.x, y: off.y, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ ...springSettle, delay: index * 0.07 }}
      className={`absolute pointer-events-auto w-[260px] lg:w-[300px] xl:w-[330px] flex flex-col glass-strong border border-border rounded-modal shadow-modal overflow-hidden ${CORNER_POS[corner]}`}
    >
      <div
        className="h-[2.5px] shrink-0"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent 85%)` }}
      />
      <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-2 shrink-0">
        <div
          className="w-6 h-6 rounded-chip flex items-center justify-center shrink-0"
          style={{ background: `${accent}1F`, color: accent }}
        >
          <Icon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-ink-1 truncate leading-tight">{title}</div>
          {subtitle && (
            <div className="text-[9px] text-ink-4 uppercase tracking-[0.08em] truncate">{subtitle}</div>
          )}
        </div>
        <button
          onClick={closePanel}
          aria-label="Close scorecard"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors shrink-0"
        >
          <X size={12} />
        </button>
      </div>
      <div className="px-3.5 pb-3.5 overflow-y-auto min-h-0">{children}</div>
    </motion.div>
  );
});

export default CornerCard;

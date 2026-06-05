import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning" | "success";
}

const TONE_RING: Record<NonNullable<Props["tone"]>, string> = {
  default: "ring-[rgba(255,255,255,0.06)]",
  warning: "ring-[rgba(255,189,89,0.25)]",
  success: "ring-[rgba(57,210,143,0.25)]",
};

export default function MetricCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "glass rounded-control p-4 ring-1 transition-shadow",
        TONE_RING[tone],
      )}
    >
      <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em]">{label}</div>
      <div className="mt-1 text-[28px] font-semibold tabular-nums text-ink-1 leading-none">
        {value}
      </div>
      {hint && <div className="mt-2 text-[11px] text-ink-4">{hint}</div>}
    </motion.div>
  );
}

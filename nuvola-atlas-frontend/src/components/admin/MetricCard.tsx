import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import Sparkline from "./Sparkline";

interface Props {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning" | "success";
  spark?: number[];
  sparkColor?: string;
  sparkAriaLabel?: string;
}

const TONE_RING: Record<NonNullable<Props["tone"]>, string> = {
  default: "ring-[rgba(255,255,255,0.06)]",
  warning: "ring-[rgba(224,168,46,0.25)]",
  success: "ring-[rgba(31,138,120,0.25)]",
};

const TONE_COLOR: Record<NonNullable<Props["tone"]>, string> = {
  default: "#C0552B",
  warning: "#E0A82E",
  success: "#1F8A78",
};

export default function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  spark,
  sparkColor,
  sparkAriaLabel,
}: Props) {
  const sparkResolved = spark && spark.length > 0;
  const color = sparkColor ?? TONE_COLOR[tone];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "glass rounded-control p-4 ring-1 transition-shadow",
        TONE_RING[tone],
      )}
    >
      <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em]">{label}</div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="text-[28px] font-semibold tabular-nums text-ink-1 leading-none">
          {value}
        </div>
        {sparkResolved && (
          <Sparkline
            data={spark!}
            color={color}
            ariaLabel={sparkAriaLabel ?? `${label} trend`}
            className="opacity-90"
          />
        )}
      </div>
      {hint && <div className="mt-2 text-[11px] text-ink-4">{hint}</div>}
    </motion.div>
  );
}

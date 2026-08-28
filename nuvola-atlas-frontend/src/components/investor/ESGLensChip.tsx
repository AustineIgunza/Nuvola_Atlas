import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useChromeStore } from "@/shared/stores/chrome";
import { useAuthStore, isInvestor } from "@/shared/stores/auth";
import { useT } from "@/shared/lib/i18n/use-t";
import { springSettle } from "@/shared/lib/motion";

interface Props {
  className?: string;
}

/**
 * Investor "ESG lens" — an additive framing chip that toggles a scorecard
 * re-order (Safety + Infra rise, Social + Density recede) plus a subtle
 * tint on the lens indicator itself. Hidden for non-investors.
 *
 * Deliberately additive, not destructive — the underlying scores never
 * change; only the presentation order does. Persisted per-browser via
 * the chrome store so a reload keeps the operator's chosen framing.
 */
export default function ESGLensChip({ className }: Props) {
  const user = useAuthStore((s) => s.user);
  const on = useChromeStore((s) => s.esgLens);
  const toggle = useChromeStore((s) => s.toggleEsgLens);
  const t = useT();

  if (!isInvestor(user)) return null;

  const label = on ? t("esgLens.on") : t("esgLens.off");
  const aria = on ? t("esgLens.turnOff") : t("esgLens.turnOn");

  return (
    <motion.button
      layout
      transition={springSettle}
      onClick={toggle}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors backdrop-blur-md " +
        (on
          ? "border-[color:var(--accent-1,#1F8A78)] bg-[color:var(--accent-1-soft,rgba(31,138,120,0.15))] text-[color:var(--accent-1,#1F8A78)]"
          : "border-border bg-surface-2/70 text-ink-3 hover:text-ink-1") +
        (className ? " " + className : "")
      }
      aria-pressed={on}
      aria-label={aria}
      title={aria}
    >
      <Sparkles size={11} className={on ? "opacity-100" : "opacity-60"} />
      <span className="whitespace-nowrap">{label}</span>
    </motion.button>
  );
}

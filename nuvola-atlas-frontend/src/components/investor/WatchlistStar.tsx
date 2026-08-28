import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useWatchlistStore } from "@/shared/stores/watchlist";
import { useAuthStore, isInvestor } from "@/shared/stores/auth";
import { useT } from "@/shared/lib/i18n/use-t";

interface Props {
  zoneId: string;
  size?: number;
  className?: string;
}

/**
 * Investor-only ★ chip. Adds / removes a zone from the firm's watchlist
 * with one tap. Hidden entirely for viewer / partner / editor / admin —
 * they don't have a firm scope, so the concept doesn't apply.
 *
 * Store-backed, so the state is shared across the sidebar zone list, the
 * atlas chips, and the /investor portfolio surface simultaneously.
 */
export default function WatchlistStar({ zoneId, size = 12, className }: Props) {
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const isWatched = useWatchlistStore((s) => s.ids.has(zoneId));
  const toggle = useWatchlistStore((s) => s.toggle);

  if (!isInvestor(user)) return null;

  const label = isWatched ? t("watchlist.remove") : t("watchlist.add");

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(zoneId);
      }}
      className={
        "inline-flex items-center justify-center rounded-full shrink-0 transition-colors " +
        (isWatched
          ? "text-[color:var(--gold,#E0A82E)]"
          : "text-ink-4 hover:text-ink-2 opacity-60 hover:opacity-100") +
        (className ? " " + className : "")
      }
      aria-label={label}
      title={label}
    >
      <Star size={size} fill={isWatched ? "currentColor" : "none"} />
    </motion.button>
  );
}

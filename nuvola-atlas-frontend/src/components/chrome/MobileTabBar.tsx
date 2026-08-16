import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Map,
  BarChart3,
  HardHat,
  FileText,
  Bell,
  Briefcase,
  Sparkles,
  Shield,
  MoreHorizontal,
  Settings,
  LogOut,
  Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { springSettle } from "@/lib/motion";
import { api } from "@/api";
import { useAuthStore, hasRoleAtLeast, isInvestor } from "@/stores/auth";
import { useChromeStore } from "@/stores/chrome";
import { useT } from "@/lib/i18n/use-t";
import type { MessageKey } from "@/lib/i18n/translate";

interface Tab {
  path: string;
  labelKey: MessageKey;
  icon: LucideIcon;
}

/**
 * Role-aware mobile chrome. Instead of a full-width bottom bar we render
 * a floating vertical pill on the right edge with icon-only nav entries.
 * Cleaner, matches the desktop sidebar collapsed-mode aesthetic, and
 * gives page content the full width of the phone screen.
 *
 * A More button opens a small bottom sheet with the overflow items
 * (Settings, Methodology explainer, Sign out).
 */
export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const openMethod = useChromeStore((s) => s.openMethod);
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.getAlerts,
  });
  const unread = alerts?.filter((a) => !a.read).length ?? 0;

  const tabs: Tab[] = useMemo(() => {
    if (isInvestor(user)) {
      return [
        { path: "/investor", labelKey: "nav.investor", icon: Briefcase },
        { path: "/atlas", labelKey: "nav.atlas", icon: Map },
        { path: "/compare", labelKey: "nav.compare", icon: BarChart3 },
        { path: "/alerts", labelKey: "nav.alerts", icon: Bell },
        { path: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
      ];
    }
    if (hasRoleAtLeast(user, "admin")) {
      return [
        { path: "/atlas", labelKey: "nav.atlas", icon: Map },
        { path: "/compare", labelKey: "nav.compare", icon: BarChart3 },
        { path: "/alerts", labelKey: "nav.alerts", icon: Bell },
        { path: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
        { path: "/admin", labelKey: "nav.admin", icon: Shield },
      ];
    }
    return [
      { path: "/atlas", labelKey: "nav.atlas", icon: Map },
      { path: "/vitality", labelKey: "nav.vitality", icon: BarChart3 },
      { path: "/infrastructure", labelKey: "nav.infrastructure", icon: HardHat },
      { path: "/reports", labelKey: "nav.reports", icon: FileText },
      { path: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
    ];
  }, [user]);

  return (
    <>
      {/* Floating vertical pill on the right edge, above safe-area inset */}
      <motion.nav
        aria-label="Primary"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={springSettle}
        className="md:hidden fixed z-30 right-2 flex flex-col items-center gap-0.5 p-1 rounded-modal glass-strong border border-border shadow-modal"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 12px)",
        }}
      >
        {tabs.map(({ path, labelKey, icon: Icon }) => {
          const active = location.pathname.startsWith(path);
          const showBadge = path === "/alerts" && unread > 0;
          const label = t(labelKey);
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.88 }}
              transition={springSettle}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative w-10 h-10 rounded-control flex items-center justify-center transition-colors",
                active
                  ? "text-white bg-accent"
                  : "text-ink-3 hover:text-ink-1 hover:bg-[rgba(255,255,255,0.06)]",
              )}
              title={label}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
              {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-danger text-white text-[8.5px] font-bold flex items-center justify-center glow-danger">
                  {unread}
                </span>
              )}
            </motion.button>
          );
        })}
        <motion.button
          onClick={() => setMoreOpen(true)}
          whileTap={{ scale: 0.88 }}
          transition={springSettle}
          aria-label={t("common.more")}
          className="w-10 h-10 rounded-control flex items-center justify-center text-ink-3 hover:text-ink-1 hover:bg-[rgba(255,255,255,0.06)]"
        >
          <MoreHorizontal size={17} />
        </motion.button>
      </motion.nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="mobile-more-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="mobile-more-sheet"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="md:hidden fixed right-2 z-40 w-[220px] rounded-modal glass-strong border border-border shadow-modal p-2"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 68px)" }}
          >
            <MoreItem
              icon={<Info size={16} />}
              label={t("sidebar.howComputed")}
              onClick={() => {
                openMethod();
                setMoreOpen(false);
              }}
            />
            <MoreItem
              icon={<Settings size={16} />}
              label={t("nav.settings")}
              onClick={() => {
                navigate("/settings");
                setMoreOpen(false);
              }}
            />
            <MoreItem
              icon={<LogOut size={16} />}
              label={t("nav.signOut")}
              danger
              onClick={() => {
                signOut();
                navigate("/sign-in");
                setMoreOpen(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MoreItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 h-11 px-3 rounded-control text-[13px] font-medium transition-colors",
        danger
          ? "text-danger hover:bg-[rgba(211,64,46,0.08)]"
          : "text-ink-2 hover:bg-[rgba(255,255,255,0.05)]",
      )}
    >
      <span className="w-5 shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

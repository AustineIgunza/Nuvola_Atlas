import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Map, BarChart3, HardHat, FileText, Bell, Briefcase, Sparkles, Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { springSettle } from "@/lib/motion";
import { api } from "@/api";
import { useAuthStore, hasRoleAtLeast, isInvestor } from "@/stores/auth";
import { useT } from "@/lib/i18n/use-t";
import type { MessageKey } from "@/lib/i18n/translate";

interface Tab {
  path: string;
  labelKey: MessageKey;
  icon: LucideIcon;
}

/**
 * Role-aware mobile bottom nav. Five slots — chosen per role so the
 * primary flows for each audience are always one tap away:
 *   viewer/partner/editor  → Atlas, Vitality, Infra, Alerts, Assistant
 *   investor              → Portfolio, Atlas, Compare, Alerts, Assistant
 *   admin                 → Atlas, Compare, Alerts, Assistant, Admin
 */
export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const user = useAuthStore((s) => s.user);

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
      { path: "/alerts", labelKey: "nav.alerts", icon: Bell },
      { path: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
    ];
  }, [user]);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-strong border-t border-border pb-safe"
      style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }}
    >
      <ul className="grid grid-cols-5 h-14 px-1">
        {tabs.map(({ path, labelKey, icon: Icon }) => {
          const active = location.pathname.startsWith(path);
          const showBadge = path === "/alerts" && unread > 0;
          const label = t(labelKey);
          return (
            <li key={path} className="flex">
              <motion.button
                onClick={() => navigate(path)}
                whileTap={{ scale: 0.92 }}
                transition={springSettle}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 rounded-control mx-0.5",
                  active ? "text-accent" : "text-ink-3",
                )}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={active ? 2.25 : 2} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center glow-danger">
                      {unread}
                    </span>
                  )}
                </span>
                <span className={cn("text-[10px] font-medium tracking-tight truncate max-w-full px-0.5", active && "font-semibold")}>
                  {label}
                </span>
                {active && (
                  <motion.span
                    layoutId="mobile-tab-indicator"
                    transition={springSettle}
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-accent glow-accent"
                  />
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

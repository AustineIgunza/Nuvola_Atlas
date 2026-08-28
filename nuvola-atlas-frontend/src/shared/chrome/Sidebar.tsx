import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  BarChart3,
  HardHat,
  FileText,
  Bell,
  LogOut,
  Shield,
  GitCompareArrows,
  ChevronRight,
  Info,
  Menu,
  X,
  Sparkles,
  Settings as SettingsIcon,
  Briefcase,
  Building2,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { springSettle, staggerContainer, staggerItem, panelSlideLeft } from "@/shared/lib/motion";
import { useUIStore } from "@/shared/stores/ui";
import { useAuthStore, hasRoleAtLeast, isInvestor } from "@/shared/stores/auth";
import { usePrefsStore } from "@/shared/stores/prefs";
import { api } from "@/api";
import { scoreColor } from "@/shared/lib/scoreColor";
import { Emblem, Wordmark } from "@/shared/ui/Brand";
import { LAYER_META } from "@/features/atlas/components/atlas-map.constants";
import WatchlistStar from "@/features/investor/components/WatchlistStar";
import { useT } from "@/shared/lib/i18n/use-t";
import type { MessageKey } from "@/shared/lib/i18n/translate";
import { useState, useEffect } from "react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";

function formatSyncAge(minutes: number, t: ReturnType<typeof useT>): string {
  if (minutes < 1) return t("sidebar.syncAge.justNow");
  if (minutes < 60) return t("sidebar.syncAge.minutes", { n: minutes });
  const hr = Math.floor(minutes / 60);
  if (hr < 24) return t("sidebar.syncAge.hours", { n: hr });
  const day = Math.floor(hr / 24);
  if (day < 30) return t("sidebar.syncAge.days", { n: day });
  return t("sidebar.syncAge.months", { n: Math.floor(day / 30) });
}

const NAV: ReadonlyArray<{
  path: string;
  labelKey: MessageKey;
  icon: typeof Map;
  requiresAdmin: boolean;
  showFor?: "investor";
}> = [
  {
    path: "/investor",
    labelKey: "nav.investor",
    icon: Briefcase,
    requiresAdmin: false,
    showFor: "investor",
  },
  { path: "/atlas", labelKey: "nav.atlas", icon: Map, requiresAdmin: false },
  { path: "/vitality", labelKey: "nav.vitality", icon: BarChart3, requiresAdmin: false },
  { path: "/compare", labelKey: "nav.compare", icon: GitCompareArrows, requiresAdmin: false },
  { path: "/infrastructure", labelKey: "nav.infrastructure", icon: HardHat, requiresAdmin: false },
  { path: "/reports", labelKey: "nav.reports", icon: FileText, requiresAdmin: false },
  { path: "/alerts", labelKey: "nav.alerts", icon: Bell, requiresAdmin: false },
  { path: "/assistant", labelKey: "nav.assistant", icon: Sparkles, requiresAdmin: false },
  { path: "/settings", labelKey: "nav.settings", icon: SettingsIcon, requiresAdmin: false },
  { path: "/admin", labelKey: "nav.admin", icon: Shield, requiresAdmin: true },
];

export default function Sidebar() {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  // Settings > Profile writes into prefs.displayName, not into the auth
  // user record. Read it here so the sidebar name updates live when the
  // user renames themselves without a full sign-out cycle.
  const displayName = usePrefsStore((s) => s.displayName);
  const isAdmin = hasRoleAtLeast(user, "admin");
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const activeLayers = useUIStore((s) => s.activeLayers);
  const toggleLayer = useUIStore((s) => s.toggleLayer);
  const openMethod = useUIStore((s) => s.openMethod);
  const isAtlas = location.pathname === "/atlas";

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const { data: zones } = useQuery({
    queryKey: ["zones"],
    queryFn: api.getZones,
  });

  function handleZoneClick(id: string) {
    setSelectedZone(id);
    if (location.pathname !== "/atlas") navigate(`/atlas?zone=${id}`);
    setMobileOpen(false);
  }

  function handleNav(path: string) {
    navigate(path);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-start gap-3 px-4 py-2.5 border-b border-border shrink-0">
        <Link
          to="/atlas"
          onClick={() => {
            setSelectedZone(null);
            setMobileOpen(false);
          }}
          className="flex items-center gap-2.5 min-w-0 flex-1 rounded-control -mx-1 px-1 py-1 hover:bg-[rgba(255,255,255,0.04)] transition-colors btn-press"
          aria-label="Navuuna — go to map"
        >
          <motion.div
            className="shrink-0 flex items-center justify-center"
            whileHover={{ rotate: 8, scale: 1.06 }}
            transition={springSettle}
          >
            <Emblem size={28} />
          </motion.div>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springSettle}
              className="min-w-0 flex flex-col leading-tight"
            >
              <Wordmark className="text-[17px]" />
              {/* Brand tagline — kept in English so it reads the same across
                  locales; changing it means changing the pitch deck too.
                  Tracking is deliberately tight so the phrase fits inside
                  the 244px sidebar column at 9.5px without truncation. */}
              <span className="text-[9.5px] font-medium text-ink-4 tracking-[0.01em] mt-0.5 leading-[1.15]">
                Making African investments greener
              </span>
            </motion.div>
          )}
        </Link>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 btn-press shrink-0"
            aria-label={t("sidebar.closeMenu")}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          {NAV.filter((item) => {
            if (item.requiresAdmin && !isAdmin) return false;
            // Portfolio is only for investors — admins have their own console
            // and should not see the investor Portfolio button in their sidebar.
            if (item.showFor === "investor" && !isInvestor(user)) return false;
            return true;
          }).map(({ path, labelKey, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            const label = t(labelKey);
            return (
              <motion.button
                key={path}
                variants={staggerItem}
                onClick={() => handleNav(path)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                transition={springSettle}
                className={cn(
                  "w-full flex items-center gap-3 h-10 px-3 rounded-control text-[13.5px] transition-colors relative overflow-hidden",
                  active ? "text-accent font-bold" : "text-ink-2 hover:text-ink-1 font-semibold",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-[rgba(192,85,43,0.14)] rounded-control nav-glow"
                    transition={springSettle}
                  />
                )}
                <Icon size={17} strokeWidth={active ? 2.4 : 2} className="shrink-0 relative z-10" />
                {(!collapsed || isMobile) && (
                  <span className="relative z-10 tracking-[-0.005em]">{label}</span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Layer toggles on atlas */}
        <AnimatePresence>
          {isAtlas && (!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springSettle}
              className="mt-4 pt-4 border-t border-border overflow-hidden"
            >
              <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] px-3 mb-2">
                {t("sidebar.dataLayers")}
              </div>
              <div className="space-y-1.5">
                {LAYER_META.map((layer) => {
                  const on = activeLayers[layer.key];
                  return (
                    <div
                      key={layer.key}
                      className={cn(
                        "mx-1 rounded-card border p-2.5 transition-colors",
                        on
                          ? "bg-[rgba(192,85,43,0.10)] border-[rgba(192,85,43,0.35)]"
                          : "bg-[rgba(255,255,255,0.02)] border-border hover:bg-[rgba(255,255,255,0.04)]",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn("w-2 h-2 rounded-full mt-1 shrink-0", on && "pulse-glow")}
                          style={{
                            background: layer.color,
                            boxShadow: on ? `0 0 8px ${layer.color}` : undefined,
                            opacity: on ? 1 : 0.55,
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-ink-1 leading-tight">
                            {t(layer.labelKey)}
                          </div>
                          <p className="mt-0.5 text-[10.5px] leading-snug text-ink-3">
                            {t(layer.descriptionKey)}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleLayer(layer.key)}
                          className="toggle-track shrink-0 mt-0.5"
                          data-on={on}
                          style={{
                            background: on ? "#C0552B" : "rgba(244,239,230,0.14)",
                          }}
                          role="switch"
                          aria-checked={on}
                          aria-label={t("sidebar.toggleLayer", { label: t(layer.labelKey) })}
                        >
                          <div className="toggle-thumb" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {layer.sdg && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                            style={{
                              background: `${layer.color}22`,
                              color: layer.color,
                            }}
                          >
                            {layer.sdg}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] text-ink-3 bg-[rgba(255,255,255,0.04)]">
                          {t("sidebar.featuresCount", { count: layer.features })}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] text-ink-4 bg-[rgba(255,255,255,0.02)]">
                          {formatSyncAge(layer.lastSyncMin, t)}
                        </span>
                      </div>
                      <div className="mt-1 text-[9px] text-ink-4 truncate">{layer.source}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sub-county list */}
        <AnimatePresence>
          {(!collapsed || isMobile) && zones && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springSettle}
              className="mt-4 pt-4 border-t border-border overflow-hidden"
            >
              <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] px-3 mb-2">
                {t("sidebar.subcounties")}
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-0.5 max-h-[280px] overflow-y-auto"
              >
                {zones.map((z) => (
                  <motion.button
                    key={z.id}
                    variants={staggerItem}
                    onClick={() => handleZoneClick(z.id)}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    transition={springSettle}
                    className={cn(
                      "w-full flex items-center gap-2 h-8 px-3 rounded-chip text-[12px] transition-colors relative",
                      selectedZoneId === z.id
                        ? "bg-[rgba(192,85,43,0.12)] text-ink-1"
                        : "text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.03)]",
                    )}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: scoreColor(z.score),
                        boxShadow: `0 0 6px ${scoreColor(z.score)}66`,
                      }}
                      animate={selectedZoneId === z.id ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    />
                    <span className="truncate flex-1 text-left">{z.name}</span>
                    <WatchlistStar zoneId={z.id} size={11} />
                    <span className="tabular-nums text-ink-4 w-6 text-right">{z.score}</span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-border space-y-0.5 shrink-0">
        {/* Role + firm badge so scope is always visible. Shows: */}
        {/*   Investor · Acumen East Africa · deal */}
        {/*   Administrator */}
        {/*   Viewer  (etc.)                          */}
        {(!collapsed || isMobile) && user && (
          <div className="px-3 py-2 rounded-control bg-[rgba(255,255,255,0.03)] mb-1">
            <div className="flex items-center gap-1.5 text-[9.5px] font-medium text-ink-4 uppercase tracking-[0.08em]">
              <Building2 size={9} />
              {t(
                user.role === "admin"
                  ? "sidebar.role.admin"
                  : user.role === "investor"
                    ? "sidebar.role.investor"
                    : "sidebar.role.viewer",
              )}
              {user.firm && (
                <span
                  className="ml-auto px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                  style={{ background: "rgba(31,138,120,0.15)", color: "rgb(31,138,120)" }}
                >
                  {user.firm.tier}
                </span>
              )}
            </div>
            <div className="text-[10.5px] font-semibold text-ink-1 leading-tight truncate mt-0.5">
              {user.firm?.name ?? displayName ?? user.name}
            </div>
          </div>
        )}
        {(!collapsed || isMobile) && (
          <motion.button
            onClick={openMethod}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 h-8 px-3 rounded-control text-[12px] text-ink-4 hover:text-ink-3 transition-colors"
          >
            <Info size={14} />
            {t("sidebar.howComputed")}
          </motion.button>
        )}
        <motion.button
          onClick={() => {
            signOut();
            navigate("/sign-in");
          }}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-3 h-8 px-3 rounded-control text-[12px] text-ink-4 hover:text-danger transition-colors"
        >
          <LogOut size={14} className="shrink-0" />
          {(!collapsed || isMobile) && t("nav.signOut")}
        </motion.button>
        {!isMobile && (
          <motion.button
            onClick={toggleSidebar}
            whileTap={{ scale: 0.9 }}
            className="w-full flex items-center justify-center h-8 rounded-control text-ink-4 hover:text-ink-3 transition-colors"
            aria-label={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
          >
            <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={springSettle}>
              <ChevronRight size={14} />
            </motion.div>
          </motion.button>
        )}
      </div>
    </>
  );

  // Mobile: hamburger + drawer
  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <motion.button
          onClick={() => setMobileOpen(true)}
          whileTap={{ scale: 0.9 }}
          className="fixed top-3 left-3 z-50 w-11 h-11 glass rounded-control flex items-center justify-center text-ink-2 shadow-chrome"
          aria-label={t("sidebar.openMenu")}
        >
          <Menu size={20} />
        </motion.button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/60"
                onClick={() => setMobileOpen(false)}
              />
              {/* Drawer */}
              <motion.aside
                variants={panelSlideLeft}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={springSettle}
                className="fixed inset-y-0 left-0 z-50 w-[280px] glass-strong flex flex-col"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: a truly floating panel over whatever is behind it. Same
  // language as the Vitality Scorecard — fixed-positioned card with rounded
  // corners, border, and soft shadow. AppShell removes its left padding on
  // /atlas so the map extends full-width under the sidebar, and pads on
  // every other route so text content clears the panel.
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 244 }}
      transition={springSettle}
      className="hidden md:flex glass-strong flex-col fixed top-3 left-3 bottom-3 z-30 overflow-hidden rounded-modal border border-border shadow-modal"
    >
      {sidebarContent}
    </motion.aside>
  );
}

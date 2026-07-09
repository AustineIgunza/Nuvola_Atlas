import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, BarChart3, HardHat, FileText, Bell, LogOut, Shield, GitCompareArrows,
  ChevronRight, Info, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { springSettle, staggerContainer, staggerItem, panelSlideLeft } from "@/lib/motion";
import { useUIStore } from "@/stores/ui";
import { useAuthStore, hasRoleAtLeast } from "@/stores/auth";
import { api } from "@/api";
import { scoreColor } from "@/lib/scoreColor";
import { Emblem, Wordmark } from "@/components/brand/Brand";
import { useState, useEffect } from "react";

const NAV = [
  { path: "/atlas", label: "Atlas", icon: Map, requiresAdmin: false },
  { path: "/vitality", label: "Vitality", icon: BarChart3, requiresAdmin: false },
  { path: "/compare", label: "Compare", icon: GitCompareArrows, requiresAdmin: false },
  { path: "/infrastructure", label: "Infrastructure", icon: HardHat, requiresAdmin: false },
  { path: "/reports", label: "Reports", icon: FileText, requiresAdmin: false },
  { path: "/alerts", label: "Alerts", icon: Bell, requiresAdmin: false },
  { path: "/admin", label: "Admin", icon: Shield, requiresAdmin: true },
] as const;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
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
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <Link
          to="/atlas"
          onClick={() => { setSelectedZone(null); setMobileOpen(false); }}
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
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springSettle}
            >
              <Wordmark className="text-[17px]" />
            </motion.span>
          )}
        </Link>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 btn-press shrink-0"
            aria-label="Close menu"
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
          {NAV.filter((item) => !item.requiresAdmin || isAdmin).map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
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
                  active
                    ? "text-accent font-bold"
                    : "text-ink-2 hover:text-ink-1 font-semibold",
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
                Asase · Data Layers
              </div>
              {([
                { key: "vitality" as const, label: "Vitality Zones" },
                { key: "roads" as const, label: "Roads" },
                { key: "energy" as const, label: "Energy & Grid" },
                { key: "density" as const, label: "Density" },
                { key: "water" as const, label: "Water & Sanitation" },
                { key: "momentum" as const, label: "Project Momentum" },
                { key: "safety" as const, label: "Safety & Security" },
              ]).map(({ key, label }) => (
                <motion.button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between h-9 px-3 rounded-chip text-[12px] text-ink-3 hover:text-ink-2 transition-colors"
                >
                  {label}
                  <div
                    className="toggle-track"
                    data-on={activeLayers[key]}
                    style={{
                      background: activeLayers[key] ? "#C0552B" : "rgba(244,239,230,0.14)",
                    }}
                    role="switch"
                    aria-checked={activeLayers[key]}
                    aria-label={`Toggle ${label} layer`}
                  >
                    <div className="toggle-thumb" />
                  </div>
                </motion.button>
              ))}
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
                Sub-counties
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
                      style={{ background: scoreColor(z.score), boxShadow: `0 0 6px ${scoreColor(z.score)}66` }}
                      animate={selectedZoneId === z.id ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    />
                    <span className="truncate">{z.name}</span>
                    <span className="ml-auto tabular-nums text-ink-4">{z.score}</span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-border space-y-0.5 shrink-0">
        {(!collapsed || isMobile) && (
          <motion.button
            onClick={openMethod}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 h-8 px-3 rounded-control text-[12px] text-ink-4 hover:text-ink-3 transition-colors"
          >
            <Info size={14} />
            How the score is computed
          </motion.button>
        )}
        <motion.button
          onClick={() => { signOut(); navigate("/sign-in"); }}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-3 h-8 px-3 rounded-control text-[12px] text-ink-4 hover:text-danger transition-colors"
        >
          <LogOut size={14} className="shrink-0" />
          {(!collapsed || isMobile) && "Sign out"}
        </motion.button>
        {!isMobile && (
          <motion.button
            onClick={toggleSidebar}
            whileTap={{ scale: 0.9 }}
            className="w-full flex items-center justify-center h-8 rounded-control text-ink-4 hover:text-ink-3 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={springSettle}
            >
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
          aria-label="Open menu"
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

  // Desktop: persistent sidebar
  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 240 }}
      transition={springSettle}
      className="glass-strong flex flex-col h-screen sticky top-0 overflow-hidden shrink-0"
    >
      {sidebarContent}
    </motion.aside>
  );
}

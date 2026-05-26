import { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Map, BarChart3, HardHat, FileText, Bell, LogOut, ChevronRight, Info, Menu, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { springSettle, staggerContainer, staggerItem, panelSlideLeft } from "../../lib/motion";
import { useUIStore } from "../../stores/ui";
import { api } from "../../api";
import { scoreColor } from "../../lib/scoreColor";

const NAV = [
  { path: "/atlas", label: "Atlas", icon: Map },
  { path: "/vitality", label: "Vitality", icon: BarChart3 },
  { path: "/infrastructure", label: "Infrastructure", icon: HardHat },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/alerts", label: "Alerts", icon: Bell },
] as const;

export default function Sidebar() {
  const { url } = usePage();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const activeLayers = useUIStore((s) => s.activeLayers);
  const toggleLayer = useUIStore((s) => s.toggleLayer);
  const openMethod = useUIStore((s) => s.openMethod);
  const isAtlas = url === "/" || url.startsWith("/atlas");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [url]);

  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });

  function handleZoneClick(id: string) {
    setSelectedZone(id);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <Link href="/atlas" className="flex items-center gap-3 min-w-0">
          <motion.div
            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
            style={{ background: "conic-gradient(from 135deg, #40798C, #70A9A1, #C9A227, #40798C)" }}
            whileHover={{ rotate: 90 }}
            transition={springSettle}
          >
            <div className="w-[18px] h-[18px] rounded-md bg-surface flex items-center justify-center">
              <div className="w-[5px] h-[5px] rounded-full bg-ink" />
            </div>
          </motion.div>
          {(!collapsed || isMobile) && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={springSettle} className="text-[15px] font-semibold tracking-[-0.02em] text-ink-1">
              Nuvola Atlas
            </motion.span>
          )}
        </Link>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto w-8 h-8 flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 btn-press" aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-1">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = url.startsWith(path);
            return (
              <motion.div key={path} variants={staggerItem}>
                <Link
                  href={path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 h-10 px-3 rounded-control text-[13px] font-medium transition-colors relative overflow-hidden",
                    active ? "text-accent" : "text-ink-3 hover:text-ink-2",
                  )}
                >
                  {active && (
                    <motion.div layoutId="nav-active" className="absolute inset-0 bg-accent/10 rounded-control" transition={springSettle} />
                  )}
                  <Icon size={17} className="shrink-0 relative z-10" />
                  {(!collapsed || isMobile) && <span className="relative z-10">{label}</span>}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Layer toggles on atlas */}
        <AnimatePresence>
          {isAtlas && (!collapsed || isMobile) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={springSettle} className="mt-4 pt-4 border-t border-border overflow-hidden">
              <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] px-3 mb-2">Data Layers</div>
              {([
                { key: "roads" as const, label: "Roads" },
                { key: "energy" as const, label: "Energy & Grid" },
                { key: "density" as const, label: "Density" },
              ]).map(({ key, label }) => (
                <motion.button key={key} onClick={() => toggleLayer(key)} whileTap={{ scale: 0.98 }} className="w-full flex items-center justify-between h-9 px-3 rounded-chip text-[12px] text-ink-3 hover:text-ink-2 transition-colors">
                  {label}
                  <div className="toggle-track" data-on={activeLayers[key]} style={{ background: activeLayers[key] ? "#40798C" : "rgba(0,0,0,0.1)" }} role="switch" aria-checked={activeLayers[key]} aria-label={`Toggle ${label} layer`}>
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
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={springSettle} className="mt-4 pt-4 border-t border-border overflow-hidden">
              <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] px-3 mb-2">Sub-counties</div>
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-0.5 max-h-[280px] overflow-y-auto">
                {zones.map((z) => (
                  <motion.div key={z.id} variants={staggerItem}>
                    <Link
                      href="/atlas"
                      onClick={() => handleZoneClick(z.id)}
                      className={cn(
                        "w-full flex items-center gap-2 h-8 px-3 rounded-chip text-[12px] transition-colors relative",
                        selectedZoneId === z.id ? "bg-accent/10 text-ink-1" : "text-ink-3 hover:text-ink-2 hover:bg-ink/[0.03]",
                      )}
                    >
                      <motion.div className="w-2 h-2 rounded-full shrink-0" style={{ background: scoreColor(z.score) }} animate={selectedZoneId === z.id ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.4 }} />
                      <span className="truncate">{z.name}</span>
                      <span className="ml-auto tabular-nums text-ink-4">{z.score}</span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-border space-y-0.5 shrink-0">
        {(!collapsed || isMobile) && (
          <motion.button onClick={openMethod} whileTap={{ scale: 0.97 }} className="w-full flex items-center gap-3 h-8 px-3 rounded-control text-[12px] text-ink-4 hover:text-ink-3 transition-colors">
            <Info size={14} />
            How the score is computed
          </motion.button>
        )}
        <Link href="/sign-in" method="post" as="button" className="w-full flex items-center gap-3 h-8 px-3 rounded-control text-[12px] text-ink-4 hover:text-danger transition-colors">
          <LogOut size={14} className="shrink-0" />
          {(!collapsed || isMobile) && "Sign out"}
        </Link>
        {!isMobile && (
          <motion.button onClick={toggleSidebar} whileTap={{ scale: 0.9 }} className="w-full flex items-center justify-center h-8 rounded-control text-ink-4 hover:text-ink-3 transition-colors" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={springSettle}><ChevronRight size={14} /></motion.div>
          </motion.button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <motion.button onClick={() => setMobileOpen(true)} whileTap={{ scale: 0.9 }} className="fixed top-3 left-3 z-50 w-10 h-10 glass rounded-control flex items-center justify-center text-ink-2 shadow-chrome" aria-label="Open menu">
          <Menu size={18} />
        </motion.button>
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} />
              <motion.aside variants={panelSlideLeft} initial="hidden" animate="visible" exit="exit" transition={springSettle} className="fixed inset-y-0 left-0 z-50 w-[280px] glass-strong flex flex-col">
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.aside animate={{ width: collapsed ? 56 : 240 }} transition={springSettle} className="glass-strong flex flex-col h-screen sticky top-0 overflow-hidden shrink-0">
      {sidebarContent}
    </motion.aside>
  );
}

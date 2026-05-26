import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Settings, Sun, Moon } from "lucide-react";
import { cn } from "../../lib/cn";
import { springSettle } from "../../lib/motion";
import { useUIStore } from "../../stores/ui";
import { api } from "../../api";

const VIEW_MODES = ["Map", "Satellite", "Terrain"] as const;
const VIEW_STYLES: Record<string, string> = {
  Map: "mapbox://styles/mapbox/light-v11",
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Terrain: "mapbox://styles/mapbox/outdoors-v12",
};

export default function TopBar() {
  const { url } = usePage();
  const openSearch = useUIStore((s) => s.openSearch);
  const isAtlas = url.startsWith("/atlas") || url === "/";
  const [activeMode, setActiveMode] = useState<string>("Map");
  const setMapStyle = useUIStore((s) => s.setMapStyle);
  const [showSettings, setShowSettings] = useState(false);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);

  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const unread = alerts?.filter((a) => !a.read).length ?? 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="h-14 flex items-center justify-between px-4 sm:px-5 border-b border-border shrink-0"
    >
      <div className="flex items-center gap-3 ml-10 md:ml-0">
        {isAtlas && (
          <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-control bg-ink/[0.04]">
            {VIEW_MODES.map((mode) => (
              <motion.button
                key={mode}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveMode(mode); setMapStyle(VIEW_STYLES[mode]); }}
                className={cn(
                  "relative px-3 h-7 rounded-chip text-[12px] font-medium transition-colors",
                  mode === activeMode ? "text-ink" : "text-ink/40 hover:text-ink/60",
                )}
              >
                {mode === activeMode && (
                  <motion.div layoutId="view-mode" className="absolute inset-0 bg-card rounded-chip shadow-sm" transition={springSettle} />
                )}
                <span className="relative z-10">{mode}</span>
              </motion.button>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, ...springSettle }} className="flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-success/10">
          <div className="w-1.5 h-1.5 rounded-full bg-success pulse-glow" />
          <span className="text-[11px] font-medium text-success">Live</span>
        </motion.div>
      </div>

      <div className="flex items-center gap-1">
        <motion.button onClick={openSearch} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} className="w-9 h-9 flex items-center justify-center rounded-control text-ink/50 hover:text-ink/80 hover:bg-ink/[0.04] transition-colors" aria-label="Search (Cmd+K)">
          <Search size={16} />
        </motion.button>

        <Link href="/alerts" className="relative w-9 h-9 flex items-center justify-center rounded-control text-ink/50 hover:text-ink/80 hover:bg-ink/[0.04] transition-colors" aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}>
          <Bell size={16} />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={springSettle} className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                {unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <div className="relative">
          <motion.button onClick={() => setShowSettings(!showSettings)} whileHover={{ scale: 1.05, rotate: 30 }} whileTap={{ scale: 0.92 }} transition={springSettle} className="w-9 h-9 flex items-center justify-center rounded-control text-ink/50 hover:text-ink/80 hover:bg-ink/[0.04] transition-colors" aria-label="Settings">
            <Settings size={16} />
          </motion.button>
          <AnimatePresence>
            {showSettings && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 top-11 w-56 glass-strong rounded-card border border-border p-3 shadow-modal z-50">
                <div className="text-[11px] font-medium text-ink/40 uppercase tracking-[0.1em] mb-2">Settings</div>
                <div className="text-[12px] text-ink/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Reduced motion</span>
                    <input type="checkbox" className="accent-accent" onChange={() => document.documentElement.classList.toggle("reduce-motion")} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-refresh</span>
                    <input type="checkbox" defaultChecked className="accent-accent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">{darkMode ? <Moon size={13} /> : <Sun size={13} />}Dark mode</span>
                    <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="accent-accent" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

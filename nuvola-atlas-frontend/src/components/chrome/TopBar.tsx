import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Settings, Layers, Check, Sun, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { springSettle } from "@/lib/motion";
import { useUIStore } from "@/stores/ui";
import { useChromeStore } from "@/stores/chrome";
import { useThemeStore } from "@/stores/theme";
import {
  BASEMAP_STYLES,
  MAP_STYLES,
  defaultStyleForTheme,
} from "@/components/map/atlas-map.constants";
import { api } from "@/api";

const VIEW_MODES = ["Map", "Satellite", "Terrain"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

// "Map" resolves at render time so it follows the current theme; Satellite
// and Terrain are fixed Mapbox styles that ignore theme.
function styleForViewMode(mode: ViewMode, theme: "light" | "dark"): string {
  if (mode === "Satellite") return MAP_STYLES.satellite;
  if (mode === "Terrain") return MAP_STYLES.terrain;
  return defaultStyleForTheme(theme);
}

// Reverse lookup: any "Map" basemap (light-v11 OR dark-v11) maps to "Map".
function modeForStyle(style: string): ViewMode {
  if (BASEMAP_STYLES.has(style)) return "Map";
  if (style === MAP_STYLES.satellite) return "Satellite";
  if (style === MAP_STYLES.terrain) return "Terrain";
  return "Map";
}

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const openSearch = useUIStore((s) => s.openSearch);
  const chatOpen = useChromeStore((s) => s.chatOpen);
  const toggleChat = useChromeStore((s) => s.toggleChat);
  const autoRefresh = useUIStore((s) => s.autoRefresh);
  const setAutoRefresh = useUIStore((s) => s.setAutoRefresh);
  const isAtlas = location.pathname === "/atlas";
  const mapStyle = useUIStore((s) => s.mapStyle);
  const setMapStyle = useUIStore((s) => s.setMapStyle);
  // Derive the active mode from the persistent map style so the indicator is
  // always in sync (e.g., after a route change that remounts TopBar).
  const activeMode: ViewMode = modeForStyle(mapStyle);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  // Theme follows basemap: if the user is on the "Map" basemap, swap to the
  // theme-appropriate variant when theme flips. Leave Satellite / Terrain
  // alone — those are explicit overrides, not theme-driven.
  useEffect(() => {
    if (!BASEMAP_STYLES.has(mapStyle)) return;
    const next = defaultStyleForTheme(theme);
    if (next !== mapStyle) setMapStyle(next);
  }, [theme, mapStyle, setMapStyle]);

  // Close mobile view menu on outside click
  useEffect(() => {
    if (!viewMenuOpen) return;
    function onClick(e: MouseEvent) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [viewMenuOpen]);

  // Close settings dropdown on outside click
  useEffect(() => {
    if (!showSettings) return;
    function onClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showSettings]);

  function selectViewMode(mode: ViewMode) {
    setMapStyle(styleForViewMode(mode, theme));
    setViewMenuOpen(false);
  }

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.getAlerts,
  });
  const unread = alerts?.filter((a) => !a.read).length ?? 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="h-14 flex items-center justify-between px-4 sm:px-5 border-b border-border shrink-0"
    >
      <div className="flex items-center gap-2 sm:gap-3 ml-12 md:ml-0 min-w-0">
        {isAtlas && (
          <>
            {/* Desktop / sm+: full segmented control */}
            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-control bg-[rgba(255,255,255,0.04)]">
              {VIEW_MODES.map((mode) => (
                <motion.button
                  key={mode}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectViewMode(mode)}
                  className={cn(
                    "relative px-3 h-7 rounded-chip text-[12.5px] transition-colors",
                    mode === activeMode
                      ? "text-ink-1 font-semibold"
                      : "text-ink-3 hover:text-ink-2 font-medium",
                  )}
                >
                  {mode === activeMode && (
                    <motion.div
                      layoutId="view-mode"
                      className="absolute inset-0 bg-[rgba(255,255,255,0.1)] rounded-chip glow-accent"
                      transition={springSettle}
                    />
                  )}
                  <span className="relative z-10">{mode}</span>
                </motion.button>
              ))}
            </div>

            {/* Mobile: compact popover trigger — always reachable in portrait */}
            <div className="sm:hidden relative" ref={viewMenuRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 h-8 rounded-control bg-[rgba(255,255,255,0.05)] text-ink-2 text-[12px] font-medium border border-border btn-press"
                aria-label="Change map view"
                aria-expanded={viewMenuOpen}
              >
                <Layers size={13} className="text-ink-3" />
                <span>{activeMode}</span>
              </motion.button>
              <AnimatePresence>
                {viewMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-10 w-44 glass-strong rounded-card border border-border p-1 shadow-modal z-50"
                  >
                    {VIEW_MODES.map((mode) => (
                      <button
                        key={mode}
                        onClick={() => selectViewMode(mode)}
                        className={cn(
                          "w-full flex items-center justify-between h-9 px-3 rounded-chip text-[13px] font-medium transition-colors",
                          mode === activeMode
                            ? "text-ink-1 bg-[rgba(192,85,43,0.08)]"
                            : "text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.05)]",
                        )}
                      >
                        <span>{mode}</span>
                        {mode === activeMode && <Check size={13} className="text-accent" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Live feed chip — hide on mobile atlas to free space */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, ...springSettle }}
          className={cn(
            "items-center gap-1.5 px-2.5 h-6 rounded-full bg-[rgba(31,138,120,0.1)] shrink-0",
            isAtlas ? "hidden sm:flex" : "flex",
          )}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-success pulse-glow glow-success" style={{ color: "#1F8A78" }} />
          <span className="text-[11px] font-medium text-success">Live</span>
        </motion.div>
      </div>

      <div className="flex items-center gap-1">
        {/* Ask Navuuna (RAG chat) — only on the Atlas route where the panel
             has a home. On other routes it would just be dead UI. */}
        {isAtlas && (
          <motion.button
            onClick={toggleChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-control transition-colors",
              chatOpen
                ? "text-ink-1 bg-[rgba(31,138,120,0.14)]"
                : "text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.05)]"
            )}
            aria-label={chatOpen ? "Close Navuuna assistant" : "Open Navuuna assistant"}
            aria-pressed={chatOpen}
          >
            <Sparkles size={16} />
          </motion.button>
        )}

        {/* Search button */}
        <motion.button
          onClick={openSearch}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="w-9 h-9 flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          aria-label="Search (Cmd+K)"
        >
          <Search size={16} />
        </motion.button>

        {/* Notifications */}
        <motion.button
          onClick={() => navigate("/alerts")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-9 h-9 flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          <Bell size={16} />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={springSettle}
                className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center glow-danger"
              >
                {unread}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            whileHover={{ scale: 1.05, rotate: 30 }}
            whileTap={{ scale: 0.92 }}
            transition={springSettle}
            className="w-9 h-9 flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            aria-label="Settings"
            aria-expanded={showSettings}
          >
            <Settings size={16} />
          </motion.button>
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-64 glass-strong rounded-card border border-border p-3 shadow-modal z-50"
              >
                <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-2">Appearance</div>

                {/* Theme segmented control */}
                <div className="flex items-center gap-1 p-0.5 rounded-control bg-[rgba(255,255,255,0.04)] mb-3">
                  {(["light", "dark"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={cn(
                        "relative flex-1 flex items-center justify-center gap-1.5 h-8 rounded-chip text-[12px] font-medium transition-colors",
                        theme === mode
                          ? "text-ink-1"
                          : "text-ink-4 hover:text-ink-3",
                      )}
                      aria-pressed={theme === mode}
                    >
                      {theme === mode && (
                        <motion.div
                          layoutId="theme-mode"
                          className="absolute inset-0 bg-[rgba(255,255,255,0.10)] rounded-chip glow-accent"
                          transition={springSettle}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        {mode === "light" ? <Sun size={13} /> : <Moon size={13} />}
                        {mode === "light" ? "Light" : "Dark"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-2">Preferences</div>
                <div className="text-[12px] text-ink-3 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Reduced motion</span>
                    <input
                      type="checkbox"
                      className="accent-accent"
                      onChange={() => document.documentElement.classList.toggle("reduce-motion")}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Auto-refresh</span>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="accent-accent"
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}


import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { springSettle } from "@/lib/motion";
import { useUIStore } from "@/stores/ui";
import { useChromeStore } from "@/stores/chrome";
import { useThemeStore } from "@/stores/theme";
import { BASEMAP_STYLES, defaultStyleForTheme } from "@/components/map/atlas-map.constants";
import { useEffect } from "react";
import { api } from "@/api";
import { useT } from "@/lib/i18n/use-t";

export default function TopBar() {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const openSearch = useUIStore((s) => s.openSearch);
  const chatOpen = useChromeStore((s) => s.chatOpen);
  const toggleChat = useChromeStore((s) => s.toggleChat);
  const isAtlas = location.pathname === "/atlas";
  const mapStyle = useUIStore((s) => s.mapStyle);
  const setMapStyle = useUIStore((s) => s.setMapStyle);
  const theme = useThemeStore((s) => s.theme);

  // Theme follows basemap: if the user is on the "Map" basemap, swap to the
  // theme-appropriate variant when theme flips. Satellite / Terrain are
  // explicit overrides and stay put.
  useEffect(() => {
    if (!BASEMAP_STYLES.has(mapStyle)) return;
    const next = defaultStyleForTheme(theme);
    if (next !== mapStyle) setMapStyle(next);
  }, [theme, mapStyle, setMapStyle]);

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
        {/* Basemap picker (Map / Satellite / Terrain) lives as a floating
            pill on the Atlas map so all map-view controls cluster together
            with the compass and layer chips. */}

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
          <div
            className="w-1.5 h-1.5 rounded-full bg-success pulse-glow glow-success"
            style={{ color: "#1F8A78" }}
          />
          <span className="text-[11px] font-medium text-success">{t("topbar.live")}</span>
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
                : "text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.05)]",
            )}
            aria-label={chatOpen ? t("topbar.closeAssistant") : t("topbar.openAssistant")}
            aria-pressed={chatOpen}
          >
            <Sparkles size={16} />
          </motion.button>
        )}

        {/* Search */}
        <motion.button
          onClick={openSearch}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="w-9 h-9 flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          aria-label={t("topbar.searchAria")}
        >
          <Search size={16} />
        </motion.button>

        {/* Notifications */}
        <motion.button
          onClick={() => navigate("/alerts")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-9 h-9 flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          aria-label={
            unread > 0
              ? t("topbar.notificationsWithCount", { count: unread })
              : t("topbar.notificationsAria")
          }
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

        {/* Settings has moved to /settings (linked from the sidebar). */}
      </div>
    </motion.header>
  );
}

import { motion } from "framer-motion";
import { Layers, Mountain, Satellite, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { springSettle } from "@/lib/motion";
import { useUIStore } from "@/stores/ui";
import { useThemeStore } from "@/stores/theme";
import {
  BASEMAP_STYLES,
  MAP_STYLES,
  defaultStyleForTheme,
} from "./atlas-map.constants";

const VIEW_MODES = ["Map", "Satellite", "Terrain"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

function styleForViewMode(mode: ViewMode, theme: "light" | "dark"): string {
  if (mode === "Satellite") return MAP_STYLES.satellite;
  if (mode === "Terrain") return MAP_STYLES.terrain;
  return defaultStyleForTheme(theme);
}

function modeForStyle(style: string): ViewMode {
  if (BASEMAP_STYLES.has(style)) return "Map";
  if (style === MAP_STYLES.satellite) return "Satellite";
  if (style === MAP_STYLES.terrain) return "Terrain";
  return "Map";
}

const ICONS: Record<ViewMode, LucideIcon> = {
  Map: Layers,
  Satellite: Satellite,
  Terrain: Mountain,
};

interface Props {
  panelOpen: boolean;
}

/**
 * Floating basemap picker on the Atlas map. Lives inline with the compass /
 * reset button so all map-view controls cluster together, and slides left of
 * the scorecard panel while it's open (matching the compass's shift logic).
 */
export default function ViewModePill({ panelOpen }: Props) {
  const mapStyle = useUIStore((s) => s.mapStyle);
  const setMapStyle = useUIStore((s) => s.setMapStyle);
  const theme = useThemeStore((s) => s.theme);
  const active = modeForStyle(mapStyle);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, ...springSettle }}
      role="group"
      aria-label="Map view"
      className={cn(
        "absolute top-14 z-10 flex items-center gap-0.5 p-0.5 rounded-full bg-bone/90 backdrop-blur-sm shadow-[0_1px_4px_rgba(11,34,53,0.12),0_6px_18px_rgba(11,34,53,0.12)] transition-[right] duration-300",
        panelOpen
          ? "right-3 lg:right-[calc(380px+1.25rem)] xl:right-[calc(420px+1.25rem)]"
          : "right-3",
      )}
    >
      {VIEW_MODES.map((mode) => {
        const Icon = ICONS[mode];
        const isActive = mode === active;
        return (
          <motion.button
            key={mode}
            onClick={() => setMapStyle(styleForViewMode(mode, theme))}
            whileTap={{ scale: 0.94 }}
            aria-pressed={isActive}
            aria-label={mode}
            className={cn(
              "relative flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] font-medium transition-colors",
              isActive
                ? "text-navy"
                : "text-navy/60 hover:text-navy/85",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="floating-view-mode"
                className="absolute inset-0 rounded-full bg-navy/8"
                transition={springSettle}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={12} />
              <span className="hidden sm:inline">{mode}</span>
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

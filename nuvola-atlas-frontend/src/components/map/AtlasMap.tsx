import { motion } from "framer-motion";
import { useUIStore } from "@/stores/ui";
import { springSettle } from "@/lib/motion";
import { useMapInstance, TOKEN } from "@/hooks/useMapInstance";
import { useMapLayers } from "@/hooks/useMapLayers";
import { useMapMarkers } from "@/hooks/useMapMarkers";
import { useMapStyle } from "@/hooks/useMapStyle";
import { useMapPopups } from "@/hooks/useMapPopups";
import { LAYER_META } from "./atlas-map.constants";
import MapFallback from "./MapFallback";
import type { Zone } from "@/types";

interface Props {
  zones: Zone[];
}

export default function AtlasMap({ zones }: Props) {
  const { containerRef, mapRef, loaded } = useMapInstance();
  const activeLayers = useUIStore((s) => s.activeLayers);
  const toggleLayer = useUIStore((s) => s.toggleLayer);
  const mapStyle = useUIStore((s) => s.mapStyle);

  useMapLayers(mapRef, loaded, activeLayers, zones);
  useMapMarkers(mapRef, zones, loaded);
  useMapStyle(mapRef, loaded, mapStyle, zones);
  useMapPopups(mapRef, loaded);

  if (!TOKEN) return <MapFallback zones={zones} />;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Layer toggles — offset left on mobile to clear the hamburger button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...springSettle }}
        className="absolute top-3 left-14 md:left-3 z-10 flex gap-1.5 sm:gap-2 flex-wrap max-w-[calc(100%-5rem)] md:max-w-[calc(100%-6rem)]"
      >
        {LAYER_META.map((l) => {
          const on = activeLayers[l.key];
          return (
            <button
              key={l.key}
              onClick={() => toggleLayer(l.key)}
              className={`
                border-none cursor-pointer px-2 py-1.5 sm:px-4 sm:py-2 rounded-full
                text-[10px] sm:text-[12px] font-medium tracking-[-0.01em]
                transition-all duration-[450ms] flex items-center gap-1 sm:gap-2
                min-h-[36px] sm:min-h-0
                ${on
                  ? "bg-[#1A1A18] text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
                  : "bg-white/90 text-black/60 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-white"
                }
              `}
            >
              <span
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-opacity shrink-0"
                style={{ backgroundColor: l.color, opacity: on ? 1 : 0.5 }}
              />
              <span className="hidden sm:inline">{l.label}</span>
              <span className="sm:hidden text-[10px]">{l.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Legend — pushed up on mobile to clear the scorecard pull-up tab */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ...springSettle }}
        className="absolute bottom-16 sm:bottom-4 left-2 sm:left-4 z-10 bg-white/90 backdrop-blur-sm rounded-[14px] px-2.5 py-1.5 sm:px-4 sm:py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_50px_rgba(0,0,0,0.06)] text-[10px] sm:text-[11px] space-y-1"
      >
        <div className="font-semibold text-[12px] text-[#1A1A18]/70 mb-2">Vitality Score</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#1B9C6B" }} />
          <span className="text-[#1A1A18]/60">70–100 Strong</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#C9A227" }} />
          <span className="text-[#1A1A18]/60">55–69 Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#C7603F" }} />
          <span className="text-[#1A1A18]/60">0–54 At Risk</span>
        </div>
      </motion.div>
    </div>
  );
}

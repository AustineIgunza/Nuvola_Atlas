import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Compass } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { springSettle } from "@/lib/motion";
import { BRAND, SCORE_GRADIENT_CSS } from "@/lib/scoreColor";
import { useMapInstance, TOKEN } from "@/hooks/useMapInstance";
import { useMapLayers } from "@/hooks/useMapLayers";
import { useMapMarkers } from "@/hooks/useMapMarkers";
import { useMapStyle } from "@/hooks/useMapStyle";
import { useMapPopups } from "@/hooks/useMapPopups";
import { LAYER_META, NAIROBI, INITIAL_ZOOM } from "./atlas-map.constants";
import MapFallback from "./MapFallback";
import type { Zone } from "@/types";

interface Props {
  zones: Zone[];
}

export default function AtlasMap({ zones }: Props) {
  const { containerRef, mapRef, loaded } = useMapInstance();
  const activeLayers = useUIStore((s) => s.activeLayers);
  const toggleLayer = useUIStore((s) => s.toggleLayer);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const mapStyle = useUIStore((s) => s.mapStyle);
  const panelOpen = useUIStore((s) => s.panelOpen);
  const [, setSearchParams] = useSearchParams();

  useMapLayers(mapRef, loaded, activeLayers, zones);
  useMapMarkers(mapRef, zones, loaded);
  useMapStyle(mapRef, loaded, mapStyle, zones);
  useMapPopups(mapRef, loaded);

  function resetView() {
    setSelectedZone(null);
    setSearchParams({}, { replace: true });
    const m = mapRef.current;
    if (m) {
      m.flyTo({ center: NAIROBI, zoom: INITIAL_ZOOM, pitch: 15, bearing: 0, duration: 1200, essential: true });
    }
  }

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
                  ? "layer-pill--on bg-navy text-bone shadow-[0_4px_14px_rgba(11,34,53,0.28)]"
                  : "layer-pill--off bg-bone/90 text-navy/60 shadow-[0_1px_4px_rgba(11,34,53,0.10)] hover:bg-bone"
                }
              `}
            >
              <span
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-opacity shrink-0 ${on ? "pulse-glow" : ""}`}
                style={{
                  // The Vitality pill dot shows the score ramp itself.
                  background: l.key === "vitality" ? SCORE_GRADIENT_CSS : l.color,
                  color: l.color,
                  opacity: on ? 1 : 0.5,
                }}
              />
              <span className="hidden sm:inline">{l.label}</span>
              <span className="sm:hidden text-[10px]">{l.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Reset View — top-right; flies to Nairobi centroid and clears the
          ?zone= deeplink so the URL bar matches the visible state. */}
      <motion.button
        onClick={resetView}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, ...springSettle }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Reset view to Nairobi"
        className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-control bg-bone/90 text-navy/70 hover:text-navy shadow-[0_1px_4px_rgba(11,34,53,0.12),0_6px_18px_rgba(11,34,53,0.12)] backdrop-blur-sm"
      >
        <Compass size={16} />
      </motion.button>

      {/* Legend — pushed up on mobile to clear the scorecard pull-up tab;
          fades out while the corner-card constellation is open so the
          bottom-left card has the space. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: panelOpen ? 0 : 1, y: panelOpen ? 6 : 0 }}
        transition={springSettle}
        style={{ pointerEvents: panelOpen ? "none" : "auto" }}
        className="atlas-legend absolute bottom-16 sm:bottom-4 left-2 sm:left-4 z-10 bg-bone/90 backdrop-blur-sm rounded-card px-2.5 py-1.5 sm:px-4 sm:py-3 shadow-[0_1px_2px_rgba(11,34,53,0.06),0_18px_50px_rgba(11,34,53,0.10)] text-[10px] sm:text-[11px] space-y-1"
      >
        <div className="font-semibold text-[12px] text-navy/70 mb-2">Vitality Score</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: BRAND.teal }} />
          <span className="text-navy/60">70–100 Strong</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: BRAND.gold }} />
          <span className="text-navy/60">55–69 Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: BRAND.terracotta }} />
          <span className="text-navy/60">0–54 At Risk</span>
        </div>
      </motion.div>
    </div>
  );
}

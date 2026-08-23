import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { useUIStore } from "@/stores/ui";
import type { LayerState } from "@/stores/atlas";
import type { Zone } from "@/types";
import { addSourcesAndLayers } from "@/components/map/atlas-map.sources";

export function useMapLayers(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  loaded: boolean,
  activeLayers: LayerState,
  zones: Zone[],
) {
  const animRef = useRef<number | null>(null);
  const initRef = useRef(false);

  // Add sources/layers + start animation on first load
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded || initRef.current) return;
    initRef.current = true;

    addSourcesAndLayers(m, zones, useUIStore.getState().activeLayers);

    let frame = 0;
    const tick = () => {
      frame++;
      const t = frame * 0.02;
      const active = useUIStore.getState().activeLayers;

      try {
        if (active.roads && m.getLayer("roads-glow")) {
          m.setPaintProperty("roads-glow", "line-opacity", 0.15 + Math.sin(t * 1.5) * 0.12);
          m.setPaintProperty("roads-glow", "line-width", 8 + Math.sin(t * 1.2) * 3);
        }
        if (active.energy && m.getLayer("grid-outer")) {
          m.setPaintProperty("grid-outer", "circle-stroke-opacity", 0.5 + Math.sin(t * 2.0) * 0.4);
          m.setPaintProperty("grid-outer", "circle-radius", 10 + Math.sin(t * 1.8) * 4);
        }
        if (active.water && m.getLayer("water-opportunity")) {
          // Breathe the opportunity ring so decentralized-sanitation zones pulse.
          m.setPaintProperty(
            "water-opportunity",
            "circle-stroke-opacity",
            0.55 + Math.sin(t * 1.6) * 0.3,
          );
          if (m.getLayer("water-main-glow")) {
            m.setPaintProperty("water-main-glow", "line-opacity", 0.16 + Math.sin(t * 1.3) * 0.1);
          }
        }
      } catch {
        // layer may not exist during style swap
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mapRef, loaded, zones]);

  // Toggle layer visibility
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;

    try {
      if (m.getLayer("vitality-fill")) {
        m.setPaintProperty(
          "vitality-fill",
          "fill-opacity",
          activeLayers.vitality
            ? ["case", ["boolean", ["feature-state", "hover"], false], 0.3, 0.16]
            : 0,
        );
      }
      if (m.getLayer("roads-line")) {
        m.setPaintProperty("roads-line", "line-opacity", activeLayers.roads ? 0.85 : 0);
      }
      if (m.getLayer("roads-glow")) {
        m.setPaintProperty("roads-glow", "line-opacity", activeLayers.roads ? 0.25 : 0);
        m.setPaintProperty("roads-glow", "line-width", activeLayers.roads ? 8 : 0);
      }
      if (m.getLayer("grid-inner")) {
        m.setPaintProperty("grid-inner", "circle-opacity", activeLayers.energy ? 0.9 : 0);
      }
      if (m.getLayer("grid-outer")) {
        m.setPaintProperty("grid-outer", "circle-stroke-opacity", activeLayers.energy ? 0.9 : 0);
        m.setPaintProperty("grid-outer", "circle-radius", activeLayers.energy ? 12 : 0);
      }
      if (m.getLayer("water-main-glow")) {
        m.setPaintProperty("water-main-glow", "line-opacity", activeLayers.water ? 0.22 : 0);
      }
      if (m.getLayer("water-main")) {
        m.setPaintProperty("water-main", "line-opacity", activeLayers.water ? 0.85 : 0);
      }
      if (m.getLayer("water-halo")) {
        m.setPaintProperty(
          "water-halo",
          "circle-opacity",
          activeLayers.water ? ["interpolate", ["linear"], ["get", "need"], 0, 0.06, 1, 0.28] : 0,
        );
      }
      if (m.getLayer("water-tap")) {
        m.setPaintProperty("water-tap", "circle-opacity", activeLayers.water ? 0.7 : 0);
        m.setPaintProperty("water-tap", "circle-stroke-opacity", activeLayers.water ? 0.4 : 0);
      }
      if (m.getLayer("water-core")) {
        m.setPaintProperty("water-core", "circle-opacity", activeLayers.water ? 0.9 : 0);
        m.setPaintProperty("water-core", "circle-stroke-opacity", activeLayers.water ? 0.7 : 0);
      }
      if (m.getLayer("water-facility")) {
        m.setPaintProperty("water-facility", "circle-opacity", activeLayers.water ? 0.95 : 0);
        m.setPaintProperty("water-facility", "circle-stroke-opacity", activeLayers.water ? 0.9 : 0);
      }
      if (m.getLayer("water-opportunity")) {
        m.setPaintProperty(
          "water-opportunity",
          "circle-stroke-opacity",
          activeLayers.water ? 0.85 : 0,
        );
      }
    } catch {
      // layers may not exist during style swap
    }
  }, [mapRef, loaded, activeLayers]);
}

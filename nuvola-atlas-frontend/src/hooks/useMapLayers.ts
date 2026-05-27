import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { useUIStore } from "@/stores/ui";
import type { Zone } from "@/types";
import { addSourcesAndLayers } from "@/components/map/atlas-map.sources";

interface LayerState {
  roads: boolean;
  energy: boolean;
  density: boolean;
}

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
        if (active.density && m.getLayer("density-heat")) {
          m.setPaintProperty("density-heat", "heatmap-opacity", 0.55 + Math.sin(t * 0.8) * 0.12);
          m.setPaintProperty("density-heat", "heatmap-radius", 33 + Math.sin(t * 0.6) * 5);
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
      if (m.getLayer("density-heat")) {
        m.setPaintProperty("density-heat", "heatmap-opacity", activeLayers.density ? 0.65 : 0);
        m.setPaintProperty("density-heat", "heatmap-radius", activeLayers.density ? 35 : 0);
      }
      if (m.getLayer("density-circles")) {
        m.setPaintProperty("density-circles", "circle-opacity", activeLayers.density ? 0.5 : 0);
        m.setPaintProperty("density-circles", "circle-stroke-opacity", activeLayers.density ? 0.3 : 0);
      }
    } catch {
      // layers may not exist during style swap
    }
  }, [mapRef, loaded, activeLayers]);
}

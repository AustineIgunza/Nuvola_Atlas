import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { useUIStore } from "@/stores/ui";
import { addSourcesAndLayers } from "@/components/map/atlas-map.sources";
import { DEFAULT_STYLE } from "@/components/map/atlas-map.constants";
import type { Zone } from "@/types";

export function useMapStyle(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  loaded: boolean,
  mapStyle: string,
  zones: Zone[],
) {
  const currentStyleRef = useRef(DEFAULT_STYLE);

  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;
    if (currentStyleRef.current === mapStyle) return;
    currentStyleRef.current = mapStyle;

    m.setStyle(mapStyle);
    m.once("style.load", () => {
      if (!m.getSource("roads")) {
        addSourcesAndLayers(m, zones, useUIStore.getState().activeLayers);
      }
    });
  }, [mapRef, loaded, mapStyle, zones]);
}

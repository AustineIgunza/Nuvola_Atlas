import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { useUIStore } from "@/stores/ui";
import { addSourcesAndLayers } from "@/components/map/atlas-map.sources";
import type { Zone } from "@/types";

export function useMapStyle(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  loaded: boolean,
  mapStyle: string,
  zones: Zone[],
) {
  // Seed with the first mapStyle the hook sees so the initial run doesn't
  // trigger a redundant setStyle when useMapInstance already created the
  // map at that style.
  const currentStyleRef = useRef(mapStyle);

  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;
    if (currentStyleRef.current === mapStyle) return;
    currentStyleRef.current = mapStyle;

    // diff:false forces a full style reload. With the default diff:true,
    // mapbox-gl v3 can apply basemap swaps as in-place diff operations — that
    // path REMOVES our runtime sources/layers but never fires "style.load",
    // so the re-add below would never run and every layer toggle afterwards
    // becomes a silent no-op.
    // (the two font fields are required by SetStyleOptions despite being
    // optional at runtime — an upstream typing wart; undefined = unset)
    m.setStyle(mapStyle, { diff: false, localFontFamily: undefined, localIdeographFontFamily: undefined });
    m.once("style.load", () => {
      if (!m.getSource("roads")) {
        addSourcesAndLayers(m, zones, useUIStore.getState().activeLayers);
      }
    });
  }, [mapRef, loaded, mapStyle, zones]);
}

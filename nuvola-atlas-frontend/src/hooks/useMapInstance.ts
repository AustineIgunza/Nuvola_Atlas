import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { NAIROBI, INITIAL_ZOOM } from "@/components/map/atlas-map.constants";
import { useUIStore } from "@/shared/stores/ui";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
if (TOKEN) mapboxgl.accessToken = TOKEN;

export { TOKEN };

export function useMapInstance() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current || !TOKEN) return;

    const m = new mapboxgl.Map({
      container,
      // Seed the map with whatever basemap the atlas store currently holds
      // (themed by useThemeStore via stores/atlas.ts). useMapStyle still
      // re-applies on later changes; this just avoids a wasted style flip on
      // mount when the user is in dark mode.
      style: useUIStore.getState().mapStyle,
      center: NAIROBI,
      zoom: INITIAL_ZOOM,
      pitch: 15,
      attributionControl: false,
    });

    m.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    m.addControl(new mapboxgl.ScaleControl(), "bottom-left");

    m.on("load", () => setLoaded(true));

    mapRef.current = m;

    // Mobile layout-settling: container often has 0 or stale dimensions on first
    // paint (flex calc, address-bar resize, sidebar drawer animation). Without an
    // explicit resize the canvas paints into the wrong viewport and layers look
    // missing until the next remount. Observe the container + force a resize on
    // tab visibility, orientation change, and window resize.
    const resize = () => m.resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onVisible = () => {
      if (document.visibilityState === "visible") resize();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("orientationchange", resize);
    window.addEventListener("resize", resize);

    // Belt-and-braces: tick a few extra resizes after first style load to catch
    // post-mount layout settling on slow mobile devices.
    m.once("load", () => {
      requestAnimationFrame(resize);
      setTimeout(resize, 150);
      setTimeout(resize, 600);
    });

    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("resize", resize);
      m.remove();
      mapRef.current = null;
      setLoaded(false);
    };
  }, []);

  return { containerRef, mapRef, loaded };
}

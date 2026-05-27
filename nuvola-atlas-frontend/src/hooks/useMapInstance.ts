import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { NAIROBI, INITIAL_ZOOM } from "@/components/map/atlas-map.constants";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
if (TOKEN) mapboxgl.accessToken = TOKEN;

export { TOKEN };

export function useMapInstance() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !TOKEN) return;

    const m = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: NAIROBI,
      zoom: INITIAL_ZOOM,
      pitch: 15,
      attributionControl: false,
    });

    m.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    m.addControl(new mapboxgl.ScaleControl(), "bottom-left");

    m.on("load", () => setLoaded(true));

    mapRef.current = m;

    return () => {
      m.remove();
      mapRef.current = null;
      setLoaded(false);
    };
  }, []);

  return { containerRef, mapRef, loaded };
}

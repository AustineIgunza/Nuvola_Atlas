import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/ui";
import { scoreColorHex } from "@/lib/scoreColor";
import { springSettle } from "@/lib/motion";
import type { Zone } from "@/types";
import MapControls from "./MapControls";
import Legend from "./Legend";
import TimeScrubber from "./TimeScrubber";
import HoverCard from "./HoverCard";
import MapFallback from "./MapFallback";

const NAIROBI: [number, number] = [36.8219, -1.2921];
const INITIAL_ZOOM = 10.5;

interface Props {
  zones: Zone[];
}

export default function AtlasMap({ zones }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hover, setHover] = useState<{
    name: string;
    score: number;
    x: number;
    y: number;
  } | null>(null);
  const [noToken, setNoToken] = useState(false);

  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const activeLayers = useUIStore((s) => s.activeLayers);

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const style = import.meta.env.VITE_MAPBOX_STYLE || "mapbox://styles/mapbox/dark-v11";

  useEffect(() => {
    if (!token) { setNoToken(true); return; }

    let map: mapboxgl.Map;

    import("mapbox-gl").then((mapboxgl) => {
      if (!mapContainer.current) return;
      (mapboxgl as any).accessToken = token;

      map = new mapboxgl.Map({
        container: mapContainer.current,
        style,
        center: NAIROBI,
        zoom: INITIAL_ZOOM,
        pitch: 0,
        bearing: 0,
        dragRotate: false,
        touchZoomRotate: true,
      });

      map.on("load", () => {
        mapRef.current = map;

        map.addSource("subcounties", { type: "geojson", data: "/data/nairobi-subcounties.geojson" });

        map.addLayer({
          id: "subcounty-fill", type: "fill", source: "subcounties",
          paint: {
            "fill-color": ["match", ["get", "id"], ...buildColorStops(zones), "#333"],
            "fill-opacity": ["case", ["==", ["get", "id"], selectedZoneId ?? ""], 0.32, 0.15],
          },
        });

        map.addLayer({
          id: "subcounty-stroke", type: "line", source: "subcounties",
          paint: {
            "line-color": ["match", ["get", "id"], ...buildColorStops(zones), "#555"],
            "line-width": ["case", ["==", ["get", "id"], selectedZoneId ?? ""], 2, 1.2],
            "line-opacity": ["case", ["==", ["get", "id"], selectedZoneId ?? ""], 0.9, 0.45],
          },
        });

        map.addSource("roads", { type: "geojson", data: "/data/roads.geojson" });
        map.addLayer({ id: "roads-base", type: "line", source: "roads", paint: { "line-color": "rgba(74,158,255,0.15)", "line-width": 6 }, layout: { visibility: "none" } });
        map.addLayer({ id: "roads-top", type: "line", source: "roads", paint: { "line-color": "#4a9eff", "line-width": 2, "line-dasharray": [4, 8] }, layout: { visibility: "none" } });

        const infraPoints: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: zones.filter((z) => z.pillars.infra >= 60).map((z) => ({
            type: "Feature" as const, geometry: { type: "Point" as const, coordinates: z.centroid },
            properties: { id: z.id, score: z.pillars.infra, status: "active" },
          })),
        };
        map.addSource("energy", { type: "geojson", data: infraPoints });
        map.addLayer({ id: "energy-pulse", type: "circle", source: "energy", paint: { "circle-radius": 18, "circle-color": "rgba(255,179,64,0.1)" }, layout: { visibility: "none" } });
        map.addLayer({ id: "energy-dots", type: "circle", source: "energy", paint: { "circle-radius": 5, "circle-color": "#ffb340", "circle-stroke-width": 1.5, "circle-stroke-color": "#ffb340" }, layout: { visibility: "none" } });

        const densityPoints: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: zones.filter((z) => z.pillars.density >= 56).map((z) => ({
            type: "Feature" as const, geometry: { type: "Point" as const, coordinates: z.centroid },
            properties: { density: z.pillars.density },
          })),
        };
        map.addSource("density", { type: "geojson", data: densityPoints });
        map.addLayer({ id: "density-heat", type: "circle", source: "density", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "density"], 56, 25, 80, 50], "circle-color": "rgba(184,136,255,0.15)", "circle-blur": 1 }, layout: { visibility: "none" } });

        const badgeSource: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: zones.map((z) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: z.centroid }, properties: { label: String(z.score), id: z.id } })),
        };
        map.addSource("badges", { type: "geojson", data: badgeSource });
        map.addLayer({ id: "score-badges", type: "symbol", source: "badges", layout: { "text-field": ["get", "label"], "text-size": 13, "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"], "text-allow-overlap": true }, paint: { "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.7)", "text-halo-width": 1.5 } });

        map.on("click", "subcounty-fill", (e) => { const id = e.features?.[0]?.properties?.id; if (id) setSelectedZone(id); });
        map.on("mouseenter", "subcounty-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "subcounty-fill", () => { map.getCanvas().style.cursor = ""; setHover(null); });
        map.on("mousemove", "subcounty-fill", (e) => {
          const id = e.features?.[0]?.properties?.id;
          const zone = zones.find((z) => z.id === id);
          if (zone) setHover({ name: zone.name, score: zone.score, x: e.point.x, y: e.point.y });
        });

        setLoaded(true);
      });
    });

    return () => { map?.remove(); };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    try {
      map.setLayoutProperty("roads-base", "visibility", activeLayers.roads ? "visible" : "none");
      map.setLayoutProperty("roads-top", "visibility", activeLayers.roads ? "visible" : "none");
      map.setLayoutProperty("energy-pulse", "visibility", activeLayers.energy ? "visible" : "none");
      map.setLayoutProperty("energy-dots", "visibility", activeLayers.energy ? "visible" : "none");
      map.setLayoutProperty("density-heat", "visibility", activeLayers.density ? "visible" : "none");
    } catch { /* layers may not exist yet */ }
  }, [activeLayers, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    try {
      map.setPaintProperty("subcounty-fill", "fill-opacity", [
        "case", ["==", ["get", "id"], selectedZoneId ?? ""], 0.32, selectedZoneId ? 0.08 : 0.15,
      ]);
      map.setPaintProperty("subcounty-stroke", "line-width", [
        "case", ["==", ["get", "id"], selectedZoneId ?? ""], 2.5, 1.2,
      ]);
      map.setPaintProperty("subcounty-stroke", "line-opacity", [
        "case", ["==", ["get", "id"], selectedZoneId ?? ""], 0.9, selectedZoneId ? 0.2 : 0.45,
      ]);
    } catch { /* ignore */ }

    if (selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId);
      if (zone) map.flyTo({ center: zone.centroid, zoom: 12, duration: 800 });
    }
  }, [selectedZoneId, loaded, zones]);

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), []);
  const handleLocate = useCallback(() =>
    mapRef.current?.flyTo({ center: NAIROBI, zoom: INITIAL_ZOOM, duration: 600 }),
  []);

  if (noToken) return <MapFallback zones={zones} />;

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <HoverCard name={hover.name} score={hover.score} x={hover.x} y={hover.y} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls - bottom right, above scrubber */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, ...springSettle }}
        className="absolute bottom-28 sm:bottom-24 right-3 sm:right-4 z-10"
      >
        <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onLocate={handleLocate} onLayers={() => {}} />
      </motion.div>

      {/* Legend - bottom left, not overlapping scrubber */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ...springSettle }}
        className="absolute bottom-20 sm:bottom-16 left-3 sm:left-4 z-10"
      >
        <Legend />
      </motion.div>

      {/* Time scrubber - bottom center, clear of legend and controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springSettle }}
        className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10"
      >
        <TimeScrubber />
      </motion.div>
    </div>
  );
}

function buildColorStops(zones: Zone[]): string[] {
  const stops: string[] = [];
  for (const z of zones) { stops.push(z.id, scoreColorHex(z.score)); }
  return stops;
}

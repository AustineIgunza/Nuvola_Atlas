import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useUIStore } from "@/stores/ui";
import { springSettle } from "@/lib/motion";
import type { Zone } from "@/types";
import MapFallback from "./MapFallback";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
if (TOKEN) mapboxgl.accessToken = TOKEN;

const NAIROBI: [number, number] = [36.84, -1.283];
const INITIAL_ZOOM = 11.5;

function scoreColor(score: number): string {
  if (score >= 70) return "#1B9C6B";
  if (score >= 55) return "#C9A227";
  return "#C7603F";
}

/* ── Mock GeoJSON generators ────────────────────────────────── */

function generateRoadFeatures(zones: Zone[]) {
  const pairs = [
    [0, 1], [1, 2], [2, 3], [0, 5], [5, 4], [4, 7],
    [7, 10], [10, 8], [8, 6], [1, 12], [12, 11],
    [3, 14], [14, 13], [13, 3], [15, 4], [15, 5],
    [1, 16], [16, 15],
  ];
  return pairs
    .filter(([a, b]) => a < zones.length && b < zones.length)
    .map(([a, b]) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [zones[a].centroid, zones[b].centroid],
      },
      properties: {
        progress: Math.round(30 + Math.random() * 70),
        name: `${zones[a].name} → ${zones[b].name}`,
      },
    }));
}

function generateGridFeatures(zones: Zone[]) {
  return zones.flatMap((z) => {
    const count = 2 + Math.floor(Math.random() * 3);
    return Array.from({ length: count }, () => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [
          z.centroid[0] + (Math.random() - 0.5) * 0.025,
          z.centroid[1] + (Math.random() - 0.5) * 0.02,
        ],
      },
      properties: {
        status: Math.random() > 0.3 ? "active" : "planned",
        zone: z.name,
        capacity: Math.round(20 + Math.random() * 80),
      },
    }));
  });
}

function generateDensityFeatures(zones: Zone[]) {
  return zones.flatMap((z) => {
    const count = Math.round((z.pillars.density / 100) * 20) + 5;
    return Array.from({ length: count }, () => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [
          z.centroid[0] + (Math.random() - 0.5) * 0.04,
          z.centroid[1] + (Math.random() - 0.5) * 0.03,
        ],
      },
      properties: {
        weight: z.pillars.density / 100,
        zone: z.name,
      },
    }));
  });
}

/* ── Layer toggle metadata ──────────────────────────────────── */

const LAYER_META = [
  { key: "roads" as const, label: "Road Progress", color: "#2C6FB0" },
  { key: "energy" as const, label: "Smart Grid Status", color: "#C9A227" },
  { key: "density" as const, label: "Density", color: "#C7603F" },
];

/* ── Component ──────────────────────────────────────────────── */

interface Props {
  zones: Zone[];
}

export default function AtlasMap({ zones }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const activeLayers = useUIStore((s) => s.activeLayers);
  const toggleLayer = useUIStore((s) => s.toggleLayer);

  if (!TOKEN) return <MapFallback zones={zones} />;

  /* ── Init map ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: NAIROBI,
      zoom: INITIAL_ZOOM,
      pitch: 15,
      attributionControl: false,
    });

    m.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    m.addControl(new mapboxgl.ScaleControl(), "bottom-left");

    m.on("load", () => {
      /* ── Data sources ──────────────────────────────────── */
      m.addSource("roads", {
        type: "geojson",
        data: { type: "FeatureCollection", features: generateRoadFeatures(zones) },
      });
      m.addSource("grid", {
        type: "geojson",
        data: { type: "FeatureCollection", features: generateGridFeatures(zones) },
      });
      m.addSource("density", {
        type: "geojson",
        data: { type: "FeatureCollection", features: generateDensityFeatures(zones) },
      });

      /* ── Road layers ───────────────────────────────────── */
      m.addLayer({
        id: "roads-line", type: "line", source: "roads",
        paint: { "line-color": "#2C6FB0", "line-width": 3, "line-dasharray": [2, 2], "line-opacity": 0 },
      });
      m.addLayer({
        id: "roads-glow", type: "line", source: "roads",
        paint: { "line-color": "#2C6FB0", "line-width": 8, "line-blur": 6, "line-opacity": 0 },
      }, "roads-line");

      /* ── Grid layers ───────────────────────────────────── */
      m.addLayer({
        id: "grid-outer", type: "circle", source: "grid",
        paint: {
          "circle-radius": 12, "circle-color": "transparent", "circle-stroke-width": 2,
          "circle-stroke-color": ["case", ["==", ["get", "status"], "active"], "#C9A227", "#999"],
          "circle-stroke-opacity": 0,
        },
      });
      m.addLayer({
        id: "grid-inner", type: "circle", source: "grid",
        paint: {
          "circle-radius": 5,
          "circle-color": ["case", ["==", ["get", "status"], "active"], "#C9A227", "#999"],
          "circle-opacity": 0,
        },
      });

      /* ── Density layers ────────────────────────────────── */
      m.addLayer({
        id: "density-heat", type: "heatmap", source: "density",
        paint: {
          "heatmap-weight": ["get", "weight"], "heatmap-intensity": 1.2,
          "heatmap-radius": 35, "heatmap-opacity": 0,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(199,96,63,0)", 0.3, "rgba(199,96,63,0.25)",
            0.6, "rgba(199,96,63,0.5)", 1, "rgba(199,96,63,0.85)",
          ],
        },
      });
      m.addLayer({
        id: "density-circles", type: "circle", source: "density", minzoom: 13,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 4, 16, 8],
          "circle-color": "#C7603F", "circle-opacity": 0,
          "circle-stroke-width": 1, "circle-stroke-color": "#C7603F", "circle-stroke-opacity": 0,
        },
      });

      /* ── Popups ────────────────────────────────────────── */
      m.on("click", "grid-inner", (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        new mapboxgl.Popup({ offset: 15, className: "atlas-popup" })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:-apple-system,sans-serif;font-size:13px;">
              <strong>${props.zone}</strong><br>
              Status: <span style="color:${props.status === "active" ? "#1B9C6B" : "#999"}">${props.status}</span><br>
              Capacity: ${props.capacity} MW
            </div>
          `)
          .addTo(m);
      });
      m.on("click", "roads-line", (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        new mapboxgl.Popup({ offset: 15, className: "atlas-popup" })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:-apple-system,sans-serif;font-size:13px;">
              <strong>${props.name}</strong><br>
              Progress: <span style="color:#2C6FB0">${props.progress}%</span>
            </div>
          `)
          .addTo(m);
      });

      m.on("mouseenter", "grid-inner", () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", "grid-inner", () => { m.getCanvas().style.cursor = ""; });
      m.on("mouseenter", "roads-line", () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", "roads-line", () => { m.getCanvas().style.cursor = ""; });

      setLoaded(true);
    });

    /* ── Zone markers (pills) ──────────────────────────────── */
    zones.forEach((zone) => {
      const el = document.createElement("div");
      el.className = "zone-marker";
      const color = scoreColor(zone.score);
      el.innerHTML = `
        <div class="zone-pill" style="
          background: ${color};
          color: white;
          padding: 5px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 10px ${color}44, 0 0 0 2px white;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease;
          white-space: nowrap;
          letter-spacing: -0.01em;
          line-height: 1.3;
          text-align: center;
        ">
          <div style="font-size:13px;font-weight:700;">${zone.score}</div>
          <div style="font-size:9.5px;opacity:0.9;font-weight:500;">${zone.name}</div>
        </div>
      `;
      el.addEventListener("mouseenter", () => {
        const pill = el.querySelector(".zone-pill") as HTMLElement;
        if (pill) {
          pill.style.transform = "scale(1.15)";
          pill.style.boxShadow = `0 4px 16px ${color}66, 0 0 0 3px white`;
        }
      });
      el.addEventListener("mouseleave", () => {
        const pill = el.querySelector(".zone-pill") as HTMLElement;
        if (pill) {
          pill.style.transform = "scale(1)";
          pill.style.boxShadow = `0 2px 10px ${color}44, 0 0 0 2px white`;
        }
      });
      el.addEventListener("click", () => setSelectedZone(zone.id));

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(zone.centroid)
        .addTo(m);
      markersRef.current.push(marker);
    });

    mapRef.current = m;

    return () => {
      markersRef.current = [];
      m.remove();
      mapRef.current = null;
    };
  }, []);

  /* ── Fly to selected zone + highlight pill ────────────────── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;

    if (selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId);
      if (zone) {
        m.flyTo({ center: zone.centroid, zoom: 13, duration: 1400, pitch: 20, essential: true });
      }
    }

    markersRef.current.forEach((marker, i) => {
      if (i >= zones.length) return;
      const pill = marker.getElement().querySelector(".zone-pill") as HTMLElement;
      if (!pill) return;
      const isSelected = zones[i].id === selectedZoneId;
      const color = scoreColor(zones[i].score);
      pill.style.transform = isSelected ? "scale(1.2)" : "scale(1)";
      pill.style.boxShadow = isSelected
        ? `0 4px 20px ${color}88, 0 0 0 3px white`
        : `0 2px 10px ${color}44, 0 0 0 2px white`;
    });
  }, [selectedZoneId, loaded, zones]);

  /* ── Toggle data layers via opacity ───────────────────────── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;

    const apply = () => {
      if (m.getLayer("roads-line")) {
        m.setPaintProperty("roads-line", "line-opacity", activeLayers.roads ? 0.85 : 0);
        m.setPaintProperty("roads-glow", "line-opacity", activeLayers.roads ? 0.25 : 0);
      }
      if (m.getLayer("grid-outer")) {
        m.setPaintProperty("grid-outer", "circle-stroke-opacity", activeLayers.energy ? 0.9 : 0);
        m.setPaintProperty("grid-inner", "circle-opacity", activeLayers.energy ? 0.9 : 0);
      }
      if (m.getLayer("density-heat")) {
        m.setPaintProperty("density-heat", "heatmap-opacity", activeLayers.density ? 0.65 : 0);
        m.setPaintProperty("density-circles", "circle-opacity", activeLayers.density ? 0.5 : 0);
        m.setPaintProperty("density-circles", "circle-stroke-opacity", activeLayers.density ? 0.3 : 0);
      }
    };

    if (m.isStyleLoaded()) apply();
    else m.on("load", apply);
  }, [activeLayers, loaded]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainer} style={{ position: "absolute", inset: 0 }} />

      {/* Layer toggles — top left overlay */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...springSettle }}
        className="absolute top-3 left-3 z-10 flex gap-2 flex-wrap"
      >
        {LAYER_META.map((l) => {
          const on = activeLayers[l.key];
          return (
            <button
              key={l.key}
              onClick={() => toggleLayer(l.key)}
              className={`
                border-none cursor-pointer px-4 py-2 rounded-full
                text-[12px] font-medium tracking-[-0.01em]
                transition-all duration-[450ms] flex items-center gap-2
                ${on
                  ? "bg-[#1A1A18] text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
                  : "bg-white/90 text-black/60 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-white"
                }
              `}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-opacity"
                style={{ backgroundColor: l.color, opacity: on ? 1 : 0.5 }}
              />
              {l.label}
            </button>
          );
        })}
      </motion.div>

      {/* Legend — bottom left */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ...springSettle }}
        className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-[14px] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_50px_rgba(0,0,0,0.06)] text-[11px] space-y-1.5"
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

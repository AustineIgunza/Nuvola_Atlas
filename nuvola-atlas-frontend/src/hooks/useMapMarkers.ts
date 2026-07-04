import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useUIStore } from "@/stores/ui";
import { markerScoreColor } from "@/components/map/atlas-map.constants";
import type { Zone } from "@/types";

export function useMapMarkers(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  zones: Zone[],
  loaded: boolean,
) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const selectedZoneId = useUIStore((s) => s.selectedZoneId);

  // Create markers once on mount
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;

    zones.forEach((zone) => {
      const el = document.createElement("div");
      el.className = "zone-marker";
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", `Open scorecard for ${zone.name}`);
      el.tabIndex = 0;
      const color = markerScoreColor(zone.score);
      el.innerHTML = `
        <div class="zone-pill" style="
          background: ${color};
          color: white;
          padding: 5px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 10px ${color}44, 0 0 16px ${color}33, 0 0 0 2px var(--zone-marker-ring);
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
          pill.style.boxShadow = `0 4px 16px ${color}66, 0 0 20px ${color}44, 0 0 0 3px var(--zone-marker-ring)`;
        }
      });
      el.addEventListener("mouseleave", () => {
        const pill = el.querySelector(".zone-pill") as HTMLElement;
        if (pill) {
          pill.style.transform = "scale(1)";
          pill.style.boxShadow = `0 2px 10px ${color}44, 0 0 16px ${color}33, 0 0 0 2px var(--zone-marker-ring)`;
        }
      });
      el.addEventListener("click", () => setSelectedZone(zone.id));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedZone(zone.id);
        }
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(zone.centroid)
        .addTo(m);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [mapRef, zones, setSelectedZone]);

  // Highlight selected zone + fly to it
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
      const color = markerScoreColor(zones[i].score);
      pill.style.transform = isSelected ? "scale(1.2)" : "scale(1)";
      pill.style.boxShadow = isSelected
        ? `0 4px 20px ${color}88, 0 0 24px ${color}55, 0 0 0 3px var(--zone-marker-ring)`
        : `0 2px 10px ${color}44, 0 0 16px ${color}33, 0 0 0 2px var(--zone-marker-ring)`;
      pill.classList.toggle("zone-pill--selected", isSelected);
      pill.style.setProperty("--pulse-color", color);
    });
  }, [mapRef, loaded, selectedZoneId, zones]);
}

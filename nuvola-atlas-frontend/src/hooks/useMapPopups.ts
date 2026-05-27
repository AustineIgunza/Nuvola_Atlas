import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export function useMapPopups(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  loaded: boolean,
) {
  const attachedRef = useRef(false);

  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded || attachedRef.current) return;
    attachedRef.current = true;

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
  }, [mapRef, loaded]);
}

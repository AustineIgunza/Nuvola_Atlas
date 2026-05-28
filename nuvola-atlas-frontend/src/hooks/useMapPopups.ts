import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useUIStore } from "@/stores/ui";

export function useMapPopups(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  loaded: boolean,
) {
  const attachedRef = useRef(false);

  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded || attachedRef.current) return;
    attachedRef.current = true;

    // Click handlers attach to the invisible touch layers (much bigger than the
    // visible markers) so taps land reliably on phones and clicks on desktop
    // don't require sub-pixel precision. Gate by the current activeLayers state
    // so toggled-off layers don't open popups from their invisible hit areas.
    const openGridPopup = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!useUIStore.getState().activeLayers.energy) return;
      const props = e.features?.[0]?.properties;
      if (!props) return;
      new mapboxgl.Popup({ offset: 15, className: "atlas-popup", closeButton: true, closeOnMove: false })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family:-apple-system,sans-serif;font-size:13px;min-width:140px;">
            <div style="font-weight:600;margin-bottom:4px;">${props.zone}</div>
            <div style="color:#444;">Status: <span style="color:${props.status === "active" ? "#1B9C6B" : "#999"};font-weight:500;">${props.status}</span></div>
            <div style="color:#444;">Capacity: <span style="font-weight:500;">${props.capacity} MW</span></div>
          </div>
        `)
        .addTo(m);
    };

    const openRoadPopup = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!useUIStore.getState().activeLayers.roads) return;
      const props = e.features?.[0]?.properties;
      if (!props) return;
      new mapboxgl.Popup({ offset: 15, className: "atlas-popup", closeButton: true, closeOnMove: false })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family:-apple-system,sans-serif;font-size:13px;min-width:160px;">
            <div style="font-weight:600;margin-bottom:4px;">${props.name}</div>
            <div style="color:#444;">Progress: <span style="color:#2C6FB0;font-weight:600;">${props.progress}%</span></div>
          </div>
        `)
        .addTo(m);
    };

    m.on("click", "grid-touch", openGridPopup);
    m.on("click", "grid-inner", openGridPopup);
    m.on("click", "roads-touch", openRoadPopup);
    m.on("click", "roads-line", openRoadPopup);

    const setPointer = () => { m.getCanvas().style.cursor = "pointer"; };
    const clearPointer = () => { m.getCanvas().style.cursor = ""; };
    m.on("mouseenter", "grid-touch", setPointer);
    m.on("mouseleave", "grid-touch", clearPointer);
    m.on("mouseenter", "roads-touch", setPointer);
    m.on("mouseleave", "roads-touch", clearPointer);
  }, [mapRef, loaded]);
}

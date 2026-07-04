import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useUIStore } from "@/stores/ui";
import { BRAND } from "@/lib/scoreColor";

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
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:13px;min-width:150px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:4px;">${props.zone}</div>
            <div style="color:${BRAND.inkSoft};">Status: <span style="color:${props.status === "active" ? BRAND.teal : BRAND.steel};font-weight:600;text-transform:capitalize;">${props.status}</span></div>
            <div style="color:${BRAND.inkSoft};">Capacity: <span style="color:${BRAND.gold};font-weight:600;">${props.capacity} MW</span></div>
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
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:13px;min-width:170px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:4px;">${props.name}</div>
            <div style="color:${BRAND.inkSoft};">Progress: <span style="color:${BRAND.terracotta};font-weight:600;">${props.progress}%</span></div>
          </div>
        `)
        .addTo(m);
    };

    // Water & Sanitation (SDG 6) — the richest popup: it states the zone's
    // water-access picture and, where trunk sewerage is not viable, names the
    // specific decentralized-sanitation infrastructure solution + rationale.
    const openWaterPopup = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!useUIStore.getState().activeLayers.water) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      const opportunity = p.sewerViable === false || p.sewerViable === "false";
      const stat = (label: string, value: string) => `
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:700;color:${BRAND.navy};line-height:1.1;">${value}</div>
          <div style="font-size:9.5px;color:${BRAND.inkSoft};text-transform:uppercase;letter-spacing:0.04em;margin-top:2px;">${label}</div>
        </div>`;
      const solutionBlock = opportunity
        ? `<div style="background:rgba(31,138,120,0.10);border-left:3px solid ${BRAND.teal};border-radius:8px;padding:8px 10px;margin-top:9px;">
             <div style="font-size:9.5px;font-weight:700;color:${BRAND.tealDeep};text-transform:uppercase;letter-spacing:0.04em;">◈ Decentralized sanitation opportunity — ${p.solutionTag}</div>
             <div style="margin-top:5px;color:${BRAND.navy};line-height:1.4;">${p.solution}</div>
             <div style="margin-top:6px;font-size:11px;color:${BRAND.inkSoft};line-height:1.4;">${p.rationale}</div>
           </div>`
        : `<div style="background:rgba(62,110,147,0.08);border-left:3px solid ${BRAND.steel};border-radius:8px;padding:8px 10px;margin-top:9px;">
             <div style="font-size:9.5px;font-weight:700;color:${BRAND.steel};text-transform:uppercase;letter-spacing:0.04em;">Sewerage viable — ${p.solutionTag}</div>
             <div style="margin-top:5px;color:${BRAND.navy};line-height:1.4;">${p.solution}</div>
           </div>`;
      new mapboxgl.Popup({ offset: 16, className: "atlas-popup", closeButton: true, closeOnMove: false, maxWidth: "300px" })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:12.5px;min-width:240px;color:${BRAND.navy};">
            <div style="font-weight:700;font-size:14px;">${p.zone}</div>
            <div style="font-size:11px;color:${BRAND.inkSoft};margin-bottom:9px;">Water &amp; Sanitation · ${p.context}</div>
            <div style="display:flex;gap:10px;">
              ${stat("Safe access", `${p.accessPct}%`)}
              ${stat("Shared points", `${p.sharedPointPct}%`)}
              ${stat("Median queue", `${p.waitMin} min`)}
            </div>
            ${solutionBlock}
          </div>
        `)
        .addTo(m);
    };

    const openMomentumPopup = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!useUIStore.getState().activeLayers.momentum) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      const stalled = p.status === "stalled";
      const barColor = stalled ? BRAND.rose : BRAND.gold;
      new mapboxgl.Popup({ offset: 15, className: "atlas-popup", closeButton: true, closeOnMove: false })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:13px;min-width:190px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:2px;">${p.name}</div>
            <div style="font-size:11px;color:${BRAND.inkSoft};margin-bottom:7px;">${p.agency} · <span style="color:${barColor};font-weight:600;text-transform:capitalize;">${p.status}</span></div>
            <div style="height:6px;border-radius:999px;background:rgba(11,34,53,0.10);overflow:hidden;">
              <div style="height:100%;width:${p.progress}%;background:${barColor};border-radius:999px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:11px;color:${BRAND.inkSoft};">
              <span><span style="color:${BRAND.navy};font-weight:700;">${p.progress}%</span> complete</span>
              <span>ETA ${p.eta}</span>
            </div>
          </div>
        `)
        .addTo(m);
    };

    const openSafetyPopup = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!useUIStore.getState().activeLayers.safety) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      const risk = Number(p.risk);
      const riskColor = risk >= 40 ? BRAND.rose : risk >= 30 ? BRAND.gold : BRAND.steel;
      const riskLabel = risk >= 40 ? "At risk" : risk >= 30 ? "Watch" : "Secure";
      const delta = Number(p.delta);
      const deltaStr = delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "no change";
      new mapboxgl.Popup({ offset: 15, className: "atlas-popup", closeButton: true, closeOnMove: false })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:13px;min-width:180px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:4px;">${p.zone}</div>
            <div style="color:${BRAND.inkSoft};">Safety score: <span style="color:${riskColor};font-weight:700;">${p.safety}</span> <span style="color:${riskColor};font-weight:600;">· ${riskLabel}</span></div>
            <div style="color:${BRAND.inkSoft};margin-top:2px;">Trend: <span style="color:${delta < 0 ? BRAND.rose : BRAND.teal};font-weight:600;">${deltaStr}</span></div>
          </div>
        `)
        .addTo(m);
    };

    // Vitality choropleth — hovering lifts the cell, clicking selects the zone
    // (same as clicking its score pill). The click yields to any active
    // overlay's marker/line under the cursor so their popups keep priority.
    let hoveredCell: number | null = null;
    const clearCellHover = () => {
      if (hoveredCell === null) return;
      try {
        m.setFeatureState({ source: "vitality", id: hoveredCell }, { hover: false });
      } catch {
        // source may not exist during style swap
      }
      hoveredCell = null;
    };
    const onCellMove = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!useUIStore.getState().activeLayers.vitality) return clearCellHover();
      const id = e.features?.[0]?.id;
      if (typeof id !== "number" || id === hoveredCell) return;
      clearCellHover();
      try {
        m.setFeatureState({ source: "vitality", id }, { hover: true });
        hoveredCell = id;
      } catch {
        // source may not exist during style swap
      }
    };
    const onCellClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const active = useUIStore.getState().activeLayers;
      if (!active.vitality) return;
      const gates = [
        ...(active.roads ? ["roads-touch"] : []),
        ...(active.energy ? ["grid-touch"] : []),
        ...(active.water ? ["water-touch"] : []),
        ...(active.momentum ? ["momentum-touch"] : []),
        ...(active.safety ? ["safety-touch"] : []),
      ];
      if (gates.length && m.queryRenderedFeatures(e.point, { layers: gates }).length) return;
      const zoneId = e.features?.[0]?.properties?.zoneId;
      if (zoneId) useUIStore.getState().setSelectedZone(String(zoneId));
    };
    m.on("mousemove", "vitality-fill", onCellMove);
    m.on("mouseleave", "vitality-fill", clearCellHover);
    m.on("click", "vitality-fill", onCellClick);

    m.on("click", "grid-touch", openGridPopup);
    m.on("click", "grid-inner", openGridPopup);
    m.on("click", "roads-touch", openRoadPopup);
    m.on("click", "roads-line", openRoadPopup);
    m.on("click", "water-touch", openWaterPopup);
    m.on("click", "water-core", openWaterPopup);
    m.on("click", "momentum-touch", openMomentumPopup);
    m.on("click", "momentum-core", openMomentumPopup);
    m.on("click", "safety-touch", openSafetyPopup);
    m.on("click", "safety-core", openSafetyPopup);

    const setPointer = () => { m.getCanvas().style.cursor = "pointer"; };
    const clearPointer = () => { m.getCanvas().style.cursor = ""; };
    m.on("mouseenter", "grid-touch", setPointer);
    m.on("mouseleave", "grid-touch", clearPointer);
    m.on("mouseenter", "roads-touch", setPointer);
    m.on("mouseleave", "roads-touch", clearPointer);
    m.on("mouseenter", "water-touch", setPointer);
    m.on("mouseleave", "water-touch", clearPointer);
    m.on("mouseenter", "momentum-touch", setPointer);
    m.on("mouseleave", "momentum-touch", clearPointer);
    m.on("mouseenter", "safety-touch", setPointer);
    m.on("mouseleave", "safety-touch", clearPointer);
  }, [mapRef, loaded]);
}

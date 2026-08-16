import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useUIStore } from "@/stores/ui";
import { BRAND } from "@/lib/scoreColor";

export function useMapPopups(mapRef: React.RefObject<mapboxgl.Map | null>, loaded: boolean) {
  const attachedRef = useRef(false);

  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded || attachedRef.current) return;
    attachedRef.current = true;

    // Click handlers attach to the invisible touch layers (much bigger than the
    // visible markers) so taps land reliably on phones and clicks on desktop
    // don't require sub-pixel precision. Gate by the current activeLayers state
    // so toggled-off layers don't open popups from their invisible hit areas.
    const openGridPopup = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      if (!useUIStore.getState().activeLayers.energy) return;
      const props = e.features?.[0]?.properties;
      if (!props) return;
      new mapboxgl.Popup({
        offset: 15,
        className: "atlas-popup",
        closeButton: true,
        closeOnMove: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:13px;min-width:150px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:4px;">${props.zone}</div>
            <div style="color:${BRAND.inkSoft};">Status: <span style="color:${props.status === "active" ? BRAND.teal : BRAND.steel};font-weight:600;text-transform:capitalize;">${props.status}</span></div>
            <div style="color:${BRAND.inkSoft};">Capacity: <span style="color:${BRAND.gold};font-weight:600;">${props.capacity} MW</span></div>
          </div>
        `,
        )
        .addTo(m);
    };

    const openRoadPopup = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      if (!useUIStore.getState().activeLayers.roads) return;
      const props = e.features?.[0]?.properties;
      if (!props) return;
      new mapboxgl.Popup({
        offset: 15,
        className: "atlas-popup",
        closeButton: true,
        closeOnMove: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:13px;min-width:170px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:4px;">${props.name}</div>
            <div style="color:${BRAND.inkSoft};">Progress: <span style="color:${BRAND.terracotta};font-weight:600;">${props.progress}%</span></div>
          </div>
        `,
        )
        .addTo(m);
    };

    // Water & Sanitation — compact popup on click, styled like the project
    // (momentum/grid/road) popups. The hub carries the full SDG-6 profile;
    // taps use the same hub read (they belong to the same zone); mains show
    // trunk-line access; sanitation facilities render the project-style card.
    const openWaterFacilityPopup = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      const p = e.features?.[0]?.properties;
      if (!p) return;
      new mapboxgl.Popup({
        offset: 14,
        className: "atlas-popup",
        closeButton: true,
        closeOnMove: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:12.5px;min-width:200px;color:${BRAND.navy};">
            <div style="font-size:9.5px;font-weight:700;color:${BRAND.tealDeep};text-transform:uppercase;letter-spacing:0.04em;">◈ ${p.facility}</div>
            <div style="font-weight:600;margin:3px 0 2px;">${p.name}</div>
            <div style="font-size:11px;color:${BRAND.inkSoft};margin-bottom:7px;">${p.agency} · <span style="text-transform:capitalize;">${p.status}</span></div>
            <div style="height:6px;border-radius:999px;background:rgba(11,34,53,0.10);overflow:hidden;">
              <div style="height:100%;width:${p.progress}%;background:${BRAND.tealDeep};border-radius:999px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:11px;color:${BRAND.inkSoft};">
              <span><span style="color:${BRAND.navy};font-weight:700;">${p.progress}%</span> complete</span>
              <span>ETA ${p.eta}</span>
            </div>
          </div>
        `,
        )
        .addTo(m);
    };

    const openWaterMainPopup = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      if (!useUIStore.getState().activeLayers.water) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      new mapboxgl.Popup({
        offset: 12,
        className: "atlas-popup",
        closeButton: true,
        closeOnMove: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:12.5px;min-width:170px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:3px;">${p.name}</div>
            <div style="color:${BRAND.inkSoft};">Trunk main · served access <span style="color:${BRAND.tealDeep};font-weight:700;">${p.access}%</span></div>
          </div>
        `,
        )
        .addTo(m);
    };

    const openWaterPopup = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      if (!useUIStore.getState().activeLayers.water) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      if (p.kind === "facility") return openWaterFacilityPopup(e);
      const needPct = Number(p.needPct ?? Math.round(Number(p.need) * 100));
      new mapboxgl.Popup({
        offset: 14,
        className: "atlas-popup",
        closeButton: true,
        closeOnMove: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:12.5px;min-width:190px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:2px;">${p.zone}</div>
            <div style="font-size:11px;color:${BRAND.inkSoft};margin-bottom:7px;">Water &amp; Sanitation${p.context ? ` · ${p.context}` : ""}</div>
            <div style="height:6px;border-radius:999px;background:rgba(11,34,53,0.10);overflow:hidden;">
              <div style="height:100%;width:${needPct}%;background:${BRAND.tealDeep};border-radius:999px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:11px;color:${BRAND.inkSoft};">
              <span>Unmet need <span style="color:${BRAND.navy};font-weight:700;">${needPct}/100</span></span>
              ${p.accessPct !== undefined ? `<span>${p.accessPct}% safe access</span>` : ""}
            </div>
          </div>
        `,
        )
        .addTo(m);
    };

    // Safety heatmap — small popup with the zone's safety score + risk band.
    const openSafetyPopup = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      if (!useUIStore.getState().activeLayers.safety) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      const risk = Number(p.risk);
      const riskColor = risk >= 40 ? BRAND.rose : risk >= 30 ? BRAND.gold : BRAND.steel;
      const riskLabel = risk >= 40 ? "At risk" : risk >= 30 ? "Watch" : "Secure";
      const delta = Number(p.delta ?? 0);
      const deltaStr = delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "no change";
      new mapboxgl.Popup({
        offset: 14,
        className: "atlas-popup",
        closeButton: true,
        closeOnMove: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:12.5px;min-width:180px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:2px;">${p.zone}</div>
            <div style="font-size:11px;color:${BRAND.inkSoft};margin-bottom:5px;">Safety &amp; Security · <span style="color:${riskColor};font-weight:700;">${riskLabel}</span></div>
            <div style="color:${BRAND.inkSoft};">Safety score: <span style="color:${riskColor};font-weight:700;">${p.safety}</span></div>
            <div style="color:${BRAND.inkSoft};margin-top:2px;">Trend: <span style="color:${delta < 0 ? BRAND.rose : BRAND.teal};font-weight:600;">${deltaStr}</span></div>
          </div>
        `,
        )
        .addTo(m);
    };

    // Density heatmap — small popup with the zone's density score.
    const openDensityPopup = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      if (!useUIStore.getState().activeLayers.density) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      const score = Number(p.density);
      const delta = Number(p.delta ?? 0);
      const deltaStr = delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "no change";
      new mapboxgl.Popup({
        offset: 14,
        className: "atlas-popup",
        closeButton: true,
        closeOnMove: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:12.5px;min-width:180px;color:${BRAND.navy};">
            <div style="font-weight:600;margin-bottom:2px;">${p.zone}</div>
            <div style="font-size:11px;color:${BRAND.inkSoft};margin-bottom:5px;">Density &amp; Scaling</div>
            <div style="height:6px;border-radius:999px;background:rgba(11,34,53,0.10);overflow:hidden;">
              <div style="height:100%;width:${score}%;background:${BRAND.steel};border-radius:999px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:11px;color:${BRAND.inkSoft};">
              <span>Score <span style="color:${BRAND.navy};font-weight:700;">${score}/100</span></span>
              <span>Trend <span style="color:${delta > 0 ? BRAND.rose : BRAND.teal};font-weight:600;">${deltaStr}</span></span>
            </div>
          </div>
        `,
        )
        .addTo(m);
    };

    const openMomentumPopup = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      if (!useUIStore.getState().activeLayers.momentum) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      const stalled = p.status === "stalled";
      const barColor = stalled ? BRAND.rose : BRAND.gold;
      new mapboxgl.Popup({
        offset: 15,
        className: "atlas-popup",
        closeButton: true,
        closeOnMove: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `
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
        `,
        )
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
    const onCellMove = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
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
    const onCellClick = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      const active = useUIStore.getState().activeLayers;
      if (!active.vitality) return;
      const gates = [
        ...(active.roads ? ["roads-touch"] : []),
        ...(active.energy ? ["grid-touch"] : []),
        ...(active.momentum ? ["momentum-touch"] : []),
        ...(active.water ? ["water-touch", "water-main-touch", "water-tap", "water-facility"] : []),
        ...(active.safety ? ["safety-touch"] : []),
        ...(active.density ? ["density-touch"] : []),
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
    m.on("click", "momentum-touch", openMomentumPopup);
    m.on("click", "momentum-core", openMomentumPopup);
    // Water & Sanitation geometry — mains, taps, hubs, facilities each open a
    // compact popup in the project-management style.
    m.on("click", "water-main-touch", openWaterMainPopup);
    m.on("click", "water-main", openWaterMainPopup);
    m.on("click", "water-touch", openWaterPopup);
    m.on("click", "water-core", openWaterPopup);
    m.on("click", "water-tap", openWaterPopup);
    m.on("click", "water-facility", openWaterFacilityPopup);
    // Safety heatmap hit surface — the fat invisible circles that make the heat
    // clickable, each carrying the zone's safety read.
    m.on("click", "safety-touch", openSafetyPopup);
    // Density heatmap hit surface — same pattern.
    m.on("click", "density-touch", openDensityPopup);

    const setPointer = () => {
      m.getCanvas().style.cursor = "pointer";
    };
    const clearPointer = () => {
      m.getCanvas().style.cursor = "";
    };
    m.on("mouseenter", "grid-touch", setPointer);
    m.on("mouseleave", "grid-touch", clearPointer);
    m.on("mouseenter", "roads-touch", setPointer);
    m.on("mouseleave", "roads-touch", clearPointer);
    // Momentum layer hover preview — a tiny non-interactive card that names
    // the project + shows progress. Doesn't replace the on-click detail
    // popup; it's just so you can find the marker you want to click.
    const momentumHoverPopup = new mapboxgl.Popup({
      offset: 12,
      className: "atlas-popup atlas-popup--hover",
      closeButton: false,
      closeOnClick: false,
      closeOnMove: true,
    });
    const openMomentumHover = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) => {
      if (!useUIStore.getState().activeLayers.momentum) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      const stalled = p.status === "stalled";
      const barColor = stalled ? BRAND.rose : BRAND.gold;
      momentumHoverPopup
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="font-family:'Poppins',-apple-system,sans-serif;font-size:11px;padding:2px 4px;color:${BRAND.navy};">
            <div style="font-weight:600;">${p.name}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px;color:${BRAND.inkSoft};">
              <span style="width:6px;height:6px;border-radius:999px;background:${barColor};"></span>
              <span><span style="color:${BRAND.navy};font-weight:600;">${p.progress}%</span> · ${p.status}</span>
            </div>
          </div>
        `,
        )
        .addTo(m);
      setPointer();
    };
    const closeMomentumHover = () => {
      momentumHoverPopup.remove();
      clearPointer();
    };
    m.on("mouseenter", "momentum-touch", openMomentumHover);
    m.on("mouseleave", "momentum-touch", closeMomentumHover);
    m.on("mouseenter", "momentum-core", openMomentumHover);
    m.on("mouseleave", "momentum-core", closeMomentumHover);
    m.on("mouseenter", "water-main-touch", setPointer);
    m.on("mouseleave", "water-main-touch", clearPointer);
    m.on("mouseenter", "water-touch", setPointer);
    m.on("mouseleave", "water-touch", clearPointer);
    m.on("mouseenter", "water-tap", setPointer);
    m.on("mouseleave", "water-tap", clearPointer);
    m.on("mouseenter", "water-facility", setPointer);
    m.on("mouseleave", "water-facility", clearPointer);
    m.on("mouseenter", "safety-touch", setPointer);
    m.on("mouseleave", "safety-touch", clearPointer);
    m.on("mouseenter", "density-touch", setPointer);
    m.on("mouseleave", "density-touch", clearPointer);
  }, [mapRef, loaded]);
}

import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Zone } from '../../types/zone';
import { MOCK_ZONES } from '../../mock/zones';
import { LayerToggle } from './LayerToggle';
import { useUIStore } from '../../stores/ui';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const NAIROBI_CENTER: [number, number] = [36.84, -1.283];
const NAIROBI_ZOOM = 11.5;

function scoreColor(score: number): string {
    if (score >= 70) return '#1B9C6B';
    if (score >= 55) return '#C9A227';
    return '#C7603F';
}

// ── Stable mock GeoJSON (generated once at module level) ──

const roadFeatures = buildRoadFeatures();
const gridFeatures = buildGridFeatures();
const densityFeatures = buildDensityFeatures();

function buildRoadFeatures() {
    const pairs = [
        [0, 1], [1, 2], [2, 3], [0, 5], [5, 4], [4, 7],
        [7, 10], [10, 8], [8, 6], [1, 12], [12, 11],
        [3, 14], [14, 13], [13, 3], [15, 4], [15, 5],
        [1, 16], [16, 15],
    ];
    return pairs
        .filter(([a, b]) => a < MOCK_ZONES.length && b < MOCK_ZONES.length)
        .map(([a, b]) => ({
            type: 'Feature' as const,
            geometry: { type: 'LineString' as const, coordinates: [MOCK_ZONES[a].centroid, MOCK_ZONES[b].centroid] },
            properties: { progress: Math.round(30 + Math.random() * 70), name: `${MOCK_ZONES[a].name} → ${MOCK_ZONES[b].name}` },
        }));
}

function buildGridFeatures() {
    return MOCK_ZONES.flatMap((z) => {
        const count = 2 + Math.floor(Math.random() * 3);
        return Array.from({ length: count }, () => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [z.centroid[0] + (Math.random() - 0.5) * 0.025, z.centroid[1] + (Math.random() - 0.5) * 0.02] },
            properties: { status: Math.random() > 0.3 ? 'active' : 'planned', zone: z.name, capacity: Math.round(20 + Math.random() * 80) },
        }));
    });
}

function buildDensityFeatures() {
    return MOCK_ZONES.flatMap((z) => {
        const count = Math.round((z.pillars.density / 100) * 20) + 5;
        return Array.from({ length: count }, () => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [z.centroid[0] + (Math.random() - 0.5) * 0.04, z.centroid[1] + (Math.random() - 0.5) * 0.03] },
            properties: { weight: z.pillars.density / 100, zone: z.name },
        }));
    });
}

// ── Add sources + layers (idempotent — safe to call multiple times) ──

function addSourcesAndLayers(m: mapboxgl.Map) {
    // Sources
    if (!m.getSource('roads')) {
        m.addSource('roads', { type: 'geojson', data: { type: 'FeatureCollection', features: roadFeatures } });
    }
    if (!m.getSource('grid')) {
        m.addSource('grid', { type: 'geojson', data: { type: 'FeatureCollection', features: gridFeatures } });
    }
    if (!m.getSource('density')) {
        m.addSource('density', { type: 'geojson', data: { type: 'FeatureCollection', features: densityFeatures } });
    }

    // Layers (only add if missing)
    if (!m.getLayer('roads-glow')) {
        m.addLayer({ id: 'roads-glow', type: 'line', source: 'roads', paint: { 'line-color': '#40798C', 'line-width': 8, 'line-blur': 6, 'line-opacity': 0 } });
    }
    if (!m.getLayer('roads-line')) {
        m.addLayer({ id: 'roads-line', type: 'line', source: 'roads', paint: { 'line-color': '#40798C', 'line-width': 3, 'line-dasharray': [2, 2], 'line-opacity': 0 } });
    }
    if (!m.getLayer('grid-outer')) {
        m.addLayer({ id: 'grid-outer', type: 'circle', source: 'grid', paint: { 'circle-radius': 12, 'circle-color': 'transparent', 'circle-stroke-width': 2, 'circle-stroke-color': ['case', ['==', ['get', 'status'], 'active'], '#C9A227', '#999'], 'circle-stroke-opacity': 0 } });
    }
    if (!m.getLayer('grid-inner')) {
        m.addLayer({ id: 'grid-inner', type: 'circle', source: 'grid', paint: { 'circle-radius': 5, 'circle-color': ['case', ['==', ['get', 'status'], 'active'], '#C9A227', '#999'], 'circle-opacity': 0 } });
    }
    if (!m.getLayer('density-heat')) {
        m.addLayer({ id: 'density-heat', type: 'heatmap', source: 'density', paint: { 'heatmap-weight': ['get', 'weight'], 'heatmap-intensity': 1.2, 'heatmap-radius': 35, 'heatmap-opacity': 0, 'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(199,96,63,0)', 0.3, 'rgba(199,96,63,0.25)', 0.6, 'rgba(199,96,63,0.5)', 1, 'rgba(199,96,63,0.85)'] } });
    }
    if (!m.getLayer('density-circles')) {
        m.addLayer({ id: 'density-circles', type: 'circle', source: 'density', minzoom: 13, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 4, 16, 8], 'circle-color': '#C7603F', 'circle-opacity': 0, 'circle-stroke-width': 1, 'circle-stroke-color': '#C7603F', 'circle-stroke-opacity': 0 } });
    }
}

// ── Apply layer visibility ──

function applyLayerVisibility(m: mapboxgl.Map, layers: { roads: boolean; energy: boolean; density: boolean }) {
    if (!m.isStyleLoaded()) return;
    if (m.getLayer('roads-line')) {
        m.setPaintProperty('roads-line', 'line-opacity', layers.roads ? 0.85 : 0);
        m.setPaintProperty('roads-glow', 'line-opacity', layers.roads ? 0.25 : 0);
    }
    if (m.getLayer('grid-outer')) {
        m.setPaintProperty('grid-outer', 'circle-stroke-opacity', layers.energy ? 0.9 : 0);
        m.setPaintProperty('grid-inner', 'circle-opacity', layers.energy ? 0.9 : 0);
    }
    if (m.getLayer('density-heat')) {
        m.setPaintProperty('density-heat', 'heatmap-opacity', layers.density ? 0.65 : 0);
        m.setPaintProperty('density-circles', 'circle-opacity', layers.density ? 0.5 : 0);
        m.setPaintProperty('density-circles', 'circle-stroke-opacity', layers.density ? 0.3 : 0);
    }
}

// ── Component ──

interface AtlasMapProps {
    onZoneSelect: (zone: Zone) => void;
    selectedZone: Zone | null;
}

export function AtlasMap({ onZoneSelect, selectedZone }: AtlasMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const initializedRef = useRef(false);
    const currentStyleRef = useRef<string>('');
    const darkMode = useUIStore((s) => s.darkMode);
    const mapStyle = useUIStore((s) => s.mapStyle);
    const activeLayers = useUIStore((s) => s.activeLayers);

    // Resolve style URL
    function getStyleUrl() {
        if (mapStyle.includes('satellite')) return 'mapbox://styles/mapbox/satellite-streets-v12';
        if (mapStyle.includes('outdoors')) return 'mapbox://styles/mapbox/outdoors-v12';
        return darkMode ? 'mapbox://styles/mapbox/dark-v10' : 'mapbox://styles/mapbox/light-v11';
    }

    // Initialize map — runs only once
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const style = getStyleUrl();
        currentStyleRef.current = style;

        const m = new mapboxgl.Map({
            container: mapContainer.current,
            style,
            center: NAIROBI_CENTER,
            zoom: NAIROBI_ZOOM,
            pitch: 15,
            attributionControl: false,
        });

        m.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        m.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

        // On initial load: add data, apply visibility, set up click handlers ONCE
        m.on('load', () => {
            addSourcesAndLayers(m);
            applyLayerVisibility(m, useUIStore.getState().activeLayers);

            // Click handlers — registered once on 'load', not on every style change
            m.on('click', 'grid-inner', (e) => {
                const props = e.features?.[0]?.properties;
                if (!props) return;
                new mapboxgl.Popup({ offset: 15, className: 'atlas-popup' })
                    .setLngLat(e.lngLat)
                    .setHTML(`<div style="font-family:-apple-system,sans-serif;font-size:13px;"><strong>${props.zone}</strong><br>Status: <span style="color:${props.status === 'active' ? '#1B9C6B' : '#999'}">${props.status}</span><br>Capacity: ${props.capacity} MW</div>`)
                    .addTo(m);
            });
            m.on('click', 'roads-line', (e) => {
                const props = e.features?.[0]?.properties;
                if (!props) return;
                new mapboxgl.Popup({ offset: 15, className: 'atlas-popup' })
                    .setLngLat(e.lngLat)
                    .setHTML(`<div style="font-family:-apple-system,sans-serif;font-size:13px;"><strong>${props.name}</strong><br>Progress: <span style="color:#40798C">${props.progress}%</span></div>`)
                    .addTo(m);
            });
            m.on('mouseenter', 'grid-inner', () => { m.getCanvas().style.cursor = 'pointer'; });
            m.on('mouseleave', 'grid-inner', () => { m.getCanvas().style.cursor = ''; });
            m.on('mouseenter', 'roads-line', () => { m.getCanvas().style.cursor = 'pointer'; });
            m.on('mouseleave', 'roads-line', () => { m.getCanvas().style.cursor = ''; });

            initializedRef.current = true;
        });

        // Zone markers
        MOCK_ZONES.forEach((zone) => {
            const el = document.createElement('div');
            el.className = 'zone-marker';
            const color = scoreColor(zone.score);
            el.innerHTML = `<div class="zone-pill" style="--pill-color:${color};background:${color};color:white;padding:5px 11px;border-radius:999px;font-size:11px;font-weight:600;cursor:pointer;box-shadow:0 2px 10px ${color}44,0 0 0 2px white;transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s ease;white-space:nowrap;letter-spacing:-0.01em;line-height:1.3;text-align:center;"><div style="font-size:13px;font-weight:700;">${zone.score}</div><div style="font-size:9.5px;opacity:0.9;font-weight:500;">${zone.name}</div></div>`;
            el.addEventListener('mouseenter', () => {
                const pill = el.querySelector('.zone-pill') as HTMLElement;
                if (pill) { pill.style.transform = 'scale(1.15)'; pill.style.boxShadow = `0 4px 16px ${color}66, 0 0 0 3px white`; }
            });
            el.addEventListener('mouseleave', () => {
                const pill = el.querySelector('.zone-pill') as HTMLElement;
                if (pill) { pill.style.transform = 'scale(1)'; pill.style.boxShadow = `0 2px 10px ${color}44, 0 0 0 2px white`; }
            });
            el.addEventListener('click', () => onZoneSelect(zone));
            const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(zone.centroid).addTo(m);
            markersRef.current.push(marker);
        });

        map.current = m;
        return () => { markersRef.current = []; m.remove(); map.current = null; };
    }, []);

    // Style change handler — only fires AFTER initial load, prevents race condition
    useEffect(() => {
        const m = map.current;
        if (!m || !initializedRef.current) return;

        const newStyle = getStyleUrl();
        // Skip if same style already applied
        if (newStyle === currentStyleRef.current) return;
        currentStyleRef.current = newStyle;

        // After setStyle, sources/layers are wiped. Re-add on style.load.
        const onStyleData = () => {
            addSourcesAndLayers(m);
            applyLayerVisibility(m, useUIStore.getState().activeLayers);
        };

        m.once('style.load', onStyleData);
        m.setStyle(newStyle);

        return () => { m.off('style.load', onStyleData); };
    }, [darkMode, mapStyle]);

    // Fly to selected zone
    useEffect(() => {
        if (!map.current || !selectedZone) return;
        map.current.flyTo({ center: selectedZone.centroid, zoom: 13, duration: 1400, pitch: 20, essential: true });

        markersRef.current.forEach((marker, i) => {
            const pill = marker.getElement().querySelector('.zone-pill') as HTMLElement;
            if (!pill || !MOCK_ZONES[i]) return;
            const isSelected = MOCK_ZONES[i].id === selectedZone.id;
            pill.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
            pill.style.boxShadow = isSelected
                ? `0 4px 20px ${scoreColor(MOCK_ZONES[i].score)}88, 0 0 0 3px white`
                : `0 2px 10px ${scoreColor(MOCK_ZONES[i].score)}44, 0 0 0 2px white`;
        });
    }, [selectedZone?.id]);

    // Layer visibility toggle
    useEffect(() => {
        const m = map.current;
        if (!m || !initializedRef.current) return;
        if (m.isStyleLoaded()) {
            applyLayerVisibility(m, activeLayers);
        } else {
            const handler = () => applyLayerVisibility(m, activeLayers);
            m.once('style.load', handler);
            return () => { m.off('style.load', handler); };
        }
    }, [activeLayers]);

    return (
        <section className="flex-1 min-w-0 flex flex-col">
            <LayerToggle />
            <div className="rounded-card shadow-card overflow-hidden flex-1 min-h-[300px] sm:min-h-[500px] relative">
                <div ref={mapContainer} className="w-full h-full" />
                <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-[14px] px-3 py-2.5 shadow-card text-[10px] sm:text-[11px] space-y-1">
                    <div className="font-semibold text-[11px] sm:text-[12px] text-ink/70 mb-1.5">Vitality Score</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-score-green" /><span className="text-ink/60">70-100 Strong</span></div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-score-amber" /><span className="text-ink/60">55-69 Moderate</span></div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-score-red" /><span className="text-ink/60">0-54 At Risk</span></div>
                </div>
            </div>
        </section>
    );
}

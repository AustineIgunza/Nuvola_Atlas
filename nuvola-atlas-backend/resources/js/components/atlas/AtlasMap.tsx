import { useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Zone } from '../../types/zone';
import { MOCK_ZONES } from '../../mock/zones';
import { LayerToggle } from './LayerToggle';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface AtlasMapProps {
    onZoneSelect: (zone: Zone) => void;
    selectedZone: Zone | null;
    activeLayers: Record<string, boolean>;
    onToggleLayers: (layers: Record<string, boolean>) => void;
}

const NAIROBI_CENTER: [number, number] = [36.84, -1.283];
const NAIROBI_ZOOM = 11.5;

function scoreColor(score: number): string {
    if (score >= 70) return '#1B9C6B';
    if (score >= 55) return '#C9A227';
    return '#C7603F';
}

// Generate mock road lines between zones
function generateRoadFeatures() {
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
            geometry: {
                type: 'LineString' as const,
                coordinates: [MOCK_ZONES[a].centroid, MOCK_ZONES[b].centroid],
            },
            properties: {
                progress: Math.round(30 + Math.random() * 70),
                name: `${MOCK_ZONES[a].name} → ${MOCK_ZONES[b].name}`,
            },
        }));
}

// Generate mock grid nodes near each zone
function generateGridFeatures() {
    return MOCK_ZONES.flatMap((z) => {
        const count = 2 + Math.floor(Math.random() * 3);
        return Array.from({ length: count }, (_, i) => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [
                    z.centroid[0] + (Math.random() - 0.5) * 0.025,
                    z.centroid[1] + (Math.random() - 0.5) * 0.02,
                ],
            },
            properties: {
                status: Math.random() > 0.3 ? 'active' : 'planned',
                zone: z.name,
                capacity: Math.round(20 + Math.random() * 80),
            },
        }));
    });
}

// Generate density scatter points
function generateDensityFeatures() {
    return MOCK_ZONES.flatMap((z) => {
        const count = Math.round((z.pillars.density / 100) * 20) + 5;
        return Array.from({ length: count }, () => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
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

export function AtlasMap({ onZoneSelect, selectedZone, activeLayers, onToggleLayers }: AtlasMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);

    const initMap = useCallback(() => {
        if (!mapContainer.current || map.current) return;

        const m = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: NAIROBI_CENTER,
            zoom: NAIROBI_ZOOM,
            pitch: 15,
            attributionControl: false,
        });

        m.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        m.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

        m.on('load', () => {
            // --- DATA SOURCES ---

            // Road Progress
            m.addSource('roads', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: generateRoadFeatures() },
            });

            // Smart Grid
            m.addSource('grid', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: generateGridFeatures() },
            });

            // Density
            m.addSource('density', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: generateDensityFeatures() },
            });

            // --- LAYERS ---

            // Road lines (dashed)
            m.addLayer({
                id: 'roads-line',
                type: 'line',
                source: 'roads',
                paint: {
                    'line-color': '#2C6FB0',
                    'line-width': 3,
                    'line-dasharray': [2, 2],
                    'line-opacity': 0,
                },
            });

            // Road progress glow
            m.addLayer({
                id: 'roads-glow',
                type: 'line',
                source: 'roads',
                paint: {
                    'line-color': '#2C6FB0',
                    'line-width': 8,
                    'line-blur': 6,
                    'line-opacity': 0,
                },
            }, 'roads-line');

            // Grid nodes - outer ring
            m.addLayer({
                id: 'grid-outer',
                type: 'circle',
                source: 'grid',
                paint: {
                    'circle-radius': 12,
                    'circle-color': 'transparent',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': [
                        'case',
                        ['==', ['get', 'status'], 'active'], '#C9A227',
                        '#999',
                    ],
                    'circle-stroke-opacity': 0,
                },
            });

            // Grid nodes - inner dot
            m.addLayer({
                id: 'grid-inner',
                type: 'circle',
                source: 'grid',
                paint: {
                    'circle-radius': 5,
                    'circle-color': [
                        'case',
                        ['==', ['get', 'status'], 'active'], '#C9A227',
                        '#999',
                    ],
                    'circle-opacity': 0,
                },
            });

            // Density heatmap
            m.addLayer({
                id: 'density-heat',
                type: 'heatmap',
                source: 'density',
                paint: {
                    'heatmap-weight': ['get', 'weight'],
                    'heatmap-intensity': 1.2,
                    'heatmap-radius': 35,
                    'heatmap-opacity': 0,
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(199,96,63,0)',
                        0.3, 'rgba(199,96,63,0.25)',
                        0.6, 'rgba(199,96,63,0.5)',
                        1, 'rgba(199,96,63,0.85)',
                    ],
                },
            });

            // Density circles fallback at higher zoom
            m.addLayer({
                id: 'density-circles',
                type: 'circle',
                source: 'density',
                minzoom: 13,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 4, 16, 8],
                    'circle-color': '#C7603F',
                    'circle-opacity': 0,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#C7603F',
                    'circle-stroke-opacity': 0,
                },
            });

            // Popup for grid nodes
            m.on('click', 'grid-inner', (e) => {
                const props = e.features?.[0]?.properties;
                if (!props) return;
                new mapboxgl.Popup({ offset: 15, className: 'atlas-popup' })
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div style="font-family:-apple-system,sans-serif;font-size:13px;">
                            <strong>${props.zone}</strong><br>
                            Status: <span style="color:${props.status === 'active' ? '#1B9C6B' : '#999'}">${props.status}</span><br>
                            Capacity: ${props.capacity} MW
                        </div>
                    `)
                    .addTo(m);
            });

            m.on('mouseenter', 'grid-inner', () => { m.getCanvas().style.cursor = 'pointer'; });
            m.on('mouseleave', 'grid-inner', () => { m.getCanvas().style.cursor = ''; });

            // Road popup
            m.on('click', 'roads-line', (e) => {
                const props = e.features?.[0]?.properties;
                if (!props) return;
                new mapboxgl.Popup({ offset: 15, className: 'atlas-popup' })
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div style="font-family:-apple-system,sans-serif;font-size:13px;">
                            <strong>${props.name}</strong><br>
                            Progress: <span style="color:#2C6FB0">${props.progress}%</span>
                        </div>
                    `)
                    .addTo(m);
            });

            m.on('mouseenter', 'roads-line', () => { m.getCanvas().style.cursor = 'pointer'; });
            m.on('mouseleave', 'roads-line', () => { m.getCanvas().style.cursor = ''; });
        });

        // Zone markers
        MOCK_ZONES.forEach((zone) => {
            const el = document.createElement('div');
            el.className = 'zone-marker';
            const color = scoreColor(zone.score);
            el.innerHTML = `
                <div class="zone-pill" style="
                    --pill-color: ${color};
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
            el.addEventListener('mouseenter', () => {
                const pill = el.querySelector('.zone-pill') as HTMLElement;
                if (pill) {
                    pill.style.transform = 'scale(1.15)';
                    pill.style.boxShadow = `0 4px 16px ${color}66, 0 0 0 3px white`;
                }
            });
            el.addEventListener('mouseleave', () => {
                const pill = el.querySelector('.zone-pill') as HTMLElement;
                if (pill) {
                    pill.style.transform = 'scale(1)';
                    pill.style.boxShadow = `0 2px 10px ${color}44, 0 0 0 2px white`;
                }
            });
            el.addEventListener('click', () => onZoneSelect(zone));

            const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
                .setLngLat(zone.centroid)
                .addTo(m);
            markersRef.current.push(marker);
        });

        map.current = m;

        return () => {
            m.remove();
            map.current = null;
        };
    }, []);

    useEffect(() => {
        initMap();
        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Fly to selected zone
    useEffect(() => {
        if (!map.current || !selectedZone) return;
        map.current.flyTo({
            center: selectedZone.centroid,
            zoom: 13,
            duration: 1400,
            pitch: 20,
            essential: true,
        });

        // Highlight selected marker
        markersRef.current.forEach((marker, i) => {
            const pill = marker.getElement().querySelector('.zone-pill') as HTMLElement;
            if (!pill) return;
            const isSelected = MOCK_ZONES[i].id === selectedZone.id;
            pill.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
            pill.style.boxShadow = isSelected
                ? `0 4px 20px ${scoreColor(MOCK_ZONES[i].score)}88, 0 0 0 3px white`
                : `0 2px 10px ${scoreColor(MOCK_ZONES[i].score)}44, 0 0 0 2px white`;
        });
    }, [selectedZone?.id]);

    // Toggle data layers
    useEffect(() => {
        const m = map.current;
        if (!m) return;

        const apply = () => {
            // Roads
            const roadOpacity = activeLayers.roadProgress ? 0.85 : 0;
            if (m.getLayer('roads-line')) {
                m.setPaintProperty('roads-line', 'line-opacity', roadOpacity);
                m.setPaintProperty('roads-glow', 'line-opacity', activeLayers.roadProgress ? 0.25 : 0);
            }

            // Grid
            const gridOpacity = activeLayers.smartGrid ? 0.9 : 0;
            if (m.getLayer('grid-outer')) {
                m.setPaintProperty('grid-outer', 'circle-stroke-opacity', gridOpacity);
                m.setPaintProperty('grid-inner', 'circle-opacity', gridOpacity);
            }

            // Density
            if (m.getLayer('density-heat')) {
                m.setPaintProperty('density-heat', 'heatmap-opacity', activeLayers.density ? 0.65 : 0);
                m.setPaintProperty('density-circles', 'circle-opacity', activeLayers.density ? 0.5 : 0);
                m.setPaintProperty('density-circles', 'circle-stroke-opacity', activeLayers.density ? 0.3 : 0);
            }
        };

        if (m.isStyleLoaded()) {
            apply();
        } else {
            m.on('load', apply);
        }
    }, [activeLayers]);

    return (
        <section className="flex-1 min-w-[320px] flex flex-col">
            <LayerToggle activeLayers={activeLayers} onToggle={onToggleLayers} />
            <div className="rounded-card shadow-card overflow-hidden flex-1 min-h-[500px] relative">
                <div ref={mapContainer} className="w-full h-full" />
                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-[14px] px-4 py-3 shadow-card text-[11px] space-y-1.5">
                    <div className="font-semibold text-[12px] text-ink/70 mb-2">Vitality Score</div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-score-green" />
                        <span className="text-ink/60">70–100 Strong</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-score-amber" />
                        <span className="text-ink/60">55–69 Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-score-red" />
                        <span className="text-ink/60">0–54 At Risk</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

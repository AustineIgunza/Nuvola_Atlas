import type { FeatureCollection, Feature } from 'geojson';

export interface ZonePillars {
    social: number;
    safety: number;
    density: number;
    infra: number;
}

export interface ZoneDeltas {
    social: number | null;
    safety: number | null;
    density: number | null;
    infra: number | null;
}

export interface ZoneLayers {
    roadProgress: FeatureCollection | null;
    smartGrid: FeatureCollection | null;
    density: FeatureCollection | null;
}

export interface Zone {
    id: string;
    name: string;
    score: number;
    pillars: ZonePillars;
    deltas: ZoneDeltas;
    centroid: [number, number]; // [lng, lat]
    lastSyncMin: number;
    layers?: ZoneLayers;
    boundary?: Feature;
}

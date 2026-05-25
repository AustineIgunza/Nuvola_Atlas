import { useState, useEffect } from 'react';
import { MOCK_ZONES } from '../mock/zones';
import type { Zone } from '../types/zone';

/**
 * Returns zones data. Currently uses mock data.
 * To swap for real-time:
 *   1. Fetch initial zones from GET /api/zones
 *   2. Subscribe to Echo private channel `zones.{id}` for live updates
 *   3. Merge incoming ZoneScoreUpdated events into state
 *
 * The hook signature stays the same — zero UI changes needed.
 */
export function useLiveData(): {
    zones: Zone[];
    getZone: (id: string) => Zone | undefined;
} {
    const [zones] = useState<Zone[]>(MOCK_ZONES);

    return {
        zones,
        getZone: (id: string) => zones.find((z) => z.id === id),
    };
}

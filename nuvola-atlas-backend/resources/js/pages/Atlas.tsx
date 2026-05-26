import { useState } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { AtlasMap } from '../components/atlas/AtlasMap';
import { ScorecardPanel } from '../components/scorecard/ScorecardPanel';
import AppLayout from '../layouts/AppLayout';
import type { Zone } from '../types/zone';

function Atlas() {
    const { zones } = useLiveData();
    const [selectedZone, setSelectedZone] = useState<Zone | null>(zones[0] ?? null);

    return (
        <div className="flex flex-col md:flex-row gap-0 md:gap-4 p-2 md:p-4 flex-1 overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)' }}>
            <AtlasMap
                onZoneSelect={setSelectedZone}
                selectedZone={selectedZone}
            />
            <ScorecardPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
        </div>
    );
}

Atlas.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
export default Atlas;

import { useState } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { AtlasMap } from '../components/atlas/AtlasMap';
import { ScorecardPanel } from '../components/scorecard/ScorecardPanel';
import type { Zone } from '../types/zone';

export default function Atlas() {
    const { zones } = useLiveData();
    const [selectedZone, setSelectedZone] = useState<Zone | null>(zones[0] ?? null);
    const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
        roadProgress: false,
        smartGrid: false,
        density: false,
    });

    return (
        <div className="h-screen bg-surface text-ink font-sans flex flex-col overflow-hidden">
            {/* Header */}
            <header className="px-6 md:px-8 py-4 flex items-center justify-between border-b border-black/5 shrink-0">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.03em]">
                        Nuvola Atlas
                    </h1>
                    <span className="text-[12px] md:text-[13px] text-ink/40 tracking-[-0.01em]">
                        Nairobi County &middot; Spatial Intelligence
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-ink/50">
                        <span className="w-2 h-2 rounded-full bg-score-green animate-pulse" />
                        Live
                    </div>
                    <div className="text-[12px] text-ink/40 hidden md:block">
                        {zones.length} sub-counties tracked
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="flex gap-0 md:gap-4 md:p-4 flex-1 overflow-hidden">
                <AtlasMap
                    onZoneSelect={setSelectedZone}
                    selectedZone={selectedZone}
                    activeLayers={activeLayers}
                    onToggleLayers={setActiveLayers}
                />
                <ScorecardPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
            </div>
        </div>
    );
}

import { motion, AnimatePresence } from 'framer-motion';
import type { Zone } from '../../types/zone';
import { PILLAR_META } from '../../mock/zones';
import { VitalityRing } from './VitalityRing';
import { PillarBar } from './PillarBar';
import { settleSpring, panelTransition } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface ScorecardPanelProps {
    zone: Zone | null;
    onClose: () => void;
}

export function ScorecardPanel({ zone, onClose }: ScorecardPanelProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <>
            {/* Desktop: side panel */}
            <aside className="hidden lg:block w-[380px] min-w-[320px] overflow-y-auto">
                <AnimatePresence mode="wait">
                    {zone && (
                        <motion.div
                            key={zone.id}
                            className="bg-card rounded-card shadow-card p-7"
                            initial={reduced ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={settleSpring}
                        >
                            <ScorecardContent zone={zone} onClose={onClose} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </aside>

            {/* Mobile: bottom sheet */}
            <AnimatePresence>
                {zone && (
                    <>
                        <motion.div
                            className="lg:hidden fixed inset-0 z-40 bg-ink/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                        />
                        <motion.div
                            className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[26px] shadow-[0_-4px_30px_rgba(0,0,0,0.12)] p-6 pb-8 max-h-[85vh] overflow-y-auto"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={panelTransition}
                        >
                            <div className="w-10 h-1 rounded-full bg-ink/10 mx-auto mb-4" />
                            <ScorecardContent zone={zone} onClose={onClose} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

function DeltaChip({ value }: { value: number | null }) {
    if (value == null || value === 0) return null;
    const positive = value > 0;
    return (
        <span className={`text-[11px] font-medium ${positive ? 'text-score-green' : 'text-score-red'}`}>
            {positive ? '↑' : '↓'}{Math.abs(value)}
        </span>
    );
}

function ScorecardContent({ zone, onClose }: { zone: Zone; onClose: () => void }) {
    return (
        <>
            <div className="flex justify-between items-start mb-1">
                <div>
                    <div className="text-[10px] tracking-[0.16em] uppercase text-ink/38">
                        Sub-county
                    </div>
                    <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.03em]">
                        {zone.name}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="text-ink/30 hover:text-ink/60 transition-colors text-xl leading-none p-1 hover:bg-ink/5 rounded-lg"
                    aria-label="Close"
                >
                    &times;
                </button>
            </div>

            {/* Sync status */}
            <div className="flex items-center gap-1.5 mb-5 text-[11px] text-ink/40">
                <span className="w-1.5 h-1.5 rounded-full bg-score-green" />
                Synced {zone.lastSyncMin}m ago
            </div>

            {/* Ring */}
            <div className="flex justify-center mb-6">
                <VitalityRing score={zone.score} />
            </div>

            {/* Pillars */}
            <div className="border-t border-ink/7 pt-5">
                <div className="text-[10px] tracking-[0.14em] uppercase text-ink/38 mb-4">
                    Pillar Breakdown
                </div>
                {PILLAR_META.map((p, i) => (
                    <div key={`${zone.id}-${p.key}`}>
                        <PillarBar
                            label={p.label}
                            value={zone.pillars[p.key]}
                            index={i}
                            icon={p.icon}
                            delta={zone.deltas[p.key]}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}

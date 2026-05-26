import { motion } from 'framer-motion';
import { pillarTransition } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface PillarBarProps {
    label: string;
    value: number;
    index: number;
    icon?: string;
    delta?: number | null;
}

export function PillarBar({ label, value, index, icon, delta }: PillarBarProps) {
    const reduced = usePrefersReducedMotion();

    const barColor = value >= 70
        ? 'bg-score-green'
        : value >= 55
            ? 'bg-score-amber'
            : 'bg-score-red';

    return (
        <div className="mb-4">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-[12px] text-ink/60 font-[450] max-w-[200px] flex items-center gap-1.5">
                    {icon && <span className="text-[14px] opacity-50">{icon}</span>}
                    {label}
                </span>
                <span className="flex items-center gap-2">
                    {delta != null && delta !== 0 && (
                        <span className={`text-[10px] font-medium ${delta > 0 ? 'text-score-green' : 'text-score-red'}`}>
                            {delta > 0 ? '+' : ''}{delta}
                        </span>
                    )}
                    <span className="text-[14px] font-semibold text-ink tabular-nums">
                        {value}
                    </span>
                </span>
            </div>
            <div className="h-1.5 rounded-pill bg-ink/5 overflow-hidden">
                <motion.div
                    className={`h-full rounded-pill ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={reduced ? { duration: 0 } : pillarTransition(index)}
                />
            </div>
        </div>
    );
}

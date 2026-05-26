import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { ringTransition } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface VitalityRingProps {
    score: number;
}

export function VitalityRing({ score }: VitalityRingProps) {
    const reduced = usePrefersReducedMotion();
    const R = 76;
    const C = 2 * Math.PI * R;

    const motionScore = useMotionValue(0);
    const displayed = useTransform(motionScore, (v) => Math.round(v));

    const tone = score >= 70 ? '#1B9C6B' : score >= 55 ? '#C9A227' : '#C7603F';

    useEffect(() => {
        if (reduced) {
            motionScore.set(score);
            return;
        }
        const controls = animate(motionScore, score, {
            ...ringTransition,
        } as any);
        return controls.stop;
    }, [score, reduced]);

    const progress = useTransform(motionScore, [0, 100], [C, 0]);

    return (
        <div className="relative w-[200px] h-[200px]">
            <svg width="200" height="200" viewBox="0 0 200 200">
                <circle
                    cx="100" cy="100" r={R}
                    fill="none" className="stroke-ink/6" strokeWidth="14"
                />
                <motion.circle
                    cx="100" cy="100" r={R}
                    fill="none"
                    stroke={tone}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    style={{ strokeDashoffset: progress }}
                    transform="rotate(-90 100 100)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                    className="text-[52px] font-semibold tracking-[-0.04em] text-ink leading-none"
                >
                    <motion.span>{displayed}</motion.span>
                </motion.div>
                <div className="text-[11px] tracking-[0.18em] uppercase text-ink/40 mt-1.5">
                    Vitality
                </div>
            </div>
        </div>
    );
}

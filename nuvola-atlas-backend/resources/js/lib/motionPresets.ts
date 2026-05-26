import type { Transition } from 'framer-motion';

/** Apple iOS-style spring — smooth, no overshoot */
export const settleSpring: Transition = {
    type: 'spring',
    stiffness: 200,
    damping: 26,
    mass: 1,
};

/** Score ring fill — gentle 1s feel, no bounce */
export const ringTransition: Transition = {
    type: 'spring',
    stiffness: 180,
    damping: 30,
    mass: 1.2,
};

/** Staggered pillar bar — Apple cascade timing */
export const pillarTransition = (index: number): Transition => ({
    type: 'spring',
    stiffness: 200,
    damping: 26,
    delay: 0.15 + index * 0.1,
});

/** Panel slide-in — smooth and weighty */
export const panelTransition: Transition = {
    type: 'spring',
    stiffness: 220,
    damping: 28,
    mass: 1,
};

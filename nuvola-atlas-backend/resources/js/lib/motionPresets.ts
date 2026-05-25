import type { Transition } from 'framer-motion';

/** Reproduces cubic-bezier(0.22, 1, 0.36, 1) — fast overshoot-free settle */
export const settleSpring: Transition = {
    type: 'spring',
    stiffness: 380,
    damping: 30,
    mass: 1,
};

/** Score ring fill animation (1.1s feel, no bounce) */
export const ringTransition: Transition = {
    type: 'spring',
    stiffness: 300,
    damping: 35,
    mass: 1.2,
};

/** Staggered pillar bar transition */
export const pillarTransition = (index: number): Transition => ({
    type: 'spring',
    stiffness: 350,
    damping: 32,
    delay: 0.12 + index * 0.11,
});

/** Panel slide-in */
export const panelTransition: Transition = {
    type: 'spring',
    stiffness: 400,
    damping: 34,
    mass: 0.9,
};

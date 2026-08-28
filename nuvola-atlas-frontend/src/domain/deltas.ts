import type { PillarDeltas } from "@/domain/types";

/**
 * Deltas are null whenever the backend could not measure movement. Summing
 * or averaging them has to skip those rather than read them as zero — one
 * pillar with thin history would otherwise pull the headline toward flat
 * and make a zone look stable when it is simply unmeasured.
 *
 * Both helpers return null when nothing was measurable at all, which
 * callers must render as "no trend" and sort last, never as 0.
 */
function measured(deltas: PillarDeltas): number[] {
  return Object.values(deltas).filter((d): d is number => d !== null);
}

export function averageDelta(deltas: PillarDeltas): number | null {
  const values = measured(deltas);
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function totalDelta(deltas: PillarDeltas): number | null {
  const values = measured(deltas);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0);
}

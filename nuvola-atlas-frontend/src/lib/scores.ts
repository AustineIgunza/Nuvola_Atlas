import type { Zone } from "@/types";

/**
 * A zone whose pillars have no indicators behind them carries a null score.
 * These helpers exist so no surface has to reinvent the rule that an
 * unmeasured zone is neither the best nor the worst, and never a 0.
 */
export const NO_SCORE_LABEL = "—";

export function formatScore(score: number | null): string {
  return score === null ? NO_SCORE_LABEL : String(score);
}

export function isScored(zone: Zone): zone is Zone & { score: number } {
  return zone.score !== null;
}

/** Mean over the scored zones only. Null when none of them were scoreable. */
export function averageScore(zones: Zone[]): number | null {
  const scored = zones.filter(isScored);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((a, z) => a + z.score, 0) / scored.length);
}

/**
 * Descending by score with unscoreable zones pinned to the bottom. Sorting
 * them by an implied 0 would rank a zone nobody measured below one that
 * genuinely scored 1, which is the whole defect this replaces.
 */
export function byScoreDesc(a: Zone, b: Zone): number {
  if (a.score === null) return b.score === null ? 0 : 1;
  if (b.score === null) return -1;
  return b.score - a.score;
}

export function byScoreAsc(a: Zone, b: Zone): number {
  if (a.score === null) return b.score === null ? 0 : 1;
  if (b.score === null) return -1;
  return a.score - b.score;
}

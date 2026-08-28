import type { PillarKey } from "@/domain/types";

/** Drill-in navigation state for the scorecard side panel. Every clickable
 *  row in the overview pushes one of these; "overview" is the root. */
export type PanelView =
  | { type: "overview" }
  | { type: "index" }
  | { type: "pillar"; key: PillarKey }
  | { type: "water" }
  | { type: "project"; id: string }
  | { type: "alert"; id: string };

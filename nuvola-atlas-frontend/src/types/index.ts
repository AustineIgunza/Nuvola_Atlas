export type { PillarKey } from "@/lib/pillars.generated";

import type { PillarKey } from "@/lib/pillars.generated";

/**
 * Null for a pillar the zone has no reading for. The server has always been
 * able to send this — `ScoreCalculator::pillarScores` returns `?int` per
 * pillar — so a non-nullable type here was a lie that pushed a bar to 0% for
 * something nobody measured.
 */
export type PillarScores = Record<PillarKey, number | null>;

/**
 * A delta is a claim about direction, so it is null whenever the history
 * cannot support one — fewer than two snapshots in the window, or a pillar
 * that had no score at either end. Null must render as no movement shown,
 * never as a zero and never as a flat arrow.
 */
export type PillarDeltas = Record<PillarKey, number | null>;

/**
 * What `/vitality/methodology` adds to what the client already knows. Pillar
 * definitions are not in here on purpose: they are compiled into the bundle
 * from the same `pillars.json` the server generates its config from. Weights
 * are, because an admin can republish them without a deploy.
 */
export interface Methodology {
  version: string;
  weights: Record<PillarKey, number>;
}

export interface Zone {
  id: string;
  name: string;
  /**
   * Null when no pillar has a single indicator behind it. A zone in that
   * state has not scored badly, it has not scored at all — it must never be
   * ranked, averaged, or painted at the bottom of the colour ramp.
   */
  score: number | null;
  pillars: PillarScores;
  deltas: PillarDeltas;
  /** Real age in days of the baseline the deltas were measured against. */
  deltaWindowDays: number | null;
  centroid: [number, number];
  lastSyncMin: number;
  /**
   * Dotted paths of fields the client synthesised because the API returned
   * null — `pillars.water_sanitation`, `centroid`, and so on. Set by
   * `hydrateZone` in remote mode. Anything listed here is an estimate and
   * must not be rendered as though it were measured.
   */
  _hydrated?: string[];
}

export type InfraType = "road" | "energy" | "grid" | "water";
export type ProjectStatus = "active" | "stalled" | "planned";

export interface ProjectMilestone {
  date: string;
  label: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  zoneId: string;
  agency: string;
  type: InfraType;
  status: ProjectStatus;
  progress: number;
  budget: string;
  started: string;
  eta: string;
  milestones: ProjectMilestone[];
  marker: [number, number];
}

export type AlertSeverity = "high" | "medium" | "low";
export type AlertKind = "infra" | "vitality" | "esia" | "system" | "partner";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  kind: AlertKind;
  title: string;
  body: string;
  zoneId: string | null;
  createdAt: string;
  read: boolean;
  affectedInfra: string[];
  recommendedActions: string[];
  impactLevel: "critical" | "major" | "moderate" | "minor";
  relatedProjectIds: string[];
}

export type ReportStatus = "published" | "review" | "draft";

export interface ReportSection {
  heading: string;
  content: string;
}

export interface Report {
  id: string;
  title: string;
  zoneId: string | null;
  date: string;
  status: ReportStatus;
  author: string;
  sizeBytes: number;
  format: "PDF";
  sections: ReportSection[];
  tags: string[];
  type: "service_performance" | "water_sanitation" | "infrastructure" | "methodology";
  priority: "critical" | "high" | "medium" | "low";
  dateRange?: { from: string; to: string };
  pillarFocus?: PillarKey[];
  executiveSummary: string;
}

export interface HistoryPoint {
  month: string;
  overallAvg: number;
}

export type HistoryRange = "day" | "week" | "month";

export interface ZoneHistoryPoint {
  t: string;
  /** Null for a bucket whose snapshots were all unscoreable — a gap, not a 0. */
  score: number | null;
  pillars: PillarScores;
}

export interface ZoneHistory {
  range: HistoryRange;
  points: ZoneHistoryPoint[];
}

export interface ZoneForecastPoint {
  t: string;
  score: number;
  lower: number;
  upper: number;
}

export interface ZoneForecast {
  horizon: number;
  points: ZoneForecastPoint[];
}

export interface ActivityEntry {
  id: string;
  zoneId: string;
  kind: "road" | "grid" | "esia" | "transit" | "water";
  text: string;
  source: string;
  createdAt: string;
}

export type ChatRole = "user" | "assistant" | "system";
export type ChatIntent =
  | "trend"
  | "comparison"
  | "diagnostic"
  | "summary"
  | "distribution"
  | "composition"
  | "methodology"
  | "unrelated";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  intent?: ChatIntent;
  sql?: string;
  resultRows?: Array<Record<string, unknown>>;
  followups?: string[];
  createdAt: string;
  streaming?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string | null;
  zoneId: string | null;
  updatedAt: string;
  createdAt: string;
}

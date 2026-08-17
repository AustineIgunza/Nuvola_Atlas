export type PillarKey = "social" | "safety" | "density" | "infra";

export interface PillarScores {
  social: number;
  safety: number;
  density: number;
  infra: number;
}

/**
 * A delta is a claim about direction, so it is null whenever the history
 * cannot support one — fewer than two snapshots in the window, or a pillar
 * that had no score at either end. Null must render as no movement shown,
 * never as a zero and never as a flat arrow.
 */
export interface PillarDeltas {
  social: number | null;
  safety: number | null;
  density: number | null;
  infra: number | null;
}

export interface Zone {
  id: string;
  name: string;
  score: number;
  pillars: PillarScores;
  deltas: PillarDeltas;
  /** Real age in days of the baseline the deltas were measured against. */
  deltaWindowDays: number | null;
  centroid: [number, number];
  lastSyncMin: number;
  /**
   * Dotted paths of fields the client synthesised because the API returned
   * null — `pillars.social`, `centroid`, and so on. Set by `hydrateZone` in
   * remote mode. Anything listed here is an estimate and must not be
   * rendered as though it were measured.
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
  type: "vitality" | "infrastructure" | "density" | "safety" | "environmental";
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
  score: number;
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
  kind: "road" | "grid" | "esia" | "density" | "water";
  text: string;
  source: string;
  createdAt: string;
}

export interface PillarSubMetric {
  key: string;
  label: string;
  description: string;
}

export interface PillarDef {
  key: PillarKey;
  name: string;
  description: string;
  subMetrics: PillarSubMetric[];
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

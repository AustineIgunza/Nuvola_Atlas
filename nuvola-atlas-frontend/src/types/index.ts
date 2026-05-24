export type PillarKey = "social" | "safety" | "density" | "infra";

export interface PillarScores {
  social: number;
  safety: number;
  density: number;
  infra: number;
}

export interface Zone {
  id: string;
  name: string;
  score: number;
  pillars: PillarScores;
  deltas: PillarScores;
  centroid: [number, number];
  lastSyncMin: number;
}

export type InfraType = "road" | "energy" | "grid";
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
}

export type ReportStatus = "published" | "review" | "draft";

export interface Report {
  id: string;
  title: string;
  zoneId: string | null;
  date: string;
  status: ReportStatus;
  author: string;
  sizeBytes: number;
  format: "PDF";
}

export interface HistoryPoint {
  month: string;
  overallAvg: number;
}

export interface ActivityEntry {
  id: string;
  zoneId: string;
  kind: "road" | "grid" | "esia" | "density";
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

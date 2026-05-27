import { delay } from "./client";
import {
  ZONES,
  PROJECTS,
  ALERTS,
  REPORTS,
  HISTORY,
  ACTIVITIES,
  METHODOLOGY,
} from "./fixtures";
import type {
  Zone,
  Project,
  AlertItem,
  Report,
  HistoryPoint,
  ActivityEntry,
  PillarDef,
} from "@/types";

let alerts = structuredClone(ALERTS);
let reports = structuredClone(REPORTS);

export const mockApi = {
  getZones: async (): Promise<Zone[]> => {
    await delay();
    return structuredClone(ZONES);
  },

  getZone: async (id: string): Promise<Zone> => {
    await delay();
    const z = ZONES.find((z) => z.id === id);
    if (!z) throw new Error("Zone not found");
    return structuredClone(z);
  },

  getZoneActivity: async (id: string): Promise<ActivityEntry[]> => {
    await delay();
    return structuredClone(ACTIVITIES[id] ?? []);
  },

  getProjects: async (): Promise<Project[]> => {
    await delay();
    return structuredClone(PROJECTS);
  },

  getProject: async (id: string): Promise<Project> => {
    await delay();
    const p = PROJECTS.find((p) => p.id === id);
    if (!p) throw new Error("Project not found");
    return structuredClone(p);
  },

  getAlerts: async (): Promise<AlertItem[]> => {
    await delay();
    return structuredClone(alerts);
  },

  markAllRead: async (): Promise<{ ok: true }> => {
    await delay();
    alerts = alerts.map((a) => ({ ...a, read: true }));
    return { ok: true as const };
  },

  getReports: async (): Promise<Report[]> => {
    await delay();
    return structuredClone(reports);
  },

  createReport: async (data: { title: string; zoneId: string | null }): Promise<Report> => {
    await delay(1200, 1800);
    const r: Report = {
      id: `r${Date.now()}`,
      title: data.title,
      zoneId: data.zoneId,
      date: new Date().toISOString().slice(0, 10),
      status: "draft",
      author: "Austine Igunza",
      sizeBytes: 0,
      format: "PDF",
      type: "vitality",
      priority: "medium",
      tags: [],
      sections: [],
      executiveSummary: "",
    };
    reports = [r, ...reports];
    return r;
  },

  getHistory: async (): Promise<HistoryPoint[]> => {
    await delay();
    return structuredClone(HISTORY);
  },

  getMethodology: async (): Promise<{ pillars: PillarDef[] }> => {
    await delay();
    return { pillars: structuredClone(METHODOLOGY) };
  },

  register: async (name: string, email: string, _password: string, _passwordConfirmation: string) => {
    await delay();
    return {
      token: "mock-token",
      expires_at: new Date(Date.now() + 480 * 60000).toISOString(),
      user: { id: 1, name, email, role: "viewer" as const },
    };
  },

  signIn: async (email: string, _password: string) => {
    await delay();
    return {
      token: "mock-token",
      user: { name: "Austine Igunza", email },
    };
  },
};

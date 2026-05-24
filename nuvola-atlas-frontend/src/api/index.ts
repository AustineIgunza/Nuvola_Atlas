import type {
  Zone,
  Project,
  AlertItem,
  Report,
  HistoryPoint,
  ActivityEntry,
  PillarDef,
} from "@/types";
import {
  ZONES,
  PROJECTS,
  ALERTS,
  REPORTS,
  HISTORY,
  ACTIVITIES,
  METHODOLOGY,
} from "./fixtures";

const BASE = import.meta.env.VITE_API_BASE ?? "/api";
const USE_MOCK = !BASE.startsWith("http");

function delay(min = 250, max = 600): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise((r) => setTimeout(r, ms));
}

async function mockOr<T>(mockFn: () => T, path: string): Promise<T> {
  if (USE_MOCK) {
    await delay();
    return mockFn();
  }
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const api = {
  getZones: () => mockOr<Zone[]>(() => ZONES, "/zones"),

  getZone: (id: string) =>
    mockOr<Zone>(
      () => {
        const z = ZONES.find((z) => z.id === id);
        if (!z) throw new Error("Zone not found");
        return z;
      },
      `/zones/${id}`,
    ),

  getZoneActivity: (id: string) =>
    mockOr<ActivityEntry[]>(() => ACTIVITIES[id] ?? [], `/zones/${id}/activity`),

  getProjects: () => mockOr<Project[]>(() => PROJECTS, "/projects"),

  getProject: (id: string) =>
    mockOr<Project>(
      () => {
        const p = PROJECTS.find((p) => p.id === id);
        if (!p) throw new Error("Project not found");
        return p;
      },
      `/projects/${id}`,
    ),

  getAlerts: () => mockOr<AlertItem[]>(() => [...ALERTS], "/alerts"),

  markAllRead: async () => {
    if (USE_MOCK) {
      await delay();
      ALERTS.forEach((a) => (a.read = true));
      return { ok: true as const };
    }
    const res = await fetch(`${BASE}/alerts/mark-all-read`, { method: "POST" });
    return res.json();
  },

  getReports: () => mockOr<Report[]>(() => REPORTS, "/reports"),

  createReport: async (data: { title: string; zoneId: string | null }) => {
    if (USE_MOCK) {
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
      };
      REPORTS.unshift(r);
      return r;
    }
    const res = await fetch(`${BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<Report>;
  },

  getHistory: () => mockOr<HistoryPoint[]>(() => HISTORY, "/history"),

  getMethodology: () =>
    mockOr<{ pillars: PillarDef[] }>(
      () => ({ pillars: METHODOLOGY }),
      "/vitality/methodology",
    ),

  signIn: async (_email: string, _password: string) => {
    if (USE_MOCK) {
      await delay();
      return {
        token: "mock-token",
        user: { name: "Austine Igunza", email: _email },
      };
    }
    const res = await fetch(`${BASE}/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: _email, password: _password }),
    });
    return res.json();
  },
};

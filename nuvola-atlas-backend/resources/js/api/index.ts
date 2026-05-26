import axios from "axios";
import type { Zone } from "../types/zone";
import type { Project, AlertItem, Report, HistoryPoint, ActivityEntry, PillarDef } from "../types";
import { ZONES, PROJECTS, ALERTS, REPORTS, HISTORY, ACTIVITIES, METHODOLOGY } from "./fixtures";

const USE_MOCK = true; // flip to false once backend is serving real data

function delay(min = 200, max = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise((r) => setTimeout(r, ms));
}

async function get<T>(path: string): Promise<T> {
  const res = await axios.get<T>(`/api${path}`);
  const data = res.data as Record<string, unknown>;
  if (data && typeof data === "object" && "data" in data && "meta" in data) return data.data as T;
  return res.data;
}

async function post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const res = await axios.post<T>(`/api${path}`, body);
  return res.data;
}

async function mockOr<T>(mockFn: () => T, path: string): Promise<T> {
  if (USE_MOCK) { await delay(); return mockFn(); }
  return get<T>(path);
}

export const api = {
  getZones: () => mockOr<Zone[]>(() => ZONES, "/zones"),
  getZone: (id: string) => mockOr<Zone>(() => { const z = ZONES.find((z) => z.id === id); if (!z) throw new Error("Zone not found"); return z; }, `/zones/${id}`),
  getZoneActivity: (id: string) => mockOr<ActivityEntry[]>(() => ACTIVITIES[id] ?? [], `/zones/${id}/activity`),
  getProjects: () => mockOr<Project[]>(() => PROJECTS, "/projects"),
  getProject: (id: string) => mockOr<Project>(() => { const p = PROJECTS.find((p) => p.id === id); if (!p) throw new Error("Project not found"); return p; }, `/projects/${id}`),
  getAlerts: () => mockOr<AlertItem[]>(() => [...ALERTS], "/alerts"),
  markAllRead: async () => {
    if (USE_MOCK) { await delay(); ALERTS.forEach((a) => (a.read = true)); return { ok: true as const }; }
    return post<{ ok: true }>("/alerts/mark-all-read");
  },
  getReports: () => mockOr<Report[]>(() => REPORTS, "/reports"),
  createReport: async (data: { title: string; zoneId: string | null }) => {
    if (USE_MOCK) {
      await delay(800, 1200);
      const r: Report = { id: `r${Date.now()}`, title: data.title, zoneId: data.zoneId, date: new Date().toISOString().slice(0, 10), status: "draft", author: "Austine Igunza", sizeBytes: 0, format: "PDF" };
      REPORTS.unshift(r);
      return r;
    }
    return post<Report>("/reports", data as Record<string, unknown>);
  },
  getHistory: () => mockOr<HistoryPoint[]>(() => HISTORY, "/history"),
  getMethodology: () => mockOr<{ pillars: PillarDef[] }>(() => ({ pillars: METHODOLOGY }), "/vitality/methodology"),
  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    if (USE_MOCK) { await delay(); return { token: "mock-token", expires_at: new Date(Date.now() + 480 * 60000).toISOString(), user: { id: 1, name, email, role: "viewer" as const } }; }
    return post<{ token: string; expires_at: string; user: { id: number; name: string; email: string; role: string } }>("/auth/register", { name, email, password, password_confirmation });
  },
  signIn: async (email: string, password: string) => {
    if (USE_MOCK) { await delay(); return { token: "mock-token", user: { name: "Austine Igunza", email } }; }
    return post<{ token: string; user: { name: string; email: string } }>("/auth/sign-in", { email, password });
  },
};

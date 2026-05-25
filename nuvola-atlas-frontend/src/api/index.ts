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

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("nuvola_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem("nuvola_authed");
    localStorage.removeItem("nuvola_token");
    window.location.href = "/sign-in";
    throw new Error("Session expired. Please sign in again.");
  }
  if (res.status === 422) {
    try {
      const body = await res.json();
      const firstError = Object.values(body.errors ?? {})[0];
      throw new Error(Array.isArray(firstError) ? firstError[0] : body.message ?? "Validation failed");
    } catch (e) {
      if (e instanceof Error && e.message !== "Validation failed") throw e;
      throw new Error("Validation failed");
    }
  }
  if (!res.ok) {
    try {
      const body = await res.json();
      throw new Error(body.message ?? `Request failed (${res.status})`);
    } catch (e) {
      if (e instanceof Error && e.message !== `Request failed (${res.status})`) throw e;
      throw new Error(`Request failed (${res.status})`);
    }
  }
  return res.json();
}

async function mockOr<T>(mockFn: () => T, path: string): Promise<T> {
  if (USE_MOCK) {
    await delay();
    return mockFn();
  }
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = await handleResponse<Record<string, unknown>>(res);
  // Unwrap Laravel paginated responses
  if (json && typeof json === "object" && "data" in json && "meta" in json) {
    return json.data as T;
  }
  return json as T;
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
    const res = await fetch(`${BASE}/alerts/mark-all-read`, { method: "POST", headers: authHeaders() });
    return handleResponse<{ ok: true }>(res);
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
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<Report>(res);
  },

  getHistory: () => mockOr<HistoryPoint[]>(() => HISTORY, "/history"),

  getMethodology: () =>
    mockOr<{ pillars: PillarDef[] }>(
      () => ({ pillars: METHODOLOGY }),
      "/vitality/methodology",
    ),

  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    if (USE_MOCK) {
      await delay();
      return {
        token: "mock-token",
        expires_at: new Date(Date.now() + 480 * 60000).toISOString(),
        user: { id: 1, name, email, role: "viewer" as const },
      };
    }
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });
    return handleResponse<{ token: string; expires_at: string; user: { id: number; name: string; email: string; role: string } }>(res);
  },

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
    return handleResponse<{ token: string; user: { name: string; email: string } }>(res);
  },
};
